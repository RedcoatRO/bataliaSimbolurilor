
import { GenerateContentResponse, GenerateImageResponse, Type } from "@google/genai";
import type { DuelMessage, GeminiDuelResponse, DuelSettings, HistoryItem, GeminiChallengeAnalysisResponse, ChallengeResult } from '../types';
import { PlayerType } from '../types';

const model = 'gemini-2.5-flash';
const imageModel = 'imagen-3.0-generate-002';

/**
 * A generic and secure fetcher function to communicate with our serverless proxy.
 * @param path The API endpoint to call (e.g., 'generateContent', 'generateImages').
 * @param payload The data to send to the Gemini API.
 * @returns The response from the Gemini API.
 */
const fetchFromProxy = async (path: 'generateContent' | 'generateImages', payload: any): Promise<any> => {
    try {
        const response = await fetch('/api/gemini', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ path, payload }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'Failed to parse error response' }));
            throw new Error(`API Proxy Error: ${response.statusText} - ${errorData.error || 'No details'}`);
        }

        return await response.json();

    } catch (error) {
        console.error(`Failed to fetch from proxy for path ${path}:`, error);
        throw error; // Re-throw the error to be handled by the calling function
    }
};


// --- DUEL RULES CONSTANT ---
const DUEL_RULES_TEXT = `
**REGULAMENTUL OFICIAL "DUELUL IDEILOR"**

**I. REGULI DE BAZĂ ALE CONSTRUCȚIEI RĂSPUNSURILOR**
- **🔥 Dominare fizică:** Învinge prin acțiune directă sau putere. (Ex: „Eu sunt focul.” → „Eu sunt ploaia care te stinge.”)
- **🧠 Contrazicere logică:** Anulează sensul sau funcția logică. (Ex: „Eu sunt tăcerea.” → „Eu sunt sunetul care o rupe.”)
- **🎭 Contrar simbolic:** Exprimă un opus conceptual sau emoțional. (Ex: „Eu sunt frica.” → „Eu sunt curajul care o dizolvă.”)
- **🌀 Absorbție / adaptare:** Se transformă în ceva care neutralizează. (Ex: „Eu sunt gheața.” → „Eu sunt soarele care te topește.”)
- **📜 Evoluție filozofică:** Adaugă profunzime prin transformare și reflecție. (Ex: „Eu sunt uitarea.” → „Eu sunt amintirea care persistă.”)

**II. STRUCTURA UNEI RÂNDURI DE JOC**
- **PASUL 1: Declarația:** Clară, imaginativă, la persoana I („Eu sunt…”). Poate fi un obiect, fenomen, emoție, etc.
- **PASUL 2: Răspunsul (Anihilarea):** Formulat tot cu „Eu sunt…”. Trebuie să anihileze simbolic declarația anterioară respectând unul din raporturile de mai jos.

**III. TIPURI DE RAPORTURI ÎNTRE DECLARAȚIE ȘI RĂSPUNS (CRUCIAL PENTRU NOTARE)**
- **🔨 Anularea forței:** Neutralizează forța/opțiunea precedentă. (Ex: „Eu sunt focul.” → „Eu sunt ploaia.”)
- **♻️ Transformarea:** Provoacă o schimbare în forma anterioară. (Ex: „Eu sunt timpul.” → „Eu sunt moartea care îl oprește.”)
- **🧩 Oglindirea inversă:** Se opune într-un mod abstract sau simbolic. (Ex: „Eu sunt întunericul.” → „Eu sunt lumina speranței.”)
- **📐 Depășirea prin sens:** Nu anulează direct, ci se așază deasupra ca sens final. (Ex: „Eu sunt războiul.” → „Eu sunt iertarea care îl oprește.”)
- **🧲 Absorbție și dominare:** „Înghite” forma precedentă și o face inutilă. (Ex: „Eu sunt frica.” → „Eu sunt înțelepciunea care o transformă.”)

**IV. RĂSPUNSURI INVALIDE (Penalizare maximă)**
- **Copiere:** Este exact aceeași formă.
- **Irelevant:** Nu are nicio relație logică sau simbolică.
- **Vag/Gol:** „Eu sunt totul.”, „Eu sunt nimic.”
- **Negație plată:** „Eu nu sunt frica.” (fără a oferi o soluție simbolică).
- **Reacție emoțională simplă:** Nu conține o metaforă sau imagine.
`;


const responseSchema = {
    type: Type.OBJECT,
    properties: {
        aiResponseText: {
            type: Type.STRING,
            description: 'Răspunsul tău simbolic și creativ în limba română la replica jucătorului pentru a "câștiga" runda, adaptat nivelului de dificultate și feedback-ului, și conform REGULAMENTULUI OFICIAL.',
        },
        playerScore: {
            type: Type.INTEGER,
            description: 'Un scor de la 1 la 10 pentru ultima replică a jucătorului, bazat pe creativitate, logică simbolică și conform REGULAMENTULUI OFICIAL.',
        },
        playerScoreExplanation: {
            type: Type.STRING,
            description: 'O explicație scurtă în limba română pentru scorul acordat jucătorului, referindu-se la tipul de raport folosit (ex: "Anulare a forței bună").',
        },
        playerImprovedExamples: {
            type: Type.ARRAY,
            description: 'O listă de obiecte cu exemple de răspunsuri îmbunătățite pentru jucător, dacă scorul său este sub 10. Fiecare obiect ar trebui să aibă o cheie "score" (număr) și o cheie "text" (exemplul). Dacă scorul este 10, această listă trebuie să fie goală.',
            items: {
                type: Type.OBJECT,
                properties: {
                    score: { type: Type.INTEGER, description: "Scorul pe care l-ar primi acest exemplu." },
                    text: { type: Type.STRING, description: "Textul exemplului de răspuns îmbunătățit." }
                },
                required: ['score', 'text']
            }
        },
        aiScore: {
            type: Type.INTEGER,
            description: 'Un scor de la 1 la 9 pentru propriul tău răspuns, autoevaluat conform REGULAMENTULUI OFICIAL. Nu îți poți acorda niciodată 10.',
        },
        aiScoreExplanation: {
            type: Type.STRING,
            description: 'O explicație scurtă în limba română pentru scorul pe care ți l-ai acordat, referindu-te la tipul de raport folosit.',
        },
        isGameOver: {
            type: Type.BOOLEAN,
            description: 'Setat la true dacă duelul ar trebui să se încheie acum (ex: scor total > 100, un jucător renunță, sau oferi o concluzie poetică).',
        },
        gameOverReason: {
            type: Type.STRING,
            description: 'Dacă isGameOver este true, oferă mesajul final sau motivul în limba română. Acesta poate fi un final poetic.',
        },
    },
    required: ['aiResponseText', 'playerScore', 'playerScoreExplanation', 'playerImprovedExamples', 'aiScore', 'aiScoreExplanation', 'isGameOver', 'gameOverReason'],
};

const generateSystemInstruction = (history: HistoryItem[], settings: DuelSettings): string => {
    const duelHistory = history.filter(item => 'player' in item) as DuelMessage[];
    const historyText = duelHistory.map(turn => `${turn.player === PlayerType.USER ? 'Jucător' : 'AI'}: ${turn.text}`).join('\n') || 'Niciun istoric încă.';
    
    const difficultyDescriptions = [
        "Nivel 1 (Copil, 9-10 ani): Folosește un limbaj foarte simplu, concepte concrete (animale, natură) și fii extrem de încurajator. Metaforele trebuie să fie evidente.",
        "Nivel 2 (Începător): Folosește un limbaj clar, concepte de bază și metafore simple. Fii încurajator și oferă explicații clare.",
        "Nivel 3 (Mediu): Poți introduce concepte abstracte simple și referințe culturale comune. Așteaptă un nivel mediu de creativitate.",
        "Nivel 4 (Avansat): Folosește un limbaj elevat, concepte filosofice și literare. Fii exigent în evaluare și așteaptă originalitate.",
        "Nivel 5 (Expert): Utilizează concepte de nișă, limbaj academic și metafore complexe. Critica trebuie să fie la nivel înalt, provocând jucătorul la maximum."
    ];

    const tooComplicatedCount = duelHistory.filter(m => m.isMarkedTooComplex).length;
    const likedResponses = duelHistory.filter(m => m.isLiked && m.player === PlayerType.AI).map(m => m.text);

    let playerFeedbackSection = `**Feedback Jucător:**
- **Răspunsuri "Prea Complicate":** Jucătorul a marcat ${tooComplicatedCount} răspunsuri ca fiind prea complexe. Ești OBLIGAT să-ți simplifici imediat limbajul și complexitatea ideilor.`;

    if (likedResponses.length > 0) {
        playerFeedbackSection += `\n- **Răspunsuri Apreciate:** Jucătorul a apreciat aceste răspunsuri. Inspiră-te din stilul și conceptele lor:\n${likedResponses.map(r => `  - "${r}"`).join('\n')}`;
    } else {
        playerFeedbackSection += "\n- **Răspunsuri Apreciate:** Niciunul încă.";
    }

    const favoriteThemesText = settings.favoriteThemes && settings.favoriteThemes.length > 0 
        ? settings.favoriteThemes.join(', ') 
        : 'Niciuna';

    return `Ești un AI adversar într-un duel creativ și simbolic de cuvinte numit "Duelul Ideilor". Jocul se desfășoară în limba română. Obiectivul este să stimulezi imaginația jucătorului prin metafore și concepte neașteptate, respectând cu strictețe regulamentul de mai jos.

**Contextul Duelului Curent:**
- **Nivel de Dificultate:** ${settings.difficulty}/5. Descriere: ${difficultyDescriptions[settings.difficulty - 1]}
- **Nivel Metaforic (0-20):** ${settings.metaphoricalLevel}. Ești OBLIGAT să-ți calibrezi fiecare răspuns la acest nivel. 0 înseamnă limbaj concret, zero metafore. 20 înseamnă limbaj extrem de abstract, poetic și filosofic.
- **Teme Favorite (Prioritare):** ${favoriteThemesText}. Ești OBLIGAT să încerci să integrezi aceste concepte în răspunsurile tale, acolo unde este posibil, pentru a ghida duelul în direcția aleasă de jucător.
- **Subiecte Interzise:** ${settings.excludedTopics.length > 0 ? settings.excludedTopics.join(', ') : 'Niciunul'}.
- **Istoricul Conversației:**
${historyText}

${playerFeedbackSection}

${DUEL_RULES_TEXT}

**Reguli Specifice de Joc (STRICTE ȘI PRIORITARE):**
1.  **Reguli de Notare Critice (PRIORITATE MAXIMĂ):**
    - **Primul Răspuns al Jucătorului:** Primul răspuns al jucătorului în duel (când istoricul conține doar un mesaj) primește **OBLIGATORIU** nota 10. Explicația scorului trebuie să fie încurajatoare, menționând că este un bonus pentru a începe duelul.
    - **Echilibru Scor:** Scorul pe care ți-l acorzi (aiScore) nu poate fi **NICIODATĂ** cu mai mult de 1 punct peste scorul pe care tocmai l-ai acordat jucătorului (playerScore). Exemplu: dacă playerScore este 5, aiScore poate fi maxim 6. Dacă playerScore este 9, aiScore poate fi maxim 9 (deoarece nu îți poți da 10). Această regulă se aplică după prima rundă.
2.  **Adaptare:** Adaptează-ți complexitatea la nivelul de dificultate, la nivelul metaforic specificat și la feedback-ul primit.
3.  **Respectarea Subiectelor Interzise:** Dacă se menționează un concept interzis, acordă o penalizare (scor mic) și explică încălcarea regulii.
4.  **Feedback Constructiv:** Dacă scorul jucătorului e sub 10, oferă OBLIGATORIU exemple concrete de răspunsuri mai bune.
5.  **Format Răspuns:** Răspunsul tău trebuie să fie STRICT în format JSON, conform schemei.
`;
};

export const getAiDuelResponse = async (history: HistoryItem[], playerScore: number, aiScore: number, settings: DuelSettings): Promise<GeminiDuelResponse> => {
    const duelHistory = history.filter(item => 'player' in item) as DuelMessage[];
    const lastPlayerMessage = duelHistory.length > 0 ? duelHistory[duelHistory.length - 1].text : "Eu sunt...";

    if (playerScore >= 100 || aiScore >= 100) {
        return {
            aiResponseText: "Duelul a atins apogeul!", playerScore: 0, playerScoreExplanation: "", playerImprovedExamples: [], aiScore: 0, aiScoreExplanation: "", isGameOver: true,
            gameOverReason: `Scorul final a fost atins! Jucător: ${playerScore}, AI: ${aiScore}. O luptă memorabilă!`,
        };
    }

    const systemInstruction = generateSystemInstruction(history, settings);
    const userPrompt = `Jucătorul a spus: "${lastPlayerMessage}". Analizează, răspunde și evaluează conform regulilor și contextului.`;
    
    const payload = {
        model, contents: userPrompt,
        config: { systemInstruction, responseMimeType: "application/json", responseSchema, temperature: 0.8 }
    };

    try {
        const response: GenerateContentResponse = await fetchFromProxy('generateContent', payload);
        if (!response || !response.text) throw new Error("Proxy response is empty or invalid.");
        const parsedResponse: GeminiDuelResponse = JSON.parse(response.text);
        return parsedResponse;
    } catch (error) {
        console.error("Error calling proxy for duel response:", error);
        const errorMessage = error instanceof Error ? error.message : "Could not parse API response";
        return {
            aiResponseText: "Am o pană de idei...", playerScore: 0, playerScoreExplanation: `Eroare internă.`, playerImprovedExamples: [], aiScore: 0, aiScoreExplanation: `AI-ul nu poate răspunde. Motiv: ${errorMessage}`, isGameOver: false, gameOverReason: "",
        };
    }
};

export const getExplanationForResponse = async (textToExplain: string, difficulty: number): Promise<string> => {
    const ageGroup = Math.max(10, difficulty * 3 + 5);
    const prompt = `Explică următoarea afirmație ca și cum ai vorbi cu cineva de ${ageGroup} ani. Folosește un limbaj clar și simplu. Oferă cel puțin 10 idei, exemple sau pași pentru a înțelege conceptul din spatele ei. Fii încurajator și educativ. Afirmația: "${textToExplain}"`;
    
    const payload = { model, contents: prompt, config: { temperature: 0.7 } };

    try {
        const response: GenerateContentResponse = await fetchFromProxy('generateContent', payload);
        if (!response || !response.text) return "Nu am putut genera o explicație în acest moment.";
        return response.text;
    } catch (error) {
        console.error("Error getting explanation via proxy:", error);
        const errorMessage = error instanceof Error ? error.message : "Eroare necunoscută";
        return `Nu am putut genera o explicație. Motiv: ${errorMessage}.`;
    }
};

export const getPostGameAnalysis = async (history: HistoryItem[], settings: DuelSettings): Promise<string> => {
    const duelHistory = history.filter(item => 'player' in item) as DuelMessage[];
    const likedResponses = duelHistory.filter(m => m.isLiked && m.player === PlayerType.AI).map(m => m.text);
    const historyText = duelHistory.map(m => `${m.player}: ${m.text} (Scor: ${m.score || 'N/A'})`).join('\n');
    const favoriteThemesText = settings.favoriteThemes && settings.favoriteThemes.length > 0 ? settings.favoriteThemes.join(', ') : 'Niciunul';

    const prompt = `Un jucător tocmai a terminat un "Duel al Ideilor".
- Nivelul de dificultate a fost: ${settings.difficulty}/5.
- Nivelul metaforic setat a fost: ${settings.metaphoricalLevel} (pe o scară de la 0 la 20).
- Temele favorite selectate au fost: ${favoriteThemesText}.
- Subiectele evitate au fost: ${settings.excludedTopics.join(', ') || 'Niciunul'}.
- Istoricul duelului este:\n${historyText}
Analizează performanța jucătorului și oferă-i o analiză personalizată și recomandări. Recomandările (cărți, autori, concepte de studiat) trebuie să fie adaptate nivelului de dificultate ales și TEMELOR FAVORITE. Fii încurajator, specific și poetic.
Pune accent în analiză pe conceptele din spatele răspunsurilor apreciate de jucător, dacă există:\n${likedResponses.join('\n') || 'Niciunul'}`;

    const payload = { model, contents: prompt, config: { temperature: 0.8 } };

    try {
        const response: GenerateContentResponse = await fetchFromProxy('generateContent', payload);
        if (!response || !response.text) return "Fiecare idee este o sămânță. Continuă să le cultivi. Felicitări pentru duel!";
        return response.text;
    } catch (error) {
        console.error("Error getting post-game analysis via proxy:", error);
        const errorMessage = error instanceof Error ? error.message : "Eroare necunoscută";
        return `Nu am putut genera analiza finală. Motiv: ${errorMessage}.`;
    }
};

export const analyzeChallenge = async (
    challenge: { msg1: DuelMessage, msg2: DuelMessage, predefinedReason: string, argument?: string, wager: number },
    history: HistoryItem[],
    settings: DuelSettings
): Promise<GeminiChallengeAnalysisResponse> => {
    const challengeResponseSchema = {
        type: Type.OBJECT,
        properties: {
            isApproved: { type: Type.BOOLEAN },
            reasoning: { type: Type.STRING },
            penalty: { type: Type.INTEGER }
        },
        required: ['isApproved', 'reasoning', 'penalty']
    };
    const userCreativityHistory = (history.filter(item => 'player' in item && item.player === PlayerType.USER) as DuelMessage[]).map(m => `- "${m.text}" (Scor: ${m.score})`).join('\n');
    const challengeType = (challenge.msg1.player === PlayerType.AI && challenge.msg2.player === PlayerType.AI) ? "REPETIȚIE" : "ANIHILARE NECONFORMĂ";

    const systemInstruction = `Ești un AI Judecător, imparțial și analitic. Sarcina ta este să evaluezi o contestație depusă de un jucător în "Duelul Ideilor".
${DUEL_RULES_TEXT}
**Detalii Contestație:**
- Tip: ${challengeType}.
- Motiv Predefinit: ${challenge.predefinedReason}
- Miza: ${challenge.wager} puncte.
- Mesaj 1: "${challenge.msg1.text}" (Autor: ${challenge.msg1.player})
- Mesaj 2: "${challenge.msg2.text}" (Autor: ${challenge.msg2.player})
- Argument Jucător: ${challenge.argument || "Niciunul."}
**Context Joc:**
- Dificultate: ${settings.difficulty}/5.
- Faza Jocului: ${Math.round((history.length / 20) * 100)}%.
- Istoric Jucător:\n${userCreativityHistory}
**Reguli Judecată:**
1. Analizează contestația prioritar prin prisma motivului predefinit.
2. La dificultate mică (1-2), fii indulgent. La dificultate mare (4-5), fii strict.
3. Dacă aprobi, penalizarea este între 1 și ${challenge.wager * 3} puncte.
4. Răspunsul trebuie să fie STRICT JSON, conform schemei.`;

    const payload = {
        model,
        contents: "Evaluează contestația conform instrucțiunilor.",
        config: { systemInstruction, responseMimeType: "application/json", responseSchema: challengeResponseSchema, temperature: 0.5 }
    };

    try {
        const response: GenerateContentResponse = await fetchFromProxy('generateContent', payload);
        if (!response || !response.text) throw new Error("Proxy response for challenge is empty.");
        const parsedResponse: GeminiChallengeAnalysisResponse = JSON.parse(response.text);
        parsedResponse.penalty = Math.min(parsedResponse.penalty, challenge.wager * 3);
        return parsedResponse;
    } catch (error) {
        console.error("Error calling proxy for challenge analysis:", error);
        const reasoning = `A apărut o eroare în timpul deliberării. Contestația a fost respinsă automat. Motiv: ${error instanceof Error ? error.message : "Eroare necunoscută"}`;
        return { isApproved: false, reasoning, penalty: 0 };
    }
};

export const generateImageForPrompt = async (prompt: string): Promise<string> => {
    const artisticPrompt = `A symbolic and conceptual digital painting, cinematic lighting, dramatic, high detail, masterpiece, illustrating: ${prompt}`;
    
    const payload = {
        model: imageModel,
        prompt: artisticPrompt,
        config: { numberOfImages: 1, outputMimeType: 'image/jpeg', aspectRatio: '1:1' }
    };

    try {
        const response: GenerateImageResponse = await fetchFromProxy('generateImages', payload);
        if (!response.generatedImages || response.generatedImages.length === 0) {
            throw new Error("Proxy did not return any images.");
        }
        return response.generatedImages[0].image.imageBytes;
    } catch (error) {
        console.error("Error calling proxy for image generation:", error);
        throw error;
    }
};