export type CategoriaVideo = 'historia' | 'online';

export interface VideoItem {
  id: string;
  slug: string;
  titulo: string;
  descripcion: string;
  categoria: CategoriaVideo;
  badge: string;
  fecha: string;
  hora?: string;
  videoUrl?: string;
  thumbnailUrl?: string;
  duracionSegundos?: number;
  destacado?: boolean;
}

export interface CategoriaFiltroVideo {
  id: CategoriaVideo;
  labelKey: string;
  icono?: string;
}
