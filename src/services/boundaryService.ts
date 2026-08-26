import type { Feature, FeatureCollection } from 'geojson';
import VIETNAM_34_MERGED_DATA from '../data/vietnam_34_merged.json';
import VIETNAM_63_PROVINCES_DATA from '../data/vietnam_provinces.json';

export interface AdminBoundaryItem {
  id: string;
  code?: number;
  name: string;
  fullName: string;
  mergedDetails?: string;
  level: 'country' | 'province' | 'district' | 'ward';
  levelLabel: string;
  parentName?: string;
  provinceName?: string;
  coords: [number, number]; // [lng, lat]
  zoom: number;
  bbox: [number, number, number, number]; // [minLng, minLat, maxLng, maxLat]
  geojson?: Feature;
}

// ══════════════════════════════════════════════════════════════════════════════
// DANH SÁCH CÁC QUỐC GIA TRÊN THẾ GIỚI (WORLD COUNTRIES DATABASE)
// ══════════════════════════════════════════════════════════════════════════════
export const WORLD_COUNTRIES_DATABASE: AdminBoundaryItem[] = [
  {
    id: 'country-vietnam',
    name: 'Việt Nam',
    fullName: 'Cộng hòa Xã hội Chủ nghĩa Việt Nam',
    mergedDetails: 'Vietnam',
    level: 'country',
    levelLabel: 'Quốc gia 🇻🇳',
    coords: [108.2772, 14.0583],
    zoom: 5.5,
    bbox: [102.1444, 8.5629, 109.4646, 23.3934],
  },
  {
    id: 'country-usa',
    name: 'Hoa Kỳ (Mỹ)',
    fullName: 'Hợp chúng quốc Hoa Kỳ (United States)',
    mergedDetails: 'USA, United States of America, My',
    level: 'country',
    levelLabel: 'Quốc gia 🇺🇸',
    coords: [-95.7129, 37.0902],
    zoom: 3.8,
    bbox: [-125.0, 24.5, -66.9, 49.4],
  },
  {
    id: 'country-china',
    name: 'Trung Quốc',
    fullName: 'Cộng hòa Nhân dân Trung Hoa (China)',
    mergedDetails: 'China, PRC',
    level: 'country',
    levelLabel: 'Quốc gia 🇨🇳',
    coords: [104.1954, 35.8617],
    zoom: 3.8,
    bbox: [73.5, 18.1, 134.8, 53.6],
  },
  {
    id: 'country-japan',
    name: 'Nhật Bản',
    fullName: 'Nhật Bản (Japan)',
    mergedDetails: 'Japan, Nippon',
    level: 'country',
    levelLabel: 'Quốc gia 🇯🇵',
    coords: [138.2529, 36.2048],
    zoom: 5.0,
    bbox: [129.5, 30.5, 145.8, 45.6],
  },
  {
    id: 'country-korea',
    name: 'Hàn Quốc',
    fullName: 'Đại Hàn Dân Quốc (South Korea)',
    mergedDetails: 'South Korea, Republic of Korea',
    level: 'country',
    levelLabel: 'Quốc gia 🇰🇷',
    coords: [127.7669, 35.9078],
    zoom: 6.2,
    bbox: [125.9, 33.1, 129.6, 38.6],
  },
  {
    id: 'country-north-korea',
    name: 'Triều Tiên',
    fullName: 'Cộng hòa Dân chủ Nhân dân Triều Tiên (North Korea)',
    mergedDetails: 'North Korea, DPRK',
    level: 'country',
    levelLabel: 'Quốc gia 🇰🇵',
    coords: [127.5101, 40.3399],
    zoom: 6.2,
    bbox: [124.2, 37.6, 130.7, 43.0],
  },
  {
    id: 'country-russia',
    name: 'Nga',
    fullName: 'Liên bang Nga (Russia)',
    mergedDetails: 'Russia, Russian Federation',
    level: 'country',
    levelLabel: 'Quốc gia 🇷🇺',
    coords: [105.3188, 61.5240],
    zoom: 3.0,
    bbox: [27.0, 41.2, 180.0, 81.8],
  },
  {
    id: 'country-france',
    name: 'Pháp',
    fullName: 'Cộng hòa Pháp (France)',
    mergedDetails: 'France',
    level: 'country',
    levelLabel: 'Quốc gia 🇫🇷',
    coords: [2.2137, 46.2276],
    zoom: 5.2,
    bbox: [-4.8, 41.3, 9.6, 51.1],
  },
  {
    id: 'country-germany',
    name: 'Đức',
    fullName: 'Cộng hòa Liên bang Đức (Germany)',
    mergedDetails: 'Germany, Deutschland',
    level: 'country',
    levelLabel: 'Quốc gia 🇩🇪',
    coords: [10.4515, 51.1657],
    zoom: 5.5,
    bbox: [5.8, 47.2, 15.0, 55.1],
  },
  {
    id: 'country-uk',
    name: 'Vương quốc Anh',
    fullName: 'Liên hiệp Vương quốc Anh và Bắc Ireland (United Kingdom)',
    mergedDetails: 'UK, Great Britain, England, Anh',
    level: 'country',
    levelLabel: 'Quốc gia 🇬🇧',
    coords: [-3.4360, 55.3781],
    zoom: 5.2,
    bbox: [-8.6, 49.9, 1.8, 58.7],
  },
  {
    id: 'country-italy',
    name: 'Ý (Italia)',
    fullName: 'Cộng hòa Ý (Italy)',
    mergedDetails: 'Italy, Italia, Y',
    level: 'country',
    levelLabel: 'Quốc gia 🇮🇹',
    coords: [12.5674, 41.8719],
    zoom: 5.5,
    bbox: [6.6, 35.5, 18.5, 47.1],
  },
  {
    id: 'country-spain',
    name: 'Tây Ban Nha',
    fullName: 'Vương quốc Tây Ban Nha (Spain)',
    mergedDetails: 'Spain, España',
    level: 'country',
    levelLabel: 'Quốc gia 🇪🇸',
    coords: [-3.7492, 40.4637],
    zoom: 5.2,
    bbox: [-9.3, 35.9, 3.3, 43.8],
  },
  {
    id: 'country-thailand',
    name: 'Thái Lan',
    fullName: 'Vương quốc Thái Lan (Thailand)',
    mergedDetails: 'Thailand, Siam',
    level: 'country',
    levelLabel: 'Quốc gia 🇹🇭',
    coords: [100.9925, 15.8700],
    zoom: 5.5,
    bbox: [97.3, 5.6, 105.6, 20.5],
  },
  {
    id: 'country-laos',
    name: 'Lào',
    fullName: 'Cộng hòa Dân chủ Nhân dân Lào (Laos)',
    mergedDetails: 'Laos',
    level: 'country',
    levelLabel: 'Quốc gia 🇱🇦',
    coords: [102.4955, 19.8563],
    zoom: 5.8,
    bbox: [100.1, 13.9, 107.7, 22.5],
  },
  {
    id: 'country-cambodia',
    name: 'Campuchia',
    fullName: 'Vương quốc Campuchia (Cambodia)',
    mergedDetails: 'Cambodia, Kampuchea',
    level: 'country',
    levelLabel: 'Quốc gia 🇰🇭',
    coords: [104.9910, 12.5657],
    zoom: 6.2,
    bbox: [102.3, 10.4, 107.6, 14.7],
  },
  {
    id: 'country-singapore',
    name: 'Singapore',
    fullName: 'Cộng hòa Singapore',
    mergedDetails: 'Singapore',
    level: 'country',
    levelLabel: 'Quốc gia 🇸🇬',
    coords: [103.8198, 1.3521],
    zoom: 10.5,
    bbox: [103.6, 1.15, 104.1, 1.48],
  },
  {
    id: 'country-indonesia',
    name: 'Indonesia',
    fullName: 'Cộng hòa Indonesia',
    mergedDetails: 'Indonesia',
    level: 'country',
    levelLabel: 'Quốc gia 🇮🇩',
    coords: [113.9213, -0.7893],
    zoom: 4.2,
    bbox: [95.0, -11.0, 141.0, 6.0],
  },
  {
    id: 'country-malaysia',
    name: 'Malaysia',
    fullName: 'Liên bang Malaysia',
    mergedDetails: 'Malaysia',
    level: 'country',
    levelLabel: 'Quốc gia 🇲🇾',
    coords: [101.9758, 4.2105],
    zoom: 5.5,
    bbox: [99.6, 0.8, 119.3, 7.4],
  },
  {
    id: 'country-philippines',
    name: 'Philippines',
    fullName: 'Cộng hòa Philippines',
    mergedDetails: 'Philippines',
    level: 'country',
    levelLabel: 'Quốc gia 🇵🇭',
    coords: [121.7740, 12.8797],
    zoom: 5.2,
    bbox: [116.9, 4.6, 126.6, 21.1],
  },
  {
    id: 'country-myanmar',
    name: 'Myanmar (Miến Điện)',
    fullName: 'Cộng hòa Liên bang Myanmar',
    mergedDetails: 'Myanmar, Burma',
    level: 'country',
    levelLabel: 'Quốc gia 🇲🇲',
    coords: [95.9560, 21.9162],
    zoom: 5.2,
    bbox: [92.2, 9.6, 101.2, 28.5],
  },
  {
    id: 'country-australia',
    name: 'Úc (Australia)',
    fullName: 'Thịnh vượng chung Úc (Australia)',
    mergedDetails: 'Australia, Uc',
    level: 'country',
    levelLabel: 'Quốc gia 🇦🇺',
    coords: [133.7751, -25.2744],
    zoom: 3.8,
    bbox: [112.9, -43.6, 153.6, -10.7],
  },
  {
    id: 'country-canada',
    name: 'Canada',
    fullName: 'Canada',
    mergedDetails: 'Canada',
    level: 'country',
    levelLabel: 'Quốc gia 🇨🇦',
    coords: [-106.3468, 56.1304],
    zoom: 3.2,
    bbox: [-141.0, 41.7, -52.6, 83.1],
  },
  {
    id: 'country-brazil',
    name: 'Brazil (Brasil)',
    fullName: 'Cộng hòa Liên bang Brazil',
    mergedDetails: 'Brazil, Brasil',
    level: 'country',
    levelLabel: 'Quốc gia 🇧🇷',
    coords: [-51.9253, -14.2350],
    zoom: 3.8,
    bbox: [-73.9, -33.7, -34.8, 5.3],
  },
  {
    id: 'country-india',
    name: 'Ấn Độ',
    fullName: 'Cộng hòa Ấn Độ (India)',
    mergedDetails: 'India, Bharat, An Do',
    level: 'country',
    levelLabel: 'Quốc gia 🇮🇳',
    coords: [78.9629, 20.5937],
    zoom: 4.2,
    bbox: [68.1, 6.7, 97.4, 35.5],
  },
  {
    id: 'country-egypt',
    name: 'Ai Cập',
    fullName: 'Cộng hòa Ả Rập Ai Cập (Egypt)',
    mergedDetails: 'Egypt, Ai Cap',
    level: 'country',
    levelLabel: 'Quốc gia 🇪🇬',
    coords: [30.8025, 26.8206],
    zoom: 5.2,
    bbox: [24.7, 22.0, 36.9, 31.7],
  },
  {
    id: 'country-uae',
    name: 'Các Tiểu vương quốc Ả Rập Thống nhất (UAE)',
    fullName: 'United Arab Emirates (Dubai, Abu Dhabi)',
    mergedDetails: 'UAE, Dubai, Abu Dhabi',
    level: 'country',
    levelLabel: 'Quốc gia 🇦🇪',
    coords: [53.8478, 23.4241],
    zoom: 6.5,
    bbox: [51.5, 22.6, 56.4, 26.1],
  },
  {
    id: 'country-saudi',
    name: 'Ả Rập Xê Út',
    fullName: 'Vương quốc Ả Rập Xê Út (Saudi Arabia)',
    mergedDetails: 'Saudi Arabia',
    level: 'country',
    levelLabel: 'Quốc gia 🇸🇦',
    coords: [45.0792, 23.8859],
    zoom: 4.8,
    bbox: [34.5, 16.3, 55.7, 32.2],
  },
  {
    id: 'country-switzerland',
    name: 'Thụy Sĩ',
    fullName: 'Liên bang Thụy Sĩ (Switzerland)',
    mergedDetails: 'Switzerland, Schweiz, Thuy Si',
    level: 'country',
    levelLabel: 'Quốc gia 🇨🇭',
    coords: [8.2275, 46.8182],
    zoom: 6.8,
    bbox: [5.9, 45.8, 10.5, 47.8],
  },
  {
    id: 'country-netherlands',
    name: 'Hà Lan',
    fullName: 'Vương quốc Hà Lan (Netherlands)',
    mergedDetails: 'Netherlands, Holland, Ha Lan',
    level: 'country',
    levelLabel: 'Quốc gia 🇳🇱',
    coords: [5.2913, 52.1326],
    zoom: 6.8,
    bbox: [3.3, 50.7, 7.2, 53.6],
  },
  {
    id: 'country-argentina',
    name: 'Argentina',
    fullName: 'Cộng hòa Argentina',
    mergedDetails: 'Argentina',
    level: 'country',
    levelLabel: 'Quốc gia 🇦🇷',
    coords: [-63.6167, -38.4161],
    zoom: 3.8,
    bbox: [-73.6, -55.1, -53.6, -21.8],
  },
  {
    id: 'country-cuba',
    name: 'Cuba',
    fullName: 'Cộng hòa Cuba',
    mergedDetails: 'Cuba',
    level: 'country',
    levelLabel: 'Quốc gia 🇨🇺',
    coords: [-77.7812, 21.5218],
    zoom: 6.0,
    bbox: [-85.0, 19.8, -74.1, 23.3],
  },
];

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

export const VIETNAM_63_PROVINCES: AdminBoundaryItem[] = (
  ((VIETNAM_63_PROVINCES_DATA as unknown as FeatureCollection).features || []) as any[]
).map((feature: any, idx: number) => {
  const props = feature.properties || {};
  const name = props.name_vi || props.name || 'Tỉnh';
  const bbox = feature.bbox || computeBboxFromGeoJSON(feature as Feature);
  const centerLng = props.longitude || (bbox[0] + bbox[2]) / 2;
  const centerLat = props.latitude || (bbox[1] + bbox[3]) / 2;

  return {
    id: `vn-63-${props.adm1_code || idx}`,
    name,
    fullName: `Tỉnh / Thành phố ${name}`,
    level: 'province',
    levelLabel: props.type || 'Tỉnh / Thành phố',
    coords: [Number(centerLng), Number(centerLat)],
    zoom: 9.5,
    bbox: [bbox[0], bbox[1], bbox[2], bbox[3]],
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
  ...WORLD_COUNTRIES_DATABASE,
  ...VIETNAM_34_MERGED_PROVINCES,
  ...VIETNAM_63_PROVINCES,

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
