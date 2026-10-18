export type CategoriaMomento = 'todas' | 'npc' | 'fauna' | 'policia' | 'fisicas' | 'mundo';

export interface MomentoItem {
  id: string;
  slug: string;
  titulo: string;
  descripcion: string;
  categoria: CategoriaMomento;
  badge: string;
  fecha: string;
  hora?: string;
  videoUrl?: string;
  thumbnailUrl?: string;
  duracionSegundos?: number;
  destacado?: boolean;
}

export interface CategoriaFiltroMomento {
  id: CategoriaMomento;
  label: string;
  icono?: string;
}
