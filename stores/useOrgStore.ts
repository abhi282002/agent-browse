import { create } from "zustand";

export interface ActiveOrganizationData {
  id: string;
  name: string;
  slug?: string;
  description?: string | null;
  userRole?: string;
  memberCount?: number;
  workflowCount?: number;
  aiInstructions?: string | null;
  defaultAiModel?: string | null;
  [key: string]: any;
}

export interface OrgState {
  activeOrgId: string | null;
  activeOrganization: ActiveOrganizationData | null;
  isOrgModalOpen: boolean;
  isCreateOrgModalOpen: boolean;

  setActiveOrgId: (id: string | null) => void;
  setActiveOrganization: (org: ActiveOrganizationData | null) => void;
  setOrgModalOpen: (open: boolean) => void;
  setCreateOrgModalOpen: (open: boolean) => void;
  openOrgModal: () => void;
  closeOrgModal: () => void;
  openCreateOrgModal: () => void;
  closeCreateOrgModal: () => void;
}

export const useOrgStore = create<OrgState>()((set) => ({
  activeOrgId: null,
  activeOrganization: null,
  isOrgModalOpen: false,
  isCreateOrgModalOpen: false,

  setActiveOrgId: (id) =>
    set((state) => ({
      activeOrgId: id,
      activeOrganization:
        state.activeOrganization?.id === id
          ? state.activeOrganization
          : id
          ? {
              ...(state.activeOrganization || {}),
              id,
              name: state.activeOrganization?.name || "Organization",
            }
          : null,
    })),

  setActiveOrganization: (org) =>
    set({
      activeOrganization: org,
      activeOrgId: org?.id ?? null,
    }),

  setOrgModalOpen: (open) => set({ isOrgModalOpen: open }),
  setCreateOrgModalOpen: (open) => set({ isCreateOrgModalOpen: open }),
  openOrgModal: () => set({ isOrgModalOpen: true }),
  closeOrgModal: () => set({ isOrgModalOpen: false }),
  openCreateOrgModal: () => set({ isCreateOrgModalOpen: true }),
  closeCreateOrgModal: () => set({ isCreateOrgModalOpen: false }),
}));
