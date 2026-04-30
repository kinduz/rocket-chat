import { create } from 'zustand';
import { type Profile, rcClient } from '../api';

type AppState = {
  profile: Profile | null;
  isBootstrapped: boolean;
  isBootstrapping: boolean;
  bootstrap: () => Promise<void>;
  setProfile: (profile: Profile | null) => void;
  reset: () => void;
};

export const useAppStore = create<AppState>((set, get) => ({
  profile: null,
  isBootstrapped: false,
  isBootstrapping: false,

  bootstrap: async () => {
    if (get().isBootstrapped || get().isBootstrapping) return;
    set({ isBootstrapping: true });
    try {
      const [profile] = await Promise.all([rcClient.profile.getProfile()]);
      set({
        profile: profile.error ? null : profile,
        isBootstrapped: true,
      });
    } finally {
      set({ isBootstrapping: false });
    }
  },

  setProfile: (profile) => set({ profile }),
  reset: () =>
    set({ profile: null, isBootstrapped: false, isBootstrapping: false }),
}));
