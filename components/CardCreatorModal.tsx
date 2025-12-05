import React, { useState } from 'react';
import { CardTemplate } from '../types';
import { useAppContext } from '../context/AppContext';

interface CardCreatorModalProps {
    deckId: string;
    onClose: () => void;
}

const CardCreatorModal: React.FC<CardCreatorModalProps> = ({ deckId, onClose }) => {
    const { templates, addCard } = useAppContext();
    const [selectedTemplate, setSelectedTemplate] = useState<CardTemplate | null>(null);
    const [fieldValues, setFieldValues] = useState<Record<string, string>>({});

    const handleTemplateSelect = (template: CardTemplate) => {
        setSelectedTemplate(template);
        // Initialize fieldValues for the selected template
        const initialValues: Record<string, string> = {};
        template.fields.forEach(field => {
            initialValues[field.id] = '';
        });
        setFieldValues(initialValues);
    };

    const handleValueChange = (fieldId: string, value: string) => {
        setFieldValues(prev => ({ ...prev, [fieldId]: value }));
    };

    const handleSave = () => {
        if (!selectedTemplate) return;
        
        const newCard = {
            templateId: selectedTemplate.id,
            fieldValues,
        };
        addCard(deckId, newCard);
        onClose();
    };

    return (
        <div 
            className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 animate-fade-in-fast"
            onClick={onClose}
        >
            <div 
                className="bg-gray-800 rounded-lg shadow-2xl p-8 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
            >
                {!selectedTemplate ? (
                    <>
                        <h2 className="text-2xl font-bold mb-6 text-white">Choose a Template</h2>
                        <div className="space-y-3">
                            {templates.map(template => (
                                <button 
                                    key={template.id}
                                    onClick={() => handleTemplateSelect(template)}
                                    className="w-full text-left bg-gray-700 p-4 rounded-lg hover:bg-cyan-800 transition-colors"
                                >
                                    <h3 className="font-semibold text-lg text-white">{template.name}</h3>
                                    <p className="text-sm text-gray-400">{template.fields.map(f => f.name).join(', ')}</p>
                                </button>
                            ))}
                        </div>
                        <div className="mt-8 flex justify-end">
                             <button onClick={onClose} className="bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-gray-500 transition-colors">
                                Cancel
                            </button>
                        </div>
                    </>
                ) : (
                    <>
                        <h2 className="text-2xl font-bold mb-2 text-white">New Card</h2>
                        <p className="text-sm text-gray-400 mb-6">Using template: <span className="font-semibold">{selectedTemplate.name}</span></p>
                        
                        <div className="space-y-4">
                            {selectedTemplate.fields.map(field => (
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

                        <div className="mt-8 flex justify-between">
                             <button 
                                onClick={() => setSelectedTemplate(null)}
                                className="bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-gray-500 transition-colors"
                            >
                                Back
                            </button>
                            <div className="space-x-4">
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
                                    Add Card
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>
             <style>{`.animate-fade-in-fast { animation: fadeIn 0.2s ease-out; } @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }`}</style>
        </div>
    );
};

export default CardCreatorModal;
