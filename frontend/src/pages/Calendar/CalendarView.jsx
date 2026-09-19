import "../../styles/calendar.css";

const WEEK_DAYS = [
  "일",
  "월",
  "화",
  "수",
  "목",
  "금",
  "토",
];

export default function CalendarView({
  year,
  month,
  cells,

  selectedDate,
  setSelectedDate,

  setCurrent,

  showMonthTotal,
  setShowMonthTotal,

  getDividend,
  formatDateStr,
  formatCurrency,

  selectedDividends,
  currentMonthDividends,
}) {
  const moveMonth = (diff) => {
    setCurrent(new Date(year, month + diff));
    setSelectedDate("");
  };

  return (
    <div className="admin-page-layout">
      <h2>배당 캘린더</h2>

      <div className="calendar-nav">
        <button
          className="btn btn-gray"
          onClick={() => moveMonth(-1)}
        >
          ◀
        </button>

        <h3>
          {year}년 {month + 1}월
        </h3>

        <button
          className="btn btn-gray"
          onClick={() => moveMonth(1)}
        >
          ▶
        </button>
      </div>

      <div className="calendar-layout">

        {/* 달력 */}
        <div className="calendar-main">
          <div className="calendar-grid m3-card search-section">

            {WEEK_DAYS.map((day) => (
              <div
                key={day}
                className="calendar-head"
              >
                {day}
              </div>
            ))}

            {cells.map((day, idx) => {
              if (day === null) {
                return (
                  <div
                    key={`blank-${idx}`}
                    className="calendar-cell"
                  />
                );
              }

              const date = formatDateStr(day);
              const items = getDividend(day);

              return (
                <div
                  key={`day-${day}`}
                  className={`calendar-cell ${
                    selectedDate === date
                      ? "active"
                      : ""
                  }`}
                  onClick={() =>
                    setSelectedDate(date)
                  }
                >
                  <div className="calendar-day-number">
                    {day}
                  </div>

                  {items.map((item) => (
                    <div
                      key={item.alctndlngdsctn_no}
                      className="dividend-badge"
                    >
                      {item.stcknm}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>

        {/* 오른쪽 */}
        <div className="calendar-side-wrapper">

          {/* 선택 날짜 */}
          <div className="calendar-side m3-card">

            <h3>
              📌 {selectedDate || "날짜 선택"}
            </h3>

            {selectedDividends.length === 0 ? (
              <p>선택된 날짜의 내역이 없습니다.</p>
            ) : (
              selectedDividends.map((item) => (
                <div
                  key={item.alctndlngdsctn_no}
                >
                  <strong>
                    {item.stcknm}
                  </strong>

                  <div>
                    거래금액 :
                    {" "}
                    {formatCurrency(
                      item.dlngamt,
                      item.ntncd
                    )}
                  </div>

                  <div>
                    배당금 :
                    {" "}
                    {formatCurrency(
                      item.dvdnd,
                      item.ntncd
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          <br />

          {/* 월 전체 */}
          <div className="calendar-side m3-card">

            <h3>
              📊 {month + 1}월 전체 내역 (
              {currentMonthDividends.length}건)
            </h3>

            <button
              className="btn btn-gray"
              onClick={() =>
                setShowMonthTotal(
                  !showMonthTotal
                )
              }
            >
              {showMonthTotal
                ? "접기"
                : "펼치기"}
            </button>

            {showMonthTotal &&
              currentMonthDividends.map((item) => (
                <div
                  key={item.alctndlngdsctn_no}
                  onClick={() =>
                    setSelectedDate(
                      item.dlngymd
                    )
                  }
                >
                  <hr />

                  <strong>
                    주식명 : {item.stcknm}
                  </strong>

                  <div>
                    거래일자 : {item.dlngymd}
                  </div>

                  <div>
                    거래금액 :
                    {" "}
                    {formatCurrency(
                      item.dlngamt,
                      item.ntncd
                    )}
                  </div>

                  <div>
                    배당금 :
                    {" "}
                    {formatCurrency(
                      item.dvdnd,
                      item.ntncd
                    )}
                  </div>
                </div>
              ))}
          </div>

        </div>
      </div>
    </div>
  );
}