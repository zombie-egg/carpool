"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  AnimatePresence,
  motion,
  MotionValue,
  useMotionValue,
  useSpring,
  useTransform,
  type SpringOptions,
} from "framer-motion";
import { cn } from "@/lib/utils";

// Apple-style magnifying dock: items grow as the pointer approaches them.

const DEFAULT_MAGNIFICATION = 80;
const DEFAULT_DISTANCE = 150;
const DEFAULT_PANEL_HEIGHT = 64;
const BASE_ITEM_SIZE = 40;

const DEFAULT_SPRING: SpringOptions = {
  mass: 0.1,
  stiffness: 150,
  damping: 12,
};

interface DockContextValue {
  mouseX: MotionValue<number>;
  spring: SpringOptions;
  magnification: number;
  distance: number;
}

const DockContext = createContext<DockContextValue | undefined>(undefined);

function useDock(): DockContextValue {
  const context = useContext(DockContext);
  if (!context) {
    throw new Error("Dock components must be rendered inside <Dock>.");
  }
  return context;
}

interface DockItemContextValue {
  width: MotionValue<number>;
  isHovered: MotionValue<number>;
}

const DockItemContext = createContext<DockItemContextValue | undefined>(
  undefined
);

export interface DockProps {
  children: React.ReactNode;
  className?: string;
  spring?: SpringOptions;
  magnification?: number;
  distance?: number;
  panelHeight?: number;
}

export function Dock({
  children,
  className,
  spring = DEFAULT_SPRING,
  magnification = DEFAULT_MAGNIFICATION,
  distance = DEFAULT_DISTANCE,
  panelHeight = DEFAULT_PANEL_HEIGHT,
}: DockProps) {
  const mouseX = useMotionValue<number>(Infinity);

  return (
    <motion.div
      style={{ height: panelHeight }}
      onMouseMove={(event) => mouseX.set(event.clientX)}
      onMouseLeave={() => mouseX.set(Infinity)}
      className={cn(
        "flex w-fit items-end gap-4 rounded-2xl border border-border bg-card/70 px-4 pb-3 backdrop-blur-md",
        className
      )}
      role="toolbar"
      aria-label="Application dock"
    >
      <DockContext.Provider value={{ mouseX, spring, magnification, distance }}>
        {children}
      </DockContext.Provider>
    </motion.div>
  );
}

export interface DockItemProps {
  children: React.ReactNode;
  className?: string;
}

export function DockItem({ children, className }: DockItemProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { mouseX, spring, magnification, distance } = useDock();

  const isHovered = useMotionValue<number>(0);

  const mouseDistance = useTransform(mouseX, (value: number) => {
    const bounds = ref.current?.getBoundingClientRect() ?? {
      x: 0,
      width: BASE_ITEM_SIZE,
    };
    return value - bounds.x - bounds.width / 2;
  });

  const widthTransform = useTransform(
    mouseDistance,
    [-distance, 0, distance],
    [BASE_ITEM_SIZE, magnification, BASE_ITEM_SIZE]
  );

  const width = useSpring(widthTransform, spring);

  return (
    <motion.div
      ref={ref}
      style={{ width }}
      onHoverStart={() => isHovered.set(1)}
      onHoverEnd={() => isHovered.set(0)}
      onFocus={() => isHovered.set(1)}
      onBlur={() => isHovered.set(0)}
      className={cn(
        "relative inline-flex aspect-square items-center justify-center rounded-full bg-secondary/90",
        className
      )}
      tabIndex={0}
    >
      <DockItemContext.Provider value={{ width, isHovered }}>
        {children}
      </DockItemContext.Provider>
    </motion.div>
  );
}

export interface DockLabelProps {
  children: React.ReactNode;
  className?: string;
}

export function DockLabel({ children, className }: DockLabelProps) {
  const context = useContext(DockItemContext);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!context) return undefined;
    return context.isHovered.on("change", (latest) => {
      setVisible(latest === 1);
    });
  }, [context]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 0 }}
          animate={{ opacity: 1, y: -10 }}
          exit={{ opacity: 0, y: 0 }}
          transition={{ duration: 0.2 }}
          style={{ x: "-50%" }}
          className={cn(
            "absolute -top-6 left-1/2 w-fit whitespace-pre rounded-md border border-border bg-popover px-2 py-0.5 text-xs text-popover-foreground",
            className
          )}
          role="tooltip"
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export interface DockIconProps {
  children: React.ReactNode;
  className?: string;
}

export function DockIcon({ children, className }: DockIconProps) {
  const context = useContext(DockItemContext);
  const fallbackWidth = useMotionValue<number>(BASE_ITEM_SIZE);
  const width = context?.width ?? fallbackWidth;
  const iconWidth = useTransform(width, (value: number) => value / 2);

  return (
    <motion.div
      style={{ width: iconWidth }}
      className={cn("flex items-center justify-center", className)}
    >
      {children}
    </motion.div>
  );
}
