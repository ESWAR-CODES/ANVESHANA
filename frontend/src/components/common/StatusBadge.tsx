import React from 'react';

export type EventStatusType = 'upcoming' | 'open' | 'closed' | 'completed' | 'archived';

export interface StatusBadgeProps {
  status: EventStatusType | string;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className = '' }) => {
  const normalized = status.toLowerCase() as EventStatusType;

  const config: Record<
    EventStatusType,
    { label: string; bg: string; text: string; border: string; dot: string }
  > = {
    upcoming: {
      label: 'Upcoming',
      bg: 'bg-[#1C2541]/10',
      text: 'text-[#1C2541]',
      border: 'border-[#1C2541]/20',
      dot: 'bg-[#1C2541]',
    },
    open: {
      label: 'Registration Open',
      bg: 'bg-emerald-50',
      text: 'text-emerald-800',
      border: 'border-emerald-300',
      dot: 'bg-emerald-500 animate-pulse',
    },
    closed: {
      label: 'Registrations Closed',
      bg: 'bg-amber-50',
      text: 'text-amber-800',
      border: 'border-amber-300',
      dot: 'bg-amber-500',
    },
    completed: {
      label: 'Completed',
      bg: 'bg-slate-100',
      text: 'text-slate-750',
      border: 'border-slate-300',
      dot: 'bg-slate-500',
    },
    archived: {
      label: 'Archived',
      bg: 'bg-gray-100',
      text: 'text-gray-600',
      border: 'border-gray-300',
      dot: 'bg-gray-400',
    },
  };

  const current = config[normalized] || {
    label: status,
    bg: 'bg-gray-100',
    text: 'text-gray-700',
    border: 'border-gray-200',
    dot: 'bg-gray-400',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wider border ${current.bg} ${current.text} ${current.border} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${current.dot}`}></span>
      {current.label}
    </span>
  );
};
