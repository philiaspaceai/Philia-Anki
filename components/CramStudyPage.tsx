
import React, { useState, useEffect, useCallback } from 'react';
import { useAppContext } from '../context/AppContext';
import { Card, Page } from '../types';
import { ArrowLeftIcon } from './Icons';
import CardRenderer from './CardRenderer';

// Helper to shuffle the card array
function shuffleArray<T>(array: T[]): T[] {
    const newArr = [...array];
    for (let i = newArr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
    }
    return newArr;
}

const CramStudyPage: React.FC = () => {
    const { selectedDeck: deck, navigateTo, goHome } = useAppContext();
    const [cramQueue, setCramQueue] = useState<Card[]>([]);
    const [isFlipped, setIsFlipped] = useState(false);
    const [isComplete, setIsComplete] = useState(false);
    const [isAnimating, setIsAnimating] = useState(false);

    useEffect(() => {
        if (!deck) {
            goHome();
            return;
        }

        const now = new Date();
        const startOfDay = new Date(now.setHours(0, 0, 0, 0));

        // Filter cards studied today (based on last_review timestamp)
        const todayCards = deck.cards.filter(card => {
            return card.last_review && card.last_review >= startOfDay;
        });

        if (todayCards.length > 0) {
            // Shuffle for cramming
            setCramQueue(shuffleArray(todayCards));
        } else {
            setIsComplete(true);
        }
    }, [deck, goHome]);

    const handleShowAnswer = useCallback(() => {
        if (isAnimating) return;
        setIsFlipped(true);
    }, [isAnimating]);

    const handleAnswer = useCallback((isCorrect: boolean) => {
        if (cramQueue.length === 0 || isAnimating) return;

        setIsAnimating(true);
        const currentCard = cramQueue[0];
        
        let nextQueue = cramQueue.slice(1);

        // Cram logic: Incorrect -> put back at end. Correct -> Remove.
        if (!isCorrect) {
            nextQueue.push(currentCard);
        }

        setIsFlipped(false);

        setTimeout(() => {
            if (nextQueue.length === 0) {
                setIsComplete(true);
            } else {
                setCramQueue(nextQueue);
            }
            setIsAnimating(false);
        }, 350);

    }, [cramQueue, isAnimating]);

    if (!deck) return null;

    if (isComplete && cramQueue.length === 0) {
        return (
            <div className="text-center py-20 px-6 bg-gray-800 rounded-lg shadow-lg animate-fade-in">
                <h2 className="text-3xl font-bold text-orange-400 mb-4">Cramming Session Complete!</h2>
                <p className="text-lg text-gray-300 mb-8">
                    You've reviewed all the cards studied today.
                    <br/>
                    <span className="text-sm text-gray-500">(This session did not affect your long-term FSRS stats)</span>
                </p>
                <button onClick={() => navigateTo(Page.Study)} className="bg-gray-600 text-white font-semibold py-2 px-6 rounded-md hover:bg-gray-500 transition-colors duration-200">
                    Back to Study
                </button>
            </div>
        );
    }

    const currentCard = cramQueue[0];

    return (
        <div className="animate-fade-in relative">
            <header className="flex items-center justify-between mb-6">
                 <div className="flex items-center">
                    <button onClick={() => navigateTo(Page.Study)} className="p-2 mr-4 rounded-full hover:bg-gray-700 transition-colors" aria-label="Go back">
                        <ArrowLeftIcon className="w-6 h-6" />
                    </button>
                    <div>
                        <h1 className="text-3xl font-bold text-white flex items-center gap-2">
                            <span className="text-orange-500">🔥</span> Cramming: {deck.name}
                        </h1>
                    </div>
                 </div>
                 <div className="flex items-center gap-4">
                    <div className="text-right">
                        <p className="text-orange-400 font-semibold text-lg">{cramQueue.length}</p>
                        <p className="text-gray-500 text-sm">CARDS LEFT</p>
                    </div>
                 </div>
            </header>

            <div 
                className={`relative min-h-[20rem] perspective-1000`}
                onClick={!isFlipped && !isAnimating ? handleShowAnswer : undefined}
            >
                <div className={`w-full h-full absolute transition-transform duration-700 transform-style-preserve-3d ${isFlipped ? 'rotate-y-180' : ''}`}>
                    {/* Front of card */}
                    <div className="absolute w-full h-full bg-gray-800 rounded-lg shadow-lg flex items-center justify-center p-6 text-center backface-hidden cursor-pointer border-2 border-orange-500/20">
                        {currentCard && <CardRenderer card={currentCard} side="front" />}
                    </div>

                    {/* Back of card */}
                    <div className="absolute w-full h-full bg-orange-900/30 rounded-lg shadow-lg flex items-center justify-center p-6 text-center backface-hidden rotate-y-180 border-2 border-orange-500/50">
                        {currentCard && <CardRenderer card={currentCard} side="back" />}
                    </div>
                </div>
            </div>

            <div className="mt-8">
                { !isFlipped ? (
                    <button 
                        onClick={handleShowAnswer} 
                        disabled={isAnimating}
                        className="bg-gray-600 w-full text-white font-semibold py-3 px-6 rounded-md hover:bg-gray-500 transition-colors duration-200 text-lg disabled:cursor-not-allowed"
                    >
                        Show Answer
                    </button>
                ) : (
                    <div className="grid grid-cols-2 gap-4">
                        <button 
                            onClick={() => handleAnswer(false)}
                            disabled={isAnimating}
                            className="bg-red-600/80 text-white font-bold py-3 px-6 rounded-md hover:bg-red-500 transition-colors duration-200 text-lg disabled:cursor-not-allowed"
                        >
                            Again
                        </button>
                        <button 
                            onClick={() => handleAnswer(true)}
                            disabled={isAnimating}
                            className="bg-green-600/80 text-white font-bold py-3 px-6 rounded-md hover:bg-green-500 transition-colors duration-200 text-lg disabled:cursor-not-allowed"
                        >
                            Good
                        </button>
                    </div>
                )}
            </div>
            
            <style>{`
                .perspective-1000 { perspective: 1000px; }
                .transform-style-preserve-3d { transform-style: preserve-3d; }
                .rotate-y-180 { transform: rotateY(180deg); }
                .backface-hidden { backface-visibility: hidden; -webkit-backface-visibility: hidden; }
            `}</style>
        </div>
    );
};

export default CramStudyPage;