import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { Page, CardTemplate } from '../types';
import { ArrowLeftIcon, PencilIcon, PlusIcon } from './Icons';
import TemplateEditorModal from './TemplateEditorModal';

const TemplateLibraryPage: React.FC = () => {
    const { templates, navigateTo } = useAppContext();
    const [editingTemplate, setEditingTemplate] = useState<CardTemplate | 'new' | null>(null);

    const handleEdit = (template: CardTemplate) => {
        setEditingTemplate(template);
    };

    const handleNew = () => {
        setEditingTemplate('new');
    };

    const handleCloseModal = () => {
        setEditingTemplate(null);
    };

    return (
        <div className="animate-fade-in">
            <header className="flex items-center justify-between mb-8">
                <div className="flex items-center">
                    <button 
                        onClick={() => navigateTo(Page.Home)}
                        className="p-2 mr-4 rounded-full hover:bg-gray-700 transition-colors"
                        aria-label="Go back to home"
                    >
                        <ArrowLeftIcon className="w-6 h-6" />
                    </button>
                    <h1 className="text-3xl font-bold text-cyan-400">Template Library</h1>
                </div>
                <button 
                    onClick={handleNew}
                    className="flex items-center space-x-2 bg-cyan-600 text-white font-semibold px-4 py-2 rounded-lg hover:bg-cyan-500 transition-colors"
                    aria-label="Add new template"
                >
                    <PlusIcon className="w-5 h-5" />
                    <span>New Template</span>
                </button>
            </header>

            <div className="space-y-4">
                {templates.length > 0 ? (
                    templates.map(template => (
                        <div key={template.id} className="bg-gray-800 rounded-lg shadow-md p-5 flex items-center justify-between">
                            <h2 className="text-xl font-semibold text-white">{template.name}</h2>
                            <button 
                                onClick={() => handleEdit(template)}
                                className="p-2 rounded-full hover:bg-gray-700 transition-colors" 
                                aria-label={`Edit ${template.name} template`}
                            >
                                <PencilIcon className="w-5 h-5" />
                            </button>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-10 px-6 bg-gray-800 rounded-lg">
                        <p className="text-gray-400">You have no templates. Create one to get started.</p>
                    </div>
                )}
            </div>

            {editingTemplate && (
                <TemplateEditorModal 
                    template={editingTemplate === 'new' ? null : editingTemplate}
                    onClose={handleCloseModal}
                />
            )}
        </div>
    );
};

export default TemplateLibraryPage;