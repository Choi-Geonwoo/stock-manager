import axiosInstance from "../axiosInstance";

const PATH = "/trade";

export const tradeService = {

    // ==========================
    // 전체 조회
    // ==========================
    getTrades: (page = 1, size = 10) =>
        axiosInstance.get(PATH, {
            params: {
                page,
                size
            }
        }),

    // ==========================
    // 상세 조회
    // ==========================
    getTrade: (id) =>
        axiosInstance.get(`${PATH}/${id}`),

    // ==========================
    // 등록
    // ==========================
    createTrade: (data) =>
        axiosInstance.post(PATH, data),

    // ==========================
    // 수정
    // ==========================
    updateTrade: (data) =>
        axiosInstance.put(PATH, data),

    // ==========================
    // 삭제
    // ==========================
    deleteTrade: (id) =>
        axiosInstance.delete(`${PATH}/${id}`),

    // ==========================
    // 전체 초기화
    // ==========================
    resetTrade: () =>
        axiosInstance.delete(`${PATH}/reset`),

    // ==========================
    // 검색
    // ==========================
    searchTrades: (searchParams) =>
        axiosInstance.get(
            `${PATH}/search`,
            {
                params: searchParams
            }
        ),

    // ==========================
    // 엑셀 업로드
    // ==========================
    uploadTradesExcel: (file) => {

        const formData = new FormData();

        formData.append(
            "file",
            file
        );

        return axiosInstance.post(
            `${PATH}/excel/upload`,
            formData,
            {
                headers: {
                    "Content-Type":
                        "multipart/form-data"
                }
            }
        );
    }
};