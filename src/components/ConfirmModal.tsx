"use client";

import { motion, AnimatePresence } from "framer-motion";
import { springs } from "@/lib/animation-config";
import { CloseIcon } from "./icons";

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

export default function ConfirmModal({
  isOpen,
  title,
  message,
  confirmLabel = "Conferma",
  cancelLabel = "Annulla",
  danger = false,
  onConfirm,
  onCancel,
  loading = false,
}: ConfirmModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={onCancel}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={springs.enter}
            className="relative glass-card-strong p-6 w-full max-w-sm"
          >
            <button
              onClick={onCancel}
              className="absolute top-4 right-4 text-[#A1A1A1] hover:text-white transition-colors"
            >
              <CloseIcon className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold mb-2">{title}</h3>
            <p className="text-sm text-[#A1A1A1] mb-6">{message}</p>

            <div className="flex gap-3">
              <button
                onClick={onCancel}
                className="flex-1 py-2.5 rounded-xl bg-[#111111] text-[#A1A1A1] text-sm font-medium hover:bg-[#1A1A1A] transition-colors"
              >
                {cancelLabel}
              </button>
              <button
                onClick={onConfirm}
                disabled={loading}
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors disabled:opacity-50 ${
                  danger
                    ? "bg-[#EF4444]/10 text-[#EF4444] hover:bg-[#EF4444]/20"
                    : "bg-white text-black hover:bg-white/90"
                }`}
              >
                {loading ? "..." : confirmLabel}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
