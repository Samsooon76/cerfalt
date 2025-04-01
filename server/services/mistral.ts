import axios from 'axios';
import { log } from '../vite';

interface MistralOCROptions {
  image: Buffer | string; // Buffer or base64 encoded string
  apiKey: string;
}

interface MistralOCRResult {
  success: boolean;
  data?: {
    firstName?: string;
    lastName?: string;
    birthDate?: string;
    address?: string;
    idNumber?: string;
    nationality?: string;
    gender?: string;
  };
  error?: string;
}

/**
 * Extract information from ID card or passport using Mistral AI Vision
 */
export async function extractIdCardInfo({ 
  image, 
  apiKey 
}: MistralOCROptions): Promise<MistralOCRResult> {
  try {
    // Encode image to base64 if it's a buffer
    const base64Image = Buffer.isBuffer(image) 
      ? image.toString('base64')
      : image;

    // Create the request to Mistral AI Vision
    const response = await axios.post(
      'https://api.mistral.ai/v1/chat/completions',
      {
        model: 'mistral-small-latest', // Utilisation du modèle avec capacités vision
        messages: [
          {
            role: 'system',
            content: 'Tu es un système d\'extraction OCR spécialisé dans les pièces d\'identité françaises.'
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Extrait les informations d'une pièce d'identité ou d'un passeport français.
                Fournis seulement un objet JSON avec ces champs (ceux que tu peux trouver) :
                firstName, lastName, birthDate (format YYYY-MM-DD), address, idNumber, nationality, gender (M/F).
                Assure-toi que les noms sont en majuscules. Ne réponds qu'avec le JSON, sans aucun texte autour.`
              },
              {
                type: 'image_url',
                image_url: `data:image/jpeg;base64,${base64Image}`
              }
            ]
          }
        ],
        temperature: 0.1,
        max_tokens: 500,
        response_format: {
          type: "json_object"
        }
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        }
      }
    );

    const content = response.data?.choices?.[0]?.message?.content;
    
    if (!content) {
      return { 
        success: false, 
        error: 'No content returned from Mistral API' 
      };
    }

    try {
      // Si le contenu est déjà un objet JSON, pas besoin de le parser
      const data = typeof content === 'object' ? content : JSON.parse(content);
      return { success: true, data };
    } catch (e) {
      return { 
        success: false, 
        error: 'Failed to parse JSON from Mistral API response' 
      };
    }
  } catch (error: any) {
    log(`Mistral OCR error: ${error?.message || 'Unknown error'}`, 'mistral');
    return { 
      success: false, 
      error: error?.message || 'Unknown error during OCR processing'
    };
  }
}