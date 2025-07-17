
import React, { useState } from 'react';
import type { DuelMessage, ImprovedExample, SystemMessage, HistoryItem } from '../types';
import { PlayerType } from '../types';
import { PlayerIcon, AiIcon, SparklesIcon, QuestionMarkIcon, LikeIcon, DislikeIcon, GavelIcon, InfoIcon, PaintBrushIcon } from './Icons';

// Sub-component for showing improved examples
const ImprovedExamples: React.FC<{ examples: ImprovedExample[] }> = ({ examples }) => {
    const [isOpen, setIsOpen] = useState(false);
    if (!examples || examples.length === 0) return null;

    return (
        <div className="mt-2">
            <button 
                onClick={() => setIsOpen(!isOpen)} 
                className="text-[var(--text-accent)] text-xs font-semibold hover:underline"
                title={isOpen ? 'Ascunde exemplele' : 'Vezi cum puteai răspunde mai bine'}
            >
                {isOpen ? 'Ascunde exemple' : 'Vezi cum puteai răspunde mai bine'}
            </button>
            {isOpen && (
                <div className="mt-2 space-y-2 text-xs text-[var(--text-secondary)] border-l-2 border-purple-400/30 pl-3">
                    {examples.sort((a, b) => a.score - b.score).map(({ score, text }) => (
                        <p key={score}>
                            <span className="font-bold text-[var(--text-accent-yellow)]">Nota {score}:</span> "{text}"
                        </p>
                    ))}
                </div>
            )}
        </div>
    );
};

// Sub-component for the score badge
const ScoreBadge: React.FC<{ score: number }> = ({ score }) => (
    <div className="flex items-center gap-1 bg-yellow-400/10 text-[var(--text-accent-yellow)] px-2 py-1 rounded-full text-xs font-bold">
        <SparklesIcon className="h-3 w-3" />
        <span>{score}</span>
    </div>
);

// Sub-component for displaying system messages, now with conditional styling
const SystemMessageCard: React.FC<{ message: SystemMessage }> = ({ message }) => {
    const isChallenge = message.text.toLowerCase().includes('contestație');
    
    // Define styles based on message type (Challenge vs. Info)
    const icon = isChallenge ? <GavelIcon className="h-6 w-6 flex-shrink-0" /> : <InfoIcon className="h-6 w-6 flex-shrink-0" />;
    const borderColor = isChallenge
        ? (message.isSuccess ? 'border-green-500/50' : 'border-red-500/50')
        : 'border-blue-500/50';
    const textColor = isChallenge 
        ? (message.isSuccess ? 'text-[var(--text-accent-green)]' : 'text-[var(--text-accent-red)]')
        : 'text-blue-400';

    return (
        <div className="my-4 flex justify-center items-center gap-4 text-sm text-[var(--text-secondary)] fade-in">
            <hr className={`flex-grow ${borderColor}`} />
            <div className={`flex items-center gap-3 glassmorphism p-3 rounded-xl border ${borderColor} ${textColor}`}>
                {icon}
                <div className="text-left">
                    <p className="font-bold">{message.text}</p>
                    <p className="text-xs text-[var(--text-secondary)]">{message.details}</p>
                </div>
            </div>
            <hr className={`flex-grow ${borderColor}`} />
        </div>
    );
};


// Main MessageCard component, now handles both DuelMessage and SystemMessage
interface MessageCardProps {
  message: HistoryItem;
  onExplainRequest: (messageId: string) => void;
  onVisualizeRequest: (messageId: string) => void;
  onToggleLike: (messageId: string) => void;
  onMarkTooComplex: (messageId: string) => void;
  tooComplicatedCount: number;
}

const MessageCard: React.FC<MessageCardProps> = ({ message, onExplainRequest, onVisualizeRequest, onToggleLike, onMarkTooComplex, tooComplicatedCount }) => {
    // Type guard to render the correct card type
    if (!('player' in message)) {
        return <SystemMessageCard message={message} />;
    }

    const duelMessage = message;
    const isUser = duelMessage.player === PlayerType.USER;
    // Allow up to 3 "dislike" clicks. The 4th will be disabled.
    const canMarkComplex = tooComplicatedCount < 3 && !duelMessage.isMarkedTooComplex;
    // Lowered the score requirement to allow visualization for notes 7 and 8.
    const canVisualize = duelMessage.score !== undefined && duelMessage.score >= 7;
    
    const userCardClass = 'bg-purple-600 text-white rounded-br-none';
    const aiCardClass = 'bg-gray-400/20 text-[var(--text-primary)] rounded-bl-none';
    const iconBgClass = 'bg-gray-400/20';

    return (
        <div className={`flex items-start gap-3 ${isUser ? 'justify-end' : 'justify-start'} fade-in`}>
            {!isUser && <div className="flex-shrink-0 pt-1"><AiIcon className={`h-8 w-8 text-purple-500 p-1.5 ${iconBgClass} rounded-full`} /></div>}
            
            <div className="flex flex-col items-start max-w-md md:max-w-lg">
              <div className={`p-4 rounded-2xl ${isUser ? userCardClass : aiCardClass}`}>
                  <p>{duelMessage.text}</p>
                   {duelMessage.explanation && (
                      <div className={`mt-2 text-xs ${isUser ? 'text-purple-200' : 'text-[var(--text-secondary)]'} italic border-t ${isUser ? 'border-white/20' : 'border-black/10'} pt-2`}>
                          {duelMessage.explanation}
                      </div>
                  )}
                  {duelMessage.improvedExamples && <ImprovedExamples examples={duelMessage.improvedExamples} />}
              </div>
            </div>

             <div className="flex flex-col gap-2 items-center self-start pt-1 text-[var(--text-secondary)]">
                {duelMessage.score !== undefined && <ScoreBadge score={duelMessage.score} />}
                
                 {/* Action buttons for both User and AI messages with high scores */}
                {canVisualize && (
                     <button 
                        onClick={() => onVisualizeRequest(duelMessage.id)} 
                        className={`${duelMessage.generatedImage ? 'text-teal-500' : ''} hover:text-teal-400 transition-colors`}
                        aria-label="Vizualizează această metaforă"
                        title="Generează o imagine pentru această replică"
                    >
                        <PaintBrushIcon className="h-5 w-5" />
                    </button>
                )}

                {!isUser && (
                    <>
                        <button 
                            onClick={() => onExplainRequest(duelMessage.id)} 
                            className="hover:text-blue-500 transition-colors"
                            aria-label="Explică acest răspuns"
                            title="De unde ai scos asta?"
                        >
                            <QuestionMarkIcon className="h-5 w-5" />
                        </button>
                        <button
                            onClick={() => onToggleLike(duelMessage.id)}
                            className={`${duelMessage.isLiked ? 'text-green-500' : ''} hover:text-green-500 transition-colors`}
                            aria-label="Apreciază acest răspuns"
                            title="Îmi place acest răspuns (Like)"
                        >
                            <LikeIcon className="h-5 w-5" />
                        </button>
                        <button
                            onClick={() => onMarkTooComplex(duelMessage.id)}
                            disabled={!canMarkComplex}
                            className={`transition-colors ${
                                duelMessage.isMarkedTooComplex 
                                ? 'text-red-500' 
                                : canMarkComplex 
                                    ? 'hover:text-red-500' 
                                    : 'opacity-50 cursor-not-allowed'
                            }`}
                            aria-label="Marchează ca fiind prea complicat"
                            title={canMarkComplex ? "Prea complicat pentru mine (Dislike)" : `Limită de ${tooComplicatedCount}/3 atinsă`}
                        >
                            <DislikeIcon className="h-5 w-5" />
                        </button>
                    </>
                )}
            </div>

            {isUser && <div className="flex-shrink-0 pt-1"><PlayerIcon className={`h-8 w-8 text-blue-500 p-1.5 ${iconBgClass} rounded-full`} /></div>}
        </div>
    );
};

export default MessageCard;
