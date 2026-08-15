"use client";

import { motion, AnimatePresence } from "motion/react";
import { Check } from "lucide-react";

export default function TaskCheckbox({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      onClick={onChange}
      className="relative shrink-0 h-6 w-6 rounded-full border-2 flex items-center justify-center transition-colors"
      style={{
        borderColor: checked ? "var(--cyan)" : "var(--border)",
        background: checked
          ? "linear-gradient(135deg, var(--violet), var(--cyan))"
          : "transparent",
      }}
    >
      <AnimatePresence>
        {checked && (
          <motion.span
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 500, damping: 25 }}
          >
            <Check className="h-3.5 w-3.5 text-bg" strokeWidth={3} />
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  );
}
