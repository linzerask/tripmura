import asyncio
import os
import shutil
import base64
from playwright.async_api import async_playwright
from PIL import Image

BASE_DIR = r"c:\Users\43670\Desktop\Graphics\AnonymCreator - Digitalstudion\Webseiten\TripMura"
BRAND_DIR = os.path.join(BASE_DIR, "assets", "brand")
SYMBOL_DIR = os.path.join(BRAND_DIR, "symbol")
BG_DIR = os.path.join(BRAND_DIR, "backgrounds")

os.makedirs(SYMBOL_DIR, exist_ok=True)
os.makedirs(BG_DIR, exist_ok=True)

# 1. SVGs definition
SVG_GRADIENT = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="100%" height="100%" fill="none">
  <defs>
    <linearGradient id="tmHeartGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#00f2fe"/>
      <stop offset="100%" stop-color="#0284c7"/>
    </linearGradient>
  </defs>
  <path d="M 186 405 C 132 365, 96 295, 96 215 C 96 125, 186 112, 226 178 L 256 228 L 286 178 C 326 112, 416 125, 416 215 C 416 295, 380 365, 326 405" 
        stroke="url(#tmHeartGradient)" 
        stroke-width="40" 
        stroke-linecap="round" 
        stroke-linejoin="round"/>
</svg>'''

SVG_WHITE = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="100%" height="100%" fill="none">
  <path d="M 186 405 C 132 365, 96 295, 96 215 C 96 125, 186 112, 226 178 L 256 228 L 286 178 C 326 112, 416 125, 416 215 C 416 295, 380 365, 326 405" 
        stroke="#ffffff" 
        stroke-width="40" 
        stroke-linecap="round" 
        stroke-linejoin="round"/>
</svg>'''

SVG_BLACK = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="100%" height="100%" fill="none">
  <path d="M 186 405 C 132 365, 96 295, 96 215 C 96 125, 186 112, 226 178 L 256 228 L 286 178 C 326 112, 416 125, 416 215 C 416 295, 380 365, 326 405" 
        stroke="#0f172a" 
        stroke-width="40" 
        stroke-linecap="round" 
        stroke-linejoin="round"/>
</svg>'''

# Save master SVGs
with open(os.path.join(BRAND_DIR, "tripmura_symbol.svg"), "w", encoding="utf-8") as f:
    f.write(SVG_GRADIENT)
with open(os.path.join(SYMBOL_DIR, "tripmura_symbol.svg"), "w", encoding="utf-8") as f:
    f.write(SVG_GRADIENT)
with open(os.path.join(SYMBOL_DIR, "tripmura_symbol_white.svg"), "w", encoding="utf-8") as f:
    f.write(SVG_WHITE)
with open(os.path.join(SYMBOL_DIR, "tripmura_symbol_black.svg"), "w", encoding="utf-8") as f:
    f.write(SVG_BLACK)


async def render_svg_to_file(page, svg_content, width, height, out_png, out_webp=None, bg="transparent"):
    html = f'''<!DOCTYPE html>
<html>
<head>
  <style>
    * {{ margin: 0; padding: 0; box-sizing: border-box; }}
    html, body {{
      width: {width}px;
      height: {height}px;
      background: {bg};
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
    }}
    svg {{
      width: 100%;
      height: 100%;
      display: block;
    }}
  </style>
</head>
<body>
  {svg_content}
</body>
</html>'''
    await page.set_viewport_size({"width": width, "height": height})
    await page.set_content(html)
    await page.screenshot(path=out_png, omit_background=(bg == "transparent"))
    if out_webp:
        img = Image.open(out_png)
        img.save(out_webp, format="WEBP", lossless=True, quality=100)


async def render_horizontal_lockup(page, color_mode, width, height, out_png, out_webp, is_4k=False):
    # Colors
    if color_mode == "gradient":
        svg = SVG_GRADIENT
        title_color = "#0f172a"
        tagline_color = "#64748b"
    elif color_mode == "white":
        svg = SVG_WHITE
        title_color = "#ffffff"
        tagline_color = "#94a3b8"
    else:  # black
        svg = SVG_BLACK
        title_color = "#0f172a"
        tagline_color = "#475569"

    scale = 3840 / 1300 if is_4k else 1.0
    sym_size = int(140 * scale)
    title_size = int(82 * scale)
    tagline_size = int(24 * scale)
    gap = int(32 * scale)
    tracking = f"{1.5 * scale:.1f}px"

    html = f'''<!DOCTYPE html>
<html>
<head>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;700;800&display=swap" rel="stylesheet">
  <style>
    * {{ margin: 0; padding: 0; box-sizing: border-box; }}
    html, body {{
      width: {width}px;
      height: {height}px;
      background: transparent;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      -webkit-font-smoothing: antialiased;
      overflow: hidden;
    }}
    .lockup {{
      display: inline-flex;
      align-items: center;
      gap: {gap}px;
    }}
    .symbol {{
      width: {sym_size}px;
      height: {sym_size}px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }}
    .text-block {{
      display: flex;
      flex-direction: column;
      justify-content: center;
    }}
    .brand-title {{
      font-size: {title_size}px;
      font-weight: 800;
      color: {title_color};
      letter-spacing: {tracking};
      line-height: 1.05;
      text-transform: uppercase;
    }}
    .tagline {{
      font-size: {tagline_size}px;
      font-weight: 500;
      color: {tagline_color};
      letter-spacing: 0.2px;
      margin-top: {int(4 * scale)}px;
    }}
  </style>
</head>
<body>
  <div class="lockup">
    <div class="symbol">{svg}</div>
    <div class="text-block">
      <div class="brand-title">TRIPMURA</div>
      <div class="tagline">Holidays Made Simple.</div>
    </div>
  </div>
</body>
</html>'''
    await page.set_viewport_size({"width": width, "height": height})
    await page.set_content(html)
    await page.wait_for_timeout(300)
    await page.screenshot(path=out_png, omit_background=True)
    img = Image.open(out_png)
    img.save(out_webp, format="WEBP", lossless=True, quality=100)


async def render_stacked_lockup(page, color_mode, width, height, out_png, out_webp, is_4k=False):
    if color_mode == "gradient":
        svg = SVG_GRADIENT
        title_color = "#0f172a"
        tagline_color = "#64748b"
    elif color_mode == "white":
        svg = SVG_WHITE
        title_color = "#ffffff"
        tagline_color = "#94a3b8"
    else:  # black
        svg = SVG_BLACK
        title_color = "#0f172a"
        tagline_color = "#475569"

    scale = 3840 / 900 if is_4k else 1.0
    sym_size = int(320 * scale)
    title_size = int(108 * scale)
    tagline_size = int(30 * scale)
    gap_sym = int(32 * scale)
    gap_tag = int(14 * scale)
    tracking = f"{2.0 * scale:.1f}px"

    html = f'''<!DOCTYPE html>
<html>
<head>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;700;800&display=swap" rel="stylesheet">
  <style>
    * {{ margin: 0; padding: 0; box-sizing: border-box; }}
    html, body {{
      width: {width}px;
      height: {height}px;
      background: transparent;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      -webkit-font-smoothing: antialiased;
      overflow: hidden;
    }}
    .lockup {{
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
    }}
    .symbol {{
      width: {sym_size}px;
      height: {sym_size}px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: {gap_sym}px;
    }}
    .brand-title {{
      font-size: {title_size}px;
      font-weight: 800;
      color: {title_color};
      letter-spacing: {tracking};
      line-height: 1.05;
      text-transform: uppercase;
    }}
    .tagline {{
      font-size: {tagline_size}px;
      font-weight: 500;
      color: {tagline_color};
      letter-spacing: 0.3px;
      margin-top: {gap_tag}px;
    }}
  </style>
</head>
<body>
  <div class="lockup">
    <div class="symbol">{svg}</div>
    <div class="brand-title">TRIPMURA</div>
    <div class="tagline">Holidays Made Simple.</div>
  </div>
</body>
</html>'''
    await page.set_viewport_size({"width": width, "height": height})
    await page.set_content(html)
    await page.wait_for_timeout(300)
    await page.screenshot(path=out_png, omit_background=True)
    img = Image.open(out_png)
    img.save(out_webp, format="WEBP", lossless=True, quality=100)


async def render_og_cards(page):
    # OG Light
    html_light = f'''<!DOCTYPE html>
<html>
<head>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;700;800&display=swap" rel="stylesheet">
  <style>
    * {{ margin: 0; padding: 0; box-sizing: border-box; }}
    body {{
      width: 1200px;
      height: 630px;
      background: #fafbfc;
      background-image: radial-gradient(at 10% 10%, rgba(0, 242, 254, 0.12) 0px, transparent 50%),
                        radial-gradient(at 90% 20%, rgba(2, 132, 199, 0.10) 0px, transparent 50%);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      font-family: 'Plus Jakarta Sans', sans-serif;
      text-align: center;
    }}
    .card-content {{
      display: flex;
      flex-direction: column;
      align-items: center;
    }}
    .symbol {{
      width: 180px;
      height: 180px;
      margin-bottom: 24px;
    }}
    .brand-title {{
      font-size: 68px;
      font-weight: 800;
      color: #0f172a;
      letter-spacing: 1.5px;
      line-height: 1;
    }}
    .tagline {{
      font-size: 26px;
      font-weight: 500;
      color: #0284c7;
      margin-top: 14px;
    }}
    .badge {{
      display: inline-block;
      margin-top: 24px;
      padding: 8px 20px;
      background: #ffffff;
      border: 1px solid rgba(15, 23, 42, 0.08);
      border-radius: 9999px;
      font-size: 15px;
      font-weight: 600;
      color: #64748b;
      box-shadow: 0 4px 12px rgba(15, 23, 42, 0.04);
    }}
  </style>
</head>
<body>
  <div class="card-content">
    <div class="symbol">{SVG_GRADIENT}</div>
    <div class="brand-title">TRIPMURA</div>
    <div class="tagline">Holidays Made Simple.</div>
    <div class="badge">tripmura.com</div>
  </div>
</body>
</html>'''
    await page.set_viewport_size({"width": 1200, "height": 630})
    await page.set_content(html_light)
    await page.wait_for_timeout(300)
    out_og_light = os.path.join(BRAND_DIR, "og_preview_light.png")
    await page.screenshot(path=out_og_light)

    # OG Sky
    sky_path = os.path.join(BG_DIR, "bg_sky_clouds.png")
    with open(sky_path, "rb") as f:
        sky_b64 = base64.b64encode(f.read()).decode("utf-8")

    html_sky = f'''<!DOCTYPE html>
<html>
<head>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;700;800&display=swap" rel="stylesheet">
  <style>
    * {{ margin: 0; padding: 0; box-sizing: border-box; }}
    body {{
      width: 1200px;
      height: 630px;
      background-image: url('data:image/png;base64,{sky_b64}');
      background-size: cover;
      background-position: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      font-family: 'Plus Jakarta Sans', sans-serif;
      text-align: center;
      position: relative;
    }}
    .glass-card {{
      background: rgba(255, 255, 255, 0.88);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border: 1px solid rgba(255, 255, 255, 0.85);
      border-radius: 32px;
      padding: 44px 70px;
      box-shadow: 0 24px 60px rgba(15, 23, 42, 0.18), 0 4px 16px rgba(0, 0, 0, 0.06);
      display: flex;
      flex-direction: column;
      align-items: center;
    }}
    .symbol {{
      width: 130px;
      height: 130px;
      margin-bottom: 16px;
    }}
    .brand-title {{
      font-size: 60px;
      font-weight: 800;
      color: #0f172a;
      letter-spacing: 1.5px;
      line-height: 1;
    }}
    .tagline {{
      font-size: 22px;
      font-weight: 600;
      color: #0284c7;
      margin-top: 10px;
    }}
    .badge {{
      margin-top: 16px;
      padding: 6px 16px;
      background: #0f172a;
      border-radius: 9999px;
      font-size: 14px;
      font-weight: 600;
      color: #ffffff;
    }}
  </style>
</head>
<body>
  <div class="overlay"></div>
  <div class="glass-card">
    <div class="symbol">{SVG_GRADIENT}</div>
    <div class="brand-title">TRIPMURA</div>
    <div class="tagline">Holidays Made Simple.</div>
    <div class="badge">tripmura.com</div>
  </div>
</body>
</html>'''
    await page.set_content(html_sky)
    await page.wait_for_timeout(400)
    out_og_sky = os.path.join(BRAND_DIR, "og_preview_sky.png")
    await page.screenshot(path=out_og_sky)


async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()

        print("1. Rendering Standalone Symbols (512, 1024, 4096 / 4K)...")
        symbol_tasks = [
            ("gradient", SVG_GRADIENT, "tripmura_symbol"),
            ("white", SVG_WHITE, "tripmura_symbol_white"),
            ("black", SVG_BLACK, "tripmura_symbol_black")
        ]
        for mode, svg_code, prefix in symbol_tasks:
            for size, suffix in [(512, "512"), (1024, "1024"), (4096, "4k")]:
                png_path = os.path.join(SYMBOL_DIR, f"{prefix}_{suffix}.png")
                webp_path = os.path.join(SYMBOL_DIR, f"{prefix}_{suffix}.webp")
                print(f"   Rendering {prefix}_{suffix} ({size}x{size})...")
                await render_svg_to_file(page, svg_code, size, size, png_path, webp_path)

        print("2. Rendering Horizontal Lockups...")
        # Gradient
        await render_horizontal_lockup(page, "gradient", 1300, 360, 
            os.path.join(BRAND_DIR, "tripmura_logo_horizontal.png"),
            os.path.join(BRAND_DIR, "tripmura_logo_horizontal.webp"))
        await render_horizontal_lockup(page, "gradient", 3840, 1063, 
            os.path.join(BRAND_DIR, "tripmura_logo_horizontal_4k.png"),
            os.path.join(BRAND_DIR, "tripmura_logo_horizontal_4k.webp"), is_4k=True)

        # White
        await render_horizontal_lockup(page, "white", 1300, 360, 
            os.path.join(BRAND_DIR, "tripmura_logo_white_horizontal.png"),
            os.path.join(BRAND_DIR, "tripmura_logo_white_horizontal.webp"))
        await render_horizontal_lockup(page, "white", 3840, 1063, 
            os.path.join(BRAND_DIR, "tripmura_logo_white_horizontal_4k.png"),
            os.path.join(BRAND_DIR, "tripmura_logo_white_horizontal_4k.webp"), is_4k=True)

        # Black
        await render_horizontal_lockup(page, "black", 1300, 360, 
            os.path.join(BRAND_DIR, "tripmura_logo_black_horizontal.png"),
            os.path.join(BRAND_DIR, "tripmura_logo_black_horizontal.webp"))
        await render_horizontal_lockup(page, "black", 3840, 1063, 
            os.path.join(BRAND_DIR, "tripmura_logo_black_horizontal_4k.png"),
            os.path.join(BRAND_DIR, "tripmura_logo_black_horizontal_4k.webp"), is_4k=True)

        print("3. Rendering Stacked Lockups...")
        # Gradient
        await render_stacked_lockup(page, "gradient", 900, 900, 
            os.path.join(BRAND_DIR, "tripmura_logo_stacked.png"),
            os.path.join(BRAND_DIR, "tripmura_logo_stacked.webp"))
        await render_stacked_lockup(page, "gradient", 3840, 3840, 
            os.path.join(BRAND_DIR, "tripmura_logo_stacked_4k.png"),
            os.path.join(BRAND_DIR, "tripmura_logo_stacked_4k.webp"), is_4k=True)

        # White
        await render_stacked_lockup(page, "white", 900, 900, 
            os.path.join(BRAND_DIR, "tripmura_logo_white_stacked.png"),
            os.path.join(BRAND_DIR, "tripmura_logo_white_stacked.webp"))
        await render_stacked_lockup(page, "white", 3840, 3840, 
            os.path.join(BRAND_DIR, "tripmura_logo_white_stacked_4k.png"),
            os.path.join(BRAND_DIR, "tripmura_logo_white_stacked_4k.webp"), is_4k=True)

        # Black
        await render_stacked_lockup(page, "black", 900, 900, 
            os.path.join(BRAND_DIR, "tripmura_logo_black_stacked.png"),
            os.path.join(BRAND_DIR, "tripmura_logo_black_stacked.webp"))
        await render_stacked_lockup(page, "black", 3840, 3840, 
            os.path.join(BRAND_DIR, "tripmura_logo_black_stacked_4k.png"),
            os.path.join(BRAND_DIR, "tripmura_logo_black_stacked_4k.webp"), is_4k=True)

        print("4. Rendering OG Social Cards...")
        await render_og_cards(page)

        await browser.close()
        print("All assets generated successfully!")

if __name__ == "__main__":
    asyncio.run(main())
