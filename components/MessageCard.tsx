
import React, { useState } from 'react';
import type { DuelMessage, ImprovedExample } from '../types';
import { PlayerType } from '../types';
import { PlayerIcon, AiIcon, SparklesIcon, QuestionMarkIcon, LikeIcon, ConfusedIcon } from './Icons';

// Sub-component for showing improved examples
const ImprovedExamples: React.FC<{ examples: ImprovedExample[] }> = ({ examples }) => {
    const [isOpen, setIsOpen] = useState(false);
    if (!examples || examples.length === 0) return null;

    return (
        <div className="mt-2">
            <button onClick={() => setIsOpen(!isOpen)} className="text-purple-400 text-xs font-semibold hover:underline">
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

// Main MessageCard component
interface MessageCardProps {
  message: DuelMessage;
  onExplainRequest: (messageId: string) => void;
  onToggleLike: (messageId: string) => void;
  onMarkTooComplex: (messageId: string) => void;
  tooComplicatedCount: number;
}

const MessageCard: React.FC<MessageCardProps> = ({ message, onExplainRequest, onToggleLike, onMarkTooComplex, tooComplicatedCount }) => {
    const isUser = message.player === PlayerType.USER;
    // Determine if the "Too Complicated" button should be usable for this message
    const canMarkComplex = tooComplicatedCount < 3 && !message.isMarkedTooComplex;

    return (
        <div className={`flex items-start gap-3 ${isUser ? 'justify-end' : 'justify-start'} fade-in`}>
            {!isUser && <div className="flex-shrink-0 pt-1"><AiIcon className="h-8 w-8 text-purple-400 p-1.5 bg-gray-700 rounded-full" /></div>}
            
            <div className="flex flex-col items-start max-w-md md:max-w-lg">
              <div className={`p-4 rounded-2xl ${isUser ? 'bg-purple-600 rounded-br-none' : 'bg-gray-700 rounded-bl-none'}`}>
                  <p className="text-white">{message.text}</p>
                   {message.explanation && (
                      <div className="mt-2 text-xs text-gray-300 italic border-t border-white/10 pt-2">
                          {message.explanation}
                      </div>
                  )}
                  {message.improvedExamples && <ImprovedExamples examples={message.improvedExamples} />}
              </div>
            </div>

             <div className="flex flex-col gap-2 items-center self-start pt-1">
                {message.score !== undefined && <ScoreBadge score={message.score} />}
                {!isUser && (
                    <>
                        <button 
                            onClick={() => onExplainRequest(message.id)} 
                            className="text-gray-400 hover:text-blue-300 transition-colors"
                            aria-label="Explică acest răspuns"
                            title="De unde ai scos asta?"
                        >
                            <QuestionMarkIcon className="h-5 w-5" />
                        </button>
                        <button
                            onClick={() => onToggleLike(message.id)}
                            className={`${message.isLiked ? 'text-green-400' : 'text-gray-400'} hover:text-green-400 transition-colors`}
                            aria-label="Apreciază acest răspuns"
                            title="Îmi place acest răspuns"
                        >
                            <LikeIcon className="h-5 w-5" />
                        </button>
                        <button
                            onClick={() => onMarkTooComplex(message.id)}
                            disabled={!canMarkComplex}
                            className={`text-gray-400 ${canMarkComplex ? 'hover:text-yellow-400' : 'opacity-50 cursor-not-allowed'} transition-colors`}
                            aria-label="Marchează ca fiind prea complicat"
                            title={canMarkComplex ? "Prea complicat pentru mine" : "Limită de 3 atinsă"}
                        >
                            <ConfusedIcon className="h-5 w-5" />
                        </button>
                    </>
                )}
            </div>

            {isUser && <div className="flex-shrink-0 pt-1"><PlayerIcon className="h-8 w-8 text-blue-400 p-1.5 bg-gray-700 rounded-full" /></div>}
        </div>
    );
};

export default MessageCard;