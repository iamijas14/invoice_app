import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Toast {
  id: string;
  type: "success" | "error" | "info";
  message: string;
  onRetry?: () => void;
}

interface ToastContextType {
  addToast: (toast: Omit<Toast, "id">) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used within ToastProvider");
  return context;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    (toast: Omit<Toast, "id">) => {
      const id = Date.now().toString(36) + Math.random().toString(36).slice(2);
      setToasts((prev) => [...prev, { ...toast, id }]);

      // Auto-dismiss non-retry toasts after 4 seconds
      if (!toast.onRetry) {
        setTimeout(() => removeToast(id), 4000);
      }
    },
    [removeToast]
  );

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}
      <div className="fixed top-4 right-4 z-9999 flex flex-col gap-3 max-w-sm w-full pointer-events-none">
        <AnimatePresence mode="popLayout">
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              layout
              initial={{ opacity: 0, y: -30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: 80, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className={`pointer-events-auto rounded-xl shadow-lg border px-4 py-3 flex items-start gap-3 ${
                toast.type === "success"
                  ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                  : toast.type === "error"
                    ? "bg-red-50 border-red-200 text-red-800"
                    : "bg-blue-50 border-blue-200 text-blue-800"
              }`}
            >
              <span className="text-lg mt-0.5">
                {toast.type === "success"
                  ? "✓"
                  : toast.type === "error"
                    ? "✕"
                    : "ℹ"}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium leading-snug">
                  {toast.message}
                </p>
                {toast.onRetry && (
                  <button
                    onClick={() => {
                      toast.onRetry!();
                      removeToast(toast.id);
                    }}
                    className="mt-2 text-xs font-semibold underline underline-offset-2 hover:opacity-80 transition-opacity"
                  >
                    Retry Upload
                  </button>
                )}
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className="text-current opacity-50 hover:opacity-100 transition-opacity text-lg leading-none"
              >
                ×
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}
