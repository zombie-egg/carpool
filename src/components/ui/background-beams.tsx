"use client";

import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

// Animated "beams" backdrop (Aceternity-style). Render it once inside a fixed
// full-screen wrapper; page content sits above it with a higher z-index.
export const BackgroundBeams = React.memo(function BackgroundBeams({
  className,
}: {
  className?: string;
}) {
  const paths = Array.from({ length: 28 }, (_, i) => {
    const o = i * 12;
    return `M-${380 - o} -${189 + o}C-${380 - o} -${189 + o} -${312 - o} ${
      216 - o
    } ${152 - o} ${343 - o}C${616 - o} ${470 - o} ${684 - o} ${875 - o} ${
      684 - o
    } ${875 - o}`;
  });

  return (
    <div
      className={cn(
        "absolute inset-0 flex h-full w-full items-center justify-center [mask-image:radial-gradient(ellipse_at_center,white,transparent)]",
        className
      )}
    >
      <svg
        className="pointer-events-none absolute z-0 h-full w-full"
        width="100%"
        height="100%"
        viewBox="0 0 696 316"
        fill="none"
        preserveAspectRatio="xMidYMid slice"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d={paths.join(" ")}
          stroke="url(#paint0_radial_beams)"
          strokeOpacity="0.05"
          strokeWidth="0.5"
        />
        {paths.map((d, index) => (
          <motion.path
            key={`beam-${index}`}
            d={d}
            stroke={`url(#beamGradient-${index})`}
            strokeOpacity="0.4"
            strokeWidth="0.5"
          />
        ))}
        <defs>
          {paths.map((_, index) => (
            <motion.linearGradient
              id={`beamGradient-${index}`}
              key={`gradient-${index}`}
              initial={{ x1: "0%", x2: "0%", y1: "0%", y2: "0%" }}
              animate={{
                x1: ["0%", "100%"],
                x2: ["0%", "95%"],
                y1: ["0%", "100%"],
                y2: ["0%", `${93 + (index % 4) * 2}%`],
              }}
              transition={{
                // Deterministic per-index timing keeps SSR/CSR markup identical.
                duration: 10 + (index % 5) * 2,
                ease: "easeInOut",
                repeat: Infinity,
                delay: (index % 7) * 1.5,
              }}
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor="#18CCFC" stopOpacity="0" />
              <stop stopColor="#18CCFC" />
              <stop offset="32.5%" stopColor="#6344F5" />
              <stop offset="100%" stopColor="#AE48FF" stopOpacity="0" />
            </motion.linearGradient>
          ))}
          <radialGradient
            id="paint0_radial_beams"
            cx="0"
            cy="0"
            r="1"
            gradientUnits="userSpaceOnUse"
            gradientTransform="translate(352 34) rotate(90) scale(555 1560)"
          >
            <stop offset="0.0666667" stopColor="#d4d4d4" />
            <stop offset="0.243243" stopColor="#d4d4d4" />
            <stop offset="0.43594" stopColor="white" stopOpacity="0" />
          </radialGradient>
        </defs>
      </svg>
    </div>
  );
});
