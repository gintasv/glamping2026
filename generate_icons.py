"""Generate PWA app icons with the standard library only (no Pillow).

On-brand: forest-green background with two cream mountain peaks + a lake line,
echoing the Park nav glyph. Motif stays within the center ~80% so the icon
survives maskable cropping. Outputs PNGs into icons/.
"""
import zlib
import struct
import os

GREEN = (58, 90, 68)     # #3a5a44  background / theme
CREAM = (250, 250, 247)  # #fafaf7  mountains
LAKE = (110, 140, 120)   # muted green for the water line


def png_bytes(size, pixel_fn):
    raw = bytearray()
    for y in range(size):
        raw.append(0)  # filter type 0 (None) per scanline
        for x in range(size):
            r, g, b = pixel_fn(x / (size - 1), y / (size - 1))
            raw += bytes((r, g, b, 255))
    compressed = zlib.compress(bytes(raw), 9)

    def chunk(tag, data):
        body = tag + data
        return struct.pack(">I", len(data)) + body + struct.pack(">I", zlib.crc32(body) & 0xffffffff)

    sig = b"\x89PNG\r\n\x1a\n"
    ihdr = struct.pack(">IIBBBBB", size, size, 8, 6, 0, 0, 0)  # 8-bit RGBA
    return sig + chunk(b"IHDR", ihdr) + chunk(b"IDAT", compressed) + chunk(b"IEND", b"")


BASE = 0.74   # mountain base line (and lake top)
LAKE_BOTTOM = 0.80


def mountain_surface(nx):
    """Lowest (smallest ny) cream surface across the two peaks at column nx."""
    def peak(cx, top, half):
        d = abs(nx - cx)
        if d > half:
            return 1.0
        return top + (d / half) * (BASE - top)
    return min(peak(0.54, 0.26, 0.40), peak(0.34, 0.42, 0.26))


def pixel(nx, ny):
    # Mountains (cream) between their silhouette and the base line.
    if BASE >= ny >= mountain_surface(nx):
        return CREAM
    # Thin lake band under the mountains.
    if BASE < ny <= LAKE_BOTTOM:
        return LAKE
    return GREEN


def main():
    here = os.path.dirname(os.path.abspath(__file__))
    out = os.path.join(here, "icons")
    os.makedirs(out, exist_ok=True)
    targets = {
        "icon-512.png": 512,
        "icon-192.png": 192,
        "icon-180.png": 180,
        "favicon-32.png": 32,
    }
    for name, size in targets.items():
        data = png_bytes(size, pixel)
        with open(os.path.join(out, name), "wb") as f:
            f.write(data)
        print(f"wrote icons/{name} ({size}x{size}, {len(data)} bytes)")


if __name__ == "__main__":
    main()
