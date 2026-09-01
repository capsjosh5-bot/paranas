import { X } from "lucide-react";
export default function ConfirmDialog({ open, title, message, confirmLabel = "Confirm", onConfirm, onClose, danger = false }) {
    if (!open)
        return null;
    return (<div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <div className="modal-card" role="dialog" aria-modal="true" aria-labelledby="confirm-title" onMouseDown={(event) => event.stopPropagation()}>
        <button className="icon-button modal-close" onClick={onClose} aria-label="Close"><X size={20}/></button>
        <h2 id="confirm-title">{title}</h2>
        <p>{message}</p>
        <div className="modal-actions">
          <button className="button button-secondary" onClick={onClose}>Cancel</button>
          <button className={danger ? "button button-danger" : "button button-primary"} onClick={onConfirm}>{confirmLabel}</button>
        </div>
      </div>
    </div>);
}

