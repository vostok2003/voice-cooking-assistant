// src/components/HeroIllustration.jsx
import React from "react";
import { motion } from "framer-motion";

/**
 * Hero Illustration — bottle + plate + animated ketchup drip + feature icons
 * Uses framer-motion for smooth, lightweight animations.
 */
export default function HeroIllustration() {
  return (
    <div className="hero-right">
      <div className="hero-canvas">
        {/* Bottle + Nozzle */}
        <motion.svg
          className="bottle-svg"
          viewBox="0 0 120 160"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          aria-hidden
        >
          <defs>
            <linearGradient id="sauceGrad" x1="0" x2="1">
              <stop offset="0" stopColor="#ff6b6b" />
              <stop offset="1" stopColor="#c92a2a" />
            </linearGradient>
            <linearGradient id="capGrad" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0" stopColor="#fff" />
              <stop offset="1" stopColor="#ddd" />
            </linearGradient>
          </defs>

          {/* Bottle neck / cap */}
          <rect x="46" y="4" rx="3" ry="3" width="28" height="18" fill="url(#capGrad)" stroke="#bdbdbd" strokeWidth="0.6" />
          {/* Bottle body */}
          <path
            d="M26 22 q6 80 34 90 q28 -10 34 -90 z"
            fill="url(#sauceGrad)"
            stroke="#a11"
            strokeWidth="0.6"
            opacity="0.98"
          />
          {/* Nozzle */}
          <rect x="52" y="112" width="16" height="8" rx="3" fill="#eee" stroke="#c8c8c8" strokeWidth="0.6" />

          {/* small highlight */}
          <ellipse cx="44" cy="46" rx="6" ry="12" fill="#fff" opacity="0.12" />
        </motion.svg>

        {/* Plate (static) */}
        <motion.div
          className="plate-wrap"
          initial={{ scale: 0.98, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.18, duration: 0.6 }}
        >
          <svg viewBox="0 0 160 60" className="plate-svg" aria-hidden>
            <ellipse cx="80" cy="26" rx="64" ry="18" fill="#fff" />
            <ellipse cx="80" cy="22" rx="48" ry="12" fill="rgba(250,250,250,0.6)" />
          </svg>
        </motion.div>

        {/* Animated ketchup drip (looping subtle) */}
        <motion.div
          className="drip-wrap"
          initial={{ y: -6, opacity: 0 }}
          animate={{ y: [ -6, 4, -2 ], opacity: [0, 1, 1] }}
          transition={{ duration: 1.6, repeat: Infinity, repeatDelay: 1.2, ease: "easeInOut" }}
          aria-hidden
        >
          <svg viewBox="0 0 32 44" className="drip-svg" width="32" height="44">
            <defs>
              <linearGradient id="dripG" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#ff6b6b" />
                <stop offset="1" stopColor="#c92a2a" />
              </linearGradient>
            </defs>
            {/* small connecting thread */}
            <path d="M16 2 C14 10 14 18 16 22 C18 26 22 30 16 38 C10 30 14 26 16 22 C18 18 18 10 16 2 Z" fill="url(#dripG)" stroke="#a11" strokeWidth="0.5" />
            <ellipse cx="16" cy="38" rx="6" ry="4" fill="url(#dripG)" stroke="#9a0b0b" strokeWidth="0.4" />
          </svg>
        </motion.div>

        {/* Floating micro-icons row (interactive) */}
        <div className="mini-icons" aria-hidden>
          <motion.img
            src="/images/bit-sauce.svg"
            className="mini-icon"
            alt=""
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.96 }}
            transition={{ type: "spring", stiffness: 300, damping: 18 }}
          />
          <motion.img
            src="/images/bit-spoon.svg"
            className="mini-icon"
            alt=""
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.96 }}
            transition={{ type: "spring", stiffness: 300, damping: 18 }}
          />
          <motion.img
            src="/images/bit-herb.svg"
            className="mini-icon"
            alt=""
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.96 }}
            transition={{ type: "spring", stiffness: 300, damping: 18 }}
          />
        </div>
      </div>

      {/* Optional sample mini-card (gives right section utility) */}
      <motion.div
        className="mini-preview"
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <div className="mini-preview-title">Quick preview</div>
        <div className="mini-preview-body">
          <div className="mp-step">• Preheat pan — 2 min</div>
          <div className="mp-step">• Marinate paneer — 10 min</div>
          <div className="mp-step dim">Tap 'Start Cooking' to follow voice steps</div>
        </div>
      </motion.div>
    </div>
  );
}
