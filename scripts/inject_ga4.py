"""Inject Google Analytics GA4 tracking script into all business HTML pages."""

import os
import glob

script_dir = os.path.dirname(os.path.abspath(__file__))
project_dir = os.path.dirname(script_dir)
biz_dir = os.path.join(project_dir, "businesses")

GA4_SCRIPT = '''  <!-- Google Analytics GA4 -->
  <script async src="https://www.googletagmanager.com/gtag/js?id=G-8KVY7Q59MX"></script>
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', 'G-8KVY7Q59MX');
  </script>
'''

files = glob.glob(os.path.join(biz_dir, "*.html"))
updated = 0

for filepath in files:
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()

    # Skip if already has GA4
    if 'G-8KVY7Q59MX' in content:
        continue

    # Insert before first <link rel="preconnect" or <link rel="stylesheet"
    for marker in ['<link rel="preconnect"', '<link rel="stylesheet"', '</head>']:
        if marker in content:
            idx = content.index(marker)
            content = content[:idx] + GA4_SCRIPT + content[idx:]
            break

    with open(filepath, "w", encoding="utf-8") as f:
        f.write(content)
    updated += 1
    print(f"Updated: {os.path.basename(filepath)}")

print(f"\nDone! Added GA4 to {updated} business pages.")
