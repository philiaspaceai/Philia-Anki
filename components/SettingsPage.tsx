
import React, { useState, useRef } from 'react';
import { useAppContext } from '../context/AppContext';
import { Page } from '../types';
import { ArrowLeftIcon, ArrowDownTrayIcon, ArrowUpTrayIcon } from './Icons';

const SettingsPage: React.FC = () => {
    const { navigateTo, exportData, importData } = useAppContext();
    const [statusMsg, setStatusMsg] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleBackup = () => {
        exportData();
        setStatusMsg('Backup downloaded successfully.');
        setTimeout(() => setStatusMsg(''), 3000);
    };

    const handleRestoreClick = () => {
        if (window.confirm("Restoring data will OVERWRITE all current decks and cards. Are you sure?")) {
            fileInputRef.current?.click();
        }
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (event) => {
            const content = event.target?.result as string;
            if (content) {
                const success = await importData(content);
                if (success) {
                    setStatusMsg('Data restored successfully!');
                } else {
                    setStatusMsg('Error: Invalid backup file.');
                }
                setTimeout(() => setStatusMsg(''), 3000);
            }
        };
        reader.readAsText(file);
        // Reset input
        e.target.value = '';
    };

    return (
        <div className="animate-fade-in">
            <header className="flex items-center mb-8">
                <button 
                    onClick={() => navigateTo(Page.Home)}
                    className="p-2 mr-4 rounded-full hover:bg-gray-700 transition-colors"
                    aria-label="Go back to home"
                >
                    <ArrowLeftIcon className="w-6 h-6" />
                </button>
                <h1 className="text-3xl font-bold text-cyan-400">Settings</h1>
            </header>
            <div className="bg-gray-800 rounded-lg shadow-lg p-8">
                <div className="mb-8 pb-6 border-b border-gray-700">
                    <h2 className="text-xl font-semibold text-white mb-2">Data Management</h2>
                    <p className="text-gray-400 text-sm mb-6">
                        Backup your entire collection including decks, cards, templates, and learning history.
                    </p>
                    
                    <div className="flex flex-col sm:flex-row gap-4">
                        <button 
                            onClick={handleBackup}
                            className="flex items-center justify-center gap-2 bg-cyan-600 text-white font-semibold py-3 px-6 rounded-lg hover:bg-cyan-500 transition-colors"
                        >
                            <ArrowDownTrayIcon className="w-5 h-5" />
                            <span>Backup Data (JSON)</span>
                        </button>
                        
                        <button 
                            onClick={handleRestoreClick}
                            className="flex items-center justify-center gap-2 bg-gray-700 text-white font-semibold py-3 px-6 rounded-lg hover:bg-gray-600 transition-colors border border-gray-600"
                        >
                            <ArrowUpTrayIcon className="w-5 h-5" />
                            <span>Restore Data</span>
                        </button>
                        <input 
                            type="file" 
                            ref={fileInputRef} 
                            onChange={handleFileChange} 
                            accept=".json" 
                            className="hidden" 
                        />
                    </div>
                    {statusMsg && (
                        <p className={`mt-4 text-sm font-semibold ${statusMsg.startsWith('Error') ? 'text-red-400' : 'text-green-400'}`}>
                            {statusMsg}
                        </p>
                    )}
                </div>

                <div>
                    <h2 className="text-xl font-semibold text-white mb-4">About</h2>
                    <p className="text-gray-400 text-sm">
                        Philia Anki v1.0.0<br/>
                        Powered by FSRS-6 Algorithm.<br/>
                        Made with ❤️ for efficient learning.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default SettingsPage;
