// src/pages/Landing.jsx
import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Header from "../components/Header";
import "./landing-animated.css";

const container = {
  hidden: { opacity: 0 },
  show: { 
    opacity: 1,
    transition: { 
      staggerChildren: 0.15,
      delayChildren: 0.2
    } 
  }
};

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  show: { 
    opacity: 1, 
    y: 0, 
    transition: { 
      duration: 0.8,
      ease: [0.6, 0.05, 0.01, 0.9]
    } 
  }
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.8 },
  show: { 
    opacity: 1, 
    scale: 1, 
    transition: { 
      duration: 0.6,
      ease: "easeOut"
    } 
  }
};

const FloatingElement = ({ delay = 0, children, className = "" }) => (
  <motion.div
    className={`floating-element ${className}`}
    initial={{ opacity: 0, y: 20 }}
    animate={{ 
      opacity: [0, 1, 1],
      y: [20, 0, -10, 0],
    }}
    transition={{
      duration: 4,
      delay,
      repeat: Infinity,
      repeatType: "reverse",
      ease: "easeInOut"
    }}
  >
    {children}
  </motion.div>
);

export default function Landing() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div className="page landing animated-landing">
      {/* Animated background gradients */}
      <div className="gradient-bg">
        <div className="gradient-orb orb-1"></div>
        <div className="gradient-orb orb-2"></div>
        <div className="gradient-orb orb-3"></div>
      </div>

      {/* Floating cursor follower */}
      <motion.div 
        className="cursor-glow"
        animate={{
          x: mousePosition.x - 200,
          y: mousePosition.y - 200,
        }}
        transition={{ type: "spring", damping: 30, stiffness: 200 }}
      />

      <Header />

      <main className="landing-main">
        <motion.div 
          className="hero-section"
          initial="hidden"
          animate="show"
          variants={container}
        >
          {/* Main content */}
          <div className="hero-content">
            <motion.div className="hero-badge" variants={scaleIn}>
              <span className="badge-icon">✨</span>
              <span>AI-Powered Cooking Assistant</span>
            </motion.div>

            <motion.h1 className="hero-title" variants={fadeUp}>
              Cook Smarter with
              <span className="gradient-text"> Voice AI</span>
            </motion.h1>

            <motion.p className="hero-description" variants={fadeUp}>
              Experience hands-free cooking with intelligent voice guidance,
              personalized recipes, and smart timers that adapt to your taste.
            </motion.p>

            <motion.div className="cta-buttons" variants={fadeUp}>
              <button 
                className="btn-primary-glass"
                onClick={() => (window.location.href = "/login")}
              >
                <span>Start Cooking</span>
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M7.5 15L12.5 10L7.5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              <button 
                className="btn-secondary-glass"
                onClick={() => (window.location.href = "/register")}
              >
                Create Account
              </button>
            </motion.div>

            <motion.div className="features-grid" variants={fadeUp}>
              <div className="feature-card glass">
                <div className="feature-icon">🎤</div>
                <h3>Voice Control</h3>
                <p>Hands-free cooking experience</p>
              </div>
              <div className="feature-card glass">
                <div className="feature-icon">🍽️</div>
                <h3>Taste Profile</h3>
                <p>Personalized to your preferences</p>
              </div>
              <div className="feature-card glass">
                <div className="feature-icon">⏱️</div>
                <h3>Smart Timers</h3>
                <p>Auto-advancing step timers</p>
              </div>
            </motion.div>
          </div>

          {/* Floating recipe cards */}
          <div className="floating-cards">
            <FloatingElement delay={0} className="recipe-float recipe-1">
              <div className="glass-card">
                <div className="card-emoji">🍝</div>
                <h4>Pasta Carbonara</h4>
                <p>15 minutes</p>
              </div>
            </FloatingElement>

            <FloatingElement delay={0.5} className="recipe-float recipe-2">
              <div className="glass-card">
                <div className="card-emoji">🍛</div>
                <h4>Butter Chicken</h4>
                <p>30 minutes</p>
              </div>
            </FloatingElement>

            <FloatingElement delay={1} className="recipe-float recipe-3">
              <div className="glass-card">
                <div className="card-emoji">🥗</div>
                <h4>Caesar Salad</h4>
                <p>10 minutes</p>
              </div>
            </FloatingElement>

            <FloatingElement delay={1.5} className="recipe-float recipe-4">
              <div className="glass-card">
                <div className="card-emoji">🍰</div>
                <h4>Chocolate Cake</h4>
                <p>45 minutes</p>
              </div>
            </FloatingElement>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
