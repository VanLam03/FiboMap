import React, { useState, useEffect, useCallback } from 'react';
import { Search, MapPin, X, Plus, Sparkles, Building2, Map, Layers, Compass, Loader2, MousePointerClick, Check, Globe } from 'lucide-react';
import { useProjectStore } from '../../store/useProjectStore';
import type { Feature } from 'geojson';
import {
  VIETNAM_ADMIN_DATABASE,
  fetchLiveBoundaryGeoJSON,
  createPolygonFromBbox,
  parseSmartAdminQuery,
  removeVietnameseTones,
  computeBboxFromGeoJSON,
  type AdminBoundaryItem
} from '../../services/boundaryService';

// ══════════════════════════════════════════════════════════════════════════
// FETCH EXACT BOUNDARY — dùng Overpass API & Nominatim (Hỗ trợ Quốc gia & VN)
// Admin levels: 2=quốc gia, 4=tỉnh, 5=huyện, 8=xã/phường
// ══════════════════════════════════════════════════════════════════════════

// Map item level → OSM admin_level range
const ADMIN_LEVEL_MAP: Record<string, number[]> = {
  country: [2],
  province: [4],
  district: [5, 6],
  ward: [7, 8, 9, 10],
};

async function fetchOSMBoundaryGeoJSON(item: AdminBoundaryItem): Promise<Feature | null> {
  const headers = {
    'Accept-Language': 'vi,en',
    'User-Agent': 'FiboMap-Cinematic/2.0',
  };

  // ── Strategy 1: For Countries — Direct Polygon Search ────────────────────
  if (item.level === 'country') {
    try {
      const cleanName = item.name.replace(/\(.*?\)/g, '').trim();
      const countryQuery = item.mergedDetails ? `${cleanName}, ${item.mergedDetails}` : cleanName;
      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(countryQuery)}&format=geojson&polygon_geojson=1&featuretype=country&limit=3`;
      const res = await fetch(url, { headers });
      if (res.ok) {
        const data = await res.json();
        const poly = (data?.features || []).find((f: any) =>
          f.geometry?.type === 'Polygon' || f.geometry?.type === 'MultiPolygon'
        );
        if (poly) return poly as Feature;
      }
    } catch {
      // Fall through to Overpass
    }
  }

  // ── Strategy 2: Overpass API — exactly same source as map tiles ──────────
  try {
    const levels = ADMIN_LEVEL_MAP[item.level] || [4, 5, 8];
    const levelFilter = levels.map(l => `["admin_level"="${l}"]`).join('');

    // Search by Vietnamese name
    const cleanName = item.name.replace(/^(TP\.|Tỉnh|Huyện|Quận|Xã|Phường|Thị trấn)\s*/i, '').trim();
    const overpassQuery = item.level === 'country'
      ? `[out:json][timeout:25]; ( relation["boundary"="administrative"]["admin_level"="2"]["name:en"~"${cleanName}",i]; relation["boundary"="administrative"]["admin_level"="2"]["name:vi"~"${cleanName}",i]; ); out ids;`
      : `[out:json][timeout:25]; ( relation["boundary"="administrative"]${levelFilter}["name"~"${cleanName}",i](4.5,102.0,23.5,110.0); relation["boundary"="administrative"]${levelFilter}["name:vi"~"${cleanName}",i](4.5,102.0,23.5,110.0); ); out ids;`;

    const overpassRes = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      body: overpassQuery,
      headers: { 'Content-Type': 'text/plain', ...headers },
    });

    if (overpassRes.ok) {
      const overpassData = await overpassRes.json();
      const relations: any[] = overpassData?.elements || [];

      if (relations.length > 0) {
        const relId = relations[0].id;
        const lookupUrl = `https://nominatim.openstreetmap.org/lookup?osms=R${relId}&polygon_geojson=1&polygon_threshold=0&format=geojson`;
        const lookupRes = await fetch(lookupUrl, { headers });
        if (lookupRes.ok) {
          const lookupData = await lookupRes.json();
          const poly = (lookupData?.features || []).find((f: any) =>
            f.geometry?.type === 'Polygon' || f.geometry?.type === 'MultiPolygon'
          );
          if (poly && (item.level === 'country' || isInVietnam(poly))) return poly as Feature;
        }
      }
    }
  } catch {
    // Overpass failed, fall through to Nominatim
  }

  // ── Strategy 3: Nominatim search with strict admin level filter ──────────
  try {
    const levels = ADMIN_LEVEL_MAP[item.level] || [4, 5, 8];
    const cleanName = item.name.replace(/^(TP\.|Tỉnh|Huyện|Quận|Xã|Phường)\s*/i, '').trim();

    const searchUrl = item.level === 'country'
      ? `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(cleanName)}&format=json&limit=6&extratags=1&namedetails=1`
      : `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(cleanName + ', Vietnam')}&format=json&countrycodes=vn&limit=10&extratags=1&namedetails=1`;
    
    const searchRes = await fetch(searchUrl, { headers });
    if (!searchRes.ok) throw new Error('search failed');
    const searchData: any[] = await searchRes.json();

    const candidates = searchData.filter(r => {
      if (r.osm_type !== 'relation') return false;
      if (r.class !== 'boundary' && r.class !== 'place') return false;
      const adminLevel = parseInt(r.extratags?.admin_level || '0');
      if (adminLevel === 0) return true;
      return levels.some(l => Math.abs(adminLevel - l) <= 1);
    });

    const sorted = (candidates.length > 0 ? candidates : searchData.filter(r => r.osm_type === 'relation').concat(searchData))
      .slice(0, 5)
      .sort((a: any, b: any) => {
        const scoreA = nominatimScore(a, levels);
        const scoreB = nominatimScore(b, levels);
        return scoreB - scoreA;
      });

    if (sorted.length === 0) return null;

    const best = sorted[0];
    const osmId = best.osm_id;
    const osmType = best.osm_type === 'relation' ? 'R' : best.osm_type === 'way' ? 'W' : 'N';
    const lookupUrl = `https://nominatim.openstreetmap.org/lookup?osms=${osmType}${osmId}&polygon_geojson=1&polygon_threshold=0&format=geojson`;
    const lookupRes = await fetch(lookupUrl, { headers });
    if (lookupRes.ok) {
      const lookupData = await lookupRes.json();
      const poly = (lookupData?.features || []).find((f: any) =>
        f.geometry?.type === 'Polygon' || f.geometry?.type === 'MultiPolygon'
      );
      if (poly && (item.level === 'country' || isInVietnam(poly))) return poly as Feature;
    }

    return null;
  } catch {
    return null;
  }
}

function nominatimScore(r: any, preferredLevels: number[]): number {
  let score = 0;
  if (r.class === 'boundary') score += 1000;
  if (r.extratags?.boundary === 'administrative') score += 2000;
  const adminLevel = parseInt(r.extratags?.admin_level || '0');
  if (preferredLevels.includes(adminLevel)) score += 5000;
  else if (adminLevel > 0 && preferredLevels.some(l => Math.abs(adminLevel - l) <= 1)) score += 2000;
  score += Math.round(parseFloat(r.importance || '0') * 10000);
  return score;
}

function isInVietnam(f: any): boolean {
  try {
    const coords = f.geometry?.coordinates;
    if (!coords) return true;
    let pt: number[] | null = null;
    if (f.geometry.type === 'Polygon') pt = coords[0][0];
    else if (f.geometry.type === 'MultiPolygon') pt = coords[0][0][0];
    if (!pt) return true;
    return pt[0] >= 101 && pt[0] <= 110.5 && pt[1] >= 8 && pt[1] <= 24;
  } catch { return true; }
}

export const AutoBoundaryModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'country' | 'province' | 'district' | 'ward'>('all');
  const [enable3D, setEnable3D] = useState(true);
  const [extrudeHeight, setExtrudeHeight] = useState(600);
  const [appearEffect, setAppearEffect] = useState<'draw' | 'fade-in' | 'blink' | 'extrude-3d'>('draw');
  const [color, setColor] = useState('#f59e0b');
  const [liveResults, setLiveResults] = useState<AdminBoundaryItem[]>([]);
  const [isLoadingLive, setIsLoadingLive] = useState(false);
  const [isClickIdentifyMode, setIsClickIdentifyMode] = useState(false);
  const [fetchingId, setFetchingId] = useState<string | null>(null);

  const { addLayer, updateAreaData, playhead, duration, setCurrentCamera, selectLayer } = useProjectStore();

  // Smart Live Search with debounce
  useEffect(() => {
    if (!searchTerm || searchTerm.trim().length < 2) {
      setLiveResults([]);
      setIsLoadingLive(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoadingLive(true);
      const parsed = parseSmartAdminQuery(searchTerm);
      const levelHint = activeTab === 'country' ? 'country' : parsed.levelHint;
      const results = await fetchLiveBoundaryGeoJSON(searchTerm, levelHint);
      setLiveResults(results);
      setIsLoadingLive(false);
    }, 450);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Filter local database with Vietnamese accent-insensitive matching
  const normSearch = removeVietnameseTones(searchTerm);
  const normSearchNoSpace = normSearch.replace(/\s+/g, '');

  const filteredLocal = VIETNAM_ADMIN_DATABASE.filter((item) => {
    if (activeTab !== 'all' && item.level !== activeTab) return false;
    if (!searchTerm) return true;
    const normName = removeVietnameseTones(item.name);
    const normFullName = removeVietnameseTones(item.fullName);
    const normProvince = removeVietnameseTones(item.provinceName || '');
    const normMerged = removeVietnameseTones(item.mergedDetails || '');
    return (
      normName.includes(normSearch) ||
      normFullName.includes(normSearch) ||
      normProvince.includes(normSearch) ||
      normMerged.includes(normSearch) ||
      normName.replace(/\s+/g, '').includes(normSearchNoSpace) ||
      normMerged.replace(/\s+/g, '').includes(normSearchNoSpace)
    );
  });

  // Combine live results + local results
  const displayedItems = searchTerm.trim().length >= 2 && liveResults.length > 0
    ? [...liveResults, ...filteredLocal.filter(l => !liveResults.some(r => removeVietnameseTones(r.name) === removeVietnameseTones(l.name)))]
    : filteredLocal;

  const handleSelectBoundary = async (item: AdminBoundaryItem) => {
    const layerId = `area-auto-${Date.now()}`;
    setFetchingId(item.id);

    // Direct authentic GIS GeoJSON from local dataset
    const geojson: Feature = item.geojson || createPolygonFromBbox(item.bbox, item.name);
    const newLayer = {
      id: layerId,
      type: 'area' as const,
      name: item.name,
      color,
      startTime: playhead,
      endTime: Math.min(playhead + 6.0, duration),
      visible: true,
      locked: false,
      selected: true,
      areaData: {
        geojson,
        borderWidth: 3.5,
        borderStyle: 'solid' as const,
        borderColor: color,
        fillColor: color,
        fillOpacity: 0.35,
        appearEffect: appearEffect,
        appearDuration: 1.2,
        exitEffect: 'fade-out' as const,
        exitDuration: 0.8,
        is3D: enable3D,
        extrudeHeight: enable3D ? extrudeHeight : 0,
      },
    };

    addLayer(newLayer);
    selectLayer(layerId);

    // Fit camera smoothly to the exact bounding box of the GIS boundary
    const map = (window as any).__fibomap_map;
    if (map) {
      const bbox = computeBboxFromGeoJSON(geojson);
      map.fitBounds(
        [[bbox[0], bbox[1]], [bbox[2], bbox[3]]],
        { padding: 80, duration: 1400, pitch: enable3D ? 45 : 0, bearing: 15 }
      );
    }
    setCurrentCamera({
      center: item.coords,
      zoom: item.zoom,
      pitch: enable3D ? 45 : 0,
      bearing: 15,
    });

    onClose();
    setFetchingId(null);

    // If item didn't have geojson (e.g. ad-hoc live search query), fetch in background
    if (!item.geojson) {
      const osmGeojson = await fetchOSMBoundaryGeoJSON(item);
      if (osmGeojson) {
        updateAreaData(layerId, { geojson: osmGeojson });
        if (map) {
          const realBbox = computeBboxFromGeoJSON(osmGeojson);
          map.fitBounds(
            [[realBbox[0], realBbox[1]], [realBbox[2], realBbox[3]]],
            { padding: 80, duration: 1200, pitch: enable3D ? 45 : 0, bearing: 15 }
          );
        }
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-[#0f172a] border border-[#1e293b] rounded-2xl shadow-2xl w-[600px] max-h-[90vh] flex flex-col overflow-hidden animate-slideUp">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-[#1e293b] bg-[#0a1628]/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-inner">
              <Sparkles size={20} />
            </div>
            <div>
              <h2 className="font-bold text-white text-base flex items-center gap-2">
                Khoanh vùng tự động (Auto Boundary)
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                  Quốc gia & Địa giới VN
                </span>
              </h2>
              <p className="text-slate-400 text-xs mt-0.5">
                Nhận diện chính xác theo Quốc gia, Tỉnh/Thành phố, Quận/Huyện và Xã/Phường
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-[#1e293b] transition-all"
          >
            <X size={18} />
          </button>
        </div>

        {/* Search Bar & Smart Level Tabs */}
        <div className="p-4 border-b border-[#1e293b] space-y-3 bg-[#0a1628]/30">
          <div className="relative">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Nhập tên Quốc gia, Tỉnh, Quận, Xã (VD: Việt Nam, Hoa Kỳ, Nhật Bản, Gia Lai, Hà Nội, Đà Lạt...)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#1e293b] text-white text-xs pl-10 pr-10 py-2.5 rounded-xl border border-slate-700 outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50 placeholder-slate-500 font-medium transition-all"
              autoFocus
            />
            {isLoadingLive && (
              <Loader2 size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-amber-400 animate-spin" />
            )}
          </div>

          {/* Level Filter Tabs */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {[
              { id: 'all', label: 'Tất cả' },
              { id: 'country', label: '🌍 Quốc gia' },
              { id: 'province', label: '🏙️ Tỉnh / TP' },
              { id: 'district', label: '📍 Quận / Huyện' },
              { id: 'ward', label: '🏘️ Xã / Phường' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                    : 'bg-[#1e293b]/60 text-slate-400 hover:text-white hover:bg-[#1e293b]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Options Bar: 3D, Effect, Color */}
        <div className="px-4 py-3 border-b border-[#1e293b] flex items-center justify-between text-xs bg-[#0f172a]/80">
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-slate-300 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={enable3D}
                onChange={(e) => setEnable3D(e.target.checked)}
                className="w-3.5 h-3.5 accent-amber-500 rounded"
              />
              <span>Hiệu ứng 3D Nổi khối</span>
            </label>

            {enable3D && (
              <div className="flex items-center gap-1.5 text-slate-400">
                <span>Cao:</span>
                <input
                  type="number"
                  value={extrudeHeight}
                  onChange={(e) => setExtrudeHeight(Number(e.target.value))}
                  className="w-16 bg-[#1e293b] text-amber-400 font-bold px-2 py-0.5 rounded border border-slate-700 text-xs text-center"
                  step={100}
                  min={100}
                  max={3000}
                />
                <span>m</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-400">Hiệu ứng:</span>
            <select
              value={appearEffect}
              onChange={(e) => setAppearEffect(e.target.value as any)}
              className="bg-[#1e293b] text-white text-xs px-2 py-1 rounded-lg border border-slate-700 outline-none"
            >
              <option value="draw">Vẽ viền (Chạy 1 vòng)</option>
              <option value="fade-in">Hiện dần (Fade In)</option>
              <option value="blink">Nhấp nháy (Blink)</option>
              <option value="extrude-3d">Nổi khối 3D</option>
            </select>
          </div>
        </div>

        {/* Boundary Results List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2 max-h-[380px] custom-scrollbar">
          {displayedItems.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs">
              <Compass size={32} className="mx-auto mb-2 opacity-30 text-slate-400" />
              Không tìm thấy địa giới hành chính phù hợp. Vui lòng nhập từ khóa khác (ví dụ: &quot;Việt Nam&quot;, &quot;Hoa Kỳ&quot;, &quot;Gia Lai&quot;, &quot;Hà Nội&quot;).
            </div>
          ) : (
            displayedItems.map((item) => (
              <div
                key={item.id}
                onClick={() => handleSelectBoundary(item)}
                className="group flex items-center justify-between p-3 rounded-xl bg-[#1e293b]/40 hover:bg-gradient-to-r hover:from-amber-500/15 hover:to-orange-500/10 border border-slate-800/80 hover:border-amber-500/50 transition-all cursor-pointer shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                    item.level === 'country'
                      ? 'bg-blue-500/20 text-cyan-300 border border-cyan-500/30'
                      : item.level === 'province'
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      : item.level === 'district'
                      ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                      : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  }`}>
                    {item.level === 'country' ? '🌍' : (item.code ? `#${item.code}` : (item.level === 'province' ? 'Tỉnh' : item.level === 'district' ? 'Quận' : 'Xã'))}
                  </div>

                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-white text-xs group-hover:text-amber-400 transition-colors">
                        {item.name}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-800 text-slate-400 border border-slate-700">
                        {item.levelLabel}
                      </span>
                      {item.mergedDetails && (
                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-300 border border-amber-500/30 font-medium">
                          {item.mergedDetails}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">
                      {item.fullName}
                    </p>
                  </div>
                </div>

                <button
                  disabled={fetchingId === item.id}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all shadow-sm shrink-0 ${
                    fetchingId === item.id
                      ? 'bg-amber-500/10 text-amber-400/50 border-amber-500/20 cursor-wait'
                      : 'bg-amber-500/20 group-hover:bg-amber-500 text-amber-400 group-hover:text-slate-950 border-amber-500/30 cursor-pointer'
                  }`}
                >
                  {fetchingId === item.id
                    ? <><Loader2 size={13} className="animate-spin" /><span>Đang tải...</span></>
                    : <><Plus size={14} /><span>Khoanh ngay</span></>
                  }
                </button>
              </div>
            ))
          )}
        </div>

        {/* Footer Hint */}
        <div className="p-3 border-t border-[#1e293b] bg-[#0a1628]/40 flex items-center justify-between text-[11px] text-slate-400 px-5">
          <span className="flex items-center gap-1.5">
            <Sparkles size={13} className="text-amber-400" />
            Tự động tải ranh giới thực từ OSM 2026 — đường viền ôm sát địa lý.
          </span>
          <span className="text-slate-500 italic">OSM Nominatim</span>
        </div>

      </div>
    </div>
  );
};
