import axiosInstance from "../axiosInstance";

const PATH = "/calendar";

export const calendarService = {
  // ==========================================
  // 달력 조회
  // ==========================================
  getCalendar: (yyyymm) =>
    axiosInstance.get(`${PATH}/${yyyymm}`),
};