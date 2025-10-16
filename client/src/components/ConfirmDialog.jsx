import React from 'react';

export default function ConfirmDialog({ open, message, onClose, onConfirm }){
  if (!open) return null;
  return (
    <div className="confirm-overlay">
      <div className="confirm-box">
        <p>Are You Sure ?</p>
        <div className="confirm-row">
          <button onClick={onClose} className="btn-outline">Cancel</button>
          <button onClick={onConfirm} className="btn-danger">Delete</button>
        </div>
      </div>
    </div>
  );
}

