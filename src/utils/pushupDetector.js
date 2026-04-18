import {
  POSE_LANDMARKS,
  angleDegrees,
  averageConfidence,
  clamp,
  distance2D,
  pointInFrame,
  smoothValue
} from './poseMath.js';

export const PUSHUP_DETECTOR_DEFAULTS = {
  minConfidence: 0.55,
  highElbowAngle: 155,
  lowElbowAngle: 105,
  minStableFrames: 2,
  minTransitionMs: 240,
  cooldownMs: 500,
  minShoulderTravel: 0.045,
  minTorsoLength: 0.075,
  smoothing: 0.38,
  okHoldMs: 650,
  frameMargin: 0.04
};

const SIDES = [
  {
    name: 'left',
    shoulder: POSE_LANDMARKS.leftShoulder,
    elbow: POSE_LANDMARKS.leftElbow,
    wrist: POSE_LANDMARKS.leftWrist,
    hip: POSE_LANDMARKS.leftHip
  },
  {
    name: 'right',
    shoulder: POSE_LANDMARKS.rightShoulder,
    elbow: POSE_LANDMARKS.rightElbow,
    wrist: POSE_LANDMARKS.rightWrist,
    hip: POSE_LANDMARKS.rightHip
  }
];

export function createPushupDetector(config = {}) {
  return new PushupDetector(config);
}

export function analyzePushupPose(landmarks, config = {}) {
  const options = { ...PUSHUP_DETECTOR_DEFAULTS, ...config };

  if (!Array.isArray(landmarks) || landmarks.length === 0) {
    return invalidFrame('mal cadré', 0);
  }

  const side = chooseBestSide(landmarks);
  if (!side) {
    return invalidFrame('mal cadré', 0);
  }

  const shoulder = landmarks[side.shoulder];
  const elbow = landmarks[side.elbow];
  const wrist = landmarks[side.wrist];
  const hip = landmarks[side.hip];
  const points = [shoulder, elbow, wrist, hip];
  const confidence = averageConfidence(points);
  const framed = points.every((point) => pointInFrame(point, options.frameMargin));
  const torsoLength = distance2D(shoulder, hip);

  if (confidence < options.minConfidence || !framed || torsoLength < options.minTorsoLength) {
    return invalidFrame('mal cadré', confidence, side.name, {
      torsoLength,
      framed
    });
  }

  const elbowAngle = angleDegrees(shoulder, elbow, wrist);
  const shoulderY = shoulder.y;

  return {
    isValid: true,
    status: 'Prêt',
    side: side.name,
    confidence: clamp(confidence),
    elbowAngle,
    shoulderY,
    torsoLength,
    isHigh: elbowAngle >= options.highElbowAngle,
    isLow: elbowAngle <= options.lowElbowAngle,
    metrics: {
      elbowAngle,
      torsoLength,
      shoulderY
    }
  };
}

export class PushupDetector {
  constructor(config = {}) {
    this.config = { ...PUSHUP_DETECTOR_DEFAULTS, ...config };
    this.reset();
  }

  reset() {
    this.count = 0;
    this.state = 'waitingTop';
    this.lastPoseClass = 'unknown';
    this.stableFrames = 0;
    this.smoothedAngle = null;
    this.smoothedShoulderY = null;
    this.topShoulderY = null;
    this.lowestShoulderY = null;
    this.lastTransitionMs = 0;
    this.lastCountMs = 0;
    this.okUntilMs = 0;
  }

  inspect(landmarks) {
    const frame = analyzePushupPose(landmarks, this.config);

    if (!frame.isValid) {
      return this.output(frame, 'mal cadré');
    }

    if (frame.isLow) {
      return this.output(frame, 'Monte');
    }

    if (frame.isHigh) {
      return this.output(frame, 'Prêt');
    }

    return this.output(frame, 'Descends');
  }

  update(landmarks, timestampMs = performance.now()) {
    const frame = analyzePushupPose(landmarks, this.config);

    if (!frame.isValid) {
      return this.output(frame, 'mal cadré');
    }

    const smoothedFrame = this.smoothFrame(frame);
    const poseClass = getPoseClass(smoothedFrame, this.config);
    const stable = this.updateStability(poseClass);

    if (timestampMs < this.okUntilMs) {
      return this.output(smoothedFrame, 'OK');
    }

    if (this.state === 'waitingTop') {
      if (poseClass === 'high' && stable) {
        this.state = 'top';
        this.topShoulderY = smoothedFrame.shoulderY;
        this.lowestShoulderY = smoothedFrame.shoulderY;
        this.lastTransitionMs = timestampMs;
      }

      return this.output(smoothedFrame, 'Prêt');
    }

    if (this.state === 'top') {
      this.lowestShoulderY = Math.max(this.lowestShoulderY ?? smoothedFrame.shoulderY, smoothedFrame.shoulderY);

      if (poseClass === 'low' && stable && timestampMs - this.lastTransitionMs >= this.config.minTransitionMs) {
        this.state = 'bottom';
        this.lastTransitionMs = timestampMs;
        return this.output(smoothedFrame, 'Monte');
      }

      return this.output(smoothedFrame, 'Descends');
    }

    if (this.state === 'bottom') {
      this.lowestShoulderY = Math.max(this.lowestShoulderY ?? smoothedFrame.shoulderY, smoothedFrame.shoulderY);

      if (
        poseClass === 'high' &&
        stable &&
        timestampMs - this.lastTransitionMs >= this.config.minTransitionMs &&
        timestampMs - this.lastCountMs >= this.config.cooldownMs
      ) {
        const shoulderTravel = this.getShoulderTravel(smoothedFrame);
        const counted = shoulderTravel >= this.config.minShoulderTravel;

        this.state = 'top';
        this.topShoulderY = smoothedFrame.shoulderY;
        this.lowestShoulderY = smoothedFrame.shoulderY;
        this.lastTransitionMs = timestampMs;

        if (counted) {
          this.count += 1;
          this.lastCountMs = timestampMs;
          this.okUntilMs = timestampMs + this.config.okHoldMs;
          return this.output(smoothedFrame, 'OK');
        }

        return this.output(smoothedFrame, 'Descends');
      }

      return this.output(smoothedFrame, 'Monte');
    }

    return this.output(smoothedFrame, 'Prêt');
  }

  smoothFrame(frame) {
    this.smoothedAngle = smoothValue(this.smoothedAngle, frame.elbowAngle, this.config.smoothing);
    this.smoothedShoulderY = smoothValue(this.smoothedShoulderY, frame.shoulderY, this.config.smoothing);

    return {
      ...frame,
      elbowAngle: this.smoothedAngle,
      shoulderY: this.smoothedShoulderY,
      isHigh: this.smoothedAngle >= this.config.highElbowAngle,
      isLow: this.smoothedAngle <= this.config.lowElbowAngle,
      metrics: {
        ...frame.metrics,
        elbowAngle: this.smoothedAngle,
        shoulderY: this.smoothedShoulderY,
        shoulderTravel: this.getShoulderTravel({ ...frame, shoulderY: this.smoothedShoulderY })
      }
    };
  }

  updateStability(poseClass) {
    if (poseClass === this.lastPoseClass) {
      this.stableFrames += 1;
    } else {
      this.lastPoseClass = poseClass;
      this.stableFrames = 1;
    }

    return this.stableFrames >= this.config.minStableFrames;
  }

  getShoulderTravel(frame) {
    if (this.topShoulderY === null || this.lowestShoulderY === null || !frame.torsoLength) {
      return 0;
    }

    return Math.max(0, (this.lowestShoulderY - this.topShoulderY) / frame.torsoLength);
  }

  output(frame, status) {
    return {
      count: this.count,
      status,
      phase: this.state,
      confidence: clamp(frame.confidence || 0),
      isValid: Boolean(frame.isValid),
      side: frame.side || 'none',
      metrics: frame.metrics || {}
    };
  }
}

function chooseBestSide(landmarks) {
  return SIDES.map((side) => ({
    ...side,
    confidence: averageConfidence([
      landmarks[side.shoulder],
      landmarks[side.elbow],
      landmarks[side.wrist],
      landmarks[side.hip]
    ])
  })).sort((a, b) => b.confidence - a.confidence)[0];
}

function getPoseClass(frame, config) {
  if (frame.elbowAngle >= config.highElbowAngle) {
    return 'high';
  }

  if (frame.elbowAngle <= config.lowElbowAngle) {
    return 'low';
  }

  return 'middle';
}

function invalidFrame(status, confidence, side = 'none', metrics = {}) {
  return {
    isValid: false,
    status,
    side,
    confidence: clamp(confidence),
    metrics
  };
}
