import axiosInstance from "../axiosInstance";

const PATH = "/stock";

export const stockService = {

    // ==========================================
    // 조회
    // ==========================================
    getStocks: (
        page = 1,
        size = 10,
        ntncd = "",
        stcktea = "",
        alctn = "",
        stcknm = ""
    ) =>
        axiosInstance.get(PATH, {
            params: {
                page,
                size,
                ntncd,
                stcktea,
                alctn,
                stcknm,
            },
        }),

    // ==========================================
    // 등록
    // ==========================================
    createStock: (data) =>
        axiosInstance.post(
            PATH,
            data
        ),

    // ==========================================
    // 삭제
    // ==========================================
    deleteStock: (id) =>
        axiosInstance.delete(
            `${PATH}/${id}`
        ),

    // ==========================================
    // 초기화
    // ==========================================
    resetStock: () =>
        axiosInstance.delete(
            `${PATH}/reset`
        ),
};