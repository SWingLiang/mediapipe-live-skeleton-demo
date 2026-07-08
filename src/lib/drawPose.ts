import { POSE_CONNECTIONS, type PosePoint } from './mediapipePose';

export type DrawPoseOptions = {
  showSkeleton: boolean;
  showPoints: boolean;
  showLabels: boolean;
  showTrail: boolean;
};

function isVisible(point: PosePoint | undefined) {
  if (!point) return false;
  return point.visibility === undefined || point.visibility > 0.35;
}

function toCanvasPoint(point: PosePoint, width: number, height: number) {
  return {
    x: point.x * width,
    y: point.y * height
  };
}

export function drawPose(
  ctx: CanvasRenderingContext2D,
  landmarks: PosePoint[] | undefined,
  options: DrawPoseOptions
) {
  const { width, height } = ctx.canvas;

  if (options.showTrail) {
    ctx.fillStyle = 'rgba(2, 8, 20, 0.18)';
    ctx.fillRect(0, 0, width, height);
  } else {
    ctx.clearRect(0, 0, width, height);
  }

  if (!landmarks || landmarks.length === 0) return;

  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  if (options.showSkeleton) {
    ctx.strokeStyle = 'rgba(64, 220, 255, 0.92)';
    ctx.lineWidth = Math.max(2, width * 0.004);
    ctx.shadowBlur = 14;
    ctx.shadowColor = 'rgba(56, 189, 248, 0.55)';

    for (const [startIndex, endIndex] of POSE_CONNECTIONS) {
      const start = landmarks[startIndex];
      const end = landmarks[endIndex];
      if (!isVisible(start) || !isVisible(end)) continue;

      const a = toCanvasPoint(start, width, height);
      const b = toCanvasPoint(end, width, height);
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    }
  }

  if (options.showPoints) {
    for (let index = 0; index < landmarks.length; index += 1) {
      const point = landmarks[index];
      if (!isVisible(point)) continue;
      const { x, y } = toCanvasPoint(point, width, height);
      const radius = Math.max(3, width * 0.006);

      ctx.shadowBlur = 12;
      ctx.shadowColor = 'rgba(255, 214, 102, 0.75)';
      ctx.fillStyle = 'rgba(255, 214, 102, 0.95)';
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.lineWidth = 1;
      ctx.stroke();

      if (options.showLabels) {
        ctx.shadowBlur = 0;
        ctx.font = `${Math.max(10, width * 0.018)}px ui-monospace, SFMono-Regular, Menlo, monospace`;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.92)';
        ctx.fillText(String(index), x + radius + 2, y - radius - 2);
      }
    }
  }

  ctx.restore();
}
