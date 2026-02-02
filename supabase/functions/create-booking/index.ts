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
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const payload: BookingPayload = await req.json();

    const { firstName, lastName, email, bookingDate, arrivalTime, departureTime, cost } = payload;

    if (!firstName || !lastName || !email || !bookingDate || !arrivalTime || !departureTime || cost <= 0) {
      return new Response(
        JSON.stringify({ error: "Invalid booking data" }),
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
        JSON.stringify({ error: "Departure time must be after arrival time" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    const response = await fetch(`${supabaseUrl}/rest/v1/bookings`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${supabaseServiceKey}`,
        apikey: supabaseServiceKey!,
      },
      body: JSON.stringify({
        first_name: firstName,
        last_name: lastName,
        email: email,
        booking_date: bookingDate,
        arrival_time: arrivalTime,
        departure_time: departureTime,
        cost: cost,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("Database error:", error);
      return new Response(
        JSON.stringify({ error: "Failed to create booking" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const booking = await response.json();

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
      JSON.stringify({ error: "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
