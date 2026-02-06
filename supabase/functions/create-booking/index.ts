import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

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
  duration: number;
  cost: number;
  priceDetail: string;
  bookingType: "coworking" | "meeting_room";
}

Deno.serve(async (req: Request) => {
  // Gérer les requêtes OPTIONS (CORS)
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
      duration,
      cost,
      priceDetail,
      bookingType,
    } = payload;

    // Validation des données
    if (!firstName || !lastName || !email || !bookingDate || !arrivalTime || !departureTime || !bookingType) {
      return new Response(
        JSON.stringify({ error: "Données de réservation incomplètes" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Validation horaires
    const [arrivalHours, arrivalMinutes] = arrivalTime.split(":").map(Number);
    const [departureHours, departureMinutes] = departureTime.split(":").map(Number);
    const arrivalInMinutes = arrivalHours * 60 + arrivalMinutes;
    const departureInMinutes = departureHours * 60 + departureMinutes;

    if (departureInMinutes <= arrivalInMinutes) {
      return new Response(
        JSON.stringify({ error: "L'heure de départ doit être après l'heure d'arrivée" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Initialiser Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // ✅ VÉRIFICATION DES HORAIRES D'OUVERTURE
    const dayOfWeek = new Date(bookingDate).getDay();
    const isWithinOpeningHours = (() => {
      if (dayOfWeek === 0) return false; // Fermé le dimanche
      
      if (dayOfWeek >= 1 && dayOfWeek <= 5) {
        // Lun-Ven : 9h-19h
        return arrivalInMinutes >= 9 * 60 && departureInMinutes <= 19 * 60;
      }
      
      if (dayOfWeek === 6) {
        // Sam : 10h-18h
        return arrivalInMinutes >= 10 * 60 && departureInMinutes <= 18 * 60;
      }
      
      return false;
    })();

    // ✅ SI DANS LES HORAIRES D'OUVERTURE : VÉRIFICATION DE CAPACITÉ
    if (isWithinOpeningHours) {
      const { data: overlappingBookings, error: fetchError } = await supabase
        .from("bookings")
        .select("*")
        .eq("booking_date", bookingDate)
        .eq("booking_type", bookingType)
        .eq("status", "confirmed")
        .or(`and(arrival_time.lt.${departureTime},departure_time.gt.${arrivalTime})`);

      if (fetchError) {
        console.error("Error fetching bookings:", fetchError);
        return new Response(
          JSON.stringify({ error: "Erreur lors de la vérification de disponibilité" }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      // Vérification SALLE DE RÉUNION
      if (bookingType === "meeting_room" && overlappingBookings && overlappingBookings.length > 0) {
        // ✅ AFFICHAGE DES HORAIRES DES CRÉNEAUX NON DISPONIBLES
        const conflictingSlots = overlappingBookings.map((booking: any) => 
          `${booking.arrival_time.substring(0, 5)} - ${booking.departure_time.substring(0, 5)}`
        ).join(", ");
        
        return new Response(
          JSON.stringify({ error: `Salle déjà réservée sur : ${conflictingSlots}` }),
          {
            status: 409,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      // Vérification COWORKING (max 20 simultanés)
      if (bookingType === "coworking") {
        // Créer la timeline des événements
        const events: { time: number; type: "arrival" | "departure" }[] = [];

        // Ajouter la nouvelle réservation
        events.push({ time: arrivalInMinutes, type: "arrival" });
        events.push({ time: departureInMinutes, type: "departure" });

        // Ajouter les réservations existantes
        if (overlappingBookings) {
          overlappingBookings.forEach((booking: any) => {
            const [bArrHour, bArrMin] = booking.arrival_time.split(":").map(Number);
            const [bDepHour, bDepMin] = booking.departure_time.split(":").map(Number);
            events.push({ time: bArrHour * 60 + bArrMin, type: "arrival" });
            events.push({ time: bDepHour * 60 + bDepMin, type: "departure" });
          });
        }

        // Trier par temps
        events.sort((a, b) => a.time - b.time);

        // Calculer l'occupation max
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

        if (maxOccupancy > 20) {
          return new Response(
            JSON.stringify({ error: "Capacité maximale atteinte sur ce créneau. Veuillez choisir un autre horaire." }),
            {
              status: 409,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }
      }
    }

    // CRÉER LA RÉSERVATION
    const { data: booking, error: insertError } = await supabase
      .from("bookings")
      .insert({
        first_name: firstName,
        last_name: lastName,
        email: email,
        booking_date: bookingDate,
        arrival_time: arrivalTime,
        departure_time: departureTime,
        duration: duration,
        cost: cost,
        price_detail: priceDetail,
        booking_type: bookingType,
        status: "confirmed",
      })
      .select()
      .single();

    if (insertError) {
      console.error("Database insert error:", insertError);
      return new Response(
        JSON.stringify({ error: "Erreur lors de la création de la réservation" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // SUCCÈS
    return new Response(
      JSON.stringify({ success: true, booking }),
      {
        status: 201,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: "Erreur interne du serveur" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
