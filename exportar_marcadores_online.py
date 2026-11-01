"""
Exporta todos los marcadores online (español) a un Excel con una pestaña por categoría.
Requiere: pip install openpyxl
Ejecutar desde cualquier directorio: python exportar_marcadores_online.py
"""

import json
import os
import re
from pathlib import Path
from openpyxl import Workbook
from openpyxl.styles import PatternFill, Font, Alignment, Border, Side
from openpyxl.utils import get_column_letter

# ── Ruta base ────────────────────────────────────────────────────────────────
BASE = Path(__file__).parent / "gtaapp.client/src/assets/data/gta5/mapa/marcadores-mapa/online/idiomas/es"

# ── Archivos a procesar (nombre_pestaña → archivo/s) ────────────────────────
SOURCES = {
    "Actividades":        [BASE / "activities.json"],
    "Armerias":           [BASE / "armerias.json"],
    "Negocios":           [BASE / "businesses.json"],
    "Cayo Perico":        [BASE / "cayo_perico.json"],
    "Personajes":         [BASE / "characters.json"],
    "Coleccionables":     [BASE / "collectibles.json"],
    "Fauna":              [BASE / "fauna.json"],
    "Atracos":            [BASE / "heists.json"],
    "Lavaderos":          [BASE / "lavaderos.json"],
    "Misiones Online":    [BASE / "mapa-misiones-online.json"],
    "Mascaras":           [BASE / "mascaras.json"],
    "Misterios":          [BASE / "misterios-mapa-online.json"],
    "Vehiculos Pegasus":  [BASE / "pegasus_vehicles.json"],
    "Peluquerias":        [BASE / "peluquerias.json"],
    "Propiedades":        [BASE / "properties.json"],
    "Trabajos Rol":       [BASE / "roleplay_jobs.json"],
    "Serv. Emergencia":   [BASE / "servicios_emergencia.json"],
    "Lugares Extraños":   [BASE / "strange_places.json"],
    "Strip Club":         [BASE / "strip_club.json"],
    "Tatuajes":           [BASE / "tatuajes.json"],
    "Tiendas 24/7":       [BASE / "tiendas_24_7.json"],
    "Tiendas Ropa":       [BASE / "tiendas_ropa.json"],
    "Tiendas Vehiculos":  [BASE / "vehicle_shops.json"],
    "Armas":              [BASE / "weapons.json"],
    "Vehiculos (Tiendas)":[
        BASE / "vehicles/arena_war.json",
        BASE / "vehicles/bennys.json",
        BASE / "vehicles/docktease.json",
        BASE / "vehicles/elitas.json",
        BASE / "vehicles/legendarymotorsport.json",
        BASE / "vehicles/pedal_and_metal.json",
        BASE / "vehicles/pegasus.json",
        BASE / "vehicles/superautos.json",
        BASE / "vehicles/warstock.json",
    ],
}

# ── Columnas a extraer (campo_json → cabecera_excel) ─────────────────────────
COLUMNS = [
    ("categoria",    "Categoría"),
    ("id",           "ID"),
    ("nombre",       "Nombre"),
    ("zona",         "Zona"),
    ("x",            "Coord X"),
    ("y",            "Coord Y"),
    ("z",            "Coord Z"),
    ("precio",       "Precio"),
    ("ruta_imagen",  "Ruta Imagen"),
    ("game_mode",    "Modo"),
    ("descripcion",  "Descripción"),
]

# ── Extracción normalizada de un objeto JSON ──────────────────────────────────
def strip_html(text: str) -> str:
    """Elimina etiquetas HTML del campo description."""
    if not text:
        return ""
    return re.sub(r"<[^>]+>", "", str(text)).strip()

def extract(item: dict) -> dict:
    pos = item.get("position") or {}
    # Nombre: algunos archivos usan 'name', otros 'title'
    nombre = item.get("name") or item.get("title") or ""
    # Zona: 'zone' en casi todos
    zona = item.get("zone") or item.get("location") or ""
    # Precio: puede ser int o string
    precio = item.get("price")
    precio_fmt = item.get("priceFormatted") or ""
    if precio is not None:
        precio_val = precio_fmt if precio_fmt else str(precio)
    else:
        precio_val = precio_fmt
    # Imagen: 'imageUrl' o 'thumbnail'
    imagen = item.get("imageUrl") or item.get("thumbnail") or ""
    # gameMode
    game_mode = item.get("gameMode") or ""
    # Descripción limpia de HTML
    desc = strip_html(item.get("description") or "")
    # Categoría label
    cat = item.get("categoryLabel") or item.get("category") or ""

    return {
        "categoria":   cat,
        "id":          item.get("id") or "",
        "nombre":      nombre,
        "zona":        zona,
        "x":           pos.get("x") or "",
        "y":           pos.get("y") or "",
        "z":           pos.get("z") or "",
        "precio":      precio_val,
        "ruta_imagen": imagen,
        "game_mode":   game_mode,
        "descripcion": desc,
    }

# ── Estilos ───────────────────────────────────────────────────────────────────
HEADER_FILL   = PatternFill("solid", fgColor="1E3A5F")
HEADER_FONT   = Font(bold=True, color="FFFFFF", size=10)
HEADER_ALIGN  = Alignment(horizontal="center", vertical="center", wrap_text=False)
ALT_FILL      = PatternFill("solid", fgColor="EEF2F7")
NORMAL_ALIGN  = Alignment(vertical="top", wrap_text=True)
THIN          = Side(border_style="thin", color="CCCCCC")
CELL_BORDER   = Border(left=THIN, right=THIN, top=THIN, bottom=THIN)

COL_WIDTHS = {
    "Categoría":    22,
    "ID":           30,
    "Nombre":       32,
    "Zona":         24,
    "Coord X":      10,
    "Coord Y":      10,
    "Coord Z":      10,
    "Precio":       14,
    "Ruta Imagen":  48,
    "Modo":         10,
    "Descripción":  60,
}

def style_sheet(ws, rows_written: int):
    """Aplica estilos a cabecera, filas alternas y anchos."""
    headers = [c[1] for c in COLUMNS]

    # Cabecera
    for col_idx, hdr in enumerate(headers, 1):
        cell = ws.cell(row=1, column=col_idx)
        cell.fill   = HEADER_FILL
        cell.font   = HEADER_FONT
        cell.alignment = HEADER_ALIGN
        cell.border = CELL_BORDER
        ws.column_dimensions[get_column_letter(col_idx)].width = COL_WIDTHS.get(hdr, 18)

    # Filas de datos
    for row_idx in range(2, rows_written + 2):
        fill = ALT_FILL if row_idx % 2 == 0 else None
        for col_idx in range(1, len(headers) + 1):
            cell = ws.cell(row=row_idx, column=col_idx)
            cell.alignment = NORMAL_ALIGN
            cell.border    = CELL_BORDER
            if fill:
                cell.fill = fill

    ws.row_dimensions[1].height = 22
    ws.freeze_panes = "A2"

# ── Main ──────────────────────────────────────────────────────────────────────
def main():
    wb = Workbook()
    wb.remove(wb.active)  # quita la hoja vacía por defecto

    total_registros = 0

    for sheet_name, files in SOURCES.items():
        rows = []
        for filepath in files:
            if not filepath.exists():
                print(f"  ⚠  No encontrado: {filepath.name}")
                continue
            with open(filepath, encoding="utf-8") as f:
                try:
                    data = json.load(f)
                except json.JSONDecodeError as e:
                    print(f"  ✗  JSON inválido en {filepath.name}: {e}")
                    continue
            if isinstance(data, list):
                for item in data:
                    if isinstance(item, dict):
                        rows.append(extract(item))
            elif isinstance(data, dict):
                rows.append(extract(data))

        ws = wb.create_sheet(title=sheet_name[:31])  # Excel max 31 chars
        headers = [c[1] for c in COLUMNS]
        ws.append(headers)

        for row in rows:
            ws.append([row[c[0]] for c in COLUMNS])

        style_sheet(ws, len(rows))
        total_registros += len(rows)
        print(f"  ✓  {sheet_name:<25} → {len(rows):>4} registros")

    # Hoja resumen
    ws_sum = wb.create_sheet(title="RESUMEN", index=0)
    ws_sum.append(["Pestaña", "Registros"])
    ws_sum.column_dimensions["A"].width = 30
    ws_sum.column_dimensions["B"].width = 12
    for col_idx in range(1, 3):
        cell = ws_sum.cell(row=1, column=col_idx)
        cell.fill  = HEADER_FILL
        cell.font  = HEADER_FONT
        cell.alignment = HEADER_ALIGN

    for i, (sheet_name, files) in enumerate(SOURCES.items(), 2):
        ws_sum.cell(row=i, column=1, value=sheet_name)
        # obtener recuento desde la hoja ya creada
        target = wb[sheet_name[:31]]
        count  = target.max_row - 1
        ws_sum.cell(row=i, column=2, value=count)

    ws_sum.append(["TOTAL", total_registros])
    last = ws_sum.max_row
    ws_sum.cell(last, 1).font = Font(bold=True)
    ws_sum.cell(last, 2).font = Font(bold=True)

    out_path = Path(__file__).parent / "marcadores_online_es.xlsx"
    wb.save(out_path)
    print(f"\n✅  Excel generado: {out_path}")
    print(f"   Total registros: {total_registros}")

if __name__ == "__main__":
    main()
