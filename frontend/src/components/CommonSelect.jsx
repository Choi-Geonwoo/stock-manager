export default function CommonSelect({
    label,
    value,
    onChange,
    options = [], // 1. 기본값 지정을 통해 options가 없을 때의 에러 방지
    id            // 3. label과 select를 연결할 id 추가 (선택사항)
}) {
    // 내부적으로 사용할 고유 id 생성 (id가 없을 때를 대비)
    const selectId = id || `select-${label || 'common'}`;

    return (
        <div className="horizontal-form-group">
            {/* 2. htmlFor를 통해 select와 연결 */}
            {label && (
                <label htmlFor={selectId} className="form-text-label">
                    {label}
                </label>
            )}
            
            <div className="form-group">
                <select
                    id={selectId}
                    className="select"
                    value={value}
                    onChange={onChange}
                >
                    <option value="">선택</option>

                    {/* options?.map 형태로 한 번 더 안전장치 마련 */}
                    {options?.map((opt, index) => (
                        <option
                            // value가 없을 경우를 대비해 index를 조합하거나 fallback 지정
                            key={opt.value ?? index} 
                            value={opt.value}
                        >
                            {opt.label}
                        </option>
                    ))}
                </select>
            </div>
        </div>
    );
}