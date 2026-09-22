"use client"

import Link from 'next/link';
import { OrganizationModals } from './organization/OrganizationModals';
import { OrgSwitcher } from './organization/OrgSwitcher';
import { BotIcon, GitHubIcon, SparklesIcon, TerminalIcon } from './ui/icons';
import { BellIcon } from 'lucide-react';
import { NotificationSheet } from './Notification/NotificationSheet';
import { useNotificationStore } from '@/stores/useNotification';

export const Navbar = () => {
  return (
    <>
      {/* Top Navigation Bar */}
      <header className="border-b border-zinc-200/80 bg-white/80 backdrop-blur-md sticky top-0 z-40">
        <div className="mx-auto flex max-w-8xl items-center justify-between px-6 sm:px-6 py-3">
          <LeftBrandNavbar />
          <CenterNavbar />
          <RightLinks />
        </div>
        <OrganizationModals />
        <NotificationSheet />
      </header>
    </>
  );
};

const LeftBrandNavbar = () => {
  return (
    <>
      {/* Left Brand */}
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-900 text-white shadow-2xs">
          <BotIcon className="h-4 w-4" />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold tracking-tight text-zinc-900">
            AgentBrowse
          </span>
          <span className="hidden sm:inline-flex items-center rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-medium text-zinc-600 border border-zinc-200">
            Cloud VM Preview
          </span>
        </div>
      </div>
    </>
  );
};

const CenterNavbar = () => {
  return (
    <>
      {/* Center Sandbox Status */}
      <div className="hidden md:flex items-center gap-2 rounded-full border border-zinc-200/80 bg-zinc-50/80 px-3 py-1 text-xs text-zinc-600">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
        </span>
        <span className="font-medium text-zinc-800">Cluster 01</span>
        <span className="text-zinc-400">•</span>
        <span>Chromium 128 (CDP)</span>
        <span className="text-zinc-400">•</span>
        <span className="text-emerald-700 font-mono text-[11px]">
          99.98% Uptime
        </span>
      </div>
    </>
  );
};

const RightLinks = () => {
  const { isOpen, setIsOpen } = useNotificationStore();
  return (
    <>
      {/* Right Links */}
      <div className="flex items-center gap-3 text-xs font-medium">
        <OrgSwitcher />
        <Link
          href="/workflow"
          className="flex items-center gap-1.5 rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-zinc-800 transition-colors shadow-2xs"
        >
          <SparklesIcon className="h-3.5 w-3.5 text-emerald-400" />
          <span>Workflow Studio</span>
        </Link>
        {/* Bell Icon */}
        <div className="flex items-center cursor-pointer justify-end gap-1.5 text-zinc-600 hover:text-zinc-900 transition-colors">
          <BellIcon
            onClick={() => setIsOpen(!isOpen)}
            className="h-3.5 w-3.5"
          />
        </div>
        <div className="h-4 w-px bg-zinc-200 hidden sm:block" />
        <a
          href="https://github.com/abhi282002/agent-browse"
          target="_blank"
          rel="noopener noreferrer"
          className="hidden sm:flex items-center gap-1.5 text-zinc-600 hover:text-zinc-900 transition-colors"
        >
          <GitHubIcon className="h-3.5 w-3.5" />
          <span>GitHub</span>
        </a>
        <a
          href="#docs"
          className="flex items-center gap-1 text-zinc-600 hover:text-zinc-900 transition-colors"
        >
          <TerminalIcon className="h-3.5 w-3.5" />
          <span>Docs</span>
        </a>
      </div>
    </>
  );
};
