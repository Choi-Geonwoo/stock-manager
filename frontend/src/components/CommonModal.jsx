export default function CommonModal({
    open,
    title,
    children,
    onClose
}) {
    if (!open) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div
                className="modal-box"
                onClick={(e) => e.stopPropagation()}
            >
                <button
                    className="modal-close"
                    onClick={onClose}
                >
                    ×
                </button>

                <h2 className="modal-title">{title}</h2>

                <div className="modal-content">
                    {children}
                </div>
            </div>
        </div>
    );
}