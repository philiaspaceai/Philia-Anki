import React, { useState, useEffect } from 'react';
import { Card, CardTemplate } from '../types';
import { useAppContext } from '../context/AppContext';

interface CardEditorModalProps {
    card: Card;
    deckId: string;
    onClose: () => void;
}

const CardEditorModal: React.FC<CardEditorModalProps> = ({ card, deckId, onClose }) => {
    const { updateCard, templates } = useAppContext();
    const [fieldValues, setFieldValues] = useState<Record<string, string>>(card.fieldValues);
    const [template, setTemplate] = useState<CardTemplate | null>(null);

    useEffect(() => {
        const foundTemplate = templates.find(t => t.id === card.templateId);
        setTemplate(foundTemplate || null);
    }, [card, templates]);

    const handleValueChange = (fieldId: string, value: string) => {
        setFieldValues(prev => ({ ...prev, [fieldId]: value }));
    };

    const handleSave = () => {
        const updatedCard = { ...card, fieldValues };
        updateCard(deckId, updatedCard);
        onClose();
    };

    if (!template) {
        // Handle case where template might not be found yet or is invalid
        return null; 
    }

    return (
        <div 
            className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 animate-fade-in-fast"
            onClick={onClose}
        >
            <div 
                className="bg-gray-800 rounded-lg shadow-2xl p-8 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
            >
                <h2 className="text-2xl font-bold mb-2 text-white">Edit Card</h2>
                <p className="text-sm text-gray-400 mb-6">Using template: <span className="font-semibold">{template.name}</span></p>
                
                <div className="space-y-4">
                    {template.fields.map(field => (
                        <div key={field.id}>
                            <label htmlFor={`card-field-${field.id}`} className="block text-sm font-medium text-gray-400 mb-1">{field.name}</label>
                            <textarea
                                id={`card-field-${field.id}`}
                                value={fieldValues[field.id] || ''}
                                onChange={(e) => handleValueChange(field.id, e.target.value)}
                                rows={3}
                                className="w-full bg-gray-700 text-gray-200 rounded-lg px-4 py-2 border-2 border-gray-600 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-colors duration-200 placeholder-gray-400 resize-none"
                            />
                        </div>
                    ))}
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

export default CardEditorModal;