import type { Feature, FeatureCollection } from 'geojson';
import VIETNAM_34_MERGED_DATA from '../data/vietnam_34_merged.json';
import VIETNAM_63_PROVINCES_DATA from '../data/vietnam_provinces.json';

export interface AdminBoundaryItem {
  id: string;
  code?: number;
  name: string;
  fullName: string;
  mergedDetails?: string;
  level: 'province' | 'district' | 'ward';
  levelLabel: string;
  parentName?: string;
  provinceName?: string;
  coords: [number, number]; // [lng, lat]
  zoom: number;
  bbox: [number, number, number, number]; // [minLng, minLat, maxLng, maxLat]
  geojson?: Feature;
}

// Normalize Vietnamese search strings (converts "Đắk Lắk" -> "dak lak", "Gia Lai" -> "gia lai")
export function removeVietnameseTones(str: string): string {
  if (!str) return '';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .replace(/Ð/g, 'd')
    .toLowerCase()
    .trim();
}

// Compute bounding box from GeoJSON Polygon / MultiPolygon
export function computeBboxFromGeoJSON(geojson: Feature): [number, number, number, number] {
  let minLng = 180, minLat = 90, maxLng = -180, maxLat = -90;

  const traverseCoords = (coords: any) => {
    if (typeof coords[0] === 'number') {
      const [lng, lat] = coords;
      if (lng < minLng) minLng = lng;
      if (lat < minLat) minLat = lat;
      if (lng > maxLng) maxLng = lng;
      if (lat > maxLat) maxLat = lat;
    } else if (Array.isArray(coords)) {
      coords.forEach(traverseCoords);
    }
  };

  if (geojson && geojson.geometry && (geojson.geometry as any).coordinates) {
    traverseCoords((geojson.geometry as any).coordinates);
  }

  if (minLng > maxLng) return [105.7, 20.9, 106.0, 21.2];
  return [minLng, minLat, maxLng, maxLat];
}

// Generate an organic, natural smoothed polygon boundary fallback
export function createPolygonFromBbox(bbox: [number, number, number, number], name: string): Feature {
  const [minLng, minLat, maxLng, maxLat] = bbox;
  const cLng = (minLng + maxLng) / 2;
  const cLat = (minLat + maxLat) / 2;
  const rLng = (maxLng - minLng) / 2;
  const rLat = (maxLat - minLat) / 2;

  const steps = 16;
  const coordinates: [number, number][] = [];
  
  for (let i = 0; i <= steps; i++) {
    const angle = (i / steps) * Math.PI * 2;
    const variance = 0.88 + 0.12 * Math.sin(angle * 3) + 0.06 * Math.cos(angle * 5);
    const lng = cLng + Math.cos(angle) * rLng * variance;
    const lat = cLat + Math.sin(angle) * rLat * variance;
    coordinates.push([Number(lng.toFixed(5)), Number(lat.toFixed(5))]);
  }

  return {
    type: 'Feature',
    properties: { name },
    geometry: {
      type: 'Polygon',
      coordinates: [coordinates],
    },
  };
}

// Details metadata map for 34 merged provinces
const MERGED_DETAILS_MAP: Record<number, { details: string; label: string }> = {
  1: { details: 'Thủ đô Hà Nội', label: 'Thành phố trực thuộc TW' },
  2: { details: 'Cố đô Huế, Thừa Thiên Huế', label: 'Thành phố trực thuộc TW' },
  3: { details: 'Lai Châu', label: 'Tỉnh (Tây Bắc)' },
  4: { details: 'Điện Biên, Mường Thanh', label: 'Tỉnh (Tây Bắc)' },
  5: { details: 'Sơn La, Mộc Châu', label: 'Tỉnh (Tây Bắc)' },
  6: { details: 'Lạng Sơn, Mẫu Sơn', label: 'Tỉnh (Đông Bắc)' },
  7: { details: 'Quảng Ninh, Vịnh Hạ Long', label: 'Tỉnh (Vùng duyên hải)' },
  8: { details: 'Thanh Hóa, Sầm Sơn', label: 'Tỉnh (Bắc Trung Bộ)' },
  9: { details: 'Nghệ An, TP. Vinh', label: 'Tỉnh (Bắc Trung Bộ)' },
  10: { details: 'Hà Tĩnh, Hồng Lĩnh', label: 'Tỉnh (Bắc Trung Bộ)' },
  11: { details: 'Cao Bằng, Thác Bản Giốc', label: 'Tỉnh (Đông Bắc)' },
  12: { details: 'Tuyên Quang + Hà Giang', label: 'Tỉnh sau sáp nhập' },
  13: { details: 'Lào Cai + Yên Bái, Sa Pa, Mù Cang Chải', label: 'Tỉnh sau sáp nhập' },
  14: { details: 'Bắc Kạn + Thái Nguyên, Hồ Ba Bể', label: 'Tỉnh sau sáp nhập' },
  15: { details: 'Vĩnh Phúc + Phú Thọ + Hòa Bình (Đền Hùng, Tam Đảo, Mai Châu)', label: 'Tỉnh sau sáp nhập' },
  16: { details: 'Bắc Ninh + Bắc Giang (Kinh Bắc)', label: 'Tỉnh sau sáp nhập' },
  17: { details: 'Hưng Yên + Thái Bình (Phố Hiến)', label: 'Tỉnh sau sáp nhập' },
  18: { details: 'Hải Dương + TP. Hải Phòng (Cát Bà, Đồ Sơn)', label: 'Thành phố trực thuộc TW sau sáp nhập' },
  19: { details: 'Hà Nam + Ninh Bình + Nam Định (Tràng An, Phủ Giầy, Tam Chúc)', label: 'Tỉnh sau sáp nhập' },
  20: { details: 'Quảng Bình + Quảng Trị (Phong Nha - Kẻ Bàng, Thành cổ)', label: 'Tỉnh sau sáp nhập' },
  21: { details: 'TP. Đà Nẵng + Quảng Nam (Bà Nà, Hội An, Mỹ Sơn)', label: 'Thành phố trực thuộc TW sau sáp nhập' },
  22: { details: 'Kon Tum + Quảng Ngãi (Măng Đen, Đảo Lý Sơn)', label: 'Tỉnh sau sáp nhập' },
  23: { details: 'Gia Lai + Bình Định (TP. Pleiku, TP. Quy Nhơn, Kỳ Co - Eo Gió)', label: 'Tỉnh sau sáp nhập (Tây Nguyên - Duyên Hải)' },
  24: { details: 'Ninh Thuận + Khánh Hòa (TP. Nha Trang, Vịnh Cam Ranh, Phan Rang)', label: 'Tỉnh sau sáp nhập (Duyên Hải Nam Trung Bộ)' },
  25: { details: 'Lâm Đồng + Đắk Nông + Bình Thuận (TP. Đà Lạt, TP. Phan Thiết, Mũi Né, Tà Đùng)', label: 'Tỉnh sau sáp nhập (Tây Nguyên - Nam Trung Bộ)' },
  26: { details: 'Đắk Lắk + Phú Yên (TP. Buôn Ma Thuột, TP. Tuy Hòa, Gành Đá Đĩa)', label: 'Tỉnh sau sáp nhập' },
  27: { details: 'Bà Rịa-Vũng Tàu + Bình Dương + TP. Hồ Chí Minh (Đô thị kinh tế trọng điểm)', label: 'Siêu đô thị trực thuộc TW sau sáp nhập' },
  28: { details: 'Đồng Nai + Bình Phước (TP. Biên Hòa, Sân bay Long Thành)', label: 'Tỉnh sau sáp nhập' },
  29: { details: 'Tây Ninh + Long An (Núi Bà Đen, Cửa khẩu Mộc Bài, Vùng Đồng Tháp Mười)', label: 'Tỉnh sau sáp nhập' },
  30: { details: 'TP. Cần Thơ + Sóc Trăng + Hậu Giang (Trung tâm ĐBSCL, Chợ nổi Cái Răng)', label: 'Thành phố trực thuộc TW sau sáp nhập' },
  31: { details: 'Bến Tre + Vĩnh Long + Trà Vinh (Xứ dừa Bến Tre, Vựa cây ăn trái)', label: 'Tỉnh sau sáp nhập (Miền Tây)' },
  32: { details: 'Tiền Giang + Đồng Tháp (TP. Mỹ Tho, Làng hoa Sa Đéc, Vườn Quốc gia Tràm Chim)', label: 'Tỉnh sau sáp nhập (Miền Tây)' },
  33: { details: 'Bạc Liêu + Cà Mau (Mũi Cà Mau, Nhà Công tử Bạc Liêu, Cánh đồng điện gió)', label: 'Tỉnh sau sáp nhập (Cực Nam Tổ quốc)' },
  34: { details: 'An Giang + Kiên Giang (Đảo Phú Quốc, TP. Rạch Giá, Châu Đốc, Rừng tràm Trà Sư)', label: 'Tỉnh sau sáp nhập (Biên giới Tây Nam - Phú Quốc)' },
};

// ══════════════════════════════════════════════════════════════════════════════
// 34 ĐƠN VỊ HÀNH CHÍNH CẤP TỈNH SAU SÁP NHẬP (DỮ LIỆU VECTOR GIS 100% CHÍNH XÁC)
// ══════════════════════════════════════════════════════════════════════════════
export const VIETNAM_34_MERGED_PROVINCES: AdminBoundaryItem[] = (
  (VIETNAM_34_MERGED_DATA as FeatureCollection).features || []
).map((feature: any) => {
  const code = feature.properties.code || 1;
  const name = feature.properties.name || 'Tỉnh';
  const meta = MERGED_DETAILS_MAP[code] || { details: feature.properties.merged_from || name, label: 'Tỉnh / TP' };
  const bbox = computeBboxFromGeoJSON(feature as Feature);
  const centerLng = (bbox[0] + bbox[2]) / 2;
  const centerLat = (bbox[1] + bbox[3]) / 2;

  const lngSpan = bbox[2] - bbox[0];
  const latSpan = bbox[3] - bbox[1];
  const span = Math.max(lngSpan, latSpan);
  const zoom = span < 0.8 ? 9.6 : span < 1.5 ? 9.0 : span < 2.5 ? 8.5 : 8.0;

  return {
    id: `vn-34-${code < 10 ? '0' + code : code}`,
    code,
    name,
    fullName: `${code}. ${name}${meta.details !== name ? ` (${meta.details})` : ''}`,
    mergedDetails: meta.details,
    level: 'province',
    levelLabel: meta.label,
    coords: [Number(centerLng.toFixed(4)), Number(centerLat.toFixed(4))],
    zoom,
    bbox,
    geojson: feature as Feature,
  };
});

// ── TP. QUY NHƠN & CÁC PHƯỜNG MỚI SAU SÁP NHẬP ────────────────────────────
const QUYNHON_CITY_CONTOUR: [number, number][] = [
  [109.112, 13.795], [109.145, 13.840], [109.210, 13.848], [109.285, 13.855],
  [109.300, 13.810], [109.330, 13.785], [109.295, 13.740], [109.268, 13.705],
  [109.230, 13.715], [109.215, 13.750], [109.185, 13.765], [109.155, 13.750],
  [109.120, 13.705], [109.090, 13.735], [109.075, 13.770], [109.112, 13.795],
];

// ══════════════════════════════════════════════════════════════════════════════
// CÁC QUẬN / HUYỆN & XÃ / PHƯỜNG ĐỊNH DANH SẴN
// ══════════════════════════════════════════════════════════════════════════════
export const VIETNAM_ADMIN_DATABASE: AdminBoundaryItem[] = [
  ...VIETNAM_34_MERGED_PROVINCES,

  // ── TP. QUY NHƠN ────────────────────────────────────────────────────────
  {
    id: 'vn-city-quynhon',
    name: 'TP. Quy Nhơn',
    fullName: 'Thành phố Quy Nhơn, Tỉnh Gia Lai (Gia Lai + Bình Định sáp nhập)',
    mergedDetails: 'TP. Biển Quy Nhơn (Bán đảo Phương Mai, Đầm Thị Nại)',
    level: 'district',
    levelLabel: 'Thành phố loại I duyên hải',
    parentName: 'Gia Lai',
    provinceName: 'Gia Lai',
    coords: [109.2197, 13.7820],
    zoom: 12.8,
    bbox: [109.075, 13.670, 109.330, 13.855],
    geojson: {
      type: 'Feature',
      properties: { name: 'TP. Quy Nhơn' },
      geometry: { type: 'Polygon', coordinates: [QUYNHON_CITY_CONTOUR] },
    },
  },
  {
    id: 'vn-city-pleiku',
    name: 'TP. Pleiku',
    fullName: 'Thành phố Pleiku, Tỉnh Gia Lai (Gia Lai + Bình Định sáp nhập)',
    mergedDetails: 'TP. Pleiku (Biển Hồ T\'Nưng, Tây Nguyên)',
    level: 'district',
    levelLabel: 'Thành phố đô thị Tây Nguyên',
    parentName: 'Gia Lai',
    provinceName: 'Gia Lai',
    coords: [108.0021, 13.9833],
    zoom: 12.5,
    bbox: [107.92, 13.90, 108.10, 14.08],
  },
  {
    id: 'vn-ward-hadong-hn',
    name: 'Quận Hà Đông',
    fullName: 'Quận Hà Đông, TP. Hà Nội',
    level: 'district',
    levelLabel: 'Quận (Hà Nội)',
    parentName: 'TP. Hà Nội',
    provinceName: 'TP. Hà Nội',
    coords: [105.7766, 20.9719],
    zoom: 12.8,
    bbox: [105.73, 20.92, 105.82, 21.01],
  },
  {
    id: 'vn-ward-vanha-bg',
    name: 'Xã Vân Hà (Bắc Ninh - Bắc Giang)',
    fullName: 'Xã Vân Hà, Thị xã Việt Yên, Tỉnh Bắc Ninh (Bắc Giang)',
    level: 'ward',
    levelLabel: 'Xã (Làng gốm Thổ Hà cổ)',
    parentName: 'Thị xã Việt Yên',
    provinceName: 'Bắc Ninh',
    coords: [106.0125, 21.2058],
    zoom: 15.2,
    bbox: [105.995, 21.195, 106.030, 21.218],
  },
];

// Smart Query Disambiguator & Parser
export function parseSmartAdminQuery(query: string): { keyword: string; provinceHint?: string; levelHint?: string } {
  const clean = query.trim().toLowerCase();
  let levelHint: string | undefined;
  if (clean.includes('phường') || clean.includes('p.')) levelHint = 'ward';
  else if (clean.includes('xã') || clean.includes('x.')) levelHint = 'ward';
  else if (clean.includes('quận') || clean.includes('q.') || clean.includes('huyện') || clean.includes('h.')) levelHint = 'district';
  else if (clean.includes('tỉnh') || clean.includes('thành phố') || clean.includes('tp.')) levelHint = 'province';

  if (clean.includes(',')) {
    const parts = clean.split(',').map(s => s.trim());
    return {
      keyword: parts[0],
      provinceHint: parts[1],
      levelHint,
    };
  }

  return { keyword: clean, levelHint };
}

// Fetch live administrative boundary GeoJSON from Nominatim OSM API for tiny wards
export async function fetchLiveBoundaryGeoJSON(query: string): Promise<AdminBoundaryItem[]> {
  try {
    const encoded = encodeURIComponent(`${query}, Vietnam`);
    const url = `https://nominatim.openstreetmap.org/search?q=${encoded}&format=geojson&polygon_geojson=1&countrycodes=vn&addressdetails=1&limit=6`;

    const res = await fetch(url, {
      headers: {
        'Accept-Language': 'vi,en',
        'User-Agent': 'FiboMap-Cinematic-App/2.0',
      },
    });

    if (!res.ok) throw new Error('API network response not ok');
    const data = await res.json();

    if (!data || !data.features || data.features.length === 0) {
      return [];
    }

    const items: AdminBoundaryItem[] = data.features
      .filter((f: any) => f.geometry && (f.geometry.type === 'Polygon' || f.geometry.type === 'MultiPolygon'))
      .map((f: any, idx: number) => {
        const props = f.properties || {};
        const displayName = props.display_name || props.name || query;
        const name = props.name || query;
        const addresstype = props.addresstype || props.type || '';

        let level: 'province' | 'district' | 'ward' = 'ward';
        let levelLabel = 'Khu vực';
        let zoom = 14.5;

        if (addresstype === 'state' || addresstype === 'province' || addresstype === 'city') {
          level = 'province';
          levelLabel = 'Tỉnh / Thành phố';
          zoom = 9.3;
        } else if (addresstype === 'county' || addresstype === 'district' || addresstype === 'town') {
          level = 'district';
          levelLabel = 'Quận / Huyện';
          zoom = 12.0;
        } else if (addresstype === 'suburb' || addresstype === 'quarter' || addresstype === 'village') {
          level = 'ward';
          levelLabel = 'Xã / Phường';
          zoom = 15.0;
        }

        const bbox = computeBboxFromGeoJSON(f as Feature);
        const centerLng = (bbox[0] + bbox[2]) / 2;
        const centerLat = (bbox[1] + bbox[3]) / 2;

        return {
          id: `osm-${props.osm_id || idx}`,
          name,
          fullName: displayName,
          level,
          levelLabel,
          coords: [centerLng, centerLat] as [number, number],
          zoom,
          bbox,
          geojson: f as Feature,
        };
      });

    return items;
  } catch (err) {
    console.warn('Nominatim live boundary fetch failed, using fallback database:', err);
    return [];
  }
}

// Reverse Geocode click point on map to identify boundary at that coordinate
export async function identifyBoundaryFromClick(lng: number, lat: number): Promise<AdminBoundaryItem[]> {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=geojson&polygon_geojson=1&countrycodes=vn&addressdetails=1&zoom=10`;

    const res = await fetch(url, {
      headers: {
        'Accept-Language': 'vi,en',
        'User-Agent': 'FiboMap-Cinematic-App/2.0',
      },
    });

    if (!res.ok) throw new Error('Reverse geocode failed');
    const data = await res.json();

    if (!data || !data.features || data.features.length === 0) return [];

    return data.features
      .filter((f: any) => f.geometry && (f.geometry.type === 'Polygon' || f.geometry.type === 'MultiPolygon'))
      .map((f: any, idx: number) => {
        const props = f.properties || {};
        const name = props.name || props.display_name?.split(',')[0] || 'Vùng đã chọn';
        const bbox = computeBboxFromGeoJSON(f as Feature);

        return {
          id: `reverse-${props.osm_id || idx}`,
          name,
          fullName: props.display_name || name,
          level: 'province',
          levelLabel: 'Nhận dạng tự động',
          coords: [(bbox[0] + bbox[2]) / 2, (bbox[1] + bbox[3]) / 2],
          zoom: 9.5,
          bbox,
          geojson: f as Feature,
        };
      });
  } catch (err) {
    console.warn('Reverse geocoding click failed:', err);
    return [];
  }
}
