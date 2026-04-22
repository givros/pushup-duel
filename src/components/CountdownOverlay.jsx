import Icon from './Icon.jsx';

export default function CountdownOverlay({ ready, count, label, onCancel }) {
  return (
    <div className="countdown-overlay" aria-live="polite">
      <p>{label}</p>
      <div className="countdown-number">{ready ? count : '--'}</div>
      <button className="countdown-cancel-button" type="button" onClick={onCancel}>
        <Icon name="close" />
        Cancel
      </button>
    </div>
  );
}
