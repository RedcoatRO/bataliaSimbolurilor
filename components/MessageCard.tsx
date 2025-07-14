
import React, { useState } from 'react';
import type { DuelMessage, ImprovedExample, SystemMessage, HistoryItem } from '../types';
import { PlayerType } from '../types';
import { PlayerIcon, AiIcon, SparklesIcon, QuestionMarkIcon, LikeIcon, DislikeIcon, GavelIcon } from './Icons';

// Sub-component for showing improved examples
const ImprovedExamples: React.FC<{ examples: ImprovedExample[] }> = ({ examples }) => {
    const [isOpen, setIsOpen] = useState(false);
    if (!examples || examples.length === 0) return null;

    return (
        <div className="mt-2">
            <button 
                onClick={() => setIsOpen(!isOpen)} 
                className="text-purple-400 text-xs font-semibold hover:underline"
                title={isOpen ? 'Ascunde exemplele' : 'Vezi cum puteai răspunde mai bine'}
            >
                {isOpen ? 'Ascunde exemple' : 'Vezi cum puteai răspunde mai bine'}
            </button>
            {isOpen && (
                <div className="mt-2 space-y-2 text-xs text-gray-400 border-l-2 border-purple-400/30 pl-3">
                    {examples.sort((a, b) => a.score - b.score).map(({ score, text }) => (
                        <p key={score}>
                            <span className="font-bold text-yellow-300">Nota {score}:</span> "{text}"
                        </p>
                    ))}
                </div>
            )}
        </div>
    );
};

// Sub-component for the score badge
const ScoreBadge: React.FC<{ score: number }> = ({ score }) => (
    <div className="flex items-center gap-1 bg-yellow-400/10 text-yellow-300 px-2 py-1 rounded-full text-xs font-bold">
        <SparklesIcon className="h-3 w-3" />
        <span>{score}</span>
    </div>
);

// New sub-component for displaying system messages (like challenge results)
const SystemMessageCard: React.FC<{ message: SystemMessage }> = ({ message }) => {
    const borderColor = message.isSuccess ? 'border-green-500/50' : 'border-red-500/50';
    const textColor = message.isSuccess ? 'text-green-400' : 'text-red-400';

    return (
        <div className="my-4 flex justify-center items-center gap-4 text-sm text-gray-400 fade-in">
            <hr className={`flex-grow ${borderColor}`} />
            <div className="flex items-center gap-3 bg-[#1C1C2E] p-3 rounded-xl border ${borderColor}">
                <GavelIcon className={`h-6 w-6 flex-shrink-0 ${textColor}`} />
                <div className="text-left">
                    <p className={`font-bold ${textColor}`}>{message.text}</p>
                    <p className="text-xs text-gray-300">{message.details}</p>
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
  onToggleLike: (messageId: string) => void;
  onMarkTooComplex: (messageId: string) => void;
  tooComplicatedCount: number;
}

const MessageCard: React.FC<MessageCardProps> = ({ message, onExplainRequest, onToggleLike, onMarkTooComplex, tooComplicatedCount }) => {
    // Type guard to render the correct card type
    if (!('player' in message)) {
        return <SystemMessageCard message={message} />;
    }

    const duelMessage = message;
    const isUser = duelMessage.player === PlayerType.USER;
    // Determine if the "Too Complicated" button should be usable for this message
    const canMarkComplex = tooComplicatedCount < 3 && !duelMessage.isMarkedTooComplex;

    return (
        <div className={`flex items-start gap-3 ${isUser ? 'justify-end' : 'justify-start'} fade-in`}>
            {!isUser && <div className="flex-shrink-0 pt-1"><AiIcon className="h-8 w-8 text-purple-400 p-1.5 bg-gray-700 rounded-full" /></div>}
            
            <div className="flex flex-col items-start max-w-md md:max-w-lg">
              <div className={`p-4 rounded-2xl ${isUser ? 'bg-purple-600 rounded-br-none' : 'bg-gray-700 rounded-bl-none'}`}>
                  <p className="text-white">{duelMessage.text}</p>
                   {duelMessage.explanation && (
                      <div className="mt-2 text-xs text-gray-300 italic border-t border-white/10 pt-2">
                          {duelMessage.explanation}
                      </div>
                  )}
                  {duelMessage.improvedExamples && <ImprovedExamples examples={duelMessage.improvedExamples} />}
              </div>
            </div>

             <div className="flex flex-col gap-2 items-center self-start pt-1">
                {duelMessage.score !== undefined && <ScoreBadge score={duelMessage.score} />}
                {!isUser && (
                    <>
                        <button 
                            onClick={() => onExplainRequest(duelMessage.id)} 
                            className="text-gray-400 hover:text-blue-300 transition-colors"
                            aria-label="Explică acest răspuns"
                            title="De unde ai scos asta?"
                        >
                            <QuestionMarkIcon className="h-5 w-5" />
                        </button>
                        <button
                            onClick={() => onToggleLike(duelMessage.id)}
                            className={`${duelMessage.isLiked ? 'text-green-400' : 'text-gray-400'} hover:text-green-400 transition-colors`}
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
                                    ? 'text-gray-400 hover:text-red-500' 
                                    : 'text-gray-400 opacity-50 cursor-not-allowed'
                            }`}
                            aria-label="Marchează ca fiind prea complicat"
                            title={canMarkComplex ? "Prea complicat pentru mine (Dislike)" : `Limită de ${tooComplicatedCount}/3 atinsă`}
                        >
                            <DislikeIcon className="h-5 w-5" />
                        </button>
                    </>
                )}
            </div>

            {isUser && <div className="flex-shrink-0 pt-1"><PlayerIcon className="h-8 w-8 text-blue-400 p-1.5 bg-gray-700 rounded-full" /></div>}
        </div>
    );
};

export default MessageCard;
