import axiosInstance from "../axiosInstance";

const PATH = "/dividend";

export const dividendsService = {

    getDividends: (
        page = 1,
        size = 10,
        year = "",
        month = "",
        bank = "",
        stock = ""
    ) =>
        axiosInstance.get("/dividend", {
            params: {
                page,
                size,
                year,
                month,
                bank,
                stock,
            },
        }),


    // ===========================
    // 월별 차트 조회
    // ===========================
    getMonthlyChart: (
        year = "",
        month = "",
        bank = "",
        stock = ""
    ) =>
        axiosInstance.get(`${PATH}/monthly`, {
            params: {
                year,
                month,
                bank,
                stock,
            },
        }),

    createDividend: (data) =>
        axiosInstance.post(PATH, data),

    updateDividend: (data) =>
        axiosInstance.put(`${PATH}/update`, data),

    deleteDividend: (id) =>
        axiosInstance.delete(`${PATH}/${id}`),

    resetDividend: () =>
        axiosInstance.delete(`${PATH}/reset`),
    // ⭕ dividendApi.js 의 uploadDividendFile 함수 구조
    uploadDividendFile: (file, dlngymd, alctndlngdsctn_no, filenm = "") => { 
        const formData = new FormData();
        
        // 💡 파일이 있을 때만 딱 한 번만 append 합니다.
        if (file) {
            formData.append("file", file);
        }
        
        formData.append("dlngymd", String(dlngymd).replaceAll("-", ""));
        formData.append("alctndlngdsctn_no", String(alctndlngdsctn_no).trim());
        if (filenm) {
            formData.append("filenm", filenm);
        }
        return axiosInstance.post(
            `${PATH}/upload`, // axiosInstance 기본 경로가 잡혀있다면 이렇게, 안 잡혀있다면 전체 주소 작성
            formData,
            {
                headers: {
                    "Content-Type": "multipart/form-data"
                }
            }
        );
    }
};