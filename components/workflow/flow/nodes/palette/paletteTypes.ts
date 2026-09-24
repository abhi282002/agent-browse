export interface ArchetypeStyle {
  icon: string;
  badge: string;
  iconBg: string;
  borderHover: string;
}

export const ARCHETYPE_STYLES: Record<string, ArchetypeStyle> = {
  navigation: { icon: '🌐', badge: 'bg-blue-50 text-blue-700 border-blue-200', iconBg: 'bg-blue-50 text-blue-600', borderHover: 'hover:border-blue-300' },
  grounding: { icon: '👁️', badge: 'bg-violet-50 text-violet-700 border-violet-200', iconBg: 'bg-violet-50 text-violet-600', borderHover: 'hover:border-violet-300' },
  action: { icon: '⚡', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200', iconBg: 'bg-emerald-50 text-emerald-600', borderHover: 'hover:border-emerald-300' },
  form: { icon: '📝', badge: 'bg-amber-50 text-amber-700 border-amber-200', iconBg: 'bg-amber-50 text-amber-600', borderHover: 'hover:border-amber-300' },
  extraction: { icon: '📊', badge: 'bg-cyan-50 text-cyan-700 border-cyan-200', iconBg: 'bg-cyan-50 text-cyan-600', borderHover: 'hover:border-cyan-300' },
  webhook: { icon: '🔗', badge: 'bg-orange-50 text-orange-700 border-orange-200', iconBg: 'bg-orange-50 text-orange-600', borderHover: 'hover:border-orange-300' },
  summarization: { icon: '✨', badge: 'bg-indigo-50 text-indigo-700 border-indigo-200', iconBg: 'bg-indigo-50 text-indigo-600', borderHover: 'hover:border-indigo-300' },
  news_gather: { icon: '📰', badge: 'bg-rose-50 text-rose-700 border-rose-200', iconBg: 'bg-rose-50 text-rose-600', borderHover: 'hover:border-rose-300' },
  news_summary: { icon: '📋', badge: 'bg-pink-50 text-pink-700 border-pink-200', iconBg: 'bg-pink-50 text-pink-600', borderHover: 'hover:border-pink-300' },
  email: { icon: '✉️', badge: 'bg-teal-50 text-teal-700 border-teal-200', iconBg: 'bg-teal-50 text-teal-600', borderHover: 'hover:border-teal-300' },
  authentication: { icon: '🔐', badge: 'bg-amber-50 text-amber-800 border-amber-300', iconBg: 'bg-amber-50 text-amber-700', borderHover: 'hover:border-amber-300' },
  auth: { icon: '🔐', badge: 'bg-amber-50 text-amber-800 border-amber-300', iconBg: 'bg-amber-50 text-amber-700', borderHover: 'hover:border-amber-300' },
};
