import { useEffect, useMemo, useRef, useState } from 'react';
import TopBar from './TopBar.jsx';
import Icon from './Icon.jsx';
import { challengeTitle } from '../utils/progression.js';

const FALLBACK_OPPONENTS = [
  { id: 'nox', pseudo: 'Nox_Pulse', stat: 'Record 1 min : 38', rank: 'Rang argent' },
  { id: 'maya', pseudo: 'MayaCore', stat: 'Série : 6 défis', rank: 'Rang or' },
  { id: 'iron', pseudo: 'Iron_Jules', stat: 'Max déclaré : 54', rank: 'Rang platine' },
  { id: 'kiro', pseudo: 'KiroFlex', stat: 'Précision : 91%', rank: 'Rang argent' },
  { id: 'lena', pseudo: 'LenaVolt', stat: 'Record 1 min : 44', rank: 'Rang or' },
  { id: 'axel', pseudo: 'Axel_Drive', stat: 'Duel envoyés : 22', rank: 'Rang bronze' },
  { id: 'sora', pseudo: 'SoraPush', stat: 'Max déclaré : 61', rank: 'Rang platine' },
  { id: 'milo', pseudo: 'MiloRush', stat: 'Série : 4 défis', rank: 'Rang argent' },
  { id: 'jade', pseudo: 'JadeRep', stat: 'Record 1 min : 36', rank: 'Rang argent' },
  { id: 'marcus', pseudo: 'Marcus Vane', stat: 'Max déclaré : 58', rank: 'Rang élite' }
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
          <p>{phase === 'found' ? 'Adversaire trouvé' : 'Recherche d’un adversaire...'}</p>
          <h1>
            Duel <span>asynchrone</span>
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
            <span>{phase === 'found' ? 'Profil sélectionné' : 'Analyse du profil'}</span>
            <h2>{currentOpponent.pseudo}</h2>
            <p>{currentOpponent.stat}</p>
            <small>{currentOpponent.rank}</small>
          </div>
        </section>

        <div className="search-progress">
          <div className="sync-row">
            <span>{phase === 'found' ? 'Connexion prête' : 'Joueurs en recherche'}</span>
            <strong>{scanProgress}%</strong>
          </div>
          <div className="sync-track">
            <div style={{ width: `${scanProgress}%` }} />
          </div>
        </div>

        {phase === 'searching' && (
          <button className="ghost-cancel" type="button" onClick={onCancel}>
            Annuler
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
