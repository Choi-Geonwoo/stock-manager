import * as XLSX from "xlsx";

export default function downloadExcelData({ rows, headers, fileName, sheetName = "Sheet1" }) {
    if (!Array.isArray(rows) || rows.length === 0) {
        return false;
    }

    const normalizedHeaders = headers.filter((header) => header && header.key && header.label);

    if (!normalizedHeaders.length) {
        return false;
    }

    const excelRows = rows.map((row) => {
        const converted = {};

        normalizedHeaders.forEach(({ key, label }) => {
            converted[label] = row?.[key] ?? "";
        });

        return converted;
    });

    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(excelRows);
    worksheet["!cols"] = normalizedHeaders.map(({ label }) => ({
        wch: Math.max(String(label).length, 10)
    }));

    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    XLSX.writeFile(workbook, fileName || `download_${new Date().toISOString().slice(0, 10)}.xlsx`);

    return true;
}
