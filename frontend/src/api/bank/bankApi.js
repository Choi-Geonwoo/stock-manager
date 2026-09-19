import axiosInstance from "../axiosInstance";

const PATH = "/bank";

export const bankService = {
  // 전체 조회
  getBanks: () => 
    axiosInstance.get(PATH),

  // 생성
  createBank: (data) => 
    axiosInstance.post(PATH, data),

  // 삭제
  deleteBank: (id) => 
    axiosInstance.delete(`${PATH}/${id}`),

  // 초기화
  resetBank: () => 
    axiosInstance.delete(`${PATH}/reset`),

  // 검색 (쿼리 스트링은 params 객체로 넘기는 것이 안전하고 깔끔합니다)
  searchBanks: (field, keyword) =>
    axiosInstance.get(`${PATH}/search`, {
      params: { field, keyword },
    }),


    // =====================================================
    // 엑셀 업로드
    // =====================================================

    uploadBanksExcel: async (file) => {

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