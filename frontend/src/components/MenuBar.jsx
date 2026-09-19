import { Link } from "react-router-dom";

export default function MenuBar() {

    const menus = [
        { path: "/", name: "대시보드" },
        { path: "/balance", name: "잔고관리" },
        { path: "/bank", name: "은행/증권관리" },
        { path: "/nation", name: "국가관리" },
        { path: "/stock", name: "주식관리" },
        { path: "/trade", name: "거래내역" },
        { path: "/dividend", name: "배당내역" },
        { path: "/calendar", name: "배당달력" }
    ];

    return (
        <div className="menu">

            <h2>Stock Manager</h2>

            {
                menus.map(menu => (
                    <Link
                        key={menu.path}
                        to={menu.path}
                        className="menu-item"
                    >
                        {menu.name}
                    </Link>
                ))
            }

        </div>
    );
}