declare const Deno: {
  env: { get(name: string): string | undefined };
  serve(handler: (req: Request) => Response | Promise<Response>): void;
};

type MicaMode = "buscar-servicio" | "ofrecer-servicio" | "b2b";

type ChatMessage = {
  author: "mica" | "user";
  text: string;
};

type MicaRequest = {
  mode: MicaMode;
  message: string;
  insight?: Record<string, string | undefined>;
  history?: ChatMessage[];
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const modeInstructions: Record<MicaMode, string> = {
  "buscar-servicio":
    "Ayudas a clientes a describir un problema del hogar o empresa y conseguir presupuestos. Tenes que sonar humano, directo y calido, como un buen operador experto. No digas que sos bot ni repitas tu nombre. Junta rubro, problema, zona, urgencia, disponibilidad y fotos si sirven. No inventes profesionales ni precios reales.",
  "ofrecer-servicio":
    "Ayudas a prestadores a inscribirse en SolucionesYa. Sonas como una persona del equipo: clara, practica y motivadora. Junta rubro, zona, experiencia, celular, documentacion, fotos, precios orientativos y disponibilidad. No prometas aprobacion automatica.",
  b2b:
    "Ayudas a inmobiliarias, consorcios y empresas a usar SolucionesYa B2B. Sonas ejecutivo pero cercano. Junta tipo de organizacion, cantidad de unidades, rubros frecuentes, urgencias, responsables, forma de aprobacion y canal de seguimiento.",
};

function safeJsonParse(text: string) {
  try {
    return JSON.parse(text);
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return null;
    try {
      return JSON.parse(match[0]);
    } catch {
      return null;
    }
  }
}

function extractText(response: any) {
  if (typeof response?.output_text === "string") return response.output_text;

  const parts: string[] = [];
  for (const item of response?.output ?? []) {
    for (const content of item?.content ?? []) {
      if (typeof content?.text === "string") parts.push(content.text);
    }
  }

  return parts.join("\n").trim();
}

function buildInput(body: MicaRequest) {
  const recentHistory = (body.history ?? []).slice(-8).map((message) => ({
    role: message.author === "user" ? "user" : "assistant",
    content: message.text,
  }));

  return [
    ...recentHistory,
    {
      role: "user",
      content: [
        `Modo: ${body.mode}`,
        `Mensaje actual: ${body.message}`,
        `Datos ya detectados: ${JSON.stringify(body.insight ?? {})}`,
        "Responde SOLO JSON valido con esta forma:",
        `{"reply":"texto natural para el usuario","insightPatch":{"service":"...","location":"...","urgency":"...","timeframe":"...","issue":"...","coverage":"...","experience":"...","price":"...","companyType":"...","units":"...","contactIntent":"..."},"readyForNextStep":false}`,
      ].join("\n"),
    },
  ];
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const apiKey = Deno.env.get("OPENAI_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "OPENAI_API_KEY is not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = (await req.json()) as MicaRequest;
    if (!body?.mode || !body?.message?.trim()) {
      return new Response(JSON.stringify({ error: "Missing mode or message" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const model = Deno.env.get("OPENAI_MODEL") ?? "gpt-4o-mini";
    const openaiResponse = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        instructions: [
          modeInstructions[body.mode],
          "Escribi en español rioplatense, sin sonar robotico.",
          "Hace una sola pregunta concreta por turno cuando falten datos.",
          "Si ya hay datos suficientes, explica el siguiente paso sin inventar datos externos.",
          "No pidas datos sensibles innecesarios. No des asesoramiento legal, medico o financiero especializado.",
        ].join("\n"),
        input: buildInput(body),
        max_output_tokens: 650,
      }),
    });

    const responseJson = await openaiResponse.json();
    if (!openaiResponse.ok) {
      return new Response(
        JSON.stringify({
          error: responseJson?.error?.message ?? "OpenAI request failed",
        }),
        {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const text = extractText(responseJson);
    const parsed = safeJsonParse(text);

    if (!parsed?.reply) {
      return new Response(JSON.stringify({ reply: text || "Dale, contame un poco mas para ayudarte mejor." }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({
        reply: parsed.reply,
        insightPatch: parsed.insightPatch ?? {},
        readyForNextStep: Boolean(parsed.readyForNextStep),
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unexpected error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
