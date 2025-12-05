import React from 'react';
import { Card } from '../types';
import CardRenderer from './CardRenderer';
import { PencilIcon, CheckIcon } from './Icons';

interface CardListItemProps {
    card: Card;
    index: number;
    isDeleting: boolean;
    isSelected: boolean;
    onSelect: (cardId: string) => void;
    onEdit: (card: Card) => void;
}

const CardListItem: React.FC<CardListItemProps> = ({ card, index, isDeleting, isSelected, onSelect, onEdit }) => {
    return (
        <div className="p-1 h-full w-full">
            <div 
                className={`bg-gray-800 rounded-lg shadow-sm border px-4 flex items-center gap-4 h-full w-full transition-all duration-200 overflow-hidden ${isSelected ? 'border-cyan-500 bg-gray-800' : 'border-gray-700 hover:bg-gray-750'}`}
                onClick={() => isDeleting && onSelect(card.id)}
            >
                {/* Checkbox / Index Column */}
                <div className="flex-shrink-0 flex items-center justify-center w-8">
                    {isDeleting ? (
                        <div 
                            className={`w-6 h-6 rounded-full border-2 flex items-center justify-center cursor-pointer transition-all duration-200 ${isSelected ? 'border-cyan-500 bg-cyan-500 scale-110' : 'border-gray-500 hover:border-gray-400'}`}
                        >
                            {isSelected && <CheckIcon className="w-4 h-4 text-white stroke-2" />}
                        </div>
                    ) : (
                        <span className="text-cyan-500 font-mono text-sm">{index + 1}.</span>
                    )}
                </div>

                {/* Content Column - Vertically Centered & Clamped */}
                <div className="flex-1 min-w-0 h-full flex items-center py-2">
                    <div className="line-clamp-3 w-full max-h-full overflow-hidden">
                        <CardRenderer card={card} side="front" mode="compact" />
                    </div>
                </div>

                {/* Edit Button Column */}
                {!isDeleting && (
                    <button 
                        onClick={(e) => { e.stopPropagation(); onEdit(card); }} 
                        className="p-2 rounded-full text-gray-400 hover:text-white hover:bg-gray-700 transition-colors flex-shrink-0" 
                        aria-label="Edit card"
                    >
                        <PencilIcon className="w-4 h-4"/>
                    </button>
                )}
            </div>
             <style>{`.line-clamp-3 { display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }`}</style>
        </div>
    );
};

export default React.memo(CardListItem);