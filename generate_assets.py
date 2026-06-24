"""Genera favicon.ico multi-res y og-image.png para ABISMOX.

Salida:
  favicon.ico  (16, 32, 48 multi-res)
  og-image.png (1200x630)
"""
from PIL import Image, ImageDraw, ImageFont
from pathlib import Path

ROOT = Path(__file__).parent

# Colores ABISMOX
MAGENTA = (255, 20, 147)
CYAN = (0, 255, 255)
VERDE = (0, 255, 0)
NARANJA = (255, 140, 0)
NEGRO = (0, 0, 0)


def draw_letter_a(size: int) -> Image.Image:
    """Dibuja una 'A' pixel-art magenta con glow cyan a `size`x`size`."""
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    px = img.load()

    # Patrón 'A' en grid de 16x16 lógico, escalado a size
    grid = [
        "................",
        "................",
        "........XX......",
        ".......XYYX.....",
        "......XYYYYX....",
        "......XYYYYX....",
        ".....XYYYYYYX...",
        ".....XYYYYYYX...",
        "....XYYXXXXYYX..",
        "....XYYXXXXYYX..",
        "...XYYYYYYYYYYX.",
        "..XYYYYYYYYYYYYX",
        "..XYYYYYYYYYYYYX",
        ".XYYYYYYYYYYYYYX",
        ".X............X.",
        "................",
    ]
    X = MAGENTA
    Y = CYAN
    grid_h = len(grid)
    grid_w = len(grid[0])
    cell = size / grid_w

    # Glow cyan por detrás
    for gy in range(grid_h):
        for gx in range(grid_w):
            if grid[gy][gx] in ("X", "Y"):
                cx = int(gx * cell + cell / 2)
                cy = int(gy * cell + cell / 2)
                for ox in (-1, 0, 1):
                    for oy in (-1, 0, 1):
                        nx = cx + ox
                        ny = cy + oy
                        if 0 <= nx < size and 0 <= ny < size:
                            existing = px[nx, ny]
                            if existing[3] < 200:
                                px[nx, ny] = (0, 255, 255, 60)

    # Cuerpo principal de la A
    for gy in range(grid_h):
        for gx in range(grid_w):
            ch = grid[gy][gx]
            if ch == "X":
                color = MAGENTA
            elif ch == "Y":
                color = CYAN
            else:
                continue
            x0 = int(gx * cell)
            y0 = int(gy * cell)
            x1 = int((gx + 1) * cell)
            y1 = int((gy + 1) * cell)
            for x in range(x0, x1):
                for y in range(y0, y1):
                    if 0 <= x < size and 0 <= y < size:
                        px[x, y] = color + (255,)

    # Borde negro exterior (1px)
    borde_img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    bpx = borde_img.load()
    for x in range(size):
        for y in range(size):
            if px[x, y][3] > 0:
                for ox in (-1, 0, 1):
                    for oy in (-1, 0, 1):
                        nx = x + ox
                        ny = y + oy
                        if 0 <= nx < size and 0 <= ny < size and px[nx, ny][3] == 0:
                            bpx[nx, ny] = (0, 0, 0, 255)
    final = Image.alpha_composite(borde_img, img)
    return final


def make_favicon() -> None:
    sizes = [16, 32, 48]
    # ICO format: usar el de mayor tamaño como base + ICOFile writer interno
    # Pillow requiere que el archivo se guarde con cada tamaño embebido
    # Estrategia: crear un archivo temporal por tamaño y combinarlos en ICO
    from PIL import IcoImagePlugin

    images = [draw_letter_a(s) for s in sizes]
    out = ROOT / "favicon.ico"

    # Pillow ICO writer acepta sizes kwarg, debe guardar todas las versiones
    # en una sola llamada save() con la imagen más grande + sizes list
    biggest = images[-1]  # 48x48
    biggest.save(
        out,
        format="ICO",
        sizes=[(s, s) for s in sizes],
    )
    print(f"Generado: {out} ({sizes})")

    # Verificar
    from PIL import Image
    with Image.open(out) as ico:
        ico.load()
        print(f"  Verificado: {ico.ico.sizes()}")


def draw_scanlines(draw: ImageDraw.ImageDraw, w: int, h: int) -> None:
    """Overlay de scanlines retro sutiles."""
    for y in range(0, h, 4):
        draw.line([(0, y), (w, y)], fill=(0, 0, 0, 40), width=1)


def make_og_image() -> None:
    w, h = 1200, 630
    img = Image.new("RGB", (w, h), NEGRO)
    draw = ImageDraw.Draw(img, "RGBA")

    # Marco magenta
    draw.rectangle([(0, 0), (w - 1, h - 1)], outline=MAGENTA, width=6)

    # Esquinas pixel-deco
    deco_size = 14
    esquinas_color = [MAGENTA, CYAN, NARANJA, VERDE]
    esquinas = [
        (20, 20),
        (w - 20 - deco_size, 20),
        (20, h - 20 - deco_size),
        (w - 20 - deco_size, h - 20 - deco_size),
    ]
    for (ex, ey), color in zip(esquinas, esquinas_color):
        draw.rectangle([(ex, ey), (ex + deco_size, ey + deco_size)], fill=color)

    # Texto "ABISMOX" - pixel art simulado con bloques
    # Buscar fuente pixel-art del sistema o fallback
    font_path = None
    for candidate in [
        "C:/Windows/Fonts/PressStart2P-Regular.ttf",
        "C:/Windows/Fonts/Consola.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSansMono-Bold.ttf",
    ]:
        if Path(candidate).exists():
            font_path = candidate
            break

    try:
        if font_path and "PressStart" in font_path:
            font_main = ImageFont.truetype(font_path, 130)
            font_sub = ImageFont.truetype(font_path, 28)
            font_micro = ImageFont.truetype(font_path, 18)
        else:
            font_main = ImageFont.truetype("arial.ttf", 130)
            font_sub = ImageFont.truetype("arial.ttf", 32)
            font_micro = ImageFont.truetype("arial.ttf", 18)
    except Exception:
        font_main = ImageFont.load_default()
        font_sub = ImageFont.load_default()
        font_micro = ImageFont.load_default()

    # Logo principal
    logo_text = "ABISMOX"
    bbox = draw.textbbox((0, 0), logo_text, font=font_main)
    logo_w = bbox[2] - bbox[0]
    logo_h = bbox[3] - bbox[1]
    logo_x = (w - logo_w) // 2
    logo_y = (h - logo_h) // 2 - 60

    # Glow cyan (offset 4 direcciones)
    for ox in (-4, 0, 4):
        for oy in (-4, 0, 4):
            if ox == 0 and oy == 0:
                continue
            draw.text((logo_x + ox, logo_y + oy), logo_text, fill=CYAN, font=font_main)
    # Magenta principal
    draw.text((logo_x, logo_y), logo_text, fill=MAGENTA, font=font_main)

    # Tagline
    tag_text = "GAMING + TECH ARCHIVE"
    bbox = draw.textbbox((0, 0), tag_text, font=font_sub)
    tag_w = bbox[2] - bbox[0]
    tag_x = (w - tag_w) // 2
    tag_y = logo_y + logo_h + 40
    draw.text((tag_x, tag_y), tag_text, fill=VERDE, font=font_sub)

    # Footer micro
    footer_text = "> N64/PS1 ERA // EST. 2026 // v1.1.0"
    bbox = draw.textbbox((0, 0), footer_text, font=font_micro)
    footer_w = bbox[2] - bbox[0]
    footer_x = (w - footer_w) // 2
    footer_y = h - 70
    draw.text((footer_x, footer_y), footer_text, fill=(136, 136, 136), font=font_micro)

    # Línea cyan superior/inferior decorativa
    for x in range(60, w - 60, 12):
        draw.rectangle([(x, 90), (x + 6, 92)], fill=CYAN)
        draw.rectangle([(x, h - 92), (x + 6, h - 90)], fill=CYAN)

    # Scanlines sutiles
    draw_scanlines(draw, w, h)

    out = ROOT / "og-image.png"
    img.save(out, "PNG", optimize=True)
    print(f"Generado: {out} ({w}x{h})")


if __name__ == "__main__":
    make_favicon()
    make_og_image()