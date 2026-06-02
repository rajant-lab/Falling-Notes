import { useEffect, useRef } from 'react';
import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision';
import { useStore } from '../store';
import { Vector3 } from 'three';

export function HandTracker() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const setHandData = useStore((state) => state.setHandData);
  const isAudioStarted = useStore((state) => state.isAudioStarted);
  const lastVideoTime = useRef(-1);
  const requestRef = useRef<number>(0);

  useEffect(() => {
    if (!isAudioStarted) return;

    let handLandmarker: HandLandmarker | null = null;

    const init = async () => {
      const vision = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.20/wasm'
      );
      
      handLandmarker = await HandLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`,
          delegate: 'GPU',
        },
        runningMode: 'VIDEO',
        numHands: 2,
      });

      startWebcam();
    };

    const startWebcam = async () => {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'user',
            width: 1280,
            height: 720
          },
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.addEventListener('loadeddata', predictWebcam);
        }
      }
    };

    const predictWebcam = () => {
      if (!handLandmarker || !videoRef.current) return;

      const video = videoRef.current;
      if (video.currentTime !== lastVideoTime.current) {
        lastVideoTime.current = video.currentTime;
        const startTimeMs = performance.now();
        const result = handLandmarker.detectForVideo(video, startTimeMs);

        if (result.landmarks) {
          const leftHandIndex = result.handedness.findIndex(h => h[0].displayName === 'Left');
          const rightHandIndex = result.handedness.findIndex(h => h[0].displayName === 'Right');

          const processHand = (index: number) => {
            if (index === -1) return { present: false, pinch: false, position: new Vector3(0,0,0), raw: null };
            
            const landmarks = result.landmarks[index];
            // Thumb tip is 4, Index tip is 8
            const thumb = landmarks[4];
            const indexFinger = landmarks[8];
            
            // Calculate distance for pinch
            const distance = Math.sqrt(
              Math.pow(thumb.x - indexFinger.x, 2) +
              Math.pow(thumb.y - indexFinger.y, 2) +
              Math.pow(thumb.z - indexFinger.z, 2)
            );
            
            const isPinch = distance < 0.05; // Threshold

            // Map to 3D space
            // MediaPipe: x (0-1), y (0-1), z (depth)
            // ThreeJS: x (-aspect to aspect), y (-1 to 1)
            // We need to invert X because webcam is mirrored usually, but let's check
            // Usually we mirror the video via CSS, so we might need to invert logic
            // Let's assume standard mapping first:
            // x: (0.5 - x) * width
            // y: (0.5 - y) * height
            
            // Midpoint between thumb and index
            const midX = (thumb.x + indexFinger.x) / 2;
            const midY = (thumb.y + indexFinger.y) / 2;
            
            // Map 0..1 to -5..5 (approx world space width)
            // Invert X for mirror effect
            const worldX = (0.5 - midX) * 14; 
            const worldY = (0.5 - midY) * 8;
            const worldZ = 0; // Keep on plane for now, or use z for depth interaction?

            return {
              present: true,
              pinch: isPinch,
              position: new Vector3(worldX, worldY, worldZ),
              raw: landmarks
            };
          };

          setHandData({
            left: processHand(leftHandIndex),
            right: processHand(rightHandIndex)
          });
        }
      }
      requestRef.current = requestAnimationFrame(predictWebcam);
    };

    init();

    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      if (handLandmarker) handLandmarker.close();
    };
  }, [setHandData, isAudioStarted]);

  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      className="absolute top-0 left-0 w-full h-full object-cover opacity-0 pointer-events-none"
      style={{ transform: 'scaleX(-1)' }} // Mirror locally
    />
  );
}
