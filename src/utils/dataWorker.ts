import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import { format, isValid } from 'date-fns';

// Minimal helper to avoid imports in worker
const timeToDecimalWorker = (timeStr: any): number => {
    if (!timeStr) return 0;
    const str = String(timeStr).trim();
    if (!str || str === '0') return 0;

    // Formato HH:MM:SS
    const parts = str.split(':');
    if (parts.length >= 2) {
        const h = parseInt(parts[0], 10) || 0;
        const m = parseInt(parts[1], 10) || 0;
        const s = parseInt(parts[2] || '0', 10) || 0;
        return h + m / 60 + s / 3600;
    }

    // Formato numérico Excel
    const num = parseFloat(str.replace(',', '.'));
    if (!isNaN(num) && num < 1) {
        return num * 24;
    }

    return 0;
};

const cleanMRUWorker = (mru: any): string => {
    if (!mru) return "";
    const str = String(mru).replace(/\.0$/, "").split('-')[0].trim();
    return str.padStart(8, '0');
};

const decimalToTimeWorker = (decimal: number): string => {
    if (!decimal || decimal < 0) return "00:00:00";
    const h = Math.floor(decimal);
    const m = Math.floor((decimal - h) * 60);
    const s = Math.round(((decimal - h) * 60 - m) * 60);

    let finalH = h;
    let finalM = m;
    let finalS = s;

    if (finalS === 60) { finalS = 0; finalM += 1; }
    if (finalM === 60) { finalM = 0; finalH += 1; }

    return `${String(finalH).padStart(2, '0')}:${String(finalM).padStart(2, '0')}:${String(finalS).padStart(2, '0')}`;
};

self.onmessage = async (e: MessageEvent) => {
    const { file, type } = e.data;

    try {
        let rows: any[][] = [];

        if (type === 'csv') {
            // PAPAPARSE - Configuração Robusta
            const csvText = await file.text();
            const results = Papa.parse(csvText, {
                skipEmptyLines: true,
                header: false,
                dynamicTyping: false // Manter como string para evitar erros de formatação
            });
            rows = results.data as any[][];
            console.log(`CSV processado: ${rows.length} linhas.`);
        } else {
            // XLSX - Para Excel
            const arrayBuffer = await file.arrayBuffer();
            const workbook = XLSX.read(arrayBuffer, {
                type: 'array',
                cellDates: true, // Importante para datas
                raw: false       // Deixar o SheetJS tentar formatar valores
            });

            console.log("Abas Excel:", workbook.SheetNames);

            // Tentar achar a aba com MAIS COLUNAS primeiro (geralmente é a de dados)
            let bestSheet = "";
            let maxScore = 0;

            for (const sheetName of workbook.SheetNames) {
                const sheet = workbook.Sheets[sheetName];
                const tempRows: any[][] = XLSX.utils.sheet_to_json(sheet, {
                    header: 1,
                    defval: ""
                });

                if (tempRows.length > 0) {
                    // Score = Linhas * Colunas (Aba com mais densidade de dados)
                    const score = tempRows.length * (tempRows[0]?.length || 0);
                    if (score > maxScore) {
                        maxScore = score;
                        rows = tempRows;
                        bestSheet = sheetName;
                    }
                }
            }
            console.log(`Melhor aba selecionada: '${bestSheet}' com score ${maxScore}`);
        }

        if (!rows || rows.length === 0) {
            throw new Error(`O arquivo ${file.name} não contém linhas de dados legíveis.`);
        }

        // Processamento
        const result: any[] = [];
        const groupedMap = new Map<string, any[]>();

        // Encontrar o cabeçalho dinamicamente
        // Procuramos por uma linha que pareça o cabeçalho (tem data na col 0 e texto colab na col 41)
        let headerRowIdx = -1;
        for (let i = 0; i < Math.min(rows.length, 100); i++) {
            const row = rows[i];
            if (row && row.length > 41) {
                // Se a linha i tem dados e a linha i+1 parece ter dados de colaborador
                const nextRow = rows[i + 1];
                if (nextRow && nextRow[41] && String(nextRow[41]).length > 2) {
                    headerRowIdx = i;
                    break;
                }
            }
        }

        // Se não achou cabeçalho, começa da linha 1 (assumindo que a 0 é cabeçalho)
        const startIdx = headerRowIdx === -1 ? 1 : headerRowIdx + 1;
        console.log(`Iniciando processamento a partir da linha ${startIdx}`);

        for (let i = startIdx; i < rows.length; i++) {
            const row = rows[i];
            if (!row || row.length < 15) continue; // Linha muito curta é sujeira

            const rawDate = row[0];
            const colaborador = row[41];

            if (!rawDate || !colaborador || String(colaborador).trim() === "") continue;

            let dateObj: Date | null = null;
            if (rawDate instanceof Date) {
                dateObj = rawDate;
            } else if (typeof rawDate === 'number') {
                dateObj = new Date(Math.round((rawDate - 25569) * 86400 * 1000));
            } else {
                dateObj = new Date(String(rawDate).trim());
            }

            if (!isValid(dateObj)) continue;

            const dateKey = format(dateObj, 'yyyy-MM-dd');
            const colabStr = String(colaborador).trim();
            const groupKey = `${colabStr}|${dateKey}`;

            if (!groupedMap.has(groupKey)) groupedMap.set(groupKey, []);

            groupedMap.get(groupKey)!.push({
                row,
                dateObj,
                horaDec: timeToDecimalWorker(row[36]),
                intervalDec: timeToDecimalWorker(row[46])
            });
        }

        if (groupedMap.size === 0) {
            throw new Error(`Dados não encontrados no formato esperado. \nVerifique se:\n1. A primeira aba tem dados.\n2. A coluna A tem datas.\n3. A coluna AP tem nomes.`);
        }

        groupedMap.forEach((records) => {
            const first = records[0];
            const hours = records.map(r => r.horaDec).filter(h => h > 0);
            const intervals = records.map(r => r.intervalDec).filter(h => h > 0);

            if (hours.length === 0) return;

            const startDec = Math.min(...hours);
            const endDec = Math.max(...hours);
            const sortedIntervals = intervals.sort((a, b) => b - a);
            const top3Sum = sortedIntervals.slice(0, 3).reduce((acc, val) => acc + val, 0);
            const bruteDec = endDec - startDec;
            const netDec = Math.max(0, bruteDec - top3Sum);

            result.push({
                data: first.dateObj,
                data_formatada: format(first.dateObj, 'dd/MM/yyyy'),
                colaborador: String(first.row[41] || "").trim(),
                rota: String(first.row[3] || "Sem Rota").trim(),
                regional: String(first.row[4] || "Sem Regional").trim(),
                mru: cleanMRUWorker(first.row[12]),
                hora_inicio_dec: startDec,
                hora_final_dec: endDec,
                soma_intervalos_dec: top3Sum,
                horas_brutas_dec: bruteDec,
                horas_liquidas_dec: netDec,
                hora_inicio: decimalToTimeWorker(startDec),
                hora_final: decimalToTimeWorker(endDec),
                total_bruto: decimalToTimeWorker(bruteDec),
                intervalo: decimalToTimeWorker(top3Sum),
                horas_liquidas: decimalToTimeWorker(netDec)
            });
        });

        result.sort((a, b) => a.data.getTime() - b.data.getTime() || a.colaborador.localeCompare(b.colaborador));
        self.postMessage({ success: true, data: result });

    } catch (err: any) {
        console.error("Worker Error:", err);
        self.postMessage({ success: false, error: err.message });
    }
};
