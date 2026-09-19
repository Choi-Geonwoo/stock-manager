import downloadExcelData from "./downloadExcelData";

export default function CommonExcelDownloadButton({
    rows,
    headers,
    fileName,
    sheetName = "Sheet1",
    buttonText = "엑셀 다운로드",
    className = "btn btn-success",
    disabled = false,
    onBeforeDownload,
    onAfterDownload,
    fetchRows,
}) {
    const handleDownload = async () => {
        if (disabled) {
            return;
        }

        let downloadRows = rows;

        if (typeof fetchRows === "function") {
            const fetchedRows = await fetchRows();
            if (Array.isArray(fetchedRows)) {
                downloadRows = fetchedRows;
            }
        }

        if (!Array.isArray(downloadRows) || downloadRows.length === 0) {
            return;
        }

        if (onBeforeDownload) {
            const shouldProceed = onBeforeDownload(downloadRows);
            if (shouldProceed === false) {
                return;
            }
        }

        const success = downloadExcelData({ rows: downloadRows, headers, fileName, sheetName });

        if (success && onAfterDownload) {
            onAfterDownload(downloadRows);
        }
    };

    return (
        <button
            type="button"
            className={className}
            onClick={handleDownload}
            disabled={disabled || !Array.isArray(rows) || rows.length === 0}
        >
            {buttonText}
        </button>
    );
}
