'use client';

import React from 'react';
import { HeroBadge } from './HeroBadge';
import { ColorfulHeadline } from './ColorfulHeadline';
import { HeroSubtext } from './HeroSubtext';
import { HeroActions } from './HeroActions';
import { HeroStats } from './HeroStats';

export const HeroContent: React.FC = () => {
  return (
    <div className="flex flex-col items-center sm:items-start text-center sm:text-left z-10">
      <HeroBadge />
      <div className="mt-4">
        <ColorfulHeadline />
      </div>
      <HeroSubtext />
      <HeroActions />
      <HeroStats />
    </div>
  );
};
