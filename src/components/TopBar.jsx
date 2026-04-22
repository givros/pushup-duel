import Icon from './Icon.jsx';

export default function TopBar({ compact = false, progression, onProfileClick }) {
  const profile = progression?.profile || {
    nickname: 'Athlete',
    level: 1,
    xp: 0,
    coins: 0
  };
  const levelProgress = Math.min(100, (profile.xp % 500) / 5);

  return (
    <header className={`top-bar ${compact ? 'top-bar-compact' : ''}`}>
      <div className="player-strip">
        <button className="avatar-button" type="button" onClick={onProfileClick} aria-label="Open profile">
          <div className="avatar avatar-small" aria-hidden="true">
            <span />
          </div>
        </button>
        <div className="player-meta">
          <span>{profile.nickname} • Level {profile.level}</span>
          {!compact && (
            <div className="xp-track" aria-hidden="true">
              <div style={{ width: `${levelProgress}%` }} />
            </div>
          )}
        </div>
      </div>

      <div className="coin-pill">
        <Icon name="payments" className="filled" />
        <strong>{profile.coins} coins</strong>
      </div>
    </header>
  );
}
