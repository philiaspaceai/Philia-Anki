import React, { useState, useEffect, useRef } from 'react';
import { useAppContext } from '../context/AppContext';
import { CardTemplate } from '../types';
import { ArrowUpTrayIcon, ChevronDownIcon } from './Icons';

interface ImportWizardModalProps {
    deckId: string;
    onClose: () => void;
}

// Embedded Worker Code for Excel Import (Plain JS)
const IMPORT_WORKER_CODE = `
importScripts('https://cdn.sheetjs.com/xlsx-0.20.3/package/dist/xlsx.full.min.js');

self.onmessage = (event) => {
    const { type, payload } = event.data;

    try {
        if (type === 'preview') {
            const { fileBuffer } = payload;
            const workbook = XLSX.read(fileBuffer, { type: 'array' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            
            // Get headers and a preview of data (first 5 rows)
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
            
            if (jsonData.length === 0) {
                throw new Error("File is empty");
            }

            const headers = jsonData[0];
            const previewRows = jsonData.slice(1, 6);

            self.postMessage({ type: 'preview_result', data: { headers, previewRows, totalRows: jsonData.length - 1 } });
            
        } else if (type === 'process') {
            const { fileBuffer, mapping, templateId } = payload;
            const workbook = XLSX.read(fileBuffer, { type: 'array' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
            // Remove header row
            const rows = jsonData.slice(1);

            // Mapping: { fieldId: columnIndex }
            // We need to convert this to an array of objects matching the Card structure
            const newCards = rows.map(row => {
                const fieldValues = {};
                
                Object.entries(mapping).forEach(([fieldId, colIndex]) => {
                    const idx = Number(colIndex);
                    if (!isNaN(idx) && row[idx] !== undefined) {
                        fieldValues[fieldId] = String(row[idx]);
                    } else {
                        fieldValues[fieldId] = '';
                    }
                });

                return {
                    templateId,
                    fieldValues
                };
            });

            self.postMessage({ type: 'process_result', data: newCards });
        }
    } catch (error) {
        self.postMessage({ type: 'error', message: error.message || 'Unknown import error' });
    }
};
`;

const ImportWizardModal: React.FC<ImportWizardModalProps> = ({ deckId, onClose }) => {
    const { templates, addCardsBatch } = useAppContext();
    const [step, setStep] = useState(1);
    const [file, setFile] = useState<File | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [previewData, setPreviewData] = useState<{ headers: string[], previewRows: string[][], totalRows: number } | null>(null);
    
    const [selectedTemplate, setSelectedTemplate] = useState<CardTemplate | null>(null);
    const [mapping, setMapping] = useState<Record<string, number>>({}); // fieldId -> columnIndex

    const workerRef = useRef<Worker | null>(null);
    const workerUrlRef = useRef<string | null>(null);

    useEffect(() => {
        // Create a Blob from the worker code string
        const blob = new Blob([IMPORT_WORKER_CODE], { type: 'application/javascript' });
        // Create a URL for the Blob
        const url = URL.createObjectURL(blob);
        workerUrlRef.current = url;
        
        // Initialize Worker using the Blob URL
        workerRef.current = new Worker(url);
        
        workerRef.current.onmessage = (e) => {
            const { type, data, message } = e.data;
            setIsLoading(false);

            if (type === 'error') {
                setError(message);
            } else if (type === 'preview_result') {
                setPreviewData(data);
                setStep(2);
            } else if (type === 'process_result') {
                // Bulk add cards
                addCardsBatch(deckId, data);
                onClose();
            }
        };

        return () => {
            workerRef.current?.terminate();
            if (workerUrlRef.current) {
                URL.revokeObjectURL(workerUrlRef.current);
            }
        };
    }, [addCardsBatch, deckId, onClose]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setError(null);
        }
    };

    const handleNextToMapping = () => {
        if (!file) {
            setError("Please select a file.");
            return;
        }
        
        setIsLoading(true);
        const reader = new FileReader();
        reader.onload = (e) => {
            const buffer = e.target?.result;
            workerRef.current?.postMessage({ 
                type: 'preview', 
                payload: { fileBuffer: buffer } 
            });
        };
        reader.readAsArrayBuffer(file);
    };

    const handleMappingChange = (fieldId: string, columnIndex: string) => {
        setMapping(prev => ({
            ...prev,
            [fieldId]: parseInt(columnIndex)
        }));
    };

    const handleImport = () => {
        if (!selectedTemplate || !file) return;
        
        setIsLoading(true);
        const reader = new FileReader();
        reader.onload = (e) => {
            const buffer = e.target?.result;
            workerRef.current?.postMessage({ 
                type: 'process', 
                payload: { 
                    fileBuffer: buffer,
                    mapping,
                    templateId: selectedTemplate.id
                } 
            });
        };
        reader.readAsArrayBuffer(file);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 animate-fade-in-fast" onClick={onClose}>
            <div className="bg-gray-800 rounded-lg shadow-2xl p-8 w-full max-w-2xl mx-4 max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <h2 className="text-2xl font-bold mb-6 text-white">Import Cards (XLSX)</h2>
                
                {error && <div className="bg-red-900/50 border border-red-500 text-red-200 p-3 rounded-lg mb-4">{error}</div>}

                {step === 1 && (
                    <div className="space-y-6">
                        <div className="border-2 border-dashed border-gray-600 rounded-xl p-10 text-center hover:border-cyan-500 transition-colors">
                            <ArrowUpTrayIcon className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                            <p className="text-lg text-gray-300 mb-2">Drag and drop your Excel file here</p>
                            <p className="text-sm text-gray-500 mb-6">or click to browse</p>
                            <input 
                                type="file" 
                                accept=".xlsx, .xls"
                                onChange={handleFileChange}
                                className="hidden"
                                id="file-upload"
                            />
                            <label htmlFor="file-upload" className="bg-cyan-600 text-white font-semibold py-2 px-6 rounded-lg hover:bg-cyan-500 transition-colors cursor-pointer">
                                Browse Files
                            </label>
                            {file && <p className="mt-4 text-cyan-400 font-medium">{file.name}</p>}
                        </div>
                        <div className="flex justify-end">
                            <button onClick={handleNextToMapping} disabled={!file || isLoading} className="bg-cyan-600 text-white font-semibold py-2 px-6 rounded-lg hover:bg-cyan-500 transition-colors disabled:bg-gray-700 disabled:text-gray-500">
                                {isLoading ? 'Analyzing...' : 'Next'}
                            </button>
                        </div>
                    </div>
                )}

                {step === 2 && previewData && (
                    <div className="flex-grow overflow-y-auto">
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-400 mb-2">Select Template</label>
                            <div className="relative">
                                <select 
                                    className="w-full bg-gray-700 text-gray-200 rounded-lg px-4 py-3 border-2 border-gray-600 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 appearance-none"
                                    onChange={(e) => {
                                        const t = templates.find(temp => temp.id === e.target.value);
                                        setSelectedTemplate(t || null);
                                        setMapping({});
                                    }}
                                    value={selectedTemplate?.id || ''}
                                >
                                    <option value="">-- Choose a Template --</option>
                                    {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                </select>
                                <ChevronDownIcon className="w-5 h-5 absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
                            </div>
                        </div>

                        {selectedTemplate && (
                            <div className="space-y-4">
                                <h3 className="font-semibold text-white border-b border-gray-700 pb-2">Map Excel Columns to Fields</h3>
                                {selectedTemplate.fields.map(field => (
                                    <div key={field.id} className="grid grid-cols-2 gap-4 items-center">
                                        <div className="text-gray-300 font-medium">{field.name}</div>
                                        <div className="relative">
                                            <select 
                                                className="w-full bg-gray-700 text-gray-200 rounded-lg px-3 py-2 border border-gray-600 focus:outline-none focus:border-cyan-500 appearance-none"
                                                onChange={(e) => handleMappingChange(field.id, e.target.value)}
                                                value={mapping[field.id] !== undefined ? mapping[field.id] : ''}
                                            >
                                                <option value="">-- Skip --</option>
                                                {previewData.headers.map((header, idx) => (
                                                    <option key={idx} value={idx}>
                                                        Column {String.fromCharCode(65 + idx)}: {header || '(Empty)'}
                                                    </option>
                                                ))}
                                            </select>
                                            <ChevronDownIcon className="w-4 h-4 absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                        
                        {isLoading && (
                             <div className="mt-6 text-center">
                                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400"></div>
                                <p className="mt-2 text-gray-400">Processing {previewData.totalRows} rows...</p>
                            </div>
                        )}

                        <div className="mt-8 flex justify-between pt-4 border-t border-gray-700">
                             <button onClick={() => { setStep(1); setFile(null); }} className="text-gray-400 hover:text-white">
                                Back
                            </button>
                            <button 
                                onClick={handleImport} 
                                disabled={!selectedTemplate || isLoading} 
                                className="bg-cyan-600 text-white font-semibold py-2 px-6 rounded-lg hover:bg-cyan-500 transition-colors disabled:bg-gray-700 disabled:text-gray-500"
                            >
                                {isLoading ? 'Importing...' : `Import ${previewData.totalRows} Cards`}
                            </button>
                        </div>
                    </div>
                )}
            </div>
            <style>{`.animate-fade-in-fast { animation: fadeIn 0.2s ease-out; } @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }`}</style>
        </div>
    );
};

export default ImportWizardModal;
