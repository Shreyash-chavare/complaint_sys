export default function Loader({ count = 3 }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="glass" style={{ padding: 20 }}>
          <div className="skeleton" style={{ height: 18, width: '60%', marginBottom: 12 }} />
          <div className="skeleton" style={{ height: 14, width: '40%', marginBottom: 8 }} />
          <div className="skeleton" style={{ height: 14, width: '80%' }} />
        </div>
      ))}
    </div>
  );
}
