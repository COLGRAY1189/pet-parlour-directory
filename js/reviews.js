(function() {
  var path = window.location.pathname;
  var match = path.match(/businesses\/([^./]+)/);
  if (!match) return;
  var slug = match[1];

  fetch('../data/reviews.json')
    .then(function(r) { return r.json(); })
    .then(function(data) {
      var reviews = data[slug];
      if (!reviews || !reviews.length) return;
      renderReviews(reviews);
    })
    .catch(function() {});

  function escapeHtml(str) {
    var div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
  }

  function renderReviews(reviews) {
    var container = document.getElementById('reviews-section');
    if (!container) return;

    var html = '<div class="section-label">Google Reviews</div>';
    html += '<div class="reviews-grid">';

    reviews.forEach(function(r) {
      var initials = r.author.charAt(0).toUpperCase();
      var starCount = Math.round(r.rating);
      var stars = '<span class="star-filled"></span>'.repeat(starCount) +
                  '<span class="star-empty"></span>'.repeat(5 - starCount);

      var text = r.text ? r.text : '';
      // Truncate long reviews with "show more"
      var truncated = text.length > 280;
      var displayText = truncated ? escapeHtml(text.substring(0, 280)) + '...' : escapeHtml(text);
      var fullText = truncated ? escapeHtml(text) : '';

      html += '<div class="review-card">' +
        '<div style="display:flex;align-items:center;gap:0.75rem;margin-bottom:0.85rem;">' +
          (r.profile_photo
            ? '<img src="' + escapeHtml(r.profile_photo) + '" alt="" style="width:38px;height:38px;border-radius:50%;object-fit:cover;flex-shrink:0;" onerror="this.outerHTML=\'<div class=review-avatar>' + initials + '</div>\'">'
            : '<div class="review-avatar">' + initials + '</div>') +
          '<div>' +
            '<div style="font-weight:600;font-size:0.92rem;color:var(--text-primary);">' + escapeHtml(r.author) + '</div>' +
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
    });

    html += '</div>';
    container.innerHTML = html;
    container.style.display = 'block';
  }
})();

function toggleReview(btn) {
  var p = btn.parentElement;
  var isExpanded = btn.getAttribute('data-expanded') === 'true';
  if (isExpanded) {
    p.innerHTML = btn.getAttribute('data-short') + ' ';
    var newBtn = p.querySelector('.review-toggle') || document.createElement('button');
    if (!p.querySelector('.review-toggle')) {
      newBtn.className = 'review-toggle';
      newBtn.style.cssText = 'background:none;border:none;color:var(--accent);cursor:pointer;font-size:0.85rem;padding:0;font-weight:500;';
      newBtn.setAttribute('data-full', btn.getAttribute('data-full'));
      newBtn.setAttribute('data-short', btn.getAttribute('data-short'));
      newBtn.setAttribute('onclick', 'toggleReview(this)');
      newBtn.textContent = 'show more';
      p.appendChild(newBtn);
    }
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
