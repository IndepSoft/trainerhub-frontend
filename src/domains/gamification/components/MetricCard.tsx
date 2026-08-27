
interface MetricCardProps {
  value: string | number
  label: string
  color: string
}

export function MetricCard({ value, label, color }: MetricCardProps) {
  return (
    <div className="text-center">
      <div className={`text-3xl font-bold ${color}`}>{value}</div>
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  )
}
