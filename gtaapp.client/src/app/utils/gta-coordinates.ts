/**
 * Utilidades matemáticas para la conversión de coordenadas y proyecciones
 * del mapa oficial de GTA V (8192x8192 px) a Leaflet CRS.Simple.
 */
export class GtaCoordinates {
    static readonly ORIGIN_X = 3753.6;
    static readonly ORIGIN_Y = 5529.6;
    static readonly SCALE = 0.660; // 0.660 px por metro oficial en el juego

    /**
     * Convierte coordenadas de mundo del juego GTA V (X, Y) a coordenadas Leaflet CRS.Simple [lat, lng].
     */
    static worldToLatLng(x: number, y: number): [number, number] {
        const px = this.ORIGIN_X + (this.SCALE * x);
        const py = this.ORIGIN_Y - (this.SCALE * y);

        const lat = -py / 128;
        const lng = px / 128;
        return [lat, lng];
    }

    /**
     * Convierte coordenadas Leaflet CRS.Simple (lat, lng) a coordenadas mundiales del juego GTA V (X, Y).
     * Función inversa exacta de worldToLatLng para telemetría y ajuste manual.
     */
    static latLngToWorld(lat: number, lng: number): { x: number; y: number } {
        const px = lng * 128;
        const py = -lat * 128;

        const x = (px - this.ORIGIN_X) / this.SCALE;
        const y = (this.ORIGIN_Y - py) / this.SCALE;

        return {
            x: Math.round(x * 10) / 10,
            y: Math.round(y * 10) / 10
        };
    }

    /**
     * Calcula el zoom mínimo permitido para que el mapa no se reduzca más allá del ancho del contenedor.
     */
    static computeMinZoom(imageSize: number, maxZoom: number, containerWidth: number): number {
        if (containerWidth <= 0) return 2;
        const min = maxZoom + Math.log2(containerWidth / imageSize);
        return Math.min(maxZoom, Math.max(1, Math.ceil(min)));
    }
}
