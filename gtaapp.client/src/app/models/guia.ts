export interface GuiaManifest {
  id: string;
  juego: string;
  titulo: string;
  descripcion: string;
  bannerUrl: string;
  secciones: GuiaSeccion[];
}

export interface GuiaSeccion {
  id: string;
  titulo: string;
  icono: string;
  descripcion: string;
  orden: number;
  articulos: GuiaArticuloResumen[];
}

export interface GuiaArticuloResumen {
  id: string;
  titulo: string;
  subtitulo: string;
  slug: string;
  categoria: string;
  badge?: string;
  tiempoLecturaMinutos: number;
}

export interface GuiaArticuloRelacionado {
  id: string;
  titulo: string;
  slug: string;
}

export type TrofeoTipo = 'platino' | 'oro' | 'plata' | 'bronce';
export type TrofeoModo = 'historia' | 'online' | 'ambos';

export interface TrofeoItem {
  id: string;
  nombre: string;
  descripcion: string;
  tipo: TrofeoTipo;
  modo: TrofeoModo;
  pista?: string;
}

export interface TrofeosResumen {
  total: number;
  platino: number;
  oro: number;
  plata: number;
  bronce: number;
}

export interface TrofeosCatalogo {
  juego: string;
  plataforma: string;
  resumen: TrofeosResumen;
  trofeos: TrofeoItem[];
}

export interface GuiaArticulo extends GuiaArticuloResumen {
  contenidoMarkdown: string;
  imagen?: string;
  imagenPrincipalUrl?: string;
  tags: string[];
  ultimaActualizacion: string;
  relacionados: GuiaArticuloRelacionado[];
  sinopsis?: string;
  recompensa?: string;
  desbloqueadoTras?: string;
  requisitosOro?: string[];
  contacto?: string;
  protagonistas?: string[];
}
