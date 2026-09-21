"use client";

import React from "react";
import { useOthers, useSelf } from "@liveblocks/react";

interface CollaboratorInfo {
  name?: string;
  email?: string;
  color?: string;
}

export function CollaboratorAvatars() {
  const others = useOthers();
  const currentUser = useSelf();

  const totalCollaborators = (others?.length || 0) + (currentUser ? 1 : 0);

  return (
    <div className="flex items-center gap-2">
      {/* Active Avatars Stack */}
      <div className="flex items-center -space-x-1.5 overflow-hidden py-0.5">
        {currentUser && (
          <div
            key="current-user"
            className="group relative flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-bold text-white shadow-2xs ring-2 ring-white transition-transform hover:scale-110 hover:z-10 cursor-default"
            style={{
              backgroundColor:
                (currentUser.info as CollaboratorInfo)?.color || "#10b981",
            }}
            title={`You (${(currentUser.info as CollaboratorInfo)?.name || "Me"})`}
          >
            {((currentUser.info as CollaboratorInfo)?.name || "U")
              .slice(0, 2)
              .toUpperCase()}
          </div>
        )}

        {others?.map((other) => {
          const info = other.info as CollaboratorInfo | undefined;
          const name = info?.name || `Guest-${other.connectionId}`;
          const color = info?.color || "#3b82f6";
          const initials = name.slice(0, 2).toUpperCase();

          return (
            <div
              key={other.connectionId}
              className="group relative flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-bold text-white shadow-2xs ring-2 ring-white transition-transform hover:scale-110 hover:z-10 cursor-default"
              style={{ backgroundColor: color }}
              title={info?.email ? `${name} (${info.email})` : name}
            >
              {initials}
            </div>
          );
        })}
      </div>

      {/* Online Badge */}
      <div className="flex items-center gap-1.5 rounded-full border border-emerald-200/80 bg-emerald-50/80 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
        </span>
        <span>
          {totalCollaborators === 1
            ? "1 Collaborator"
            : `${totalCollaborators} Collaborators`}
        </span>
      </div>
    </div>
  );
}
