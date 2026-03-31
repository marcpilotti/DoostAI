import { create } from "zustand";

type AIPanelState = {
  open: boolean;
  toggle: () => void;
  setOpen: (open: boolean) => void;
};

export const useAIPanelStore = create<AIPanelState>((set) => ({
  open: false,
  toggle: () => set((s) => ({ open: !s.open })),
  setOpen: (open) => set({ open }),
}));
