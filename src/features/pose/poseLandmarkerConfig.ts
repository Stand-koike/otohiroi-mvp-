export const POSE_LANDMARKER_OPTIONS = {
  runningMode: 'VIDEO' as const,
  numPoses: 1,
  minPoseDetectionConfidence: 0.5,
  minPosePresenceConfidence: 0.5,
  minTrackingConfidence: 0.5,
}

export const POSE_LANDMARKER_MODEL_PATH = 'models/pose_landmarker_lite.task'
