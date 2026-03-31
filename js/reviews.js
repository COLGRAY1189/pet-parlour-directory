/* Reviews system — loads Google reviews + user reviews, sorts latest-first, paginates */
(function() {
  var REVIEWS_PER_PAGE = 5;
  var MAX_REVIEWS = 20;
  var SUPABASE_URL = window.SUPABASE_URL || '';
  var SUPABASE_KEY = window.SUPABASE_KEY || '';

  var path = window.location.pathname;
  var match = path.match(/businesses\/([^./]+)/);
  if (!match) return;
  var slug = match[1];

  var allReviews = [];
  var shownCount = 0;

  // Load both sources in parallel
  var googlePromise = fetch('../data/reviews.json')
    .then(function(r) { return r.json(); })
    .then(function(data) { return data[slug] || []; })
    .catch(function() { return []; });

  var userPromise = SUPABASE_URL
    ? fetch(SUPABASE_URL + '/rest/v1/reviews?slug=eq.' + slug + '&order=created_at.desc&limit=' + MAX_REVIEWS, {
        headers: { 'apikey': SUPABASE_KEY, 'Authorization': 'Bearer ' + SUPABASE_KEY }
      })
      .then(function(r) { return r.ok ? r.json() : []; })
      .then(function(rows) {
        return rows.map(function(row) {
          return {
            author: row.author_name,
            rating: row.rating,
            text: row.review_text,
            publish_time: row.created_at,
            time: timeAgo(row.created_at),
            source: 'user',
            profile_photo: ''
          };
        });
      })
      .catch(function() { return []; })
    : Promise.resolve([]);

  // Loading happens via the Promise.all at the bottom of this IIFE

  function timeAgo(iso) {
    if (!iso) return '';
    var seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
    var intervals = [
      { label: 'year', seconds: 31536000 },
      { label: 'month', seconds: 2592000 },
      { label: 'week', seconds: 604800 },
      { label: 'day', seconds: 86400 }
    ];
    for (var i = 0; i < intervals.length; i++) {
      var count = Math.floor(seconds / intervals[i].seconds);
      if (count >= 1) return count + ' ' + intervals[i].label + (count > 1 ? 's' : '') + ' ago';
    }
    return 'just now';
  }

  function escapeHtml(str) {
    var div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
  }

  function renderSection() {
    var container = document.getElementById('reviews-section');
    if (!container) return;

    var html = '<div class="section-label">Reviews</div>';

    // Review form
    html += renderForm();

    // Reviews list
    if (allReviews.length) {
      html += '<div id="reviews-grid" class="reviews-grid"></div>';
      html += '<div id="reviews-more-wrap" style="text-align:center;margin-top:1.25rem;"></div>';
    } else {
      html += '<p style="font-size:0.88rem;color:var(--text-muted);margin-top:1rem;">No reviews yet. Be the first to leave a review!</p>';
    }

    container.innerHTML = html;
    container.style.display = 'block';

    // Render initial batch
    shownCount = 0;
    showMore();

    // Bind form
    bindForm();
  }

  function renderForm() {
    return '<div class="review-form-wrap" style="margin-bottom:2rem;">' +
      '<div style="background:var(--surface-elevated);border:1px solid var(--border-light);border-radius:var(--radius-md);padding:1.5rem;">' +
        '<div style="font-weight:600;font-size:0.95rem;color:var(--text-primary);margin-bottom:1rem;">Leave a Review</div>' +
        '<form id="review-form">' +
          '<div style="margin-bottom:1rem;">' +
            '<label style="display:block;font-size:0.78rem;text-transform:uppercase;letter-spacing:0.08em;color:var(--text-muted);margin-bottom:0.4rem;">Your Name</label>' +
            '<input type="text" id="review-name" required maxlength="60" style="width:100%;padding:0.65rem 0.85rem;border:1px solid var(--border-light);border-radius:var(--radius-sm);font-size:0.88rem;font-family:var(--font-body);background:var(--surface);color:var(--text-primary);box-sizing:border-box;">' +
          '</div>' +
          '<div style="margin-bottom:1rem;">' +
            '<label style="display:block;font-size:0.78rem;text-transform:uppercase;letter-spacing:0.08em;color:var(--text-muted);margin-bottom:0.4rem;">Rating</label>' +
            '<div id="review-stars" class="review-star-input" style="display:flex;gap:4px;cursor:pointer;">' +
              '<span class="star-input" data-value="1"></span>' +
              '<span class="star-input" data-value="2"></span>' +
              '<span class="star-input" data-value="3"></span>' +
              '<span class="star-input" data-value="4"></span>' +
              '<span class="star-input" data-value="5"></span>' +
            '</div>' +
            '<input type="hidden" id="review-rating" value="5">' +
          '</div>' +
          '<div style="margin-bottom:1rem;">' +
            '<label style="display:block;font-size:0.78rem;text-transform:uppercase;letter-spacing:0.08em;color:var(--text-muted);margin-bottom:0.4rem;">Your Review</label>' +
            '<textarea id="review-text" required maxlength="1000" rows="4" style="width:100%;padding:0.65rem 0.85rem;border:1px solid var(--border-light);border-radius:var(--radius-sm);font-size:0.88rem;font-family:var(--font-body);background:var(--surface);color:var(--text-primary);resize:vertical;box-sizing:border-box;"></textarea>' +
          '</div>' +
          '<div id="review-msg" style="font-size:0.82rem;margin-bottom:0.75rem;display:none;"></div>' +
          '<button type="submit" class="btn btn--primary" style="width:100%;justify-content:center;">Submit Review</button>' +
        '</form>' +
      '</div>' +
    '</div>';
  }

  function showMore() {
    var grid = document.getElementById('reviews-grid');
    var wrap = document.getElementById('reviews-more-wrap');
    if (!grid || !wrap) return;

    var end = Math.min(shownCount + REVIEWS_PER_PAGE, allReviews.length);
    var fragment = '';

    for (var i = shownCount; i < end; i++) {
      fragment += renderCard(allReviews[i]);
    }
    grid.insertAdjacentHTML('beforeend', fragment);
    shownCount = end;

    // Show/hide "Show More" button
    if (shownCount < allReviews.length) {
      var remaining = allReviews.length - shownCount;
      wrap.innerHTML = '<button id="show-more-btn" class="btn btn--outline" style="font-size:0.85rem;">' +
        'Show More Reviews (' + remaining + ' remaining)</button>';
      document.getElementById('show-more-btn').addEventListener('click', showMore);
    } else {
      wrap.innerHTML = '';
    }
  }

  function renderCard(r) {
    var initials = r.author ? r.author.charAt(0).toUpperCase() : '?';
    var starCount = Math.round(r.rating);
    var stars = '<span class="star-filled"></span>'.repeat(starCount) +
                '<span class="star-empty"></span>'.repeat(5 - starCount);

    var sourceLabel = r.source === 'user'
      ? '<span style="font-size:0.7rem;background:var(--accent);color:white;padding:0.15rem 0.45rem;border-radius:var(--radius-pill);margin-left:0.5rem;vertical-align:middle;">Visitor</span>'
      : '<span style="font-size:0.7rem;background:var(--primary-mid);color:white;padding:0.15rem 0.45rem;border-radius:var(--radius-pill);margin-left:0.5rem;vertical-align:middle;">Google</span>';

    var text = r.text || '';
    var truncated = text.length > 280;
    var displayText = truncated ? escapeHtml(text.substring(0, 280)) + '...' : escapeHtml(text);
    var fullText = truncated ? escapeHtml(text) : '';

    return '<div class="review-card">' +
      '<div style="display:flex;align-items:center;gap:0.75rem;margin-bottom:0.85rem;">' +
        (r.profile_photo
          ? '<img src="' + escapeHtml(r.profile_photo) + '" alt="" style="width:38px;height:38px;border-radius:50%;object-fit:cover;flex-shrink:0;" onerror="this.outerHTML=\'<div class=review-avatar>' + initials + '</div>\'">'
          : '<div class="review-avatar">' + initials + '</div>') +
        '<div>' +
          '<div style="font-weight:600;font-size:0.92rem;color:var(--text-primary);">' + escapeHtml(r.author) + sourceLabel + '</div>' +
          '<div style="font-size:0.75rem;color:var(--text-muted);">' + escapeHtml(r.time) + '</div>' +
        '</div>' +
      '</div>' +
      '<div style="display:flex;align-items:center;gap:0.35rem;margin-bottom:0.65rem;">' +
        '<span class="stars">' + stars + '</span>' +
      '</div>' +
      (text
        ? '<p class="review-text" style="font-size:0.88rem;line-height:1.7;color:var(--text-secondary);margin:0;">' +
            displayText +
            (truncated ? ' <button class="review-toggle" style="background:none;border:none;color:var(--accent);cursor:pointer;font-size:0.85rem;padding:0;font-weight:500;" data-full="' + fullText.replace(/"/g, '&quot;') + '" data-short="' + displayText.replace(/"/g, '&quot;') + '" onclick="toggleReview(this)">show more</button>' : '') +
          '</p>'
        : '') +
    '</div>';
  }

  function bindForm() {
    var form = document.getElementById('review-form');
    if (!form) return;

    // Star rating interaction
    var starsWrap = document.getElementById('review-stars');
    var ratingInput = document.getElementById('review-rating');
    var starSpans = starsWrap.querySelectorAll('.star-input');
    var currentRating = 5;

    function updateStarDisplay(value) {
      starSpans.forEach(function(s) {
        var v = parseInt(s.getAttribute('data-value'));
        s.className = v <= value ? 'star-input star-filled' : 'star-input star-empty';
      });
    }
    updateStarDisplay(currentRating);

    starsWrap.addEventListener('click', function(e) {
      var star = e.target.closest('.star-input');
      if (!star) return;
      currentRating = parseInt(star.getAttribute('data-value'));
      ratingInput.value = currentRating;
      updateStarDisplay(currentRating);
    });

    starsWrap.addEventListener('mouseover', function(e) {
      var star = e.target.closest('.star-input');
      if (!star) return;
      updateStarDisplay(parseInt(star.getAttribute('data-value')));
    });

    starsWrap.addEventListener('mouseleave', function() {
      updateStarDisplay(currentRating);
    });

    // Form submit
    form.addEventListener('submit', function(e) {
      e.preventDefault();
      var name = document.getElementById('review-name').value.trim();
      var rating = parseInt(ratingInput.value);
      var text = document.getElementById('review-text').value.trim();
      var msg = document.getElementById('review-msg');

      if (!name || !text) {
        msg.style.display = 'block';
        msg.style.color = 'var(--accent)';
        msg.textContent = 'Please fill in all fields.';
        return;
      }

      var review = {
        slug: slug,
        author_name: name,
        rating: rating,
        review_text: text
      };

      // Save to Supabase if configured
      if (SUPABASE_URL && SUPABASE_KEY) {
        var submitBtn = form.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Submitting...';

        fetch(SUPABASE_URL + '/rest/v1/reviews', {
          method: 'POST',
          headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': 'Bearer ' + SUPABASE_KEY,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
          },
          body: JSON.stringify(review)
        })
        .then(function(r) {
          if (!r.ok) throw new Error('Failed');
          return r.json();
        })
        .then(function(rows) {
          var saved = rows[0];
          var newReview = {
            author: saved.author_name,
            rating: saved.rating,
            text: saved.review_text,
            publish_time: saved.created_at,
            time: 'just now',
            source: 'user',
            profile_photo: ''
          };
          allReviews.unshift(newReview);
          if (allReviews.length > MAX_REVIEWS) allReviews.pop();

          // Re-render the grid
          var grid = document.getElementById('reviews-grid');
          if (grid) {
            grid.innerHTML = '';
            shownCount = 0;
            showMore();
          }

          form.reset();
          updateStarDisplay(5);
          currentRating = 5;
          ratingInput.value = 5;
          msg.style.display = 'block';
          msg.style.color = 'var(--primary-mid)';
          msg.textContent = 'Thank you! Your review has been submitted.';
          submitBtn.disabled = false;
          submitBtn.textContent = 'Submit Review';
        })
        .catch(function() {
          // Fallback to localStorage
          saveToLocal(review);
          submitBtn.disabled = false;
          submitBtn.textContent = 'Submit Review';
        });
      } else {
        // No Supabase — save locally
        saveToLocal(review);
      }
    });

    function saveToLocal(review) {
      var stored = JSON.parse(localStorage.getItem('pp_reviews_' + slug) || '[]');
      var entry = {
        author_name: review.author_name,
        rating: review.rating,
        review_text: review.review_text,
        created_at: new Date().toISOString()
      };
      stored.unshift(entry);
      stored = stored.slice(0, MAX_REVIEWS);
      localStorage.setItem('pp_reviews_' + slug, JSON.stringify(stored));

      var newReview = {
        author: entry.author_name,
        rating: entry.rating,
        text: entry.review_text,
        publish_time: entry.created_at,
        time: 'just now',
        source: 'user',
        profile_photo: ''
      };
      allReviews.unshift(newReview);
      if (allReviews.length > MAX_REVIEWS) allReviews.pop();

      var grid = document.getElementById('reviews-grid');
      if (grid) {
        grid.innerHTML = '';
        shownCount = 0;
        showMore();
      }

      form.reset();
      var starsW = document.getElementById('review-stars');
      if (starsW) {
        starsW.querySelectorAll('.star-input').forEach(function(s) {
          s.className = 'star-input star-filled';
        });
      }
      document.getElementById('review-rating').value = 5;
      var msg = document.getElementById('review-msg');
      msg.style.display = 'block';
      msg.style.color = 'var(--primary-mid)';
      msg.textContent = 'Thank you! Your review has been submitted.';
    }
  }

  // Also load localStorage reviews (for when Supabase is not set up, or as supplement)
  var localPromise = Promise.resolve().then(function() {
    var stored = JSON.parse(localStorage.getItem('pp_reviews_' + slug) || '[]');
    return stored.map(function(row) {
      return {
        author: row.author_name,
        rating: row.rating,
        text: row.review_text,
        publish_time: row.created_at,
        time: timeAgo(row.created_at),
        source: 'user',
        profile_photo: ''
      };
    });
  });

  // Override the original Promise.all to include localStorage
  Promise.all([googlePromise, userPromise, localPromise]).then(function(results) {
    var google = results[0];
    var supaUser = results[1];
    var localUser = results[2];

    // Deduplicate: prefer Supabase over local (by matching author+text)
    var seen = {};
    supaUser.forEach(function(r) { seen[r.author + '|' + r.text] = true; });
    var uniqueLocal = localUser.filter(function(r) { return !seen[r.author + '|' + r.text]; });

    allReviews = google.concat(supaUser).concat(uniqueLocal).sort(function(a, b) {
      var da = a.publish_time ? new Date(a.publish_time).getTime() : 0;
      var db = b.publish_time ? new Date(b.publish_time).getTime() : 0;
      return db - da;
    }).slice(0, MAX_REVIEWS);

    renderSection();
  });
})();

function toggleReview(btn) {
  var p = btn.parentElement;
  var isExpanded = btn.getAttribute('data-expanded') === 'true';
  if (isExpanded) {
    var shortText = btn.getAttribute('data-short');
    var fullText = btn.getAttribute('data-full');
    p.innerHTML = shortText + ' ';
    var newBtn = document.createElement('button');
    newBtn.className = 'review-toggle';
    newBtn.style.cssText = 'background:none;border:none;color:var(--accent);cursor:pointer;font-size:0.85rem;padding:0;font-weight:500;';
    newBtn.setAttribute('data-full', fullText);
    newBtn.setAttribute('data-short', shortText);
    newBtn.setAttribute('onclick', 'toggleReview(this)');
    newBtn.textContent = 'show more';
    p.appendChild(newBtn);
  } else {
    var fullText = btn.getAttribute('data-full');
    var shortText = btn.getAttribute('data-short');
    p.innerHTML = fullText + ' ';
    var collapseBtn = document.createElement('button');
    collapseBtn.className = 'review-toggle';
    collapseBtn.style.cssText = 'background:none;border:none;color:var(--accent);cursor:pointer;font-size:0.85rem;padding:0;font-weight:500;';
    collapseBtn.setAttribute('data-full', fullText);
    collapseBtn.setAttribute('data-short', shortText);
    collapseBtn.setAttribute('data-expanded', 'true');
    collapseBtn.setAttribute('onclick', 'toggleReview(this)');
    collapseBtn.textContent = 'show less';
    p.appendChild(collapseBtn);
  }
}
