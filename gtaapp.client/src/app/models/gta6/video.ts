export type CategoriaVideo = 'todas' | 'npc' | 'fauna' | 'policia' | 'fisicas' | 'mundo';

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
  label: string;
  icono?: string;
}
