# Local MediaPipe model folder

This demo first tries to load:

```txt
/public/models/pose_landmarker.task
```

If the local model file is not present, the app falls back to the official MediaPipe hosted `pose_landmarker_lite.task` model.

For more stable access in China or a private deployment, download the MediaPipe Pose Landmarker task model and place it here as:

```txt
pose_landmarker.task
```

Do not commit very large binary files unless the repository is intended to store them directly. For production, you may also host the model on a CDN or object storage service and change `MODEL_SOURCES` in `src/lib/mediapipePose.ts`.
