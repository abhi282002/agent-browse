'use client';

import React from 'react';

export const CursorPointerSvg: React.FC<{ color: string }> = ({ color }) => (
  <svg
    className="h-5 w-5 drop-shadow-md"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M3 3L10.07 19.97L12.58 12.58L19.97 10.07L3 3Z"
      fill={color}
      stroke="white"
      strokeWidth="1.5"
      strokeLinejoin="round"
    />
  </svg>
);
