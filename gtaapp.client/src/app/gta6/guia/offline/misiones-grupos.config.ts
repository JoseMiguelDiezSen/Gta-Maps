/** Grupo desplegable del panel Misiones Principales de la guía GTA 6 (Modo Historia). */
export interface GrupoMisionesGta6 {
  id: string;
  titulo: string;
  /** Valor del campo `badge` de las misiones que pertenecen al grupo. */
  badge: string;
  icono: string;
  color: string;
}

export const GRUPOS_MISIONES_GTA6: ReadonlyArray<GrupoMisionesGta6> = [
  { id: 'duo', titulo: 'Jason y Lucia (Dúo)', badge: 'Dúo', icono: 'people-arrows', color: '#8b5cf6' },
  { id: 'lucia', titulo: 'Lucia Caminos', badge: 'Lucia', icono: 'user-ninja', color: '#ec4899' },
  { id: 'jason', titulo: 'Jason Duval', badge: 'Jason', icono: 'user-secret', color: '#3b82f6' }
];
