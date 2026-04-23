import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { Alert, Slide, Snackbar, type SlideProps } from "@mui/material";

type Severity = "success" | "error" | "info" | "warning";

interface Toast {
  id: number;
  message: string;
  severity: Severity;
}

interface ToastContextValue {
  showToast: (message: string, severity?: Severity) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

function SlideDown(props: SlideProps) {
  return <Slide {...props} direction="down" />;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  let counter = 0;

  const showToast = useCallback((message: string, severity: Severity = "success") => {
    const id = ++counter;
    setToasts(prev => [...prev, { id, message, severity }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toasts.map((toast, i) => (
        <Snackbar
          key={toast.id}
          open
          anchorOrigin={{ vertical: "top", horizontal: "center" }}
          sx={{ top: `${72 + i * 64}px !important` }}
          slots={{ transition: SlideDown }}
        >
          <Alert
            severity={toast.severity}
            variant="filled"
            onClose={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
            sx={{
              borderRadius: 2.5,
              fontWeight: 600,
              fontSize: "0.875rem",
              boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
              minWidth: 280,
            }}
          >
            {toast.message}
          </Alert>
        </Snackbar>
      ))}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside ToastProvider");
  return ctx.showToast;
}
