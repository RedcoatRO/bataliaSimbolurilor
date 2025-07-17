
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { getAiDuelResponse, getPostGameAnalysis, getExplanationForResponse, analyzeChallenge, generateImageForPrompt } from '../services/geminiService';
import type { DuelMessage, DuelSettings, HistoryItem, SystemMessage, ChallengeResult } from '../types';
import { PlayerType } from '../types';
import { PlayerIcon, AiIcon, SendIcon, GavelIcon } from './Icons';
import MessageCard from './MessageCard';
import ExplanationModal from './ExplanationModal';
import ChallengeModal from './ChallengeModal';
import ImageModal from './ImageModal'; // Import the new ImageModal component

interface DuelPageProps {
  settings: DuelSettings;
  onEndDuel: () => void;
}

const DIFFICULTY_LABELS = ["Copil (9-10 ani)", "Începător", "Mediu", "Avansat", "Expert"];

// Configurația pentru plajele de valori ale nivelului metaforic, necesară pentru a impune limite.
const METAPHOR_RANGES: { [key: number]: { min: number; max: number } } = {
    1: { min: 0, max: 3 },
    2: { min: 4, max: 6 },
    3: { min: 7, max: 9 },
    4: { min: 10, max: 15 },
    5: { min: 16, max: 20 }
};

const DuelPage: React.FC<DuelPageProps> = ({ settings, onEndDuel }) => {
    const [history, setHistory] = useState<HistoryItem[]>([]);
    const [inputValue, setInputValue] = useState('Eu sunt...');
    const [isLoading, setIsLoading] = useState(false);
    const [playerScore, setPlayerScore] = useState(0);
    const [aiScore, setAiScore] = useState(0);
    const [isGameOver, setIsGameOver] = useState(false);
    const [gameOverMessage, setGameOverMessage] = useState('');
    const [explanationModal, setExplanationModal] = useState<{ content: string, isLoading: boolean }>({ content: '', isLoading: false });
    const [tooComplicatedCount, setTooComplicatedCount] = useState(0);
    // Stare pentru a gestiona nivelul metaforic curent, care poate fi modificat în timpul jocului.
    const [currentMetaphoricalLevel, setCurrentMetaphoricalLevel] = useState(settings.metaphoricalLevel);
    // State for the new Image Visualization Modal
    const [imageModal, setImageModal] = useState<{ imageUrl: string, prompt: string, isLoading: boolean }>({ imageUrl: '', prompt: '', isLoading: false });


    // --- Challenge System State ---
    const [isChallengeModalOpen, setIsChallengeModalOpen] = useState(false);
    const [challengeCount, setChallengeCount] = useState(0);
    const [challengeHistory, setChallengeHistory] = useState<ChallengeResult[]>([]);

    const historyEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        historyEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [history, isLoading]);

    // Acest efect gestionează ajustarea dinamică a nivelului metaforic al AI-ului
    // pe baza feedback-ului utilizatorului (marchează răspunsurile ca "Prea Complicate").
    // Se declanșează la a 2-a și a 3-a oară când utilizatorul oferă acest feedback.
    useEffect(() => {
        // Definește nivelul minim posibil pentru dificultatea curentă
        // pentru a preveni reducerea excesivă a acestuia.
        const minLevelForDifficulty = METAPHOR_RANGES[settings.difficulty].min;

        // Verifică dacă este al 2-lea sau al 3-lea "dislike"
        if (tooComplicatedCount === 2 || tooComplicatedCount === 3) {
            // Calculează noul nivel, asigurându-se că nu coboară sub minimul dificultății.
            const newLevel = Math.max(minLevelForDifficulty, currentMetaphoricalLevel - 1);
            
            // Actualizează starea și notifică utilizatorul doar dacă a avut loc o schimbare.
            if (newLevel < currentMetaphoricalLevel) {
                setCurrentMetaphoricalLevel(newLevel);
                
                // Creează un mesaj de sistem pentru a informa utilizatorul despre schimbare.
                const systemMessage: SystemMessage = {
                    id: `sys-metaphor-${Date.now()}`,
                    type: 'SYSTEM',
                    text: 'Nivel Metaforic Ajustat Automat!',
                    details: `Datorită feedback-ului tău, complexitatea metaforică a AI-ului a fost redusă la nivelul ${newLevel}.`,
                    isSuccess: true, // Folosește stilul de succes pentru acțiuni pozitive de feedback
                };
                setHistory(prev => [...prev, systemMessage]);
            }
        }
    }, [tooComplicatedCount, settings.difficulty, currentMetaphoricalLevel]);

    // Handles the request for a detailed explanation of an AI message
    const handleExplainRequest = useCallback(async (messageId: string) => {
        const messageToExplain = history.find(m => m.id === messageId && 'player' in m) as DuelMessage | undefined;
        if (!messageToExplain) return;

        setExplanationModal({ content: '', isLoading: true });
        const explanation = await getExplanationForResponse(messageToExplain.text, settings.difficulty);
        setExplanationModal({ content: explanation, isLoading: false });
    }, [history, settings.difficulty]);

    /**
     * Handles the request to visualize a message as an image.
     * This function now creates a contextual prompt by combining the selected message
     * with the message that came immediately before it in the duel, illustrating the conflict.
     */
    const handleVisualizeRequest = useCallback(async (messageId: string) => {
        const messageIndex = history.findIndex(m => m.id === messageId);
        if (messageIndex === -1 || !('player' in history[messageIndex])) return;

        const messageToVisualize = history[messageIndex] as DuelMessage;

        // Build the contextual prompt by finding the previous duel message.
        let finalPrompt: string;
        let previousMessage: DuelMessage | null = null;
        
        // Search backwards from the current message's index to find the last valid DuelMessage.
        if (messageIndex > 0) {
            for (let i = messageIndex - 1; i >= 0; i--) {
                const item = history[i];
                if ('player' in item) { // Ensure it's a DuelMessage, not a SystemMessage
                    previousMessage = item as DuelMessage;
                    break;
                }
            }
        }

        if (previousMessage) {
            // Create a prompt that describes the conflict or interaction between the two ideas.
            finalPrompt = `O luptă conceptuală între "${previousMessage.text}" și "${messageToVisualize.text}"`;
        } else {
            // If it's the very first message in the duel, visualize it directly.
            finalPrompt = messageToVisualize.text;
        }

        // If an image has already been generated, just show it in the modal.
        if (messageToVisualize.generatedImage) {
            setImageModal({ imageUrl: messageToVisualize.generatedImage, prompt: finalPrompt, isLoading: false });
            return;
        }

        // Set loading state and show the modal with the contextual prompt.
        setImageModal({ imageUrl: '', prompt: finalPrompt, isLoading: true });

        try {
            const base64Image = await generateImageForPrompt(finalPrompt);
            
            // Create the full data URI for the image to be used in `src` attributes.
            const imageUrl = `data:image/jpeg;base64,${base64Image}`;
            
            // Update history to store the full data URI with the correct message.
            setHistory(prevHistory => prevHistory.map(item =>
                item.id === messageId ? { ...item, generatedImage: imageUrl } : item
            ));
            
            // Update the modal to show the newly generated image.
            setImageModal({ imageUrl, prompt: finalPrompt, isLoading: false });

        } catch (error) {
            console.error("Failed to visualize metaphor:", error);
            // Close the modal on error. Could also be modified to show an error message.
            setImageModal({ imageUrl: '', prompt: '', isLoading: false });
        }
    }, [history]);


    // Handles toggling the "Like" state for a message
    const handleToggleLike = useCallback((messageId: string) => {
        setHistory(prev => prev.map(item =>
            item.id === messageId && 'player' in item ? { ...item, isLiked: !item.isLiked } : item
        ));
    }, []);

    // Handles marking a message as "Too Complicated"
    const handleMarkTooComplex = useCallback((messageId: string) => {
        // Limita este verificată în componenta MessageCard, permițând până la 3 click-uri
        setHistory(prev => prev.map(item =>
            item.id === messageId && 'player' in item ? { ...item, isMarkedTooComplex: true } : item
        ));
        setTooComplicatedCount(prev => prev + 1);
    }, []);

    // Ends the duel and fetches the post-game analysis
    const handleEndDuel = useCallback(async (reason: string) => {
        setIsLoading(true);
        setIsGameOver(true);
        const finalReason = reason || "Duelul a fost încheiat de către jucător.";
        setGameOverMessage(finalReason + "\n\nSe generează analiza finală...");
       
        const analysis = await getPostGameAnalysis(history, settings);
        setGameOverMessage(analysis);
        setIsLoading(false);
    }, [history, settings]);
    
    // Handles submission of a new challenge, now including the predefined reason
    const handleSubmitChallenge = useCallback(async (msg1: DuelMessage, msg2: DuelMessage, predefinedReason: string, argument: string, wager: number) => {
        setIsChallengeModalOpen(false);
        setIsLoading(true);
        
        setPlayerScore(prev => prev - wager);
        const result = await analyzeChallenge({ msg1, msg2, predefinedReason, argument, wager }, history, settings);
        
        const newChallengeResult: ChallengeResult = {
            id: `challenge-${Date.now()}`, wager, isApproved: result.isApproved, reasoning: result.reasoning, penalty: result.penalty,
            challengedMessages: { id1: msg1.id, text1: msg1.text, id2: msg2.id, text2: msg2.text },
            predefinedReason,
            userArgument: argument,
        };
        setChallengeHistory(prev => [...prev, newChallengeResult]);
        
        let systemMessageText = '';
        let systemMessageDetails = '';

        if (result.isApproved) {
            const finalPenalty = Math.min(aiScore, result.penalty);
            setPlayerScore(prev => prev + wager);
            setAiScore(prev => prev - finalPenalty);
            systemMessageText = "Contestație Aprobată!";
            systemMessageDetails = `Ai primit înapoi ${wager} punct(e). AI-ul a fost penalizat cu ${finalPenalty} puncte. Motiv: ${result.reasoning}`;
        } else {
            systemMessageText = "Contestație Respinsă.";
            systemMessageDetails = `Ai pierdut ${wager} punct(e). Motiv: ${result.reasoning}`;
        }

        const systemMessage: SystemMessage = {
            id: `sys-${Date.now()}`, type: 'SYSTEM', text: systemMessageText, details: systemMessageDetails, isSuccess: result.isApproved,
        };
        setHistory(prev => [...prev, systemMessage]);

        setChallengeCount(prev => prev + 1);
        setIsLoading(false);

    }, [history, settings, aiScore]);


    // Generates a comprehensive text report of the duel for download
    const handleDownloadReport = useCallback(() => {
        const reportParts: string[] = [];
        reportParts.push(" Duelul Ideilor - Raport Final ");
        reportParts.push("=".repeat(40));
        reportParts.push(`\nNivel Dificultate: ${DIFFICULTY_LABELS[settings.difficulty - 1]}`);
        reportParts.push(`Nivel Metaforic Inițial: ${settings.metaphoricalLevel}`);
        reportParts.push(`Subiecte Excluse: ${settings.excludedTopics.join(', ') || 'Niciunul'}`);
        reportParts.push(`Scor Final: Jucător ${playerScore} - ${aiScore} AI\n`);
        reportParts.push("=".repeat(40));
        reportParts.push(" Istoric Conversație ");
        reportParts.push("=".repeat(40) + '\n');

        history.forEach(item => {
            if ('player' in item) { // It's a DuelMessage
                const msg = item;
                const timestamp = new Date(parseInt(msg.id.split('-')[1])).toLocaleString('ro-RO');
                reportParts.push(`[${msg.player}] - ${timestamp}`);
                if(msg.score !== undefined) reportParts.push(`   Scor: ${msg.score}`);
                if(msg.isLiked) reportParts.push(`   [APRECIAT]`);
                if(msg.isMarkedTooComplex) reportParts.push(`   [PREA COMPLICAT]`);
                reportParts.push(`   Text: ${msg.text}`);
                if (msg.generatedImage) {
                    reportParts.push(`   [IMAGINE GENERATĂ PENTRU ACEASTĂ REPLICĂ]`);
                }
                if(msg.explanation) reportParts.push(`   Explicație Scor: ${msg.explanation}`);
                if(msg.improvedExamples && msg.improvedExamples.length > 0) {
                    reportParts.push(`   Exemple Îmbunătățite:`);
                    msg.improvedExamples.forEach(ex => {
                        reportParts.push(`     - Nota ${ex.score}: "${ex.text}"`);
                    });
                }
            } else { // It's a SystemMessage
                reportParts.push(`[SISTEM] - ${new Date(parseInt(item.id.split('-')[1])).toLocaleString('ro-RO')}`);
                reportParts.push(`   Verdict: ${item.text}`);
                reportParts.push(`   Detalii: ${item.details}`);
            }
            reportParts.push('\n' + '-'.repeat(30) + '\n');
        });

        if (challengeHistory.length > 0) {
            reportParts.push("\n" + "=".repeat(40));
            reportParts.push(" Istoric Contestații ");
            reportParts.push("=".repeat(40) + '\n');
            challengeHistory.forEach((c, index) => {
                reportParts.push(`Contestația #${index + 1}:`);
                reportParts.push(` - Miza: ${c.wager} puncte.`);
                reportParts.push(` - Status: ${c.isApproved ? 'Aprobată' : 'Respinsă'}`);
                reportParts.push(` - Motiv ales: ${c.predefinedReason}`);
                reportParts.push(` - Penalizare AI: ${c.penalty} puncte.`);
                reportParts.push(` - Motiv Judecător: ${c.reasoning}`);
                reportParts.push(` - Argument Jucător: ${c.userArgument || 'N/A'}`);
                reportParts.push('\n');
            });
        }

        reportParts.push("\n" + "=".repeat(40));
        reportParts.push(" Analiză și Recomandări Finale ");
        reportParts.push("=".repeat(40) + '\n');
        reportParts.push(gameOverMessage);

        const reportContent = reportParts.join('\n');
        const blob = new Blob([reportContent], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `raport-duel-${new Date().toISOString().split('T')[0]}.txt`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }, [history, settings, playerScore, aiScore, gameOverMessage, challengeHistory]);

    // Handles user input submission
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputValue.trim() || isLoading || isGameOver) return;

        const userMessage: DuelMessage = {
            id: `msg-${Date.now()}`, player: PlayerType.USER, text: inputValue.trim(),
        };
        
        setIsLoading(true);
        const currentHistory = [...history, userMessage];
        setHistory(currentHistory);
        setInputValue('');

        // Trimite nivelul metaforic curent, potențial ajustat, către API.
        const response = await getAiDuelResponse(
            currentHistory, 
            playerScore, 
            aiScore, 
            { ...settings, metaphoricalLevel: currentMetaphoricalLevel }
        );
        
        const duelHistory = currentHistory.filter(item => 'player' in item);
        const finalPlayerScore = duelHistory.length === 1 ? 10 : response.playerScore;
        const finalPlayerExplanation = duelHistory.length === 1 ? "Un început excelent! Primești 10 puncte pentru curajul de a deschide duelul." : response.playerScoreExplanation;


        const updatedUserMessage: DuelMessage = {
            ...userMessage, score: finalPlayerScore, explanation: finalPlayerExplanation, improvedExamples: response.playerImprovedExamples
        };

        const aiMessage: DuelMessage = {
            id: `msg-${Date.now() + 1}`, player: PlayerType.AI, text: response.aiResponseText, score: response.aiScore, explanation: response.aiScoreExplanation,
        };
        
        const newPlayerScore = playerScore + finalPlayerScore;
        const newAiScore = aiScore + response.aiScore;

        setHistory(prev => [...prev.slice(0, -1), updatedUserMessage, aiMessage]);
        setPlayerScore(newPlayerScore);
        setAiScore(newAiScore);
        setIsLoading(false);

        if (response.isGameOver || newPlayerScore >= 100 || newAiScore >= 100) {
            const reason = response.gameOverReason || (newPlayerScore >= 100 ? "Ai atins 100 de puncte!" : "AI-ul a atins 100 de puncte!");
            handleEndDuel(reason);
        } else {
            setInputValue('Eu sunt...');
        }
    };

    const challengeCosts = [1, 3, 10];
    const currentChallengeCost = challengeCosts[challengeCount] || 999;
    const canChallenge = !isLoading && !isGameOver && challengeCount < 3 && playerScore >= currentChallengeCost;

    return (
        <div className="w-full h-[85vh] max-w-4xl flex flex-col glassmorphism rounded-2xl p-4 sm:p-6 fade-in">
            {/* Header with scores: AI on left, Player on right */}
            <div className="flex justify-between items-center pb-4 border-b border-[var(--card-border)]">
                <div className="flex items-center gap-3">
                    <AiIcon className="h-10 w-10 text-purple-500" />
                    <div>
                        <div className="font-bold text-lg text-[var(--text-primary)]">AI</div>
                        <div className="text-xl font-black text-purple-600">{aiScore} puncte</div>
                    </div>
                </div>
                
                <div className="font-bold text-2xl text-[var(--text-accent)]">VS</div>
                
                <div className="flex items-center gap-3">
                    <div className="text-right">
                        <div className="font-bold text-lg text-[var(--text-primary)]">Jucător</div>
                        <div className="text-xl font-black text-blue-600">{playerScore} puncte</div>
                    </div>
                    <PlayerIcon className="h-10 w-10 text-blue-500" />
                </div>
            </div>

            {/* History */}
            <div className="flex-grow my-4 overflow-y-auto pr-2 space-y-6">
                 {history.length === 0 && !isLoading && <div className="flex justify-center items-center h-full text-[var(--text-secondary)]">Începe duelul! Scrie prima ta replică...</div>}
                {history.map((item) => (
                    <MessageCard 
                        key={item.id} 
                        message={item} 
                        onExplainRequest={handleExplainRequest} 
                        onVisualizeRequest={handleVisualizeRequest}
                        onToggleLike={handleToggleLike}
                        onMarkTooComplex={handleMarkTooComplex}
                        tooComplicatedCount={tooComplicatedCount}
                    />
                ))}
                {isLoading && (history.length === 0 || 'player' in history[history.length - 1]) && (
                    <div className="flex items-end gap-3 justify-start fade-in"><AiIcon className="h-8 w-8 text-[var(--text-accent)] p-1.5 bg-gray-400/20 rounded-full" /><div className="p-4 rounded-2xl bg-gray-400/20 rounded-bl-none"><div className="flex items-center gap-2 text-[var(--text-accent)]"><div className="w-2 h-2 bg-[var(--text-accent)] rounded-full animate-pulse"></div><div className="w-2 h-2 bg-[var(--text-accent)] rounded-full animate-pulse [animation-delay:0.2s]"></div><div className="w-2 h-2 bg-[var(--text-accent)] rounded-full animate-pulse [animation-delay:0.4s]"></div></div></div></div>
                )}
                <div ref={historyEndRef} />
            </div>

            {/* Input Form */}
            <div className="pt-4 border-t border-[var(--card-border)]">
                <form onSubmit={handleSubmit} className="flex items-center gap-3">
                    <input type="text" value={inputValue} onChange={(e) => setInputValue(e.target.value)} placeholder={isLoading ? "AI se gândește..." : "Eu sunt..."} disabled={isLoading || isGameOver} className="flex-grow bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg py-3 px-4 text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--input-focus-ring)] transition-all"/>
                    <button type="submit" disabled={isLoading || isGameOver} title="Trimite răspunsul" className="bg-[var(--button-primary-bg)] text-white p-3 rounded-lg hover:bg-[var(--button-primary-hover-bg)] disabled:bg-gray-400/50 disabled:cursor-not-allowed transition-all transform hover:scale-110"><SendIcon className="h-6 w-6" /></button>
                </form>
                <div className="flex justify-between items-center mt-3">
                    <button onClick={() => setIsChallengeModalOpen(true)} disabled={!canChallenge} title={canChallenge ? `Depune o contestație (Cost: ${currentChallengeCost} puncte)`: `Nu poți depune o contestație (Contestații rămase: ${3 - challengeCount}, Puncte necesare: ${currentChallengeCost})`} className="flex items-center gap-2 text-sm text-[var(--text-accent-yellow)] hover:opacity-80 disabled:text-gray-500 disabled:cursor-not-allowed transition-colors">
                        <GavelIcon className="h-4 w-4" />
                        <span>Depun Contestație! ({3-challengeCount}/3)</span>
                    </button>
                    <button onClick={() => handleEndDuel('')} disabled={isLoading || isGameOver} title="Încheie duelul și vezi analiza finală" className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-accent-red)] disabled:opacity-50 transition-colors">Încheie duelul</button>
                </div>
            </div>

            {/* Game Over Modal */}
            {isGameOver && (
                <div className="absolute inset-0 bg-black/70 flex items-center justify-center p-4 z-20 fade-in">
                    <div className="glassmorphism rounded-2xl p-8 max-w-md text-center overflow-y-auto max-h-[80vh]">
                        <h3 className="text-2xl font-bold text-[var(--text-accent)] mb-4">Duel Încheiat!</h3>
                        <p className="text-[var(--text-primary)] mb-6 whitespace-pre-wrap">{gameOverMessage}</p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <button 
                                onClick={onEndDuel} 
                                disabled={isLoading}
                                title={isLoading ? "Așteaptă generarea raportului final" : "Revino la ecranul principal"} 
                                className="bg-[var(--button-primary-bg)] text-white font-bold py-2 px-6 rounded-lg hover:bg-[var(--button-primary-hover-bg)] transition-all disabled:bg-gray-600 disabled:cursor-wait flex items-center justify-center"
                            >
                                {isLoading ? (
                                    <div className="text-center">
                                        <span className="text-lg block">Așteaptă</span>
                                        <span className="text-xs block font-normal opacity-80">Înapoi la Dashboard</span>
                                    </div>
                                ) : (
                                    <span>Înapoi la Dashboard</span>
                                )}
                            </button>
                            <button onClick={handleDownloadReport} disabled={isLoading} title="Salvează o copie a întregului duel" className="bg-green-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors">
                                {isLoading ? 'Așteaptă...' : 'Descarcă Raportul'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            
            {/* Explanation Modal */}
            {(explanationModal.isLoading || explanationModal.content) && (
                <ExplanationModal 
                    isLoading={explanationModal.isLoading} 
                    content={explanationModal.content} 
                    onClose={() => setExplanationModal({ content: '', isLoading: false })} 
                />
            )}

             {/* Image Visualization Modal */}
            {(imageModal.isLoading || imageModal.imageUrl) && (
                <ImageModal
                    isLoading={imageModal.isLoading}
                    imageUrl={imageModal.imageUrl}
                    prompt={imageModal.prompt}
                    onClose={() => setImageModal({ imageUrl: '', prompt: '', isLoading: false })}
                />
            )}

            {/* Challenge Modal */}
            {isChallengeModalOpen && (
                <ChallengeModal 
                    history={history}
                    playerScore={playerScore}
                    challengeCount={challengeCount}
                    onClose={() => setIsChallengeModalOpen(false)}
                    onSubmit={handleSubmitChallenge}
                />
            )}
        </div>
    );
};

export default DuelPage;
