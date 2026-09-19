import { useEffect, useState } from "react";
import { nationService } from "../../api/nation/nationApi";

export function useNation() {
  const [nations, setNations] = useState([]);
  const [searchNtncd, setSearchNtncd] = useState("");
  const [searchNtnnm, setSearchNtnnm] = useState("");
  const [searchUseyn, setSearchUseyn] = useState("");

  const [form, setForm] = useState({
    ntncd: "",
    ntnnm: "",
    useyn: "Y",
  });

  const loadNations = async () => {
    try {
      const res = await nationService.getNations();
      setNations(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("국가 목록 조회 실패:", err);
      setNations([]);
    }
  };

  useEffect(() => {
    loadNations();
  }, []);

  const search = async () => {
    try {
      const res = await nationService.searchNations({
        ntncd: searchNtncd.trim(),
        ntnnm: searchNtnnm.trim(),
        useyn: searchUseyn,
      });

      setNations(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("검색 실패:", err);
      alert("검색 중 오류가 발생했습니다.");
    }
  };

  const save = async () => {
    if (!form.ntncd.trim()) {
      alert("국가코드를 입력하세요.");
      return;
    }

    if (!form.ntnnm.trim()) {
      alert("국가명을 입력하세요.");
      return;
    }

    try {
      const res = await nationService.createNation(form);

      alert(res.data?.message || "저장되었습니다.");

      resetForm();
      loadNations();
    } catch (err) {
      console.error("저장 실패:", err);
      alert("저장 중 오류가 발생했습니다.");
    }
  };

  const remove = async (id) => {
    const ok = confirm(`[${id}] 삭제하시겠습니까?`);
    if (!ok) return;

    try {
      await nationService.deleteNation(id);

      alert("삭제되었습니다.");
      loadNations();
    } catch (err) {
      console.error(err);
      alert("삭제 실패");
    }
  };

  const resetForm = () => {
    setForm({
      ntncd: "",
      ntnnm: "",
      useyn: "Y",
    });
  };

  const resetSearch = () => {
    setSearchNtncd("");
    setSearchNtnnm("");
    setSearchUseyn("");
    loadNations();
  };

  const headers = [
    { key: "ntninfo_no", label: "거래번호" },
    { key: "ntncd", label: "국가코드" },
    { key: "ntnnm", label: "국가명" },
    {
      key: "useyn",
      label: "사용여부",
      render: (value) =>
        value === "Y" ? "사용" : "미사용",
    },
  ];

  return {
    nations,
    searchNtncd,
    setSearchNtncd,
    searchNtnnm,
    setSearchNtnnm,
    searchUseyn,
    setSearchUseyn,
    form,
    setForm,
    search,
    save,
    remove,
    resetForm,
    resetSearch,
    headers,
  };
}