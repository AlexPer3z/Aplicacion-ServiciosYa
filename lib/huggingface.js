// lib/huggingface.js
import axios from 'axios';

export const consultarIA = async (mensaje) => {
  try {
    const response = await axios.post(
      'https://api-inference.huggingface.co/models/microsoft/DialoGPT-medium',
      {
        inputs: {
          text: mensaje,
        },
      },
      {
        headers: {
          Authorization: `Bearer TU_API_KEY_OPCIONAL`, // Puedes usar sin key también, más lento
        },
      }
    );
    return response.data.generated_text || 'Lo siento, no tengo respuesta.';
  } catch (error) {
    console.error('Error con HuggingFace:', error);
    return 'Error al conectar con la IA.';
  }
};
