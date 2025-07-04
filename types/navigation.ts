// types/navigation.ts (or add to your existing file)
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

export type MainStackParamList = {
  Home: undefined;
  CrearPerfil: undefined;
  Perfil: undefined;
  OfrecerServicio: undefined;
  Configuracion: undefined;
  ServiciosPorCategoria: { categoria: string };
  PasarelaPago: { categoria: string };
  ChatIA: undefined;
  ChatIndividual: undefined;
  MisServicios: undefined;
  EditarServicio: undefined;
  VerificacionPendiente: undefined;
  NotificacionesScreen: undefined;
  DniPendiente: undefined;
  PerfilesPendientes: undefined;
  PerfilPendienteDetalle: undefined;
  Maps: undefined;
  OnlineWorkers: undefined;
};

// This type will be used by components for navigation prop
export type MainStackNavigationProp =
  NativeStackNavigationProp<MainStackParamList>;

// If you also need to type the route prop
export type MainStackRouteProp<T extends keyof MainStackParamList> = {
  navigation: MainStackNavigationProp;
  route: { params: MainStackParamList[T] };
};
