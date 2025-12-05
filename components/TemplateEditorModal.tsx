
import React, { useState, useEffect, useRef } from 'react';
import { CardTemplate, Field, FieldLayout, FontType, Card } from '../types';
import { useAppContext } from '../context/AppContext';
import { PlusCircleIcon, TrashIcon, ChevronDownIcon, EyeIcon } from './Icons';
import CardRenderer from './CardRenderer';

interface TemplateEditorModalProps {
    template: CardTemplate | null;
    onClose: () => void;
}

const PRESET_COLORS = [
    '#ffffff', '#000000', '#f3f4f6', '#9ca3af', '#4b5563', '#1f2937', // Grays
    '#ef4444', '#f87171', '#f59e0b', '#fbbf24', '#10b981', '#34d399', // Red, Orange, Green
    '#3b82f6', '#60a5fa', '#6366f1', '#818cf8', '#8b5cf6', '#a78bfa', // Blues, Indigos, Purples
    '#ec4899', '#f472b6', '#06b6d4', '#22d3ee' // Pinks, Cyans
];

// Komponen Toggle Switch
const ToggleSwitch: React.FC<{ checked: boolean; onChange: (checked: boolean) => void }> = ({ checked, onChange }) => {
    return (
        <button 
            onClick={() => onChange(!checked)}
            className={`w-12 h-6 rounded-full p-1 transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-cyan-500/50 ${checked ? 'bg-cyan-600' : 'bg-gray-600'}`}
            type="button"
        >
            <div 
                className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ease-in-out ${checked ? 'translate-x-6' : 'translate-x-0'}`} 
            />
        </button>
    );
};

// Komponen Dropdown Custom untuk Font (mirip gaya Homepage)
const FontDropdown: React.FC<{ value: FontType; onChange: (val: FontType) => void }> = ({ value, onChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const options: { label: string; value: FontType }[] = [
        { label: 'Sans Serif', value: 'sans' },
        { label: 'Serif', value: 'serif' },
        { label: 'Handwriting', value: 'handwriting' },
    ];

    const currentLabel = options.find(o => o.value === value)?.label || 'Sans Serif';

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="relative w-full" ref={containerRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between bg-gray-600 text-white rounded px-3 py-2 text-sm border border-gray-500 focus:outline-none focus:border-cyan-500 hover:bg-gray-500 transition-colors"
            >
                <span>{currentLabel}</span>
                <ChevronDownIcon className={`w-4 h-4 ml-2 transition-transform duration-200 ${isOpen ? 'transform rotate-180' : ''}`} />
            </button>
            
            {isOpen && (
                <div className="absolute left-0 mt-2 w-full bg-gray-700 rounded-md shadow-lg z-20 animate-fade-in-fast py-1 border border-gray-600">
                    {options.map((option) => (
                        <button
                            key={option.value}
                            onClick={() => {
                                onChange(option.value);
                                setIsOpen(false);
                            }}
                            className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-600 transition-colors ${value === option.value ? 'text-cyan-400 font-semibold' : 'text-gray-200'}`}
                        >
                            {option.label}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

// Komponen Color Picker Custom (System Picker Removed)
const ColorPickerDropdown: React.FC<{ value: string; onChange: (val: string) => void }> = ({ value, onChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [hexInput, setHexInput] = useState(value);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setHexInput(value);
    }, [value]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleHexChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newVal = e.target.value;
        setHexInput(newVal);
        if (/^#[0-9A-F]{6}$/i.test(newVal)) {
            onChange(newVal);
        }
    };

    return (
        <div className="relative w-full" ref={containerRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between bg-gray-600 text-white rounded px-2 py-1.5 border border-gray-500 focus:outline-none focus:border-cyan-500 hover:bg-gray-500 transition-colors"
            >
                <div className="flex items-center gap-2">
                    <div 
                        className="w-5 h-5 rounded border border-gray-400 shadow-sm" 
                        style={{ backgroundColor: value }}
                    />
                    <span className="text-sm font-mono">{value}</span>
                </div>
                <ChevronDownIcon className={`w-3 h-3 ml-2 text-gray-400 transition-transform duration-200 ${isOpen ? 'transform rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute left-0 mt-2 w-64 bg-gray-800 rounded-lg shadow-xl z-30 animate-fade-in-fast border border-gray-600 p-4">
                    {/* Hex Input */}
                    <div className="mb-3">
                        <label className="block text-xs text-gray-400 mb-1">Hex Color</label>
                        <div className="flex items-center bg-gray-700 rounded border border-gray-600 px-2">
                            <span className="text-gray-400 text-sm">#</span>
                            <input 
                                type="text" 
                                value={hexInput.replace('#', '')}
                                onChange={(e) => handleHexChange({ ...e, target: { ...e.target, value: '#' + e.target.value } })}
                                className="w-full bg-transparent text-white text-sm py-1.5 px-1 focus:outline-none font-mono uppercase"
                                maxLength={6}
                            />
                        </div>
                    </div>

                    {/* Presets Grid */}
                    <div className="">
                        <label className="block text-xs text-gray-400 mb-2">Presets</label>
                        <div className="grid grid-cols-6 gap-2">
                            {PRESET_COLORS.map((color) => (
                                <button
                                    key={color}
                                    onClick={() => { onChange(color); setHexInput(color); }}
                                    className={`w-6 h-6 rounded-full border border-gray-600 hover:scale-110 transition-transform focus:outline-none focus:ring-2 focus:ring-cyan-500 ${value === color ? 'ring-2 ring-white' : ''}`}
                                    style={{ backgroundColor: color }}
                                    title={color}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const TemplateEditorModal: React.FC<TemplateEditorModalProps> = ({ template, onClose }) => {
    const { addTemplate, updateTemplate } = useAppContext();

    const [activeTab, setActiveTab] = useState<'fields' | 'front' | 'back'>('fields');
    const [name, setName] = useState('');
    const [fields, setFields] = useState<Field[]>([]);
    const [frontLayout, setFrontLayout] = useState<FieldLayout[]>([]);
    const [backLayout, setBackLayout] = useState<FieldLayout[]>([]);
    
    // Preview State
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);

    useEffect(() => {
        if (template) {
            setName(template.name);
            setFields(template.fields);
            setFrontLayout(template.frontLayout);
            setBackLayout(template.backLayout);
        } else {
            // Default for new template
            setName('');
            const initialFieldId = `field-${Date.now()}`;
            const initialFields = [{ id: initialFieldId, name: 'Word' }];
            setFields(initialFields);
            
            // Initial layout for default field
            const defaultLayoutItem: FieldLayout = {
                fieldId: initialFieldId,
                isVisible: true,
                fontFamily: 'sans',
                fontSize: 24,
                color: '#ffffff',
                isBold: false
            };
            setFrontLayout([defaultLayoutItem]);
            setBackLayout([{...defaultLayoutItem, isVisible: false}]);
        }
    }, [template]);

    // Ensure layouts stay synced with fields when fields are added/removed
    useEffect(() => {
        // Sync Front Layout
        const newFrontLayout = fields.map(field => {
            const existing = frontLayout.find(l => l.fieldId === field.id);
            return existing || {
                fieldId: field.id,
                isVisible: false,
                fontFamily: 'sans',
                fontSize: 20,
                color: '#ffffff',
                isBold: false
            } as FieldLayout;
        });
        
        // Sync Back Layout
        const newBackLayout = fields.map(field => {
            const existing = backLayout.find(l => l.fieldId === field.id);
            return existing || {
                fieldId: field.id,
                isVisible: false,
                fontFamily: 'sans',
                fontSize: 20,
                color: '#ffffff',
                isBold: false
            } as FieldLayout;
        });

        // Only update if length differs (simple check to avoid infinite loop, though strict equality is better)
        if (newFrontLayout.length !== frontLayout.length) setFrontLayout(newFrontLayout);
        if (newBackLayout.length !== backLayout.length) setBackLayout(newBackLayout);
        
    }, [fields]); // Only run when 'fields' list changes structure

    const handleAddField = () => {
        const newFieldName = `Field ${fields.length + 1}`;
        const newFieldId = `field-${Date.now()}`;
        setFields([...fields, { id: newFieldId, name: newFieldName }]);
    };

    const handleRemoveField = (id: string) => {
        setFields(fields.filter(f => f.id !== id));
        setFrontLayout(frontLayout.filter(l => l.fieldId !== id));
        setBackLayout(backLayout.filter(l => l.fieldId !== id));
    };

    const handleFieldNameChange = (id: string, newName: string) => {
        setFields(fields.map(f => f.id === id ? { ...f, name: newName } : f));
    };

    const handleLayoutChange = (side: 'front' | 'back', fieldId: string, changes: Partial<FieldLayout>) => {
        const updateList = side === 'front' ? frontLayout : backLayout;
        const setList = side === 'front' ? setFrontLayout : setBackLayout;

        setList(updateList.map(item => 
            item.fieldId === fieldId ? { ...item, ...changes } : item
        ));
    };

    const handleSave = () => {
        const templateData = { name, fields, frontLayout, backLayout };
        if (template) {
            updateTemplate({ ...template, ...templateData });
        } else {
            addTemplate(templateData);
        }
        onClose();
    };

    const renderLayoutEditor = (side: 'front' | 'back') => {
        const layout = side === 'front' ? frontLayout : backLayout;
        
        return (
            <div className="space-y-6">
                <p className="text-gray-400 text-sm">Select which fields to display on the <span className="text-white font-bold uppercase">{side}</span> of the card and customize their appearance.</p>
                {layout.map((item) => {
                    const fieldName = fields.find(f => f.id === item.fieldId)?.name || 'Unknown Field';
                    return (
                        <div key={item.fieldId} className="bg-gray-700/50 p-4 rounded-lg border border-gray-600 transition-colors hover:border-gray-500">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center space-x-3">
                                    <ToggleSwitch 
                                        checked={item.isVisible}
                                        onChange={(checked) => handleLayoutChange(side, item.fieldId, { isVisible: checked })}
                                    />
                                    <span className={`font-semibold text-lg ${item.isVisible ? 'text-white' : 'text-gray-500'}`}>{fieldName}</span>
                                </div>
                            </div>

                            {item.isVisible && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pl-0 sm:pl-4 animate-fade-in-fast">
                                    {/* Font Family */}
                                    <div>
                                        <label className="block text-xs text-gray-400 mb-1">Font</label>
                                        <FontDropdown 
                                            value={item.fontFamily} 
                                            onChange={(newFont) => handleLayoutChange(side, item.fieldId, { fontFamily: newFont })} 
                                        />
                                    </div>

                                    {/* Size */}
                                    <div>
                                        <label className="block text-xs text-gray-400 mb-1">Size (px)</label>
                                        <input 
                                            type="number"
                                            value={item.fontSize}
                                            onChange={(e) => handleLayoutChange(side, item.fieldId, { fontSize: parseInt(e.target.value) || 12 })}
                                            className="w-full bg-gray-600 text-white rounded px-2 py-2 text-sm border border-gray-500 focus:outline-none focus:border-cyan-500"
                                        />
                                    </div>

                                    {/* Color */}
                                    <div>
                                        <label className="block text-xs text-gray-400 mb-1">Color</label>
                                        <ColorPickerDropdown 
                                            value={item.color} 
                                            onChange={(newColor) => handleLayoutChange(side, item.fieldId, { color: newColor })} 
                                        />
                                    </div>

                                    {/* Bold */}
                                    <div className="flex flex-col items-center justify-center">
                                         <label className="block text-xs text-gray-400 mb-2">Bold</label>
                                         <ToggleSwitch 
                                            checked={item.isBold}
                                            onChange={(checked) => handleLayoutChange(side, item.fieldId, { isBold: checked })}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        );
    };
    
    // Preview Content Generation
    const previewTemplate: CardTemplate = {
        id: 'preview-temp',
        name: name,
        fields: fields,
        frontLayout: frontLayout,
        backLayout: backLayout
    };

    const dummyCard: Card = {
        id: 'preview-card',
        templateId: 'preview-temp',
        fieldValues: fields.reduce((acc, field) => ({ ...acc, [field.id]: `Sample ${field.name}` }), {}),
        due: new Date(),
        s: 0, d: 0, lapses: 0, reps: 0, state: 0, review_logs: []
    };

    return (
         <div 
            className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 animate-fade-in-fast"
            onClick={onClose}
        >
            <div 
                className="bg-gray-800 rounded-lg shadow-2xl p-8 w-full max-w-4xl mx-4 max-h-[90vh] flex flex-col relative"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-white">{template ? 'Edit Template' : 'Create New Template'}</h2>
                    <button 
                        onClick={() => setIsPreviewOpen(true)}
                        className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-white px-3 py-1.5 rounded-lg border border-gray-500 transition-colors"
                        title="Preview Design"
                    >
                        <EyeIcon className="w-5 h-5" />
                        <span className="text-sm font-semibold">Preview</span>
                    </button>
                </div>
                
                <div className="mb-6">
                     <label htmlFor="template-name" className="block text-sm font-medium text-gray-400 mb-1">Template Name</label>
                     <input id="template-name" type="text" value={name} onChange={e => setName(e.target.value)}
                            className="w-full bg-gray-700 text-gray-200 rounded-lg px-4 py-2 border-2 border-gray-600 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500"/>
                </div>

                {/* Tabs */}
                <div className="flex space-x-1 bg-gray-700 p-1 rounded-lg mb-4">
                    <button 
                        onClick={() => setActiveTab('fields')}
                        className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'fields' ? 'bg-gray-600 text-white shadow' : 'text-gray-400 hover:text-gray-200'}`}
                    >
                        1. Manage Fields
                    </button>
                    <button 
                        onClick={() => setActiveTab('front')}
                        className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'front' ? 'bg-gray-600 text-white shadow' : 'text-gray-400 hover:text-gray-200'}`}
                    >
                        2. Front Design
                    </button>
                    <button 
                        onClick={() => setActiveTab('back')}
                        className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'back' ? 'bg-gray-600 text-white shadow' : 'text-gray-400 hover:text-gray-200'}`}
                    >
                        3. Back Design
                    </button>
                </div>
                
                <div className="flex-grow overflow-y-auto pr-2 -mr-2">
                    {activeTab === 'fields' && (
                        <div>
                             <h3 className="text-lg font-semibold mb-2 text-gray-300">Data Fields</h3>
                             <p className="text-gray-400 text-sm mb-4">Define what information this card type holds (e.g. Word, Meaning, Example Sentence).</p>
                             <div className="space-y-3">
                                {fields.map((field) => (
                                    <div key={field.id} className="flex items-center gap-2">
                                        <input type="text" value={field.name} onChange={e => handleFieldNameChange(field.id, e.target.value)}
                                            className="flex-grow bg-gray-700 text-gray-200 rounded-lg px-4 py-2 border-2 border-gray-600 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500"/>
                                        <button onClick={() => handleRemoveField(field.id)} className="p-2 text-gray-400 hover:text-red-500" title="Remove Field">
                                            <TrashIcon className="w-5 h-5"/>
                                        </button>
                                    </div>
                                ))}
                             </div>
                            <button onClick={handleAddField} className="mt-4 flex items-center gap-2 text-cyan-400 hover:text-cyan-300 font-semibold">
                                <PlusCircleIcon className="w-6 h-6"/> Add New Field
                            </button>
                        </div>
                    )}

                    {activeTab === 'front' && renderLayoutEditor('front')}
                    {activeTab === 'back' && renderLayoutEditor('back')}
                </div>

                <div className="mt-8 flex justify-end space-x-4 pt-4 border-t border-gray-700">
                    <button onClick={onClose} className="bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-gray-500 transition-colors">
                        Cancel
                    </button>
                    <button onClick={handleSave} className="bg-cyan-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-cyan-500 transition-colors">
                        Save Template
                    </button>
                </div>
            </div>

            {/* PREVIEW MODAL */}
            {isPreviewOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-[60] animate-fade-in-fast" onClick={() => setIsPreviewOpen(false)}>
                    <div className="bg-gray-800 rounded-lg shadow-2xl p-6 w-full max-w-3xl mx-4" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-6 border-b border-gray-700 pb-4">
                            <h3 className="text-xl font-bold text-white">Template Preview</h3>
                            <button onClick={() => setIsPreviewOpen(false)} className="text-gray-400 hover:text-white font-bold text-xl">&times;</button>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wider text-center">Front Side</h4>
                                <div className="bg-gray-900 rounded-lg border border-gray-700 p-6 min-h-[200px] flex items-center justify-center">
                                    <CardRenderer card={dummyCard} side="front" template={previewTemplate} />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wider text-center">Back Side</h4>
                                <div className="bg-gray-900 rounded-lg border border-gray-700 p-6 min-h-[200px] flex items-center justify-center">
                                    <CardRenderer card={dummyCard} side="back" template={previewTemplate} />
                                </div>
                            </div>
                        </div>
                        
                        <div className="mt-6 text-center">
                            <p className="text-gray-500 text-sm">This is how your cards will look with dummy data.</p>
                        </div>
                    </div>
                </div>
            )}

             <style>{`.animate-fade-in-fast { animation: fadeIn 0.2s ease-out; } @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }`}</style>
        </div>
    );
};

export default TemplateEditorModal;
