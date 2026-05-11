export interface DisplayMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
  streaming?: boolean;
  isSystem?: boolean;
}

export function formatTs(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const sameDay =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();
  const time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  if (sameDay) return time;
  return `${d.toLocaleDateString([], { month: 'short', day: 'numeric' })} · ${time}`;
}

export const COLORS = {
  green: '#6dbf8a',
  danger: '#c97070',
} as const;
