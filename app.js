/**
 * THE API HUNTER - CORE JS ENGINE
 * Written in strict procedural Vanilla JavaScript. No modules, imports, or bundlers.
 */

// =========================================================================
// DOM ELEMENT SELECTORS
// =========================================================================
const toggleModeBtn = document.getElementById('toggle-mode-btn');
const singleSection = document.getElementById('single-search-section');
const battleSection = document.getElementById('battle-search-section');

const singleSearchForm = document.getElementById('single-search-form');
const singleUsernameInput = document.getElementById('single-username-input');
const singleOutput = document.getElementById('single-output');

const battleSearchForm = document.getElementById('battle-search-form');
const player1Input = document.getElementById('player1-input');
const player2Input = document.getElementById('player2-input');
const battleOutput = document.getElementById('battle-output');

// State tracking variable
let activeMode = 'single'; // Can switch between 'single' and 'battle'

// =========================================================================
// CUSTOM UTILITY FUNCTIONS
// =========================================================================

/**
 * Custom Date Formatter Utility
 * Formats ISO 8601 strings (e.g., "2023-01-25T12:00:00Z") into "25 Jan 2023".
 * Constructed natively to guarantee output structure regardless of local execution differences.
 * 
 * @param {string} isoString - The absolute ISO timestamp from the API.
 * @returns {string} Human-readable structured date representation.
 */
function formatJoinDate(isoString) {
    if (!isoString) return 'Date Unspecified';
    
    try {
        const dateObj = new Date(isoString);
        if (isNaN(dateObj.getTime())) {
            return 'Date Unspecified';
        }

        const days = dateObj.getUTCDate();
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const monthName = months[dateObj.getUTCMonth()];
        const year = dateObj.getUTCFullYear();

        return `${days} ${monthName} ${year}`;
    } catch (error) {
        return 'Date Unspecified';
    }
}

/**
 * Generates and applies a simple CSS Spinner representation inside target.
 * @param {string} outputContainerId - DOM ID of the element to inject.
 */
function renderLoading(outputContainerId) {
    const targetElement = document.getElementById(outputContainerId);
    targetElement.innerHTML = `<div class="loader" aria-label="Loading content"></div>`;
}

/**
 * Safely maps a standard structural error overlay.
 * @param {string} outputContainerId - DOM ID of the target element.
 * @param {string} message - Error description text to display.
 */
function renderError(outputContainerId, message) {
    const targetElement = document.getElementById(outputContainerId);
    targetElement.innerHTML = `<div class="error-msg">${message}</div>`;
}

// =========================================================================
// API COMMUNICATION LAYER (ASYNC/AWAIT & ENDPOINT CHAINING)
// =========================================================================

/**
 * Orchestrates fetch sequence for user profile and subsequent repos endpoint.
 * We chain endpoints using the 'repos_url' found in the initial GET response payload.
 * 
 * @param {string} username - Target identifier.
 * @returns {Promise<Object>} Object container with userData and reposData.
 */
async function fetchUserAndRepos(username) {
    const cleanUsername = username.trim();
    if (!cleanUsername) throw new Error('Input is empty.');

    // Fetch Base profile payload
    const userRes = await fetch(`https://api.github.com/users/${cleanUsername}`);
    
    // Explicit 404 management to prevent execution crash
    if (!userRes.ok) {
        if (userRes.status === 404) {
            throw new Error(`GitHub user "${cleanUsername}" was not found.`);
        }
        throw new Error(`API Fetch Issue (Status: ${userRes.status})`);
    }
    
    const userData = await userRes.json();
    
    // Endpoint Chaining: Fetch entire repository index via retrieved repos_url
    const reposRes = await fetch(userData.repos_url);
    if (!reposRes.ok) {
        throw new Error(`Could not load repository index for "${cleanUsername}"`);
    }
    
    const reposData = await reposRes.json();
    
    return {
        user: userData,
        repos: reposData
    };
}

// =========================================================================
// SINGLE MODE RENDERING
// =========================================================================

/**
 * Maps single search API returns dynamically onto the UI.
 * Sorts repositories by updated date and isolates the top 5 latest repos.
 * 
 * @param {Object} userData - Parsed user data object.
 * @param {Array} repos - Unsorted repository index.
 */
function renderSingleProfile(userData, repos) {
    // Phase 2 requirement: Isolate Top 5 Latest Repositories
    // Sort descending based on API timestamp string conversions
    const sortedRepos = [...repos].sort((a, b) => {
        return new Date(b.updated_at) - new Date(a.updated_at);
    });
    
    const topFiveRepos = sortedRepos.slice(0, 5);
    const joinedDateFormatted = formatJoinDate(userData.created_at);

    // Secure fallback parsing for personal website URLs
    let portfolioLinkHTML = 'Not Available';
    if (userData.blog) {
        const fullBlogUrl = userData.blog.startsWith('http') ? userData.blog : `https://${userData.blog}`;
        portfolioLinkHTML = `<a href="${fullBlogUrl}" target="_blank" rel="noopener noreferrer" class="profile-username" style="word-break: break-all;">${userData.blog}</a>`;
    }

    // Map profile card elements and latest repositories lists
    let reposListHTML = '';
    if (topFiveRepos.length === 0) {
        reposListHTML = `<p style="color: var(--color-text-sub); font-size: 0.95rem;">This user has no public repositories.</p>`;
    } else {
        reposListHTML = `
            <ul class="repos-list">
                ${topFiveRepos.map(repo => `
                    <li class="repo-item">
                        <a href="${repo.html_url}" target="_blank" class="repo-link" rel="noopener noreferrer">${repo.name}</a>
                        <div class="repo-stats">
                            <span>⭐ ${repo.stargazers_count || 0}</span>
                        </div>
                    </li>
                `).join('')}
            </ul>
        `;
    }

    singleOutput.innerHTML = `
        <article class="profile-card">
            <div class="profile-avatar-container">
                <img src="${userData.avatar_url}" alt="${userData.name || userData.login}'s avatar" class="profile-avatar">
            </div>
            <div class="profile-info">
                <h2>${userData.name || userData.login}</h2>
                <a href="${userData.html_url}" target="_blank" class="profile-username" rel="noopener noreferrer">@${userData.login}</a>
                <p class="profile-bio">${userData.bio || 'This profile has no bio.'}</p>
                <div class="profile-meta">
                    <span class="meta-item">Joined: <strong>${joinedDateFormatted}</strong></span>
                    <span class="meta-item">Website: <strong>${portfolioLinkHTML}</strong></span>
                </div>
            </div>
        </article>
        
        <section class="repos-section">
            <h3>Top 5 Latest Repositories</h3>
            ${reposListHTML}
        </section>
    `;
}

// =========================================================================
// BATTLE MODE RENDERING (CONCURRENCY & ACCUMULATION)
// =========================================================================

/**
 * Handles concurrently evaluating two inputs via Promise.all().
 * Performs reduction calculation on star metrics, resolves competitive states,
 * and updates elements with matching winner/loser boundaries.
 * 
 * @param {Object} player1 - Output payload for candidate 1.
 * @param {Object} player2 - Output payload for candidate 2.
 */
function renderBattleResults(player1, player2) {
    // Phase 3 requirement: Use reduce to calculate total star score
    const starSumReducer = (accumulator, currentRepo) => {
        return accumulator + (currentRepo.stargazers_count || 0);
    };

    const player1TotalStars = player1.repos.reduce(starSumReducer, 0);
    const player2TotalStars = player2.repos.reduce(starSumReducer, 0);

    // Conditional evaluation variables
    let p1Status = 'tie';
    let p2Status = 'tie';
    let p1Badge = 'Tie';
    let p2Badge = 'Tie';

    if (player1TotalStars > player2TotalStars) {
        p1Status = 'winner';
        p1Badge = '🏆 Winner';
        p2Status = 'loser';
        p2Badge = 'Loser';
    } else if (player2TotalStars > player1TotalStars) {
        p1Status = 'loser';
        p1Badge = 'Loser';
        p2Status = 'winner';
        p2Badge = '🏆 Winner';
    }

    const p1DateFormatted = formatJoinDate(player1.user.created_at);
    const p2DateFormatted = formatJoinDate(player2.user.created_at);

    battleOutput.innerHTML = `
        <div class="battle-results-grid">
            
            <!-- Challenger 1 Card wrapper -->
            <div class="battle-card-wrapper">
                <div class="battle-status-badge ${p1Status}-badge">${p1Badge}</div>
                <article class="profile-card ${p1Status}-card">
                    <div class="profile-avatar-container">
                        <img src="${player1.user.avatar_url}" alt="${player1.user.name || player1.user.login}'s avatar" class="profile-avatar">
                    </div>
                    <div class="profile-info">
                        <h2>${player1.user.name || player1.user.login}</h2>
                        <a href="${player1.user.html_url}" target="_blank" class="profile-username" rel="noopener noreferrer">@${player1.user.login}</a>
                        <p class="profile-bio">${player1.user.bio || 'No bio.'}</p>
                        <div class="profile-meta">
                            <span class="meta-item">Joined: <strong>${p1DateFormatted}</strong></span>
                            <span class="meta-item">Total Stars: <strong style="color: var(--color-battle)">⭐ ${player1TotalStars}</strong></span>
                        </div>
                    </div>
                </article>
            </div>
            
            <!-- Challenger 2 Card wrapper -->
            <div class="battle-card-wrapper">
                <div class="battle-status-badge ${p2Status}-badge">${p2Badge}</div>
                <article class="profile-card ${p2Status}-card">
                    <div class="profile-avatar-container">
                        <img src="${player2.user.avatar_url}" alt="${player2.user.name || player2.user.login}'s avatar" class="profile-avatar">
                    </div>
                    <div class="profile-info">
                        <h2>${player2.user.name || player2.user.login}</h2>
                        <a href="${player2.user.html_url}" target="_blank" class="profile-username" rel="noopener noreferrer">@${player2.user.login}</a>
                        <p class="profile-bio">${player2.user.bio || 'No bio.'}</p>
                        <div class="profile-meta">
                            <span class="meta-item">Joined: <strong>${p2DateFormatted}</strong></span>
                            <span class="meta-item">Total Stars: <strong style="color: var(--color-battle)">⭐ ${player2TotalStars}</strong></span>
                        </div>
                    </div>
                </article>
            </div>
            
        </div>
    `;
}

// =========================================================================
// EVENT HANDLERS & ROUTING CONTROLS
// =========================================================================

// Single Mode Form submit interceptor
singleSearchForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const queryValue = singleUsernameInput.value.trim();
    if (!queryValue) return;

    renderLoading('single-output');

    try {
        const { user, repos } = await fetchUserAndRepos(queryValue);
        renderSingleProfile(user, repos);
    } catch (error) {
        // Clear card and present error message as specified
        renderError('single-output', error.message);
    }
});

// Battle Mode Form submit interceptor
battleSearchForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const p1Query = player1Input.value.trim();
    const p2Query = player2Input.value.trim();

    if (!p1Query || !p2Query) return;

    renderLoading('battle-output');

    try {
        // Phase 3 requirement: Promise.all() to run concurrent API processes
        const [player1Data, player2Data] = await Promise.all([
            fetchUserAndRepos(p1Query),
            fetchUserAndRepos(p2Query)
        ]);

        renderBattleResults(player1Data, player2Data);
    } catch (error) {
        renderError('battle-output', error.message);
    }
});

// View Toggle Event Controller
toggleModeBtn.addEventListener('click', () => {
    if (activeMode === 'single') {
        activeMode = 'battle';
        toggleModeBtn.textContent = 'Switch to Single Search 🔍';
        singleSection.classList.add('hidden');
        battleSection.classList.remove('hidden');
    } else {
        activeMode = 'single';
        toggleModeBtn.textContent = 'Switch to Battle Mode ⚔️';
        battleSection.classList.add('hidden');
        singleSection.classList.remove('hidden');
    }
    
    // UI state preservation check: Clear existing values on mode shifts to prevent rendering collisions
    singleOutput.innerHTML = '';
    battleOutput.innerHTML = '';
    singleSearchForm.reset();
    battleSearchForm.reset();
});
