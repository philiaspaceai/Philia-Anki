
import React, { useState, useEffect } from 'react';
import { Deck, DeckPreset } from '../types';
import { useAppContext } from '../context/AppContext';
import { PRESET_CONFIGS } from '../constants';
import { LockClosedIcon } from './Icons';

interface DeckSettingModalProps {
    deck: Deck;
    onClose: () => void;
}

const presetDetails = {
    [DeckPreset.Forgetful]: { title: 'Forgetful', description: 'More frequent reviews. Ideal if you forget things easily.' },
    [DeckPreset.EasyToRemember]: { title: 'Easy Learner', description: 'Fewer reviews. Perfect for material you grasp quickly.' },
    [DeckPreset.Balanced]: { title: 'Balanced', description: 'A standard configuration for general use. Great starting point.' },
    [DeckPreset.ExamPrep]: { title: 'Exam Prep', description: 'Intensive cramming with very short steps and high frequency.' },
    [DeckPreset.Custom]: { title: 'Custom', description: 'Unlock all settings below to fine-tune every parameter.' }
};


const DeckSettingModal: React.FC<DeckSettingModalProps> = ({ deck, onClose }) => {
    const { updateDeck, runFsrsOptimization } = useAppContext();
    const [settings, setSettings] = useState(deck.settings);
    const [isOptimizing, setIsOptimizing] = useState(false);
    const [optimizationStatus, setOptimizationStatus] = useState('');

    const isCustomPreset = settings.preset === DeckPreset.Custom;

    useEffect(() => {
        // This effect ensures that if the deck data changes from outside (e.g. after optimization),
        // the modal reflects the latest settings.
        setSettings(deck.settings);
    }, [deck]);

    const handlePresetChange = (newPreset: DeckPreset) => {
        if (newPreset === DeckPreset.Custom) {
            setSettings(prev => ({...prev, preset: newPreset}));
        } else {
            const presetConfig = PRESET_CONFIGS[newPreset];
            setSettings(prev => ({
                ...prev,
                ...presetConfig,
                preset: newPreset
            }));
        }
    };
    
    const handleNumericChange = (key: 'newCardsPerDay' | 'reviewsPerDay', value: string) => {
        const numValue = parseInt(value, 10);
        if (!isNaN(numValue) && numValue >= 0) {
            setSettings(prev => ({ ...prev, [key]: numValue }));
        }
    };
    
    const handleStringChange = (key: 'learningSteps' | 'relearningSteps', value: string) => {
        setSettings(prev => ({ ...prev, [key]: value }));
    };

    const handleSliderChange = (key: 'requestRetention' | 'maximumInterval', value: string) => {
         const numValue = parseFloat(value);
         if (!isNaN(numValue)) {
            setSettings(prev => ({
                ...prev,
                fsrsParameters: { ...prev.fsrsParameters, [key]: numValue }
            }));
        }
    }

    const handleSave = () => {
        const updatedDeck = { ...deck, settings };
        updateDeck(updatedDeck);
        onClose();
    };

    const handleOptimize = async () => {
        setIsOptimizing(true);
        setOptimizationStatus('Optimizing... This may take a moment.');
        try {
            await runFsrsOptimization(deck.id);
            setOptimizationStatus(`Successfully optimized on ${new Date().toLocaleTimeString()}.`);
            // The useEffect will handle updating the local state with the new deck settings from context
        } catch (error) {
            if (error instanceof Error) {
                setOptimizationStatus(`Error: ${error.message}`);
            } else {
                setOptimizationStatus('An unknown error occurred during optimization.');
            }
        } finally {
            setIsOptimizing(false);
        }
    };
    
    const inputClasses = "w-full bg-gray-700 text-gray-200 rounded-lg px-4 py-2 border-2 border-gray-600 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 disabled:bg-gray-800 disabled:text-gray-500 disabled:cursor-not-allowed";
    const labelClasses = "block text-sm font-medium text-gray-400 mb-1 flex items-center gap-2";

    return (
        <div 
            className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 animate-fade-in-fast"
            onClick={onClose}
        >
            <div 
                className="bg-gray-800 rounded-lg shadow-2xl p-8 w-full max-w-4xl mx-4 max-h-[90vh] flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                <h2 className="text-2xl font-bold mb-6 text-white">Deck Settings: {deck.name}</h2>
                
                <div className="flex-grow overflow-y-auto pr-4 -mr-4 space-y-6">
                    {/* Preset Selector */}
                     <fieldset className="border border-gray-600 rounded-lg p-4">
                        <legend className="px-2 text-lg font-semibold text-cyan-400">Configuration Preset</legend>
                         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mt-2">
                            {Object.values(DeckPreset).map(preset => {
                                const details = presetDetails[preset];
                                const isSelected = settings.preset === preset;
                                return (
                                    <button
                                        key={preset}
                                        onClick={() => handlePresetChange(preset)}
                                        className={`p-4 rounded-lg border-2 text-left transition-all duration-200 ${
                                            isSelected
                                                ? 'bg-cyan-900/50 border-cyan-500 shadow-lg'
                                                : 'bg-gray-700/50 border-gray-600 hover:border-gray-500 hover:bg-gray-700'
                                        }`}
                                    >
                                        <h3 className="font-bold text-base text-white">{details.title}</h3>
                                        <p className="text-xs text-gray-400 mt-1">{details.description}</p>
                                    </button>
                                );
                            })}
                        </div>
                    </fieldset>
                    
                    {/* Limits */}
                    <fieldset className="border border-gray-600 rounded-lg p-4">
                        <legend className="px-2 text-lg font-semibold text-cyan-400">Daily Limits</legend>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="new-cards-limit" className={labelClasses}>New Cards/Day</label>
                                <input id="new-cards-limit" type="number" value={settings.newCardsPerDay} onChange={e => handleNumericChange('newCardsPerDay', e.target.value)}
                                       className={inputClasses}/>
                            </div>
                             <div>
                                <label htmlFor="reviews-limit" className={labelClasses}>Reviews/Day</label>
                                <input id="reviews-limit" type="number" value={settings.reviewsPerDay} onChange={e => handleNumericChange('reviewsPerDay', e.target.value)}
                                       className={inputClasses}/>
                            </div>
                        </div>
                    </fieldset>

                    {/* Steps */}
                    <fieldset className="border border-gray-600 rounded-lg p-4">
                        <legend className="px-2 text-lg font-semibold text-cyan-400">Steps</legend>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="learning-steps" className={labelClasses}>
                                    {!isCustomPreset && <LockClosedIcon className="w-4 h-4 text-gray-500" />}
                                    Learning Steps (minutes)
                                </label>
                                <input id="learning-steps" type="text" value={settings.learningSteps} onChange={e => handleStringChange('learningSteps', e.target.value)}
                                       placeholder="e.g. 1m 10m 1d"
                                       disabled={!isCustomPreset}
                                       className={inputClasses}/>
                            </div>
                             <div>
                                <label htmlFor="relearning-steps" className={labelClasses}>
                                    {!isCustomPreset && <LockClosedIcon className="w-4 h-4 text-gray-500" />}
                                    Relearning Steps (minutes)
                                </label>
                                <input id="relearning-steps" type="text" value={settings.relearningSteps} onChange={e => handleStringChange('relearningSteps', e.target.value)}
                                       placeholder="e.g. 10m"
                                       disabled={!isCustomPreset}
                                       className={inputClasses}/>
                            </div>
                        </div>
                    </fieldset>
                    
                     {/* FSRS Parameters */}
                    <fieldset className="border border-gray-600 rounded-lg p-4">
                        <legend className="px-2 text-lg font-semibold text-cyan-400">FSRS Parameters</legend>
                        <div className="space-y-4">
                             <div>
                                <label htmlFor="request-retention" className={labelClasses}>
                                    {!isCustomPreset && <LockClosedIcon className="w-4 h-4 text-gray-500" />}
                                    Request Retention: {settings.fsrsParameters.requestRetention.toFixed(2)}
                                </label>
                                <input 
                                    id="request-retention" 
                                    type="range" 
                                    min="0.7" 
                                    max="0.99" 
                                    step="0.01" 
                                    value={settings.fsrsParameters.requestRetention} 
                                    onChange={e => handleSliderChange('requestRetention', e.target.value)}
                                    disabled={!isCustomPreset}
                                    className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer disabled:cursor-not-allowed"
                                />
                             </div>
                             
                             <div>
                                <label htmlFor="max-interval" className={labelClasses}>
                                    {!isCustomPreset && <LockClosedIcon className="w-4 h-4 text-gray-500" />}
                                    Maximum Interval (days)
                                </label>
                                <input 
                                    id="max-interval" 
                                    type="number" 
                                    value={settings.fsrsParameters.maximumInterval} 
                                    onChange={e => handleSliderChange('maximumInterval', e.target.value)}
                                    disabled={!isCustomPreset}
                                    className={inputClasses}
                                />
                            </div>
                        </div>
                    </fieldset>
                    
                     {/* Optimization Section */}
                    <div className="border border-gray-600 rounded-lg p-4 bg-gray-700/30">
                        <div className="flex justify-between items-center mb-2">
                             <h3 className="text-lg font-semibold text-white">FSRS Optimization</h3>
                        </div>
                        <p className="text-sm text-gray-400 mb-4">
                            Optimize your FSRS parameters based on your review history. 
                            Requires at least 10 reviews.
                        </p>
                        <div className="flex flex-col gap-2">
                            <button 
                                onClick={handleOptimize}
                                disabled={isOptimizing || deck.cards.flatMap(c => c.review_logs).length < 10}
                                className="bg-cyan-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-cyan-500 transition-colors disabled:bg-gray-600 disabled:text-gray-400 disabled:cursor-not-allowed w-full sm:w-auto"
                            >
                                {isOptimizing ? 'Optimizing...' : 'Optimize Parameters'}
                            </button>
                            {optimizationStatus && (
                                <p className={`text-sm mt-2 ${optimizationStatus.startsWith('Error') ? 'text-red-400' : 'text-green-400'}`}>
                                    {optimizationStatus}
                                </p>
                            )}
                        </div>
                    </div>

                </div>

                <div className="mt-8 flex justify-end space-x-4 pt-4 border-t border-gray-700">
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
                        Save Settings
                    </button>
                </div>
            </div>
            <style>{`.animate-fade-in-fast { animation: fadeIn 0.2s ease-out; } @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }`}</style>
        </div>
    );
};

export default DeckSettingModal;
