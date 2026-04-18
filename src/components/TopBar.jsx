export default function TopBar({ compact = false, title = 'LVL 24 • 1,250 XP' }) {
  return (
    <header className={`top-bar ${compact ? 'top-bar-compact' : ''}`}>
      <div className="player-strip">
        <div className="avatar avatar-small" aria-hidden="true">
          <span />
        </div>
        <div className="player-meta">
          <span>{title}</span>
          {!compact && (
            <div className="xp-track" aria-hidden="true">
              <div />
            </div>
          )}
        </div>
      </div>

      <div className="coin-pill">
        <span className="material-symbols-outlined filled">payments</span>
        <strong>540 COINS</strong>
      </div>
    </header>
  );
}
