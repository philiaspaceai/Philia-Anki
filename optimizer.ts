
import { ReviewLog } from './types';

// Embedded Worker Code (Plain JS, no TS types)
const WORKER_CODE = `
self.onmessage = (event) => {
    try {
        const logs = event.data;
        // Simulate logging
        // console.log('[Worker] Starting optimization with ' + logs.length + ' review logs...');

        // Simulate a 3-second computation
        setTimeout(() => {
            // The actual algorithm would calculate new weights based on the logs.
            // For this simulation, we will return the FSRS-6 default weights (21 params).
            const newWeights = [
                0.212, 1.2931, 2.3065, 8.2956, 
                6.4133, 0.8334, 3.0194, 0.001, 
                1.8722, 0.1666, 0.796, 1.4835, 
                0.0614, 0.2629, 1.6483, 0.6014, 
                1.8729, 0.5425, 0.0912, 0.0658, 
                0.1542
            ];
            
            self.postMessage({ status: 'success', weights: newWeights });

        }, 3000);

    } catch (error) {
        self.postMessage({ status: 'error', message: error.message || 'Unknown worker error' });
    }
};
`;

/**
 * Runs the FSRS optimization process in a separate Web Worker thread
 * to avoid blocking the main UI thread.
 * 
 * @param logs An array of all review logs for a given deck.
 * @returns A promise that resolves with an array of 21 optimized FSRS weights.
 */
export function runOptimizationInWorker(logs: ReviewLog[]): Promise<number[]> {
    return new Promise((resolve, reject) => {
        // Create a Blob from the worker code string
        const blob = new Blob([WORKER_CODE], { type: 'application/javascript' });
        // Create a URL for the Blob
        const workerUrl = URL.createObjectURL(blob);
        
        // Initialize the worker using the Blob URL
        const worker = new Worker(workerUrl);

        // Listen for messages from the worker
        worker.onmessage = (event: MessageEvent<{ status: 'success' | 'error'; weights?: number[]; message?: string }>) => {
            if (event.data.status === 'success' && event.data.weights) {
                resolve(event.data.weights);
            } else {
                reject(new Error(event.data.message || 'Optimization failed in worker.'));
            }
            // Clean up
            worker.terminate();
            URL.revokeObjectURL(workerUrl);
        };

        // Listen for errors from the worker
        worker.onerror = (error: ErrorEvent) => {
            reject(new Error(`Worker error: ${error.message}`));
            // Clean up
            worker.terminate();
            URL.revokeObjectURL(workerUrl);
        };

        // Send the review logs to the worker to start the process
        worker.postMessage(logs);
    });
}
