/**
 * Utilidad pura para sanitizar cadenas de texto antes de interpolarlas en plantillas HTML dinámicas (Leaflet popups, tooltips).
 * Previene vulnerabilidades de Cross-Site Scripting (XSS).
 */
export function escapeHtml(str: string | null | undefined): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
