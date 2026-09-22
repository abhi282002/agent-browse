"use client";

import React from "react";
import { useOrgStore } from "@/stores/useOrgStore";
import { OrganizationModal } from "./OrganizationModal";
import { CreateOrganizationModal } from "./CreateOrganizationModal";

export function OrganizationModals() {
  const isOrgModalOpen = useOrgStore((state) => state.isOrgModalOpen);
  const closeOrgModal = useOrgStore((state) => state.closeOrgModal);
  const isCreateOrgModalOpen = useOrgStore((state) => state.isCreateOrgModalOpen);
  const closeCreateOrgModal = useOrgStore((state) => state.closeCreateOrgModal);
  const activeOrgId = useOrgStore((state) => state.activeOrgId);

  return (
    <>
      <OrganizationModal
        isOpen={isOrgModalOpen}
        onClose={closeOrgModal}
        organizationId={activeOrgId ?? undefined}
      />
      <CreateOrganizationModal
        isOpen={isCreateOrgModalOpen}
        onClose={closeCreateOrgModal}
      />
    </>
  );
}
