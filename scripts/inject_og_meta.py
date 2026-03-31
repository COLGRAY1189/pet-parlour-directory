"""Inject OG and Twitter Card meta tags into all business HTML pages."""

import os
import glob
import json

script_dir = os.path.dirname(os.path.abspath(__file__))
project_dir = os.path.dirname(script_dir)
biz_dir = os.path.join(project_dir, "businesses")

# Load businesses for metadata
with open(os.path.join(project_dir, "data", "businesses.json"), "r", encoding="utf-8") as f:
    businesses = json.load(f)

biz_map = {b["slug"]: b for b in businesses}

files = glob.glob(os.path.join(biz_dir, "*.html"))
updated = 0

for filepath in files:
    filename = os.path.basename(filepath).replace(".html", "")
    biz = biz_map.get(filename)
    if not biz:
        continue

    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()

    # Skip if already has og tags
    if 'og:title' in content:
        continue

    title = f"{biz['name']} | Pet Grooming in {biz['area']}, Cape Town"
    desc = biz.get("description", f"{biz['name']} is a pet grooming service in {biz['area']}, Cape Town.")
    url = f"https://pet-parlour.fun/businesses/{biz['slug']}.html"
    image = f"https://pet-parlour.fun/assets/photos/{biz['slug']}.jpg" if biz.get("local_photo") else "https://pet-parlour.fun/assets/photos/cindys-doggie-parlour-cape-town.jpg"

    # Escape for HTML attributes
    title_esc = title.replace('"', '&quot;').replace('&', '&amp;')
    desc_esc = desc.replace('"', '&quot;').replace('&', '&amp;')

    og_tags = f'''  <meta property="og:title" content="{title_esc}">
  <meta property="og:description" content="{desc_esc}">
  <meta property="og:type" content="website">
  <meta property="og:url" content="{url}">
  <meta property="og:image" content="{image}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="{title_esc}">
  <meta name="twitter:description" content="{desc_esc}">
  <meta name="twitter:image" content="{image}">
'''

    # Insert after the canonical link tag
    marker = '<link rel="canonical"'
    if marker in content:
        idx = content.index(marker)
        end_idx = content.index('>', idx) + 1
        content = content[:end_idx] + '\n' + og_tags + content[end_idx:]
    else:
        # Insert before first <link rel="preconnect"
        marker2 = '<link rel="preconnect"'
        if marker2 in content:
            idx = content.index(marker2)
            content = content[:idx] + og_tags + content[idx:]

    with open(filepath, "w", encoding="utf-8") as f:
        f.write(content)
    updated += 1
    print(f"Updated: {os.path.basename(filepath)}")

print(f"\nDone! Added OG/Twitter meta tags to {updated} files.")
