"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";

export type OrbState = "idle" | "listening" | "thinking" | "speaking";

/**
 * The glass orb. Idle: 3s breathing. Listening: ripple rings.
 * Speaking: randomized amplitude ticks + stronger glow.
 * The only gradient in the product, by design.
 */
export function VoiceOrb({
  state,
  onClick,
}: {
  state: OrbState;
  onClick?: () => void;
}) {
  const reduce = useReducedMotion();
  const [tick, setTick] = useState(1);

  // amplitude-like pulsing while speaking
  useEffect(() => {
    if (state !== "speaking" || reduce) return;
    const id = setInterval(() => setTick(1 + Math.random() * 0.09), 100);
    return () => clearInterval(id);
  }, [state, reduce]);

  const breathing =
    state === "idle" && !reduce
      ? { scale: [1, 1.04, 1], transition: { duration: 3, repeat: Infinity, ease: "easeInOut" as const } }
      : state === "speaking"
        ? { scale: tick, transition: { duration: 0.1 } }
        : { scale: 1 };

  return (
    <button
      onClick={onClick}
      aria-label={
        state === "listening" ? "جارٍ الاستماع — اضغط للتحدث" : "اضغط للتحدث"
      }
      className="relative flex h-[88px] w-[88px] items-center justify-center rounded-full focus-visible:outline-accent"
    >
      {/* ripple rings while listening */}
      {state === "listening" &&
        !reduce &&
        [0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="absolute inset-0 rounded-full border border-accent/30"
            initial={{ scale: 1, opacity: 0.5 }}
            animate={{ scale: 1.7, opacity: 0 }}
            transition={{
              duration: 1.8,
              repeat: Infinity,
              delay: i * 0.6,
              ease: "easeOut",
            }}
          />
        ))}

      <motion.span animate={breathing} className="relative block h-full w-full">
        {/* glow */}
        <span
          className="absolute -inset-4 rounded-full blur-2xl transition-opacity duration-500"
          style={{
            background:
              "radial-gradient(circle, rgba(30,58,52,.35), rgba(184,147,90,.15) 60%, transparent 75%)",
            opacity: state === "speaking" ? 0.9 : state === "thinking" ? 0.6 : 0.4,
          }}
        />
        {/* glass sphere: layered radial gradients + internal drift */}
        <span
          className="absolute inset-0 overflow-hidden rounded-full border border-white/40"
          style={{
            background:
              "radial-gradient(circle at 32% 28%, rgba(255,255,255,.95), rgba(234,240,238,.55) 35%, rgba(30,58,52,.22) 78%, rgba(30,58,52,.4))",
            boxShadow:
              "inset 0 -8px 24px rgba(30,58,52,.25), inset 0 6px 14px rgba(255,255,255,.8), 0 8px 32px rgba(16,14,10,.16)",
          }}
        >
          <motion.span
            className="absolute -inset-6 rounded-full"
            style={{
              background:
                "conic-gradient(from 0deg, rgba(30,58,52,.16), rgba(184,147,90,.14), rgba(122,160,150,.16), rgba(30,58,52,.16))",
              filter: "blur(14px)",
            }}
            animate={reduce ? undefined : { rotate: 360 }}
            transition={{ duration: 14, repeat: Infinity, ease: "linear" }}
          />
          {/* specular highlight */}
          <span
            className="absolute left-[22%] top-[14%] h-[26%] w-[36%] rounded-full bg-white/80"
            style={{ filter: "blur(5px)", transform: "rotate(-24deg)" }}
          />
        </span>
      </motion.span>
    </button>
  );
}
