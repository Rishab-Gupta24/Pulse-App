import { create } from "zustand";

export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface Toast {
  id: number;
  message: string;
  action?: ToastAction;
}

interface ToastState {
  toasts: Toast[];
  show: (message: string, action?: ToastAction) => void;
  dismiss: (id: number) => void;
}

const TOAST_DURATION_MS = 4000;
let nextId = 0;

// Replaces blocking alert()/confirm() (Rules.md §2.5).
export const useToast = create<ToastState>((set, get) => ({
  toasts: [],
  show: (message, action) => {
    const id = ++nextId;
    set((state) => ({ toasts: [...state.toasts, { id, message, action }] }));
    setTimeout(() => get().dismiss(id), TOAST_DURATION_MS);
  },
  dismiss: (id) =>
    set((state) => ({ toasts: state.toasts.filter((toast) => toast.id !== id) })),
}));

/** Callable outside React (e.g. mutation callbacks). */
export const showToast = (message: string, action?: ToastAction) =>
  useToast.getState().show(message, action);
