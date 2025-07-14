import React, { useState, useMemo } from 'react';
import type { DuelMessage, HistoryItem } from '../types';
import { PlayerType } from '../types';
import { AiIcon, PlayerIcon } from './Icons';


interface ChallengeModalProps {
    history: HistoryItem[];
    playerScore: number;
    challengeCount: number;
    onClose: () => void;
    onSubmit: (msg1: DuelMessage, msg2: DuelMessage, argument: string, wager: number) => void;
}

const ChallengeModal: React.FC<ChallengeModalProps> = ({ history, playerScore, challengeCount, onClose, onSubmit }) => {
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [argument, setArgument] = useState('');
    const [wager, setWager] = useState(1); // For the 3rd challenge

    // Filter only duel messages from history, as system messages cannot be challenged
    const duelMessages = useMemo(() => history.filter(item => 'player' in item) as DuelMessage[], [history]);

    // Memoize challenge costs and current cost for efficiency
    const { cost, isThirdChallenge, canAfford } = useMemo(() => {
        const costs = [1, 3, wager];
        const currentCost = costs[challengeCount] ?? 999;
        return {
            cost: currentCost,
            isThirdChallenge: challengeCount === 2,
            canAfford: playerScore >= currentCost,
        };
    }, [challengeCount, playerScore, wager]);

    // Handle selecting/deselecting messages
    const handleToggleSelect = (id: string) => {
        setSelectedIds(prev => {
            if (prev.includes(id)) {
                return prev.filter(i => i !== id);
            }
            if (prev.length < 2) {
                return [...prev, id];
            }
            // If 2 are already selected, replace the first one with the new selection
            return [prev[1], id];
        });
    };

    const handleSubmit = () => {
        if (selectedIds.length !== 2 || !canAfford) return;

        const msg1 = duelMessages.find(m => m.id === selectedIds[0]);
        const msg2 = duelMessages.find(m => m.id === selectedIds[1]);
        if (!msg1 || !msg2) return;

        // Ensure msg1 is always the earlier message
        if (parseInt(msg1.id.split('-')[1]) > parseInt(msg2.id.split('-')[1])) {
            onSubmit(msg2, msg1, argument, cost);
        } else {
            onSubmit(msg1, msg2, argument, cost);
        }
    };
    
    const isSubmitDisabled = selectedIds.length !== 2 || !canAfford;

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-30 fade-in" onClick={onClose}>
            <div className="bg-[#1C1C2E] border border-yellow-500/50 rounded-2xl p-6 sm:p-8 max-w-3xl w-full text-left shadow-2xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="flex-shrink-0">
                    <h3 className="text-xl sm:text-2xl font-bold text-yellow-400 mb-2">Depune Contestație</h3>
                    <p className="text-gray-400 mb-4">Selectează exact două mesaje pentru a contesta o repetare a AI-ului sau o "anihilare" neconformă.</p>
                </div>
                
                {/* Messages List */}
                <div className="flex-grow overflow-y-auto pr-4 my-4 border-y border-gray-700 py-4">
                    <div className="space-y-3">
                        {duelMessages.length === 0 && <p className="text-gray-500 text-center">Nu există mesaje de contestat încă.</p>}
                        {duelMessages.map(msg => {
                            const isSelected = selectedIds.includes(msg.id);
                            const isAI = msg.player === PlayerType.AI;
                            return (
                                <div
                                    key={msg.id}
                                    onClick={() => handleToggleSelect(msg.id)}
                                    className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-all border-2 ${
                                        isSelected 
                                        ? 'bg-yellow-400/20 border-yellow-400' 
                                        : 'bg-gray-700/50 border-transparent hover:border-yellow-500/50'
                                    }`}
                                >
                                   {isAI ? <AiIcon className="h-6 w-6 text-purple-400 flex-shrink-0 mt-1" /> : <PlayerIcon className="h-6 w-6 text-blue-400 flex-shrink-0 mt-1" />}
                                   <div className="flex-grow">
                                        <p className="text-white">{msg.text}</p>
                                        <span className="text-xs text-gray-500">{new Date(parseInt(msg.id.split('-')[1])).toLocaleString('ro-RO')}</span>
                                   </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Argument and Wager Section */}
                <div className="flex-shrink-0 space-y-4">
                    <div>
                        <label htmlFor="argument" className="block text-sm font-medium text-gray-300 mb-1">Argument (Opțional)</label>
                        <textarea
                            id="argument"
                            value={argument}
                            onChange={(e) => setArgument(e.target.value)}
                            placeholder="Ex: Răspunsul AI nu anihilează replica mea conform regulilor de 'Transformare'..."
                            className="w-full bg-gray-800 border border-gray-600 rounded-lg py-2 px-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-500 transition-all"
                            rows={2}
                        />
                         <p className="text-xs text-gray-500 mt-1">Un argument bun crește șansele de succes.</p>
                    </div>

                    {isThirdChallenge && (
                        <div>
                            <label htmlFor="wager" className="block text-sm font-medium text-gray-300 mb-1">Alege miza pentru contestația finală (1-10 puncte)</label>
                             <input
                                id="wager"
                                type="range"
                                min="1"
                                max="10"
                                step="1"
                                value={wager}
                                onChange={(e) => setWager(parseInt(e.target.value, 10))}
                                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                            />
                            <p className="text-center font-bold text-white mt-1">{wager} puncte</p>
                        </div>
                    )}
                </div>
                
                {/* Footer and Submit Button */}
                <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                     <div className="text-sm font-bold">
                        <span className="text-gray-300">Cost Contestație: </span>
                        <span className={canAfford ? 'text-yellow-400' : 'text-red-500'}>{cost} puncte</span>
                        <span className="text-gray-400"> (Puncte deținute: {playerScore})</span>
                     </div>
                    <div className="flex gap-4">
                        <button onClick={onClose} className="bg-gray-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-gray-700 transition-colors">Anulează</button>
                        <button 
                            onClick={handleSubmit} 
                            disabled={isSubmitDisabled}
                            title={isSubmitDisabled ? "Trebuie să selectezi 2 mesaje și să ai suficiente puncte" : "Trimite contestația"}
                            className="bg-yellow-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-yellow-700 disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors"
                        >
                            Contestă ({cost}p)
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ChallengeModal;
