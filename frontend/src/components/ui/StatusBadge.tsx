type Status = 'applied' | 'interview' | 'offer' | 'rejected'

interface StatusBadgeProps {
  status: Status
}

const config: Record<Status, { label: string; classes: string }> = {
  applied: {
    label:   'Applied',
    classes: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  },
  interview: {
    label:   'Interview',
    classes: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  },
  offer: {
    label:   'Offer',
    classes: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  },
  rejected: {
    label:   'Rejected',
    classes: 'bg-red-500/10 text-red-400 border-red-500/20',
  },
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const { label, classes } = config[status]
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${classes}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5 opacity-70" />
      {label}
    </span>
  )
}