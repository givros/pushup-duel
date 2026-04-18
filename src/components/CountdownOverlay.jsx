export default function CountdownOverlay({ ready, count, label }) {
  return (
    <div className="countdown-overlay" aria-live="polite">
      <p>{label}</p>
      <div className="countdown-number">{ready ? count : '--'}</div>
    </div>
  );
}
