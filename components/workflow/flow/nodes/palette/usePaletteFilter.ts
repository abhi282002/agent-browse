'use client';

import { useState, useMemo } from 'react';
import { trpc } from '@/lib/trpc/client';
import type { NodeTemplate } from '../../types';

export function usePaletteFilter() {
  const [search, setSearch] = useState('');
  const [selectedTab, setSelectedTab] = useState('All');
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  const { data: serverTemplates, isLoading } = trpc.nodeTemplate.getAll.useQuery(
    undefined,
    { staleTime: 60 * 1000 },
  );

  const templates: NodeTemplate[] = (serverTemplates as NodeTemplate[]) ?? [];

  const grouped = useMemo(() => {
    const q = search.trim().toLowerCase();
    const filtered = templates.filter((t) => {
      const matchesSearch =
        !q ||
        t.title.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.archetype.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q);

      const matchesTab =
        selectedTab === 'All' ||
        t.category.toLowerCase().includes(selectedTab.toLowerCase()) ||
        t.archetype.toLowerCase().includes(selectedTab.toLowerCase());

      return matchesSearch && matchesTab;
    });

    return filtered.reduce<Record<string, NodeTemplate[]>>((acc, t) => {
      const cat = t.category || 'General';
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(t);
      return acc;
    }, {});
  }, [templates, search, selectedTab]);

  return { search, setSearch, selectedTab, setSelectedTab, selectedKey, setSelectedKey, grouped, templates, isLoading };
}
