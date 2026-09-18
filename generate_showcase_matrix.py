import asyncio
import os
import base64
from playwright.async_api import async_playwright
from PIL import Image

BASE_DIR = r"c:\Users\43670\Desktop\Graphics\AnonymCreator - Digitalstudion\Webseiten\TripMura"
BRAND_DIR = os.path.join(BASE_DIR, "assets", "brand")
SHOWCASE_DIR = os.path.join(BRAND_DIR, "showcase")
BG_DIR = os.path.join(BRAND_DIR, "backgrounds")

sky_path = os.path.join(BG_DIR, "bg_sky_clouds.png")
with open(sky_path, "rb") as f:
    sky_b64 = base64.b64encode(f.read()).decode("utf-8")

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

async def render_card(page, html, width, height, out_path):
    await page.set_viewport_size({"width": width, "height": height})
    await page.set_content(html)
    await page.wait_for_timeout(300)
    await page.screenshot(path=out_path)
    print(f"Rendered {os.path.basename(out_path)} ({width}x{height})")

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()

        # Common HTML Template Wrapper
        def get_stacked_html(bg_css, svg_code, title_color, tag_color, glass=False):
            glass_card_style = """
                background: rgba(255, 255, 255, 0.88);
                backdrop-filter: blur(20px);
                -webkit-backdrop-filter: blur(20px);
                border: 1px solid rgba(255, 255, 255, 0.85);
                border-radius: 36px;
                padding: 48px 64px;
                box-shadow: 0 24px 60px rgba(15, 23, 42, 0.16);
            """ if glass else ""

            return f'''<!DOCTYPE html>
<html>
<head>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;700;800&display=swap" rel="stylesheet">
  <style>
    * {{ margin: 0; padding: 0; box-sizing: border-box; }}
    body {{
      width: 1200px;
      height: 900px;
      {bg_css}
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: 'Plus Jakarta Sans', sans-serif;
      text-align: center;
      overflow: hidden;
    }}
    .container {{
      display: flex;
      flex-direction: column;
      align-items: center;
      {glass_card_style}
    }}
    .symbol {{
      width: 220px;
      height: 220px;
      margin-bottom: 24px;
    }}
    .brand-title {{
      font-size: 84px;
      font-weight: 800;
      color: {title_color};
      letter-spacing: 2px;
      line-height: 1;
      text-transform: uppercase;
    }}
    .tagline {{
      font-size: 24px;
      font-weight: 600;
      color: {tag_color};
      margin-top: 14px;
      letter-spacing: 0.3px;
    }}
  </style>
</head>
<body>
  <div class="container">
    <div class="symbol">{svg_code}</div>
    <div class="brand-title">TRIPMURA</div>
    <div class="tagline">Holidays Made Simple.</div>
  </div>
</body>
</html>'''

        def get_horizontal_html(bg_css, svg_code, title_color, tag_color, glass=False):
            glass_card_style = """
                background: rgba(255, 255, 255, 0.88);
                backdrop-filter: blur(20px);
                -webkit-backdrop-filter: blur(20px);
                border: 1px solid rgba(255, 255, 255, 0.85);
                border-radius: 32px;
                padding: 40px 60px;
                box-shadow: 0 24px 60px rgba(15, 23, 42, 0.16);
            """ if glass else ""

            return f'''<!DOCTYPE html>
<html>
<head>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;700;800&display=swap" rel="stylesheet">
  <style>
    * {{ margin: 0; padding: 0; box-sizing: border-box; }}
    body {{
      width: 1400px;
      height: 600px;
      {bg_css}
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: 'Plus Jakarta Sans', sans-serif;
      overflow: hidden;
    }}
    .container {{
      display: inline-flex;
      align-items: center;
      gap: 36px;
      {glass_card_style}
    }}
    .symbol {{
      width: 150px;
      height: 150px;
      flex-shrink: 0;
    }}
    .text-block {{
      display: flex;
      flex-direction: column;
      justify-content: center;
    }}
    .brand-title {{
      font-size: 88px;
      font-weight: 800;
      color: {title_color};
      letter-spacing: 1.8px;
      line-height: 1.05;
      text-transform: uppercase;
    }}
    .tagline {{
      font-size: 26px;
      font-weight: 600;
      color: {tag_color};
      margin-top: 6px;
      letter-spacing: 0.2px;
    }}
  </style>
</head>
<body>
  <div class="container">
    <div class="symbol">{svg_code}</div>
    <div class="text-block">
      <div class="brand-title">TRIPMURA</div>
      <div class="tagline">Holidays Made Simple.</div>
    </div>
  </div>
</body>
</html>'''

        # Backgrounds styles
        bg_white = "background: #fafbfc; background-image: radial-gradient(at 10% 10%, rgba(0, 242, 254, 0.08) 0px, transparent 50%), radial-gradient(at 90% 20%, rgba(2, 132, 199, 0.07) 0px, transparent 50%);"
        bg_obsidian = "background: #07080b; background-image: radial-gradient(circle at center, #0f172a 0%, #07080b 100%);"
        bg_sky = f"background-image: url('data:image/png;base64,{sky_b64}'); background-size: cover; background-position: center;"
        bg_azure = "background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%);"

        print("--- Rendering Stacked Background Variations ---")
        # 1. Stacked on Porcelain White
        await render_card(page, get_stacked_html(bg_white, SVG_GRADIENT, "#0f172a", "#64748b"),
                          1200, 900, os.path.join(SHOWCASE_DIR, "stacked_on_porcelain_white.png"))

        # 2. Stacked on Dark Obsidian
        await render_card(page, get_stacked_html(bg_obsidian, SVG_WHITE, "#ffffff", "#94a3b8"),
                          1200, 900, os.path.join(SHOWCASE_DIR, "stacked_on_dark_obsidian.png"))

        # 3. Stacked on Sunlit Clouds
        await render_card(page, get_stacked_html(bg_sky, SVG_GRADIENT, "#0f172a", "#0284c7", glass=True),
                          1200, 900, os.path.join(SHOWCASE_DIR, "stacked_on_sunlit_clouds.png"))

        # 4. Stacked on Azure Gradient
        await render_card(page, get_stacked_html(bg_azure, SVG_WHITE, "#ffffff", "#e0f2fe"),
                          1200, 900, os.path.join(SHOWCASE_DIR, "stacked_on_azure_gradient.png"))


        print("--- Rendering Horizontal Background Variations ---")
        # 5. Horizontal on Porcelain White
        await render_card(page, get_horizontal_html(bg_white, SVG_GRADIENT, "#0f172a", "#64748b"),
                          1400, 600, os.path.join(SHOWCASE_DIR, "horizontal_on_porcelain_white.png"))

        # 6. Horizontal on Dark Obsidian
        await render_card(page, get_horizontal_html(bg_obsidian, SVG_WHITE, "#ffffff", "#94a3b8"),
                          1400, 600, os.path.join(SHOWCASE_DIR, "horizontal_on_dark_obsidian.png"))

        # 7. Horizontal on Sunlit Clouds
        await render_card(page, get_horizontal_html(bg_sky, SVG_GRADIENT, "#0f172a", "#0284c7", glass=True),
                          1400, 600, os.path.join(SHOWCASE_DIR, "horizontal_on_sunlit_clouds.png"))

        # 8. Horizontal on Azure Gradient
        await render_card(page, get_horizontal_html(bg_azure, SVG_WHITE, "#ffffff", "#e0f2fe"),
                          1400, 600, os.path.join(SHOWCASE_DIR, "horizontal_on_azure_gradient.png"))

        print("--- Regenerating Clean OG Cards (No Tech Buzzwords) ---")
        # OG Light
        html_og_light = f'''<!DOCTYPE html>
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
    .symbol {{
      width: 170px;
      height: 170px;
      margin-bottom: 20px;
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
      font-weight: 600;
      color: #0284c7;
      margin-top: 12px;
    }}
    .badge {{
      display: inline-block;
      margin-top: 24px;
      padding: 8px 24px;
      background: #ffffff;
      border: 1px solid rgba(15, 23, 42, 0.08);
      border-radius: 9999px;
      font-size: 15px;
      font-weight: 700;
      color: #0f172a;
      box-shadow: 0 4px 14px rgba(15, 23, 42, 0.05);
    }}
  </style>
</head>
<body>
  <div class="symbol">{SVG_GRADIENT}</div>
  <div class="brand-title">TRIPMURA</div>
  <div class="tagline">Holidays Made Simple.</div>
  <div class="badge">tripmura.com</div>
</body>
</html>'''
        await render_card(page, html_og_light, 1200, 630, os.path.join(BRAND_DIR, "og_preview_light.png"))

        # OG Sky
        html_og_sky = f'''<!DOCTYPE html>
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
      align-items: center;
      justify-content: center;
      font-family: 'Plus Jakarta Sans', sans-serif;
      text-align: center;
    }}
    .glass-card {{
      background: rgba(255, 255, 255, 0.88);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border: 1px solid rgba(255, 255, 255, 0.85);
      border-radius: 32px;
      padding: 44px 72px;
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
      font-size: 62px;
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
      margin-top: 18px;
      padding: 8px 22px;
      background: #0f172a;
      border-radius: 9999px;
      font-size: 14px;
      font-weight: 700;
      letter-spacing: 0.4px;
      color: #ffffff;
      box-shadow: 0 4px 14px rgba(15, 23, 42, 0.2);
    }}
  </style>
</head>
<body>
  <div class="glass-card">
    <div class="symbol">{SVG_GRADIENT}</div>
    <div class="brand-title">TRIPMURA</div>
    <div class="tagline">Holidays Made Simple.</div>
    <div class="badge">tripmura.com</div>
  </div>
</body>
</html>'''
        await render_card(page, html_og_sky, 1200, 630, os.path.join(BRAND_DIR, "og_preview_sky.png"))

        await browser.close()
        print("Showcase Background Matrix Generated Successfully!")

if __name__ == "__main__":
    asyncio.run(main())
