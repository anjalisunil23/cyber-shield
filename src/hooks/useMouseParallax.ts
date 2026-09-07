import { useMotionValue, useSpring, useTransform, type MotionValue } from "framer-motion";
import { useEffect } from "react";

/** Soft mouse parallax for hero visuals. */
export function useMouseParallax(strength = 24): {
  x: MotionValue<number>;
  y: MotionValue<number>;
} {
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const x = useSpring(useTransform(mx, [-0.5, 0.5], [-strength, strength]), {
    stiffness: 80,
    damping: 20,
  });
  const y = useSpring(useTransform(my, [-0.5, 0.5], [-strength, strength]), {
    stiffness: 80,
    damping: 20,
  });

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      mx.set(e.clientX / window.innerWidth - 0.5);
      my.set(e.clientY / window.innerHeight - 0.5);
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMove);
  }, [mx, my]);

  return { x, y };
}
