
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useAppContext } from '../context/AppContext';
import { ArrowLeftIcon, PencilIcon, TrashIcon, FunnelIcon, MagnifyingGlassIcon, PlusIcon, ChevronDownIcon, ArrowUpTrayIcon } from './Icons';
import { Card } from '../types';
import CardEditorModal from './CardEditorModal';
import CardCreatorModal from './CardCreatorModal';
import ImportWizardModal from './ImportWizardModal';
import VirtualizedList from './VirtualizedList';
import CardListItem from './CardListItem';

const CardLibraryPage: React.FC = () => {
    const { selectedDeck: deck, goHome, deleteCards, templates } = useAppContext();
    
    const [searchQuery, setSearchQuery] = useState('');
    const [sortOrder, setSortOrder] = useState('default');
    const [isDeleting, setIsDeleting] = useState(false);
    const [selectedCardIds, setSelectedCardIds] = useState<Set<string>>(new Set());
    const [editingCard, setEditingCard] = useState<Card | null>(null);
    const [isCreatingCard, setIsCreatingCard] = useState(false);
    const [isImportWizardOpen, setIsImportWizardOpen] = useState(false);
    const [isSortOpen, setIsSortOpen] = useState(false);
    const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);

    const sortMenuRef = useRef<HTMLDivElement>(null);
    const addMenuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!deck) {
            goHome();
        }
    }, [deck, goHome]);
    
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Node;
            if (sortMenuRef.current && !sortMenuRef.current.contains(target)) {
                setIsSortOpen(false);
            }
            if (addMenuRef.current && !addMenuRef.current.contains(target)) {
                setIsAddMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const displayedCards = useMemo(() => {
        if (!deck) return [];
        let cards = [...deck.cards];

        if (searchQuery.trim() !== '') {
            const lowercasedQuery = searchQuery.toLowerCase();
            cards = cards.filter(card => 
                Object.values(card.fieldValues).some(value => 
                    value.toLowerCase().includes(lowercasedQuery)
                )
            );
        }
        
        if (sortOrder.startsWith('front')) {
            cards.sort((a, b) => {
                // Determine value for Card A
                const tempA = templates.find(t => t.id === a.templateId);
                const firstFieldIdA = tempA?.fields[0]?.id;
                const valA = firstFieldIdA ? (a.fieldValues[firstFieldIdA] || '') : '';

                // Determine value for Card B
                const tempB = templates.find(t => t.id === b.templateId);
                const firstFieldIdB = tempB?.fields[0]?.id;
                const valB = firstFieldIdB ? (b.fieldValues[firstFieldIdB] || '') : '';

                if (sortOrder === 'front-asc') {
                    return valA.localeCompare(valB);
                } else {
                    return valB.localeCompare(valA);
                }
            });
        }

        return cards;
    }, [deck, searchQuery, sortOrder, templates]);

    const handleToggleDeleteMode = () => {
        setIsDeleting(prev => !prev);
        setSelectedCardIds(new Set()); 
    };

    const handleCardSelect = (cardId: string) => {
        setSelectedCardIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(cardId)) {
                newSet.delete(cardId);
            } else {
                newSet.add(cardId);
            }
            return newSet;
        });
    };

    const handleConfirmDelete = () => {
        if (!deck || selectedCardIds.size === 0) return;
        deleteCards(deck.id, Array.from(selectedCardIds));
        setIsDeleting(false);
        setSelectedCardIds(new Set());
    };
    
    const handleSortChange = (order: string) => {
        setSortOrder(order);
        setIsSortOpen(false);
    }
    
    const handleEditCard = (card: Card) => {
        setEditingCard(card);
    }

    if (!deck) {
        return null;
    }
    
    // Calculates height to fill available space inside the App's padded container
    // Mobile (p-4): 100vh - 2rem
    // SM (p-6): 100vh - 3rem
    // LG (p-8): 100vh - 4rem
    const containerClasses = "animate-fade-in flex flex-col h-[calc(100vh-2rem)] sm:h-[calc(100vh-3rem)] lg:h-[calc(100vh-4rem)]";

    return (
        <div className={containerClasses}>
            <div className="flex-shrink-0">
                <header className="flex items-center mb-6">
                    <button 
                        onClick={goHome}
                        className="p-2 mr-4 rounded-full hover:bg-gray-700 transition-colors"
                        aria-label="Go back"
                    >
                        <ArrowLeftIcon className="w-6 h-6" />
                    </button>
                    <h1 className="text-3xl font-bold text-cyan-400">Card Library</h1>
                </header>
                
                <div className="bg-gray-800 rounded-lg p-4 mb-4 shadow-lg">
                     <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
                        <div className="relative w-full sm:w-auto flex-grow">
                             <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                type="search"
                                placeholder={`Search ${deck.cards.length} cards...`}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-gray-700 text-gray-200 rounded-lg pl-10 pr-4 py-2 border-2 border-gray-600 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-colors duration-200 placeholder-gray-400"
                            />
                        </div>
                         <div className="flex items-center gap-2 sm:gap-4">
                            
                            {/* Add Card Dropdown */}
                            <div className="relative" ref={addMenuRef}>
                                <button 
                                    onClick={() => setIsAddMenuOpen(prev => !prev)}
                                    className="flex items-center space-x-2 bg-cyan-600 text-white font-semibold px-3 py-2 rounded-lg hover:bg-cyan-500 transition-colors text-sm"
                                    aria-label="Add new card options"
                                >
                                    <PlusIcon className="w-4 h-4" />
                                    <span>Add Cards</span>
                                    <ChevronDownIcon className="w-3 h-3 ml-1" />
                                </button>
                                {isAddMenuOpen && (
                                    <div className="absolute right-0 mt-2 w-48 bg-gray-700 rounded-md shadow-lg z-20 animate-fade-in-fast py-1">
                                        <button 
                                            onClick={() => { setIsCreatingCard(true); setIsAddMenuOpen(false); }} 
                                            className="w-full text-left flex items-center px-4 py-2 text-sm text-gray-200 hover:bg-gray-600"
                                        >
                                            <PlusIcon className="w-4 h-4 mr-2" /> Create Manually
                                        </button>
                                        <button 
                                            onClick={() => { setIsImportWizardOpen(true); setIsAddMenuOpen(false); }} 
                                            className="w-full text-left flex items-center px-4 py-2 text-sm text-gray-200 hover:bg-gray-600"
                                        >
                                            <ArrowUpTrayIcon className="w-4 h-4 mr-2" /> Import from Excel
                                        </button>
                                    </div>
                                )}
                            </div>

                            <div className="relative" ref={sortMenuRef}>
                                <button 
                                    onClick={() => setIsSortOpen(prev => !prev)}
                                    className="flex items-center space-x-2 bg-gray-700 text-white font-semibold px-3 py-2 rounded-lg hover:bg-gray-600 transition-colors text-sm"
                                    aria-label="Sort cards"
                                >
                                    <FunnelIcon className="w-4 h-4" />
                                    <span>Sort by</span>
                                </button>
                                {isSortOpen && (
                                    <div className="absolute right-0 mt-2 w-56 bg-gray-700 rounded-md shadow-lg z-20 animate-fade-in-fast py-1">
                                        <button onClick={() => handleSortChange('default')} className="w-full text-left block px-4 py-2 text-sm text-gray-200 hover:bg-gray-600">Default Order</button>
                                        <button onClick={() => handleSortChange('front-asc')} className="w-full text-left block px-4 py-2 text-sm text-gray-200 hover:bg-gray-600">First Field (A-Z)</button>
                                        <button onClick={() => handleSortChange('front-desc')} className="w-full text-left block px-4 py-2 text-sm text-gray-200 hover:bg-gray-600">First Field (Z-A)</button>
                                    </div>
                                )}
                            </div>
                            {!isDeleting ? (
                                <button 
                                    onClick={handleToggleDeleteMode}
                                    className="flex items-center space-x-2 bg-red-600 text-white font-semibold px-3 py-2 rounded-lg hover:bg-red-500 transition-colors text-sm"
                                    aria-label="Delete cards"
                                >
                                    <TrashIcon className="w-4 h-4" />
                                    <span>Delete</span>
                                </button>
                            ) : (
                                <div className="flex gap-2">
                                    <button onClick={handleConfirmDelete} disabled={selectedCardIds.size === 0} className="bg-red-600 text-white font-semibold px-3 py-2 rounded-lg hover:bg-red-500 disabled:bg-red-800 disabled:cursor-not-allowed text-sm">
                                        Delete ({selectedCardIds.size})
                                    </button>
                                    <button onClick={handleToggleDeleteMode} className="bg-gray-600 text-white font-semibold px-3 py-2 rounded-lg hover:bg-gray-500 text-sm">
                                        Cancel
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex-grow overflow-hidden bg-gray-900 rounded-lg relative">
                {displayedCards.length > 0 ? (
                    <VirtualizedList
                        itemCount={displayedCards.length}
                        itemHeight={120} 
                        renderItem={({ index, style }) => (
                            <div style={style}>
                                <CardListItem
                                    card={displayedCards[index]}
                                    index={index}
                                    isDeleting={isDeleting}
                                    isSelected={selectedCardIds.has(displayedCards[index].id)}
                                    onSelect={handleCardSelect}
                                    onEdit={handleEditCard}
                                />
                            </div>
                        )}
                    />
                ) : (
                    <div className="text-center py-10 px-6 bg-gray-800 rounded-lg">
                        <p className="text-gray-400">{searchQuery ? "No cards match your search." : "This deck is empty."}</p>
                    </div>
                )}
            </div>
            
            {editingCard && (
                <CardEditorModal
                    card={editingCard}
                    deckId={deck.id}
                    onClose={() => setEditingCard(null)}
                />
            )}
            {isCreatingCard && (
                <CardCreatorModal 
                    deckId={deck.id}
                    onClose={() => setIsCreatingCard(false)}
                />
            )}
            {isImportWizardOpen && (
                <ImportWizardModal
                    deckId={deck.id}
                    onClose={() => setIsImportWizardOpen(false)}
                />
            )}
            <style>{`.animate-fade-in-fast { animation: fadeIn 0.1s ease-out; } @keyframes fadeIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }`}</style>
        </div>
    );
};

export default CardLibraryPage;
