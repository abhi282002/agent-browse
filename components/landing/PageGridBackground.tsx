import React from 'react';

export const PageGridBackground: React.FC = () => {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#71717a1a_1px,transparent_1px),linear-gradient(to_bottom,#71717a1a_1px,transparent_1px)] bg-[size:32px_32px]" />
      <div className="absolute top-0 right-1/4 w-[600px] h-[500px] bg-emerald-400/10 rounded-full blur-3xl" />
      <div className="absolute top-1/4 right-0 w-[500px] h-[500px] bg-cyan-400/10 rounded-full blur-3xl" />
      <div className="absolute top-2/3 left-1/4 w-[500px] h-[500px] bg-violet-400/10 rounded-full blur-3xl" />
    </div>
  );
};
