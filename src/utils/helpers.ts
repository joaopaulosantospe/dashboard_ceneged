import { format } from 'date-fns';

export interface ProcessedRow {
    data: Date;
    data_formatada: string;
    colaborador: string;
    rota: string;
    regional: string;
    mru: string;
    hora_inicio_dec: number;
    hora_final_dec: number;
    soma_intervalos_dec: number;
    horas_brutas_dec: number;
    horas_liquidas_dec: number;
    hora_inicio: string;
    hora_final: string;
    total_bruto: string;
    intervalo: string;
    registros: number;
    horas_liquidas: string;
    lote: string;
}

/**
 * Converte valores do Excel para horas decimais com precisão
 */
export const timeToDecimal = (value: any): number => {
    if (value === undefined || value === null || value === "") return 0;

    // 1. Se o Excel já enviou como número (fração do dia: 0.5 = 12h)
    if (typeof value === 'number') {
        return value * 24;
    }

    // 2. Se for um objeto Date (caso o XLSX converta automaticamente)
    if (value instanceof Date) {
        return value.getUTCHours() + value.getUTCMinutes() / 60 + value.getUTCSeconds() / 3600;
    }

    // 3. Se for string "HH:MM:SS"
    const str = String(value).trim();
    if (str.includes(':')) {
        const parts = str.split(':');
        const h = parseInt(parts[0]) || 0;
        const m = parseInt(parts[1]) || 0;
        const s = parseInt(parts[2]) || 0;
        return h + m / 60 + s / 3600;
    }

    return 0;
};

/**
 * Converte decimal para formato HH:MM:SS
 */
export const decimalToTime = (decimalHours: number): string => {
    if (isNaN(decimalHours) || decimalHours <= 0) return "00:00:00";

    // Arredondar para o segundo mais próximo primeiro para evitar erros de precisão
    const totalSeconds = Math.round(Math.abs(decimalHours) * 3600);

    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;

    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${decimalHours < 0 ? '-' : ''}${pad(h)}:${pad(m)}:${pad(s)}`;
};

/**
 * Limpa MRU
 */
export const cleanMRU = (mru: any): string => {
    if (!mru) return "";
    let val = String(mru).split('-')[0].replace(/\.0$/, "").trim();
    return val.padStart(8, '0');
};
