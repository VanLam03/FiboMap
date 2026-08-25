import { useCallback } from 'react';
import type { MutableRefObject } from 'react';
import * as maplibregl from 'maplibre-gl';
import { useProjectStore } from '../store/useProjectStore';
import type { CameraKeyframe } from '../types/project.types';

let kfIdCounter = 100;

export function useKeyframeCamera(mapRef: MutableRefObject<maplibregl.Map | null>) {
  const {
    playhead, mapStyle, mapDimming,
    addCameraKeyframe, cameraKeyframes,
  } = useProjectStore();

  const addKeyframeAtPlayhead = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;
    const center = map.getCenter();
    const kf: CameraKeyframe = {
      id: `kf-${++kfIdCounter}`,
      time: playhead,
      center: [center.lng, center.lat],
      zoom: map.getZoom(),
      bearing: map.getBearing(),
      pitch: map.getPitch(),
      mapStyle,
      dimming: mapDimming,
      easing: 'cinematic',
      delay: 0,
    };
    addCameraKeyframe(kf);
  }, [playhead, mapStyle, mapDimming, addCameraKeyframe, mapRef]);

  // Interpolate camera state at a given time
  const getCameraAtTime = useCallback((time: number) => {
    const kfs = [...cameraKeyframes].sort((a, b) => a.time - b.time);
    if (kfs.length === 0) return null;
    if (kfs.length === 1) return kfs[0];
    if (time <= kfs[0].time) return kfs[0];
    if (time >= kfs[kfs.length - 1].time) return kfs[kfs.length - 1];

    let before = kfs[0];
    let after = kfs[1];
    for (let i = 0; i < kfs.length - 1; i++) {
      if (kfs[i].time <= time && time <= kfs[i + 1].time) {
        before = kfs[i];
        after = kfs[i + 1];
        break;
      }
    }

    const t = (time - before.time) / (after.time - before.time);
    const ease = easeInOut(t);

    return {
      center: [
        lerp(before.center[0], after.center[0], ease),
        lerp(before.center[1], after.center[1], ease),
      ] as [number, number],
      zoom: lerp(before.zoom, after.zoom, ease),
      bearing: lerp(before.bearing, after.bearing, ease),
      pitch: lerp(before.pitch, after.pitch, ease),
      mapStyle: t < 0.5 ? before.mapStyle : after.mapStyle,
      dimming: lerp(before.dimming, after.dimming, ease),
    };
  }, [cameraKeyframes]);

  // Apply camera state to map
  const applyCameraAtTime = useCallback((time: number) => {
    const map = mapRef.current;
    if (!map) return;
    const cam = getCameraAtTime(time);
    if (!cam) return;
    map.jumpTo({
      center: cam.center,
      zoom: cam.zoom,
      bearing: cam.bearing,
      pitch: cam.pitch,
    });
  }, [getCameraAtTime, mapRef]);

  return { addKeyframeAtPlayhead, getCameraAtTime, applyCameraAtTime };
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function easeInOut(t: number) {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
}
