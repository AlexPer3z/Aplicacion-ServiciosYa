// supabase/functions/create-preference.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

serve(async (req) => {
  try {
    const { categoria } = await req.json();

    const body = {
      items: [
        {
          title: `Acceso a profesionales de ${categoria}`,
          quantity: 1,
          currency_id: "ARS",
          unit_price: 1500,
        },
      ],
      back_urls: {
        success: "https://tusolucionya.com/pago-exitoso",
        failure: "https://tusolucionya.com/pago-fallido",
        pending: "https://tusolucionya.com/pago-pendiente",
      },
      auto_return: "approved",
    };

    const response = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization:
          "Bearer APP_USR-2045697449497912-050514-3c3d6616ce00432d7bf9e6eafb885479-1486532771",
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!data.init_point) {
      return new Response(JSON.stringify({ error: "Error creando preferencia" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ init_point: data.init_point }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: "Error en el servidor" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
