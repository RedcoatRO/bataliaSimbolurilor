
import React from 'react';

interface ExplanationModalProps {
  isLoading: boolean;
  content: string;
  onClose: () => void;
}

const ExplanationModal: React.FC<ExplanationModalProps> = ({ isLoading, content, onClose }) => {
  return (
    <div 
        className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-30 fade-in"
        onClick={onClose}
    >
      <div 
        className="bg-[#1C1C2E] border border-purple-500/50 rounded-2xl p-8 max-w-2xl w-full text-left shadow-2xl max-h-[80vh] flex flex-col"
        onClick={e => e.stopPropagation()} // Prevent closing when clicking inside the modal
      >
        <h3 className="text-xl font-bold text-purple-400 mb-4 flex-shrink-0">Explicație</h3>
        <div className="flex-grow overflow-y-auto pr-4">
            {isLoading ? (
                <div className="flex items-center justify-center h-40">
                    <div className="flex items-center gap-2 text-gray-400">
                        <div className="w-3 h-3 bg-purple-400 rounded-full animate-pulse"></div>
                        <div className="w-3 h-3 bg-purple-400 rounded-full animate-pulse [animation-delay:0.2s]"></div>
                        <div className="w-3 h-3 bg-purple-400 rounded-full animate-pulse [animation-delay:0.4s]"></div>
                    </div>
                </div>
            ) : (
                <p className="text-gray-300 whitespace-pre-wrap">{content}</p>
            )}
        </div>
        <div className="mt-6 flex-shrink-0 text-right">
            <button onClick={onClose} className="bg-purple-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-purple-700 transition-colors">
              Am înțeles
            </button>
        </div>
      </div>
    </div>
  );
};

export default ExplanationModal;
