import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type {
  ProjectState,
  Tool,
  AspectRatio,
  MapStyle,
  TimelineLayer,
  CameraKeyframe,
} from '../types/project.types';

interface ProjectStore extends ProjectState {
  // Project actions
  setName: (name: string) => void;
  setAspectRatio: (ratio: AspectRatio) => void;
  setDuration: (duration: number) => void;
  setMapStyle: (style: MapStyle) => void;
  setMediaBackground: (bg: ProjectState['mediaBackground']) => void;

  // Tool
  setActiveTool: (tool: Tool) => void;
  setAreaDrawingMode: (mode: import('../types/project.types').AreaDrawingMode) => void;
  setIsEditingVertices: (v: boolean) => void;
  setActiveView: (view: 'map' | 'media') => void;

  // Camera
  setCurrentCamera: (camera: Partial<ProjectState['currentCamera']>) => void;
  setKeyframeCameraMode: (on: boolean) => void;
  addCameraKeyframe: (kf: CameraKeyframe) => void;
  updateCameraKeyframe: (id: string, updates: Partial<CameraKeyframe>) => void;
  deleteCameraKeyframe: (id: string) => void;
  setMapDimming: (v: number) => void;

  // Layers
  addLayer: (layer: TimelineLayer) => void;
  updateLayer: (id: string, updates: Partial<TimelineLayer>) => void;
  deleteLayer: (id: string) => void;
  selectLayer: (id: string | null) => void;
  selectAllLayers: () => void;
  selectMultipleLayers: (ids: string[]) => void;
  toggleSelectLayer: (id: string) => void;
  deleteSelectedLayers: () => void;
  setSelectedLayersDuration: (newLen: number) => void;
  adjustSelectedLayersDuration: (delta: number) => void;
  sequenceSelectedLayers: () => void;
  moveSelectedLayers: (delta: number) => void;
  reorderLayers: (fromIndex: number, toIndex: number) => void;

  // Area layer helpers
  updateAreaData: (id: string, updates: Partial<NonNullable<TimelineLayer['areaData']>>) => void;
  updateAreaGeojson: (id: string, geojson: import('geojson').Feature) => void;

  // Playback
  setPlayhead: (time: number) => void;
  setIsPlaying: (v: boolean) => void;
  setTimelineZoom: (v: number) => void;

  // Template loader
  loadTemplate: (templateId: string) => void;

  // Copy / Paste
  copySelectedLayers: () => void;
  pasteCopiedLayers: () => void;

  // LngLat & Arrow updates for Drag & Drop
  updateLayerLngLat: (id: string, lngLat: [number, number]) => void;
  updateArrowCoords: (id: string, from: [number, number], to: [number, number]) => void;

  // Import / Export State
  exportProjectJSON: () => string;
  importProjectJSON: (jsonStr: string) => boolean;

  // History (simple undo/redo)
  undo: () => void;
  redo: () => void;
}

const defaultCamera = {
  center: [106.6602, 10.7769] as [number, number], // HCMC
  zoom: 11,
  bearing: 0,
  pitch: 0,
};

const initialLayers: TimelineLayer[] = [];

const initialKeyframes: CameraKeyframe[] = [];

export const useProjectStore = create<ProjectStore>()(
  immer((set, get) => ({
    // ── Initial State ──────────────────────────────────────────────────────
    name: 'Dự án mới',
    aspectRatio: '9:16',
    duration: 12.0,
    fps: 30,
    mapStyle: 'google-satellite',
    cameraKeyframes: initialKeyframes,
    currentCamera: defaultCamera,
    layers: initialLayers,
    selectedLayerId: null,
    playhead: 0,
    isPlaying: false,
    timelineZoom: 65,
    activeTool: 'select',
    areaDrawingMode: 'polygon',
    isEditingVertices: false,
    isKeyframeCameraMode: false,
    mapDimming: 0,
    activeView: 'map',
    mediaBackground: 'dark-gradient',

    // ── Actions ───────────────────────────────────────────────────────────
    setName: (name) => set((s) => { s.name = name; }),
    setAspectRatio: (ratio) => set((s) => { s.aspectRatio = ratio; }),
    setDuration: (duration) =>
      set((s: any) => {
        if (!s._past) s._past = [];
        s._past.push({ layers: JSON.parse(JSON.stringify(s.layers)), cameraKeyframes: JSON.parse(JSON.stringify(s.cameraKeyframes)), duration: s.duration });
        s.duration = duration;
      }),
    setMapStyle: (style) => set((s) => { s.mapStyle = style; }),
    setMediaBackground: (bg) => set((s) => { s.mediaBackground = bg; }),

    setActiveTool: (tool) => set((s) => { s.activeTool = tool; }),
    setAreaDrawingMode: (mode) => set((s) => { s.areaDrawingMode = mode; }),
    setIsEditingVertices: (v) => set((s) => { s.isEditingVertices = v; }),
    setActiveView: (view) => set((s) => { s.activeView = view; }),

    setCurrentCamera: (camera) =>
      set((s) => { s.currentCamera = { ...s.currentCamera, ...camera }; }),

    setKeyframeCameraMode: (on) =>
      set((s) => { s.isKeyframeCameraMode = on; }),

    addCameraKeyframe: (kf) =>
      set((s: any) => {
        if (!s._past) s._past = [];
        s._past.push({ layers: JSON.parse(JSON.stringify(s.layers)), cameraKeyframes: JSON.parse(JSON.stringify(s.cameraKeyframes)), duration: s.duration });
        const idx = s.cameraKeyframes.findIndex((k: any) => Math.abs(k.time - kf.time) < 0.05);
        if (idx >= 0) {
          s.cameraKeyframes[idx] = kf;
        } else {
          s.cameraKeyframes.push(kf);
          s.cameraKeyframes.sort((a: any, b: any) => a.time - b.time);
        }
      }),

    updateCameraKeyframe: (id, updates) =>
      set((s) => {
        const kf = s.cameraKeyframes.find((k) => k.id === id);
        if (kf) Object.assign(kf, updates);
      }),

    deleteCameraKeyframe: (id) =>
      set((s: any) => {
        if (!s._past) s._past = [];
        s._past.push({ layers: JSON.parse(JSON.stringify(s.layers)), cameraKeyframes: JSON.parse(JSON.stringify(s.cameraKeyframes)), duration: s.duration });
        s.cameraKeyframes = s.cameraKeyframes.filter((k: any) => k.id !== id);
      }),

    setMapDimming: (v) => set((s) => { s.mapDimming = v; }),

    addLayer: (layer) =>
      set((s: any) => {
        if (!s._past) s._past = [];
        s._past.push({ layers: JSON.parse(JSON.stringify(s.layers)), cameraKeyframes: JSON.parse(JSON.stringify(s.cameraKeyframes)), duration: s.duration });
        s.layers.unshift(layer);
      }),

    updateLayer: (id, updates) =>
      set((s) => {
        const layer = s.layers.find((l) => l.id === id);
        if (layer) Object.assign(layer, updates);
      }),

    deleteLayer: (id) =>
      set((s: any) => {
        if (!s._past) s._past = [];
        s._past.push({ layers: JSON.parse(JSON.stringify(s.layers)), cameraKeyframes: JSON.parse(JSON.stringify(s.cameraKeyframes)), duration: s.duration });
        s.layers = s.layers.filter((l: any) => l.id !== id);
        if (s.selectedLayerId === id) s.selectedLayerId = null;
      }),

    selectLayer: (id) =>
      set((s) => {
        s.selectedLayerId = id;
        s.layers.forEach((l) => { l.selected = l.id === id; });
      }),

    selectAllLayers: () =>
      set((s) => {
        if (s.layers.length > 0) {
          s.selectedLayerId = s.layers[0].id;
          s.layers.forEach((l) => { l.selected = true; });
        }
      }),

    selectMultipleLayers: (ids) =>
      set((s) => {
        const idSet = new Set(ids);
        s.selectedLayerId = ids[0] || null;
        s.layers.forEach((l) => { l.selected = idSet.has(l.id); });
      }),

    toggleSelectLayer: (id) =>
      set((s) => {
        const target = s.layers.find(l => l.id === id);
        if (target) {
          target.selected = !target.selected;
          const selected = s.layers.filter(l => l.selected);
          s.selectedLayerId = selected.length > 0 ? selected[0].id : null;
        }
      }),

    deleteSelectedLayers: () =>
      set((s: any) => {
        if (!s._past) s._past = [];
        s._past.push({ layers: JSON.parse(JSON.stringify(s.layers)), cameraKeyframes: JSON.parse(JSON.stringify(s.cameraKeyframes)), duration: s.duration });
        s.layers = s.layers.filter((l: any) => !l.selected && l.id !== s.selectedLayerId);
        s.selectedLayerId = null;
      }),

    setSelectedLayersDuration: (newLen: number) =>
      set((s: any) => {
        if (!s._past) s._past = [];
        s._past.push({ layers: JSON.parse(JSON.stringify(s.layers)), cameraKeyframes: JSON.parse(JSON.stringify(s.cameraKeyframes)), duration: s.duration });
        const clampedLen = Math.max(0.2, newLen);
        s.layers.forEach((l: any) => {
          if (l.selected || l.id === s.selectedLayerId) {
            l.endTime = Math.min(s.duration, l.startTime + clampedLen);
          }
        });
      }),

    adjustSelectedLayersDuration: (delta: number) =>
      set((s: any) => {
        if (!s._past) s._past = [];
        s._past.push({ layers: JSON.parse(JSON.stringify(s.layers)), cameraKeyframes: JSON.parse(JSON.stringify(s.cameraKeyframes)), duration: s.duration });
        s.layers.forEach((l: any) => {
          if (l.selected || l.id === s.selectedLayerId) {
            const currentLen = l.endTime - l.startTime;
            const newLen = Math.max(0.2, currentLen + delta);
            l.endTime = Math.min(s.duration, l.startTime + newLen);
          }
        });
      }),

    sequenceSelectedLayers: () =>
      set((s: any) => {
        if (!s._past) s._past = [];
        s._past.push({ layers: JSON.parse(JSON.stringify(s.layers)), cameraKeyframes: JSON.parse(JSON.stringify(s.cameraKeyframes)), duration: s.duration });
        const selected = s.layers.filter((l: any) => l.selected || l.id === s.selectedLayerId);
        if (selected.length > 1) {
          // Sort by their current startTime
          selected.sort((a: any, b: any) => a.startTime - b.startTime);
          let cursor = selected[0].startTime;
          selected.forEach((l: any) => {
            const len = Math.max(0.2, l.endTime - l.startTime);
            l.startTime = cursor;
            l.endTime = Math.min(s.duration, cursor + len);
            cursor = l.endTime;
          });
        }
      }),

    moveSelectedLayers: (delta: number) =>
      set((s) => {
        s.layers.forEach((l) => {
          if (l.selected || l.id === s.selectedLayerId) {
            const len = l.endTime - l.startTime;
            let ns = Math.max(0, l.startTime + delta);
            let ne = ns + len;
            if (ne > s.duration) { ne = s.duration; ns = Math.max(0, ne - len); }
            l.startTime = ns;
            l.endTime = ne;
          }
        });
      }),

    reorderLayers: (fromIndex, toIndex) =>
      set((s) => {
        const [moved] = s.layers.splice(fromIndex, 1);
        s.layers.splice(toIndex, 0, moved);
      }),

    updateAreaData: (id, updates) =>
      set((s) => {
        const layer = s.layers.find((l) => l.id === id);
        if (layer?.areaData) Object.assign(layer.areaData, updates);
      }),

    updateAreaGeojson: (id, geojson) =>
      set((s) => {
        const layer = s.layers.find((l) => l.id === id);
        if (layer?.areaData) {
          layer.areaData.geojson = geojson;
        }
      }),

    setPlayhead: (time) =>
      set((s) => { s.playhead = Math.max(0, Math.min(time, s.duration)); }),

    setIsPlaying: (v) => set((s) => { s.isPlaying = v; }),
    setTimelineZoom: (v) => set((s) => { s.timelineZoom = Math.max(30, Math.min(200, v)); }),

    loadTemplate: (templateId: string) =>
      set((s) => {
        if (templateId === 'bds') {
          s.name = 'Dự Án Vinhomes Grand Park';
          s.duration = 6.0;
          s.cameraKeyframes = [
            {
              id: 'kf-bds-1',
              time: 0,
              center: [106.842, 10.849],
              zoom: 12.5,
              bearing: 0,
              pitch: 20,
              mapStyle: 'satellite',
              dimming: 10,
              easing: 'cinematic',
              delay: 0,
            },
            {
              id: 'kf-bds-2',
              time: 4.5,
              center: [106.842, 10.849],
              zoom: 16.2,
              bearing: 45,
              pitch: 60,
              mapStyle: 'satellite',
              dimming: 25,
              easing: 'cinematic',
              delay: 0.5,
            },
          ];
          s.layers = [
            {
              id: 'layer-callout-bds',
              type: 'callout',
              name: 'Callout Vinhomes',
              color: '#f59e0b',
              startTime: 0.8,
              endTime: 5.8,
              visible: true,
              locked: false,
              selected: false,
              calloutData: {
                title: 'Đại Đô Thị Vinhomes Grand Park',
                subtitle: 'Thành phố Thủ Đức · 271 ha',
                theme: 'real_estate',
                lngLat: [106.842, 10.849],
                price: 'Từ 2.5 Tỷ/căn',
                area: 'Quy mô 271 ha',
              },
            },
            {
              id: 'layer-text-bds',
              type: 'text',
              name: 'Quy Hoạch Hạ Tầng',
              color: '#3b82f6',
              startTime: 0.2,
              endTime: 5.5,
              visible: true,
              locked: false,
              selected: false,
              textData: {
                content: 'HẠ TẦNG KẾT NỐI VÀNH ĐAI 3',
                fontSize: 26,
                color: '#ffffff',
                pinToMap: false,
                effect: 'neon',
                glow: true,
              },
            },
          ];
        } else if (templateId === 'history') {
          s.name = 'Chiến Dịch Lịch Sử';
          s.duration = 7.0;
          s.mapStyle = 'vintage';
          s.cameraKeyframes = [
            {
              id: 'kf-his-1',
              time: 0,
              center: [103.02, 21.38], // Dien Bien Phu
              zoom: 8.5,
              bearing: 0,
              pitch: 15,
              mapStyle: 'vintage',
              dimming: 15,
              easing: 'cinematic',
              delay: 0,
            },
            {
              id: 'kf-his-2',
              time: 5.0,
              center: [103.02, 21.38],
              zoom: 12.0,
              bearing: 25,
              pitch: 45,
              mapStyle: 'vintage',
              dimming: 30,
              easing: 'cinematic',
              delay: 0.5,
            },
          ];
          s.layers = [
            {
              id: 'layer-his-title',
              type: 'text',
              name: 'Tiêu đề chiến dịch',
              color: '#ef4444',
              startTime: 0.5,
              endTime: 6.5,
              visible: true,
              locked: false,
              selected: false,
              textData: {
                content: 'CHIẾN DỊCH ĐIỆN BIÊN PHỦ 1954',
                fontSize: 28,
                color: '#f59e0b',
                pinToMap: false,
                effect: 'cinematic-glow',
                glow: true,
              },
            },
          ];
        } else if (templateId === 'travel') {
          s.name = 'Hành Trình Du Lịch Xuyên Việt';
          s.duration = 8.0;
          s.mapStyle = 'satellite';
          s.cameraKeyframes = [
            {
              id: 'kf-trv-1',
              time: 0,
              center: [105.84, 21.02], // Hanoi
              zoom: 11.0,
              bearing: 0,
              pitch: 20,
              mapStyle: 'satellite',
              dimming: 10,
              easing: 'cinematic',
              delay: 0,
            },
            {
              id: 'kf-trv-2',
              time: 4.0,
              center: [108.22, 16.06], // Danang
              zoom: 12.0,
              bearing: 30,
              pitch: 40,
              mapStyle: 'satellite',
              dimming: 15,
              easing: 'cinematic',
              delay: 0.2,
            },
            {
              id: 'kf-trv-3',
              time: 7.5,
              center: [106.68, 10.77], // HCMC
              zoom: 13.5,
              bearing: 45,
              pitch: 55,
              mapStyle: 'satellite',
              dimming: 20,
              easing: 'cinematic',
              delay: 0.2,
            },
          ];
          s.layers = [
            {
              id: 'layer-trv-route',
              type: 'route',
              name: 'Tuyến Xuyên Việt',
              color: '#06b6d4',
              startTime: 0.5,
              endTime: 7.5,
              visible: true,
              locked: false,
              selected: false,
              lineData: {
                geojson: {
                  type: 'Feature',
                  properties: {},
                  geometry: {
                    type: 'LineString',
                    coordinates: [
                      [105.84, 21.02],
                      [105.95, 20.25],
                      [105.68, 18.67],
                      [106.60, 17.47],
                      [107.59, 16.46],
                      [108.22, 16.06],
                      [109.19, 12.24],
                      [106.68, 10.77],
                    ],
                  },
                },
                color: '#06b6d4',
                width: 4,
                glow: true,
                animated: true,
                animationProgress: 0,
                distanceKm: 1720,
                vehicle: 'car',
                fromName: 'Hà Nội',
                toName: 'TP. Hồ Chí Minh',
              },
            },
            {
              id: 'layer-trv-plane',
              type: 'object',
              name: 'Chuyến bay kết nối',
              color: '#3b82f6',
              startTime: 1.0,
              endTime: 7.0,
              visible: true,
              locked: false,
              selected: false,
              objectData: {
                objectType: 'airplane',
                lngLat: [108.22, 16.06],
                speed: 1.5,
              },
            },
          ];
        }
      }),

    exportProjectJSON: () => {
      const state = get();
      const exportData = {
        version: '1.0',
        name: state.name,
        aspectRatio: state.aspectRatio,
        duration: state.duration,
        fps: state.fps,
        mapStyle: state.mapStyle,
        cameraKeyframes: state.cameraKeyframes,
        layers: state.layers,
        mapDimming: state.mapDimming,
      };
      return JSON.stringify(exportData, null, 2);
    },

    importProjectJSON: (jsonStr: string) => {
      try {
        const data = JSON.parse(jsonStr);
        set((s) => {
          if (data.name) s.name = data.name;
          if (data.aspectRatio) s.aspectRatio = data.aspectRatio;
          if (data.duration) s.duration = data.duration;
          if (data.mapStyle) s.mapStyle = data.mapStyle;
          if (Array.isArray(data.cameraKeyframes)) s.cameraKeyframes = data.cameraKeyframes;
          if (Array.isArray(data.layers)) s.layers = data.layers;
          if (typeof data.mapDimming === 'number') s.mapDimming = data.mapDimming;
        });
        return true;
      } catch (e) {
        console.error('Import error', e);
        return false;
      }
    },

    copySelectedLayers: () => {
      const state = get();
      const selected = state.layers.filter(l => l.selected || l.id === state.selectedLayerId);
      if (selected.length > 0) {
        (state as any)._clipboard = JSON.parse(JSON.stringify(selected));
      }
    },

    pasteCopiedLayers: () => {
      const state = get();
      const clipboard: TimelineLayer[] = (state as any)._clipboard || [];
      if (clipboard.length > 0) {
        set((s: any) => {
          if (!s._past) s._past = [];
          s._past.push({
            layers: JSON.parse(JSON.stringify(s.layers)),
            cameraKeyframes: JSON.parse(JSON.stringify(s.cameraKeyframes)),
            duration: s.duration,
          });

          // Unselect current layers
          s.layers.forEach((l: any) => { l.selected = false; });

          const newPasted: TimelineLayer[] = [];
          const minStart = Math.min(...clipboard.map(c => c.startTime));
          const timeOffset = s.playhead - minStart;

          clipboard.forEach((c) => {
            const newLayerId = `layer-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
            const dur = c.endTime - c.startTime;
            let newStart = c.startTime + timeOffset;
            if (newStart < 0) newStart = 0;
            let newEnd = newStart + dur;
            if (newEnd > s.duration) {
              newEnd = s.duration;
              newStart = Math.max(0, newEnd - dur);
            }

            const cloned: TimelineLayer = {
              ...JSON.parse(JSON.stringify(c)),
              id: newLayerId,
              name: `${c.name} (Copy)`,
              startTime: Number(newStart.toFixed(2)),
              endTime: Number(newEnd.toFixed(2)),
              selected: true,
            };
            newPasted.push(cloned);
          });

          s.layers.unshift(...newPasted);
          s.selectedLayerId = newPasted[0]?.id || null;
        });
      }
    },

    updateLayerLngLat: (id, lngLat) =>
      set((s) => {
        const layer = s.layers.find((l) => l.id === id);
        if (layer) {
          if (layer.calloutData) layer.calloutData.lngLat = lngLat;
          if (layer.widgetData) layer.widgetData.lngLat = lngLat;
          if (layer.objectData) layer.objectData.lngLat = lngLat;
          if (layer.textData) {
            layer.textData.lngLat = lngLat;
            layer.textData.pinToMap = true;
          }
          if (layer.counterData) {
            layer.counterData.lngLat = lngLat;
            layer.counterData.pinToMap = true;
          }
        }
      }),

    updateArrowCoords: (id, from, to) =>
      set((s) => {
        const layer = s.layers.find((l) => l.id === id);
        if (layer && layer.arrowData) {
          layer.arrowData.from = from;
          layer.arrowData.to = to;
        }
      }),

    // History snapshots
    undo: () => {
      const state = get();
      if ((state as any)._past && (state as any)._past.length > 0) {
        const prev = (state as any)._past.pop();
        const currentSnapshot = {
          layers: JSON.parse(JSON.stringify(state.layers)),
          cameraKeyframes: JSON.parse(JSON.stringify(state.cameraKeyframes)),
          duration: state.duration,
        };
        set((s: any) => {
          if (!s._future) s._future = [];
          s._future.push(currentSnapshot);
          s.layers = prev.layers;
          s.cameraKeyframes = prev.cameraKeyframes;
          s.duration = prev.duration;
        });
      }
    },

    redo: () => {
      const state = get();
      if ((state as any)._future && (state as any)._future.length > 0) {
        const next = (state as any)._future.pop();
        const currentSnapshot = {
          layers: JSON.parse(JSON.stringify(state.layers)),
          cameraKeyframes: JSON.parse(JSON.stringify(state.cameraKeyframes)),
          duration: state.duration,
        };
        set((s: any) => {
          if (!s._past) s._past = [];
          s._past.push(currentSnapshot);
          s.layers = next.layers;
          s.cameraKeyframes = next.cameraKeyframes;
          s.duration = next.duration;
        });
      }
    },
  }))
);

