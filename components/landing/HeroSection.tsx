'use client';

import React from 'react';
import { HeroContent } from './HeroContent';
import { AnimationStage } from './AnimationStage';

export const HeroSection: React.FC = () => {
  return (
    <section className="relative isolate pt-6 pb-12 sm:pt-10 sm:pb-16 w-full overflow-hidden">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start w-full">
        <div className="lg:col-span-5 w-full pt-4 lg:pt-6">
          <HeroContent />
        </div>
        <div className="lg:col-span-7 w-full">
          <AnimationStage />
        </div>
      </div>
    </section>
  );
};
