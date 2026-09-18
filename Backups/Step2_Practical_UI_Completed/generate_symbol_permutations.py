import asyncio
import os
import base64
from playwright.async_api import async_playwright
from PIL import Image

BASE_DIR = r"c:\Users\43670\Desktop\Graphics\AnonymCreator - Digitalstudion\Webseiten\TripMura"
BRAND_DIR = os.path.join(BASE_DIR, "assets", "brand")
SYM_BG_DIR = os.path.join(BRAND_DIR, "symbol", "backgrounds")
ICONS_DIR = os.path.join(BRAND_DIR, "icons")
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

async def render_html(page, html, width, height, out_path):
    await page.set_viewport_size({"width": width, "height": height})
    await page.set_content(html)
    await page.wait_for_timeout(250)
    await page.screenshot(path=out_path)
    print(f"Rendered {os.path.basename(out_path)} ({width}x{height})")

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()

        # Background CSS styles
        bg_white_css = "background: #fafbfc; background-image: radial-gradient(at 10% 10%, rgba(0, 242, 254, 0.08) 0px, transparent 50%), radial-gradient(at 90% 20%, rgba(2, 132, 199, 0.07) 0px, transparent 50%);"
        bg_obsidian_css = "background: #07080b; background-image: radial-gradient(circle at center, #0f172a 0%, #07080b 100%);"
        bg_sky_css = f"background-image: url('data:image/png;base64,{sky_b64}'); background-size: cover; background-position: center;"
        bg_azure_css = "background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%);"

        print("=== 1. Generating Standalone Symbol Background Suite ===")
        def get_symbol_html(bg_css, svg_code, glass=False, shadow=True):
            glass_card = """
                background: rgba(255, 255, 255, 0.88);
                backdrop-filter: blur(20px);
                -webkit-backdrop-filter: blur(20px);
                border: 1px solid rgba(255, 255, 255, 0.85);
                border-radius: 28%;
                padding: 18%;
                box-shadow: 0 24px 60px rgba(15, 23, 42, 0.18);
            """ if glass else ""
            
            filter_css = "filter: drop-shadow(0 16px 36px rgba(2, 132, 199, 0.2));" if shadow and not glass else ""

            return f'''<!DOCTYPE html>
<html>
<head>
  <style>
    * {{ margin: 0; padding: 0; box-sizing: border-box; }}
    body {{
      width: 100vw;
      height: 100vh;
      {bg_css}
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
    }}
    .wrapper {{
      display: flex;
      align-items: center;
      justify-content: center;
      {glass_card}
    }}
    .symbol {{
      width: 55vw;
      height: 55vh;
      display: flex;
      align-items: center;
      justify-content: center;
      {filter_css}
    }}
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="symbol">{svg_code}</div>
  </div>
</body>
</html>'''

        # 1.1 Symbol on Porcelain White (1024 & 4K)
        html_sw = get_symbol_html(bg_white_css, SVG_GRADIENT, glass=False, shadow=True)
        await render_html(page, html_sw, 1024, 1024, os.path.join(SYM_BG_DIR, "symbol_on_porcelain_white.png"))
        await render_html(page, html_sw, 4096, 4096, os.path.join(SYM_BG_DIR, "symbol_on_porcelain_white_4k.png"))
        await render_html(page, html_sw, 800, 800, os.path.join(SHOWCASE_DIR, "symbol_on_white.png"))

        # 1.2 Symbol on Dark Obsidian (White & Gradient, 1024 & 4K)
        html_sd_white = get_symbol_html(bg_obsidian_css, SVG_WHITE, glass=False, shadow=False)
        await render_html(page, html_sd_white, 1024, 1024, os.path.join(SYM_BG_DIR, "symbol_on_dark_obsidian.png"))
        await render_html(page, html_sd_white, 4096, 4096, os.path.join(SYM_BG_DIR, "symbol_on_dark_obsidian_4k.png"))
        await render_html(page, html_sd_white, 800, 800, os.path.join(SHOWCASE_DIR, "symbol_on_dark.png"))

        html_sd_grad = get_symbol_html(bg_obsidian_css, SVG_GRADIENT, glass=False, shadow=True)
        await render_html(page, html_sd_grad, 1024, 1024, os.path.join(SYM_BG_DIR, "symbol_gradient_on_dark.png"))
        await render_html(page, html_sd_grad, 4096, 4096, os.path.join(SYM_BG_DIR, "symbol_gradient_on_dark_4k.png"))

        # 1.3 Symbol on Sunlit Clouds (Glass card & direct white, 1024 & 4K)
        html_sc_glass = get_symbol_html(bg_sky_css, SVG_GRADIENT, glass=True)
        await render_html(page, html_sc_glass, 1024, 1024, os.path.join(SYM_BG_DIR, "symbol_on_sunlit_clouds.png"))
        await render_html(page, html_sc_glass, 4096, 4096, os.path.join(SYM_BG_DIR, "symbol_on_sunlit_clouds_4k.png"))
        await render_html(page, html_sc_glass, 800, 800, os.path.join(SHOWCASE_DIR, "symbol_on_clouds.png"))

        html_sc_white = get_symbol_html(bg_sky_css, SVG_WHITE, glass=False, shadow=True)
        await render_html(page, html_sc_white, 1024, 1024, os.path.join(SYM_BG_DIR, "symbol_white_on_clouds.png"))
        await render_html(page, html_sc_white, 4096, 4096, os.path.join(SYM_BG_DIR, "symbol_white_on_clouds_4k.png"))

        # 1.4 Symbol on Azure Gradient (White, 1024 & 4K)
        html_sa = get_symbol_html(bg_azure_css, SVG_WHITE, glass=False, shadow=False)
        await render_html(page, html_sa, 1024, 1024, os.path.join(SYM_BG_DIR, "symbol_on_azure_gradient.png"))
        await render_html(page, html_sa, 4096, 4096, os.path.join(SYM_BG_DIR, "symbol_on_azure_gradient_4k.png"))
        await render_html(page, html_sa, 800, 800, os.path.join(SHOWCASE_DIR, "symbol_on_azure.png"))


        print("=== 2. Generating App Icons & Social Avatars (Porcelain White Suite) ===")
        # iOS App Icon (1024x1024 Porcelain White Squircle Canvas + Gradient M)
        html_ios_icon = f'''<!DOCTYPE html>
<html>
<head>
  <style>
    * {{ margin: 0; padding: 0; box-sizing: border-box; }}
    body {{
      width: 1024px;
      height: 1024px;
      background-color: #fafbfc;
      background-image: radial-gradient(at 10% 10%, rgba(0, 242, 254, 0.09) 0px, transparent 50%),
                        radial-gradient(at 90% 20%, rgba(2, 132, 199, 0.08) 0px, transparent 50%),
                        radial-gradient(at 50% 90%, #ffffff 0px, transparent 50%);
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      border: 1px solid rgba(2, 132, 199, 0.1);
    }}
    .symbol {{
      width: 620px;
      height: 620px;
      display: flex;
      align-items: center;
      justify-content: center;
      filter: drop-shadow(0 20px 40px rgba(2, 132, 199, 0.22)) drop-shadow(0 6px 16px rgba(15, 23, 42, 0.06));
    }}
  </style>
</head>
<body>
  <div class="symbol">{SVG_GRADIENT}</div>
</body>
</html>'''
        await render_html(page, html_ios_icon, 1024, 1024, os.path.join(ICONS_DIR, "app_icon_ios_1024.png"))

        # Android Adaptive Icon (1024x1024 Circular Porcelain White Canvas + Gradient M)
        html_android_icon = f'''<!DOCTYPE html>
<html>
<head>
  <style>
    * {{ margin: 0; padding: 0; box-sizing: border-box; }}
    body {{
      width: 1024px;
      height: 1024px;
      background: transparent;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
    }}
    .circle-canvas {{
      width: 1024px;
      height: 1024px;
      border-radius: 50%;
      background-color: #fafbfc;
      background-image: radial-gradient(at 10% 10%, rgba(0, 242, 254, 0.09) 0px, transparent 50%),
                        radial-gradient(at 90% 20%, rgba(2, 132, 199, 0.08) 0px, transparent 50%),
                        radial-gradient(at 50% 90%, #ffffff 0px, transparent 50%);
      display: flex;
      align-items: center;
      justify-content: center;
      border: 1px solid rgba(2, 132, 199, 0.1);
    }}
    .symbol {{
      width: 580px;
      height: 580px;
      display: flex;
      align-items: center;
      justify-content: center;
      filter: drop-shadow(0 20px 40px rgba(2, 132, 199, 0.22)) drop-shadow(0 6px 16px rgba(15, 23, 42, 0.06));
    }}
  </style>
</head>
<body>
  <div class="circle-canvas">
    <div class="symbol">{SVG_GRADIENT}</div>
  </div>
</body>
</html>'''
        await render_html(page, html_android_icon, 1024, 1024, os.path.join(ICONS_DIR, "app_icon_android_adaptive.png"))

        # Social Avatar 500x500 (Circular Porcelain White Canvas + Gradient M)
        html_social_avatar = f'''<!DOCTYPE html>
<html>
<head>
  <style>
    * {{ margin: 0; padding: 0; box-sizing: border-box; }}
    body {{
      width: 500px;
      height: 500px;
      background: transparent;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
    }}
    .circle-canvas {{
      width: 500px;
      height: 500px;
      border-radius: 50%;
      background-color: #fafbfc;
      background-image: radial-gradient(at 10% 10%, rgba(0, 242, 254, 0.09) 0px, transparent 50%),
                        radial-gradient(at 90% 20%, rgba(2, 132, 199, 0.08) 0px, transparent 50%),
                        radial-gradient(at 50% 90%, #ffffff 0px, transparent 50%);
      display: flex;
      align-items: center;
      justify-content: center;
      border: 1px solid rgba(2, 132, 199, 0.1);
    }}
    .symbol {{
      width: 300px;
      height: 300px;
      display: flex;
      align-items: center;
      justify-content: center;
      filter: drop-shadow(0 12px 24px rgba(2, 132, 199, 0.22)) drop-shadow(0 4px 10px rgba(15, 23, 42, 0.06));
    }}
  </style>
</head>
<body>
  <div class="circle-canvas">
    <div class="symbol">{SVG_GRADIENT}</div>
  </div>
</body>
</html>'''
        await render_html(page, html_social_avatar, 500, 500, os.path.join(ICONS_DIR, "social_avatar_500x500.png"))


        print("=== 3. Harmonizing Showcase Aliases ===")
        # Copy / ensure exact naming for showcase files
        aliases = [
            ("stacked_on_porcelain_white.png", "stacked_on_white.png"),
            ("stacked_on_dark_obsidian.png", "stacked_on_dark.png"),
            ("stacked_on_sunlit_clouds.png", "stacked_on_clouds.png"),
            ("stacked_on_azure_gradient.png", "stacked_on_azure.png"),
            ("horizontal_on_porcelain_white.png", "horizontal_on_white.png"),
            ("horizontal_on_dark_obsidian.png", "horizontal_on_dark.png"),
            ("horizontal_on_sunlit_clouds.png", "horizontal_on_clouds.png"),
            ("horizontal_on_azure_gradient.png", "horizontal_on_azure.png"),
        ]
        for src, dst in aliases:
            src_p = os.path.join(SHOWCASE_DIR, src)
            dst_p = os.path.join(SHOWCASE_DIR, dst)
            if os.path.exists(src_p):
                with open(src_p, "rb") as sf, open(dst_p, "wb") as df:
                    df.write(sf.read())

        await browser.close()
        print("All Permutations & Icons Generated Successfully!")

if __name__ == "__main__":
    asyncio.run(main())
