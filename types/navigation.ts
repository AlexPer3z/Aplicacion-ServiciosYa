// types/navigation.ts (or add to your existing file)
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { UserProfile } from "../components/workers/WorkerProfile";
import type { ServicioRow } from "./db.overrides.types";

export type MainStackParamList = {
  InicioRouter: undefined;
  SeleccionRol: undefined;
  RegistroCliente: undefined;
  RegistroTrabajador: undefined;
  Home: undefined;
  CrearPerfil: undefined;
  Perfil: undefined;
  OfrecerServicio: undefined;
  Configuracion: undefined;
  ServiciosPorCategoria: { categoria: string };
  pagoInicial: undefined;
  PasarelaPago: { categoria: string };
  PasarelaPagoWorker: undefined;
  ChatIA: undefined;
  ChatIndividual: {
    chatId: string;
    nombre: string;
    servicio: Partial<ServicioRow>
    servicioId: string;
    usuarioId1: string;
    usuarioId2: string;
  };
  MisServicios: undefined;
  EditarServicio: undefined;
  VerificacionPendiente: undefined;
  NotificacionesScreen: undefined;
  DniPendiente: undefined;
  PerfilesPendientes: undefined;
  PerfilPendienteDetalle: undefined;
  Maps: undefined;
  OnlineWorkers: undefined;
  WorkerProfile: UserProfile;
};

export type AuthStackParamList = {
    LoginSelect: undefined;
    Login: undefined;
    Register: { referralCode?: string };
    VerificacionPendiente: undefined;
};

// This type will be used by components for navigation prop
export type MainStackNavigationProp =
  NativeStackNavigationProp<MainStackParamList>;

// If you also need to type the route prop
export type MainStackRouteProp<T extends keyof MainStackParamList> = {
  navigation: MainStackNavigationProp;
  route: { params: MainStackParamList[T] };
};