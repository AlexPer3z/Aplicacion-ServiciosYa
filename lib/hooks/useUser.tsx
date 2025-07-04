import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { perfilQueryOptions, sessionQueryOptions } from "../queryOptions";
import { useUserSettings } from "./useUserSettings";

export function useUser() {
  const { data: session } = useQuery(sessionQueryOptions);
  const { data: profile } = useQuery(perfilQueryOptions);
  const settings = useUserSettings();
  const user = session?.user;
  const isLoggedIn = Boolean(user);
  const isProfileComplete = profile?.perfil_completo || true;
  const isDniVerified = profile?.dni_verificado || true;

  return {
    user,
    profile,
    session,
    settings,
    isLoggedIn,
    isProfileComplete,
    isDniVerified,
  };
}

export function useSuspenseProfile() {
  const { data: profile } = useSuspenseQuery(perfilQueryOptions);
  const askDniVerification = profile.perfil_completo && !profile.dni_verificado;
  const askProfileCompletion = !profile.perfil_completo;
  const isUserRestricted = askDniVerification || askProfileCompletion;

  return {
    ...profile,
    askDniVerification,
    askProfileCompletion,
    isUserRestricted,
  };
}
