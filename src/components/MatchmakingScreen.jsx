import { useEffect, useMemo, useRef, useState } from 'react';
import TopBar from './TopBar.jsx';
import Icon from './Icon.jsx';
import { challengeTitle } from '../utils/progression.js';

const FALLBACK_OPPONENTS = [
  { id: 'nox', pseudo: 'Nox_Pulse', stat: '1 min best: 38', rank: 'Silver rank' },
  { id: 'maya', pseudo: 'MayaCore', stat: 'Streak: 6 duels', rank: 'Gold rank' },
  { id: 'iron', pseudo: 'Iron_Jules', stat: 'Declared max: 54', rank: 'Platinum rank' },
  { id: 'kiro', pseudo: 'KiroFlex', stat: 'Accuracy: 91%', rank: 'Silver rank' },
  { id: 'lena', pseudo: 'LenaVolt', stat: '1 min best: 44', rank: 'Gold rank' },
  { id: 'axel', pseudo: 'Axel_Drive', stat: 'Duels sent: 22', rank: 'Bronze rank' },
  { id: 'sora', pseudo: 'SoraPush', stat: 'Declared max: 61', rank: 'Platinum rank' },
  { id: 'milo', pseudo: 'MiloRush', stat: 'Streak: 4 duels', rank: 'Silver rank' },
  { id: 'jade', pseudo: 'JadeRep', stat: '1 min best: 36', rank: 'Silver rank' },
  { id: 'marcus', pseudo: 'Marcus Vane', stat: 'Declared max: 58', rank: 'Elite rank' }
];

const SEARCH_DELAYS = [55, 55, 65, 70, 80, 92, 110, 135, 165, 205, 260, 330, 420, 540, 680];
const FOUND_PAUSE_MS = 2400;

export default function MatchmakingScreen({ challenge, progression, opponents = [], onReady, onCancel, onOpenSettings }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [phase, setPhase] = useState('searching');
  const [scanProgress, setScanProgress] = useState(8);
  const finalOpponentRef = useRef(null);
  const candidates = opponents.length > 0 ? opponents : FALLBACK_OPPONENTS;
  const currentOpponent = finalOpponentRef.current || candidates[currentIndex % candidates.length];
  const nearbyOpponents = useMemo(() => getNearbyOpponents(candidates, currentIndex), [candidates, currentIndex]);

  useEffect(() => {
    let timeoutId = 0;
    let cancelled = false;
    let step = 0;
    const finalIndex = Math.floor(Math.random() * candidates.length);

    function tick() {
      if (cancelled) {
        return;
      }

      if (step >= SEARCH_DELAYS.length) {
        const opponent = candidates[finalIndex];
        finalOpponentRef.current = opponent;
        setCurrentIndex(finalIndex);
        setScanProgress(100);
        setPhase('found');

        timeoutId = window.setTimeout(() => {
          if (!cancelled) {
            onReady(opponent);
          }
        }, FOUND_PAUSE_MS);
        return;
      }

      setCurrentIndex((current) => current + 1);
      setScanProgress(Math.min(96, Math.round(((step + 1) / SEARCH_DELAYS.length) * 100)));
      timeoutId = window.setTimeout(tick, SEARCH_DELAYS[step]);
      step += 1;
    }

    timeoutId = window.setTimeout(tick, SEARCH_DELAYS[0]);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [candidates, onReady]);

  return (
    <main className="screen matchmaking-screen opponent-search-screen">
      <TopBar compact progression={progression} onProfileClick={onOpenSettings} />

      <section className="opponent-search">
        <div className="versus-heading search-heading">
          <p>{phase === 'found' ? 'Opponent found' : 'Searching for an opponent...'}</p>
          <h1>
            Async <span>duel</span>
          </h1>
          <div className="mode-chip">
            <Icon name="bolt" className="filled" />
            <strong>{challengeTitle(challenge)}</strong>
          </div>
        </div>

        <div className={`search-engine ${phase}`}>
          <div className="search-spinner" aria-hidden="true">
            <Icon name={phase === 'found' ? 'check_circle' : 'radio_button_checked'} className="filled" />
          </div>
          <div className="search-radar" aria-hidden="true">
            {nearbyOpponents.map((opponent, index) => (
              <span key={`${opponent.id}-${index}`}>{opponent.pseudo}</span>
            ))}
          </div>
        </div>

        <section className={`opponent-slot ${phase}`}>
          <OpponentAvatar opponent={currentOpponent} />
          <div className="opponent-copy">
            <span>{phase === 'found' ? 'Selected profile' : 'Analyzing profile'}</span>
            <h2>{currentOpponent.pseudo}</h2>
            <p>{currentOpponent.stat}</p>
            <small>{currentOpponent.rank}</small>
          </div>
        </section>

        <div className="search-progress">
          <div className="sync-row">
            <span>{phase === 'found' ? 'Connection ready' : 'Players searching'}</span>
            <strong>{scanProgress}%</strong>
          </div>
          <div className="sync-track">
            <div style={{ width: `${scanProgress}%` }} />
          </div>
        </div>

        {phase === 'searching' && (
          <button className="ghost-cancel" type="button" onClick={onCancel}>
            Cancel
          </button>
        )}
      </section>
    </main>
  );
}

function OpponentAvatar({ opponent }) {
  return (
    <div className={`opponent-avatar opponent-${opponent.id}`} aria-hidden="true">
      <span>{opponent.pseudo.slice(0, 1)}</span>
    </div>
  );
}

function getNearbyOpponents(candidates, currentIndex) {
  return Array.from({ length: 8 }, (_, offset) => candidates[(currentIndex + offset + 1) % candidates.length]);
}
