import { ProcessedRow } from './helpers';
export { timeToDecimal, decimalToTime, cleanMRU } from './helpers';
export type { ProcessedRow } from './helpers';

export const processData = async (file: File): Promise<ProcessedRow[]> => {
    return new Promise((resolve, reject) => {
        const type = file.name.endsWith('.csv') ? 'csv' : 'xlsx';

        // Usando o Worker para processamento em background (Vite detectará isso)
        const worker = new Worker(new URL('./dataWorker.ts', import.meta.url), {
            type: 'module'
        });

        worker.postMessage({ file, type });

        worker.onmessage = (e) => {
            const { success, data, error } = e.data;
            if (success) {
                // Converter strings de data de volta para objetos Date (Workers transferem como strings)
                const restoredData = data.map((row: any) => ({
                    ...row,
                    data: new Date(row.data)
                }));
                resolve(restoredData);
            } else {
                reject(new Error(error));
            }
            worker.terminate();
        };

        worker.onerror = (err) => {
            reject(new Error("Erro no processamento em segundo plano."));
            worker.terminate();
        };
    });
};
