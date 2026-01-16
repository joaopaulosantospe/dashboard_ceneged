import * as XLSX from 'xlsx';
import { format, isValid } from 'date-fns';
import { ProcessedRow, timeToDecimal, decimalToTime, cleanMRU } from './utils/helpers';

self.onmessage = async (e: MessageEvent) => {
    try {
        const fileData = e.data; // ArrayBuffer
        const workbook = XLSX.read(fileData, { type: 'array', raw: true });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];

        // header:1 gera um array de arrays
        const rows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: true });

        const result: ProcessedRow[] = [];
        const groupedMap = new Map<string, any[]>();

        // Pulamos a primeira linha (cabeçalho)
        for (let i = 1; i < rows.length; i++) {
            const row = rows[i];
            if (!row || row.length < 42) continue;

            const rawDate = row[0];
            const colaborador = String(row[41] || "Não Identificado").trim();

            if (colaborador === "Não Identificado" || !rawDate) continue;

            // Processar Data
            let dateObj: Date | null = null;
            if (typeof rawDate === 'number') {
                dateObj = new Date(Math.round((rawDate - 25569) * 86400 * 1000));
            } else {
                dateObj = new Date(rawDate);
            }
            if (!isValid(dateObj)) continue;

            const dateKey = format(dateObj, 'yyyy-MM-dd');
            const groupKey = `${colaborador}|${dateKey}`;

            if (!groupedMap.has(groupKey)) groupedMap.set(groupKey, []);

            groupedMap.get(groupKey)!.push({
                row,
                dateObj,
                horaDec: timeToDecimal(row[36]), // Coluna AK
                intervalDec: timeToDecimal(row[46]) // Coluna AU
            });
        }

        groupedMap.forEach((records) => {
            const first = records[0];
            const colaborador = String(first.row[41] || "").trim();
            const rota = String(first.row[3] || "Sem Rota").trim();
            const regional = String(first.row[4] || "Sem Regional").trim();
            const mru = cleanMRU(first.row[12]);

            const hours = records.map(r => r.horaDec).filter(h => h > 0);
            const intervals = records.map(r => r.intervalDec).filter(h => h > 0);

            if (hours.length === 0) return;

            const startDec = Math.min(...hours);
            const endDec = Math.max(...hours);

            const sortedIntervals = intervals.sort((a, b) => b - a);
            const top3IntervalsSum = sortedIntervals.slice(0, 3).reduce((acc, val) => acc + val, 0);

            const bruteHoursDec = endDec - startDec;
            const netHoursDec = Math.max(0, bruteHoursDec - top3IntervalsSum);

            result.push({
                data: first.dateObj,
                data_formatada: format(first.dateObj, 'dd/MM/yyyy'),
                colaborador,
                rota,
                regional,
                mru,
                hora_inicio_dec: startDec,
                hora_final_dec: endDec,
                soma_intervalos_dec: top3IntervalsSum,
                horas_brutas_dec: bruteHoursDec,
                horas_liquidas_dec: netHoursDec,
                hora_inicio: decimalToTime(startDec),
                hora_final: decimalToTime(endDec),
                total_bruto: decimalToTime(bruteHoursDec),
                intervalo: decimalToTime(top3IntervalsSum),
                horas_liquidas: decimalToTime(netHoursDec),
                lote: String(first.row[2] || "").trim(),
                registros: records.length
            });
        });

        // Ordenação final
        result.sort((a, b) => a.data.getTime() - b.data.getTime() || a.colaborador.localeCompare(b.colaborador));

        self.postMessage({ success: true, data: result });
    } catch (error) {
        self.postMessage({ success: false, error: String(error) });
    }
};
