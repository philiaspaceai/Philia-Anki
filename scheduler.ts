
import { Card, Deck, State } from './types';

// Helper to shuffle the card array
// Changed to function declaration to avoid JSX generic parsing issues in .tsx environments
function shuffleArray<T>(array: T[]): T[] {
    const newArr = [...array];
    for (let i = newArr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
    }
    return newArr;
}

export const buildStudyQueue = (cards: Card[], settings: Deck['settings']): Card[] => {
    const now = new Date();
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    // 1. Separate Due Learning Cards (VIPs)
    // These should ALWAYS be shown if due, regardless of daily limits (Anki behavior)
    // or at least prioritized heavily.
    const learningDue = cards.filter(card => 
        (card.state === State.Learning || card.state === State.Relearning) && 
        card.due <= now
    );

    // 2. Separate Due Review Cards
    const reviewDue = cards.filter(card => 
        card.state === State.Review && 
        card.due <= now
    );

    // 3. Separate New Cards
    const newCards = cards.filter(card => card.state === State.New);

    // 4. Apply Limits
    
    // Calculate how many NEW cards have already been introduced today to avoid "infinite new cards" on refresh.
    // We check if the FIRST review log for a card happened today.
    const newCardsIntroducedToday = cards.filter(c => {
        const firstLog = c.review_logs[0];
        return firstLog && new Date(firstLog.review) >= startOfDay;
    }).length;

    const remainingNewLimit = Math.max(0, settings.newCardsPerDay - newCardsIntroducedToday);
    
    // Calculate how many reviews were done today to decrement from review limit
    // We count logs that happened today where state was Review or Relearning (not the first log)
    const reviewsDoneToday = cards.reduce((acc, c) => {
        const todayLogs = c.review_logs.filter(log => 
            new Date(log.review) >= startOfDay && 
            (log.state === State.Review || log.state === State.Relearning)
        );
        return acc + todayLogs.length;
    }, 0);

    const learningQueue = shuffleArray(learningDue);
    
    // Reviews limit usually applies to "Review" cards, sometimes Learning too depending on implementation.
    // Here we apply it to Review cards mainly.
    const remainingReviewSlots = Math.max(0, settings.reviewsPerDay - reviewsDoneToday - learningQueue.length);
    const reviewQueue = shuffleArray(reviewDue).slice(0, remainingReviewSlots);

    // FIX: Slice first (FIFO) then shuffle. This ensures we take the "oldest" new cards first,
    // preserving the order of chapters/lessons, but randomizing their presentation within the session.
    const newQueue = shuffleArray(newCards.slice(0, remainingNewLimit));

    // Combine: Learning + Reviews (Prioritized) + New
    return [...learningQueue, ...reviewQueue, ...newQueue];
};
