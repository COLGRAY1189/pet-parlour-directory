"""
Fetch Google reviews for all businesses and save to data/reviews.json.

Usage:
    python scripts/fetch_reviews.py YOUR_GOOGLE_API_KEY

Requires: requests (pip install requests)
Uses the Google Places API (New) to fetch up to 5 reviews per business.
"""

import json
import sys
import os
import time

try:
    import requests
except ImportError:
    print("Error: 'requests' package required. Install with: pip install requests")
    sys.exit(1)


def fetch_reviews(place_id, api_key):
    """Fetch reviews for a single place using Google Places API (New)."""
    url = f"https://places.googleapis.com/v1/places/{place_id}"
    headers = {
        "X-Goog-Api-Key": api_key,
        "X-Goog-FieldMask": "reviews"
    }
    resp = requests.get(url, headers=headers, timeout=15)
    if resp.status_code != 200:
        print(f"  Warning: API returned {resp.status_code} for {place_id}")
        return []

    data = resp.json()
    reviews = []
    for r in data.get("reviews", []):
        reviews.append({
            "author": r.get("authorAttribution", {}).get("displayName", "Anonymous"),
            "profile_photo": r.get("authorAttribution", {}).get("photoUri", ""),
            "rating": r.get("rating", 5),
            "text": r.get("text", {}).get("text", ""),
            "time": r.get("relativePublishTimeDescription", "")
        })
    return reviews


def main():
    if len(sys.argv) < 2:
        print("Usage: python scripts/fetch_reviews.py YOUR_GOOGLE_API_KEY")
        sys.exit(1)

    api_key = sys.argv[1]
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_dir = os.path.dirname(script_dir)
    businesses_path = os.path.join(project_dir, "data", "businesses.json")
    reviews_path = os.path.join(project_dir, "data", "reviews.json")

    with open(businesses_path, "r", encoding="utf-8") as f:
        businesses = json.load(f)

    # Load existing reviews to preserve them if fetch fails
    existing = {}
    if os.path.exists(reviews_path):
        with open(reviews_path, "r", encoding="utf-8") as f:
            existing = json.load(f)

    all_reviews = dict(existing)
    total = len(businesses)

    for i, biz in enumerate(businesses):
        slug = biz["slug"]
        place_id = biz.get("place_id", "")
        print(f"[{i+1}/{total}] {biz['name']}...", end=" ")

        if not place_id:
            print("no place_id, skipping")
            continue

        reviews = fetch_reviews(place_id, api_key)
        if reviews:
            all_reviews[slug] = reviews
            print(f"{len(reviews)} reviews")
        else:
            print("no reviews")

        # Rate limiting - stay under quota
        time.sleep(0.2)

    with open(reviews_path, "w", encoding="utf-8") as f:
        json.dump(all_reviews, f, indent=2, ensure_ascii=False)

    print(f"\nDone! Saved reviews for {len(all_reviews)} businesses to data/reviews.json")


if __name__ == "__main__":
    main()
