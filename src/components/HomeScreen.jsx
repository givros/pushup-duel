import { useState } from 'react';

export default function HomeScreen({ defaultGoal, onStart }) {
  const [goal, setGoal] = useState(String(defaultGoal || 10));
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
    <main className="home-screen">
      <div className="home-content">
        <p className="eyebrow">Challenge caméra</p>
        <h1>Push Challenge</h1>

        <form className="goal-form" onSubmit={handleSubmit} noValidate>
          <label htmlFor="pushup-goal">Objectif de pompes</label>
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
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          <button className="primary-button" type="submit">
            Start Challenge
          </button>
        </form>
      </div>
    </main>
  );
}
