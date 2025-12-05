// Web Worker for processing Excel files
// This runs in a background thread to prevent UI freezing

importScripts('https://cdn.sheetjs.com/xlsx-0.20.3/package/dist/xlsx.full.min.js');

declare const XLSX: any;

self.onmessage = (event: MessageEvent) => {
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

            const headers = jsonData[0] as string[];
            const previewRows = jsonData.slice(1, 6) as string[][];

            self.postMessage({ type: 'preview_result', data: { headers, previewRows, totalRows: jsonData.length - 1 } });
            
        } else if (type === 'process') {
            const { fileBuffer, mapping, templateId } = payload;
            const workbook = XLSX.read(fileBuffer, { type: 'array' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
            // Remove header row
            const rows = jsonData.slice(1) as string[][];

            // Mapping: { fieldId: columnIndex }
            // We need to convert this to an array of objects matching the Card structure
            const newCards = rows.map(row => {
                const fieldValues: Record<string, string> = {};
                
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
        self.postMessage({ type: 'error', message: error instanceof Error ? error.message : 'Unknown import error' });
    }
};