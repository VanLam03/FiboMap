// ─── Project Types ─────────────────────────────────────────────────────────
import type { Feature } from 'geojson';

export type AspectRatio = '16:9' | '9:16' | '1:1';

export type MapStyle =
  | 'satellite'
  | 'google-satellite'
  | 'google-streets'
  | 'dark'
  | 'vintage'
  | 'streets'
  | 'terrain'
  | 'light';

export type Tool =
  | 'select'
  | 'area'
  | 'area-auto'
  | 'line'
  | 'route'
  | 'import'
  | 'chart'
  | 'tts'
  | 'templates'
  | 'arrow'
  | 'text'
  | 'text-effect'
  | 'callout'
  | 'widget'
  | 'media'
  | 'audio'
  | 'object';

export type AreaDrawingMode = 'polygon' | 'rectangle' | 'square' | 'circle' | 'freehand' | 'pen';

export type LayerType =
  | 'area'
  | 'line'
  | 'route'
  | 'arrow'
  | 'text'
  | 'callout'
  | 'widget'
  | 'media'
  | 'audio'
  | 'object'
  | 'chart'
  | 'counter';

export type EasingType = 'ease-in-out' | 'ease-out' | 'cinematic';

export type AppearEffect = 'draw' | 'blink' | 'fade-in' | 'extrude-3d' | 'none';
export type ExitEffect = 'none' | 'fade-out' | 'retract' | 'shrink' | 'flash';

// Camera keyframe stored at a specific time
export interface CameraKeyframe {
  id: string;
  time: number; // seconds
  center: [number, number]; // [lng, lat]
  zoom: number;
  bearing: number;
  pitch: number;
  mapStyle: MapStyle;
  dimming: number; // 0-100
  easing: EasingType;
  delay: number; // seconds before transition starts
}

// A timeline layer (area, text, arrow, etc.)
export interface TimelineLayer {
  id: string;
  type: LayerType;
  name: string;
  color: string;
  startTime: number;  // seconds
  endTime: number;    // seconds
  visible: boolean;
  locked: boolean;
  selected: boolean;

  // Area specific
  areaData?: {
    geojson: Feature | null;
    borderWidth: number;
    borderStyle: 'solid' | 'dashed';
    borderColor: string;
    fillColor: string;
    fillOpacity: number;
    appearEffect: AppearEffect;
    appearDuration: number;
    exitEffect: ExitEffect;
    exitDuration: number;
    is3D: boolean;
    extrudeHeight: number;
  };

  // Line/Route specific
  lineData?: {
    geojson: Feature | null;
    color: string;
    width: number;
    glow: boolean;
    animated: boolean;
    animationProgress: number; // 0-1 during playback
    distanceKm?: number;
    vehicle?: 'car' | 'motorcycle';
    fromName?: string;
    toName?: string;
  };

  // Text specific
  textData?: {
    content: string;
    fontSize: number;
    color: string;
    pinToMap: boolean;
    lngLat?: [number, number];
    screenX?: number;
    screenY?: number;
    effect: string;
    glow: boolean;
  };

  // Number counter specific
  counterData?: {
    startValue: number;
    endValue: number;
    prefix: string;
    suffix: string;
    decimals: number;
    fontSize: number;
    color: string;
    pinToMap: boolean;
    lngLat?: [number, number];
  };

  // Arrow specific
  arrowData?: {
    from: [number, number];
    to: [number, number];
    color: string;
    width: number;
    headSize: number;
    curvature: number;
    animated: boolean;
  };

  // Callout specific
  calloutData?: {
    title: string;
    subtitle: string;
    theme: 'location' | 'real_estate' | 'social_fb' | 'social_tiktok' | 'phone' | 'media';
    lngLat: [number, number];
    imageUrl?: string;
    badgeText?: string;
    price?: string;
    area?: string;
    phoneNumber?: string;
  };

  // Widget & Radar specific
  widgetData?: {
    widgetType: 'school' | 'hospital' | 'airport' | 'mall' | 'gas' | 'cafe' | 'beach' | 'golf' | 'radar';
    label: string;
    lngLat: [number, number];
    isRadar?: boolean;
    radarRadius?: number;
    radarColor?: string;
  };

  // Object PNG & Flag specific
  objectData?: {
    objectType: 'airplane' | 'car' | 'person' | 'ship' | 'flag' | 'landmark';
    countryCode?: string;
    countryName?: string;
    lngLat: [number, number];
    speed?: number;
    size?: number;
    movingAlongLine?: boolean;
  };

  // Audio specific
  audioData?: {
    title: string;
    audioUrl?: string;
    volume: number;
    soundEffectType?: string;
  };
}

export interface ProjectState {
  name: string;
  aspectRatio: AspectRatio;
  duration: number; // seconds
  fps: number;
  mapStyle: MapStyle;

  // Camera
  cameraKeyframes: CameraKeyframe[];
  currentCamera: {
    center: [number, number];
    zoom: number;
    bearing: number;
    pitch: number;
  };

  // Layers
  layers: TimelineLayer[];
  selectedLayerId: string | null;

  // Timeline / Playback
  playhead: number; // current time in seconds
  isPlaying: boolean;
  timelineZoom: number; // pixels per second

  // UI state
  activeTool: Tool;
  areaDrawingMode: AreaDrawingMode;
  isEditingVertices: boolean;
  isKeyframeCameraMode: boolean;
  mapDimming: number; // 0-100

  // Panel
  activeView: 'map' | 'media';

  // Background style when activeView === 'media'
  mediaBackground: 'sparks' | 'grid' | 'galaxy' | 'dark-gradient' | 'cyberpunk';
}
