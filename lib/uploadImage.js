import { supabase } from './supabase';

export async function uploadImage(fileUri, userId, folder = 'imagenes') {
  try {
    // Obtener el nombre del archivo
    const fileName = `${Date.now()}-${userId}.jpg`;

    // Obtener el blob de la URI (React Native usa FileSystem)
    const response = await fetch(fileUri);
    const blob = await response.blob();

    // Subir a Supabase Storage
    const { data, error } = await supabase.storage
      .from(folder)
      .upload(`${userId}/${fileName}`, blob, {
        contentType: 'image/jpeg',
        upsert: true,
      });

    if (error) {
      console.error('Error subiendo la imagen:', error);
      return null;
    }

    // Obtener URL pública o firmada
    const { data: urlData } = supabase.storage
      .from(folder)
      .getPublicUrl(`${userId}/${fileName}`);

    return urlData.publicUrl;
  } catch (err) {
    console.error('Error general al subir imagen:', err);
    return null;
  }
}
