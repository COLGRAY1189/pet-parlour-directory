"""Inject the reviews section placeholder and script tag into all business HTML pages."""

import os
import glob

REVIEWS_DIV = '        <div id="reviews-section" style="margin-bottom:2.25rem;display:none;"></div>\n\n        '
SCRIPT_TAG = '  <script src="../js/reviews.js"></script>\n'

MARKER = '<div style="background:var(--surface-warm);border:1px solid var(--border-light);border-radius:var(--radius-md);padding:1.75rem;text-align:center;">'

script_dir = os.path.dirname(os.path.abspath(__file__))
project_dir = os.path.dirname(script_dir)
biz_dir = os.path.join(project_dir, "businesses")

files = glob.glob(os.path.join(biz_dir, "*.html"))
updated = 0

for filepath in files:
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()

    changed = False

    # Skip if already has reviews section
    if 'id="reviews-section"' not in content:
        if MARKER in content:
            content = content.replace(MARKER, REVIEWS_DIV + MARKER)
            changed = True

    # Add script tag before </body> if not present
    if 'reviews.js' not in content:
        content = content.replace('</body>', SCRIPT_TAG + '</body>')
        changed = True

    if changed:
        with open(filepath, "w", encoding="utf-8") as f:
            f.write(content)
        updated += 1
        print(f"Updated: {os.path.basename(filepath)}")

print(f"\nDone! Updated {updated} files.")
