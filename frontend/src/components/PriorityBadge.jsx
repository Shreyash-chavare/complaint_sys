export default function PriorityBadge({ priority }) {
  const icons = { high: '🔴', medium: '🟡', low: '🟢' };
  return (
    <span className={`badge badge-${priority}`}>
      {icons[priority]} {priority.charAt(0).toUpperCase() + priority.slice(1)}
    </span>
  );
}
