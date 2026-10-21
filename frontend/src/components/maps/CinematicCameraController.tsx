// src/components/maps/CinematicCameraController.tsx
import React, { useEffect, useRef } from 'react';
import { useThree } from '@react-three/fiber';
import gsap from 'gsap';
import { MapProjectionConfig, projectLatLngTo3D } from './Geographic3DTerrain';

export type CameraPreset = 'hero' | 'drone' | 'topdown' | 'orbit';

interface CinematicCameraControllerProps {
  targetCoords: [number, number] | null;
  projection: MapProjectionConfig;
  cameraPreset: CameraPreset | null;
  bearingAngle?: number; // degrees
  tiltAngle?: number; // degrees
  controlsRef: React.RefObject<any>;
  prefersReducedMotion?: boolean;
  onFlyComplete?: () => void;
}

export const CinematicCameraController: React.FC<CinematicCameraControllerProps> = ({
  targetCoords,
  projection,
  cameraPreset,
  bearingAngle,
  tiltAngle,
  controlsRef,
  prefersReducedMotion = false,
  onFlyComplete,
}) => {
  const { camera } = useThree();
  const currentTween = useRef<gsap.core.Tween | null>(null);

  // Smooth Fly-To when Target Coordinates change
  useEffect(() => {
    if (!controlsRef.current) return;
    const controls = controlsRef.current;

    let targetX = 0;
    let targetZ = 0;
    let newCamX = 0;
    let newCamY = 18;
    let newCamZ = 22;

    if (targetCoords) {
      const [x, , z] = projectLatLngTo3D(targetCoords[0], targetCoords[1], projection);
      targetX = x;
      targetZ = z;

      // Google-Earth Drone Fly-In offset: 6 units above, 7.5 units back along Z
      newCamX = targetX;
      newCamY = 7.0;
      newCamZ = targetZ + 8.5;
    } else {
      // Default overview
      targetX = 0;
      targetZ = 0;
      newCamX = 0;
      newCamY = projection.planeWidth > 30 ? 32 : 18;
      newCamZ = projection.planeWidth > 30 ? 28 : 22;
    }

    if (currentTween.current) {
      currentTween.current.kill();
    }

    if (prefersReducedMotion) {
      controls.target.set(targetX, 0, targetZ);
      camera.position.set(newCamX, newCamY, newCamZ);
      controls.update();
      if (onFlyComplete) onFlyComplete();
      return;
    }

    // Parabolic arc: camera lifts slightly during flight to give cinematic drone perspective
    const flightDuration = 1.35;

    // Animate Controls Target
    gsap.to(controls.target, {
      x: targetX,
      y: 0,
      z: targetZ,
      duration: flightDuration,
      ease: 'power2.inOut',
    });

    // Animate Camera Position
    currentTween.current = gsap.to(camera.position, {
      x: newCamX,
      y: newCamY,
      z: newCamZ,
      duration: flightDuration,
      ease: 'power2.inOut',
      onUpdate: () => {
        controls.update();
      },
      onComplete: () => {
        if (onFlyComplete) onFlyComplete();
      },
    });
  }, [targetCoords, projection, prefersReducedMotion]);

  // Camera Presets
  useEffect(() => {
    if (!cameraPreset || !controlsRef.current) return;
    const controls = controlsRef.current;
    const currentTarget = controls.target;

    let targetY = 18;
    let targetDistanceZ = 22;
    let targetDistanceX = 0;

    switch (cameraPreset) {
      case 'drone':
        targetY = 6.5;
        targetDistanceZ = 8.0;
        break;
      case 'hero':
        targetY = 16.0;
        targetDistanceZ = 20.0;
        break;
      case 'topdown':
        targetY = 30.0;
        targetDistanceZ = 0.05; // Almost straight down
        break;
      case 'orbit':
        targetY = 22.0;
        targetDistanceZ = 26.0;
        break;
    }

    const destX = currentTarget.x + targetDistanceX;
    const destY = targetY;
    const destZ = currentTarget.z + targetDistanceZ;

    if (prefersReducedMotion) {
      camera.position.set(destX, destY, destZ);
      controls.update();
      return;
    }

    gsap.to(camera.position, {
      x: destX,
      y: destY,
      z: destZ,
      duration: 1.1,
      ease: 'power2.out',
      onUpdate: () => controls.update(),
    });
  }, [cameraPreset, prefersReducedMotion]);

  // Interactive Bearing Angle adjustments (Rotate around target)
  useEffect(() => {
    if (bearingAngle === undefined || !controlsRef.current) return;
    const controls = controlsRef.current;
    const target = controls.target;

    const rad = (bearingAngle * Math.PI) / 180;
    const dist = Math.sqrt(
      Math.pow(camera.position.x - target.x, 2) + Math.pow(camera.position.z - target.z, 2)
    );

    const destX = target.x + dist * Math.sin(rad);
    const destZ = target.z + dist * Math.cos(rad);

    gsap.to(camera.position, {
      x: destX,
      z: destZ,
      duration: 0.8,
      ease: 'power2.out',
      onUpdate: () => controls.update(),
    });
  }, [bearingAngle]);

  return null;
};

export default CinematicCameraController;
