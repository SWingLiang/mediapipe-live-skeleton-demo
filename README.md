# MediaPipe Live Skeleton Demo

A mobile-first Web demo for the **Digital ICH Workshop**. It lets an audience scan a QR code, open the phone camera, and see the human body translated into **MediaPipe Human Keypoints 33** in real time.

> 讲座叙事：从身体，到骨架；从动作，到数据；从非遗表演，到可计算文化。

## Features

- React + Vite + TypeScript
- MediaPipe `@mediapipe/tasks-vision` Pose Landmarker
- Real-time webcam pose detection
- 33 human pose keypoints
- Canvas overlay for skeleton, points, labels, and motion trail
- Front/back camera switch
- Mirror mode for selfie experience
- FPS and detection status display
- Simple rule-based interaction:
  - hands raised
  - squat
  - waving
- No backend required
- Ready for Vercel deployment

## Privacy

Video is processed in the user's browser. The demo does **not** upload camera video to a server.

## Local development

```bash
npm install
npm run dev
```

Then open:

```txt
http://localhost:5173
```

For mobile testing on the same Wi-Fi network, Vite runs with `--host 0.0.0.0`, so you can open the local network address displayed in the terminal.

## Build

```bash
npm run build
npm run preview
```

## Deploy to Vercel

1. Open Vercel Dashboard.
2. Click **Add New Project**.
3. Import this GitHub repository:

```txt
SWingLiang/mediapipe-live-skeleton-demo
```

4. Keep the default Vite settings:
   - Framework Preset: `Vite`
   - Build Command: `npm run build`
   - Output Directory: `dist`
5. Deploy.
6. Use the Vercel URL to generate a QR code for the lecture audience.

Camera access requires HTTPS. Vercel provides HTTPS automatically.

## Model loading

The app first tries to load:

```txt
/public/models/pose_landmarker.task
```

If that file does not exist, it falls back to the official MediaPipe hosted Pose Landmarker Lite model.

For more stable access in China or on a Hong Kong server, download the `.task` model file and place it at:

```txt
public/models/pose_landmarker.task
```

You can also change model URLs in:

```txt
src/lib/mediapipePose.ts
```

## Recommended lecture use

Use this as a live audience demo:

1. Put the Vercel URL into a QR code.
2. Ask students or audience members to scan it.
3. Ask them to raise both hands, squat, or wave.
4. Show that the body is being translated into real-time keypoint data.

Suggested wording:

> 这不是把人变成图像，而是把身体动作变成可以计算的结构。AI 看到的不是“一个人”，而是一组关键点、连线、轨迹和时序关系。

## Future extensions

- Export pose landmarks as JSON
- Export frame-by-frame CSV
- Add OpenPose-style keypoint comparison
- Add Lion Keypoints mapping for Guangdong lion dance
- Add Yingge dance gesture classification
- Add 3D world-landmark visualization
- Add workshop mode for classroom data collection
- Deploy a China-friendly version on Volcengine Hong Kong server

## Repository purpose

This repository is intentionally lightweight. It is not a full research pipeline. It is a lecture-facing, audience-friendly demo that makes real-time human pose estimation visible and understandable.
