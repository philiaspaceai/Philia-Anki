
import React, { createContext, useState, useContext, ReactNode, useEffect, useCallback } from 'react';
import { Page, DeckPreset, State } from '../types';
import type { Card, Deck, CardTemplate } from '../types';
import { MOCK_DECKS, MOCK_TEMPLATES, PRESET_CONFIGS } from '../constants';
import { runOptimizationInWorker } from '../optimizer';
import { State as FSRSState } from '../types'; // Ensure clean import

interface AppContextType {
    currentPage: Page;
    decks: Deck[];
    templates: CardTemplate[];
    selectedDeck: Deck | null;
    navigateTo: (page: Page) => void;
    selectDeckAndNavigate: (deck: Deck, page: Page) => void;
    goHome: () => void;
    addDeck: (name: string, description: string) => void;
    updateDeck: (updatedDeck: Deck) => void;
    addCard: (deckId: string, newCard: Omit<Card, 'id' | 'due' | 's' | 'd' | 'lapses' | 'reps' | 'state' | 'last_review' | 'review_logs' | 'step_index'>) => void;
    addCardsBatch: (deckId: string, newCardsData: Omit<Card, 'id' | 'due' | 's' | 'd' | 'lapses' | 'reps' | 'state' | 'last_review' | 'review_logs' | 'step_index'>[]) => void;
    updateCard: (deckId: string, updatedCard: Card) => void;
    deleteCards: (deckId: string, cardIdsToDelete: string[]) => void;
    addTemplate: (newTemplate: Omit<CardTemplate, 'id'>) => void;
    updateTemplate: (updatedTemplate: CardTemplate) => void;
    runFsrsOptimization: (deckId: string) => Promise<void>;
    exportData: () => void;
    importData: (jsonString: string) => Promise<boolean>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [currentPage, setCurrentPage] = useState<Page>(Page.Home);
    const [decks, setDecks] = useState<Deck[]>([]);
    const [templates, setTemplates] = useState<CardTemplate[]>([]);
    const [selectedDeck, setSelectedDeck] = useState<Deck | null>(null);

    useEffect(() => {
        // Convert string dates from constants to Date objects to avoid FSRS crash
        // Deep hydration for review_logs is critical
        const initialDecks = MOCK_DECKS.map(deck => ({
            ...deck,
            cards: deck.cards.map(card => ({
                ...card,
                due: new Date(card.due),
                last_review: card.last_review ? new Date(card.last_review) : undefined,
                review_logs: card.review_logs.map(log => ({
                    ...log,
                    due: new Date(log.due),
                    review: new Date(log.review)
                }))
            }))
        }));
        setDecks(initialDecks);
        setTemplates(MOCK_TEMPLATES);
    }, []);
    
    const navigateTo = useCallback((page: Page) => {
        setCurrentPage(page);
    }, []);

    const selectDeckAndNavigate = useCallback((deck: Deck, page: Page) => {
        setSelectedDeck(deck);
        setCurrentPage(page);
    }, []);
    
    const goHome = useCallback(() => {
        setSelectedDeck(null);
        setCurrentPage(Page.Home);
    }, []);

    const addDeck = useCallback((name: string, description: string) => {
        const newDeck: Deck = {
            id: `deck-${Date.now()}`,
            name,
            description,
            cards: [],
            settings: {
                preset: DeckPreset.Balanced,
                newCardsPerDay: 20,
                reviewsPerDay: 200,
                ...PRESET_CONFIGS[DeckPreset.Balanced]
            }
        };
        setDecks(prev => [newDeck, ...prev]);
    }, []);

    const updateDeck = useCallback((updatedDeck: Deck) => {
        setDecks(prevDecks => 
            prevDecks.map(deck => 
                deck.id === updatedDeck.id ? updatedDeck : deck
            )
        );
        if (selectedDeck?.id === updatedDeck.id) {
            setSelectedDeck(updatedDeck);
        }
    }, [selectedDeck]);

    const addCard = useCallback((deckId: string, newCardData: Omit<Card, 'id' | 'due' | 's' | 'd' | 'lapses' | 'reps' | 'state' | 'last_review' | 'review_logs' | 'step_index'>) => {
        const newCard: Card = {
            id: `card-${Date.now()}`,
            ...newCardData,
            due: new Date(),
            s: 0,
            d: 0,
            lapses: 0,
            reps: 0,
            state: State.New,
            last_review: undefined,
            step_index: 0,
            review_logs: [],
        };
        setDecks(prevDecks =>
            prevDecks.map(deck => {
                if (deck.id === deckId) {
                    const updatedDeck = { ...deck, cards: [...deck.cards, newCard] };
                    if (selectedDeck?.id === deckId) {
                        setSelectedDeck(updatedDeck);
                    }
                    return updatedDeck;
                }
                return deck;
            })
        );
    }, [selectedDeck]);

    const addCardsBatch = useCallback((deckId: string, newCardsData: Omit<Card, 'id' | 'due' | 's' | 'd' | 'lapses' | 'reps' | 'state' | 'last_review' | 'review_logs' | 'step_index'>[]) => {
        const now = Date.now();
        const newCards: Card[] = newCardsData.map((data, index) => ({
            id: `card-${now}-${index}`,
            ...data,
            due: new Date(),
            s: 0,
            d: 0,
            lapses: 0,
            reps: 0,
            state: State.New,
            last_review: undefined,
            step_index: 0,
            review_logs: [],
        }));

        setDecks(prevDecks =>
            prevDecks.map(deck => {
                if (deck.id === deckId) {
                    const updatedDeck = { ...deck, cards: [...deck.cards, ...newCards] };
                    if (selectedDeck?.id === deckId) {
                        setSelectedDeck(updatedDeck);
                    }
                    return updatedDeck;
                }
                return deck;
            })
        );
    }, [selectedDeck]);

    const updateCard = useCallback((deckId: string, updatedCard: Card) => {
        setDecks(prevDecks =>
            prevDecks.map(deck => {
                if (deck.id === deckId) {
                    const updatedCards = deck.cards.map(card =>
                        card.id === updatedCard.id ? updatedCard : card
                    );
                    const updatedDeck = { ...deck, cards: updatedCards };
                     if (selectedDeck?.id === deckId) {
                        setSelectedDeck(updatedDeck);
                    }
                    return updatedDeck;
                }
                return deck;
            })
        );
    }, [selectedDeck]);

    const deleteCards = useCallback((deckId: string, cardIdsToDelete: string[]) => {
        setDecks(prevDecks =>
            prevDecks.map(deck => {
                if (deck.id === deckId) {
                    const updatedCards = deck.cards.filter(card => !cardIdsToDelete.includes(card.id));
                    const updatedDeck = { ...deck, cards: updatedCards };
                     if (selectedDeck?.id === deckId) {
                        setSelectedDeck(updatedDeck);
                    }
                    return updatedDeck;
                }
                return deck;
            })
        );
    }, [selectedDeck]);

    const addTemplate = useCallback((newTemplateData: Omit<CardTemplate, 'id'>) => {
        const newTemplate: CardTemplate = {
            id: `template-${Date.now()}`,
            ...newTemplateData
        };
        setTemplates(prev => [...prev, newTemplate]);
    }, []);

    const updateTemplate = useCallback((updatedTemplate: CardTemplate) => {
        setTemplates(prev => prev.map(t => t.id === updatedTemplate.id ? updatedTemplate : t));
    }, []);

    const runFsrsOptimization = useCallback(async (deckId: string) => {
        const deckToOptimize = decks.find(d => d.id === deckId);
        if (!deckToOptimize) {
            throw new Error("Deck not found.");
        }

        const allLogs = deckToOptimize.cards.flatMap(c => c.review_logs);
        
        if (allLogs.length < 10) {
            throw new Error(`Not enough review history. Need at least 10 reviews, but found only ${allLogs.length}.`);
        }
        
        const newWeights = await runOptimizationInWorker(allLogs);
        
        const updatedDeck = {
            ...deckToOptimize,
            settings: {
                ...deckToOptimize.settings,
                fsrsParameters: {
                    ...deckToOptimize.settings.fsrsParameters,
                    w: newWeights
                },
                lastOptimized: new Date(),
            }
        };
        updateDeck(updatedDeck);
    }, [decks, updateDeck]);

    const exportData = useCallback(() => {
        const data = {
            decks,
            templates,
            version: "1.0",
            exportDate: new Date().toISOString()
        };
        const jsonString = JSON.stringify(data, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `philia-anki-backup-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }, [decks, templates]);

    const importData = useCallback(async (jsonString: string): Promise<boolean> => {
        try {
            const data = JSON.parse(jsonString);
            
            if (!data.decks || !Array.isArray(data.decks) || !data.templates || !Array.isArray(data.templates)) {
                throw new Error("Invalid backup file format.");
            }

            // Deep Hydration for Dates
            const hydratedDecks = data.decks.map((d: any) => ({
                ...d,
                cards: d.cards.map((c: any) => ({
                    ...c,
                    due: new Date(c.due),
                    last_review: c.last_review ? new Date(c.last_review) : undefined,
                    review_logs: c.review_logs.map((l: any) => ({
                        ...l,
                        due: new Date(l.due),
                        review: new Date(l.review)
                    }))
                })),
                settings: {
                    ...d.settings,
                    lastOptimized: d.settings.lastOptimized ? new Date(d.settings.lastOptimized) : undefined
                }
            }));

            setDecks(hydratedDecks);
            setTemplates(data.templates);
            return true;
        } catch (error) {
            console.error("Import failed:", error);
            return false;
        }
    }, []);

    const value = {
        currentPage,
        decks,
        templates,
        selectedDeck,
        navigateTo,
        selectDeckAndNavigate,
        goHome,
        addDeck,
        updateDeck,
        addCard,
        addCardsBatch,
        updateCard,
        deleteCards,
        addTemplate,
        updateTemplate,
        runFsrsOptimization,
        exportData,
        importData,
    };

    return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = (): AppContextType => {
    const context = useContext(AppContext);
    if (context === undefined) {
        throw new Error('useAppContext must be used within an AppProvider');
    }
    return context;
};
