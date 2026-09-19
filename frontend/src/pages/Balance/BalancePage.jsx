import useBalance from "../../hooks/balance/useBalance";
import BalanceView from "./BalanceView";

export default function BalancePage() {

    const {
        loading,
        balanceList
    } = useBalance();

    return (
        <div className="admin-page-layout">

            <h2>보유 종목 현황</h2>
            <div className="m3-card result-section">

            <BalanceView
                loading={loading}
                balanceList={balanceList}
            />

            </div>
        </div>
    );
}