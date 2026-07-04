/**
 * Fetch GitHub user data by username.
 * - Uses async/await and Fetch API
 * - Returns parsed JSON on success
 * - Throws an Error with a helpful message on network or HTTP errors
 *
 * @param {string} username - GitHub username (required)
 * @param {number} [timeoutMs=10000] - optional timeout in milliseconds
 * @returns {Promise<Object>} parsed JSON user object
 * @throws {Error} when username is missing, network fails, request times out, or API returns non-OK status
 */
async function fetchGitHubUser(username, timeoutMs = 10000) {
  if (!username || typeof username !== 'string') {
    throw new Error('A valid username string is required.');
  }

  const url = `https://api.github.com/users/${encodeURIComponent(username)}`;

  // Use AbortController to support a timeout
  const controller = new AbortController();
  const signal = controller.signal;
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, { signal });

    // Clear timeout once we have a response
    clearTimeout(timeout);

    if (!response.ok) {
      // Try to parse API error message if available
      let apiMessage = `${response.status} ${response.statusText}`;
      try {
        const errBody = await response.json();
        if (errBody && errBody.message) apiMessage = `${errBody.message} (${response.status})`;
      } catch (parseErr) {
        // ignore JSON parse errors here
      }

      // Provide a helpful message for common statuses
      if (response.status === 404) {
        throw new Error(`User "${username}" not found (404).`);
      }

      throw new Error(`GitHub API error: ${apiMessage}`);
    }

    // Parse and return JSON
    const data = await response.json();
    return data;
  } catch (err) {
    clearTimeout(timeout);

    // Distinguish abort (timeout) from other network errors
    if (err.name === 'AbortError') {
      throw new Error('Request timed out. Please try again.');
    }

    // Fetch throws a TypeError on network failure / CORS issues in many environments
    if (err instanceof TypeError) {
      throw new Error('Network error or CORS issue when contacting GitHub API.');
    }

    // Re-throw any other errors
    throw err;
  }
}