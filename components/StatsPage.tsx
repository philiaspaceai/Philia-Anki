
import React, { useState, useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import { Page, State, Rating } from '../types';
import { ArrowLeftIcon, CalendarIcon } from './Icons';

const StatsPage: React.FC = () => {
    const { decks, navigateTo } = useAppContext();
    
    // Default to last 30 days
    const [startDate, setStartDate] = useState<string>(
        new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0]
    );
    const [endDate, setEndDate] = useState<string>(
        new Date().toISOString().split('T')[0]
    );

    // Flatten all cards from all decks
    const allCards = useMemo(() => decks.flatMap(d => d.cards), [decks]);

    // Calculate Current Memory State Distribution (Snapshot)
    const statsDistribution = useMemo(() => {
        let learning = 0;
        let young = 0;
        let mature = 0;
        let total = allCards.length;

        allCards.forEach(card => {
            if (card.state === State.New) {
                // Not counted in active memory stats usually, or counted as unseen
                total--; 
            } else if (card.state === State.Learning || card.state === State.Relearning) {
                learning++;
            } else if (card.state === State.Review) {
                if (card.s < 21) {
                    young++;
                } else {
                    mature++;
                }
            }
        });

        return { learning, young, mature, totalActive: total + (allCards.length - total) }; // Keep total cards including new
    }, [allCards]);

    // Calculate Retention Rate based on Date Filter
    const retentionData = useMemo(() => {
        const start = new Date(startDate);
        const end = new Date(endDate);
        // Adjust end date to include the full day
        end.setHours(23, 59, 59, 999);

        let totalReviews = 0;
        let passedReviews = 0;

        allCards.forEach(card => {
            card.review_logs.forEach(log => {
                const logDate = new Date(log.review);
                if (logDate >= start && logDate <= end) {
                    totalReviews++;
                    // In FSRS/Anki: Again (1) is Fail. Hard (2), Good (3), Easy (4) are Pass.
                    if (log.rating !== Rating.Again) {
                        passedReviews++;
                    }
                }
            });
        });

        const rate = totalReviews === 0 ? 0 : (passedReviews / totalReviews) * 100;
        return { totalReviews, passedReviews, rate };
    }, [allCards, startDate, endDate]);

    // Determine Health Color
    const getHealthColor = (rate: number) => {
        if (rate === 0 && retentionData.totalReviews === 0) return 'text-gray-400';
        if (rate < 60) return 'text-red-500';
        if (rate < 70) return 'text-orange-500';
        if (rate < 80) return 'text-yellow-400';
        if (rate < 90) return 'text-green-400';
        return 'text-cyan-400';
    };

    const getHealthLabel = (rate: number) => {
        if (rate === 0 && retentionData.totalReviews === 0) return 'No Data';
        if (rate < 60) return 'Critical';
        if (rate < 70) return 'Poor';
        if (rate < 80) return 'Fair';
        if (rate < 90) return 'Healthy';
        return 'Excellent';
    };

    return (
        <div className="animate-fade-in pb-10">
            <header className="flex items-center mb-8">
                <button 
                    onClick={() => navigateTo(Page.Home)}
                    className="p-2 mr-4 rounded-full hover:bg-gray-700 transition-colors"
                    aria-label="Go back to home"
                >
                    <ArrowLeftIcon className="w-6 h-6" />
                </button>
                <h1 className="text-3xl font-bold text-cyan-400">Brain Stats</h1>
            </header>

            {/* Date Filter */}
            <div className="bg-gray-800 rounded-lg p-6 mb-8 shadow-lg">
                <div className="flex flex-col sm:flex-row items-center gap-4">
                    <div className="flex items-center gap-2 text-gray-300">
                        <CalendarIcon className="w-5 h-5 text-cyan-400" />
                        <span className="font-semibold">Filter Date:</span>
                    </div>
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <input 
                            type="date" 
                            value={startDate} 
                            onChange={(e) => setStartDate(e.target.value)}
                            className="bg-gray-700 text-white px-3 py-2 rounded-lg border border-gray-600 focus:border-cyan-500 outline-none w-full sm:w-auto"
                        />
                        <span className="text-gray-500">to</span>
                        <input 
                            type="date" 
                            value={endDate} 
                            onChange={(e) => setEndDate(e.target.value)}
                            className="bg-gray-700 text-white px-3 py-2 rounded-lg border border-gray-600 focus:border-cyan-500 outline-none w-full sm:w-auto"
                        />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {/* Retention Stats */}
                <div className="bg-gray-800 rounded-lg p-6 shadow-lg flex flex-col items-center justify-center relative overflow-hidden">
                    <h2 className="text-xl font-bold text-white mb-6 self-start">Retention Performance</h2>
                    
                    <div className="relative w-48 h-48 flex items-center justify-center mb-4">
                        {/* Circle Background */}
                        <svg className="w-full h-full" viewBox="0 0 100 100">
                            <circle 
                                className="text-gray-700 stroke-current" 
                                strokeWidth="10" 
                                cx="50" 
                                cy="50" 
                                r="40" 
                                fill="transparent" 
                            ></circle>
                            {/* Circle Progress */}
                            <circle 
                                className={`${getHealthColor(retentionData.rate)} stroke-current transition-all duration-1000 ease-out`} 
                                strokeWidth="10" 
                                strokeLinecap="round" 
                                cx="50" 
                                cy="50" 
                                r="40" 
                                fill="transparent" 
                                strokeDasharray="251.2" 
                                strokeDashoffset={251.2 - (251.2 * retentionData.rate) / 100}
                                transform="rotate(-90 50 50)"
                            ></circle>
                        </svg>
                        <div className="absolute flex flex-col items-center">
                            <span className={`text-4xl font-bold ${getHealthColor(retentionData.rate)}`}>
                                {retentionData.rate.toFixed(1)}%
                            </span>
                            <span className={`text-sm font-semibold uppercase tracking-wider mt-1 ${getHealthColor(retentionData.rate)}`}>
                                {getHealthLabel(retentionData.rate)}
                            </span>
                        </div>
                    </div>
                    
                    <div className="w-full grid grid-cols-2 gap-4 mt-2 text-center">
                        <div className="bg-gray-700/50 rounded p-2">
                            <p className="text-xs text-gray-400 uppercase">Total Reviews</p>
                            <p className="text-lg font-bold text-white">{retentionData.totalReviews}</p>
                        </div>
                        <div className="bg-gray-700/50 rounded p-2">
                            <p className="text-xs text-gray-400 uppercase">Passed</p>
                            <p className="text-lg font-bold text-green-400">{retentionData.passedReviews}</p>
                        </div>
                    </div>
                </div>

                {/* Memory Distribution */}
                <div className="bg-gray-800 rounded-lg p-6 shadow-lg">
                    <h2 className="text-xl font-bold text-white mb-6">Total Memory State</h2>
                    <div className="space-y-6">
                        {/* Learning */}
                        <div>
                            <div className="flex justify-between mb-1">
                                <span className="text-sm font-medium text-blue-400">Learning Phase (Short Term)</span>
                                <span className="text-sm font-bold text-white">{statsDistribution.learning} cards</span>
                            </div>
                            <div className="w-full bg-gray-700 rounded-full h-2.5">
                                <div className="bg-blue-500 h-2.5 rounded-full" style={{ width: `${(statsDistribution.learning / statsDistribution.totalActive) * 100 || 0}%` }}></div>
                            </div>
                        </div>

                        {/* Young */}
                        <div>
                            <div className="flex justify-between mb-1">
                                <span className="text-sm font-medium text-green-400">Young (Medium Term)</span>
                                <span className="text-sm font-bold text-white">{statsDistribution.young} cards</span>
                            </div>
                            <div className="w-full bg-gray-700 rounded-full h-2.5">
                                <div className="bg-green-500 h-2.5 rounded-full" style={{ width: `${(statsDistribution.young / statsDistribution.totalActive) * 100 || 0}%` }}></div>
                            </div>
                        </div>

                        {/* Mature */}
                        <div>
                            <div className="flex justify-between mb-1">
                                <span className="text-sm font-medium text-cyan-400">Mature (Long Term)</span>
                                <span className="text-sm font-bold text-white">{statsDistribution.mature} cards</span>
                            </div>
                            <div className="w-full bg-gray-700 rounded-full h-2.5">
                                <div className="bg-cyan-500 h-2.5 rounded-full" style={{ width: `${(statsDistribution.mature / statsDistribution.totalActive) * 100 || 0}%` }}></div>
                            </div>
                        </div>
                        
                        <div className="mt-8 pt-4 border-t border-gray-700">
                             <p className="text-center text-gray-400 text-sm">
                                Total Cards in System: <span className="text-white font-bold">{allCards.length}</span>
                             </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Explanation Section */}
            <div className="bg-gray-800 rounded-lg p-8 shadow-lg">
                <h3 className="text-2xl font-bold text-white mb-6 border-b border-gray-700 pb-2">Understanding Your Brain Stats</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                        <h4 className="font-bold text-cyan-400 text-lg mb-2">Memory Types</h4>
                        <ul className="space-y-4 text-gray-300 text-sm leading-relaxed">
                            <li>
                                <strong className="text-blue-400 block mb-1">Learning Phase (Short Term)</strong>
                                Cards you are currently studying or relearning. These are in your "volatile" memory and need frequent repetition (minutes/hours) to stick.
                            </li>
                            <li>
                                <strong className="text-green-400 block mb-1">Young (Medium Term)</strong>
                                Cards you have started to remember but aren't fully consolidated. You review these every few days or weeks (&lt; 21 days interval).
                            </li>
                            <li>
                                <strong className="text-cyan-400 block mb-1">Mature (Long Term)</strong>
                                Consolidated knowledge. These cards are deeply embedded in your brain. You won't see them often (interval &gt; 21 days), proving you really know them.
                            </li>
                        </ul>
                    </div>
                    
                    <div>
                        <h4 className="font-bold text-cyan-400 text-lg mb-2">Retention Health</h4>
                        <ul className="space-y-4 text-gray-300 text-sm leading-relaxed">
                            <li>
                                <strong className="text-green-400 block mb-1">Healthy Zone (80% - 90%)</strong>
                                This is the sweet spot. It means the algorithm is challenging you just enough. You remember most things, but it's not too easy.
                            </li>
                            <li>
                                <strong className="text-cyan-400 block mb-1">Excellent (&gt; 90%)</strong>
                                You are mastering the material, but it might be too easy. Consider increasing the "New Cards/Day" limit or adjusting settings to challenge your brain more.
                            </li>
                            <li>
                                <strong className="text-red-500 block mb-1">Critical / Poor (&lt; 70%)</strong>
                                You are forgetting too much. This often happens if you skip days or if "Learning Steps" are too short. Try reviewing every day or shortening your intervals.
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StatsPage;
