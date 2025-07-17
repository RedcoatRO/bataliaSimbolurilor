
import { GoogleGenAI } from '@google/genai';

// Acest cod rulează pe server, NU în browser.
// process.env.API_KEY este citit în siguranță de pe serverul Vercel.

// Handler-ul principal pentru funcția serverless
export default async function handler(req: any, res: any) {
  // Permitem doar cereri de tip POST
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  // Extragem corpul cererii (ce vrea clientul să facă)
  const { path, payload } = req.body;
  
  if (!path || !payload) {
    res.status(400).json({ error: 'Path and payload are required' });
    return;
  }

  try {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      // Această eroare va fi vizibilă doar în log-urile serverului, nu la client
      console.error("API_KEY environment variable not set on the server.");
      throw new Error('Server configuration error. API key is missing.');
    }

    const ai = new GoogleGenAI({ apiKey });

    let result;
    
    // Decidem ce funcție a API-ului Google să apelăm pe baza 'path'-ului
    switch (path) {
      case 'generateContent':
        result = await ai.models.generateContent(payload);
        break;
      case 'generateImages':
        result = await ai.models.generateImages(payload);
        break;
      // Poți adăuga aici și alte funcționalități, cum ar fi chat-ul
      default:
        res.status(400).json({ error: `Invalid path: ${path}` });
        return;
    }
    
    // Trimitem răspunsul de succes înapoi la client
    res.status(200).json(result);

  } catch (error) {
    console.error(`Error calling Gemini API via proxy for path: ${path}`, error);
    // Trimitem un mesaj de eroare generic la client
    res.status(500).json({
      error: 'An error occurred while communicating with the AI service.',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
