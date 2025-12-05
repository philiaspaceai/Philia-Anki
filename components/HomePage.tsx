import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import { Page, Deck, State } from '../types';
import { CogIcon, BookOpenIcon, RectangleStackIcon, EllipsisVerticalIcon, PencilIcon, FunnelIcon, PlusIcon, WrenchScrewdriverIcon, BrainIcon } from './Icons';
import DeckEditorModal from './DeckEditorModal';
import DeckSettingModal from './DeckSettingModal';

const NewDeckModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const { addDeck } = useAppContext();
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');

    const handleCreate = () => {
        if (name.trim()) {
            addDeck(name, description);
            onClose();
        }
    };

    return (
        <div 
            className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 animate-fade-in-fast"
            onClick={onClose}
        >
            <div 
                className="bg-gray-800 rounded-lg shadow-2xl p-8 w-full max-w-md mx-4"
                onClick={(e) => e.stopPropagation()}
            >
                <h2 className="text-2xl font-bold mb-6 text-white">Create New Deck</h2>
                <div className="space-y-4">
                    <div>
                        <label htmlFor="new-deck-name" className="block text-sm font-medium text-gray-400 mb-1">Deck Name</label>
                        <input
                            id="new-deck-name"
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g., Japanese Vocabulary"
                            className="w-full bg-gray-700 text-gray-200 rounded-lg px-4 py-2 border-2 border-gray-600 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-colors duration-200 placeholder-gray-400"
                        />
                    </div>
                    <div>
                        <label htmlFor="new-deck-description" className="block text-sm font-medium text-gray-400 mb-1">Description</label>
                        <textarea
                            id="new-deck-description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={3}
                            placeholder="A short description of your new deck"
                            className="w-full bg-gray-700 text-gray-200 rounded-lg px-4 py-2 border-2 border-gray-600 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-colors duration-200 placeholder-gray-400 resize-none"
                        />
                    </div>
                </div>
                <div className="mt-8 flex justify-end space-x-4">
                    <button onClick={onClose} className="bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-gray-500 transition-colors">
                        Cancel
                    </button>
                    <button onClick={handleCreate} className="bg-cyan-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-cyan-500 transition-colors">
                        Create Deck
                    </button>
                </div>
            </div>
        </div>
    );
};


const HomePage: React.FC = () => {
    const { decks, navigateTo, selectDeckAndNavigate } = useAppContext();
    const [openMenuDeckId, setOpenMenuDeckId] = useState<string | null>(null);
    const [editingDeck, setEditingDeck] = useState<Deck | null>(null);
    const [settingDeck, setSettingDeck] = useState<Deck | null>(null);
    const [isSortOpen, setIsSortOpen] = useState(false);
    const [isNewDeckModalOpen, setIsNewDeckModalOpen] = useState(false);
    const [sortOption, setSortOption] = useState<'newest' | 'name-asc' | 'name-desc'>('newest');
    
    const deckMenuRef = useRef<HTMLDivElement>(null);
    const sortMenuRef = useRef<HTMLDivElement>(null);

    const toggleMenu = (deckId: string) => {
        setOpenMenuDeckId(prevId => (prevId === deckId ? null : deckId));
    };

    const handleEditClick = (deck: Deck) => {
        setEditingDeck(deck);
        setOpenMenuDeckId(null);
    };

    const handleSettingsClick = (deck: Deck) => {
        setSettingDeck(deck);
        setOpenMenuDeckId(null);
    };

    const handleLibraryClick = (deck: Deck) => {
        selectDeckAndNavigate(deck, Page.CardLibrary);
        setOpenMenuDeckId(null);
    };
    
    const handleSortChange = (option: 'newest' | 'name-asc' | 'name-desc') => {
        setSortOption(option);
        setIsSortOpen(false);
    };

    const sortedDecks = useMemo(() => {
        const sorted = [...decks];
        switch (sortOption) {
            case 'name-asc':
                return sorted.sort((a, b) => a.name.localeCompare(b.name));
            case 'name-desc':
                return sorted.sort((a, b) => b.name.localeCompare(a.name));
            case 'newest':
            default:
                // Assuming decks from context are already in insertion order (newest first)
                return sorted;
        }
    }, [decks, sortOption]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Node;
            if (deckMenuRef.current && !deckMenuRef.current.contains(target)) {
                setOpenMenuDeckId(null);
            }
            if (sortMenuRef.current && !sortMenuRef.current.contains(target)) {
                setIsSortOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    return (
        <div className="animate-fade-in">
            <header className="flex items-center justify-between mb-4">
                <button 
                    onClick={() => navigateTo(Page.Settings)}
                    className="p-2 rounded-full hover:bg-gray-700 transition-colors"
                    aria-label="Settings"
                >
                    <CogIcon className="w-7 h-7" />
                </button>
                
                <div className="flex space-x-2">
                     <button 
                        onClick={() => navigateTo(Page.Stats)}
                        className="p-2 rounded-full hover:bg-gray-700 transition-colors text-cyan-400"
                        aria-label="Brain Stats"
                        title="Brain Stats"
                    >
                        <BrainIcon className="w-7 h-7" />
                    </button>

                     <button 
                        onClick={() => navigateTo(Page.TemplateLibrary)}
                        className="p-2 rounded-full hover:bg-gray-700 transition-colors"
                        aria-label="Template Library"
                        title="Template Library"
                    >
                        <RectangleStackIcon className="w-7 h-7" />
                    </button>
                </div>
            </header>

            <div className="text-center my-12">
                <h1 className="text-5xl font-bold text-cyan-400">
                    Philia Anki
                </h1>
                <p className="text-xl text-gray-400 mt-2 font-light">
                    Your memorizing partner.
                </p>
            </div>

            <div className="flex justify-between items-center mb-6">
                <div className="relative" ref={sortMenuRef}>
                    <button 
                        onClick={() => setIsSortOpen(prev => !prev)}
                        className="flex items-center space-x-2 bg-gray-700 text-gray-200 px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
                        aria-label="Sort decks"
                    >
                        <FunnelIcon className="w-5 h-5" />
                        <span>Sort by</span>
                    </button>
                    {isSortOpen && (
                        <div className="absolute left-0 mt-2 w-56 bg-gray-700 rounded-md shadow-lg z-10 animate-fade-in-fast py-1 flex flex-col">
                            <button onClick={() => handleSortChange('name-asc')} className="text-left px-4 py-2 text-sm text-gray-200 hover:bg-gray-600 w-full">Sort by Name (A-Z)</button>
                            <button onClick={() => handleSortChange('name-desc')} className="text-left px-4 py-2 text-sm text-gray-200 hover:bg-gray-600 w-full">Sort by Name (Z-A)</button>
                            <button onClick={() => handleSortChange('newest')} className="text-left px-4 py-2 text-sm text-gray-200 hover:bg-gray-600 w-full">Sort by Date Created</button>
                        </div>
                    )}
                </div>

                <button 
                    onClick={() => setIsNewDeckModalOpen(true)}
                    className="flex items-center space-x-2 bg-cyan-600 text-white font-semibold px-4 py-2 rounded-lg hover:bg-cyan-500 transition-colors"
                    aria-label="Add new deck"
                >
                    <PlusIcon className="w-5 h-5" />
                    <span>New Deck</span>
                </button>
            </div>
            
            {sortedDecks.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {sortedDecks.map(deck => {
                        const now = new Date();
                        const startOfDay = new Date();
                        startOfDay.setHours(0, 0, 0, 0);

                        // --- NEW COUNT LOGIC ---
                        const totalNewCards = deck.cards.filter(c => c.state === State.New).length;
                        
                        // Count how many new cards were already introduced (studied) today
                        const newCardsIntroducedToday = deck.cards.filter(c => {
                            const firstLog = c.review_logs[0];
                            return firstLog && new Date(firstLog.review) >= startOfDay;
                        }).length;

                        // Remaining limit for today
                        const remainingNewLimit = Math.max(0, deck.settings.newCardsPerDay - newCardsIntroducedToday);
                        
                        // Display count is the lesser of what exists and what is allowed
                        const displayNewCount = Math.min(totalNewCards, remainingNewLimit);


                        // --- REVIEW COUNT LOGIC ---
                        // We count cards due today (including Learning steps)
                        const reviewCount = deck.cards.filter(c => 
                            (c.state === State.Review || c.state === State.Relearning || c.state === State.Learning) && 
                            new Date(c.due) <= now
                        ).length;

                        // Determine if the study button should be disabled
                        const isStudyButtonDisabled = (displayNewCount === 0 && reviewCount === 0);

                        return (
                            <div key={deck.id} className="bg-gray-800 rounded-lg shadow-lg p-6 flex items-center justify-between hover:shadow-cyan-500/20 hover:border-cyan-500 border-2 border-transparent transition-all duration-300">
                                <div className="flex-1 mr-4 min-w-0">
                                    <h3 className="text-xl font-bold mb-1 text-white">{deck.name}</h3>
                                    <div className="min-w-0">
                                        <p className="text-gray-400 text-xs mb-3 truncate min-w-0">{deck.description}</p>
                                    </div>
                                    <div className="flex space-x-6 text-sm">
                                        <div>
                                            <span className={`font-bold ${displayNewCount > 0 ? 'text-cyan-400' : 'text-gray-500'}`}>{displayNewCount}</span>
                                            <span className="text-gray-500 ml-1">New</span>
                                        </div>
                                        <div>
                                            <span className={`font-bold ${reviewCount > 0 ? 'text-green-400' : 'text-gray-500'}`}>{reviewCount}</span>
                                            <span className="text-gray-500 ml-1">Review</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-3">
                                    <button 
                                        onClick={() => selectDeckAndNavigate(deck, Page.Study)} 
                                        className="p-3 rounded-full bg-cyan-600 text-white hover:bg-cyan-500 transition-colors duration-200 disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed"
                                        aria-label={`Study ${deck.name} deck`}
                                        title="Study"
                                        disabled={isStudyButtonDisabled}
                                    >
                                        <BrainIcon className="w-6 h-6" />
                                    </button>
                                    
                                    <div className="relative" ref={openMenuDeckId === deck.id ? deckMenuRef : null}>
                                        <button 
                                            onClick={() => toggleMenu(deck.id)} 
                                            className="p-3 rounded-full bg-gray-700 hover:bg-gray-500 transition-colors duration-200"
                                            aria-label={`More options for ${deck.name} deck`}
                                            title="More options"
                                        >
                                            <EllipsisVerticalIcon className="w-6 h-6 text-white" />
                                        </button>

                                        {openMenuDeckId === deck.id && (
                                            <div className="absolute right-0 mt-2 w-48 bg-gray-700 rounded-md shadow-lg z-10 animate-fade-in-fast py-1">
                                                <button 
                                                    onClick={() => handleSettingsClick(deck)}
                                                    className="w-full text-left flex items-center px-4 py-2 text-sm text-gray-200 hover:bg-gray-600"
                                                >
                                                    <WrenchScrewdriverIcon className="w-5 h-5 mr-3" />
                                                    Deck Settings
                                                </button>
                                                <button 
                                                    onClick={() => handleEditClick(deck)}
                                                    className="w-full text-left flex items-center px-4 py-2 text-sm text-gray-200 hover:bg-gray-600"
                                                >
                                                    <PencilIcon className="w-5 h-5 mr-3" />
                                                    Edit Deck
                                                </button>
                                                <button 
                                                    onClick={() => handleLibraryClick(deck)}
                                                    className="w-full text-left flex items-center px-4 py-2 text-sm text-gray-200 hover:bg-gray-600"
                                                >
                                                    <BookOpenIcon className="w-5 h-5 mr-3" />
                                                    Card Library
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="text-center py-10 px-6 bg-gray-800 rounded-lg">
                    <p className="text-gray-400">You don't have any decks yet. Create one to get started!</p>
                </div>
            )}

            {editingDeck && (
                <DeckEditorModal 
                    deck={editingDeck}
                    onClose={() => setEditingDeck(null)}
                />
            )}

            {settingDeck && (
                <DeckSettingModal
                    deck={settingDeck}
                    onClose={() => setSettingDeck(null)}
                />
            )}

            {isNewDeckModalOpen && (
                <NewDeckModal onClose={() => setIsNewDeckModalOpen(false)} />
            )}

             <style>{`.animate-fade-in-fast { animation: fadeIn 0.1s ease-out; } @keyframes fadeIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }`}</style>
        </div>
    );
};

export default HomePage;