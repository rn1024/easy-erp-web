import { create } from 'zustand';

/**
 * Types
 */
import type { RoleDataResult } from '@/services/roles';

type RoleStore = {
  current: RoleDataResult | null;
  setCurrent: (current: RoleDataResult | null) => void;
};

export const useRoleStore = create<RoleStore>((set) => ({
  current: null,
  setCurrent: (current) => set({ current }),
}));
