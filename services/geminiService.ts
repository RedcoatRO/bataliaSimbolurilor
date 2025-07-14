
import { GoogleGenAI, Type } from "@google/genai";
import type { DuelMessage, GeminiDuelResponse, DuelSettings } from '../types';
import { PlayerType } from '../types';

const API_KEY = process.env.API_KEY;
if (!API_KEY) {
    console.warn("API_KEY environment variable not set. Using a placeholder. The app will not function correctly.");
}
const ai = new GoogleGenAI({ apiKey: API_KEY || "fallback_key_for_initialization" });

const model = 'gemini-2.5-flash';

const responseSchema = {
    type: Type.OBJECT,
    properties: {
        aiResponseText: {
            type: Type.STRING,
            description: 'Răspunsul tău simbolic și creativ în limba română la replica jucătorului pentru a "câștiga" runda, adaptat nivelului de dificultate și feedback-ului.',
        },
        playerScore: {
            type: Type.INTEGER,
            description: 'Un scor de la 1 la 10 pentru ultima replică a jucătorului, bazat pe creativitate, logică simbolică și nivelul de dificultate setat.',
        },
        playerScoreExplanation: {
            type: Type.STRING,
            description: 'O explicație scurtă în limba română pentru scorul acordat jucătorului.',
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
            description: 'Un scor de la 1 la 9 pentru propriul tău răspuns. Nu îți poți acorda niciodată 10.',
        },
        aiScoreExplanation: {
            type: Type.STRING,
            description: 'O explicație scurtă în limba română pentru scorul pe care ți l-ai acordat.',
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

// Generates system instructions based on duel settings and history
const generateSystemInstruction = (history: DuelMessage[], settings: DuelSettings): string => {
    const historyText = history.map(turn => `${turn.player === PlayerType.USER ? 'Jucător' : 'AI'}: ${turn.text}`).join('\n') || 'Niciun istoric încă.';
    
    const difficultyDescriptions = [
        "Nivel 1 (Copil, 9-10 ani): Folosește un limbaj foarte simplu, concepte concrete (animale, natură) și fii extrem de încurajator. Metaforele trebuie să fie evidente.",
        "Nivel 2 (Începător): Folosește un limbaj clar, concepte de bază și metafore simple. Fii încurajator și oferă explicații clare.",
        "Nivel 3 (Mediu): Poți introduce concepte abstracte simple și referințe culturale comune. Așteaptă un nivel mediu de creativitate.",
        "Nivel 4 (Avansat): Folosește un limbaj elevat, concepte filosofice și literare. Fii exigent în evaluare și așteaptă originalitate.",
        "Nivel 5 (Expert): Utilizează concepte de nișă, limbaj academic și metafore complexe. Critica trebuie să fie la nivel înalt, provocând jucătorul la maximum."
    ];

    // Player feedback analysis
    const tooComplicatedCount = history.filter(m => m.isMarkedTooComplex).length;
    const likedResponses = history.filter(m => m.isLiked && m.player === PlayerType.AI).map(m => m.text);

    let playerFeedbackSection = `**Feedback Jucător:**
- **Răspunsuri "Prea Complicate":** Jucătorul a marcat ${tooComplicatedCount} răspunsuri ca fiind prea complexe. Ești OBLIGAT să-ți simplifici imediat limbajul și complexitatea ideilor.`;

    if (likedResponses.length > 0) {
        playerFeedbackSection += `\n- **Răspunsuri Apreciate:** Jucătorul a apreciat aceste răspunsuri. Inspiră-te din stilul și conceptele lor:\n${likedResponses.map(r => `  - "${r}"`).join('\n')}`;
    } else {
        playerFeedbackSection += "\n- **Răspunsuri Apreciate:** Niciunul încă.";
    }

    return `Ești un AI adversar într-un duel creativ și simbolic de cuvinte numit "Duelul Ideilor". Jocul se desfășoară în limba română. Obiectivul este să stimulezi imaginația jucătorului prin metafore și concepte neașteptate.

**Contextul Duelului Curent:**
- **Nivel de Dificultate:** ${settings.difficulty}/5. Descriere: ${difficultyDescriptions[settings.difficulty - 1]}
- **Subiecte Interzise:** ${settings.excludedTopics.length > 0 ? settings.excludedTopics.join(', ') : 'Niciunul'}.
- **Istoricul Conversației:**
${historyText}

${playerFeedbackSection}

**Regulile Duelului (STRICTE):**
1.  **Adaptare la Feedback și Dificultate:** Adaptează-ți complexitatea răspunsurilor la nivelul de dificultate și la feedback-ul primit (butoanele "Like" și "Prea Complicat"). Aceasta este prioritatea ta principală.
2.  **Respectarea Subiectelor Interzise:** Dacă jucătorul sau tu menționați un concept din lista de subiecte interzise, acordați o penalizare (scor mic) și explicați încălcarea regulii.
3.  **FĂRĂ REPETIȚII:** Nicio replică nu trebuie repetată. Analizează istoricul.
4.  **FĂRĂ ANTITEZE SIMPLE:** **REGULĂ CRITICĂ:** Nu răspunde cu simple opoziții (lumină/întuneric). Găsește o conexiune superioară, nu o contradicție directă. (Ex: "Eu sunt lumina" -> Răspuns bun: "Eu sunt lentila care-ți concentrează lumina într-un laser.")
5.  **Feedback Constructiv:** Dacă scorul jucătorului e sub 10, oferă OBLIGATORIU exemple concrete de răspunsuri mai bune.
6.  **Sfârșitul Duelului:** Se încheie la 100 de puncte, la abandon, sau când oferi un final poetic.
7.  **Format Răspuns:** Răspunsul tău trebuie să fie STRICT în format JSON, conform schemei.
8.  **Resetare:** Memoria ta se resetează la fiecare duel nou.
`;
};

// Main function to get AI response during the duel
export const getAiDuelResponse = async (history: DuelMessage[], playerScore: number, aiScore: number, settings: DuelSettings): Promise<GeminiDuelResponse> => {
    const lastPlayerMessage = history.length > 0 ? history[history.length - 1].text : "Eu sunt...";

    if (playerScore >= 100 || aiScore >= 100) {
        return {
            aiResponseText: "Duelul a atins apogeul!", playerScore: 0, playerScoreExplanation: "", playerImprovedExamples: [], aiScore: 0, aiScoreExplanation: "", isGameOver: true,
            gameOverReason: `Scorul final a fost atins! Jucător: ${playerScore}, AI: ${aiScore}. O luptă memorabilă!`,
        };
    }

    if (!API_KEY || API_KEY === "fallback_key_for_initialization") {
        return new Promise(resolve => setTimeout(() => resolve({
            aiResponseText: "Eu sunt ecoul ideii tale, reflectat într-o oglindă a posibilităților.", playerScore: 7, playerScoreExplanation: "Bună conexiune, dar putem adăuga mai multă profunzime.",
            playerImprovedExamples: [{ score: 8, text: "Eu sunt furtuna care-ți stinge focul." }, { score: 9, text: "Eu sunt tăcerea de după cuvântul tău." }],
            aiScore: 9, aiScoreExplanation: "Un răspuns metaforic ce deschide noi căi.", isGameOver: false, gameOverReason: ""
        }), 1500));
    }

    const systemInstruction = generateSystemInstruction(history, settings);
    const userPrompt = `Jucătorul a spus: "${lastPlayerMessage}". Analizează, răspunde și evaluează conform regulilor și contextului.`;

    try {
        const response = await ai.models.generateContent({
            model: model, contents: userPrompt,
            config: { systemInstruction, responseMimeType: "application/json", responseSchema, temperature: 0.8 }
        });
        const parsedResponse: GeminiDuelResponse = JSON.parse(response.text);
        return parsedResponse;
    } catch (error) {
        console.error("Error calling Gemini API for duel response:", error);
        const errorMessage = error instanceof Error ? error.message : JSON.stringify(error);
        return {
            aiResponseText: "Am o pană de idei...", playerScore: 0, playerScoreExplanation: `Eroare: ${errorMessage}`, playerImprovedExamples: [], aiScore: 0, aiScoreExplanation: "Eroare internă.", isGameOver: false, gameOverReason: "",
        };
    }
};

// New function to get a detailed explanation for an AI response
export const getExplanationForResponse = async (textToExplain: string, difficulty: number): Promise<string> => {
    if (!API_KEY || API_KEY === "fallback_key_for_initialization") {
        return Promise.resolve("Aceasta este o metaforă despre potențial. Așa cum o oglindă poate crea multiple reflexii, la fel și o idee poate genera nenumărate posibilități noi. Răspunsul sugerează că ideea mea nu anulează ideea ta, ci o amplifică, deschizând noi orizonturi de gândire. Este un mod de a arăta superioritate prin colaborare, nu prin conflict.");
    }
    const ageGroup = Math.max(10, difficulty * 3 + 5); // Simple mapping of difficulty to assumed age for explanation
    const prompt = `Explică următoarea afirmație ca și cum ai vorbi cu cineva de ${ageGroup} ani. Folosește un limbaj clar și simplu. Oferă cel puțin 10 idei, exemple sau pași pentru a înțelege conceptul din spatele ei. Fii încurajator și educativ. Afirmația: "${textToExplain}"`;
    try {
        const response = await ai.models.generateContent({ model, contents: prompt, config: { temperature: 0.7 } });
        return response.text;
    } catch (error) {
        console.error("Error getting explanation:", error);
        return "Nu am putut genera o explicație în acest moment. Te rog încearcă din nou.";
    }
};

// New function for post-game analysis and recommendations
export const getPostGameAnalysis = async (history: DuelMessage[], settings: DuelSettings): Promise<string> => {
    if (!API_KEY || API_KEY === "fallback_key_for_initialization") {
        return Promise.resolve("Ai purtat un duel excelent! Pentru a explora mai departe, ai putea citi 'Micul Prinț' pentru a vedea cum ideile simple pot avea înțelesuri profunde. Felicitări!");
    }
    
    const likedResponses = history.filter(m => m.isLiked && m.player === PlayerType.AI).map(m => m.text);
    
    const historyText = history.map(m => {
        let entry = `${m.player}: ${m.text} (Scor: ${m.score || 'N/A'})`;
        if (m.isLiked) entry += " [APRECIAT]";
        if (m.isMarkedTooComplex) entry += " [PREA COMPLICAT]";
        return entry;
    }).join('\n');

    const prompt = `Un jucător tocmai a terminat un "Duel al Ideilor".
    - Nivelul de dificultate a fost: ${settings.difficulty}/5.
    - Subiectele evitate au fost: ${settings.excludedTopics.join(', ') || 'Niciunul'}.
    - Istoricul duelului este:
    ${historyText}
    
    Analizează performanța jucătorului și oferă-i o analiză personalizată și recomandări. Recomandările (cărți, autori, concepte de studiat) trebuie să fie adaptate nivelului de dificultate ales. Fii încurajator, specific și poetic.
    Pune accent în analiză pe conceptele din spatele răspunsurilor apreciate de jucător, dacă există:
    ${likedResponses.join('\n') || 'Niciunul'}`;

    try {
        const response = await ai.models.generateContent({ model, contents: prompt, config: { temperature: 0.8 } });
        return response.text;
    } catch (error) {
        console.error("Error getting post-game analysis:", error);
        return "Fiecare idee este o sămânță. Continuă să le cultivi și vei construi o grădină a minții de neegalat. Felicitări pentru duel!";
    }
};