import React, { useState } from 'react';
import { Deck } from '../types';
import { useAppContext } from '../context/AppContext';

interface DeckEditorModalProps {
    deck: Deck;
    onClose: () => void;
}

const DeckEditorModal: React.FC<DeckEditorModalProps> = ({ deck, onClose }) => {
    const { updateDeck } = useAppContext();
    const [name, setName] = useState(deck.name);
    const [description, setDescription] = useState(deck.description);

    const handleSave = () => {
        const updatedDeck = { ...deck, name, description };
        updateDeck(updatedDeck);
        onClose();
    };

    return (
        <div 
            className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 animate-fade-in-fast"
            onClick={onClose}
        >
            <div 
                className="bg-gray-800 rounded-lg shadow-2xl p-8 w-full max-w-md mx-4 transform transition-all"
                onClick={(e) => e.stopPropagation()}
            >
                <h2 className="text-2xl font-bold mb-6 text-white">Edit Deck</h2>
                
                <div className="space-y-4">
                    <div>
                        <label htmlFor="deck-name" className="block text-sm font-medium text-gray-400 mb-1">Deck Name</label>
                        <input
                            id="deck-name"
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full bg-gray-700 text-gray-200 rounded-lg px-4 py-2 border-2 border-gray-600 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-colors duration-200 placeholder-gray-400"
                        />
                    </div>
                    <div>
                        <label htmlFor="deck-description" className="block text-sm font-medium text-gray-400 mb-1">Description</label>
                        <textarea
                            id="deck-description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={3}
                            className="w-full bg-gray-700 text-gray-200 rounded-lg px-4 py-2 border-2 border-gray-600 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-colors duration-200 placeholder-gray-400 resize-none"
                        />
                    </div>
                </div>

                <div className="mt-8 flex justify-end space-x-4">
                    <button 
                        onClick={onClose}
                        className="bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-gray-500 transition-colors"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={handleSave}
                        className="bg-cyan-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-cyan-500 transition-colors"
                    >
                        Save Changes
                    </button>
                </div>
            </div>
            <style>{`.animate-fade-in-fast { animation: fadeIn 0.2s ease-out; } @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }`}</style>
        </div>
    );
};

export default DeckEditorModal;