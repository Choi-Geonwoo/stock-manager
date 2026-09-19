import axiosInstance from "../axiosInstance";

const PATH = "/nation";

export const nationService = {

    // =====================================================
    // 전체 조회
    // =====================================================

    getNations: () =>
        axiosInstance.get(PATH),

    searchNations: (params = {}) =>
        axiosInstance.get(PATH, {
            params,
        }),

    // =====================================================
    // 등록
    // =====================================================

    createNation: (data) =>
        axiosInstance.post(PATH, data),

    // =====================================================
    // 삭제
    // =====================================================

    deleteNation: (id) =>
        axiosInstance.delete(
            `${PATH}/${id}`
        ),

    // =====================================================
    // 초기화
    // =====================================================

    resetNation: () =>
        axiosInstance.delete(
            `${PATH}/reset`
        ),

    // =====================================================
    // 엑셀 업로드
    // =====================================================

    uploadNationExcel: async (file) => {

        const formData = new FormData();

        formData.append("file", file);

        return await axiosInstance.post(
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