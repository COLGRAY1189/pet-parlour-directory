"""Inject review form CSS styles into all business HTML pages."""

import os
import glob

# CSS for interactive star rating input
STAR_INPUT_CSS = """    .star-input { display: inline-block; width: 24px; height: 24px; cursor: pointer; transition: transform 0.15s ease; }
    .star-input:hover { transform: scale(1.2); }
    .star-input.star-filled { background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23C4A265'%3E%3Cpath d='M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z'/%3E%3C/svg%3E") center/contain no-repeat; }
    .star-input.star-empty { background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23C4A265' stroke-width='1.5'%3E%3Cpath d='M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z'/%3E%3C/svg%3E") center/contain no-repeat; }
    .review-form-wrap input:focus, .review-form-wrap textarea:focus { outline: none; border-color: var(--accent); box-shadow: 0 0 0 3px rgba(196,162,101,0.12); }"""

MARKER = '.nav__logo-icon { width: 34px; height: 34px; border-radius: 50%; flex-shrink: 0; }'

script_dir = os.path.dirname(os.path.abspath(__file__))
project_dir = os.path.dirname(script_dir)
biz_dir = os.path.join(project_dir, "businesses")

files = glob.glob(os.path.join(biz_dir, "*.html"))
updated = 0

for filepath in files:
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()

    if 'star-input' in content:
        continue

    if MARKER in content:
        content = content.replace(MARKER, MARKER + '\n' + STAR_INPUT_CSS)
        with open(filepath, "w", encoding="utf-8") as f:
            f.write(content)
        updated += 1
        print(f"Updated: {os.path.basename(filepath)}")

print(f"\nDone! Updated {updated} files.")
