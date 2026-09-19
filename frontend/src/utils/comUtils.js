export const formatCurrency = (value, nation) => {
    const amount = Number(value || 0);

    switch (nation) {
        case "한국":
            return new Intl.NumberFormat("ko-KR", {
                style: "currency",
                currency: "KRW",
                maximumFractionDigits: 0,
            }).format(amount);

        case "미국":
            return new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: "USD",
                minimumFractionDigits: 0, // 정수면 소수점 표시 안 함
                maximumFractionDigits: 2, // 소수점 있으면 최대 2자리
            }).format(amount);

        case "일본":
            return new Intl.NumberFormat("ja-JP", {
                style: "currency",
                currency: "JPY",
                maximumFractionDigits: 0,
            }).format(amount);

        case "유럽":
            return new Intl.NumberFormat("de-DE", {
                style: "currency",
                currency: "EUR",
                minimumFractionDigits: 0,
                maximumFractionDigits: 2,
            }).format(amount);

        default:
            return amount.toLocaleString();
    }
};



export function normalizeList(responseData) {
  if (Array.isArray(responseData)) {
    return responseData;
  }

  if (Array.isArray(responseData?.data)) {
    return responseData.data;
  }

  return [];
}

export function formatCurrency_old(value) {
  return Number(value || 0).toLocaleString();
}

export function getCurrencySymbol(countryName = "") {
  const normalized = String(countryName).replace(/\s+/g, "").toLowerCase();

  if (
    normalized.includes("미국") ||
    normalized.includes("usa") ||
    normalized.includes("us")
  ) {
    return "$";
  }

  if (
    normalized.includes("한국") ||
    normalized.includes("korea") ||
    normalized.includes("kr")
  ) {
    return "₩";
  }

  if (
    normalized.includes("일본") ||
    normalized.includes("japan") ||
    normalized.includes("jp")
  ) {
    return "¥";
  }

  if (
    normalized.includes("영국") ||
    normalized.includes("uk") ||
    normalized.includes("britain")
  ) {
    return "£";
  }

  if (
    normalized.includes("유럽") ||
    normalized.includes("euro") ||
    normalized.includes("eu")
  ) {
    return "€";
  }

  return "₩";
}

export function getMonthKey(date = new Date()) {
  return date.toISOString().slice(0, 7);
}

export function getDividendMonthKey(value = "") {
  const digits = String(value).replace(/[^0-9]/g, "");

  if (digits.length >= 6) {
    return `${digits.slice(0, 4)}-${digits.slice(4, 6)}`;
  }

  return "";
}

export function formatDate(value) {
  const digits = String(value || "").replace(/[^0-9]/g, "");

  if (digits.length !== 8) {
    return value || "";
  }

  return `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6, 8)}`;
}
