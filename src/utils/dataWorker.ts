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

        // Mapeamento de Colunas (ESTRITO conforme solicitado por posição)
        const idxDate = 0;     // Coluna A
        const idxRota = 3;     // Coluna D
        const idxReg = 4;      // Coluna E
        const idxRegField = 9; // Coluna J (Registros)
        const idxMru = 12;     // Coluna M
        const idxHora = 36;    // Coluna AK (Hora Leitura)
        const idxColab = 41;   // Coluna AP
        const idxInterval = 46; // Coluna AU

        const startIdx = 1; // Sempre começa na linha 2 (índice 1)
        const result: any[] = [];
        const groupedMap = new Map<string, any[]>();

        let skippedRows = 0;
        let columnErrorRows = 0;
        let dateErrorRows = 0;

        // Calcular minCols essencial (Apenas Data e MRU)
        const minCols = Math.max(idxDate, idxMru) + 1;

        for (let i = startIdx; i < rows.length; i++) {
            const row = rows[i];

            if (!row || row.length < minCols) {
                columnErrorRows++;
                skippedRows++;
                continue;
            }

            const rawDate = row[idxDate];
            if (!rawDate || String(rawDate).trim() === "") {
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

            // Campos com consulta segura por índice
            const rawColab = row.length > idxColab ? row[idxColab] : "";
            const rawMru = row.length > idxMru ? row[idxMru] : "";
            const rawRota = row.length > idxRota ? row[idxRota] : "";
            const rawReg = row.length > idxReg ? row[idxReg] : "";
            const rawRegField = row.length > idxRegField ? row[idxRegField] : "";
            const rawHora = row.length > idxHora ? row[idxHora] : "";
            const rawInterval = row.length > idxInterval ? row[idxInterval] : "";

            // Se não tiver colaborador, não descartar a linha
            const colabStr = (rawColab && String(rawColab).trim() !== "") ? String(rawColab) : "Sem Colaborador";
            const mruStr = String(rawMru || "").split('.')[0].trim().padStart(8, '0');

            // Suporte a múltiplos nomes na mesma célula
            const colabNames = colabStr.split(/[;/]/).map(n => n.trim()).filter(n => n.length > 1);
            if (colabNames.length === 0) colabNames.push("Sem Colaborador");

            for (const name of colabNames) {
                const groupKey = `${name}|${dateKey}|${mruStr}`;

                if (!groupedMap.has(groupKey)) groupedMap.set(groupKey, []);

                const hDec = timeToDecimalWorker(rawHora);

                groupedMap.get(groupKey)!.push({
                    row,
                    dateObj,
                    horaDec: hDec,
                    hasTime: (rawHora !== undefined && rawHora !== null && String(rawHora).trim() !== "" && String(rawHora).trim() !== "0"),
                    regValue: String(rawRegField || "").trim(),
                    intervalDec: timeToDecimalWorker(rawInterval),
                    customRota: String(rawRota || "Sem Rota").trim(),
                    customReg: String(rawReg || "Sem Regional").trim()
                });
                validLineCount++;
            }
        }

        console.log(`Fim Worker: ${groupedMap.size} grupos, ${validLineCount} linhas válidas de ${rows.length}.`);

        groupedMap.forEach((records, key) => {
            const [name, dateStr, mru] = key.split('|');
            const first = records[0];

            // Focar apenas em registros que tenham hora preenchida para cálculos de tempo
            const validTimeRecords = records.filter(r => r.hasTime);
            const hours = validTimeRecords.map(r => r.horaDec);
            const intervals = records.map(r => r.intervalDec).filter(h => h > 0);

            // Contagem de valores únicos da Coluna J (regValue)
            const uniqueRegValues = new Set(records.map(r => r.regValue).filter(v => v !== "")).size;
            const finalRegistros = uniqueRegValues > 0 ? uniqueRegValues : records.length;

            let startDec = 0;
            let endDec = 0;
            let top3Sum = 0;
            let bruteDec = 0;
            let netDec = 0;

            if (hours.length > 0) {
                startDec = Math.min(...hours);
                endDec = Math.max(...hours);
                const sortedIntervals = intervals.sort((a, b) => b - a);
                top3Sum = sortedIntervals.slice(0, 3).reduce((acc, val) => acc + val, 0);
                bruteDec = endDec - startDec;
                netDec = Math.max(0, bruteDec - top3Sum);
            }

            result.push({
                data: first.dateObj,
                data_formatada: format(first.dateObj, 'dd/MM/yyyy'),
                colaborador: name,
                rota: records.find(r => r.customRota !== "Sem Rota")?.customRota || "Sem Rota",
                regional: records.find(r => r.customReg !== "Sem Regional")?.customReg || "Sem Regional",
                mru: mru,
                registros: finalRegistros,
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
