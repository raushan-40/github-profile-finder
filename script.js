// script.js
// Modular GitHub Profile Finder with improved accessibility:
// - aria labels and live regions
// - keyboard support for repo items
// - alt text handling
// - proper button behavior (aria-busy / aria-disabled)

/* ----------------------
   Utility helpers
   ---------------------- */
function escapeHtml(str) {
  return String(str ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function formatGithubDate(isoOrDate) {
  if (!isoOrDate) return '';
  const date = isoOrDate instanceof Date ? isoOrDate : new Date(String(isoOrDate));
  if (Number.isNaN(date.getTime())) return '';
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const day = date.getUTCDate();
  const month = months[date.getUTCMonth()];
  const year = date.getUTCFullYear();
  return `${day} ${month} ${year}`;
}

/* ----------------------
   DOM references
   ---------------------- */
const form = document.getElementById('search-form');
const input = document.getElementById('username-input');
const searchButton = document.getElementById('search-button');
const profileContainer = document.getElementById('profile-container');
const reposContainer = document.getElementById('repos-container');
const messageEl = document.getElementById('message');

/* ----------------------
   UI: loading & error (accessible)
   ---------------------- */
function _showMessage(text, { isError = false, loading = false } = {}) {
  if (!messageEl) return;
  messageEl.style.display = 'block';
  messageEl.textContent = text;
  messageEl.style.color = isError ? 'var(--danger, #ff7b7b)' : 'var(--muted, #9aa4b2)';
  // aria attributes for button and message
  if (loading) {
    searchButton.setAttribute('aria-busy', 'true');
    searchButton.setAttribute('aria-disabled', 'true');
    searchButton.disabled = true;
    messageEl.dataset.loading = 'true';
  } else {
    messageEl.removeAttribute('aria-busy');
    searchButton.removeAttribute('aria-disabled');
    searchButton.disabled = false;
    delete messageEl.dataset.loading;
  }
}

function showLoading() {
  _showMessage('⏳ Loading…', { loading: true });
}

function hideLoading() {
  if (!messageEl) return;
  // only remove if loading dataset was set by showLoading
  if (messageEl.dataset.loading) {
    messageEl.style.display = 'none';
    messageEl.textContent = '';
    delete messageEl.dataset.loading;
    searchButton.removeAttribute('aria-busy');
    searchButton.removeAttribute('aria-disabled');
    searchButton.disabled = false;
  }
}

function showError(text) {
  _showMessage(text, { isError: true, loading: false });
  // Move focus to message for screen reader users
  if (messageEl) messageEl.focus?.();
}

function clearError() {
  if (!messageEl) return;
  // keep the message element but hide it
  messageEl.style.display = 'none';
  messageEl.textContent = '';
  delete messageEl.dataset.loading;
  searchButton.removeAttribute('aria-busy');
  searchButton.removeAttribute('aria-disabled');
  searchButton.disabled = false;
}

/* ----------------------
   Network: fetchUser & fetchRepos
   ---------------------- */

async function fetchUser(username, timeoutMs = 10000) {
  if (!username || typeof username !== 'string') {
    throw new Error('A valid username is required.');
  }
  const url = `https://api.github.com/users/${encodeURIComponent(username)}`;
  const controller = new AbortController();
  const signal = controller.signal;
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const resp = await fetch(url, { signal });
    clearTimeout(timer);

    if (!resp.ok) {
      let apiMsg = `${resp.status} ${resp.statusText}`;
      try {
        const body = await resp.json();
        if (body && body.message) apiMsg = `${body.message} (${resp.status})`;
      } catch {}
      if (resp.status === 404) {
        const err = new Error(`User "${username}" not found (404).`);
        err.status = 404;
        throw err;
      }
      throw new Error(`GitHub API error: ${apiMsg}`);
    }

    const data = await resp.json();
    return data;
  } catch (err) {
    clearTimeout(timer);
    if (err.name === 'AbortError') throw new Error('Request timed out. Please try again.');
    if (err instanceof TypeError) throw new Error('Network error when contacting GitHub API.');
    throw err;
  }
}

async function fetchRepos(reposUrl, timeoutMs = 10000) {
  if (!reposUrl || typeof reposUrl !== 'string') {
    return []; // no repos URL -> return empty list
  }
  const url = `${reposUrl.replace(/\/+$/, '')}?sort=updated&per_page=5`;
  const controller = new AbortController();
  const signal = controller.signal;
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const resp = await fetch(url, { signal });
    clearTimeout(timer);

    if (!resp.ok) {
      let apiMsg = `${resp.status} ${resp.statusText}`;
      try {
        const body = await resp.json();
        if (body && body.message) apiMsg = `${body.message} (${resp.status})`;
      } catch {}
      throw new Error(`Failed to load repositories: ${apiMsg}`);
    }

    const data = await resp.json();
    return Array.isArray(data) ? data : [];
  } catch (err) {
    clearTimeout(timer);
    if (err.name === 'AbortError') throw new Error('Loading repositories timed out.');
    if (err instanceof TypeError) throw new Error('Network error while fetching repositories.');
    throw err;
  }
}

/* ----------------------
   Rendering: profile & repos (accessible)
   ---------------------- */

function renderProfile(user) {
  if (!profileContainer) return;
  profileContainer.innerHTML = '';

  if (!user || typeof user !== 'object') {
    profileContainer.textContent = 'No user data available.';
    profileContainer.focus?.();
    return;
  }

  const avatarUrl = user.avatar_url || '';
  const displayName = user.name ? escapeHtml(user.name) : escapeHtml(user.login || 'Unknown');
  const username = user.login ? escapeHtml(user.login) : 'unknown';
  const bio = user.bio ? escapeHtml(user.bio) : null;
  const joinDate = formatGithubDate(user.created_at);
  const blogRaw = user.blog ? String(user.blog).trim() : '';
  const blogHref = blogRaw ? (/^https?:\/\//i.test(blogRaw) ? blogRaw : `https://${blogRaw}`) : '';
  const blogDisplay = blogRaw ? escapeHtml(blogRaw.replace(/^https?:\/\//i, '')) : '';

  // Semantic profile card
  profileContainer.innerHTML = `
    <article class="profile-card" aria-label="GitHub profile for ${username}">
      <img class="avatar" src="${escapeHtml(avatarUrl)}" alt="${username} avatar" width="96" height="96" />
      <div class="info">
        <h2>${displayName}</h2>
        <p class="username">
          <a href="${escapeHtml(user.html_url || '#')}" target="_blank" rel="noopener">@${username}</a>
        </p>
        <p class="bio">${bio ? bio : '<span style="color:var(--muted);font-style:italic">No bio provided</span>'}</p>

        <div class="meta" aria-hidden="false">
          <span class="chip" title="Join date">📅 ${escapeHtml(joinDate || '—')}</span>
          <span class="chip" title="Blog or portfolio">🔗 ${ blogHref ? `<a href="${escapeHtml(blogHref)}" target="_blank" rel="noopener">${blogDisplay}</a>` : '<span style="color:var(--muted)">—</span>' }</span>
          <span class="chip" title="Followers">👥 ${typeof user.followers === 'number' ? user.followers : '—'}</span>
          <span class="chip" title="Following">🔁 ${typeof user.following === 'number' ? user.following : '—'}</span>
          <span class="chip" title="Public repositories">📦 ${typeof user.public_repos === 'number' ? user.public_repos : '—'}</span>
        </div>
      </div>
    </article>
  `;

  // Focus the profile container so screen readers announce the updated content
  profileContainer.focus?.();
  // Clear any previous repo content while repos load
  if (reposContainer) {
    reposContainer.innerHTML = '';
  }
}

function renderUserNotFound(username) {
  if (!profileContainer) return;
  profileContainer.innerHTML = '';
  if (reposContainer) reposContainer.innerHTML = '';

  const safe = escapeHtml(username || '');
  profileContainer.innerHTML = `
    <article class="profile-card not-found" aria-live="polite" role="status">
      <div style="display:flex;gap:14px;align-items:center;">
        <div style="width:96px;height:96px;border-radius:14px;
                    background:linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0.01));
                    display:flex;align-items:center;justify-content:center;font-size:28px;color:var(--muted);">
          👤
        </div>
        <div style="flex:1;">
          <h2 style="margin:0 0 6px 0;">User Not Found</h2>
          <p style="margin:0 0 10px 0;color:var(--muted);">
            We couldn't find a GitHub account for <strong>@${safe}</strong>.
          </p>
          <p style="margin:0;color:var(--muted);font-size:0.95rem;">
            Check the username and try again.
          </p>
        </div>
      </div>
    </article>
  `;

  profileContainer.focus?.();
}

function renderRepos(repos) {
  if (!reposContainer) return;
  reposContainer.innerHTML = '';

  const heading = document.createElement('h3');
  heading.textContent = 'Latest repositories';
  reposContainer.appendChild(heading);

  if (!Array.isArray(repos) || repos.length === 0) {
    const p = document.createElement('p');
    p.textContent = 'No public repositories found.';
    p.style.color = 'var(--muted)';
    reposContainer.appendChild(p);
    reposContainer.focus?.();
    return;
  }

  const ul = document.createElement('ul');
  ul.className = 'repo-list';
  ul.setAttribute('role', 'list');
  ul.style.listStyle = 'none';
  ul.style.margin = '8px 0 0 0';
  ul.style.padding = '0';
  ul.style.display = 'grid';
  ul.style.gap = '10px';

  repos.forEach(repo => {
    const li = document.createElement('li');
    li.className = 'repo';
    li.setAttribute('role', 'listitem');
    // Make the whole repo block keyboard-focusable and open on Enter/Space
    li.tabIndex = 0;

    // Build accessible link inside the item
    const a = document.createElement('a');
    a.href = repo.html_url || '#';
    a.target = '_blank';
    a.rel = 'noopener';
    a.textContent = repo.name ? repo.name : '(no name)';
    a.style.textDecoration = 'none';
    a.style.color = 'var(--text)';
    a.style.fontWeight = '600';
    a.setAttribute('aria-label', `Open repository ${repo.name}`);

    // When the li is activated via keyboard, follow the link
    li.addEventListener('keydown', (ev) => {
      if (ev.key === 'Enter' || ev.key === ' ') {
        ev.preventDefault();
        // prefer opening the anchor
        if (a && a.href) {
          window.open(a.href, '_blank', 'noopener');
        }
      }
    });

    // Allow clicking the list item to open the repo (improves hit target)
    li.addEventListener('click', () => {
      if (a && a.href) window.open(a.href, '_blank', 'noopener');
    });

    li.appendChild(a);
    ul.appendChild(li);
  });

  reposContainer.appendChild(ul);
  reposContainer.focus?.();
}

/* ----------------------
   Main flow: handle search
   ---------------------- */

async function handleSearch(event) {
  if (event) event.preventDefault();
  clearError();

  const username = input.value.trim();
  if (!username) {
    showError('Please type a GitHub username (for example: octocat).');
    input.focus();
    return;
  }

  showLoading();
  try {
    const user = await fetchUser(username);
    renderProfile(user);

    // fetch repos and render; errors in repos shouldn't remove the profile
    try {
      const repos = await fetchRepos(user.repos_url);
      renderRepos(repos);
    } catch (repoErr) {
      if (reposContainer) {
        reposContainer.innerHTML = `<p style="color:var(--danger);">${escapeHtml(repoErr.message || 'Failed to load repositories.')}</p>`;
        reposContainer.focus?.();
      }
    }
  } catch (err) {
    if (err && err.status === 404) {
      renderUserNotFound(username);
    } else {
      showError(err.message || 'An unexpected error occurred.');
    }
  } finally {
    hideLoading();
  }
}

/* ----------------------
   Wire events & keyboard niceties
   ---------------------- */
form.addEventListener('submit', handleSearch);
searchButton.addEventListener('click', handleSearch);

// Improve keyboard UX: Enter in input will submit (form handles this), Escape clears input
input.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    input.value = '';
    input.focus();
    clearError();
    // clear existing profile and repos for clarity
    if (profileContainer) profileContainer.innerHTML = '';
    if (reposContainer) reposContainer.innerHTML = '';
  }
});

// Remove visible message when typing again
input.addEventListener('input', () => {
  if (messageEl && !messageEl.dataset.loading) {
    messageEl.style.display = 'none';
    messageEl.textContent = '';
  }
});