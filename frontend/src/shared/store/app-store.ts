import { create } from 'zustand';
import type { Profile } from '../api';

type AppState = {
  profile: Profile | null;
  setProfile: (profile: Profile | null) => void;
  reset: () => void;
};

export const useAppStore = create<AppState>((set, get) => ({
  profile: null,

  setProfile: (profile) => set({ profile }),
  reset: () => set({ profile: null }),
}));
