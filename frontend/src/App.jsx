import {
    BrowserRouter,
    Routes,
    Route
} from "react-router-dom";

import MenuBar from "./components/MenuBar";

import DashboardPage from "./pages/Dashboard/DashboardPage";
import BankPage from "./pages/Bank/BankPage";
import NationPage from "./pages/Nation/NationPage";
import StockPage from "./pages/Stock/StockPage";
import TradePage from "./pages/Trade/TradePage";
import DividendPage from "./pages/Dividend/DividendPage";
import CalendarPage from "./pages/Calendar/CalendarPage";
import BalancePage from "./pages/Balance/BalancePage";


export default function App() {

    return (
        <BrowserRouter>

            <div style={{
                display: "flex"
            }}>

                <MenuBar />

                <div style={{
                    flex: 1,
                    padding: 20
                }}>

                    <Routes>
                        <Route
                            path="/"
                            element={<DashboardPage />}
                        />

                        <Route
                            path="/bank"
                            element={<BankPage />}
                        />

                        <Route
                            path="/nation"
                            element={<NationPage />}
                        />

                        <Route
                            path="/stock"
                            element={<StockPage />}
                        />

                        <Route
                            path="/trade"
                            element={<TradePage />}
                        />

                        <Route
                            path="/dividend"
                            element={<DividendPage />}
                        />

                        <Route  
                            path="/calendar" 
                            element={<CalendarPage />} 
                        />

                        <Route
                            path="/balance"
                            element={<BalancePage />}
                        />
                    </Routes>

                </div>

            </div>

        </BrowserRouter>
    );
}