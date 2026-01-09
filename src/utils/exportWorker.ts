import * as XLSX from 'xlsx';

self.onmessage = async (e: MessageEvent) => {
    const { data, fileName } = e.data;

    try {
        // Criar a planilha a partir dos dados JSON
        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Dashboard");

        // Gerar o conteúdo do arquivo em formato binário (Uint8Array)
        const wbout = XLSX.write(wb, {
            bookType: 'xlsx',
            type: 'array',
            compression: true
        });

        // Retornar o resultado como um Blob (transferível)
        const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

        self.postMessage({ success: true, blob, fileName });
    } catch (err: any) {
        self.postMessage({ success: false, error: err.message });
    }
};
