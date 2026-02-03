import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface BookingPayload {
  firstName: string;
  lastName: string;
  email: string;
  bookingDate: string;
  arrivalTime: string;
  departureTime: string;
  cost: number;
  bookingType: 'coworking' | 'meeting_room';
  duration?: number;
  priceDetail?: string;
}

interface BookingRecord {
  id: string;
  booking_date: string;
  arrival_time: string;
  departure_time: string;
  booking_type: string;
  status: string;
}

const convertTimeToMinutes = (time: string): number => {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
};

const checkCoworkingCapacity = (
  existingBookings: BookingRecord[],
  newArrivalMins: number,
  newDepartureMins: number
): boolean => {
  const COWORKING_CAPACITY = 20;

  for (const booking of existingBookings) {
    const bookingArrival = convertTimeToMinutes(booking.arrival_time);
    const bookingDeparture = convertTimeToMinutes(booking.departure_time);

    const hasOverlap =
      newArrivalMins < bookingDeparture && newDepartureMins > bookingArrival;

    if (hasOverlap) {
      let simultaneousCount = 1;

      for (const otherBooking of existingBookings) {
        if (otherBooking.id === booking.id) continue;

        const otherArrival = convertTimeToMinutes(otherBooking.arrival_time);
        const otherDeparture = convertTimeToMinutes(otherBooking.departure_time);

        const otherOverlaps =
          newArrivalMins < otherDeparture && newDepartureMins > otherArrival &&
          bookingArrival < otherDeparture && bookingDeparture > otherArrival;

        if (otherOverlaps) {
          simultaneousCount++;
        }
      }

      if (simultaneousCount >= COWORKING_CAPACITY) {
        return false;
      }
    }
  }

  return true;
};

const checkMeetingRoomConflict = (
  existingBookings: BookingRecord[],
  newArrivalMins: number,
  newDepartureMins: number
): boolean => {
  for (const booking of existingBookings) {
    const bookingArrival = convertTimeToMinutes(booking.arrival_time);
    const bookingDeparture = convertTimeToMinutes(booking.departure_time);

    const hasOverlap =
      newArrivalMins < bookingDeparture && newDepartureMins > bookingArrival;

    if (hasOverlap) {
      return false;
    }
  }

  return true;
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const payload: BookingPayload = await req.json();

    const {
      firstName,
      lastName,
      email,
      bookingDate,
      arrivalTime,
      departureTime,
      cost,
      bookingType,
    } = payload;

    if (
      !firstName ||
      !lastName ||
      !email ||
      !bookingDate ||
      !arrivalTime ||
      !departureTime ||
      cost <= 0 ||
      !bookingType
    ) {
      return new Response(
        JSON.stringify({ error: "Données de réservation invalides" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const newArrivalMins = convertTimeToMinutes(arrivalTime);
    const newDepartureMins = convertTimeToMinutes(departureTime);

    if (newDepartureMins <= newArrivalMins) {
      return new Response(
        JSON.stringify({
          error: "L'heure de départ doit être après l'heure d'arrivée",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Configuration manquante");
    }

    const queryResponse = await fetch(
      `${supabaseUrl}/rest/v1/bookings?booking_date=eq.${bookingDate}&booking_type=eq.${bookingType}&status=eq.confirmed`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${supabaseServiceKey}`,
          apikey: supabaseServiceKey,
        },
      }
    );

    if (!queryResponse.ok) {
      throw new Error("Erreur lors de la vérification des réservations");
    }

    const existingBookings: BookingRecord[] = await queryResponse.json();

    let capacityOk = true;
    let capacityError = "";

    if (bookingType === "coworking") {
      capacityOk = checkCoworkingCapacity(
        existingBookings,
        newArrivalMins,
        newDepartureMins
      );
      if (!capacityOk) {
        capacityError =
          "Capacité coworking atteinte pour ce créneau. Veuillez choisir un autre horaire.";
      }
    } else if (bookingType === "meeting_room") {
      capacityOk = checkMeetingRoomConflict(
        existingBookings,
        newArrivalMins,
        newDepartureMins
      );
      if (!capacityOk) {
        capacityError =
          "La salle de réunion est déjà réservée pour ce créneau. Veuillez choisir un autre horaire.";
      }
    }

    if (!capacityOk) {
      return new Response(JSON.stringify({ error: capacityError }), {
        status: 409,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const insertResponse = await fetch(`${supabaseUrl}/rest/v1/bookings`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${supabaseServiceKey}`,
        apikey: supabaseServiceKey,
      },
      body: JSON.stringify({
        first_name: firstName,
        last_name: lastName,
        email: email,
        booking_date: bookingDate,
        arrival_time: arrivalTime,
        departure_time: departureTime,
        cost: cost,
        booking_type: bookingType,
        status: "confirmed",
      }),
    });

    if (!insertResponse.ok) {
      const error = await insertResponse.text();
      console.error("Database error:", error);
      return new Response(
        JSON.stringify({ error: "Erreur lors de la création de la réservation" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const booking = await insertResponse.json();

    return new Response(JSON.stringify({ success: true, booking }), {
      status: 201,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({
        error: "Erreur serveur. Veuillez réessayer plus tard.",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
