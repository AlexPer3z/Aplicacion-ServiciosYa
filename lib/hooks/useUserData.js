import { useEffect, useState } from 'react';
import { supabase } from '../supabase';

export function useUserData() {
  const [userData, setUserData] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [errorUser, setErrorUser] = useState(null);

  useEffect(() => {
    const fetchUserData = async () => {
      setLoadingUser(true);
      setErrorUser(null);

      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError) {
        setErrorUser(userError);
        setLoadingUser(false);
        return;
      }

      const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        setErrorUser(error);
      } else {
        setUserData(data);
      }

      setLoadingUser(false);
    };

    fetchUserData();
  }, []);

  return {
    userData,
    perfilCompleto: userData?.perfil_completo || false,
    rol: userData?.rol || null,
    loadingUser,
    errorUser,
  };
}
