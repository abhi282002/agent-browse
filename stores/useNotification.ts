import { create } from 'zustand';

interface NotificationState {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export const useNotificationStore = create<NotificationState>()((set) => ({
  isOpen: false,
  setIsOpen: (isOpen: boolean) => set({ isOpen }),
}));
