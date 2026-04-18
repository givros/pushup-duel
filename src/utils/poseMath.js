export const POSE_LANDMARKS = {
  leftShoulder: 11,
  rightShoulder: 12,
  leftElbow: 13,
  rightElbow: 14,
  leftWrist: 15,
  rightWrist: 16,
  leftHip: 23,
  rightHip: 24
};

export function clamp(value, min = 0, max = 1) {
  return Math.min(max, Math.max(min, value));
}

export function distance2D(a, b) {
  if (!a || !b) {
    return 0;
  }

  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.hypot(dx, dy);
}

export function angleDegrees(a, b, c) {
  if (!a || !b || !c) {
    return 0;
  }

  const ab = { x: a.x - b.x, y: a.y - b.y };
  const cb = { x: c.x - b.x, y: c.y - b.y };
  const dot = ab.x * cb.x + ab.y * cb.y;
  const abLength = Math.hypot(ab.x, ab.y);
  const cbLength = Math.hypot(cb.x, cb.y);

  if (abLength === 0 || cbLength === 0) {
    return 0;
  }

  const cosine = clamp(dot / (abLength * cbLength), -1, 1);
  return (Math.acos(cosine) * 180) / Math.PI;
}

export function landmarkConfidence(landmark) {
  if (!landmark) {
    return 0;
  }

  const visibility = typeof landmark.visibility === 'number' ? landmark.visibility : 1;
  const presence = typeof landmark.presence === 'number' ? landmark.presence : 1;
  return clamp(Math.min(visibility, presence));
}

export function averageConfidence(landmarks) {
  if (!landmarks.length) {
    return 0;
  }

  const total = landmarks.reduce((sum, landmark) => sum + landmarkConfidence(landmark), 0);
  return clamp(total / landmarks.length);
}

export function pointInFrame(landmark, margin = 0.03) {
  if (!landmark) {
    return false;
  }

  return (
    landmark.x >= -margin &&
    landmark.x <= 1 + margin &&
    landmark.y >= -margin &&
    landmark.y <= 1 + margin
  );
}

export function smoothValue(previous, next, alpha) {
  if (previous === null || previous === undefined || Number.isNaN(previous)) {
    return next;
  }

  return previous + (next - previous) * alpha;
}
