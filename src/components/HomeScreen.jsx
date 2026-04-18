import { useState } from 'react';
import BottomNav from './BottomNav.jsx';
import TopBar from './TopBar.jsx';

export default function HomeScreen({ defaultGoal, onStart }) {
  const [goal, setGoal] = useState(String(defaultGoal || 20));
  const [error, setError] = useState('');

  function handleSubmit(event) {
    event.preventDefault();
    const parsedGoal = Number(goal);

    if (!Number.isInteger(parsedGoal) || parsedGoal < 1 || parsedGoal > 999) {
      setError('Entre un objectif entre 1 et 999 pompes.');
      return;
    }

    setError('');
    onStart(parsedGoal);
  }

  return (
    <main className="screen home-screen">
      <TopBar />

      <section className="arena-hero">
        <div className="arena-bg" aria-hidden="true" />
        <div className="arena-content">
          <span>Ready for Battle</span>
          <h1>
            PUSH-UP <em>DEFI</em>
          </h1>

          <form className="duel-launcher" onSubmit={handleSubmit} noValidate>
            <label htmlFor="pushup-goal">Objectif</label>
            <div className="goal-control">
              <input
                id="pushup-goal"
                inputMode="numeric"
                min="1"
                max="999"
                pattern="[0-9]*"
                type="number"
                value={goal}
                onChange={(event) => setGoal(event.target.value)}
                required
              />
              <span>Pompes</span>
            </div>
            {error && (
              <p className="form-error" role="alert">
                {error}
              </p>
            )}
            <button className="launch-button" type="submit">
              <span className="material-symbols-outlined filled">swords</span>
              Lancer un duel
            </button>
          </form>
        </div>
      </section>

      <section className="stats-bento" aria-label="Statistiques">
        <article>
          <span>Daily Best</span>
          <strong>78</strong>
          <small>Reps Today</small>
        </article>
        <article>
          <span>Global Rank</span>
          <strong>
            Top 5<em>%</em>
          </strong>
          <small>Elite League</small>
        </article>
      </section>

      <section className="mission-card">
        <div className="mission-head">
          <div>
            <span>Weekly Mission</span>
            <strong>Master of Volume</strong>
          </div>
          <small>1,250 / 2,000</small>
        </div>
        <div className="mission-track" aria-hidden="true">
          <div />
        </div>
        <p>Earn 500 Coins upon completion</p>
      </section>

      <section className="activity-feed">
        <div className="section-title">
          <h2>Recent Activity</h2>
          <button type="button">History</button>
        </div>
        <Activity icon="workspace_premium" title="vs Alex_Shadow" detail="Duel Won • 55 vs 48" reward="+25 XP" />
        <Activity icon="close" title="vs MuscleMage" detail="Duel Lost • 62 vs 70" reward="+5 XP" muted />
        <Activity icon="workspace_premium" title="vs Iron_Push" detail="Duel Won • 40 vs 32" reward="+20 XP" />
      </section>

      <BottomNav />
    </main>
  );
}

function Activity({ icon, title, detail, reward, muted = false }) {
  return (
    <article className={`activity-item ${muted ? 'muted' : ''}`}>
      <div className="activity-icon">
        <span className="material-symbols-outlined filled">{icon}</span>
      </div>
      <div>
        <strong>{title}</strong>
        <span>{detail}</span>
      </div>
      <small>{reward}</small>
    </article>
  );
}
