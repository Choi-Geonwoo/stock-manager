import { useState } from "react";

export default function CommonInput({
  label,
  type = "text",
  placeholder,
  value,
  onChange
}) {
  const [error, setError] = useState("");

  const handleChange = (e) => {
    if (type === "file") {
      const file = e.target.files[0];

      if (!file) {
        setError("파일을 선택해주세요.");
      } else {
        setError("");
      }

      onChange(e); // 부모에게 File 객체 전달
      return;
    }

    const inputValue = e.target.value;
    if (inputValue.length < 1) {
      setError("1글자 이상 입력해주세요.");
    } else {
      setError("");
    }

    onChange(e);
  };

  return (
    <div className="horizontal-form-group">
      {label && <label className="form-label">{label}</label>}

      <div className="input-block">
        <input
          className="input"
          type={type}
          placeholder={placeholder}
          value={type === "file" ? undefined : value}
          onChange={handleChange}
        />

        {error && <p className="form-error-text">{error}</p>}
      </div>
    </div>
  );
}