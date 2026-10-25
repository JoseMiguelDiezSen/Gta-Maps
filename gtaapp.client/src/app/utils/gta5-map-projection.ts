/**
 * Utilidades matemáticas puras para transformaciones cartográficas entre el
 * sistema de coordenadas in-game de GTA V (mundo) y la proyección de Leaflet [lat, lng].
 * Soporta Los Santos (Estándar / Satélite HD) y Cayo Perico.
 */

export interface MapProjectionOptions {
  mapType?: string;      // 'Satellite', 'Atlas', 'Road', etc.
  selectedCity?: string; // 'ls' (Los Santos), 'cp' (Cayo Perico)
}

/**
 * Convierte coordenadas in-game del mundo de GTA (X, Y) a coordenadas Leaflet [lat, lng].
 */
export function gta5WorldToLatLng(
  x: number,
  y: number,
  options?: MapProjectionOptions
): [number, number] {
  // Conversión para Cayo Perico
  if (options?.selectedCity === 'cp') {
    const ptX = ((x - 3700) / 2000) * 10000;
    const ptY = ((-4150 - y) / 2000) * 10000;
    const lat = -ptY / 64;
    const lng = ptX / 64;
    return [lat, lng];
  }

  // Conversión para mapa Satélite HD de Los Santos
  if (options?.mapType === 'Satellite') {
    const lng = 128 * ((x + 4140) / 9000);
    const lat = -192 * ((8400 - y) / 13500);
    return [lat, lng];
  }

  // Conversión estándar (Atlas, Road, etc.)
  const originX = 3753.6;
  const originY = 5529.6;
  const scale = 0.660;
  const px = originX + scale * x;
  const py = originY - scale * y;
  return [-py / 128, px / 128];
}

/**
 * Convierte coordenadas Leaflet (lat, lng) a coordenadas in-game del mundo de GTA (X, Y).
 */
export function gta5LatLngToWorld(
  lat: number,
  lng: number,
  options?: MapProjectionOptions
): { x: number; y: number } {
  // Conversión para Cayo Perico
  if (options?.selectedCity === 'cp') {
    const ptX = lng * 64;
    const ptY = -lat * 64;
    const x = (ptX / 10000) * 2000 + 3700;
    const y = -4150 - (ptY / 10000) * 2000;
    return {
      x: Math.round(x * 10) / 10,
      y: Math.round(y * 10) / 10
    };
  }

  // Conversión para mapa Satélite HD de Los Santos
  if (options?.mapType === 'Satellite') {
    return {
      x: Math.round(((lng / 128) * 9000 - 4140) * 10) / 10,
      y: Math.round((8400 - (-lat / 192) * 13500) * 10) / 10
    };
  }

  // Conversión estándar
  const originX = 3753.6;
  const originY = 5529.6;
  const scale = 0.660;
  const px = lng * 128;
  const py = -lat * 128;
  return {
    x: Math.round(((px - originX) / scale) * 10) / 10,
    y: Math.round(((originY - py) / scale) * 10) / 10
  };
}
