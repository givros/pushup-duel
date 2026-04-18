export default function TopBar({ compact = false, progression }) {
  const profile = progression?.profile || {
    nickname: 'Athlète',
    level: 1,
    xp: 0,
    coins: 0
  };
  const levelProgress = Math.min(100, (profile.xp % 500) / 5);

  return (
    <header className={`top-bar ${compact ? 'top-bar-compact' : ''}`}>
      <div className="player-strip">
        <div className="avatar avatar-small" aria-hidden="true">
          <span />
        </div>
        <div className="player-meta">
          <span>{profile.nickname} • Niveau {profile.level}</span>
          {!compact && (
            <div className="xp-track" aria-hidden="true">
              <div style={{ width: `${levelProgress}%` }} />
            </div>
          )}
        </div>
      </div>

      <div className="coin-pill">
        <span className="material-symbols-outlined filled">payments</span>
        <strong>{profile.coins} pièces</strong>
      </div>
    </header>
  );
}
