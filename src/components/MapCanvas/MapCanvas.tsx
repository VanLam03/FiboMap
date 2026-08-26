import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import {
  Plus, Minus, Compass, Info, Layers, Search,
  MessageSquare, Globe, Moon, Scroll, Route, Mountain, Sun, Satellite,
  MapPin, Building, Share2, Phone, Plane, Car, User, Ship, Radio,
  X, Navigation2, Bike
} from 'lucide-react';
import { useProjectStore } from '../../store/useProjectStore';
import type { MapStyle, AspectRatio } from '../../types/project.types';
import { useKeyframeCamera } from '../../hooks/useKeyframeCamera';
import { useAreaDrawing } from '../../hooks/useAreaDrawing';
import { DrawingCanvasOverlay } from './DrawingCanvasOverlay';
import { AreaBoundingBoxOverlay } from './AreaBoundingBoxOverlay';
import { identifyBoundaryFromClick, removeVietnameseTones, VIETNAM_34_MERGED_PROVINCES } from '../../services/boundaryService';

// Map style configurations
const MAP_STYLES: Record<MapStyle, { label: string; icon: React.ReactNode }> = {
  'google-satellite': { label: 'Google Vệ tinh', icon: <Satellite size={12} /> },
  'satellite': { label: 'Vệ tinh Esri', icon: <Globe size={12} /> },
  'google-streets': { label: 'Google Maps', icon: <Route size={12} /> },
  'dark': { label: 'Tối', icon: <Moon size={12} /> },
  'streets': { label: 'Đường phố OSM', icon: <Route size={12} /> },
  'light': { label: 'Sáng', icon: <Sun size={12} /> },
  'terrain': { label: 'Địa hình', icon: <Mountain size={12} /> },
  'vintage': { label: 'Cổ điển', icon: <Scroll size={12} /> },
};

const makeRasterStyle = (id: string, tiles: string[], attribution = '© Map Provider') => ({
  version: 8 as const,
  sources: {
    [id]: {
      type: 'raster' as const,
      tiles,
      tileSize: 256,
      attribution,
      maxzoom: 20,
    },
  },
  layers: [
    {
      id: `${id}-layer`,
      type: 'raster' as const,
      source: id,
      paint: { 'raster-opacity': 1 },
    },
  ],
});

const GOOGLE_SATELLITE_STYLE = makeRasterStyle(
  'google-satellite',
  [
    'https://mt0.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
    'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
    'https://mt2.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
    'https://mt3.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
  ],
  '© Google Maps'
);

const GOOGLE_STREETS_STYLE = makeRasterStyle(
  'google-streets',
  [
    'https://mt0.google.com/vt/lyrs=m&x={x}&y={y}&z={z}',
    'https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}',
    'https://mt2.google.com/vt/lyrs=m&x={x}&y={y}&z={z}',
    'https://mt3.google.com/vt/lyrs=m&x={x}&y={y}&z={z}',
  ],
  '© Google Maps'
);

const SATELLITE_STYLE = makeRasterStyle(
  'esri-satellite',
  ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'],
  '© Esri, Maxar, Earthstar Geographics'
);

const DARK_STYLE = makeRasterStyle(
  'carto-dark',
  [
    'https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
    'https://b.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
    'https://c.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
  ],
  '© CARTO, © OpenStreetMap'
);

const LIGHT_STYLE = makeRasterStyle(
  'carto-light',
  [
    'https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
    'https://b.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
  ],
  '© CARTO, © OpenStreetMap'
);

const STREETS_STYLE = makeRasterStyle(
  'osm-streets',
  [
    'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png',
    'https://b.tile.openstreetmap.org/{z}/{x}/{y}.png',
    'https://c.tile.openstreetmap.org/{z}/{x}/{y}.png',
  ],
  '© OpenStreetMap contributors'
);

const TERRAIN_STYLE = makeRasterStyle(
  'opentopo',
  [
    'https://a.tile.opentopomap.org/{z}/{x}/{y}.png',
    'https://b.tile.opentopomap.org/{z}/{x}/{y}.png',
    'https://c.tile.opentopomap.org/{z}/{x}/{y}.png',
  ],
  '© OpenTopoMap, © OpenStreetMap'
);

const VINTAGE_STYLE = makeRasterStyle(
  'vintage',
  [
    'https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png',
  ],
  '© CARTO'
);

function getStyleForKey(key: MapStyle): maplibregl.StyleSpecification {
  switch (key) {
    case 'google-satellite': return GOOGLE_SATELLITE_STYLE as any;
    case 'google-streets': return GOOGLE_STREETS_STYLE as any;
    case 'satellite': return SATELLITE_STYLE as any;
    case 'dark': return DARK_STYLE as any;
    case 'light': return LIGHT_STYLE as any;
    case 'streets': return STREETS_STYLE as any;
    case 'terrain': return TERRAIN_STYLE as any;
    case 'vintage': return VINTAGE_STYLE as any;
    default: return GOOGLE_SATELLITE_STYLE as any;
  }
}

function getFrameDimensions(ratio: AspectRatio): { w: number; h: number; label: string } {
  switch (ratio) {
    case '16:9': return { w: 1920, h: 1080, label: '1920 × 1080 · 16:9' };
    case '9:16': return { w: 1080, h: 1920, label: '1080 × 1920 · 9:16' };
    case '1:1':  return { w: 1080, h: 1080, label: '1080 × 1080 · 1:1' };
  }
}

// High-precision coordinates database for all major Vietnamese cities, tourist destinations and provincial centers
const ACCURATE_VN_LOCATIONS: { name: string; aliases: string[]; coords: [number, number]; zoom: number; label: string }[] = [
  { name: 'Đà Lạt', aliases: ['da lat', 'thanh pho da lat', 'tp da lat', 'dalat'], coords: [108.4583, 11.9404], zoom: 11.2, label: 'Thành phố Đà Lạt, Lâm Đồng' },
  { name: 'Nha Trang', aliases: ['nha trang', 'tp nha trang', 'thanh pho nha trang'], coords: [109.1967, 12.2388], zoom: 11.5, label: 'Thành phố Nha Trang, Khánh Hòa' },
  { name: 'Phan Thiết', aliases: ['phan thiet', 'tp phan thiet', 'mui ne'], coords: [108.1022, 10.9289], zoom: 11.5, label: 'Thành phố Phan Thiết, Bình Thuận' },
  { name: 'Quy Nhơn', aliases: ['quy nhon', 'tp quy nhon', 'binh dinh'], coords: [109.2197, 13.7820], zoom: 11.5, label: 'Thành phố Quy Nhơn, Bình Định' },
  { name: 'Pleiku', aliases: ['pleiku', 'tp pleiku', 'gia lai'], coords: [108.0021, 13.9833], zoom: 11.5, label: 'Thành phố Pleiku, Gia Lai' },
  { name: 'Buôn Ma Thuột', aliases: ['buon ma thuot', 'bmt', 'dak lak', 'daklak'], coords: [108.0383, 12.6667], zoom: 11.5, label: 'Thành phố Buôn Ma Thuột, Đắk Lắk' },
  { name: 'Vũng Tàu', aliases: ['vung tau', 'tp vung tau', 'ba ria vung tau'], coords: [107.0843, 10.3460], zoom: 11.5, label: 'Thành phố Vũng Tàu, Bà Rịa - Vũng Tàu' },
  { name: 'Cần Thơ', aliases: ['can tho', 'tp can tho', 'ninh kieu'], coords: [105.7838, 10.0452], zoom: 11.2, label: 'Thành phố Cần Thơ' },
  { name: 'Phú Quốc', aliases: ['phu quoc', 'tp phu quoc', 'dao phu quoc', 'kien giang'], coords: [103.9575, 10.2289], zoom: 10.5, label: 'Thành phố đảo Phú Quốc, Kiên Giang' },
  { name: 'Cà Mau', aliases: ['ca mau', 'tp ca mau', 'tinh ca mau', 'dat mui'], coords: [105.1500, 9.1769], zoom: 11.0, label: 'Thành phố Cà Mau' },
  { name: 'Hà Nội', aliases: ['ha noi', 'thu do ha noi', 'hoan kiem', 'hn'], coords: [105.8412, 21.0245], zoom: 11.2, label: 'Thủ đô Hà Nội' },
  { name: 'TP. Hồ Chí Minh', aliases: ['tp ho chi minh', 'ho chi minh', 'sai gon', 'tphcm', 'hcm'], coords: [106.6968, 10.7769], zoom: 11.2, label: 'Thành phố Hồ Chí Minh (Sài Gòn)' },
  { name: 'Đà Nẵng', aliases: ['da nang', 'tp da nang', 'hai chau'], coords: [108.2243, 16.0610], zoom: 11.5, label: 'Thành phố Đà Nẵng' },
  { name: 'Hải Phòng', aliases: ['hai phong', 'tp hai phong', 'dat cang'], coords: [106.6881, 20.8449], zoom: 11.2, label: 'Thành phố Hải Phòng' },
  { name: 'Huế', aliases: ['hue', 'tp hue', 'thua thien hue', 'co do hue'], coords: [107.5909, 16.4637], zoom: 11.5, label: 'Thành phố Huế, Thừa Thiên Huế' },
  { name: 'Hạ Long', aliases: ['ha long', 'tp ha long', 'quang ninh', 'vinh ha long'], coords: [107.0843, 20.9505], zoom: 11.2, label: 'Thành phố Hạ Long, Quảng Ninh' },
  { name: 'Sa Pa', aliases: ['sa pa', 'sapa', 'lao cai', 'fansipan'], coords: [103.8438, 22.3364], zoom: 11.8, label: 'Thị xã Sa Pa, Lào Cai' },
  { name: 'Hội An', aliases: ['hoi an', 'tp hoi an', 'pho co hoi an', 'quang nam'], coords: [108.3380, 15.8801], zoom: 12.2, label: 'Thành phố Hội An, Quảng Nam' },
  { name: 'Bảo Lộc', aliases: ['bao loc', 'tp bao loc'], coords: [107.8105, 11.5476], zoom: 11.8, label: 'Thành phố Bảo Lộc, Lâm Đồng' },
  { name: 'Thanh Hóa', aliases: ['thanh hoa', 'tp thanh hoa', 'sam son'], coords: [105.7667, 19.8000], zoom: 11.2, label: 'Thành phố Thanh Hóa' },
  { name: 'Vinh', aliases: ['vinh', 'tp vinh', 'nghe an'], coords: [105.6833, 18.6667], zoom: 11.2, label: 'Thành phố Vinh, Nghệ An' },
  { name: 'Ninh Bình', aliases: ['ninh binh', 'tp ninh binh', 'trang an'], coords: [105.9750, 20.2500], zoom: 11.2, label: 'Thành phố Ninh Bình' },
  { name: 'Phan Rang', aliases: ['phan rang', 'thap cham', 'ninh thuan'], coords: [108.9883, 11.5683], zoom: 11.5, label: 'Thành phố Phan Rang - Tháp Chàm, Ninh Thuận' },
  { name: 'Tuy Hòa', aliases: ['tuy hoa', 'tp tuy hoa', 'phu yen'], coords: [109.3000, 13.0833], zoom: 11.5, label: 'Thành phố Tuy Hòa, Phú Yên' },
  { name: 'Đồng Hới', aliases: ['dong hoi', 'tp dong hoi', 'quang binh'], coords: [106.6200, 17.4700], zoom: 11.5, label: 'Thành phố Đồng Hới, Quảng Bình' },
  { name: 'Đông Hà', aliases: ['dong ha', 'tp dong ha', 'quang tri'], coords: [107.0833, 16.8167], zoom: 11.5, label: 'Thành phố Đông Hà, Quảng Trị' },
  { name: 'Quảng Ngãi', aliases: ['quang ngai', 'tp quang ngai'], coords: [108.8000, 15.1167], zoom: 11.5, label: 'Thành phố Quảng Ngãi' },
  { name: 'Rạch Giá', aliases: ['rach gia', 'tp rach gia'], coords: [105.0760, 10.0120], zoom: 11.5, label: 'Thành phố Rạch Giá, Kiên Giang' },
  { name: 'Biên Hòa', aliases: ['bien hoa', 'tp bien hoa', 'dong nai'], coords: [106.8333, 10.9500], zoom: 11.2, label: 'Thành phố Biên Hòa, Đồng Nai' },
  { name: 'Thủ Dầu Một', aliases: ['thu dau mot', 'tp thu dau mot', 'binh duong'], coords: [106.6500, 10.9833], zoom: 11.5, label: 'Thành phố Thủ Dầu Một, Bình Dương' },
  { name: 'Mỹ Tho', aliases: ['my tho', 'tp my tho', 'tien giang'], coords: [106.3639, 10.3538], zoom: 11.5, label: 'Thành phố Mỹ Tho, Tiền Giang' },
  { name: 'Bến Tre', aliases: ['ben tre', 'tp ben tre'], coords: [106.3750, 10.2417], zoom: 11.5, label: 'Thành phố Bến Tre' },
  { name: 'Long Xuyên', aliases: ['long xuyen', 'tp long xuyen', 'an giang'], coords: [105.4358, 10.3833], zoom: 11.5, label: 'Thành phố Long Xuyên, An Giang' },
  { name: 'Tây Ninh', aliases: ['tay ninh', 'tp tay ninh', 'nui ba den'], coords: [106.1000, 11.3000], zoom: 11.2, label: 'Thành phố Tây Ninh' },
  { name: 'Sơn La', aliases: ['son la', 'tp son la', 'moc chau'], coords: [103.9000, 21.3167], zoom: 11.0, label: 'Thành phố Sơn La' },
  { name: 'Điện Biên', aliases: ['dien bien', 'tp dien bien phu', 'muong thanh'], coords: [103.0167, 21.3833], zoom: 11.5, label: 'Thành phố Điện Biên Phủ' },
];

// High-precision place search (Prioritizes exact location geocoding identical to Google Maps)
async function searchPlace(query: string): Promise<{ display_name: string; lat: string; lon: string; zoom?: number }[]> {
  const norm = removeVietnameseTones(query.trim());
  if (!norm) return [];

  const results: { display_name: string; lat: string; lon: string; zoom?: number }[] = [];

  // 1. Exact local centroid matches for famous Vietnamese cities
  for (const loc of ACCURATE_VN_LOCATIONS) {
    if (
      removeVietnameseTones(loc.name) === norm ||
      loc.aliases.some(a => removeVietnameseTones(a) === norm || removeVietnameseTones(a).includes(norm))
    ) {
      results.push({
        display_name: loc.label,
        lat: String(loc.coords[1]),
        lon: String(loc.coords[0]),
        zoom: loc.zoom,
      });
    }
  }

  // 2. Query OpenStreetMap Nominatim Live Geocoding API (Exact street, ward, city, landmark worldwide)
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=6&addressdetails=1&accept-language=vi,en`,
      { headers: { 'Accept-Language': 'vi,en', 'User-Agent': 'FiboMap-Cinematic-App/2.0' } }
    );
    if (res.ok) {
      const osmResults = await res.json();
      for (const item of osmResults) {
        if (!results.some(r => Math.abs(parseFloat(r.lat) - parseFloat(item.lat)) < 0.03 && Math.abs(parseFloat(r.lon) - parseFloat(item.lon)) < 0.03)) {
          let zoom = 11.0;
          if (item.boundingbox && Array.isArray(item.boundingbox)) {
            const minLat = parseFloat(item.boundingbox[0]);
            const maxLat = parseFloat(item.boundingbox[1]);
            const minLon = parseFloat(item.boundingbox[2]);
            const maxLon = parseFloat(item.boundingbox[3]);
            const span = Math.max(Math.abs(maxLon - minLon), Math.abs(maxLat - minLat));
            zoom = span > 2.0 ? 8.5 : span > 0.8 ? 9.5 : span > 0.3 ? 10.5 : span > 0.08 ? 11.5 : 12.5;
          }
          results.push({
            display_name: item.display_name,
            lat: item.lat,
            lon: item.lon,
            zoom,
          });
        }
      }
    }
  } catch (err) {
    console.warn('Geocoding search API error:', err);
  }

  return results.slice(0, 8);
}

export const MapCanvas: React.FC = () => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [mapReady, setMapReady] = useState(false);
  const [showStylePicker, setShowStylePicker] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{ display_name: string; lat: string; lon: string; zoom?: number }[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [coords, setCoords] = useState<{ lng: number; lat: number } | null>(null);

  const [mapMoveTick, setMapMoveTick] = useState(0);

  const {
    aspectRatio, mapStyle, setMapStyle, currentCamera, setCurrentCamera,
    isKeyframeCameraMode, mapDimming, playhead, layers, activeView, mediaBackground,
    cameraKeyframes, deleteCameraKeyframe, activeTool, duration, addLayer, selectLayer,
    selectedLayerId, isPlaying
  } = useProjectStore();

  const { addKeyframeAtPlayhead, applyCameraAtTime } = useKeyframeCamera(mapRef);
  useAreaDrawing(mapRef, mapReady);

  const frameDims = getFrameDimensions(aspectRatio);
  const [frameSize, setFrameSize] = useState({ w: 800, h: 450 });

  // Place search handler
  const handleSearch = useCallback(async (q: string) => {
    setSearchQuery(q);
    if (!q.trim() || q.length < 1) { setSearchResults([]); return; }
    setSearchLoading(true);
    const results = await searchPlace(q);
    setSearchResults(results);
    setSearchLoading(false);
  }, []);

  // Cinematic Zoom-out -> Zoom-in Camera Swoop (shows whole region, doesn't zoom in too close)
  const flyToLocationWithCinematicZoom = useCallback((lng: number, lat: number, targetZoom = 9.8) => {
    const map = mapRef.current;
    if (!map) return;

    const currentCenter = map.getCenter();
    const currentZoom = map.getZoom();
    const distDeg = Math.hypot(lng - currentCenter.lng, lat - currentCenter.lat);

    const safeTargetZoom = Math.min(11.0, Math.max(8.5, targetZoom));

    // If distance is far, execute 2-stage cinematic swooping (Zoom out overview -> Swoop in target region)
    if (distDeg > 0.4) {
      const midLng = (currentCenter.lng + lng) / 2;
      const midLat = (currentCenter.lat + lat) / 2;
      const overviewZoom = Math.max(4.5, Math.min(currentZoom - 2.8, 6.5));

      // Phase 1: Camera pulls out into high altitude overview
      map.flyTo({
        center: [midLng, midLat],
        zoom: overviewZoom,
        pitch: 15,
        bearing: 0,
        duration: 900,
        curve: 1.8,
        essential: true,
      });

      // Phase 2: Camera swoops down to show whole area nicely in frame
      setTimeout(() => {
        if (!mapRef.current) return;
        mapRef.current.flyTo({
          center: [lng, lat],
          zoom: safeTargetZoom,
          pitch: 20,
          bearing: 0,
          duration: 1400,
          curve: 1.42,
          essential: true,
        });
      }, 850);
    } else {
      // Nearby distance: direct cinematic flight
      map.flyTo({
        center: [lng, lat],
        zoom: safeTargetZoom,
        pitch: 20,
        bearing: 0,
        duration: 1500,
        speed: 0.9,
        curve: 1.6,
        essential: true,
      });
    }

    // Keep camera coordinates updated without adding anything to timeline
    setCurrentCamera({
      center: [lng, lat],
      zoom: safeTargetZoom,
      pitch: 20,
      bearing: 0,
    });

    setShowSearch(false);
    setSearchResults([]);
    setSearchQuery('');
  }, [setCurrentCamera]);

  // Calculate video preview frame box
  useEffect(() => {
    if (!containerRef.current) return;
    const calculateSize = () => {
      if (!containerRef.current) return;
      const cw = containerRef.current.clientWidth - 48;
      const ch = containerRef.current.clientHeight - 80;
      const ratio = frameDims.w / frameDims.h;
      let fw = cw;
      let fh = cw / ratio;
      if (fh > ch) {
        fh = ch;
        fw = ch * ratio;
      }
      setFrameSize({ w: Math.max(200, Math.floor(fw)), h: Math.max(200, Math.floor(fh)) });
    };

    calculateSize();
    const ro = new ResizeObserver(calculateSize);
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, [aspectRatio, frameDims.w, frameDims.h]);

  // Trigger map resize when frame changes
  useEffect(() => {
    if (mapRef.current) {
      mapRef.current.resize();
    }
  }, [frameSize.w, frameSize.h]);

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
    }

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: getStyleForKey(mapStyle),
      center: currentCamera.center || [106.6602, 10.7769], // HCMC default
      zoom: currentCamera.zoom || 11,
      bearing: currentCamera.bearing || 0,
      pitch: currentCamera.pitch || 0,
      attributionControl: false,
      renderWorldCopies: false,
    });

    map.on('load', () => {
      setMapReady(true);
      map.resize();
    });

    map.on('moveend', () => {
      const c = map.getCenter();
      setCurrentCamera({
        center: [c.lng, c.lat],
        zoom: map.getZoom(),
        bearing: map.getBearing(),
        pitch: map.getPitch(),
      });
    });

    map.on('mousemove', (e) => {
      setCoords({ lng: e.lngLat.lng, lat: e.lngLat.lat });
    });

    map.getCanvas().addEventListener('mouseleave', () => {
      setCoords(null);
    });

    mapRef.current = map;
    (window as any).__fibomap_map = map;

    return () => {
      map.remove();
      mapRef.current = null;
      (window as any).__fibomap_map = null;
      setMapReady(false);
    };
  }, []);

  // Map style updates
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;
    try {
      map.setStyle(getStyleForKey(mapStyle));
    } catch (e) {
      console.error('Failed to change map style', e);
    }
  }, [mapStyle, mapReady]);

  // Apply camera keyframe interpolation during playhead updates or playback
  useEffect(() => {
    if (mapRef.current && mapReady) {
      applyCameraAtTime(playhead);
    }
  }, [playhead, mapReady, applyCameraAtTime]);

  // Click directly on map to auto-identify administrative boundary
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady || activeTool !== 'area-auto') return;

    map.getCanvas().style.cursor = 'crosshair';

    const onMapClick = async (e: maplibregl.MapMouseEvent) => {
      const { lng, lat } = e.lngLat;
      const detected = await identifyBoundaryFromClick(lng, lat);
      if (detected && detected.length > 0) {
        const item = detected[0];
        const layerId = `area-auto-${Date.now()}`;
        const newLayer = {
          id: layerId,
          type: 'area' as const,
          name: item.name,
          color: '#f59e0b',
          startTime: playhead,
          endTime: Math.min(playhead + 6.0, duration),
          visible: true,
          locked: false,
          selected: true,
          areaData: {
            geojson: item.geojson || {
              type: 'Feature' as const,
              properties: { name: item.name },
              geometry: {
                type: 'Polygon' as const,
                coordinates: [
                  [
                    [item.bbox[0], item.bbox[1]],
                    [item.bbox[2], item.bbox[1]],
                    [item.bbox[2], item.bbox[3]],
                    [item.bbox[0], item.bbox[3]],
                    [item.bbox[0], item.bbox[1]],
                  ],
                ],
              },
            },
            borderWidth: 3.5,
            borderStyle: 'solid' as const,
            borderColor: '#f59e0b',
            fillColor: '#f59e0b',
            fillOpacity: 0.35,
            appearEffect: 'draw' as const,
            appearDuration: 1.2,
            exitEffect: 'fade-out' as const,
            exitDuration: 0.8,
            is3D: false,
            extrudeHeight: 500,
          },
        };

        addLayer(newLayer);
        selectLayer(layerId);
      }
    };

    map.on('click', onMapClick);
    return () => {
      map.off('click', onMapClick);
      map.getCanvas().style.cursor = '';
    };
  }, [activeTool, mapReady, playhead, duration, addLayer, selectLayer]);

// Slices a polygon perimeter ring from start point up to progress (0.0 to 1.0)
function slicePerimeterLine(coords: [number, number][], progress: number): [number, number][] {
  if (!coords || coords.length < 2) return coords || [];
  if (progress <= 0.01) return [coords[0], coords[0]];
  if (progress >= 0.99) return coords;

  const dists: number[] = [];
  let totalDist = 0;
  for (let i = 0; i < coords.length - 1; i++) {
    const d = Math.hypot(coords[i + 1][0] - coords[i][0], coords[i + 1][1] - coords[i][1]);
    dists.push(d);
    totalDist += d;
  }

  if (totalDist === 0) return coords;

  const targetDist = progress * totalDist;
  let accum = 0;
  const result: [number, number][] = [coords[0]];

  for (let i = 0; i < dists.length; i++) {
    const d = dists[i];
    if (accum + d >= targetDist) {
      const frac = d > 0 ? (targetDist - accum) / d : 0;
      const tip: [number, number] = [
        coords[i][0] + frac * (coords[i + 1][0] - coords[i][0]),
        coords[i][1] + frac * (coords[i + 1][1] - coords[i][1]),
      ];
      result.push(tip);
      break;
    }
    accum += d;
    result.push(coords[i + 1]);
  }

  return result.length > 1 ? result : [coords[0], coords[0]];
}

// Calculate bearing (heading angle in degrees 0-360) between 2 GPS coordinates
function calculateBearing(p0: [number, number], p1: [number, number]): number {
  const rad = Math.PI / 180;
  const lat1 = p0[1] * rad;
  const lat2 = p1[1] * rad;
  const dLng = (p1[0] - p0[0]) * rad;
  const y = Math.sin(dLng) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
  const bearing = (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
  return Number(bearing.toFixed(1));
}

// Interpolate vehicle position [lng, lat] and heading angle along route at progress (0.0 to 1.0)
function getVehicleStateAlongPath(coords: [number, number][], progress: number): { position: [number, number]; bearing: number } {
  if (!coords || coords.length === 0) return { position: [0, 0], bearing: 0 };
  if (coords.length === 1 || progress <= 0) {
    const bearing = coords.length > 1 ? calculateBearing(coords[0], coords[1]) : 0;
    return { position: coords[0], bearing };
  }
  if (progress >= 1) {
    const last = coords[coords.length - 1];
    const prev = coords[coords.length - 2] || last;
    const bearing = calculateBearing(prev, last);
    return { position: last, bearing };
  }

  const dists: number[] = [];
  let totalDist = 0;
  for (let i = 0; i < coords.length - 1; i++) {
    const d = Math.hypot(coords[i + 1][0] - coords[i][0], coords[i + 1][1] - coords[i][1]);
    dists.push(d);
    totalDist += d;
  }

  if (totalDist === 0) return { position: coords[0], bearing: 0 };

  const targetDist = progress * totalDist;
  let accum = 0;

  for (let i = 0; i < dists.length; i++) {
    const d = dists[i];
    if (accum + d >= targetDist) {
      const frac = d > 0 ? (targetDist - accum) / d : 0;
      const lng = coords[i][0] + frac * (coords[i + 1][0] - coords[i][0]);
      const lat = coords[i][1] + frac * (coords[i + 1][1] - coords[i][1]);
      const bearing = calculateBearing(coords[i], coords[i + 1]);
      return { position: [lng, lat], bearing };
    }
    accum += d;
  }

  return { position: coords[coords.length - 1], bearing: calculateBearing(coords[coords.length - 2] || coords[0], coords[coords.length - 1]) };
}

  // Sync GeoJSON / Vector layers onto MapLibre instance
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;

    layers.forEach((layer) => {
      const isVisible = layer.visible && playhead >= layer.startTime && playhead <= layer.endTime;

      if ((layer.type === 'area' || layer.type === 'route' || layer.type === 'line') && (layer.areaData?.geojson || layer.lineData?.geojson)) {
        const sourceId = `source-${layer.id}`;
        const borderSourceId = `border-source-${layer.id}`;
        const fillId = `fill-${layer.id}`;
        const lineId = `line-${layer.id}`;
        const extrudeId = `extrude-${layer.id}`;
        const geojson = layer.areaData?.geojson || layer.lineData?.geojson;

        if (!map.getSource(sourceId)) {
          map.addSource(sourceId, { type: 'geojson', data: geojson as any });
        } else {
          (map.getSource(sourceId) as maplibregl.GeoJSONSource).setData(geojson as any);
        }

        if (layer.type === 'area' && layer.areaData) {
          // Calculate Appear -> Hold -> Exit animation lifecycle
          let fillOpacity = 0;
          let borderOpacity = 0;
          let animHeight = layer.areaData.extrudeHeight || 500;
          let perimeterProgress = 1.0;

          if (isVisible) {
            const start = layer.startTime;
            const end = layer.endTime;
            const appearDur = Math.max(0.1, layer.areaData.appearDuration || 1.2);
            const exitDur = Math.max(0.1, layer.areaData.exitDuration || 0.8);
            const targetFill = layer.areaData.fillOpacity ?? 0.35;
            const targetBorder = 1;
            const appearEffect = layer.areaData.appearEffect || 'draw';
            const exitEffect = layer.areaData.exitEffect || 'fade-out';

            // Phase 1: Appear
            if (playhead < start + appearDur) {
              const p = Math.max(0, Math.min(1, (playhead - start) / appearDur));
              if (appearEffect === 'fade-in') {
                fillOpacity = targetFill * p;
                borderOpacity = targetBorder * p;
                perimeterProgress = 1.0;
              } else if (appearEffect === 'draw') {
                // Perimeter loops from 0 to 1 around the shape
                perimeterProgress = p;
                borderOpacity = Math.min(1, p * 4); // border line becomes sharp immediately as it draws
                fillOpacity = targetFill * Math.max(0, (p - 0.7) / 0.3); // fill blooms as line completes the loop
              } else if (appearEffect === 'blink') {
                const blink = Math.sin(p * Math.PI * 6);
                const factor = blink > 0 ? 1 : 0.2;
                fillOpacity = targetFill * factor;
                borderOpacity = factor;
                perimeterProgress = 1.0;
              } else if (appearEffect === 'extrude-3d') {
                animHeight = (layer.areaData.extrudeHeight || 500) * p;
                fillOpacity = targetFill * p;
                borderOpacity = p;
                perimeterProgress = 1.0;
              } else {
                fillOpacity = targetFill;
                borderOpacity = targetBorder;
                perimeterProgress = 1.0;
              }
            }
            // Phase 3: Exit
            else if (playhead > end - exitDur) {
              const ep = Math.max(0, Math.min(1, (playhead - (end - exitDur)) / exitDur));
              const remain = 1 - ep;
              if (exitEffect === 'retract') {
                perimeterProgress = remain;
                fillOpacity = targetFill * remain;
                borderOpacity = Math.min(1, remain * 3);
              } else if (exitEffect === 'fade-out' || exitEffect === 'shrink') {
                fillOpacity = targetFill * remain;
                borderOpacity = targetBorder * remain;
                perimeterProgress = 1.0;
              } else if (exitEffect === 'flash') {
                const flash = ep < 0.25 ? 1.4 : Math.max(0, 1 - (ep - 0.25) / 0.75);
                fillOpacity = targetFill * Math.min(1, flash);
                borderOpacity = Math.min(1, flash);
                perimeterProgress = 1.0;
              } else {
                fillOpacity = targetFill;
                borderOpacity = targetBorder;
                perimeterProgress = 1.0;
              }
            }
            // Phase 2: Hold / Sustain
            else {
              fillOpacity = targetFill;
              borderOpacity = targetBorder;
              animHeight = layer.areaData.extrudeHeight || 500;
              perimeterProgress = 1.0;
            }
          }

          // Build dynamic perimeter line data for drawing around the contour
          // Handle both Polygon AND MultiPolygon (OSM typically returns MultiPolygon)
          const geomType = layer.areaData.geojson?.geometry?.type;

          let allRings: [number, number][][] = [];
          if (geomType === 'Polygon') {
            // All rings of a Polygon (outer + holes)
            const polyCoords = (layer.areaData.geojson!.geometry as any).coordinates as [number, number][][];
            allRings = polyCoords;
          } else if (geomType === 'MultiPolygon') {
            // Flatten all outer rings from all sub-polygons
            const multiCoords = (layer.areaData.geojson!.geometry as any).coordinates as [number, number][][][];
            for (const poly of multiCoords) {
              if (poly[0]) allRings.push(poly[0]); // outer ring of each polygon
            }
          }

          // For the "draw" animation: slice the longest/outer ring
          // For full display: render as MultiLineString so ALL rings show
          let borderGeojson: any;

          if (perimeterProgress < 1.0 && allRings.length > 0) {
            // Animate drawing around the main (largest) outer ring only
            const longestRing = allRings.reduce((best, r) => r.length > best.length ? r : best, allRings[0]);
            const lineCoords = slicePerimeterLine(longestRing, perimeterProgress);
            borderGeojson = {
              type: 'Feature',
              properties: {},
              geometry: {
                type: 'LineString',
                coordinates: lineCoords.length >= 2 ? lineCoords : [[0, 0], [0, 0]],
              },
            };
          } else if (allRings.length > 0) {
            // Full display: use MultiLineString so every sub-polygon ring is drawn
            borderGeojson = {
              type: 'Feature',
              properties: {},
              geometry: {
                type: 'MultiLineString',
                coordinates: allRings.length >= 1 ? allRings : [[[0, 0], [0, 0]]],
              },
            };
          } else {
            borderGeojson = {
              type: 'Feature',
              properties: {},
              geometry: { type: 'LineString', coordinates: [[0, 0], [0, 0]] },
            };
          }

          if (!map.getSource(borderSourceId)) {
            map.addSource(borderSourceId, { type: 'geojson', data: borderGeojson as any });
          } else {
            (map.getSource(borderSourceId) as maplibregl.GeoJSONSource).setData(borderGeojson as any);
          }

          if (layer.areaData.is3D) {
            // 3D Extrusion
            if (!map.getLayer(extrudeId)) {
              map.addLayer({
                id: extrudeId,
                type: 'fill-extrusion',
                source: sourceId,
                paint: {
                  'fill-extrusion-color': layer.areaData.borderColor || '#f59e0b',
                  'fill-extrusion-height': animHeight,
                  'fill-extrusion-opacity': fillOpacity,
                },
              });
            } else {
              map.setPaintProperty(extrudeId, 'fill-extrusion-color', layer.areaData.borderColor || '#f59e0b');
              map.setPaintProperty(extrudeId, 'fill-extrusion-opacity', fillOpacity);
              map.setPaintProperty(extrudeId, 'fill-extrusion-height', animHeight);
            }
          } else {
            // 2D Fill
            if (!map.getLayer(fillId)) {
              map.addLayer({
                id: fillId,
                type: 'fill',
                source: sourceId,
                paint: {
                  'fill-color': layer.areaData.fillColor || '#f59e0b',
                  'fill-opacity': fillOpacity,
                },
              });
            } else {
              map.setPaintProperty(fillId, 'fill-color', layer.areaData.fillColor || '#f59e0b');
              map.setPaintProperty(fillId, 'fill-opacity', fillOpacity);
            }

            // 2D Border (drawn dynamically along the perimeter)
            if (!map.getLayer(lineId)) {
              map.addLayer({
                id: lineId,
                type: 'line',
                source: borderSourceId,
                paint: {
                  'line-color': layer.areaData.borderColor || '#f59e0b',
                  'line-width': layer.areaData.borderWidth || 3.5,
                  'line-opacity': borderOpacity,
                  ...(layer.areaData.borderStyle === 'dashed' ? { 'line-dasharray': [3, 2] } : {}),
                },
              });
            } else {
              map.setPaintProperty(lineId, 'line-color', layer.areaData.borderColor || '#f59e0b');
              map.setPaintProperty(lineId, 'line-opacity', borderOpacity);
              map.setPaintProperty(lineId, 'line-width', layer.areaData.borderWidth || 3.5);
            }
          }
        } else if (layer.lineData) {
          // Line / Route with Real-time Progressive Slicing & Camera Tracking
          const fullCoords = (layer.lineData.geojson?.geometry as any)?.coordinates as [number, number][] || [];
          const isRouteActive = isVisible && fullCoords.length >= 2;

          let lineCoords = fullCoords;
          let routeProgress = 1.0;

          if (isRouteActive && layer.lineData.animated !== false) {
            const relTime = playhead - layer.startTime;
            const duration = Math.max(0.1, layer.endTime - layer.startTime);
            routeProgress = Math.max(0.001, Math.min(1.0, relTime / duration));
            lineCoords = slicePerimeterLine(fullCoords, routeProgress);
          }

          const dynamicLineGeojson = {
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'LineString',
              coordinates: lineCoords.length >= 2 ? lineCoords : [[0, 0], [0, 0]],
            },
          };

          if (!map.getSource(sourceId)) {
            map.addSource(sourceId, { type: 'geojson', data: dynamicLineGeojson as any });
          } else {
            (map.getSource(sourceId) as maplibregl.GeoJSONSource).setData(dynamicLineGeojson as any);
          }

          if (!map.getLayer(lineId)) {
            map.addLayer({
              id: lineId,
              type: 'line',
              source: sourceId,
              layout: {
                'line-cap': 'round',
                'line-join': 'round',
              },
              paint: {
                'line-color': layer.lineData.color || '#00f0ff',
                'line-width': layer.lineData.width || 4.0,
                'line-opacity': isVisible ? 1 : 0,
              },
            });
          } else {
            map.setPaintProperty(lineId, 'line-color', layer.lineData.color || '#00f0ff');
            map.setPaintProperty(lineId, 'line-opacity', isVisible ? 1 : 0);
            map.setPaintProperty(lineId, 'line-width', layer.lineData.width || 4.0);
          }

          // Camera Tracking (Chase Cam)
          if (isRouteActive && layer.lineData.cameraTracking && isPlaying) {
            const { position, bearing } = getVehicleStateAlongPath(fullCoords, routeProgress);
            map.jumpTo({
              center: position,
              pitch: layer.lineData.cameraPitch || 48,
              bearing: bearing * 0.4,
            });
          }
        }
      }
    });
  }, [layers, playhead, mapReady, isPlaying]);

  const handleZoomIn = () => mapRef.current?.zoomIn({ duration: 300 });
  const handleZoomOut = () => mapRef.current?.zoomOut({ duration: 300 });
  const handleRecenter = () => {
    mapRef.current?.easeTo({
      center: [106.6602, 10.7769],
      zoom: 11,
      bearing: 0,
      pitch: 0,
      duration: 800,
    });
  };

  // Filter active layers visible right now on the canvas overlay
  const activeOverlayLayers = layers.filter(
    (l) => l.visible && playhead >= l.startTime && playhead <= l.endTime
  );

  return (
    <div
      ref={containerRef}
      className="flex-1 flex flex-col items-center justify-center bg-[#060d1a] relative overflow-hidden p-4 select-none"
    >
      {/* Top overlay: layer list + search + comment icons */}
      <div className="absolute top-3 right-3 flex items-center gap-1.5 z-20">
        {/* Place Search */}
        {showSearch ? (
          <div className="relative">
            <div className="flex items-center gap-1.5 bg-[#0f172a]/95 backdrop-blur-md border border-blue-500/50 rounded-xl px-2.5 py-1.5 shadow-xl">
              <Search size={12} className="text-blue-400 flex-shrink-0" />
              <input
                autoFocus
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                onKeyDown={async (e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    if (searchResults.length > 0) {
                      const best = searchResults[0];
                      flyToLocationWithCinematicZoom(parseFloat(best.lon), parseFloat(best.lat), best.zoom);
                    } else if (searchQuery.trim().length >= 1) {
                      setSearchLoading(true);
                      const results = await searchPlace(searchQuery.trim());
                      setSearchLoading(false);
                      if (results.length > 0) {
                        flyToLocationWithCinematicZoom(parseFloat(results[0].lon), parseFloat(results[0].lat), results[0].zoom);
                      }
                    }
                  } else if (e.key === 'Escape') {
                    setShowSearch(false);
                    setSearchResults([]);
                    setSearchQuery('');
                  }
                }}
                placeholder="Tìm địa điểm trên bản đồ..."
                className="bg-transparent text-white text-xs outline-none w-52 placeholder:text-slate-500"
              />
              {searchLoading && (
                <div className="w-3 h-3 rounded-full border border-blue-400 border-t-transparent animate-spin flex-shrink-0" />
              )}
              <button onClick={() => { setShowSearch(false); setSearchResults([]); setSearchQuery(''); }} className="text-slate-500 hover:text-white">
                <X size={12} />
              </button>
            </div>
            {searchResults.length > 0 && (
              <div className="absolute top-10 right-0 w-80 bg-[#0f172a]/98 backdrop-blur-md border border-[#1e293b] rounded-2xl shadow-2xl overflow-hidden z-50 max-h-72 overflow-y-auto custom-scrollbar">
                {searchResults.map((r, i) => (
                  <button
                    key={i}
                    onClick={() => flyToLocationWithCinematicZoom(parseFloat(r.lon), parseFloat(r.lat), r.zoom)}
                    className="flex items-start gap-2.5 w-full px-3 py-2.5 text-left hover:bg-[#1e293b] transition-colors border-b border-[#1e293b]/60 last:border-0 group"
                  >
                    <MapPin size={13} className="text-cyan-400 flex-shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                    <span className="text-xs text-slate-300 group-hover:text-cyan-300 leading-snug line-clamp-2">{r.display_name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <button
            onClick={() => setShowSearch(true)}
            className="w-8 h-8 rounded-xl bg-[#0f172a]/90 backdrop-blur-md border border-[#1e293b] flex items-center justify-center text-slate-400 hover:text-blue-400 hover:border-blue-500/50 transition-all shadow-md"
            title="Tìm kiếm địa điểm"
          >
            <Search size={14} />
          </button>
        )}
        <button
          className="w-8 h-8 rounded-xl bg-[#0f172a]/90 backdrop-blur-md border border-[#1e293b] flex items-center justify-center text-slate-400 hover:text-white transition-all shadow-md"
          title="Danh sách lớp"
        >
          <Layers size={14} />
        </button>
        <button
          className="w-8 h-8 rounded-xl bg-[#0f172a]/90 backdrop-blur-md border border-[#1e293b] flex items-center justify-center text-slate-400 hover:text-white transition-all shadow-md"
          title="Bình luận"
        >
          <MessageSquare size={14} />
        </button>
      </div>

      {/* Video Preview Frame Box */}
      <div
        className="relative shadow-2xl shadow-black/95 overflow-hidden flex-shrink-0 rounded-2xl border-2 border-slate-700/60 bg-[#0c1322]"
        style={{ width: `${frameSize.w}px`, height: `${frameSize.h}px` }}
      >
        {/* Frame Aspect Ratio Tag */}
        <div className="absolute top-3 left-3 z-20 bg-black/75 backdrop-blur-md rounded-lg px-2.5 py-1 text-[11px] text-white/90 font-mono pointer-events-none border border-white/10 shadow-lg">
          {frameDims.label}
        </div>

        {/* Map or Media Background */}
        {activeView === 'map' ? (
          <div
            ref={mapContainerRef}
            className="w-full h-full"
            style={{ width: '100%', height: '100%', minHeight: '100%', position: 'absolute', inset: 0 }}
          />
        ) : (
          <div className={`w-full h-full absolute inset-0 flex items-center justify-center bg-gradient-to-br ${
            mediaBackground === 'galaxy' ? 'from-purple-950 via-slate-900 to-indigo-950' :
            mediaBackground === 'sparks' ? 'from-amber-950 via-slate-900 to-red-950' :
            mediaBackground === 'grid' ? 'from-cyan-950 via-slate-900 to-blue-950' :
            'from-slate-950 via-slate-900 to-navy-950'
          }`}>
            <div className="text-center p-6 space-y-2 select-none">
              <span className="text-4xl">✨</span>
              <p className="text-sm font-bold text-white uppercase tracking-widest">Chế độ Phông Nền Media</p>
              <p className="text-xs text-slate-400">Thêm chữ, đồ họa và animation tự do không cần bản đồ</p>
            </div>
          </div>
        )}

        {/* Real-time Drawing Canvas Overlay (Matches Hình 2 and generates Hình 1) */}
        <DrawingCanvasOverlay map={mapRef.current} mapContainerRect={null} />

        {/* Dynamic DOM Overlays (Callouts, Texts, Counters, Widgets, Flags) */}
        <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden">
          {activeOverlayLayers.map((layer) => {
            if (layer.type === 'callout' && layer.calloutData) {
              return (
                <div
                  key={layer.id}
                  className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-auto animate-bounce-short"
                >
                  <div className="bg-[#0f172a]/95 backdrop-blur-md border-2 border-amber-500/80 rounded-2xl p-3.5 shadow-2xl text-white min-w-[240px] flex flex-col gap-1.5">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
                        {layer.calloutData.theme === 'real_estate' ? <Building size={16} /> :
                         layer.calloutData.theme === 'social_tiktok' ? <Share2 size={16} /> :
                         layer.calloutData.theme === 'phone' ? <Phone size={16} /> :
                         <MapPin size={16} />}
                      </div>
                      <div>
                        <h4 className="text-xs font-bold leading-tight">{layer.calloutData.title}</h4>
                        <p className="text-[10px] text-slate-400">{layer.calloutData.subtitle}</p>
                      </div>
                    </div>
                    {layer.calloutData.price && (
                      <div className="flex justify-between items-center bg-black/40 px-2.5 py-1 rounded-lg border border-white/5 text-[11px] font-medium">
                        <span className="text-amber-400 font-bold">{layer.calloutData.price}</span>
                        <span className="text-slate-300">{layer.calloutData.area}</span>
                      </div>
                    )}
                  </div>
                  {/* Pin stem */}
                  <div className="w-0.5 h-6 bg-amber-500 mx-auto" />
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-400 mx-auto -mt-1 shadow-lg shadow-amber-500" />
                </div>
              );
            }

            if (layer.type === 'text' && layer.textData) {
              return (
                <div
                  key={layer.id}
                  className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none"
                >
                  <h2
                    className="font-black tracking-wider uppercase drop-shadow-2xl animate-pulse"
                    style={{
                      fontSize: `${layer.textData.fontSize || 32}px`,
                      color: layer.textData.color || '#ffffff',
                      textShadow: layer.textData.glow ? `0 0 20px ${layer.textData.color || '#3b82f6'}` : 'none',
                    }}
                  >
                    {layer.textData.content}
                  </h2>
                </div>
              );
            }

            if (layer.type === 'counter' && layer.counterData) {
              const progress = Math.min(1, Math.max(0, (playhead - layer.startTime) / (layer.endTime - layer.startTime)));
              const currentVal = layer.counterData.startValue + progress * (layer.counterData.endValue - layer.counterData.startValue);
              return (
                <div
                  key={layer.id}
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none"
                >
                  <div
                    className="font-black font-mono tracking-widest drop-shadow-2xl"
                    style={{
                      fontSize: `${layer.counterData.fontSize || 48}px`,
                      color: layer.counterData.color || '#f59e0b',
                      textShadow: `0 0 25px ${layer.counterData.color}88`,
                    }}
                  >
                    {layer.counterData.prefix}{currentVal.toFixed(layer.counterData.decimals)}{layer.counterData.suffix}
                  </div>
                </div>
              );
            }

            if (layer.type === 'widget' && layer.widgetData) {
              return (
                <div
                  key={layer.id}
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-auto"
                >
                  {layer.widgetData.isRadar ? (
                    <div className="relative flex items-center justify-center">
                      <div className="w-4 h-4 rounded-full bg-blue-500 relative z-10 shadow-lg shadow-blue-500" />
                      <div className="w-24 h-24 rounded-full border-2 border-blue-400/80 absolute animate-ping" />
                      <div className="w-40 h-40 rounded-full border border-blue-400/40 absolute animate-pulse" />
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 bg-[#0f172a]/90 backdrop-blur-md border border-blue-500/80 px-3 py-1.5 rounded-full shadow-xl">
                      <Radio size={14} className="text-blue-400 animate-spin" />
                      <span className="text-xs font-bold text-white">{layer.widgetData.label}</span>
                    </div>
                  )}
                </div>
              );
            }

            if (layer.type === 'object' && layer.objectData) {
              return (
                <div
                  key={layer.id}
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-auto"
                >
                  {layer.objectData.objectType === 'flag' ? (
                    <div className="flex flex-col items-center">
                      <div className="text-3xl filter drop-shadow-lg animate-bounce">
                        {layer.objectData.countryName?.includes('Việt Nam') ? '🇻🇳' :
                         layer.objectData.countryName?.includes('Hoa Kỳ') ? '🇺🇸' :
                         layer.objectData.countryName?.includes('Nhật Bản') ? '🇯🇵' :
                         layer.objectData.countryName?.includes('Hàn Quốc') ? '🇰🇷' :
                         layer.objectData.countryName?.includes('Pháp') ? '🇫🇷' : '🚩'}
                      </div>
                      <span className="bg-black/80 px-2 py-0.5 rounded text-[10px] font-bold text-white mt-1 border border-white/20">
                        {layer.objectData.countryName}
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 bg-slate-900/90 border border-emerald-500/80 p-2 rounded-2xl shadow-xl">
                      {layer.objectData.objectType === 'airplane' ? <Plane size={24} className="text-blue-400" /> :
                       layer.objectData.objectType === 'car' ? <Car size={24} className="text-amber-400" /> :
                       <User size={24} className="text-emerald-400" />}
                      <span className="text-xs font-bold text-white">{layer.name}</span>
                    </div>
                  )}
                </div>
              );
            }

            // Animated Vehicle Marker on Route
            if ((layer.type === 'route' || layer.type === 'line') && layer.lineData?.showVehicle !== false) {
              const fullCoords = (layer.lineData?.geojson?.geometry as any)?.coordinates as [number, number][] || [];
              if (fullCoords.length >= 2) {
                const relTime = playhead - layer.startTime;
                const duration = Math.max(0.1, layer.endTime - layer.startTime);
                const routeProgress = Math.max(0.001, Math.min(1.0, relTime / duration));
                const { position, bearing } = getVehicleStateAlongPath(fullCoords, routeProgress);
                const map = mapRef.current;
                const p = map?.project(position);

                if (p && !isNaN(p.x) && !isNaN(p.y)) {
                  const vehicleType = layer.lineData?.vehicle || 'car';
                  return (
                    <div
                      key={`vehicle-${layer.id}`}
                      className="absolute pointer-events-none transition-transform duration-75 z-20"
                      style={{
                        left: `${p.x}px`,
                        top: `${p.y}px`,
                        transform: `translate(-50%, -50%) rotate(${bearing}deg)`,
                      }}
                    >
                      {/* Glowing Vehicle Icon */}
                      <div
                        className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-2xl border-2 transition-all relative group"
                        style={{
                          backgroundColor: '#0f172a',
                          borderColor: layer.lineData?.color || '#00f0ff',
                          boxShadow: `0 0 22px ${layer.lineData?.color || '#00f0ff'}90, 0 4px 14px rgba(0,0,0,0.85)`,
                        }}
                      >
                        {vehicleType === 'airplane' ? (
                          <Plane size={20} className="text-sky-400 -rotate-45" />
                        ) : vehicleType === 'boat' ? (
                          <Ship size={20} className="text-teal-400" />
                        ) : vehicleType === 'motorcycle' ? (
                          <Bike size={20} className="text-amber-400" />
                        ) : (
                          <Car size={20} className="text-cyan-400" />
                        )}
                      </div>
                    </div>
                  );
                }
              }
            }

            return null;
          })}

          {/* Area Bounding Box & Name Tag for Selected Area */}
          <AreaBoundingBoxOverlay map={mapRef.current} />
        </div>

        {/* Map dimming overlay */}
        {mapDimming > 0 && (
          <div
            className="absolute inset-0 pointer-events-none z-10 transition-opacity duration-150"
            style={{ backgroundColor: `rgba(0,0,0,${mapDimming / 100})` }}
          />
        )}






        {/* Coordinate Display */}
        {coords && (
          <div className="absolute bottom-14 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
            <div className="bg-black/75 backdrop-blur-md rounded-lg px-3 py-1 text-[10px] text-slate-300 font-mono border border-white/10 shadow-lg flex items-center gap-2">
              <Navigation2 size={10} className="text-blue-400" />
              {coords.lng.toFixed(5)}, {coords.lat.toFixed(5)}
            </div>
          </div>
        )}

        {/* Keyframe camera mode indicator */}
        {isKeyframeCameraMode && (
          <div className="absolute top-10 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 bg-red-600/95 backdrop-blur-md px-4 py-1.5 rounded-full text-xs text-white font-semibold shadow-2xl animate-pulse border border-red-400">
            <div className="w-2 h-2 rounded-full bg-white animate-ping" />
            Đang ghi keyframe camera (Di chuyển góc nhìn để lưu)
          </div>
        )}

        {/* Map Style Selector Button */}
        {activeView === 'map' && (
          <>
            <button
              onClick={() => setShowStylePicker((v) => !v)}
              className="absolute bottom-3 left-3 z-20 flex items-center gap-2 bg-[#0f172a]/95 backdrop-blur-md border border-[#1e293b] rounded-xl px-3 py-2 text-xs text-slate-200 hover:text-white hover:border-blue-500 transition-all shadow-lg"
            >
              <Globe size={14} className="text-blue-400" />
              <span className="font-semibold">{MAP_STYLES[mapStyle]?.label || 'Vệ tinh'}</span>
            </button>

            {/* Map Style Dropdown */}
            {showStylePicker && (
              <div className="absolute bottom-14 left-3 z-30 bg-[#0f172a]/95 backdrop-blur-md border border-[#1e293b] rounded-2xl shadow-2xl p-2.5 animate-slideUp">
                <p className="text-[10px] text-slate-400 font-semibold px-1 mb-2 uppercase tracking-wider">
                  6 Kiểu bản đồ
                </p>
                <div className="grid grid-cols-3 gap-2 w-64">
                  {(Object.keys(MAP_STYLES) as MapStyle[]).map((key) => (
                    <button
                      key={key}
                      onClick={() => {
                        setMapStyle(key);
                        setShowStylePicker(false);
                      }}
                      className={`flex flex-col items-center gap-1.5 p-2 rounded-xl text-xs font-medium transition-all ${
                        mapStyle === key
                          ? 'bg-blue-600/25 text-blue-300 border border-blue-500/80 shadow-md'
                          : 'text-slate-400 hover:bg-[#1e293b] hover:text-slate-200 border border-transparent'
                      }`}
                    >
                      <span className={mapStyle === key ? 'text-blue-400' : 'text-slate-400'}>
                        {MAP_STYLES[key].icon}
                      </span>
                      <span>{MAP_STYLES[key].label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Map Zoom / Controls on Bottom Right */}
            <div className="absolute bottom-3 right-3 z-20 flex flex-col gap-1.5">
              {isKeyframeCameraMode && (
                <>
                  <button
                    onClick={addKeyframeAtPlayhead}
                    className="w-9 h-9 rounded-full bg-red-600 hover:bg-red-500 text-white text-xs font-bold shadow-lg flex items-center justify-center transition-all active:scale-95 border border-red-400"
                    title="Thêm hoặc ghi đè keyframe camera tại vị trí này (+K)"
                  >
                    +K
                  </button>
                  {cameraKeyframes.some((k) => Math.abs(k.time - playhead) < 0.1) && (
                    <button
                      onClick={() => {
                        const target = cameraKeyframes.find((k) => Math.abs(k.time - playhead) < 0.1);
                        if (target) deleteCameraKeyframe(target.id);
                      }}
                      className="w-9 h-9 rounded-full bg-slate-900/90 hover:bg-red-700 text-red-400 hover:text-white text-xs font-bold shadow-lg flex items-center justify-center transition-all active:scale-95 border border-red-500/50"
                      title="Xoá keyframe camera tại mốc thời gian này (-K)"
                    >
                      -K
                    </button>
                  )}
                </>
              )}
              <button
                onClick={handleZoomIn}
                className="w-8 h-8 rounded-full bg-[#0f172a]/90 backdrop-blur-md border border-[#1e293b] text-slate-300 hover:text-white hover:bg-[#1e293b] transition-all flex items-center justify-center shadow"
                title="Phóng to (+)"
              >
                <Plus size={14} />
              </button>
              <button
                onClick={handleZoomOut}
                className="w-8 h-8 rounded-full bg-[#0f172a]/90 backdrop-blur-md border border-[#1e293b] text-slate-300 hover:text-white hover:bg-[#1e293b] transition-all flex items-center justify-center shadow"
                title="Thu nhỏ (-)"
              >
                <Minus size={14} />
              </button>
              <button
                onClick={handleRecenter}
                className="w-8 h-8 rounded-full bg-[#0f172a]/90 backdrop-blur-md border border-[#1e293b] text-slate-300 hover:text-white hover:bg-[#1e293b] transition-all flex items-center justify-center shadow"
                title="Căn giữa lại (Recenter)"
              >
                <Compass size={14} />
              </button>
              <button
                className="w-8 h-8 rounded-full bg-[#0f172a]/90 backdrop-blur-md border border-[#1e293b] text-slate-400 hover:text-white transition-all flex items-center justify-center shadow"
                title="Thông tin tọa độ"
              >
                <Info size={13} />
              </button>
            </div>
          </>
        )}
      </div>

      {/* Shortcut hints under the preview */}
      <div className="mt-2 text-center pointer-events-none">
        <p className="text-[10px] text-slate-500 leading-relaxed">
          <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 font-mono">Shift</kbd>+kéo = Xoay 3D &nbsp;·&nbsp;
          <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 font-mono">Space</kbd> = Phát/Dừng &nbsp;·&nbsp;
          <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 font-mono">Ctrl+Z</kbd> = Undo
        </p>
      </div>
    </div>
  );
};
