
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { getAiDuelResponse, getPostGameAnalysis, getExplanationForResponse } from '../services/geminiService';
import type { DuelMessage, DuelSettings } from '../types';
import { PlayerType } from '../types';
import { PlayerIcon, AiIcon, SendIcon } from './Icons';
import MessageCard from './MessageCard';
import ExplanationModal from './ExplanationModal';

interface DuelPageProps {
  settings: DuelSettings;
  onEndDuel: () => void;
}

const DIFFICULTY_LABELS = ["Copil (9-10 ani)", "Începător", "Mediu", "Avansat", "Expert"];

const DuelPage: React.FC<DuelPageProps> = ({ settings, onEndDuel }) => {
    const [history, setHistory] = useState<DuelMessage[]>([]);
    const [inputValue, setInputValue] = useState('Eu sunt...');
    const [isLoading, setIsLoading] = useState(false);
    const [playerScore, setPlayerScore] = useState(0);
    const [aiScore, setAiScore] = useState(0);
    const [isGameOver, setIsGameOver] = useState(false);
    const [gameOverMessage, setGameOverMessage] = useState('');
    const [explanationModal, setExplanationModal] = useState<{ content: string, isLoading: boolean }>({ content: '', isLoading: false });
    const [tooComplicatedCount, setTooComplicatedCount] = useState(0);
    
    const historyEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        historyEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [history, isLoading]);

    // Handles the request for a detailed explanation of an AI message
    const handleExplainRequest = useCallback(async (messageId: string) => {
        const messageToExplain = history.find(m => m.id === messageId);
        if (!messageToExplain) return;

        setExplanationModal({ content: '', isLoading: true });
        const explanation = await getExplanationForResponse(messageToExplain.text, settings.difficulty);
        setExplanationModal({ content: explanation, isLoading: false });
    }, [history, settings.difficulty]);

    // Handles toggling the "Like" state for a message
    const handleToggleLike = useCallback((messageId: string) => {
        setHistory(prev => prev.map(msg => 
            msg.id === messageId ? { ...msg, isLiked: !msg.isLiked } : msg
        ));
    }, []);

    // Handles marking a message as "Too Complicated"
    const handleMarkTooComplex = useCallback((messageId: string) => {
        if (tooComplicatedCount >= 3) return; // Enforce limit

        setHistory(prev => prev.map(msg =>
            msg.id === messageId ? { ...msg, isMarkedTooComplex: true } : msg
        ));
        setTooComplicatedCount(prev => prev + 1);
    }, [tooComplicatedCount]);

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

    // Generates a comprehensive text report of the duel for download
    const handleDownloadReport = useCallback(() => {
        const reportParts: string[] = [];
        reportParts.push(" Duelul Ideilor - Raport Final ");
        reportParts.push("=".repeat(40));
        reportParts.push(`\nNivel Dificultate: ${DIFFICULTY_LABELS[settings.difficulty - 1]}`);
        reportParts.push(`Subiecte Excluse: ${settings.excludedTopics.join(', ') || 'Niciunul'}`);
        reportParts.push(`Scor Final: Jucător ${playerScore} - ${aiScore} AI\n`);
        reportParts.push("=".repeat(40));
        reportParts.push(" Istoric Conversație ");
        reportParts.push("=".repeat(40) + '\n');

        history.forEach(msg => {
            const timestamp = new Date(parseInt(msg.id.split('-')[1])).toLocaleString('ro-RO');
            reportParts.push(`[${msg.player}] - ${timestamp}`);
            if(msg.score !== undefined) reportParts.push(`   Scor: ${msg.score}`);
            if(msg.isLiked) reportParts.push(`   [APRECIAT]`);
            if(msg.isMarkedTooComplex) reportParts.push(`   [PREA COMPLICAT]`);
            reportParts.push(`   Text: ${msg.text}`);
            if(msg.explanation) reportParts.push(`   Explicație Scor: ${msg.explanation}`);
            if(msg.improvedExamples && msg.improvedExamples.length > 0) {
                reportParts.push(`   Exemple Îmbunătățite:`);
                msg.improvedExamples.forEach(ex => {
                    reportParts.push(`     - Nota ${ex.score}: "${ex.text}"`);
                });
            }
            reportParts.push('\n' + '-'.repeat(30) + '\n');
        });

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
    }, [history, settings, playerScore, aiScore, gameOverMessage]);

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

        const response = await getAiDuelResponse(currentHistory, playerScore, aiScore, settings);
        
        const updatedUserMessage: DuelMessage = {
            ...userMessage, score: response.playerScore, explanation: response.playerScoreExplanation, improvedExamples: response.playerImprovedExamples
        };

        const aiMessage: DuelMessage = {
            id: `msg-${Date.now() + 1}`, player: PlayerType.AI, text: response.aiResponseText, score: response.aiScore, explanation: response.aiScoreExplanation,
        };
        
        const newPlayerScore = playerScore + response.playerScore;
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

    return (
        <div className="w-full h-[85vh] max-w-4xl flex flex-col bg-[#1C1C2E] rounded-2xl shadow-2xl shadow-purple-500/10 border border-purple-500/20 p-4 sm:p-6 fade-in">
            {/* Header */}
            <div className="flex justify-between items-center pb-4 border-b border-gray-700">
                <div className="flex items-center gap-3"><PlayerIcon className="h-10 w-10 text-blue-300" /><div><div className="font-bold text-lg">Jucător</div><div className="text-xl font-black text-blue-400">{playerScore} puncte</div></div></div>
                <div className="font-bold text-2xl text-purple-400">VS</div>
                <div className="flex items-center gap-3 text-right"><div><div className="font-bold text-lg">AI</div><div className="text-xl font-black text-purple-400">{aiScore} puncte</div></div><AiIcon className="h-10 w-10 text-purple-300" /></div>
            </div>

            {/* History */}
            <div className="flex-grow my-4 overflow-y-auto pr-2 space-y-6">
                 {history.length === 0 && !isLoading && <div className="flex justify-center items-center h-full text-gray-500">Începe duelul! Scrie prima ta replică...</div>}
                {history.map((msg) => (
                    <MessageCard 
                        key={msg.id} 
                        message={msg} 
                        onExplainRequest={handleExplainRequest} 
                        onToggleLike={handleToggleLike}
                        onMarkTooComplex={handleMarkTooComplex}
                        tooComplicatedCount={tooComplicatedCount}
                    />
                ))}
                {isLoading && history[history.length - 1]?.player === PlayerType.USER && (
                    <div className="flex items-end gap-3 justify-start fade-in"><AiIcon className="h-8 w-8 text-purple-400 p-1.5 bg-gray-700 rounded-full" /><div className="p-4 rounded-2xl bg-gray-700 rounded-bl-none"><div className="flex items-center gap-2 text-gray-400"><div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div><div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse [animation-delay:0.2s]"></div><div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse [animation-delay:0.4s]"></div></div></div></div>
                )}
                <div ref={historyEndRef} />
            </div>

            {/* Input Form */}
            <div className="pt-4 border-t border-gray-700">
                <form onSubmit={handleSubmit} className="flex items-center gap-3">
                    <input type="text" value={inputValue} onChange={(e) => setInputValue(e.target.value)} placeholder={isLoading ? "AI se gândește..." : "Eu sunt..."} disabled={isLoading || isGameOver} className="flex-grow bg-gray-800 border border-gray-600 rounded-lg py-3 px-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"/>
                    <button type="submit" disabled={isLoading || isGameOver} className="bg-purple-600 text-white p-3 rounded-lg hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-all transform hover:scale-110"><SendIcon className="h-6 w-6" /></button>
                </form>
                <button onClick={() => handleEndDuel('')} disabled={isLoading || isGameOver} className="w-full mt-3 text-sm text-gray-400 hover:text-red-400 disabled:opacity-50 transition-colors">Încheie duelul</button>
            </div>

            {/* Game Over Modal */}
            {isGameOver && (
                <div className="absolute inset-0 bg-black/70 flex items-center justify-center p-4 z-20 fade-in">
                    <div className="bg-[#1C1C2E] border border-purple-500/50 rounded-2xl p-8 max-w-md text-center shadow-2xl overflow-y-auto max-h-[80vh]">
                        <h3 className="text-2xl font-bold text-purple-400 mb-4">Duel Încheiat!</h3>
                        <p className="text-gray-300 mb-6 whitespace-pre-wrap">{gameOverMessage}</p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <button onClick={onEndDuel} className="bg-purple-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-purple-700 transition-colors">Înapoi la Dashboard</button>
                            <button onClick={handleDownloadReport} disabled={isLoading} className="bg-green-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors">
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
        </div>
    );
};

export default DuelPage;