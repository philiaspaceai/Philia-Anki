
// This is the Web Worker file for FSRS optimization.
// It runs in a separate thread from the main UI, preventing any lag.

self.onmessage = (event: MessageEvent<any[]>) => {
    try {
        const logs = event.data;

        // --- HEAVY COMPUTATION SIMULATION ---
        // In a real-world scenario, this is where the complex, CPU-intensive
        // FSRS optimization algorithm (like gradient descent) would run.
        // We'll simulate this with a delay to demonstrate the non-blocking nature.
        console.log(`[Worker] Starting optimization with ${logs.length} review logs...`);

        // Simulate a 3-second computation
        setTimeout(() => {
            // The actual algorithm would calculate new weights based on the logs.
            // For this simulation, we will return the default weights (FSRS-6 / 21 params) as a placeholder.
            const newWeights = [
                0.212, 1.2931, 2.3065, 8.2956, 
                6.4133, 0.8334, 3.0194, 0.001, 
                1.8722, 0.1666, 0.796, 1.4835, 
                0.0614, 0.2629, 1.6483, 0.6014, 
                1.8729, 0.5425, 0.0912, 0.0658, 
                0.1542
            ];
            
            console.log('[Worker] Optimization complete. Sending new weights back to main thread.');
            
            // Send the result back to the main thread
            self.postMessage({ status: 'success', weights: newWeights });

        }, 3000);

    } catch (error) {
        console.error('[Worker] Error during optimization:', error);
        self.postMessage({ status: 'error', message: error instanceof Error ? error.message : 'Unknown worker error' });
    }
};
