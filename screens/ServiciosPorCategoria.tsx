import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  Linking,
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  Share,
} from "react-native";
import * as Location from "expo-location";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { MainStackParamList } from "../types/navigation";
import { supabase } from "../lib/supabase";
import BotonVolver from "../components/BotonVolver";
import BottomNavBar from "../components/home/BottomNavBar";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { getUserID } from "../store/authStore";
import {
  createUrgentWorkAlert,
  sendUrgentWorkPush,
} from "../lib/utils/urgentWorkNotification";

type Props = NativeStackScreenProps<MainStackParamList, "ServiciosPorCategoria">;

const categoriasSensibles = [
  "Cuidado de niños", "Cuidado de adultos mayores", "Enfermero", "Psicólogo",
  "Kinesiólogo", "Nutricionista", "Masajista", "Terapista ocupacional",
  "Profesor de yoga", "Animador infantil", "Maquillador profesional",
];

interface Worker {
  id: string;
  nombre: string;
  edad?: number;
  foto_perfil?: string;
  provincia?: string;
  ciudad?: string;
  barrio?: string;
  categoria?: string[];
  matricula?: any;
  antecedentes?: any;
  verificado?: boolean;
  suscriptor?: boolean;
  antiguedad?: number;
  celular?: string;
}

function extractCardDocUrl(val: any): string | null {
  if (!val) return null;
  if (typeof val === 'string') {
    try { return extractCardDocUrl(JSON.parse(val)); } catch (_) {}
    const m = val.match(/https?:\/\/[^\s'"<>]+/i);
    if (m) return m[0].replace(/[)\]"'.,;]+$/, '');
    return /^https?:\/\//i.test(val) ? val : null;
  }
  if (Array.isArray(val)) {
    for (const item of val) { const f = extractCardDocUrl(item); if (f) return f; }
    return null;
  }
  if (typeof val === 'object') {
    for (const key of ['uri', 'url', 'path', 'link']) { if (val[key]) { const f = extractCardDocUrl(val[key]); if (f) return f; } }
    for (const key of Object.keys(val)) { const f = extractCardDocUrl(val[key]); if (f) return f; }
  }
  return null;
}

function WorkerCard({ worker, onPress }: { worker: Worker; onPress: () => void }) {
  const ubicacion = [worker.ciudad, worker.provincia].filter(Boolean).join(", ");
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
      <View style={styles.cardHeader}>
        <Image
          source={worker.foto_perfil ? { uri: worker.foto_perfil } : require("../assets/logo.png")}
          style={styles.avatar}
        />
        <View style={styles.cardInfo}>
          <Text style={styles.workerName}>{worker.nombre || "Sin nombre"}</Text>
          {!!ubicacion && (
            <View style={styles.metaRow}>
              <MaterialIcons name="location-on" size={13} color="#069eb3" />
              <Text style={styles.metaText}>{ubicacion}</Text>
            </View>
          )}
          {!!worker.edad && (
            <View style={styles.metaRow}>
              <MaterialIcons name="person" size={13} color="#069eb3" />
              <Text style={styles.metaText}>{worker.edad} años</Text>
            </View>
          )}
          {worker.antiguedad != null && (
            <View style={styles.metaRow}>
              <MaterialIcons name="work" size={13} color="#069eb3" />
              <Text style={styles.metaText}>{worker.antiguedad} años de experiencia</Text>
            </View>
          )}
        </View>
      </View>
      {Array.isArray(worker.categoria) && worker.categoria.length > 0 && (
        <View style={styles.tagsRow}>
          {worker.categoria.map((cat, i) => (
            <View key={i} style={styles.tag}><Text style={styles.tagText}>{cat}</Text></View>
          ))}
        </View>
      )}
      <View style={styles.badgesRow}>
        {worker.verificado && <View style={[styles.badge, styles.badgeVerified]}><MaterialIcons name="verified" size={13} color="#fff" /><Text style={styles.badgeText}>Verificado</Text></View>}
        {!!extractCardDocUrl(worker.matricula) && <View style={[styles.badge, styles.badgeDoc]}><MaterialIcons name="badge" size={13} color="#fff" /><Text style={styles.badgeText}>Matrícula</Text></View>}
        {!!extractCardDocUrl(worker.antecedentes) && <View style={[styles.badge, styles.badgeDoc]}><MaterialIcons name="description" size={13} color="#fff" /><Text style={styles.badgeText}>Antecedentes</Text></View>}
        {worker.suscriptor && <View style={[styles.badge, styles.badgeSub]}><MaterialIcons name="star" size={13} color="#fff" /><Text style={styles.badgeText}>Premium</Text></View>}
      </View>
    </TouchableOpacity>
  );
}

function WorkerDetailModal({ worker, visible, onClose, workerServices, loadingServices }: { worker: Worker | null; visible: boolean; onClose: () => void; workerServices: WorkerService[]; loadingServices: boolean }) {
  if (!worker) return null;
  const ubicacion = [worker.barrio, worker.ciudad, worker.provincia].filter(Boolean).join(", ");

  function extractDocUrl(val: any): string | null {
    if (!val) return null;
    if (typeof val === 'string') {
      // Try parsing as JSON first
      try {
        const parsed = JSON.parse(val);
        return extractDocUrl(parsed);
      } catch (_) {}
      // Extract raw URL from string
      const m = val.match(/https?:\/\/[^\s'"<>]+/i);
      if (m) return m[0].replace(/[)\]"'.,;]+$/, '');
      return /^https?:\/\//i.test(val) ? val : null;
    }
    if (Array.isArray(val)) {
      for (const item of val) {
        const found = extractDocUrl(item);
        if (found) return found;
      }
      return null;
    }
    if (typeof val === 'object') {
      // common keys: uri, url, path
      for (const key of ['uri', 'url', 'path', 'link']) {
        if (val[key]) { const found = extractDocUrl(val[key]); if (found) return found; }
      }
      for (const key of Object.keys(val)) {
        const found = extractDocUrl(val[key]);
        if (found) return found;
      }
    }
    return null;
  }

  const abrirDoc = (val: any) => {
    const url = extractDocUrl(val);
    if (!url) { Alert.alert("Sin documento", "No se encontró una URL válida en este documento."); return; }
    Linking.openURL(url).catch(() => Alert.alert("Error", "No se pudo abrir el documento."));
  };

  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();

  const compartirPerfil = async () => {
    if (!worker?.id) {
      Alert.alert("Error", "No se pudo identificar al profesional.");
      return;
    }
    const url = `https://tooriserviciosya.com/PerfileProfesionales.php?ids=${encodeURIComponent(worker.id)}`;
    const nombre = worker.nombre?.trim();
    const message = nombre
      ? `Mirá el perfil de ${nombre} en Toori Servicios Ya: ${url}`
      : `Mirá este profesional en Toori Servicios Ya: ${url}`;
    try {
      await Share.share({ message, url, title: nombre || "Profesional Toori" });
    } catch {
      // usuario canceló o falló el share — no hace falta avisar
    }
  };

  const contactarChat = async () => {
    const myId = getUserID();
    if (!myId) { Alert.alert("Error", "Debes iniciar sesión para enviar mensajes."); return; }
    if (!worker?.id) { Alert.alert("Error", "No se pudo identificar al profesional."); return; }
    if (worker.id.toLowerCase() === myId.toLowerCase()) {
      Alert.alert("Error", "No podés chatear con vos mismo.");
      return;
    }
    try {
      // La tabla `chats` tiene CHECK (participant_a < participant_b) y UNIQUE (participant_a, participant_b).
      // Ordenamos los UUIDs antes de buscar/insertar.
      const [participantA, participantB] = [myId, worker.id].slice().sort();

      const { data: existing, error: searchError } = await supabase
        .from("chats")
        .select("id")
        .eq("participant_a", participantA)
        .eq("participant_b", participantB)
        .maybeSingle();

      if (searchError) console.error("[contactarChat] búsqueda:", searchError);

      let chatId: string;

      if (existing) {
        chatId = existing.id;
      } else {
        const { data: created, error: createError } = await supabase
          .from("chats")
          .insert({ participant_a: participantA, participant_b: participantB })
          .select("id")
          .single();

        if (createError || !created) {
          console.error("[contactarChat] insert:", createError);
          Alert.alert(
            "Error",
            createError?.message
              ? `No se pudo iniciar el chat: ${createError.message}`
              : "No se pudo iniciar el chat.",
          );
          return;
        }
        chatId = created.id;
      }

      try {
        const { data: receptorUsuario } = await supabase
          .from("usuarios")
          .select("expo_token")
          .eq("id", worker.id)
          .single();

        if (receptorUsuario?.expo_token) {
          const urgentBody = `Un cliente quiere contactarte por ${worker.categoria?.[0] || "un servicio"}. Respondelo cuanto antes.`;

          await sendUrgentWorkPush({
            to: receptorUsuario.expo_token,
            title: "Tenes trabajo urgente",
            body: urgentBody,
            data: {
              screen: "ChatIndividual",
              params: {
                chatId,
                nombre: "Cliente",
                servicioId: "",
                usuarioId1: participantA,
                usuarioId2: participantB,
              },
            },
          });

          await createUrgentWorkAlert({
            supabase,
            source: "direct_contact",
            workerId: worker.id,
            clienteId: myId,
            chatId,
            category: worker.categoria?.[0] || null,
            title: "Tenes trabajo urgente",
            body: urgentBody,
            metadata: {
              worker_nombre: worker.nombre,
            },
          });
        }
      } catch (pushError) {
        console.log("[contactarChat] aviso urgente no enviado:", pushError);
      }

      onClose();
      navigation.navigate("ChatIndividual", {
        chatId,
        nombre: worker.nombre || "Profesional",
        servicio: {},
        servicioId: "",
        usuarioId1: participantA,
        usuarioId2: participantB,
      });
    } catch (e: any) {
      console.error("[contactarChat] excepción:", e);
      Alert.alert(
        "Error",
        e?.message ? `No se pudo abrir el chat: ${e.message}` : "No se pudo abrir el chat.",
      );
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalBox}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <LinearGradient colors={["#069eb3", "#047a8f"]} style={styles.modalHero}>
              <Image source={worker.foto_perfil ? { uri: worker.foto_perfil } : require("../assets/logo.png")} style={styles.modalAvatar} />
              <Text style={styles.modalName}>{worker.nombre || "Sin nombre"}</Text>
              {!!worker.edad && <Text style={styles.modalAge}>{worker.edad} años</Text>}
            </LinearGradient>
            <View style={styles.modalContent}>
              {!!ubicacion && <View style={styles.modalRow}><MaterialIcons name="location-on" size={18} color="#069eb3" /><Text style={styles.modalRowText}>{ubicacion}</Text></View>}
              {worker.antiguedad != null && <View style={styles.modalRow}><MaterialIcons name="work" size={18} color="#069eb3" /><Text style={styles.modalRowText}>{worker.antiguedad} años de experiencia</Text></View>}

              {Array.isArray(worker.categoria) && worker.categoria.length > 0 && (
                <View style={{ marginBottom: 12 }}>
                  <Text style={styles.modalLabel}>Especialidades</Text>
                  <View style={styles.tagsRow}>
                    {worker.categoria.map((cat, i) => <View key={i} style={styles.tag}><Text style={styles.tagText}>{cat}</Text></View>)}
                  </View>
                </View>
              )}

              <Text style={styles.modalLabel}>Verificaciones</Text>
              <View style={styles.verRow}>
                <View style={[styles.verItem, worker.verificado ? styles.verOk : styles.verNo]}>
                  <MaterialIcons name="verified" size={15} color={worker.verificado ? "#fff" : "#aaa"} />
                  <Text style={[styles.verText, !worker.verificado && { color: "#aaa" }]}>{worker.verificado ? "Verificado" : "No verificado"}</Text>
                </View>
                <View style={[styles.verItem, extractDocUrl(worker.matricula) ? styles.verOk : styles.verNo]}>
                  <MaterialIcons name="badge" size={15} color={extractDocUrl(worker.matricula) ? "#fff" : "#aaa"} />
                  <Text style={[styles.verText, !extractDocUrl(worker.matricula) && { color: "#aaa" }]}>{extractDocUrl(worker.matricula) ? "Tiene matrícula" : "Sin matrícula"}</Text>
                </View>
                <View style={[styles.verItem, extractDocUrl(worker.antecedentes) ? styles.verOk : styles.verNo]}>
                  <MaterialIcons name="description" size={15} color={extractDocUrl(worker.antecedentes) ? "#fff" : "#aaa"} />
                  <Text style={[styles.verText, !extractDocUrl(worker.antecedentes) && { color: "#aaa" }]}>{extractDocUrl(worker.antecedentes) ? "Antecedentes OK" : "Sin antecedentes"}</Text>
                </View>
              </View>

              {loadingServices ? (
                <ActivityIndicator size="small" color="#069eb3" style={{ marginVertical: 8 }} />
              ) : workerServices.length > 0 ? (
                <View style={{ marginBottom: 4 }}>
                  <Text style={styles.modalLabel}>Info del servicio</Text>
                  {workerServices.map((svc) => (
                    <View key={svc.id} style={styles.svcCard}>
                      <Text style={styles.svcTitle}>{svc.titulo}</Text>
                      {!!svc.descripcion && <Text style={styles.svcDesc}>{svc.descripcion}</Text>}
                      <View style={styles.svcMeta}>
                        {svc.precio != null && (
                          <View style={styles.svcMetaItem}>
                            <MaterialIcons name="attach-money" size={14} color="#047a8f" />
                            <Text style={styles.svcMetaText}>${svc.precio.toLocaleString("es-AR")}</Text>
                          </View>
                        )}
                        {!!svc.horario && (
                          <View style={styles.svcMetaItem}>
                            <MaterialIcons name="schedule" size={14} color="#047a8f" />
                            <Text style={styles.svcMetaText}>{svc.horario}</Text>
                          </View>
                        )}
                      </View>
                    </View>
                  ))}
                </View>
              ) : null}

              {(extractDocUrl(worker.matricula) || extractDocUrl(worker.antecedentes)) && (
                <>
                  <Text style={styles.modalLabel}>Documentos</Text>
                  {extractDocUrl(worker.matricula) && (
                    <TouchableOpacity style={styles.docBtn} onPress={() => abrirDoc(worker.matricula)}>
                      <MaterialIcons name="badge" size={18} color="#069eb3" />
                      <Text style={styles.docBtnText}>Ver Matrícula</Text>
                      <MaterialIcons name="open-in-new" size={16} color="#069eb3" />
                    </TouchableOpacity>
                  )}
                  {extractDocUrl(worker.antecedentes) && (
                    <TouchableOpacity style={styles.docBtn} onPress={() => abrirDoc(worker.antecedentes)}>
                      <MaterialIcons name="description" size={18} color="#069eb3" />
                      <Text style={styles.docBtnText}>Ver Antecedentes</Text>
                      <MaterialIcons name="open-in-new" size={16} color="#069eb3" />
                    </TouchableOpacity>
                  )}
                </>
              )}

              <TouchableOpacity style={styles.shareBtn} onPress={compartirPerfil}>
                <MaterialIcons name="share" size={20} color="#069eb3" />
                <Text style={styles.shareBtnText}>Compartir perfil</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.contactBtn} onPress={contactarChat}>
                <MaterialIcons name="chat" size={20} color="#fff" />
                <Text style={styles.contactBtnText}>Enviar mensaje</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeBtnText}>Cerrar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

type UserLocation = { ciudad?: string; provincia?: string; localidad?: string } | null;

interface WorkerService {
  id: number;
  titulo: string;
  descripcion?: string | null;
  precio?: number | null;
  horario?: string | null;
}

export default function ServiciosPorCategoria({ route }: Props) {
  const { categoria } = route.params;
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Worker | null>(null);
  const [workerServices, setWorkerServices] = useState<WorkerService[]>([]);
  const [loadingServices, setLoadingServices] = useState(false);
  const [userLocation, setUserLocation] = useState<UserLocation>(undefined as any);
  const [locationError, setLocationError] = useState(false);

  useEffect(() => {
    if (!selected) { setWorkerServices([]); return; }
    setLoadingServices(true);
    supabase
      .from("servicios")
      .select("id, titulo, descripcion, precio, horario")
      .eq("usuario_id", selected.id)
      .then(({ data }) => {
        setWorkerServices((data as WorkerService[]) || []);
        setLoadingServices(false);
      });
  }, [selected]);

  useEffect(() => {
    if (categoriasSensibles.includes(categoria)) {
      Alert.alert("⚠️ Importante", "Recuerda siempre solicitar un documento habilitante o antecedentes penales antes de contratar este servicio.");
    }
  }, [categoria]);

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") { setLocationError(true); return; }
        const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        const [geo] = await Location.reverseGeocodeAsync({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
        if (geo) {
          setUserLocation({
            ciudad: geo.city ?? undefined,
            provincia: geo.region ?? undefined,
            localidad: geo.subregion ?? undefined,
          });
        } else {
          setLocationError(true);
        }
      } catch {
        setLocationError(true);
      }
    })();
  }, []);

  const cargarWorkers = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("usuarios")
        .select("id, nombre, edad, foto_perfil, provincia, ciudad, barrio, categoria, matricula, antecedentes, verificado, suscriptor, antiguedad, celular")
        .eq("rol", "worker")
        .eq("perfilPublico", true)
        .order("creado_en", { ascending: false })
        .limit(200);

      if (error) throw error;

      const catLower = categoria.trim().toLowerCase();
      const filtrados = (data || []).filter((u: any) => {
        let cat = u.categoria;
        if (typeof cat === "string") { try { cat = JSON.parse(cat); } catch { } }
        const cats: string[] = Array.isArray(cat)
          ? cat.map((c: any) => String(c).trim().toLowerCase()).filter(Boolean)
          : cat ? [String(cat).trim().toLowerCase()] : [];
        if (cats.length === 0) return false;
        return cats.some(c => c.includes(catLower) || catLower.includes(c));
      });

      filtrados.sort((a: any, b: any) => {
        const score = (u: any) => (u.verificado ? 4 : 0) + (u.antecedentes ? 3 : 0) + (u.matricula ? 2 : 0) + (u.suscriptor ? 1 : 0);
        return score(b) - score(a);
      });

      setWorkers(filtrados.map((u: any) => {
        let cat = u.categoria;
        if (typeof cat === "string") { try { cat = JSON.parse(cat); } catch { } }
        return { ...u, categoria: Array.isArray(cat) ? cat.filter(Boolean) : cat ? [cat] : [] };
      }));
    } catch {
      Alert.alert("Error", "No se pudieron cargar los profesionales.");
    } finally {
      setLoading(false);
    }
  }, [categoria]);

  useEffect(() => { cargarWorkers(); }, [cargarWorkers]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <BotonVolver />
      <LinearGradient colors={["#069eb3", "#047a8f"]} style={styles.headerGrad}>
        <Text style={styles.headerTitle}>{categoria}</Text>
        <Text style={styles.headerSub}>
          {loading ? "Cargando..." : `${workers.length} profesional${workers.length !== 1 ? "es" : ""} disponible${workers.length !== 1 ? "s" : ""}`}
        </Text>
      </LinearGradient>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#069eb3" />
          <Text style={styles.loadingText}>Buscando profesionales...</Text>
        </View>
      ) : (() => {
        const CAPITALES: Record<string, string[]> = {
          "buenos aires": ["la plata"],
          "catamarca": ["san fernando del valle de catamarca", "catamarca"],
          "chaco": ["resistencia"],
          "chubut": ["rawson"],
          "cordoba": ["cordoba"],
          "corrientes": ["corrientes"],
          "entre rios": ["parana"],
          "formosa": ["formosa"],
          "jujuy": ["san salvador de jujuy", "jujuy"],
          "la pampa": ["santa rosa"],
          "la rioja": ["la rioja"],
          "mendoza": ["mendoza"],
          "misiones": ["posadas"],
          "neuquen": ["neuquen"],
          "rio negro": ["viedma"],
          "salta": ["salta"],
          "san juan": ["san juan"],
          "san luis": ["san luis"],
          "santa cruz": ["rio gallegos"],
          "santa fe": ["santa fe"],
          "santiago del estero": ["santiago del estero"],
          "tierra del fuego": ["ushuaia"],
          "tucuman": ["san miguel de tucuman", "tucuman"],
          "ciudad autonoma de buenos aires": ["buenos aires", "caba"],
          "caba": ["buenos aires", "caba"],
        };

        const normalize = (s?: string | null) =>
          (s || "").toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

        const expandKeys = (keys: string[]): string[] => {
          const result = new Set(keys.map(normalize));
          const hasCapital = result.has("capital");
          if (hasCapital) {
            result.delete("capital");
            keys.forEach(k => {
              const kn = normalize(k);
              const aliases = CAPITALES[kn];
              if (aliases) aliases.forEach(a => result.add(normalize(a)));
            });
            result.forEach(k => {
              const aliases = CAPITALES[k];
              if (aliases) aliases.forEach(a => result.add(normalize(a)));
            });
          }
          return Array.from(result);
        };

        const rawLocKeys = userLocation
          ? [userLocation.ciudad, userLocation.provincia, userLocation.localidad].filter(Boolean) as string[]
          : [];
        const locKeys = expandKeys(rawLocKeys);

        const isLocal = (w: Worker) => {
          if (locKeys.length === 0) return false;
          const wLoc = [w.ciudad, w.provincia, w.barrio].map(normalize).filter(Boolean);
          return locKeys.some(k => wLoc.some(wl => wl.includes(k) || k.includes(wl)));
        };

        const localWorkers = workers.filter(isLocal);
        const otherWorkers = workers.filter(w => !isLocal(w));
        const locationUndefined = userLocation === undefined;

        return (
          <FlatList
            data={localWorkers.length > 0 || locationUndefined || locationError ? [...localWorkers, ...otherWorkers] : workers}
            keyExtractor={(item) => item.id}
            renderItem={({ item, index }) => {
              const firstOther = localWorkers.length;
              const showLocalHeader = !locationUndefined && !locationError && localWorkers.length > 0 && index === 0;
              const showDivider = !locationUndefined && firstOther > 0 && index === firstOther;
              const showLocationBanner = !locationUndefined && index === 0 && (locationError || locKeys.length === 0);
              return (
                <>
                  {showLocationBanner && (
                    <View style={styles.locationBanner}>
                      <MaterialIcons name="location-off" size={16} color="#888" />
                      <Text style={styles.locationBannerText}>No pudimos obtener tu ubicación, acá están los trabajadores</Text>
                    </View>
                  )}
                  {showLocalHeader && (
                    <View style={styles.localHeader}>
                      <MaterialIcons name="location-on" size={16} color="#047a8f" />
                      <Text style={styles.localHeaderText}>Profesionales en tu área</Text>
                    </View>
                  )}
                  {showDivider && (
                    <View style={styles.dividerSection}>
                      <View style={styles.dividerLine} />
                      <Text style={styles.dividerText}>Demás profesionales fuera de tu área</Text>
                      <View style={styles.dividerLine} />
                    </View>
                  )}
                  <WorkerCard worker={item} onPress={() => setSelected(item)} />
                </>
              );
            }}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <MaterialIcons name="search-off" size={60} color="#a8dfe8" />
                <Text style={styles.emptyTitle}>Sin profesionales</Text>
                <Text style={styles.emptyText}>No encontramos profesionales de {categoria} disponibles en este momento.</Text>
              </View>
            }
          />
        );
      })()}

      <WorkerDetailModal worker={selected} visible={!!selected} onClose={() => setSelected(null)} workerServices={workerServices} loadingServices={loadingServices} />
      <BottomNavBar />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#f0f2f5" },
  headerGrad: { paddingHorizontal: 20, paddingVertical: 16, paddingTop: 40 },
  headerTitle: { fontSize: 22, fontWeight: "800", color: "#fff" },
  headerSub: { fontSize: 13, color: "rgba(255,255,255,0.8)", marginTop: 2 },
  loadingContainer: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  loadingText: { color: "#069eb3", fontSize: 15 },
  listContent: { padding: 16, paddingBottom: 100 },
  emptyContainer: { alignItems: "center", paddingTop: 60, gap: 12, paddingHorizontal: 30 },
  locationBanner: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "#fff3cd", borderRadius: 10, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: "#ffe082" },
  locationBannerText: { flex: 1, color: "#795548", fontSize: 13, fontWeight: "500" },
  dividerSection: { flexDirection: "row", alignItems: "center", marginVertical: 16, gap: 8 },
  dividerLine: { flex: 1, height: 1, backgroundColor: "#a8dfe8" },
  dividerText: { color: "#069eb3", fontSize: 12, fontWeight: "700", textAlign: "center" },
  localHeader: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 10 },
  localHeaderText: { fontSize: 15, fontWeight: "800", color: "#047a8f" },
  emptyTitle: { fontSize: 18, fontWeight: "700", color: "#047a8f" },
  emptyText: { fontSize: 14, color: "#666", textAlign: "center", lineHeight: 20 },
  card: { backgroundColor: "#fff", borderRadius: 18, padding: 16, marginBottom: 14, shadowColor: "#069eb3", shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 4 },
  cardHeader: { flexDirection: "row", gap: 14, marginBottom: 12 },
  avatar: { width: 64, height: 64, borderRadius: 32, backgroundColor: "#e8f7fa", borderWidth: 2, borderColor: "#a8dfe8" },
  cardInfo: { flex: 1, gap: 3 },
  workerName: { fontSize: 16, fontWeight: "700", color: "#222" },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  metaText: { fontSize: 12, color: "#555" },
  tagsRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 10 },
  tag: { backgroundColor: "#e8f7fa", borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: "#a8dfe8" },
  tagText: { fontSize: 12, color: "#047a8f", fontWeight: "600" },
  badgesRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  badge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  badgeVerified: { backgroundColor: "#047a8f" },
  badgeDoc: { backgroundColor: "#069eb3" },
  badgeSub: { backgroundColor: "#e6a817" },
  badgeText: { color: "#fff", fontSize: 11, fontWeight: "700" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalBox: { backgroundColor: "#fff", borderTopLeftRadius: 28, borderTopRightRadius: 28, maxHeight: "92%", overflow: "hidden" },
  modalHero: { alignItems: "center", paddingVertical: 28, gap: 8 },
  modalAvatar: { width: 90, height: 90, borderRadius: 45, borderWidth: 3, borderColor: "rgba(255,255,255,0.6)" },
  modalName: { fontSize: 22, fontWeight: "800", color: "#fff" },
  modalAge: { fontSize: 14, color: "rgba(255,255,255,0.8)" },
  modalContent: { padding: 20, gap: 4 },
  modalRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10 },
  modalRowText: { fontSize: 15, color: "#333" },
  modalLabel: { fontSize: 12, fontWeight: "700", color: "#047a8f", marginBottom: 8, marginTop: 10, textTransform: "uppercase", letterSpacing: 0.8 },
  verRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 16 },
  verItem: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20 },
  verOk: { backgroundColor: "#069eb3" },
  verNo: { backgroundColor: "#f0f2f5", borderWidth: 1, borderColor: "#ddd" },
  verText: { fontSize: 12, fontWeight: "600", color: "#fff" },
  docBtn: { flexDirection: "row", alignItems: "center", gap: 10, padding: 14, backgroundColor: "#f0f8fa", borderRadius: 12, marginBottom: 8, borderWidth: 1, borderColor: "#a8dfe8" },
  docBtnText: { flex: 1, fontSize: 14, fontWeight: "600", color: "#047a8f" },
  contactBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, backgroundColor: "#069eb3", paddingVertical: 15, borderRadius: 30, marginTop: 10, shadowColor: "#069eb3", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  contactBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  shareBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, backgroundColor: "#fff", paddingVertical: 13, borderRadius: 30, marginTop: 16, borderWidth: 2, borderColor: "#069eb3" },
  shareBtnText: { color: "#069eb3", fontSize: 16, fontWeight: "700" },
  closeBtn: { alignItems: "center", paddingVertical: 16, borderTopWidth: 1, borderTopColor: "#f0f2f5" },
  closeBtnText: { color: "#888", fontSize: 15, fontWeight: "600" },
  svcCard: { backgroundColor: "#f0f8fa", borderRadius: 12, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: "#a8dfe8" },
  svcTitle: { fontSize: 15, fontWeight: "700", color: "#222", marginBottom: 4 },
  svcDesc: { fontSize: 13, color: "#555", lineHeight: 19, marginBottom: 8 },
  svcMeta: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  svcMetaItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  svcMetaText: { fontSize: 13, color: "#047a8f", fontWeight: "600" },
});
