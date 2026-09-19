import { useEffect, useState } from "react";
import { balanceApi } from "../../api/balance/balanceApi";

export default function useBalance() {

    const [balanceList, setBalanceList] = useState([]);
    const [loading, setLoading] = useState(false);

    const getBalanceList = async () => {

        setLoading(true);

        try {

            const response = await balanceApi.getBalanceList();

            setBalanceList(response.data);

        } catch (error) {

            console.error(error);

        } finally {

            setLoading(false);

        }

    };

    useEffect(() => {

        getBalanceList();

    }, []);

    return {
        loading,
        balanceList,
        getBalanceList
    };

}