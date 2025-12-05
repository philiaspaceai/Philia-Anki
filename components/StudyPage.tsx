
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useAppContext } from '../context/AppContext';
import { Card, Deck, State, Rating, Page } from '../types';
import { ArrowLeftIcon, ArrowUturnLeftIcon, FireIcon } from './Icons';
import CardRenderer from './CardRenderer';
import { buildStudyQueue } from '../scheduler';
import { FSRS, Card as FSRS_Card } from '../fsrs';

interface HistoryState {
    queue: Card[];
    previousCardState: Card | null;
}

// Helper to parse steps string "1m 10m" -> [1, 10] (in minutes)
const parseSteps = (stepsStr: string): number[] => {
    if (!stepsStr || !stepsStr.trim()) return [];
    return stepsStr.trim().split(/\s+/).map(s => {
        const val = parseInt(s);
        if (isNaN(val)) return NaN;
        if (s.endsWith('m')) return val;
        if (s.endsWith('d')) return val * 1440; // Convert days to minutes
        if (s.endsWith('h')) return val * 60;
        return val;
    }).filter(n => !isNaN(n) && n > 0);
};

const StudyPage: React.FC = () => {
    const { selectedDeck: deck, goHome, updateCard, navigateTo } = useAppContext();
    
    const [studyQueue, setStudyQueue] = useState<Card[]>([]);
    const [isFlipped, setIsFlipped] = useState(false);
    const [isComplete, setIsComplete] = useState(false);
    const [history, setHistory] = useState<HistoryState[]>([]);
    const [notificationKey, setNotificationKey] = useState<number>(0);
    const [notificationMsg, setNotificationMsg] = useState<string>('');
    const [isAnimating, setIsAnimating] = useState(false);
    
    // Waiting state for future cards
    const [nextCardDue, setNextCardDue] = useState<Date | null>(null);
    const [timeRemaining, setTimeRemaining] = useState<string>('');
    
    const [cardStartTime, setCardStartTime] = useState<number>(0);
    const responseTimeRef = useRef<number>(0);
    const notificationTimerRef = useRef<number | null>(null);
    const mountedDeckIdRef = useRef<string | null>(null);
    const timerIntervalRef = useRef<number | null>(null);

    useEffect(() => {
        if (!deck) {
            goHome();
            return;
        }

        if (mountedDeckIdRef.current !== deck.id) {
            mountedDeckIdRef.current = deck.id;

            if (deck.cards.length > 0) {
                // Initial queue building
                let queue = buildStudyQueue(deck.cards, deck.settings);
                // Sort by due date initially to ensure priority
                queue.sort((a, b) => a.due.getTime() - b.due.getTime());
                setStudyQueue(queue);
                setIsComplete(false);
                setIsFlipped(false);
                setHistory([]);
                setCardStartTime(Date.now());
                setNextCardDue(null);
            } else {
                setStudyQueue([]);
            }
        }
    }, [deck, goHome]);

    // Timer effect for waiting screen
    useEffect(() => {
        if (nextCardDue) {
            const updateTimer = () => {
                const now = new Date();
                const diff = nextCardDue.getTime() - now.getTime();
                
                if (diff <= 0) {
                    // Time's up, allow studying
                    setNextCardDue(null);
                    setCardStartTime(Date.now());
                } else {
                    const minutes = Math.floor(diff / 60000);
                    const seconds = Math.floor((diff % 60000) / 1000);
                    setTimeRemaining(`${minutes}:${seconds.toString().padStart(2, '0')}`);
                }
            };
            
            updateTimer(); // Initial call
            timerIntervalRef.current = window.setInterval(updateTimer, 1000);
            
            return () => {
                if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
            };
        }
    }, [nextCardDue]);

    const showNotification = (msg: string) => {
        setNotificationMsg(msg);
        if (notificationTimerRef.current) clearTimeout(notificationTimerRef.current);
        setNotificationKey(Date.now());
        notificationTimerRef.current = window.setTimeout(() => setNotificationKey(0), 3000);
    };

    const handleShowAnswer = useCallback(() => {
        if (isAnimating || nextCardDue) return;
        responseTimeRef.current = Date.now() - cardStartTime;
        setIsFlipped(true);
    }, [cardStartTime, isAnimating, nextCardDue]);

    const handleAnswer = useCallback((isCorrect: boolean) => {
        if (studyQueue.length === 0 || !deck || isAnimating) return;

        setIsAnimating(true);
        const currentCard = studyQueue[0];
        const now = new Date();
        
        setHistory(prev => [...prev, { queue: studyQueue, previousCardState: currentCard }]);

        const responseInSeconds = responseTimeRef.current / 1000;
        let rating: Rating;
        if (isCorrect) {
            rating = responseInSeconds <= 5 ? Rating.Easy : Rating.Good;
        } else {
            rating = responseInSeconds <= 5 ? Rating.Hard : Rating.Again;
        }

        // Logic split: Manual Learning Steps vs FSRS Review
        const isLearningPhase = currentCard.state === State.New || currentCard.state === State.Learning || currentCard.state === State.Relearning;
        let updatedCard: Card;

        if (isLearningPhase) {
            // --- MANUAL LEARNING STEPS LOGIC ---
            const rawSteps = currentCard.state === State.Relearning 
                ? parseSteps(deck.settings.relearningSteps)
                : parseSteps(deck.settings.learningSteps);
            
            // Add Hidden 0m Step (Immediate Reinforcement)
            const steps = [0, ...rawSteps];
            const safeSteps = steps.length > 0 ? steps : [0, 1, 10]; 

            let newStepIndex = currentCard.state === State.New ? -1 : (currentCard.step_index ?? 0);
            
            let newDue = new Date();
            let newState = currentCard.state === State.New ? State.Learning : currentCard.state;

            if (!isCorrect) {
                // INCORRECT (Reset to start)
                newStepIndex = 0; // Index 0 is now 0m (Immediate)
                newDue = new Date(Date.now() + safeSteps[0] * 60 * 1000);
                if (currentCard.state === State.New) newState = State.Learning;
            } else if (rating === Rating.Easy) {
                // EASY (Graduate Immediately)
                const fsrs = new FSRS(deck.settings.fsrsParameters);
                const lastReviewDate = currentCard.last_review || now;
                
                // Fix: If coming from Relearning, graduate to Review (preserve stability flow), else New.
                const initFsrsState = currentCard.state === State.Relearning ? State.Review : State.New;

                const fsrsCard: FSRS_Card = {
                    due: currentCard.due,
                    s: currentCard.s,
                    d: currentCard.d,
                    elapsed_days: 0,
                    scheduled_days: 0, 
                    reps: currentCard.reps,
                    lapses: currentCard.lapses,
                    state: initFsrsState, 
                    last_review: lastReviewDate,
                    id: currentCard.id,
                    templateId: currentCard.templateId,
                    fieldValues: currentCard.fieldValues,
                    review_logs: currentCard.review_logs
                };
                const schedule = fsrs.repeat(fsrsCard, now);
                const newFsrsState = schedule[Rating.Easy];
                
                const actualElapsedDays = currentCard.last_review 
                    ? (now.getTime() - currentCard.last_review.getTime()) / (24 * 60 * 60 * 1000)
                    : 0;
                
                updatedCard = {
                    ...currentCard,
                    due: newFsrsState.due,
                    s: newFsrsState.s,
                    d: newFsrsState.d,
                    reps: newFsrsState.reps,
                    lapses: newFsrsState.lapses,
                    state: newFsrsState.state,
                    last_review: now,
                    step_index: 0, 
                    review_logs: [...currentCard.review_logs, {
                        rating: Rating.Easy,
                        state: newFsrsState.state,
                        due: newFsrsState.due,
                        elapsed_days: actualElapsedDays,
                        scheduled_days: newFsrsState.scheduled_days || 0,
                        review: now,
                    }]
                };
            } else {
                // GOOD (Next Step or Graduate)
                newStepIndex++;
                if (newStepIndex >= safeSteps.length) {
                    // Graduate to FSRS
                    const fsrs = new FSRS(deck.settings.fsrsParameters);
                    const lastReviewDate = currentCard.last_review || now;
                    
                    const initFsrsState = currentCard.state === State.Relearning ? State.Review : State.New;

                    const fsrsCard: FSRS_Card = {
                        due: currentCard.due,
                        s: currentCard.s,
                        d: currentCard.d,
                        elapsed_days: 0,
                        scheduled_days: 0, 
                        reps: currentCard.reps,
                        lapses: currentCard.lapses,
                        state: initFsrsState, 
                        last_review: lastReviewDate,
                        id: currentCard.id,
                        templateId: currentCard.templateId,
                        fieldValues: currentCard.fieldValues,
                        review_logs: currentCard.review_logs
                    };
                    const schedule = fsrs.repeat(fsrsCard, now);
                    const newFsrsState = schedule[Rating.Good];

                    const actualElapsedDays = currentCard.last_review 
                        ? (now.getTime() - currentCard.last_review.getTime()) / (24 * 60 * 60 * 1000)
                        : 0;

                    updatedCard = {
                        ...currentCard,
                        due: newFsrsState.due,
                        s: newFsrsState.s,
                        d: newFsrsState.d,
                        reps: newFsrsState.reps,
                        lapses: newFsrsState.lapses,
                        state: newFsrsState.state,
                        last_review: now,
                        step_index: 0,
                        review_logs: [...currentCard.review_logs, {
                            rating: Rating.Good,
                            state: newFsrsState.state,
                            due: newFsrsState.due,
                            elapsed_days: actualElapsedDays,
                            scheduled_days: newFsrsState.scheduled_days || 0,
                            review: now,
                        }]
                    };
                } else {
                    // Just advance step, stay in Learning
                    newDue = new Date(Date.now() + safeSteps[newStepIndex] * 60 * 1000);
                    updatedCard = {
                        ...currentCard,
                        step_index: newStepIndex,
                        due: newDue,
                        state: newState,
                        last_review: now,
                        reps: currentCard.reps + 1,
                        review_logs: [...currentCard.review_logs, {
                            rating: Rating.Good,
                            state: newState,
                            due: newDue,
                            elapsed_days: 0,
                            scheduled_days: 0,
                            review: now,
                        }]
                    };
                }
            }
            
            if (!updatedCard) {
                updatedCard = {
                    ...currentCard,
                    step_index: newStepIndex,
                    due: newDue,
                    state: newState,
                    last_review: now,
                    reps: currentCard.reps + 1,
                    review_logs: [...currentCard.review_logs, {
                        rating: isCorrect ? Rating.Good : Rating.Again,
                        state: newState,
                        due: newDue,
                        elapsed_days: 0,
                        scheduled_days: 0,
                        review: now,
                    }]
                };
            }

        } else {
            // --- FSRS REVIEW LOGIC ---
            const fsrs = new FSRS(deck.settings.fsrsParameters);
            const lastReviewDate = currentCard.last_review || now;
            const fsrsCard: FSRS_Card = {
                due: currentCard.due,
                s: currentCard.s,
                d: currentCard.d,
                elapsed_days: 0,
                scheduled_days: 0, 
                reps: currentCard.reps,
                lapses: currentCard.lapses,
                state: currentCard.state,
                last_review: lastReviewDate,
                id: currentCard.id,
                templateId: currentCard.templateId,
                fieldValues: currentCard.fieldValues,
                review_logs: currentCard.review_logs
            };

            const schedule = fsrs.repeat(fsrsCard, now);
            const newFsrsState = schedule[rating];
            
            const actualElapsedDays = currentCard.last_review 
                ? (now.getTime() - currentCard.last_review.getTime()) / (24 * 60 * 60 * 1000)
                : 0;

            updatedCard = {
                ...currentCard,
                due: newFsrsState.due,
                s: newFsrsState.s,
                d: newFsrsState.d,
                reps: newFsrsState.reps,
                lapses: newFsrsState.lapses,
                state: newFsrsState.state,
                last_review: now,
                step_index: rating === Rating.Again ? 0 : currentCard.step_index,
                review_logs: [
                    ...currentCard.review_logs,
                    {
                        rating: rating,
                        state: newFsrsState.state,
                        due: newFsrsState.due,
                        elapsed_days: actualElapsedDays,
                        scheduled_days: newFsrsState.scheduled_days || 0,
                        review: now,
                    }
                ]
            };
        }
        
        updateCard(deck.id, updatedCard);

        let nextQueue = studyQueue.slice(1);
        
        // Re-queue logic
        const isStillLearning = updatedCard.state === State.Learning || updatedCard.state === State.Relearning;
        if (!isCorrect || isStillLearning) {
            nextQueue.push(updatedCard);
        }
        
        // Sort queue by Due Date to ensure we see the most urgent card next
        nextQueue.sort((a, b) => a.due.getTime() - b.due.getTime());
        
        setIsFlipped(false);
        
        setTimeout(() => {
            if (nextQueue.length === 0) {
                setIsComplete(true);
            } else {
                setStudyQueue(nextQueue);
                
                // Check if the next card is due in the future
                const nextCard = nextQueue[0];
                if (nextCard && nextCard.due > new Date()) {
                    setNextCardDue(nextCard.due);
                } else {
                    setNextCardDue(null);
                    setCardStartTime(Date.now());
                }
            }
            setIsAnimating(false);
        }, 350);

    }, [studyQueue, deck, updateCard, responseTimeRef.current, isAnimating]);

    const handleUndo = useCallback(() => {
        if (history.length === 0 || isAnimating) return;

        showNotification("Undo card");

        const lastState = history[history.length - 1];
        setIsFlipped(false);
        setNextCardDue(null); // Clear waiting state on undo
        
        setStudyQueue(lastState.queue);
        
        if (lastState.previousCardState && deck) {
            updateCard(deck.id, lastState.previousCardState);
        }
        
        setIsComplete(false);
        setCardStartTime(Date.now());
        setHistory(prev => prev.slice(0, -1));
    }, [history, deck, updateCard, isAnimating]);
    
    const handleRestart = () => {
        if (deck && deck.cards.length > 0) {
            let queue = buildStudyQueue(deck.cards, deck.settings);
            
            if (queue.length === 0) {
                showNotification("No cards due for today!");
                return;
            }

            queue.sort((a, b) => a.due.getTime() - b.due.getTime());
            setStudyQueue(queue);
            setIsComplete(false);
            setIsFlipped(false);
            setHistory([]);
            setCardStartTime(Date.now());
            setNextCardDue(null);
        }
    };
    
    const handleCram = () => {
        navigateTo(Page.Cram);
    };

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (isComplete || studyQueue.length === 0 || isAnimating || nextCardDue) return;

            if (event.key === 'Backspace') {
                handleUndo();
                return;
            }
            
            if (event.code === 'Space' || event.key === ' ') {
                event.preventDefault();
                if (!isFlipped) handleShowAnswer();
            } else if (isFlipped) {
                if (event.key === '1') handleAnswer(false);
                else if (event.key === '2') handleAnswer(true);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            if (notificationTimerRef.current) clearTimeout(notificationTimerRef.current);
            if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
        };
    }, [isFlipped, isComplete, studyQueue, handleShowAnswer, handleAnswer, handleUndo, isAnimating, nextCardDue]);
    
    if (!deck) return null;

    if (deck.cards.length === 0) {
         return (
             <div className="text-center py-10 px-6 bg-gray-800 rounded-lg animate-fade-in">
                <h1 className="text-2xl font-bold mb-4">{deck.name}</h1>
                <p className="text-gray-400 mb-6">This deck has no cards to study.</p>
                <button onClick={goHome} className="bg-cyan-600 text-white font-semibold py-2 px-6 rounded-md hover:bg-cyan-500 transition-colors duration-200">
                    Go Back
                </button>
            </div>
         );
    }
    
    // Check if there are ANY cards studied today that can be crammed
    const now = new Date();
    const startOfDay = new Date(now.setHours(0,0,0,0));
    const hasCardsForCramming = deck.cards.some(c => c.last_review && c.last_review >= startOfDay);

    if (isComplete) {
        return (
            <div className="text-center py-20 px-6 bg-gray-800 rounded-lg shadow-lg animate-fade-in relative">
                 {!!notificationKey && (
                    <div key={notificationKey} className="fixed top-20 left-1/2 -translate-x-1/2 bg-gray-700 text-white px-4 py-2 rounded-lg shadow-lg z-50 animate-fade-in-out border border-cyan-500">
                        {notificationMsg}
                    </div>
                )}
                <h2 className="text-3xl font-bold text-cyan-400 mb-4">Congratulations!</h2>
                <p className="text-lg text-gray-300 mb-8">You have completed the "{deck.name}" deck.</p>
                <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
                    <button onClick={handleRestart} className="bg-cyan-600 text-white font-semibold py-2 px-6 rounded-md hover:bg-cyan-500 transition-colors duration-200 w-full sm:w-auto">
                        Study Again
                    </button>
                    {hasCardsForCramming && (
                        <button onClick={handleCram} className="bg-orange-600 text-white font-semibold py-2 px-6 rounded-md hover:bg-orange-500 transition-colors duration-200 flex items-center justify-center gap-2 w-full sm:w-auto">
                            <FireIcon className="w-5 h-5" />
                            Cram Today's Cards
                        </button>
                    )}
                    <button onClick={goHome} className="bg-gray-600 text-white font-semibold py-2 px-6 rounded-md hover:bg-gray-500 transition-colors duration-200 w-full sm:w-auto">
                        Back to Decks
                    </button>
                </div>
            </div>
        );
    }
    
    // No cards due state (when initial queue is empty)
    if (studyQueue.length === 0 && !isComplete) {
         return (
             <div className="text-center py-20 px-6 bg-gray-800 rounded-lg shadow-lg animate-fade-in">
                <h2 className="text-2xl font-bold mb-4">No cards due today</h2>
                <p className="text-gray-400 mb-6">You've caught up with your reviews for this deck.</p>
                <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
                     {hasCardsForCramming && (
                        <button onClick={handleCram} className="bg-orange-600 text-white font-semibold py-2 px-6 rounded-md hover:bg-orange-500 transition-colors duration-200 flex items-center justify-center gap-2 w-full sm:w-auto">
                            <FireIcon className="w-5 h-5" />
                            Cram Today's Cards
                        </button>
                    )}
                    <button onClick={goHome} className="bg-gray-600 text-white font-semibold py-2 px-6 rounded-md hover:bg-gray-500 transition-colors duration-200 w-full sm:w-auto">
                        Go Back
                    </button>
                </div>
            </div>
         );
    }
    
    // WAITING SCREEN FOR FUTURE CARDS
    if (nextCardDue) {
         return (
             <div className="text-center py-20 px-6 bg-gray-800 rounded-lg shadow-lg animate-fade-in">
                <h2 className="text-2xl font-bold mb-4 text-cyan-400">Waiting for next card</h2>
                <div className="text-5xl font-mono text-white mb-6 font-bold tracking-widest">
                    {timeRemaining}
                </div>
                <p className="text-gray-400 mb-8">
                    The next card in the queue is not ready yet.<br/>
                    Take a short break and relax.
                </p>
                <button onClick={goHome} className="bg-gray-600 text-white font-semibold py-2 px-6 rounded-md hover:bg-gray-500 transition-colors duration-200">
                    Back to Decks
                </button>
            </div>
         );
    }
    
    const currentCard = studyQueue[0];
    
    return (
        <div className="animate-fade-in relative">
            {!!notificationKey && (
                <div key={notificationKey} className="fixed top-20 left-1/2 -translate-x-1/2 bg-gray-700 text-white px-4 py-2 rounded-lg shadow-lg z-50 animate-fade-in-out border border-cyan-500">
                    {notificationMsg}
                </div>
            )}
            <header className="flex items-center justify-between mb-6">
                 <div className="flex items-center">
                    <button onClick={goHome} className="p-2 mr-4 rounded-full hover:bg-gray-700 transition-colors" aria-label="Go back">
                        <ArrowLeftIcon className="w-6 h-6" />
                    </button>
                    <div>
                        <h1 className="text-3xl font-bold text-white">{deck.name}</h1>
                    </div>
                 </div>
                 <div className="flex items-center gap-4">
                    <div className="text-right">
                        <p className="text-gray-300 font-semibold text-lg">{studyQueue.length}</p>
                        <p className="text-gray-500 text-sm">REMAINING</p>
                    </div>
                 </div>
            </header>

            <div 
                className={`relative min-h-[20rem] perspective-1000`}
                onClick={!isFlipped && !isAnimating ? handleShowAnswer : undefined}
            >
                <div className={`w-full h-full absolute transition-transform duration-700 transform-style-preserve-3d ${isFlipped ? 'rotate-y-180' : ''}`}>
                    {/* Front of card */}
                    <div className="absolute w-full h-full bg-gray-800 rounded-lg shadow-lg flex items-center justify-center p-6 text-center backface-hidden cursor-pointer">
                        {currentCard && <CardRenderer card={currentCard} side="front" />}
                    </div>

                    {/* Back of card */}
                    <div className="absolute w-full h-full bg-cyan-800 rounded-lg shadow-lg flex items-center justify-center p-6 text-center backface-hidden rotate-y-180">
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
                            Incorrect (1)
                        </button>
                        <button 
                            onClick={() => handleAnswer(true)}
                            disabled={isAnimating}
                            className="bg-green-600/80 text-white font-bold py-3 px-6 rounded-md hover:bg-green-500 transition-colors duration-200 text-lg disabled:cursor-not-allowed"
                        >
                            Correct (2)
                        </button>
                    </div>
                )}
            </div>
            
            <div className="mt-6 text-center">
                <button
                    onClick={handleUndo}
                    disabled={history.length === 0 || isAnimating}
                    className="flex items-center justify-center gap-2 mx-auto text-gray-400 hover:text-white disabled:text-gray-600 disabled:cursor-not-allowed transition-colors"
                    title="Undo last answer (Backspace)"
                >
                    <ArrowUturnLeftIcon className="w-5 h-5" />
                    <span>Undo</span>
                </button>
            </div>

             <style>{`
                .perspective-1000 { perspective: 1000px; }
                .transform-style-preserve-3d { transform-style: preserve-3d; }
                .rotate-y-180 { transform: rotateY(180deg); }
                .backface-hidden { backface-visibility: hidden; -webkit-backface-visibility: hidden; }
                .animate-fade-in-out {
                    animation: fadeInOut 2s ease-in-out forwards;
                }
                @keyframes fadeInOut {
                    0% { opacity: 0; transform: translate(-50%, -20px); }
                    10% { opacity: 1; transform: translate(-50%, 0); }
                    90% { opacity: 1; transform: translate(-50%, 0); }
                    100% { opacity: 0; transform: translate(-50%, -20px); }
                }
            `}</style>
        </div>
    );
};

export default StudyPage;
