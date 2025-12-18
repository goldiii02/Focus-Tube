// --- DEFAULT KEYS (Your Personal Keys) ---
// These are used until they hit the limit, then we switch to User Keys.
const DEFAULT_YT_KEY = "AIzaSyAQ7z2KevRYgkIb8wct1HipU3yYcZjvjfU"; 
const DEFAULT_GEM_KEY = "AIzaSyAQQgpdNrxg8pmY3Mdowrs8MeeVL8lKU4g"; 

// --- STATE MANAGEMENT ---
let userYoutubeKey = null;
let userGeminiKey = null;
let currentQueries = [];
let nextPageTokens = {}; 
let isFetching = false; 
let hasUserInteracted = false;

// --- 0. INITIALIZATION: Check for Saved User Keys ---
chrome.storage.local.get(['customYtKey', 'customGemKey'], (res) => {
  if (res.customYtKey) userYoutubeKey = res.customYtKey;
  if (res.customGemKey) userGeminiKey = res.customGemKey;
});

// Helper to get the active key (User's preferred, else Default)
function getKeys() {
  return {
    youtube: userYoutubeKey || DEFAULT_YT_KEY,
    gemini: userGeminiKey || DEFAULT_GEM_KEY
  };
}

// --- 1. THE WATCHDOG ---
setInterval(() => {
  if (window.location.pathname === '/' && !window.location.href.includes('/watch')) {
    if (!hasUserInteracted) {
      if (!document.getElementById('focus-modal-overlay') && !document.getElementById('quota-modal')) showModal();
    } else {
      if (!document.getElementById('focus-feed-container') && !document.getElementById('quota-modal')) {
        initFeedContainer();
        if (currentQueries.length > 0) fetchAndRender(currentQueries, false);
      }
    }
  } else {
    // Cleanup modals if leaving home
    const modal = document.getElementById('focus-modal-overlay');
    if (modal) modal.remove();
  }
}, 500);

// --- 2. SCROLL LISTENER ---
window.addEventListener('scroll', () => {
  if (!hasUserInteracted || isFetching) return;
  if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight - 500) {
    fetchAndRender(currentQueries, true);
  }
});

// --- 3. UI: THE QUOTA RESCUE MODAL ---
function showQuotaModal(errorMsg) {
  // Prevent stacking modals
  if (document.getElementById('quota-modal')) return;

  const div = document.createElement('div');
  div.id = 'quota-modal';
  div.style.cssText = `
    position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
    background: rgba(0,0,0,0.95); z-index: 10000; display: flex;
    justify-content: center; align-items: center; flex-direction: column;
  `;
  
  div.innerHTML = `
    <div class="modal-content" style="border: 1px solid #ff4444; max-width: 600px;">
      <h2 class="modal-title" style="color: #ff4444;">⚠️ API Limit Reached</h2>
      <p style="color: #ccc; font-size: 14px; margin-bottom: 20px;">
        The free shared quota for this extension has been exhausted for the day.<br>
        To continue using Focus Tube, please provide your own free API keys.
      </p>

      <div style="text-align: left; width: 100%; margin-bottom: 15px;">
        <label style="color: white; font-size: 12px; display: block; margin-bottom: 5px;">Gemini API Key (For AI Curation)</label>
        <input id="user-gem-key" class="modal-input" style="margin:0;" placeholder="Paste Gemini Key here...">
        <a href="https://aistudio.google.com/app/apikey" target="_blank" style="color: #3ea6ff; font-size: 12px; text-decoration: none; display: inline-block; margin-top: 5px;">
          👉 Get a free Gemini Key here
        </a>
      </div>

      <div style="text-align: left; width: 100%; margin-bottom: 20px;">
        <label style="color: white; font-size: 12px; display: block; margin-bottom: 5px;">YouTube API Key (For Video Data)</label>
        <input id="user-yt-key" class="modal-input" style="margin:0;" placeholder="Paste YouTube Data v3 Key here...">
        <a href="https://console.cloud.google.com/apis/credentials" target="_blank" style="color: #3ea6ff; font-size: 12px; text-decoration: none; display: inline-block; margin-top: 5px;">
          👉 Get a free YouTube Key here
        </a>
      </div>

      <button id="save-keys-btn" class="modal-btn" style="background: #3ea6ff; color: black;">Save & Resume</button>
      <p style="color: #555; font-size: 11px; margin-top: 15px;">Keys are stored locally on your device only.</p>
    </div>
  `;
  document.body.appendChild(div);

  // Pre-fill if they had partial keys
  if (userYoutubeKey) div.querySelector('#user-yt-key').value = userYoutubeKey;
  if (userGeminiKey) div.querySelector('#user-gem-key').value = userGeminiKey;

  const saveBtn = div.querySelector('#save-keys-btn');
  saveBtn.onclick = () => {
    const newGem = div.querySelector('#user-gem-key').value.trim();
    const newYt = div.querySelector('#user-yt-key').value.trim();

    if (!newGem || !newYt) {
      alert("Please enter both keys to continue.");
      return;
    }

    // Save to storage
    chrome.storage.local.set({ customYtKey: newYt, customGemKey: newGem }, () => {
      userYoutubeKey = newYt;
      userGeminiKey = newGem;
      
      div.remove();
      alert("Keys Saved! Reloading...");
      location.reload(); // Reload to retry with new keys
    });
  };
}

// --- 4. DATA FETCHING (With Error Handling) ---
async function fetchAndRender(queries, isLoadMore = false) {
  if (isFetching) return;
  isFetching = true;

  const grid = document.querySelector('.focus-grid');
  if (!grid) { isFetching = false; return; }

  let loader;
  if (isLoadMore) {
    loader = document.createElement('div');
    loader.innerHTML = '<h3 style="color:white; text-align:center; padding:20px;">Loading more...</h3>';
    grid.parentNode.appendChild(loader);
  }

  const { youtube } = getKeys();

  const promises = queries.map(q => {
    let url = `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=6&q=${q}&type=video&videoDuration=medium&key=${youtube}`;
    if (nextPageTokens[q]) url += `&pageToken=${nextPageTokens[q]}`;
    return fetch(url).then(r => r.json()).then(data => ({ query: q, data: data }));
  });

  try {
    const results = await Promise.all(promises);
    const allItems = [];
    let quotaHit = false;

    results.forEach(({ query, data }) => {
      // CHECK FOR ERRORS
      if (data.error) {
        console.error("API Error:", data.error);
        if (data.error.code === 403 || data.error.code === 429) {
          quotaHit = true;
        }
      } else if (data.items) {
        allItems.push(...data.items);
        if (data.nextPageToken) nextPageTokens[query] = data.nextPageToken;
        else delete nextPageTokens[query];
      }
    });

    // If quota hit, stop everything and show modal
    if (quotaHit) {
      showQuotaModal();
      isFetching = false;
      if (loader) loader.remove();
      return;
    }

    // Normal Rendering Logic...
    if (!isLoadMore) grid.innerHTML = ''; 
    if (loader) loader.remove();

    if (allItems.length === 0 && !isLoadMore) {
      grid.innerHTML = '<h2 style="color:white;">No videos found.</h2>';
      isFetching = false;
      return;
    }

    const seen = new Set();
    document.querySelectorAll('.card').forEach(el => seen.add(el.href.split('v=')[1]));

    allItems.forEach(item => {
      const vidId = item.id.videoId;
      if (seen.has(vidId)) return;
      seen.add(vidId);

      const d = item.snippet;
      const card = document.createElement('a');
      card.className = 'card';
      card.href = `/watch?v=${vidId}`;
      card.innerHTML = `
        <img src="${d.thumbnails.medium.url}" class="thumb">
        <div class="meta">
          <div class="info">
            <div class="title">${d.title}</div>
            <div class="channel">${d.channelTitle}</div>
          </div>
        </div>
      `;
      grid.appendChild(card);
    });

  } catch (e) {
    console.error(e);
  }

  isFetching = false;
}

// --- 5. SMART QUERIES (With Error Handling) ---
async function getSmartQueries(userInput) {
  if (!userInput.includes(',')) return [userInput];

  const { gemini } = getKeys();
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${gemini}`;
  const prompt = `Convert this user interest into 3 specific YouTube search queries: "${userInput}". Return ONLY comma-separated queries.`;
  
  try {
    const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }) });
    const data = await res.json();
    
    // Check for Gemini Errors
    if (data.error) {
      console.error("Gemini Error:", data.error);
      if (data.error.code === 403 || data.error.code === 429) {
        showQuotaModal();
        return null; // Stop execution
      }
      return userInput.split(','); // Fallback for other errors
    }

    return data.candidates[0].content.parts[0].text.split(',').map(s => s.trim());
  } catch (e) { 
    return userInput.split(','); 
  }
}

// --- 6. MODAL LOGIC (Standard Gatekeeper) ---
function showModal() {
  const div = document.createElement('div');
  div.id = 'focus-modal-overlay';
  div.innerHTML = `
    <div class="modal-content">
      <h2 class="modal-title">Infinite Focus</h2>
      <input id="focus-input" class="modal-input" placeholder="e.g. Space, Coding, Jazz" autocomplete="off">
      <button id="focus-btn" class="modal-btn">Start Feed</button>
    </div>
  `;
  document.body.appendChild(div);

  const input = div.querySelector('#focus-input');
  const btn = div.querySelector('#focus-btn');
  input.focus();

  const handleCommit = async () => {
    const val = input.value.trim();
    if (!val) return;

    btn.innerText = "Curating...";
    
    // 1. Reset State
    div.remove();
    hasUserInteracted = true;
    nextPageTokens = {}; 
    
    // 2. Init UI
    initFeedContainer(); 
    renderSkeleton();

    // 3. Get AI Queries
    const queries = await getSmartQueries(val);
    
    // If quota modal was triggered inside getSmartQueries, queries will be null
    if (!queries) return; 

    currentQueries = queries;

    // 4. Fetch Initial Batch
    await fetchAndRender(queries, false);
  };

  btn.onclick = handleCommit;
  input.onkeydown = (e) => { if (e.key === 'Enter') handleCommit(); };
}

// --- 7. HELPERS ---
function initFeedContainer() {
  const primary = document.querySelector('ytd-rich-grid-renderer');
  if (!primary) return;
  let container = document.getElementById('focus-feed-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'focus-feed-container';
    primary.appendChild(container);
  }
  if (!container.querySelector('.focus-grid')) container.innerHTML = '<div class="focus-grid"></div>';
}

function renderSkeleton() {
  const grid = document.querySelector('.focus-grid');
  if(grid) {
    let html = '';
    for(let i=0; i<8; i++) html += `<div class="skeleton-card"><div class="skeleton-thumb"></div><div class="skeleton-text"></div></div>`;
    grid.innerHTML = html;
  }
}