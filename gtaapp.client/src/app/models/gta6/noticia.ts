export type CategoriaNoticia = 'oficial' | 'mecanicas' | 'mundo' | 'filtraciones';

export interface NoticiaSeccion {
  subtitulo?: string;
  parrafos: string[];
  destacado?: string;
  imagenSecundariaUrl?: string;
  pieDeFoto?: string;
}

export interface NoticiaItem {
  id: string;
  slug: string;
  titulo: string;
  subtitulo: string;
  categoria: CategoriaNoticia;
  badge: string;
  fecha: string;
  autor: string;
  tiempoLecturaMinutos: number;
  imagenUrl?: string;
  pieDeFoto?: string;
  destacada?: boolean;
  secciones: NoticiaSeccion[];
}

export interface CategoriaFiltroItem {
  id: string;
  label: string;
}
