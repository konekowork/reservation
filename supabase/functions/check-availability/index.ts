import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface AvailabilityRequest {
  bookingDate: string;
  arrivalTime: string;
  departureTime: string;
  bookingType: "coworking" | "meeting_room";
}

interface AvailabilityResponse {
  available: boolean;
  message: string;
  spotsRemaining?: number;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const payload: AvailabilityRequest = await req.json();
    const {
      bookingDate,
      arrivalTime,
      departureTime,
      bookingType,
    } = payload;

    if (!bookingDate || !arrivalTime || !departureTime || !bookingType) {
      return new Response(
        JSON.stringify({
          available: false,
          message: "Paramètres manquants",
        } as AvailabilityResponse),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const [arrivalHours, arrivalMinutes] = arrivalTime.split(":").map(Number);
    const [departureHours, departureMinutes] = departureTime.split(":").map(Number);
    const arrivalInMinutes = arrivalHours * 60 + arrivalMinutes;
    const departureInMinutes = departureHours * 60 + departureMinutes;

    if (departureInMinutes <= arrivalInMinutes) {
      return new Response(
        JSON.stringify({
          available: false,
          message: "L'heure de départ doit être après l'heure d'arrivée",
        } as AvailabilityResponse),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    const { data: overlappingBookings, error: fetchError } = await supabase
      .from("bookings")
      .select("*")
      .eq("booking_date", bookingDate)
      .eq("booking_type", bookingType)
      .eq("status", "confirmed")
      .lt("arrival_time", departureTime)
      .gt("departure_time", arrivalTime);

    if (fetchError) {
      console.error("Error fetching bookings:", fetchError);
      return new Response(
        JSON.stringify({
          available: false,
          message: "Erreur lors de la vérification de disponibilité",
        } as AvailabilityResponse),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (bookingType === "meeting_room") {
      const available = !overlappingBookings || overlappingBookings.length === 0;
      return new Response(
        JSON.stringify({
          available,
          message: available
            ? "Salle disponible"
            : "Salle de réunion déjà réservée sur ce créneau",
        } as AvailabilityResponse),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (bookingType === "coworking") {
      const events: { time: number; type: "arrival" | "departure" }[] = [];

      events.push({ time: arrivalInMinutes, type: "arrival" });
      events.push({ time: departureInMinutes, type: "departure" });

      if (overlappingBookings) {
        overlappingBookings.forEach((booking: any) => {
          const [bArrHour, bArrMin] = booking.arrival_time.split(":").map(Number);
          const [bDepHour, bDepMin] = booking.departure_time.split(":").map(Number);
          events.push({ time: bArrHour * 60 + bArrMin, type: "arrival" });
          events.push({ time: bDepHour * 60 + bDepMin, type: "departure" });
        });
      }

      events.sort((a, b) => a.time - b.time);

      let currentOccupancy = 0;
      let maxOccupancy = 0;

      for (const event of events) {
        if (event.type === "arrival") {
          currentOccupancy++;
          maxOccupancy = Math.max(maxOccupancy, currentOccupancy);
        } else {
          currentOccupancy--;
        }
      }

      const maxCapacity = 20;
      const available = maxOccupancy <= maxCapacity;
      const spotsRemaining = Math.max(0, maxCapacity - maxOccupancy + 1);

      return new Response(
        JSON.stringify({
          available,
          message: available
            ? `${spotsRemaining} place${spotsRemaining > 1 ? "s" : ""} disponible${spotsRemaining > 1 ? "s" : ""}`
            : "Capacité maximale atteinte sur ce créneau",
          spotsRemaining: available ? spotsRemaining : 0,
        } as AvailabilityResponse),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({
        available: false,
        message: "Type de réservation invalide",
      } as AvailabilityResponse),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({
        available: false,
        message: "Erreur interne du serveur",
      } as AvailabilityResponse),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
