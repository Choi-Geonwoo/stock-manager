import { useEffect, useState } from "react";
import { bankService } from "../../api/bank/bankApi";

export function useBank() {
  const [banks, setBanks] = useState([]);

  const [form, setForm] = useState({
    bncd: "",
    bnnm: "",
    useyn: "Y",
  });

  const [searchField, setSearchField] = useState("bncd");
  const [keyword, setKeyword] = useState("");

  const loadBanks = async () => {
    try {
      const res = await bankService.getBanks();

      setBanks(
        Array.isArray(res.data) ? res.data : []
      );
    } catch (err) {
      console.error("은행 목록 조회 실패:", err);
      setBanks([]);
    }
  };

  useEffect(() => {
    loadBanks();
  }, []);

  const search = async () => {
    try {
      const res =
        await bankService.searchBanks(
          searchField,
          keyword.trim()
        );

      setBanks(
        Array.isArray(res.data) ? res.data : []
      );
    } catch (err) {
      console.error("검색 실패:", err);
      alert("검색 중 오류가 발생했습니다.");
    }
  };

  const save = async () => {
    if (!form.bncd.trim()) {
      alert("은행/증권코드를 입력하세요.");
      return;
    }

    if (!form.bnnm.trim()) {
      alert("은행/증권명을 입력하세요.");
      return;
    }

    try {
      const res =
        await bankService.createBank(form);

      alert(
        res.data?.message || "저장되었습니다."
      );

      resetForm();
      loadBanks();
    } catch (err) {
      console.error("저장 실패:", err);
      alert("저장 중 오류가 발생했습니다.");
    }
  };

  const remove = async (id) => {
    const ok = confirm(
      `[${id}] 삭제하시겠습니까?`
    );

    if (!ok) return;

    try {
      await bankService.deleteBank(id);

      alert("삭제되었습니다.");
      loadBanks();
    } catch (err) {
      console.error(err);
      alert("삭제 실패");
    }
  };

  const resetForm = () => {
    setForm({
      bncd: "",
      bnnm: "",
      useyn: "Y",
    });
  };

  const headers = [
    {
      key: "bninfr_no",
      label: "거래번호",
    },
    {
      key: "bncd",
      label: "은행/증권코드",
    },
    {
      key: "bnnm",
      label: "은행/증권명",
    },
    {
      key: "useyn",
      label: "사용여부",
      render: (value) =>
        value === "Y"
          ? "사용"
          : "미사용",
    },
    {
      key: "delyn",
      label: "삭제여부",
      render: (value) =>
        value === "Y"
          ? "삭제"
          : "미삭제",
    },
  ];

  return {
    banks,
    form,
    setForm,
    searchField,
    setSearchField,
    keyword,
    setKeyword,
    search,
    save,
    remove,
    resetForm,
    loadBanks,
    headers,
  };
}