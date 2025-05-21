import { supabase } from './supabase';

export const obtenerUsuarioActual = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id;
};
