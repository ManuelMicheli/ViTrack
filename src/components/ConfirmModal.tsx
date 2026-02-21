"use client";

import { motion, AnimatePresence } from "framer-motion";
import { springs } from "@/lib/animation-config";
import { CloseIcon } from "./icons";
import { useLanguage } from "@/lib/language-context";

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
  confirmLabel,
  cancelLabel,
  danger = false,
  onConfirm,
  onCancel,
  loading = false,
}: ConfirmModalProps) {
  const { t } = useLanguage();
  const confirm = confirmLabel ?? t("common.confirm");
  const cancel = cancelLabel ?? t("common.cancel");

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black/80"
            onClick={onCancel}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={springs.enter}
            className="relative bg-background border border-border rounded-lg p-6 w-full max-w-sm"
          >
            <button
              onClick={onCancel}
              className="absolute top-4 right-4 text-text-secondary hover:text-text-primary transition-colors"
            >
              <CloseIcon className="w-5 h-5" />
            </button>

            <h3 className="font-display text-lg font-bold mb-2 text-text-primary">{title}</h3>
            <p className="font-body text-sm text-text-secondary mb-6">{message}</p>

            <div className="flex gap-3">
              <button
                onClick={onCancel}
                className="flex-1 py-2.5 rounded-lg border border-border text-text-secondary font-mono-label hover:text-text-primary hover:bg-surface-raised transition-colors"
              >
                {cancel}
              </button>
              <button
                onClick={onConfirm}
                disabled={loading}
                className={`flex-1 py-2.5 rounded-lg font-mono-label transition-colors disabled:opacity-50 ${
                  danger
                    ? "bg-danger/10 text-danger border border-danger/20 hover:bg-danger/20"
                    : "bg-[var(--color-accent-dynamic)] text-black hover:opacity-90"
                }`}
              >
                {loading ? "..." : confirm}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
