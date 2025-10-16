// src/pages/Landing.jsx
import React from "react";
import { motion } from "framer-motion";
import Header from "../components/Header";
import ChatPreview from "../components/ChatPreview";
import "./landing-animated.css";

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12 } }
};

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6 } }
};

function AnimatedCTA({ onPrimary }) {
  return (
    <motion.div className="cta-group" variants={fadeUp}>
      <button className="btn-primary big" onClick={onPrimary}>
        Start Cooking — Voice Mode
      </button>
      <button className="btn-outline" onClick={() => (window.location.href = "/register")}>
        Create account
      </button>
      <div className="cta-hint">Try: "Make a 20-minute paneer tikka with low oil"</div>
    </motion.div>
  );
}

export default function Landing() {
  // sample recipe preview data — you can replace this by passing props or fetching
  const sample = {
    title: "Paneer Tikka (20 min)",
    summary: "Tender paneer pieces marinated in spices & grilled quickly for a smoky finish.",
    ingredients: [
      "250g paneer (cubed)",
      "2 tbsp hung curd",
      "1 tsp red chilli powder",
      "1 tsp garam masala",
      "1 tbsp oil",
      "Salt to taste"
    ],
    steps: [
      "Mix curd, spices, oil and salt. Marinate paneer for 10 minutes.",
      "Preheat a skillet on medium-high. Add a little oil and sear paneer until charred edges form (2–3 min each side).",
      "Serve hot with chutney and lemon wedges."
    ]
  };

  return (
    <div className="page landing animated-landing">
      <Header />

      <main className="landing-main container">
        <section className="landing-left">
          <motion.div className="hero-card" initial="hidden" animate="show" variants={container}>
            <div className="landing-left-content">
              <motion.h1 className="hero-title" variants={fadeUp}>
                Hands-free cooking with AI
              </motion.h1>

              <motion.p className="hero-sub" variants={fadeUp}>
                Generate step-by-step voice-guided recipes, set auto-advancing timers and cook without touching your screen.
              </motion.p>

              <AnimatedCTA onPrimary={() => (window.location.href = "/login")} />

              <motion.div className="trust-row" variants={fadeUp}>
                <div><strong>Trusted by chefs</strong></div>
                <div className="badges">
                  <span>Early Access</span>
                  <span>Offline mode</span>
                  
                </div>
              </motion.div>

              <motion.div className="feature-grid" aria-hidden variants={fadeUp}>
                <div className="feature">⏱ Auto timers</div>
                <div className="feature">🎙 Voice prompts</div>
                <div className="feature">📝 Save & revisit</div>
              </motion.div>
            </div>

            {/* Right column replaced by ChatPreview inside the hero-card grid */}
            <div className="hero-right-col">
              <ChatPreview recipe={sample} />
            </div>
          </motion.div>
        </section>
      </main>

      <footer className="landing-footer">
        <p>Made with ❤️ — Voice Cooking Assistant</p>
      </footer>
    </div>
  );
}
