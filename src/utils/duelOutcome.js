import { CHALLENGE_MODES, RESULT_OUTCOMES } from './progression.js';

const ABANDONED_REASONS = new Set(['forfeit', 'stopped']);

export function getDuelOutcome(duel, role = duel?.role) {
  if (!duel || !role || duel.status !== 'completed' || !duel.challengerResult || !duel.receiverResult) {
    return RESULT_OUTCOMES.pending;
  }

  const winner = getDuelWinner(duel);

  if (winner === 'draw') {
    return RESULT_OUTCOMES.draw;
  }

  return winner === role ? RESULT_OUTCOMES.victory : RESULT_OUTCOMES.defeat;
}

export function getOpponentResult(duel, role = duel?.role) {
  if (!duel || !role) {
    return null;
  }

  return role === 'challenger' ? duel.receiverResult : duel.challengerResult;
}

export function getPlayerResult(duel, role = duel?.role) {
  if (!duel || !role) {
    return null;
  }

  return role === 'challenger' ? duel.challengerResult : duel.receiverResult;
}

function getDuelWinner(duel) {
  const challenger = duel.challengerResult;
  const receiver = duel.receiverResult;
  const challengerAbandoned = ABANDONED_REASONS.has(challenger.reason);
  const receiverAbandoned = ABANDONED_REASONS.has(receiver.reason);

  if (challengerAbandoned !== receiverAbandoned) {
    return challengerAbandoned ? 'receiver' : 'challenger';
  }

  const scoreComparison = compareByMode(duel.challenge, challenger, receiver);

  if (scoreComparison > 0) {
    return 'challenger';
  }

  if (scoreComparison < 0) {
    return 'receiver';
  }

  return 'draw';
}

function compareByMode(challenge, challenger, receiver) {
  if (challenge.mode === CHALLENGE_MODES.fixedGoal) {
    const challengerCompleted = challenger.reason === 'completed' && challenger.pushups >= challenge.goal;
    const receiverCompleted = receiver.reason === 'completed' && receiver.pushups >= challenge.goal;

    if (challengerCompleted !== receiverCompleted) {
      return challengerCompleted ? 1 : -1;
    }

    if (challengerCompleted && receiverCompleted) {
      return compareLower(challenger.timeMs, receiver.timeMs);
    }
  }

  return compareHigher(challenger.pushups, receiver.pushups) || compareLower(challenger.timeMs, receiver.timeMs);
}

function compareHigher(left, right) {
  if (left > right) {
    return 1;
  }

  if (left < right) {
    return -1;
  }

  return 0;
}

function compareLower(left, right) {
  if (left < right) {
    return 1;
  }

  if (left > right) {
    return -1;
  }

  return 0;
}
