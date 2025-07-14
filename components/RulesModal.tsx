
import React from 'react';

// Props for the modal component
interface RulesModalProps {
  onClose: () => void;
}

// Data for the rules, transcribed from the images
const responseConstructionRules = [
    { type: '🔥 Dominare fizică', description: 'Învinge prin acțiune directă sau putere', example: '„Eu sunt focul.” → „Eu sunt ploaia care te stinge.”' },
    { type: '🧠 Contrazicere logică', description: 'Anulează sensul sau funcția logică', example: '„Eu sunt tăcerea.” → „Eu sunt sunetul care o rupe.”' },
    { type: '🎭 Contrar simbolic', description: 'Exprimă un opus conceptual sau emoțional', example: '„Eu sunt frica.” → „Eu sunt curajul care o dizolvă.”' },
    { type: '🌀 Absorbție / adaptare', description: 'Se transformă în ceva care neutralizează', example: '„Eu sunt gheața.” → „Eu sunt soarele care te topește.”' },
    { type: '📜 Evoluție filozofică', description: 'Adaugă profunzime prin transformare și reflecție', example: '„Eu sunt uitarea.” → „Eu sunt amintirea care persistă.”' },
];

const relationshipTypes = [
    { type: '🔨 Anularea forței', description: 'Un element care neutralizează forța/opțiunea precedentă', example: '„Eu sunt focul.” → „Eu sunt ploaia.”' },
    { type: '♻️ Transformarea', description: 'Răspunsul provoacă o schimbare în forma anterioară', example: '„Eu sunt timpul.” → „Eu sunt moartea care îl oprește.”' },
    { type: '🧩 Oglindirea inversă', description: 'Se opune într-un mod abstract sau simbolic', example: '„Eu sunt întunericul.” → „Eu sunt lumina speranței.”' },
    { type: '📐 Depășirea prin sens', description: 'Nu anulează direct, ci se așază deasupra ca sens final', example: '„Eu sunt războiul.” → „Eu sunt iertarea care îl oprește.”' },
    { type: '🧲 Absorbție și dominare', description: '„Înghite” forma precedentă și o face inutilă', example: '„Eu sunt frica.” → „Eu sunt înțelepciunea care o transformă.”' },
];

const invalidResponses = [
    "Este exact aceeași formă (copiat)",
    "Nu are nicio relație logică sau simbolică cu afirmația precedentă",
    "Este vag, gol de sens („Eu sunt totul.”)",
    "Este o negație plată fără soluție simbolică („Eu nu sunt frica.”)",
    "Este doar o reacție emoțională fără metaforă sau imagine",
];

// Sub-component for a section of the rules
const RulesSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="mb-6">
        <h4 className="text-lg font-bold text-[var(--text-accent)] mb-3 border-b-2 border-[var(--text-accent)] pb-1">
            {title}
        </h4>
        {children}
    </div>
);

// The main modal component
const RulesModal: React.FC<RulesModalProps> = ({ onClose }) => {
  return (
    <div 
        className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-40 fade-in"
        onClick={onClose}
    >
      <div 
        className="glassmorphism rounded-2xl p-6 sm:p-8 max-w-4xl w-full text-left max-h-[90vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <h3 className="text-2xl font-bold text-[var(--text-accent)] mb-4 flex-shrink-0">Regulament "Duelul Ideilor"</h3>
        
        <div className="flex-grow overflow-y-auto pr-4 text-[var(--text-secondary)]">
            
            <RulesSection title="Reguli de Bază ale Construcției Răspunsurilor">
                <div className="space-y-3">
                    {responseConstructionRules.map(rule => (
                        <div key={rule.type}>
                            <p className="font-semibold text-[var(--text-primary)]">{rule.type}</p>
                            <p className="text-sm italic ml-2">{rule.description}</p>
                            <p className="text-sm ml-2">{rule.example}</p>
                        </div>
                    ))}
                </div>
            </RulesSection>

            <RulesSection title="Structura unei Rânduri de Joc">
                <h5 className="font-semibold text-[var(--text-primary)] mb-2">▶️ PASUL 1: PRIMA ALEGERE („Declarația inițială”)</h5>
                <p className="mb-1 ml-2">Trebuie să fie:</p>
                <ul className="list-disc list-inside ml-4 text-sm space-y-1">
                    <li>clară</li>
                    <li>imaginativă</li>
                    <li>exprimată la persoana I: „Eu sunt…”</li>
                </ul>
                <p className="mt-2 mb-1 ml-2">Poate fi:</p>
                 <ul className="list-disc list-inside ml-4 text-sm space-y-1">
                    <li>un obiect: „Eu sunt o sabie.”</li>
                    <li>un fenomen: „Eu sunt focul de pe munte.”</li>
                    <li>o emoție: „Eu sunt furia care rupe tăceri.”</li>
                    <li>o ființă imaginară: „Eu sunt un dragon de lumină.”</li>
                </ul>
                <h5 className="font-semibold text-[var(--text-primary)] mt-4 mb-2">▶️ PASUL 2: RĂSPUNSUL</h5>
                <ul className="list-disc list-inside ml-4 text-sm space-y-1">
                    <li>Se formulează tot ca: „Eu sunt…” + forma care învinge simbolic.</li>
                    <li>Răspunsul trebuie să respecte una dintre relațiile de mai jos:</li>
                </ul>
            </RulesSection>

            <RulesSection title="Tipuri de Raporturi între Declarație și Răspuns">
                 <div className="space-y-3">
                    {relationshipTypes.map(rule => (
                        <div key={rule.type}>
                            <p className="font-semibold text-[var(--text-primary)]">{rule.type}</p>
                            <p className="text-sm italic ml-2">{rule.description}</p>
                            <p className="text-sm ml-2">{rule.example}</p>
                        </div>
                    ))}
                </div>
            </RulesSection>

             <RulesSection title="Răspunsuri Invalide (pentru AI și jucători)">
                <p className="mb-2">Un răspuns este considerat invalid dacă:</p>
                <ul className="list-disc list-inside ml-4 text-sm space-y-1">
                    {invalidResponses.map(rule => <li key={rule}>{rule}</li>)}
                </ul>
            </RulesSection>

        </div>
        
        <div className="mt-6 flex-shrink-0 text-right">
            <button 
              onClick={onClose} 
              className="bg-[var(--button-primary-bg)] text-white font-bold py-2 px-6 rounded-lg hover:bg-[var(--button-primary-hover-bg)] transition-colors"
              title="Închide fereastra de regulament"
            >
              Am înțeles
            </button>
        </div>
      </div>
    </div>
  );
};

export default RulesModal;
