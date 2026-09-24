export interface NodeEntrance {
  offsetX: number;
  offsetY: number;
}

export interface NodeCoordinate {
  id: string;
  label: string;
  category: string;
  color: 'emerald' | 'cyan' | 'violet' | 'amber' | 'indigo' | 'fuchsia';
  x: string;
  y: string;
  delay: number;
  entrance: NodeEntrance;
}

export interface CursorTarget {
  name: string;
  color: string;
  badgeBg: string;
  path: { x: string; y: string; duration: number }[];
}
