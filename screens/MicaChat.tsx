import { Ionicons } from "@expo/vector-icons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { LinearGradient } from "expo-linear-gradient";
import React, { useMemo, useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import BotonVolver from "../components/BotonVolver";
import { supabase } from "../lib/supabase";
import type { MainStackParamList, MicaChatMode } from "../types/navigation";

type Props = NativeStackScreenProps<MainStackParamList, "MicaChat">;
type Message = {
  id: string;
  author: "mica" | "user";
  text: string;
};
type SearchStage = "intake" | "quotes" | "selected" | "payment";
type SearchQuote = {
  id: string;
  name: string;
  price: string;
  rating: string;
  jobs: string;
  availability: string;
  note: string;
};
type AgentInsight = {
  issue?: string;
  service?: string;
  location?: string;
  urgency?: string;
  timeframe?: string;
  media?: string;
  experience?: string;
  coverage?: string;
  price?: string;
  companyType?: string;
  units?: string;
  contactIntent?: string;
};
type MicaApiResponse = {
  reply?: string;
  insightPatch?: Partial<AgentInsight>;
  readyForNextStep?: boolean;
  error?: string;
};

const serviceSignals: Array<{ label: string; words: string[] }> = [
  {
    label: "Plomería",
    words: [
      "plomero",
      "plomería",
      "plomeria",
      "pérdida",
      "perdida",
      "canilla",
      "agua",
      "baño",
      "bano",
      "inodoro",
      "caño",
      "cano",
    ],
  },
  {
    label: "Electricidad",
    words: [
      "electricista",
      "luz",
      "enchufe",
      "cable",
      "corto",
      "térmica",
      "termica",
    ],
  },
  {
    label: "Gas",
    words: ["gas", "gasista", "calefón", "calefon", "termotanque"],
  },
  { label: "Cerrajería", words: ["cerradura", "llave", "cerrajero", "puerta"] },
  { label: "Limpieza", words: ["limpieza", "limpiar", "mucama", "consorcio"] },
  { label: "Pintura", words: ["pintor", "pintura", "humedad", "pared"] },
  {
    label: "Refrigeración",
    words: ["aire", "heladera", "refrigeración", "refrigeracion", "split"],
  },
];

const searchFlowSteps = [
  { label: "Orden", icon: "create-outline" as const },
  { label: "Presupuestos", icon: "receipt-outline" as const },
  { label: "Profesional", icon: "person-circle-outline" as const },
  { label: "Pago", icon: "card-outline" as const },
];

const sampleQuotes: SearchQuote[] = [
  {
    id: "quote-1",
    name: "Gonzalo Alegre",
    price: "$65.100",
    rating: "4.9",
    jobs: "17 trabajos",
    availability: "Disponible esta semana",
    note: "Materiales incluidos",
  },
  {
    id: "quote-2",
    name: "Ignacio Turelli",
    price: "$67.270",
    rating: "4.8",
    jobs: "10 trabajos",
    availability: "Puede coordinar hoy",
    note: "Visita sin cargo",
  },
  {
    id: "quote-3",
    name: "José Alegre",
    price: "$75.950",
    rating: "4.7",
    jobs: "21 trabajos",
    availability: "Disponible mañana",
    note: "Garantía del trabajo",
  },
];

const modeConfig: Record<
  MicaChatMode,
  {
    title: string;
    subtitle: string;
    accent: string;
    gradient: [string, string, string];
    icon: keyof typeof Ionicons.glyphMap;
    statusTitle: string;
    intro: string;
    placeholder: string;
  }
> = {
  "buscar-servicio": {
    title: "Buscar un servicio",
    subtitle: "Te ayudamos a resolverlo con profesionales de tu zona.",
    accent: "#069eb3",
    gradient: ["#1bd4e7", "#069eb3", "#046a79"],
    icon: "search",
    statusTitle: "Datos del pedido",
    intro: "Hola, buen día. ¿En qué te puedo ayudar?",
    placeholder:
      "Ej: tengo una pérdida abajo de la bacha en Palermo y necesito solucionarlo hoy...",
  },
  "ofrecer-servicio": {
    title: "Ofrecer un servicio",
    subtitle: "Te ayudamos a preparar tu perfil profesional.",
    accent: "#f08a24",
    gradient: ["#ffb454", "#f08a24", "#c85e00"],
    icon: "briefcase",
    statusTitle: "Datos del perfil",
    intro:
      "Hola, buen día. Contame qué servicio querés ofrecer y en qué zona trabajás.",
    placeholder:
      "Ej: soy electricista, trabajo en Córdoba capital y tengo 5 años de experiencia...",
  },
  b2b: {
    title: "SolucionesYa B2B",
    subtitle:
      "Para inmobiliarias, consorcios y operaciones con muchos pedidos.",
    accent: "#344e7a",
    gradient: ["#496fa8", "#344e7a", "#1f2f4e"],
    icon: "business",
    statusTitle: "Datos de la operación",
    intro:
      "Hola, buen día. Contame si sos inmobiliaria, consorcio o empresa, y qué tipo de mantenimiento necesitás resolver.",
    placeholder:
      "Ej: administro 3 edificios y necesito centralizar arreglos de plomería y electricidad...",
  },
};

function includesAny(text: string, words: string[]) {
  return words.some((word) => text.includes(word));
}

function inferService(text: string) {
  return serviceSignals.find((signal) => includesAny(text, signal.words))
    ?.label;
}

function inferLocation(text: string) {
  const match = text.match(
    /\b(?:en|por|zona|barrio)\s+([a-z0-9\s]+?)(?:,|\.| y | para | hoy| manana| urgente|$)/i,
  );
  return match?.[1]?.trim();
}

function inferUnits(text: string) {
  const match = text.match(
    /\b(\d+)\s+(?:edificios|propiedades|unidades|departamentos|locales|casas)\b/i,
  );
  return match?.[0];
}

function inferInsight(
  mode: MicaChatMode,
  previous: AgentInsight,
  userText: string,
): AgentInsight {
  const text = userText.toLowerCase();
  const service = inferService(text);
  const location = inferLocation(text);
  const next: AgentInsight = { ...previous };

  if (userText.length > 6 && !next.issue) next.issue = userText.trim();
  if (service) next.service = service;
  if (location) next.location = location;
  if (
    includesAny(text, [
      "urgente",
      "emergencia",
      "ahora",
      "inund",
      "sin luz",
      "sin agua",
    ])
  ) {
    next.urgency = "Alta";
  } else if (includesAny(text, ["hoy", "rápido", "rapido", "esta tarde"])) {
    next.urgency = "Media";
  }
  if (
    includesAny(text, [
      "hoy",
      "esta tarde",
      "mañana",
      "manana",
      "semana",
      "fin de semana",
    ])
  ) {
    next.timeframe = includesAny(text, ["hoy", "esta tarde"])
      ? "Hoy"
      : "Flexible";
  }
  if (includesAny(text, ["foto", "imagen", "video"]))
    next.media = "Quiere sumar evidencia";

  if (mode === "ofrecer-servicio") {
    if (service) next.service = service;
    if (location) next.coverage = location;
    if (
      includesAny(text, [
        "año",
        "años",
        "ano",
        "anos",
        "experiencia",
        "trabajo hace",
      ])
    )
      next.experience = "Experiencia mencionada";
    if (includesAny(text, ["precio", "tarifa", "cobro", "presupuesto"]))
      next.price = "Necesita guía de precios";
  }

  if (mode === "b2b") {
    if (includesAny(text, ["inmobiliaria", "alquiler", "propiedades"]))
      next.companyType = "Inmobiliaria";
    if (
      includesAny(text, [
        "consorcio",
        "edificio",
        "administración",
        "administracion",
      ])
    )
      next.companyType = "Consorcio";
    if (includesAny(text, ["empresa", "local", "sucursal"]))
      next.companyType = "Empresa";
    const units = inferUnits(text);
    if (units) next.units = units;
    if (includesAny(text, ["demo", "llamar", "contactar", "whatsapp"]))
      next.contactIntent = "Quiere contacto comercial";
  }

  return next;
}

function getChecklist(mode: MicaChatMode, insight: AgentInsight) {
  if (mode === "buscar-servicio") {
    return [
      { label: "Rubro", value: insight.service },
      { label: "Problema", value: insight.issue ? "Descripto" : undefined },
      { label: "Zona", value: insight.location },
      { label: "Urgencia", value: insight.urgency },
      { label: "Horario", value: insight.timeframe },
      { label: "Fotos", value: insight.media },
    ];
  }

  if (mode === "ofrecer-servicio") {
    return [
      { label: "Rubro", value: insight.service },
      { label: "Zona", value: insight.coverage || insight.location },
      { label: "Experiencia", value: insight.experience },
      { label: "Precios", value: insight.price },
      {
        label: "Presentación",
        value: insight.issue ? "Base lista" : undefined,
      },
    ];
  }

  return [
    { label: "Tipo", value: insight.companyType },
    { label: "Escala", value: insight.units },
    { label: "Rubro frecuente", value: insight.service },
    { label: "Urgencia", value: insight.urgency },
    { label: "Contacto", value: insight.contactIntent },
  ];
}

function getProgress(mode: MicaChatMode, insight: AgentInsight) {
  const checklist = getChecklist(mode, insight);
  const completed = checklist.filter((item) => Boolean(item.value)).length;
  return Math.round((completed / checklist.length) * 100);
}

function getMissingQuestion(mode: MicaChatMode, insight: AgentInsight) {
  if (mode === "buscar-servicio") {
    if (!insight.service)
      return "¿Qué tipo de trabajo parece ser: plomería, electricidad, gas, limpieza u otro?";
    if (!insight.location) return "¿En qué ciudad o barrio hay que resolverlo?";
    if (!insight.urgency)
      return "¿Es urgente para hoy o puede coordinarse con más tiempo?";
    if (!insight.timeframe)
      return "¿Qué horarios te sirven para que te contacten o visiten?";
    return "¿Querés agregar una foto o algún detalle que el prestador deba saber antes de presupuestar?";
  }

  if (mode === "ofrecer-servicio") {
    if (!insight.service)
      return "¿Cuál es tu rubro principal y qué trabajos querés aceptar?";
    if (!insight.coverage && !insight.location)
      return "¿En qué zonas trabajás?";
    if (!insight.experience)
      return "¿Cuánta experiencia tenés o qué trabajos hiciste recientemente?";
    if (!insight.price)
      return "¿Tenés precios orientativos, visita mínima o querés que te ayudemos a definirlos?";
    return "¿Tenés fotos, referencias o documentación para fortalecer tu perfil?";
  }

  if (!insight.companyType)
    return "¿Sos inmobiliaria, consorcio, empresa o administrás otro tipo de operación?";
  if (!insight.units)
    return "¿Cuántas unidades, edificios o propiedades administran?";
  if (!insight.service)
    return "¿Qué incidencias se repiten más: plomería, electricidad, limpieza, gas o mantenimiento general?";
  if (!insight.urgency)
    return "¿Necesitan guardia urgente, mantenimiento programado o ambas cosas?";
  return "¿Quién aprueba presupuestos y por qué canal quieren recibir el seguimiento?";
}

function summarizeSignals(insight: AgentInsight) {
  const parts = [
    insight.service && `rubro ${insight.service}`,
    insight.location && `zona ${insight.location}`,
    insight.urgency && `urgencia ${insight.urgency.toLowerCase()}`,
    insight.companyType?.toLowerCase(),
    insight.units,
  ].filter(Boolean);
  return parts.length ? parts.join(", ") : "todavía estoy juntando contexto";
}

function buildReply(mode: MicaChatMode, insight: AgentInsight) {
  const signalSummary = summarizeSignals(insight);
  const question = getMissingQuestion(mode, insight);

  if (mode === "buscar-servicio") {
    return `Perfecto, te entiendo: ${signalSummary}.\n\n${question}`;
  }

  if (mode === "ofrecer-servicio") {
    return `Bien, con eso vamos bien: ${signalSummary}.\n\n${question}`;
  }

  return `Perfecto, te sigo: ${signalSummary}.\n\n${question}`;
}

function getSuggestions(mode: MicaChatMode, insight: AgentInsight) {
  if (mode === "buscar-servicio") {
    if (!insight.service)
      return [
        "Tengo una pérdida de agua",
        "No tengo luz",
        "Necesito limpieza",
        "Quiero reparar una puerta",
      ];
    if (!insight.location)
      return [
        "Estoy en Córdoba capital",
        "Zona Nueva Córdoba",
        "Estoy en CABA",
        "Barrio Centro",
      ];
    if (!insight.urgency)
      return [
        "Es urgente para hoy",
        "Puede ser esta semana",
        "Quiero comparar precios",
      ];
    return ["Tengo fotos", "Horario por la tarde", "Quiero 3 presupuestos"];
  }

  if (mode === "ofrecer-servicio") {
    if (!insight.service)
      return [
        "Soy plomero",
        "Soy electricista",
        "Hago limpieza",
        "Hago reparaciones",
      ];
    if (!insight.coverage && !insight.location)
      return ["Trabajo en Córdoba", "Zona norte", "Atiendo a domicilio"];
    if (!insight.experience)
      return [
        "Tengo 5 años de experiencia",
        "Puedo mostrar trabajos",
        "Recién empiezo",
      ];
    return [
      "Necesito ayuda con precios",
      "Quiero cargar fotos",
      "Quiero publicar mi perfil",
    ];
  }

  if (!insight.companyType)
    return ["Soy inmobiliaria", "Administro un consorcio", "Tengo una empresa"];
  if (!insight.units)
    return [
      "Administro 3 edificios",
      "Tengo 40 unidades",
      "Tengo varios locales",
    ];
  if (!insight.service)
    return [
      "Plomería y electricidad",
      "Limpieza recurrente",
      "Mantenimiento general",
    ];
  return ["Quiero una demo", "Necesito reportes", "Necesito guardia urgente"];
}

function createInitialMessages(mode: MicaChatMode): Message[] {
  return [
    { id: `intro-${mode}`, author: "mica", text: modeConfig[mode].intro },
  ];
}

async function askMicaApi({
  mode,
  message,
  insight,
  history,
}: {
  mode: MicaChatMode;
  message: string;
  insight: AgentInsight;
  history: Message[];
}) {
  const { data, error } = await supabase.functions.invoke<MicaApiResponse>(
    "mica-chat",
    {
      body: {
        mode,
        message,
        insight,
        history: history.map(({ author, text }) => ({ author, text })),
      },
    },
  );

  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  if (!data?.reply) throw new Error("MICA no devolvió una respuesta.");

  return data;
}

export default function MicaChat({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const mode = route.params.mode;
  const config = modeConfig[mode];
  const scrollRef = useRef<ScrollView>(null);
  const [input, setInput] = useState("");
  const [insight, setInsight] = useState<AgentInsight>({});
  const [messages, setMessages] = useState<Message[]>(() =>
    createInitialMessages(mode),
  );
  const [searchStage, setSearchStage] = useState<SearchStage>("intake");
  const [selectedQuoteId, setSelectedQuoteId] = useState<string | null>(null);
  const [isThinking, setIsThinking] = useState(false);

  const checklist = getChecklist(mode, insight);
  const progress = getProgress(mode, insight);
  const suggestions = getSuggestions(mode, insight);
  const selectedQuote = sampleQuotes.find(
    (quote) => quote.id === selectedQuoteId,
  );
  const searchStepIndex =
    searchStage === "payment"
      ? 3
      : searchStage === "selected"
        ? 2
        : searchStage === "quotes"
          ? 1
          : 0;

  const addMicaMessage = (text: string) => {
    const timestamp = Date.now();
    setMessages((current) => [
      ...current,
      { id: `mica-action-${timestamp}`, author: "mica", text },
    ]);
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 80);
  };

  const handleSearchPrimaryAction = () => {
    if (progress < 70) {
      addMicaMessage(
        `Dale, antes de pedir presupuestos necesito un dato más.\n\n${getMissingQuestion(mode, insight)}`,
      );
      return;
    }

    if (searchStage === "intake") {
      setSearchStage("quotes");
      addMicaMessage(
        "Listo, con esto ya se puede pedir presupuesto. Te dejo opciones para comparar precio, disponibilidad y detalle del trabajo.",
      );
      return;
    }

    if (searchStage === "quotes") {
      addMicaMessage(
        "Elegí el profesional que te cierre mejor. Después coordinamos la visita y el pago queda para cuando estés conforme.",
      );
      return;
    }

    if (searchStage === "selected") {
      addMicaMessage(
        "Perfecto. Cuando termine el trabajo, podés pagar por transferencia, tarjeta o QR del profesional.",
      );
    }
  };

  const handleQuoteSelect = (quote: SearchQuote) => {
    setSelectedQuoteId(quote.id);
    setSearchStage("selected");
    addMicaMessage(
      `Perfecto, dejamos a ${quote.name} como opción elegida. Ahora el siguiente paso es coordinar la visita y pagar recién cuando el trabajo esté conforme.`,
    );
  };

  const handlePaymentOption = (method: string) => {
    setSearchStage("payment");
    addMicaMessage(
      `Perfecto. Dejamos ${method} como forma de pago preferida para cuando el servicio esté terminado.`,
    );
  };

  const primaryAction = useMemo(() => {
    if (mode === "buscar-servicio") {
      return {
        label:
          searchStage === "intake"
            ? progress >= 70
              ? "Pedir presupuestos"
              : "Completar pedido"
            : searchStage === "quotes"
              ? "Elegir profesional"
              : searchStage === "selected"
                ? "Coordinar y pagar luego"
                : "Orden en seguimiento",
        icon:
          searchStage === "intake"
            ? ("receipt" as const)
            : searchStage === "quotes"
              ? ("person-circle" as const)
              : searchStage === "selected"
                ? ("card" as const)
                : ("checkmark-circle" as const),
        onPress: handleSearchPrimaryAction,
      };
    }

    if (mode === "ofrecer-servicio") {
      return {
        label: progress >= 70 ? "Publicar mi servicio" : "Completar formulario",
        icon: "add-circle" as const,
        onPress: () => navigation.navigate("OfrecerServicio"),
      };
    }

    if (mode === "b2b") {
      return {
        label: progress >= 60 ? "Pedir demo B2B" : "Hablar por WhatsApp",
        icon: "logo-whatsapp" as const,
        onPress: () => {
          const message = `Hola, quiero información de SolucionesYa B2B. Estos son los datos iniciales: ${summarizeSignals(insight)}`;
          Linking.openURL(
            `https://wa.me/5493834035427?text=${encodeURIComponent(message)}`,
          );
        },
      };
    }

    return {
      label: "Continuar",
      icon: "arrow-forward" as const,
      onPress: () => navigation.goBack(),
    };
  }, [insight, mode, navigation, progress, searchStage]);

  const sendMessage = async (text: string) => {
    const cleanText = text.trim();
    if (!cleanText || isThinking) return;

    const timestamp = Date.now();
    const thinkingId = `mica-thinking-${timestamp}`;
    const nextInsight = inferInsight(mode, insight, cleanText);
    setInsight(nextInsight);
    setMessages((current) => [
      ...current,
      { id: `user-${timestamp}`, author: "user", text: cleanText },
      {
        id: thinkingId,
        author: "mica",
        text: "Estoy mirando los datos para responderte bien...",
      },
    ]);
    setInput("");
    setIsThinking(true);
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 80);

    try {
      const apiAnswer = await askMicaApi({
        mode,
        message: cleanText,
        insight: nextInsight,
        history: messages,
      });
      const apiInsight = { ...nextInsight, ...(apiAnswer.insightPatch ?? {}) };

      setInsight(apiInsight);
      setMessages((current) =>
        current.map((message) =>
          message.id === thinkingId
            ? {
                ...message,
                id: `mica-${timestamp}`,
                text: apiAnswer.reply ?? buildReply(mode, apiInsight),
              }
            : message,
        ),
      );
    } catch (error) {
      setMessages((current) =>
        current.map((message) =>
          message.id === thinkingId
            ? {
                ...message,
                id: `mica-${timestamp}`,
                text: buildReply(mode, nextInsight),
              }
            : message,
        ),
      );
      console.warn("[MICA] usando fallback local:", error);
    } finally {
      setIsThinking(false);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 80);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={0}
    >
      <LinearGradient
        colors={config.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <BotonVolver />
        <View style={styles.headerCard}>
          <View style={styles.avatar}>
            <Ionicons name={config.icon} size={26} color={config.accent} />
          </View>
          <View style={styles.headerText}>
            <View style={styles.statusBadge}>
              <View style={styles.statusDot} />
              <Text style={styles.statusText}>Disponible ahora</Text>
            </View>
            <Text style={styles.title}>{config.title}</Text>
            <Text style={styles.subtitle}>{config.subtitle}</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        ref={scrollRef}
        style={styles.messages}
        contentContainerStyle={styles.messagesContent}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "on-drag"}
        onContentSizeChange={() =>
          scrollRef.current?.scrollToEnd({ animated: true })
        }
      >
        <View style={styles.agentPanel}>
          <View style={styles.panelHeader}>
            <View>
              <Text style={styles.panelEyebrow}>Resumen</Text>
              <Text style={styles.panelTitle}>{config.statusTitle}</Text>
            </View>
            <Text style={[styles.progressText, { color: config.accent }]}>
              {progress}%
            </Text>
          </View>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: `${progress}%`, backgroundColor: config.accent },
              ]}
            />
          </View>
          <View style={styles.checkGrid}>
            {checklist.map((item) => (
              <View
                key={item.label}
                style={[styles.checkChip, item.value && styles.checkChipDone]}
              >
                <Ionicons
                  name={item.value ? "checkmark-circle" : "ellipse-outline"}
                  size={14}
                  color={item.value ? config.accent : "#8aa1a8"}
                />
                <Text
                  style={[styles.checkText, item.value && styles.checkTextDone]}
                  numberOfLines={1}
                >
                  {item.label}: {item.value || "falta"}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {mode === "buscar-servicio" && (
          <View style={styles.searchFlowCard}>
            <View style={styles.searchFlowHeader}>
              <Text style={styles.searchFlowTitle}>Proceso del servicio</Text>
              <Text style={[styles.searchFlowStatus, { color: config.accent }]}>
                {searchFlowSteps[searchStepIndex].label}
              </Text>
            </View>
            <View style={styles.searchFlowSteps}>
              {searchFlowSteps.map((step, index) => {
                const isDone = index < searchStepIndex;
                const isActive = index === searchStepIndex;

                return (
                  <View key={step.label} style={styles.searchFlowStep}>
                    <View
                      style={[
                        styles.searchFlowIcon,
                        isDone || isActive
                          ? {
                              backgroundColor: config.accent,
                              borderColor: config.accent,
                            }
                          : null,
                      ]}
                    >
                      <Ionicons
                        name={isDone ? "checkmark" : step.icon}
                        size={15}
                        color={isDone || isActive ? "#ffffff" : "#91a3a5"}
                      />
                    </View>
                    <Text
                      style={[
                        styles.searchFlowLabel,
                        isDone || isActive ? { color: "#20323a" } : null,
                      ]}
                      numberOfLines={1}
                    >
                      {step.label}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {mode === "buscar-servicio" && searchStage !== "intake" && (
          <View style={styles.quotesPanel}>
            <View style={styles.quotesHeader}>
              <View>
                <Text style={styles.panelEyebrow}>Presupuestos</Text>
                <Text style={styles.panelTitle}>Opciones verificadas</Text>
              </View>
              <View style={styles.verifiedBadge}>
                <Ionicons name="shield-checkmark" size={14} color="#0f8f58" />
                <Text style={styles.verifiedText}>Verificados</Text>
              </View>
            </View>

            {sampleQuotes.map((quote) => {
              const isSelected = quote.id === selectedQuoteId;

              return (
                <TouchableOpacity
                  key={quote.id}
                  activeOpacity={0.9}
                  style={[
                    styles.quoteCard,
                    isSelected
                      ? {
                          borderColor: config.accent,
                          backgroundColor: "#f0fffb",
                        }
                      : null,
                  ]}
                  onPress={() => handleQuoteSelect(quote)}
                >
                  <View style={styles.quoteAvatar}>
                    <Text style={styles.quoteAvatarText}>
                      {quote.name.charAt(0)}
                    </Text>
                  </View>
                  <View style={styles.quoteBody}>
                    <View style={styles.quoteTop}>
                      <Text style={styles.quoteName} numberOfLines={1}>
                        {quote.name}
                      </Text>
                      <Text
                        style={[styles.quotePrice, { color: config.accent }]}
                      >
                        {quote.price}
                      </Text>
                    </View>
                    <View style={styles.quoteMeta}>
                      <Ionicons name="star" size={12} color="#f5a524" />
                      <Text style={styles.quoteMetaText}>{quote.rating}</Text>
                      <Text style={styles.quoteDot}>•</Text>
                      <Text style={styles.quoteMetaText}>{quote.jobs}</Text>
                    </View>
                    <Text style={styles.quoteNote} numberOfLines={1}>
                      {quote.availability}
                    </Text>
                    <Text style={styles.quoteIncluded} numberOfLines={1}>
                      {quote.note}
                    </Text>
                  </View>
                  <Ionicons
                    name={isSelected ? "checkmark-circle" : "chevron-forward"}
                    size={22}
                    color={isSelected ? config.accent : "#9fb0b2"}
                  />
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {mode === "buscar-servicio" && selectedQuote && (
          <View style={styles.paymentPanel}>
            <View style={styles.paymentHeader}>
              <Ionicons
                name="calendar-outline"
                size={20}
                color={config.accent}
              />
              <View style={styles.paymentCopy}>
                <Text style={styles.paymentTitle}>
                  Coordiná con {selectedQuote.name}
                </Text>
                <Text style={styles.paymentText}>
                  Cuando termine el trabajo, elegís cómo pagar.
                </Text>
              </View>
            </View>
            <View style={styles.paymentOptions}>
              {["Transferencia", "Tarjeta", "QR del profesional"].map(
                (method) => (
                  <TouchableOpacity
                    key={method}
                    style={styles.paymentOption}
                    onPress={() => handlePaymentOption(method)}
                  >
                    <Text style={styles.paymentOptionText}>{method}</Text>
                  </TouchableOpacity>
                ),
              )}
            </View>
          </View>
        )}

        {messages.map((message) => (
          <View
            key={message.id}
            style={[
              styles.messageRow,
              message.author === "user"
                ? styles.userMessageRow
                : styles.micaMessageRow,
            ]}
          >
            {message.author === "mica" && (
              <View
                style={[styles.messageAvatar, { borderColor: config.accent }]}
              >
                <Ionicons name="sparkles" size={15} color={config.accent} />
              </View>
            )}
            <View
              style={[
                styles.bubble,
                message.author === "user"
                  ? [styles.userBubble, { backgroundColor: config.accent }]
                  : styles.micaBubble,
              ]}
            >
              <Text
                style={[
                  styles.bubbleText,
                  message.author === "user" ? styles.userText : styles.micaText,
                ]}
              >
                {message.text}
              </Text>
            </View>
          </View>
        ))}
      </ScrollView>

      <View style={styles.quickReplies}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.quickRepliesContent}
        >
          {suggestions.map((reply) => (
            <TouchableOpacity
              key={reply}
              style={[styles.quickReply, { borderColor: config.accent }]}
              onPress={() => sendMessage(reply)}
            >
              <Text style={[styles.quickReplyText, { color: config.accent }]}>
                {reply}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View
        style={[
          styles.composerWrap,
          { paddingBottom: Math.max(insets.bottom + 12, 16) },
        ]}
      >
        <TouchableOpacity activeOpacity={0.9} onPress={primaryAction.onPress}>
          <LinearGradient
            colors={config.gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.primaryAction}
          >
            <Ionicons name={primaryAction.icon} size={18} color="#ffffff" />
            <Text style={styles.primaryActionText}>{primaryAction.label}</Text>
          </LinearGradient>
        </TouchableOpacity>

        <View style={styles.composer}>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder={config.placeholder}
            placeholderTextColor="#7c8b90"
            multiline
            editable={!isThinking}
          />
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => sendMessage(input)}
            disabled={isThinking}
          >
            <LinearGradient
              colors={config.gradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[
                styles.sendButton,
                isThinking && styles.sendButtonDisabled,
              ]}
            >
              <Ionicons
                name={isThinking ? "hourglass-outline" : "send"}
                size={18}
                color="#ffffff"
              />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#f3f7f5",
  },
  header: {
    paddingTop: 72,
    paddingBottom: 18,
    paddingHorizontal: 16,
  },
  headerCard: {
    minHeight: 112,
    borderRadius: 8,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.13)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.28)",
  },
  avatar: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 13,
    shadowColor: "#102030",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.16,
    shadowRadius: 8,
    elevation: 4,
  },
  headerText: {
    flex: 1,
  },
  statusBadge: {
    alignSelf: "flex-start",
    minHeight: 24,
    borderRadius: 8,
    paddingHorizontal: 8,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.2)",
    marginBottom: 8,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#9effd5",
    marginRight: 6,
  },
  statusText: {
    color: "#ffffff",
    fontSize: 11,
    fontWeight: "900",
  },
  title: {
    color: "#ffffff",
    fontSize: 22,
    fontWeight: "900",
  },
  subtitle: {
    color: "#eefcff",
    fontSize: 14,
    lineHeight: 20,
    marginTop: 4,
  },
  messages: {
    flex: 1,
  },
  messagesContent: {
    padding: 12,
    paddingBottom: 36,
  },
  agentPanel: {
    backgroundColor: "#ffffff",
    borderRadius: 8,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#dfe9e7",
    shadowColor: "#16343a",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  panelHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 9,
  },
  panelEyebrow: {
    color: "#7c9190",
    fontSize: 11,
    fontWeight: "900",
  },
  panelTitle: {
    color: "#20323a",
    fontSize: 15,
    fontWeight: "900",
    marginTop: 2,
  },
  progressText: {
    fontSize: 20,
    fontWeight: "900",
  },
  progressBar: {
    height: 8,
    borderRadius: 8,
    backgroundColor: "#e7eeec",
    overflow: "hidden",
    marginBottom: 11,
  },
  progressFill: {
    height: "100%",
    borderRadius: 8,
  },
  checkGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  checkChip: {
    maxWidth: "100%",
    minHeight: 30,
    borderRadius: 8,
    paddingHorizontal: 8,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f7fbfa",
    borderWidth: 1,
    borderColor: "#e0ebe8",
  },
  checkChipDone: {
    backgroundColor: "#eefbf6",
  },
  checkText: {
    color: "#647b82",
    fontSize: 12,
    fontWeight: "800",
    marginLeft: 5,
  },
  checkTextDone: {
    color: "#20323a",
  },
  searchFlowCard: {
    backgroundColor: "#ffffff",
    borderRadius: 8,
    padding: 13,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#dfe9e7",
    shadowColor: "#16343a",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  searchFlowHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  searchFlowTitle: {
    color: "#20323a",
    fontSize: 15,
    fontWeight: "900",
  },
  searchFlowStatus: {
    fontSize: 12,
    fontWeight: "900",
  },
  searchFlowSteps: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  searchFlowStep: {
    width: "24%",
    alignItems: "center",
  },
  searchFlowIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#dce7e4",
    backgroundColor: "#f6faf9",
    marginBottom: 5,
  },
  searchFlowLabel: {
    color: "#7b8f91",
    fontSize: 10,
    fontWeight: "900",
    textAlign: "center",
  },
  quotesPanel: {
    backgroundColor: "#ffffff",
    borderRadius: 8,
    padding: 13,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#dfe9e7",
    shadowColor: "#16343a",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  quotesHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  verifiedBadge: {
    minHeight: 28,
    borderRadius: 8,
    paddingHorizontal: 8,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#eefbf4",
  },
  verifiedText: {
    color: "#0f8f58",
    fontSize: 11,
    fontWeight: "900",
    marginLeft: 4,
  },
  quoteCard: {
    minHeight: 82,
    borderRadius: 8,
    padding: 10,
    marginTop: 9,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8fbfa",
    borderWidth: 1,
    borderColor: "#e2ece9",
  },
  quoteAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#e8f5f2",
    marginRight: 10,
  },
  quoteAvatarText: {
    color: "#20323a",
    fontSize: 16,
    fontWeight: "900",
  },
  quoteBody: {
    flex: 1,
    minWidth: 0,
  },
  quoteTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  quoteName: {
    flex: 1,
    color: "#20323a",
    fontSize: 14,
    fontWeight: "900",
  },
  quotePrice: {
    fontSize: 15,
    fontWeight: "900",
  },
  quoteMeta: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 3,
  },
  quoteMetaText: {
    color: "#607579",
    fontSize: 11,
    fontWeight: "800",
    marginLeft: 3,
  },
  quoteDot: {
    color: "#91a4a6",
    fontSize: 11,
    marginHorizontal: 5,
  },
  quoteNote: {
    color: "#34464b",
    fontSize: 12,
    fontWeight: "800",
    marginTop: 4,
  },
  quoteIncluded: {
    color: "#0f8f58",
    fontSize: 11,
    fontWeight: "900",
    marginTop: 2,
  },
  paymentPanel: {
    backgroundColor: "#ffffff",
    borderRadius: 8,
    padding: 13,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#dfe9e7",
    shadowColor: "#16343a",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  paymentHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  paymentCopy: {
    flex: 1,
    marginLeft: 9,
  },
  paymentTitle: {
    color: "#20323a",
    fontSize: 14,
    fontWeight: "900",
  },
  paymentText: {
    color: "#64787c",
    fontSize: 12,
    fontWeight: "700",
    marginTop: 2,
  },
  paymentOptions: {
    gap: 8,
  },
  paymentOption: {
    minHeight: 40,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f7fbfa",
    borderWidth: 1,
    borderColor: "#dfe9e7",
  },
  paymentOptionText: {
    color: "#34464b",
    fontSize: 13,
    fontWeight: "900",
  },
  messageRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginBottom: 10,
  },
  micaMessageRow: {
    alignSelf: "flex-start",
    paddingRight: 32,
  },
  userMessageRow: {
    alignSelf: "flex-end",
    paddingLeft: 42,
  },
  messageAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ffffff",
    borderWidth: 1,
    marginRight: 7,
  },
  bubble: {
    maxWidth: "88%",
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  micaBubble: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e2ece9",
    shadowColor: "#16343a",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.07,
    shadowRadius: 9,
    elevation: 2,
  },
  userBubble: {
    shadowColor: "#102030",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.16,
    shadowRadius: 9,
    elevation: 3,
  },
  bubbleText: {
    fontSize: 15,
    lineHeight: 21,
  },
  micaText: {
    color: "#24343a",
  },
  userText: {
    color: "#ffffff",
    fontWeight: "700",
  },
  quickReplies: {
    paddingVertical: 10,
    paddingLeft: 12,
    backgroundColor: "#f3f7f5",
  },
  quickRepliesContent: {
    paddingRight: 12,
  },
  quickReply: {
    minHeight: 40,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 13,
    marginRight: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ffffff",
    shadowColor: "#16343a",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  quickReplyText: {
    fontSize: 13,
    fontWeight: "800",
  },
  composerWrap: {
    padding: 12,
    paddingBottom: 16,
    backgroundColor: "#ffffff",
    borderTopWidth: 1,
    borderTopColor: "#dfe9e7",
    shadowColor: "#102030",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 8,
  },
  primaryAction: {
    minHeight: 44,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
    gap: 8,
    shadowColor: "#102030",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.14,
    shadowRadius: 9,
    elevation: 3,
  },
  primaryActionText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "900",
  },
  composer: {
    minHeight: 52,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#dce8e5",
    backgroundColor: "#f7fbfa",
    flexDirection: "row",
    alignItems: "flex-end",
    paddingLeft: 12,
    paddingRight: 6,
    paddingVertical: 6,
  },
  input: {
    flex: 1,
    maxHeight: 104,
    color: "#213238",
    fontSize: 15,
    paddingVertical: 7,
    paddingRight: 10,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  sendButtonDisabled: {
    opacity: 0.65,
  },
});
