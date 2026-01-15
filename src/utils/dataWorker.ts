import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import { format, isValid, startOfDay } from 'date-fns';

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
        let originalLineCount = 0;
        let validLineCount = 0;

        if (type === 'csv') {
            // PAPAPARSE - Configuração Robusta com detecção de delimitador
            const results = await new Promise<any>((resolve, reject) => {
                Papa.parse(file, {
                    skipEmptyLines: 'greedy',
                    header: false,
                    dynamicTyping: false,
                    delimitersToGuess: [',', ';', '\t', '|'],
                    encoding: "ISO-8859-1", // Fallback comum para CSVs brasileiros
                    complete: resolve,
                    error: (err) => reject(new Error(`Erro ao ler CSV: ${err.message}`))
                });
            });
            rows = results.data as any[][];
            originalLineCount = rows.length;
            console.log(`CSV processado: ${rows.length} linhas iniciais.`);
        } else {
            // XLSX - Para Excel
            const arrayBuffer = await file.arrayBuffer();
            const workbook = XLSX.read(arrayBuffer, {
                type: 'array',
                cellDates: true,
                raw: false
            });

            console.log("Abas Excel:", workbook.SheetNames);

            let bestSheet = "";
            let maxScore = 0;

            for (const sheetName of workbook.SheetNames) {
                const sheet = workbook.Sheets[sheetName];
                const tempRows: any[][] = XLSX.utils.sheet_to_json(sheet, {
                    header: 1,
                    defval: ""
                });

                if (tempRows.length > 0) {
                    const score = tempRows.length * (tempRows[0]?.length || 0);
                    if (score > maxScore) {
                        maxScore = score;
                        rows = tempRows;
                        bestSheet = sheetName;
                    }
                }
            }
            originalLineCount = rows.length;
            console.log(`Melhor aba selecionada: '${bestSheet}' com score ${maxScore}`);
        }

        if (!rows || rows.length === 0) {
            throw new Error(`O arquivo ${file.name} não contém linhas de dados legíveis.`);
        }

        // Processamento (serão inicializados após a detecção de cabeçalhos)

        // Helper para parsing de data flexível (DD/MM/YYYY ou ISO)
        const parseFlexibleDate = (val: any): Date | null => {
            if (!val) return null;
            if (val instanceof Date) return startOfDay(val);

            let dt: Date;
            if (typeof val === 'number') {
                // Excel -> MS -> Local
                const ms = Math.round((val - 25569) * 86400 * 1000);
                const raw = new Date(ms);
                // Adicionar o offset para garantir que "Meia Noite UTC" vire "Meia Noite Local"
                dt = new Date(raw.getTime() + raw.getTimezoneOffset() * 60000);
            } else {
                const s = String(val).trim();
                if (!s) return null;

                // Formato Brasileiro DD/MM/YYYY
                const brMatch = s.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})/);
                if (brMatch) {
                    const d = parseInt(brMatch[1], 10);
                    const m = parseInt(brMatch[2], 10) - 1;
                    let y = parseInt(brMatch[3], 10);
                    if (y < 100) y += 2000;
                    dt = new Date(y, m, d);
                } else {
                    // Fallback para strings (pode ser ISO)
                    const parsed = new Date(s);
                    if (!isValid(parsed)) return null;
                    // Se for ISO yyyy-mm-dd sem hora, o JS interpreta como UTC.
                    // Forçamos para meia-noite local se não tiver hora explícita.
                    if (!s.includes(':')) {
                        dt = new Date(parsed.getTime() + parsed.getTimezoneOffset() * 60000);
                    } else {
                        dt = parsed;
                    }
                }
            }

            return isValid(dt) ? startOfDay(dt) : null;
        };

        // --- MAPEAR COLUNAS DINAMICAMENTE (COM FALLBACKS SINC) ---
        let idxDate = 0;
        let idxColab = 41; // Coluna AP
        let idxRota = 3;   // Coluna D
        let idxReg = 4;    // Coluna E
        let idxMru = 12;   // Coluna M
        let idxHora = 36;  // Coluna AK (Hora Leitura)
        let idxInterval = 46; // Coluna AU

        let headerRowIdx = -1;
        for (let i = 0; i < Math.min(rows.length, 500); i++) {
            const row = rows[i];
            if (!row || row.length < 10) continue;

            const rStr = row.map(c => String(c || "").toLowerCase());

            // Critério de identificação de cabeçalho: se tiver 'data' e algo que lembre 'colaborador' ou 'leitura'
            if (rStr.includes('data') && (rStr.some(s => s.includes('colab')) || rStr.some(s => s.includes('leitura')))) {
                headerRowIdx = i;

                // Priorizar nomes específicos para evitar confusão entre 'Hora' e 'Hora Leitura'
                const findIdx = (terms: string[]) => rStr.findIndex(s => terms.some(t => s.includes(t)));

                const dIdx = rStr.indexOf('data');
                if (dIdx !== -1) idxDate = dIdx;

                const cIdx = findIdx(['colaborador']);
                if (cIdx !== -1) idxColab = cIdx;
                else {
                    const nIdx = rStr.indexOf('nome');
                    if (nIdx !== -1) idxColab = nIdx;
                }

                const mIdx = rStr.indexOf('mru');
                if (mIdx !== -1) idxMru = mIdx;

                const rIdx = rStr.indexOf('rota');
                if (rIdx !== -1) idxRota = rIdx;

                const regIdx = rStr.indexOf('regional');
                if (regIdx !== -1) idxReg = regIdx;

                // Priorizar 'Hora Leitura' ou 'Leitura' sobre apenas 'Hora'
                const hlIdx = findIdx(['leitura']);
                if (hlIdx !== -1) idxHora = hlIdx;
                else {
                    const hIdx = rStr.indexOf('hora');
                    if (hIdx !== -1) idxHora = hIdx;
                }

                const iIdx = rStr.indexOf('intervalo');
                if (iIdx !== -1) idxInterval = iIdx;

                break;
            }
        }

        const startIdx = headerRowIdx === -1 ? 0 : headerRowIdx + 1;
        const result: any[] = [];
        const groupedMap = new Map<string, any[]>();

        let skippedRows = 0;
        let columnErrorRows = 0;
        let dateErrorRows = 0;

        const minCols = Math.max(idxDate, idxColab, idxHora, idxMru) + 1;

        for (let i = startIdx; i < rows.length; i++) {
            const row = rows[i];

            if (!row || row.length < minCols) {
                columnErrorRows++;
                skippedRows++;
                continue;
            }

            const rawDate = row[idxDate];
            const rawColab = row[idxColab];

            if (!rawDate || !rawColab || String(rawColab).trim() === "" || String(rawColab).toLowerCase().includes('colaborador')) {
                skippedRows++;
                continue;
            }

            const dateObj = parseFlexibleDate(rawDate);
            if (!dateObj || !isValid(dateObj)) {
                dateErrorRows++;
                skippedRows++;
                continue;
            }

            const dateKey = format(dateObj, 'yyyy-MM-dd');
            // Limpeza de MRU para evitar problemas com .0 ou espaços
            const mruStr = String(row[idxMru] || "").split('.')[0].trim().padStart(8, '0');

            // Suporte a múltiplos nomes na mesma célula
            const colabNames = String(rawColab).split(/[;/]/).map(n => n.trim()).filter(n => n.length > 3);

            for (const name of colabNames) {
                const groupKey = `${name}|${dateKey}|${mruStr}`;

                if (!groupedMap.has(groupKey)) groupedMap.set(groupKey, []);

                const hVal = row[idxHora];
                const hDec = timeToDecimalWorker(hVal);

                if (hDec > 0) {
                    groupedMap.get(groupKey)!.push({
                        row,
                        dateObj,
                        horaDec: hDec,
                        intervalDec: row.length > idxInterval ? timeToDecimalWorker(row[idxInterval]) : 0
                    });
                    validLineCount++;
                } else {
                    skippedRows++;
                }
            }
        }

        console.log(`Fim Worker: ${groupedMap.size} grupos, ${validLineCount} linhas válidas de ${rows.length}.`);

        groupedMap.forEach((records, key) => {
            const [name, dateStr, mru] = key.split('|');
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
                colaborador: name,
                rota: String(first.row[idxRota] || "Sem Rota").trim(),
                regional: String(first.row[idxReg] || "Sem Regional").trim(),
                mru: mru,
                registros: records.length,
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

        self.postMessage({
            success: true,
            data: result,
            stats: {
                originalLines: rows.length,
                validLines: validLineCount,
                groupedRecords: result.length,
                detectedColumns: {
                    date: idxDate,
                    colab: idxColab,
                    mru: idxMru,
                    hora: idxHora
                }
            }
        });

    } catch (err: any) {
        console.error("Worker Error:", err);
        self.postMessage({ success: false, error: err.message });
    }
};
