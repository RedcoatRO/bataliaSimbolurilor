import { GoogleGenAI, GenerateContentResponse, GenerateImagesResponse } from '@google/genai';

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

    let responseData;
    
    // Decidem ce funcție a API-ului Google să apelăm pe baza 'path'-ului
    switch (path) {
      case 'generateContent':
        const contentResult: GenerateContentResponse = await ai.models.generateContent(payload);
        // Motivul acestei conversii:
        // Răspunsul de la SDK (contentResult) este o clasă cu accesorii (getters) precum `.text`.
        // Când se face JSON.stringify pe o clasă, doar proprietățile de date sunt serializate, nu și valorile returnate de getteri.
        // Pentru a ne asigura că clientul primește valoarea din `.text`, o extragem aici, pe server,
        // și o punem într-un obiect simplu, care poate fi serializat corect.
        responseData = {
          text: contentResult.text,
          candidates: contentResult.candidates,
        };
        break;
      case 'generateImages':
        const imageResult: GenerateImagesResponse = await ai.models.generateImages(payload);
        
        // Robustness check: Handle cases where the API returns no images
        // (e.g., due to safety filters). If `imageResult.generatedImages` is undefined or empty,
        // we create an empty array to prevent the server from crashing.
        const imagesToProcess = imageResult.generatedImages || [];

        // Reconstruct the response object to ensure it's a simple JSON object
        // that can be safely sent to the client.
        responseData = {
          generatedImages: imagesToProcess.map(img => ({
            image: {
              // Ensure we don't try to access properties on a null/undefined object
              imageBytes: img?.image?.imageBytes,
            },
          })),
        };
        break;
      default:
        res.status(400).json({ error: `Invalid path: ${path}` });
        return;
    }
    
    // Trimitem răspunsul de succes (ca obiect simplu) înapoi la client
    res.status(200).json(responseData);

  } catch (error) {
    console.error(`Error calling Gemini API via proxy for path: ${path}`, error);
    // Trimitem un mesaj de eroare generic la client
    res.status(500).json({
      error: 'An error occurred while communicating with the AI service.',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
