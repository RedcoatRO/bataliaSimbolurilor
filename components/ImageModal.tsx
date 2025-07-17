
import React from 'react';
import { DownloadIcon } from './Icons';

interface ImageModalProps {
  isLoading: boolean;
  imageUrl: string;
  prompt: string;
  onClose: () => void;
}

const ImageModal: React.FC<ImageModalProps> = ({ isLoading, imageUrl, prompt, onClose }) => {
    
  /**
   * Handles the download of the generated image.
   * Creates a temporary anchor element to trigger the browser's download functionality.
   */
  const handleDownload = () => {
    if (!imageUrl || isLoading) return;
    const link = document.createElement('a');
    link.href = imageUrl;
    
    // Creates a user-friendly filename from the prompt text.
    const filename = prompt
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
        .replace(/[\s-]+/g, '-')      // Replace spaces and multiple hyphens with a single one
        .substring(0, 50) + '.jpeg';
    
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
    
  return (
    <div 
        className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-30 fade-in"
        onClick={onClose}
    >
      <div 
        className="glassmorphism rounded-2xl p-6 sm:p-8 max-w-2xl w-full text-left max-h-[90vh] flex flex-col items-center"
        onClick={e => e.stopPropagation()} // Prevent closing when clicking inside the modal
      >
        <h3 className="text-lg font-bold text-[var(--text-accent)] mb-4 flex-shrink-0 text-center">Vizualizare Metaforă</h3>
        <p className="text-sm text-[var(--text-secondary)] italic text-center mb-4 flex-shrink-0">"{prompt}"</p>
        
        <div className="flex-grow w-full flex items-center justify-center bg-black/20 rounded-lg overflow-hidden">
            {isLoading ? (
                <div className="flex flex-col items-center justify-center h-64 text-white">
                    <div className="flex items-center gap-3">
                        <div className="w-4 h-4 bg-white rounded-full animate-pulse"></div>
                        <div className="w-4 h-4 bg-white rounded-full animate-pulse [animation-delay:0.2s]"></div>
                        <div className="w-4 h-4 bg-white rounded-full animate-pulse [animation-delay:0.4s]"></div>
                    </div>
                    <p className="mt-4 text-sm">AI-ul pictează...</p>
                </div>
            ) : (
                <img 
                    src={imageUrl} 
                    alt={`Vizualizare pentru: ${prompt}`} 
                    className="object-contain w-full h-full"
                />
            )}
        </div>
        
        <div className="mt-6 flex-shrink-0 flex flex-col sm:flex-row justify-end items-center gap-4 w-full">
            <button 
                onClick={handleDownload}
                disabled={isLoading || !imageUrl}
                title="Descarcă imaginea"
                className="flex items-center gap-2 bg-green-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
            >
                <DownloadIcon className="h-5 w-5" />
                <span>Descarcă</span>
            </button>
            <button 
              onClick={onClose} 
              className="bg-[var(--button-primary-bg)] text-white font-bold py-2 px-6 rounded-lg hover:bg-[var(--button-primary-hover-bg)] transition-colors"
              title="Închide fereastra"
            >
              Închide
            </button>
        </div>
      </div>
    </div>
  );
};

export default ImageModal;
