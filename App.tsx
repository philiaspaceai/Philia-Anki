
import React from 'react';
import { AppProvider, useAppContext } from './context/AppContext';
import { Page } from './types';
import HomePage from './components/HomePage';
import SettingsPage from './components/SettingsPage';
import StudyPage from './components/StudyPage';
import CardLibraryPage from './components/CardLibraryPage';
import TemplateLibraryPage from './components/TemplateLibraryPage';
import StatsPage from './components/StatsPage';
import CramStudyPage from './components/CramStudyPage';

const PageRenderer: React.FC = () => {
    const { currentPage } = useAppContext();

    switch (currentPage) {
        case Page.Home:
            return <HomePage />;
        case Page.Settings:
            return <SettingsPage />;
        case Page.Study:
            return <StudyPage />;
        case Page.CardLibrary:
            return <CardLibraryPage />;
        case Page.TemplateLibrary:
            return <TemplateLibraryPage />;
        case Page.Stats:
            return <StatsPage />;
        case Page.Cram:
            return <CramStudyPage />;
        default:
            return <HomePage />;
    }
};

const App: React.FC = () => {
    return (
        <AppProvider>
            <div className="min-h-screen bg-gray-900 text-gray-100 font-sans">
                <main className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
                    <PageRenderer />
                </main>
            </div>
        </AppProvider>
    );
};

export default App;