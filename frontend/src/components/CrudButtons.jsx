export default function CrudButtons({
    onSearch,
    onSave,
    onReset,
    canSearch = true,
    canSave = true
}) {
    return (
        <>
            {canSearch && <button className="btn btn-info" onClick={onSearch}>검색</button>}
            {canSave && <button className="btn btn-gray" onClick={onSave}>등록</button>}
            <button className="btn btn-primary" onClick={onReset}>초기화</button>
        </>
    );
}