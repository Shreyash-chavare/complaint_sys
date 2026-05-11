export default function StatusBadge({ status }) {
  const labels = {
    open: 'Open', assigned: 'Assigned', in_progress: 'In Progress',
    resolved: 'Resolved', closed: 'Closed', reopened: 'Reopened', withdrawn: 'Withdrawn',
  };
  return (
    <span className={`badge badge-${status}`}>
      {labels[status] ?? status}
    </span>
  );
}
