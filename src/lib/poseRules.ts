import type { PosePoint } from './mediapipePose';

export type PoseRuleResult = {
  label: string;
  confidence: number;
};

function avgY(landmarks: PosePoint[], indices: number[]) {
  const valid = indices
    .map((index) => landmarks[index])
    .filter((point): point is PosePoint => Boolean(point));
  if (valid.length === 0) return 0;
  return valid.reduce((sum, point) => sum + point.y, 0) / valid.length;
}

function distance(a?: PosePoint, b?: PosePoint) {
  if (!a || !b) return 0;
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

export function evaluatePoseRules(
  landmarks: PosePoint[] | undefined,
  previousLandmarks: PosePoint[] | undefined
): PoseRuleResult {
  if (!landmarks || landmarks.length < 33) {
    return { label: 'No person', confidence: 0 };
  }

  const noseY = landmarks[0]?.y ?? 0.2;
  const leftWristY = landmarks[15]?.y ?? 1;
  const rightWristY = landmarks[16]?.y ?? 1;
  const hipY = avgY(landmarks, [23, 24]);
  const kneeY = avgY(landmarks, [25, 26]);

  const leftWristMove = distance(landmarks[15], previousLandmarks?.[15]);
  const rightWristMove = distance(landmarks[16], previousLandmarks?.[16]);

  if (leftWristY < noseY && rightWristY < noseY) {
    return { label: 'AI 识别到：双手举起', confidence: 0.92 };
  }

  if (hipY > kneeY - 0.08 && hipY > 0.48) {
    return { label: 'AI 识别到：下蹲动作', confidence: 0.76 };
  }

  if (Math.max(leftWristMove, rightWristMove) > 0.065) {
    return { label: 'AI 识别到：挥手动作', confidence: 0.7 };
  }

  return { label: 'AI 识别到：站立 / 自然动作', confidence: 0.55 };
}
