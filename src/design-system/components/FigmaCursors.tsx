"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

// One cursor at a time. Enters → idles (name only) → name tag expands + types message
// → holds → collapses → exits → delay → next cursor. Loops forever.
const CURSOR_DEFS = [
  { id: "gerben",      name: "Gerben",      color: "#1D4ED8", message: "Hey There! All good?",               entryX: "114%", entryY: "20%", endX: "70%", endY: "10%", exitX: "40%",  exitY: "-14%" },
//  { id: "demi",        name: "Demi",        color: "#C2410C", message: "Good to see you here!",              entryX: "30%",  entryY: "-14%",endX: "73%", endY: "15%", exitX: "114%", exitY: "60%"  },
//  { id: "nerea",       name: "Nerea",       color: "#BE185D", message: "This shade is great!",               entryX: "-14%", entryY: "40%", endX: "56%", endY: "53%", exitX: "70%",  exitY: "114%" },
//  { id: "christianne", name: "Christianne", color: "#B91C1C", message: "But is this accessible?",            entryX: "60%",  entryY: "114%",endX: "72%", endY: "8%",  exitX: "-14%", exitY: "25%"  },
  { id: "jairo",       name: "Jairo",       color: "#029b77", message: "Have you tried out Helix-Slides yet?",entryX: "40%", entryY: "-14%", endX: "20%", endY: "86%", exitX: "114%",  exitY: "20%" },
] as const;

type CursorDef = (typeof CURSOR_DEFS)[number];


interface Anim {
  def: CursorDef;
  opacity: number;
  x: string;
  y: string;
  typed: string;
  showMessage: boolean;
}

function sleep(ms: number) {
  return new Promise<void>((r) => setTimeout(r, ms));
}

export function FigmaCursors() {
  const [anim, setAnim] = useState<Anim>({
    def: CURSOR_DEFS[0],
    opacity: 0,
    x: "114%",
    y: "50%",
    typed: "",
    showMessage: false,
  });

  const active = useRef(false);

  useEffect(() => {
    if (active.current) return;
    active.current = true;

    async function loop() {
      await sleep(1900);

      let i = 0;
      while (active.current) {
        const def = CURSOR_DEFS[i];

        // Reset to this cursor's fixed entry point (still invisible)
        setAnim({ def, opacity: 0, x: def.entryX, y: def.entryY, typed: "", showMessage: false });
        await sleep(20);

        // Fade in at edge
        setAnim((p) => ({ ...p, opacity: 1 }));
        await sleep(100);

        // Spring to resting spot
        setAnim((p) => ({ ...p, x: def.endX, y: def.endY }));
        await sleep(1500);

        // Brief idle — just the name tag
        await sleep(400);

        // Expand label + start typing
        setAnim((p) => ({ ...p, showMessage: true }));
        await sleep(180);

        for (let j = 1; j <= def.message.length; j++) {
          if (!active.current) return;
          setAnim((p) => ({ ...p, typed: def.message.slice(0, j) }));
          await sleep(52);
        }

        // Hold the finished message
        await sleep(5000);

        // Collapse message line
        setAnim((p) => ({ ...p, showMessage: false }));
        await sleep(340);

        // Exit toward this cursor's fixed exit point
        setAnim((p) => ({ ...p, x: def.exitX, y: def.exitY }));
        await sleep(900);

        // Fade out + gap before next cursor
        setAnim((p) => ({ ...p, opacity: 0 }));
        await sleep(5000);

        i = (i + 1) % CURSOR_DEFS.length;
      }
    }

    loop();

    return () => {
      active.current = false;
    };
  }, []);

  return (
    <div
      className="absolute inset-0 pointer-events-none hidden md:block z-10"
      aria-hidden="true"
    >
      <motion.div
        className="absolute"
        animate={{ opacity: anim.opacity, left: anim.x, top: anim.y }}
        transition={{
          opacity: { duration: 0.22 },
          left: { type: "spring", stiffness: 62, damping: 16 },
          top:  { type: "spring", stiffness: 62, damping: 16 },
        }}
      >
        <CursorSVG color={anim.def.color} />

        {/* Label — name only, expands to include message when typing */}
        <motion.div
          key={anim.def.id}
          layout
          className="absolute top-[14px] left-[13px] rounded-[7px] px-[9px] pt-[5px] pb-[6px] overflow-hidden"
          style={{ backgroundColor: anim.def.color }}
          transition={{ layout: { type: "spring", stiffness: 320, damping: 30 } }}
        >
          <p className="text-white/65 text-[9px] font-semibold tracking-wide whitespace-nowrap leading-none">
            {anim.def.name}
          </p>

          <AnimatePresence>
            {anim.showMessage && (
              <motion.p
                className="text-white text-[13px] font-bold whitespace-nowrap leading-tight mt-[3px]"
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.16, ease: "easeOut" }}
              >
                {anim.typed}
                {anim.typed.length < anim.def.message.length && (
                  <span className="opacity-35 ml-px">|</span>
                )}
              </motion.p>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </div>
  );
}

function CursorSVG({ color }: { color: string }) {
  return (
    <svg width="17" height="21" viewBox="0 0 17 21" fill="none">
      <path
        d="M3 1.5 L3 16 L6.5 12.5 L9 18.5 L11 17.5 L8.5 11.5 L13.5 11.5 Z"
        fill={color}
        stroke="white"
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}