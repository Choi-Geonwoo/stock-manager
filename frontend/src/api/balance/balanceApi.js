import axiosInstance from "../axiosInstance";

const PATH = "/balance";

export const balanceApi = {

    // 보유 종목 조회
    getBalanceList: () =>
        axiosInstance.get(PATH),

};