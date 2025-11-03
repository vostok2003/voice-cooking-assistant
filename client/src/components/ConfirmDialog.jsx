import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ConfirmDialog({ open, message, onClose, onConfirm }){
  if (!open) return null;
  
  return (
    <AnimatePresence>
      {open && (
        <motion.div 
          className="confirm-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
        >
          <motion.div 
            className="confirm-dialog glass-card"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ duration: 0.3, type: "spring" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="confirm-icon">
              <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
                <circle cx="32" cy="32" r="28" stroke="#f87171" strokeWidth="3" opacity="0.3"/>
                <path d="M32 20V36M32 44V44.5" stroke="#f87171" strokeWidth="4" strokeLinecap="round"/>
              </svg>
            </div>
            
            <h3 className="confirm-title">Delete Recipe?</h3>
            <p className="confirm-message">{message || "This action cannot be undone. Are you sure you want to delete this recipe?"}</p>
            
            <div className="confirm-actions">
              <motion.button 
                onClick={onClose} 
                className="btn-confirm-cancel"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <path d="M4 4L14 14M4 14L14 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                <span>Cancel</span>
              </motion.button>
              
              <motion.button 
                onClick={onConfirm} 
                className="btn-confirm-delete"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <path d="M3 4H15M5 4V3C5 2.44772 5.44772 2 6 2H12C12.5523 2 13 2.44772 13 3V4M6.5 8V13M11.5 8V13M4 4L4.5 14C4.5 14.5523 4.94772 15 5.5 15H12.5C13.0523 15 13.5 14.5523 13.5 14L14 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span>Delete</span>
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

