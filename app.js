/* ==========================================================================
   TELUGU BIBLE PWA - CENTRAL CLIENT SIDE ENGINE (app.js)
   ========================================================================== */

// --- Global Application State ---
const State = {
  booksList: [], // Loaded from Books.json
  currentBook: "Genesis",
  currentChapter: "1",
  currentView: "home",
  
  // User Personalization (saved in localStorage)
  settings: {
    theme: "notebook",
    fontSize: 18,  // Pixels for reading text
  },
  
  // User Data (saved in localStorage)
  history: [],    // Array of { book, chapter, timestamp }
  bookmarks: [],  // Array of { book, chapter, verse }
  highlights: {}, // Object: { "Book-Ch-Vs": "color_class" }
  notes: {},      // Object: { "Book-Ch-Vs": "note_text" }
  readChapters: {}, // Object: { "Book-Ch": true } for reading goals
};

// --- In-memory cache of loaded books to prevent redundant network fetches ---
const BookCache = {};

// --- Curated Inspirational Verses for Offline "Verse of the Day" ---
// Deterministic calendar seed ensures all users see the same inspiring verse daily without network dependencies.
const DAILY_VERSES = [
  { ref: "కీర్తనల గ్రంథము 23:1", text: "యెహోవా నా కాపరి; నాకు లేమి కలుగదు." },
  { ref: "యెషయా గ్రంథము 41:10", text: "నీవు నా దాసుడవనియు నేను నిన్ను ఉపేక్షింపక ఏర్పరచుకొంటిననియు చెప్పియున్నాను భయపడకుము నేను నీకు తోడైయున్నాను కలవరపడకుము నేను నీ దేవుడనై యున్నాను నేను నిన్ను బలపరతును నీకు సహాయము చేయువాడను నేనే." },
  { ref: "యోహాను సువార్త 3:16", text: "దేవుడు లోకమును ఎంతో ప్రేమించెను; కాగా ఆయన తన అద్వితీయకుమారునిగా పుట్టిన వానియందు విశ్వాసముంచు ప్రతివాడును నశింపక నిత్యజీవము పొందునట్లు ఆయనను అనుగ్రహించెను." },
  { ref: "రోమీయులకు 8:28", text: "దేవుని ప్రేమించువారికి, అనగా ఆయన సంకల్పముచొప్పున పిలువబడినవారికి, మేలుకలుగుటకై సమస్తమును సమకూడి జరుగుచున్నవని యెరుగుదుము." },
  { ref: "ఫిలిప్పీయులకు 4:13", text: "నన్ను బలపరచువానియందే నేను సమస్తమును చేయగలను." },
  { ref: "సామెతలు 3:5", text: "నీ స్వబుద్ధిని ఆధారము చేసికొనక నీ పూర్ణహృదయముతో యెహోవాయందు నమ్మకముంచుము." },
  { ref: "సామెతలు 3:6", text: "నీ ప్రవర్తన అంతటియందు ఆయన అధికారమును ఒప్పుకొనుము అప్పుడు ఆయన నీ త్రోవలను సరళము చేయును." },
  { ref: "కీర్తనల గ్రంథము 46:1", text: "దేవుడు మనకు ఆశ్రయమును దుర్గమునై యున్నాడు ఆపత్కాలములలో ఆయన నమ్ముకొనదగిన సహాయకుడు." },
  { ref: "యెహెజ్కేలు 36:26", text: "నూతన హృదయము మీ కిచ్చెదను, నూతన స్వభావము మీ యందుంచెదను; రాతిగుండెను మీలో నుండి తీసివేసి మాంసపు గుండెను మీ కిచ్చెదను." },
  { ref: "కీర్తనల గ్రంథము 119:105", text: "నీ వాక్యము నా పాదములకు దీపమును నా త్రోవకు వెలుగునై యున్నాడు." },
  { ref: "యెహోషువ 1:9", text: "నేను నీకు ఆజ్ఞ ఇచ్చియున్నాను గదా, నిబ్బరము కలిగి ధైర్యముగా ఉండుము; దిగులుపడకుము జడియకుము నీవు నడుచు మార్గమంతటిలో నీ దేవుడైన యెహోవా నీకు తోడైయుండును." },
  { ref: "మత్తయి సువార్త 6:33", text: "కాబట్టి మీరు ఆయన రాజ్యమును నీతిని మొదటి వెదకుడి; అప్పుడవన్నియు మీకనుగ్రహింపబడును." },
  { ref: "రోమీయులకు 12:2", text: "మీరు ఈ లోక మర్యాదను అనుసరింపక, ఉత్తమమును, అనుకూలమును, సంపూర్ణమునై యున్న దేవుని చిత్తమేదో పరీక్షించి తెలిసికొనునట్లు మీ మనస్సు మారి నూతనమగుటవలన రూపాంతరము పొందుడి." },
  { ref: "2 తిమోతికి 1:7", text: "దేవుడు మనకు శక్తియు ప్రేమయు ఇంద్రియ నిగ్రహమునుగల ఆత్మనే ఇచ్చెను గాని పిరికితనముగల ఆత్మనియ్యలేదు." },
  { ref: "కీర్తనల గ్రంథము 37:4", text: "యెహోవాని బట్టి సంతోషించుము ఆయన నీ హృదయవాంఛలను తీర్చును." },
  { ref: "కీర్తనల గ్రంథము 37:5", text: "నీ మార్గమును యెహోవాకు అప్పగింపుము ఆయనను నమ్ముకొనుము ఆయన కార్యము నెరవేర్చును." },
  { ref: "కీర్తనల గ్రంథము 121:1", text: "కొండలతట్టు నా కన్నులెత్తుచున్నాను; నాకు సహాయము ఎక్కడనుండి వచ్చును?" },
  { ref: "కీర్తనల గ్రంథము 121:2", text: "యెహోవావలననే నాకు సహాయము కలుగును; ఆయన భూమ్యాకాశములను సృజించినవాడు." },
  { ref: "గలతీయులకు 5:22", text: "అయినను ఆత్మ ఫలమేమనగా—ప్రేమ, సంతోషము, సమాధానము, దీర్ఘశాంతము, దయాళుత్వము, మంచితనము, విశ్వాసము, సాత్వికము, ఆశానిగ్రహము." },
  { ref: "హెబ్రీయులకు 11:1", text: "విశ్వాసమనునది నిరీక్షింపబడువాటి నిజరూపమును, అదృశ్యమైనవి యున్నవనుటకు రుజువునై యున్నది." },
  { ref: "యాకోబు 1:5", text: "మీలో ఎవనికైనను జ్ఞానము కొరతగా ఉన్నయెడల అతడు దేవుని అడుగవలెను; అప్పుడది అతనికి అనుగ్రహింపబడును; ఆయన ఎవరిని గద్దింపక అందరికిని ధారాళముగ దయచేయువాడు." },
  { ref: "1 పేతురు 5:7", text: "ఆయన మిమ్మునుగూర్చి చింతించుచున్నాడు గనుక మీ చింత యావత్తు ఆయనమీద వేయుడి." },
  { ref: "యిర్మీయా 29:11", text: "నేను మిమ్మునుగూర్చి ఉద్దేశించిన సంగతులను నేనెరుగుదును, అవి హానికరమైనవి కావు, మీకు నిరీక్షణ కలుగునట్లుగా సమాధానకరమైన ఉద్దేశములే; ఇదే యెహోవా వాక్కు." },
  { ref: "మత్తయి సువార్త 11:28", text: "ప్రయాసపడి భారము మోసికొనుచున్న సమస్త జనులారా, నా యొద్దకు రండి; నేను మీకు విశ్రాంతి కలుగజేతును." },
  { ref: "కీర్తనల గ్రంథము 19:14", text: "నా ఆశ్రయదుర్గమా, నా విమోచకుడా, యెహోవా, నా నోటి మాటలును నా హృదయ ధ్యానమును నీ దృష్టికి అంగీకారములగును గాక." },
  { ref: "ఫిలిప్పీయులకు 4:6", text: "దేనినిగూర్చియు చింతపడకుడి గాని ప్రతి విషయములోను ప్రార్థన విజ్ఞాపనములచేత కృతజ్ఞతాపూర్వకముగా మీ విన్నపములు దేవునికి తెలియజేయుడి." },
  { ref: "ఫిలిప్పీయులకు 4:7", text: "అప్పుడు సమస్త జ్ఞానమునకు మించిన దేవుని సమాధానము యేసుక్రీస్తువలన మీ హృదయములకును మీ తలంపులకును కావలియుండును." },
  { ref: "కీర్తనల గ్రంథము 27:1", text: "యెహోవా నాకు వెలుగును నా రక్షణయునై యున్నాడు, నేను ఎవరికి భయపడుదును? యెహోవా నా ప్రాణ దుర్గము, ఎవరికి వెరతును?" },
  { ref: "1 కొరింథీయులకు 16:14", text: "మీరు చేయు పనులన్నియు ప్రేమతో చేయుడి." },
  { ref: "కీర్తనల గ్రంథము 103:1", text: "నా ప్రాణమా, యెహోవాను సన్నుతించుము; నా అంతరంగముననున్న సమస్తమా, ఆయన పరిశుద్ధ నామమును సన్నుతించుము." },
  { ref: "రోమీయులకు 15:13", text: "కాగా మీరు పరిశుద్ధాత్మ శక్తివలన అధికముగా నిరీక్షణగలవారగుటకు నిరీక్షణకర్తయగు దేవుడు విశ్వాసము ద్వారా సమస్త ఆనందముతోను సమాధానముతోను మిమ్మును నింపును గాక." }
];

// --- Initialize Local Data and Settings ---
function initDataStore() {
  // Load settings
  const localSettings = localStorage.getItem("tb_settings");
  if (localSettings) {
    State.settings = JSON.parse(localSettings);
  }
  
  // Load user records
  State.history = JSON.parse(localStorage.getItem("tb_history")) || [];
  State.bookmarks = JSON.parse(localStorage.getItem("tb_bookmarks")) || [];
  State.highlights = JSON.parse(localStorage.getItem("tb_highlights")) || {};
  State.notes = JSON.parse(localStorage.getItem("tb_notes")) || {};
  State.readChapters = JSON.parse(localStorage.getItem("tb_read_chapters")) || {};

  // Apply saved theme immediately to prevent layout flash
  applyTheme(State.settings.theme);
}

function saveData(key, data) {
  localStorage.setItem(`tb_${key}`, JSON.stringify(data));
}

// --- Theme Engine ---
function applyTheme(theme) {
  // Always enforce the premium notebook theme, ignoring legacy dark options
  document.documentElement.setAttribute("data-theme", "notebook");
  State.settings.theme = "notebook";
  saveData("settings", State.settings);
}

// --- Service Worker Registration & Status ---
function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js')
        .then(reg => {
          console.log('[App] Service Worker registered successfully:', reg.scope);
          updateOfflineSyncStatus(true);
        })
        .catch(err => {
          console.error('[App] Service Worker registration failed:', err);
          updateOfflineSyncStatus(false);
        });
    });
  } else {
    updateOfflineSyncStatus(false);
  }
}

function updateOfflineSyncStatus(isAvailable) {
  const container = document.getElementById("sync-status-container");
  if (!container) return;
  
  if (isAvailable) {
    container.innerHTML = `
      <span class="sync-indicator">
        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M20 6L9 17l-5-5"/></svg>
        ఆఫ్‌లైన్ సిద్ధంగా ఉంది
      </span>
    `;
  } else {
    container.innerHTML = `
      <span class="sync-indicator" style="background-color: rgba(239, 68, 68, 0.15); color: #ef4444;">
        ఆన్‌లైన్ మాత్రమే
      </span>
    `;
  }
}

// --- Hash-Based Client Routing ---
function handleRouting() {
  const hash = window.location.hash || "#home";
  const view = hash.replace("#", "").split("?")[0];
  
  // Clean active states in nav elements
  document.querySelectorAll(".nav-item").forEach(item => item.classList.remove("active"));
  document.querySelectorAll(".mobile-nav-btn").forEach(btn => btn.classList.remove("active"));
  
  // Highlight correct menu items
  const menuTarget = document.querySelector(`.nav-item[data-target="${view}"]`);
  const mobileTarget = document.querySelector(`.mobile-nav-btn[data-target="${view}"]`);
  if (menuTarget) menuTarget.classList.add("active");
  if (mobileTarget) mobileTarget.classList.add("active");
  
  // Switch Screens
  document.querySelectorAll(".screen").forEach(screen => {
    screen.classList.remove("active");
  });
  
  const targetScreen = document.getElementById(`${view}-screen`);
  if (targetScreen) {
    targetScreen.classList.add("active");
    State.currentView = view;
  }
  
  // Perform screen specific render actions
  if (view === "home") {
    renderHomeScreen();
  } else if (view === "reader") {
    // If routing has book/chapter params, load them
    const params = new URLSearchParams(window.location.hash.split("?")[1] || "");
    const bookParam = params.get("book");
    const chParam = params.get("chapter");
    
    if (bookParam && chParam) {
      State.currentBook = decodeURIComponent(bookParam);
      State.currentChapter = chParam;
    }
    renderReaderScreen();
  } else if (view === "search") {
    // Focus search input
    setTimeout(() => {
      document.getElementById("bible-search-input")?.focus();
    }, 100);
  } else if (view === "saved") {
    renderSavedScreen();
  }
}

// --- Bible Data Loading Engine ---
async function fetchBooksIndex() {
  if (State.booksList.length > 0) return State.booksList;
  
  try {
    const response = await fetch('./data/Books.json');
    if (!response.ok) throw new Error("Index load error");
    const data = await response.json();
    // Parse out book mappings
    State.booksList = data.map(item => item.book);
    return State.booksList;
  } catch (err) {
    console.error("[Data Engine] Failed to fetch Books index:", err);
    // Fallback static structure if fetching fails (so the shell remains perfectly operational)
    State.booksList = [
      { english: "Genesis", telugu: "ఆదికాండము" },
      { english: "Exodus", telugu: "నిర్గమకాండము" },
      { english: "Leviticus", telugu: "లేవీయకాండము" },
      { english: "Numbers", telugu: "సంఖ్యాకాండము" },
      { english: "Deuteronomy", telugu: "ద్వితీయోపదేశకాండమ" }
      // ... truncated fallback
    ];
    return State.booksList;
  }
}

async function fetchBookData(bookName) {
  if (BookCache[bookName]) return BookCache[bookName];
  
  try {
    const response = await fetch(`./data/${encodeURIComponent(bookName)}.json`);
    if (!response.ok) throw new Error(`Fetch error for ${bookName}`);
    const data = await response.json();
    BookCache[bookName] = data;
    return data;
  } catch (err) {
    console.error(`[Data Engine] Failed to load book data for: ${bookName}`, err);
    return null;
  }
}

// --- SCREEN 1: HOME/DASHBOARD RENDER ---
function renderHomeScreen() {
  renderDailyVerse();
  renderRecentlyRead();
  renderReadingStats();
  setupQuickNav();
}

function renderDailyVerse() {
  const container = document.getElementById("daily-verse-container");
  if (!container) return;
  
  // Generate a seed based on year, month, date
  const now = new Date();
  const dayOfYear = Math.floor((now - new Date(now.getFullYear(), 0, 0)) / 86400000);
  const verseIndex = dayOfYear % DAILY_VERSES.length;
  const todayVerse = DAILY_VERSES[verseIndex];
  
  container.innerHTML = `
    <div class="verse-day-card">
      <div class="verse-day-tag">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
        నేటి వాక్యము
      </div>
      <p class="verse-day-text">“${todayVerse.text}”</p>
      <span class="verse-day-ref">${todayVerse.ref}</span>
      <div class="verse-day-actions">
        <button class="btn-primary" id="btn-read-daily">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
          చదువు
        </button>
        <button class="btn-secondary" id="btn-copy-daily">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
          కాపీ
        </button>
      </div>
    </div>
  `;

  // Attach dynamic clicks
  document.getElementById("btn-read-daily").addEventListener("click", () => {
    // Map today's verse to correct screen
    // We parse the ref e.g. "కీర్తనల గ్రంథము 23:1" -> Psalms chapter 23
    let targetBook = "Psalms";
    let targetCh = "23";
    
    if (todayVerse.ref.includes("కీర్తనల")) { targetBook = "Psalms"; targetCh = "23"; }
    else if (todayVerse.ref.includes("యెషయా")) { targetBook = "Isaiah"; targetCh = "41"; }
    else if (todayVerse.ref.includes("యోహాను సువార్త")) { targetBook = "John"; targetCh = "3"; }
    else if (todayVerse.ref.includes("రోమీయులకు")) { targetBook = "Romans"; targetCh = todayVerse.ref.includes("8:28") ? "8" : "15"; }
    else if (todayVerse.ref.includes("ఫిలిప్పీయులకు")) { targetBook = "Philippians"; targetCh = "4"; }
    else if (todayVerse.ref.includes("సామెతలు")) { targetBook = "Proverbs"; targetCh = "3"; }
    else if (todayVerse.ref.includes("యెహోషువ")) { targetBook = "Joshua"; targetCh = "1"; }
    else if (todayVerse.ref.includes("మత్తయి")) { targetBook = "Matthew"; targetCh = todayVerse.ref.includes("6:33") ? "6" : "11"; }
    else if (todayVerse.ref.includes("2 తిమోతికి")) { targetBook = "2 Timothy"; targetCh = "1"; }
    else if (todayVerse.ref.includes("గలతీయులకు")) { targetBook = "Galatians"; targetCh = "5"; }
    else if (todayVerse.ref.includes("హెబ్రీయులకు")) { targetBook = "Hebrews"; targetCh = "11"; }
    else if (todayVerse.ref.includes("యాకోబు")) { targetBook = "James"; targetCh = "1"; }
    else if (todayVerse.ref.includes("1 పేతురు")) { targetBook = "1 Peter"; targetCh = "5"; }
    else if (todayVerse.ref.includes("యిర్మీయా")) { targetBook = "Jeremiah"; targetCh = "29"; }
    else if (todayVerse.ref.includes("1 కొరింథీయులకు")) { targetBook = "1 Corinthians"; targetCh = "16"; }
    
    navigateToReader(targetBook, targetCh);
  });

  document.getElementById("btn-copy-daily").addEventListener("click", () => {
    const textToCopy = `“${todayVerse.text}” - ${todayVerse.ref}\nతెలుగు బైబిల్ యాప్ నుండి`;
    navigator.clipboard.writeText(textToCopy).then(() => {
      showToast("దైవవాక్యం కాపీ చేయబడింది!");
    });
  });
}

function renderRecentlyRead() {
  const container = document.getElementById("recently-read-container");
  if (!container) return;
  
  if (State.history.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; color: var(--text-muted); padding: 1.5rem 0;">
        ఇంకా ఏమీ చదవలేదు.<br>చదవడం ప్రారంభించండి!
      </div>
    `;
    return;
  }
  
  // Get unique list of top 3 recent history items
  const uniqueHistory = [];
  const map = new Map();
  for (const item of State.history) {
    const key = `${item.book}-${item.chapter}`;
    if (!map.has(key)) {
      map.set(key, true);
      uniqueHistory.push(item);
    }
    if (uniqueHistory.length >= 3) break;
  }
  
  let html = `<div class="history-list">`;
  uniqueHistory.forEach(item => {
    const bookObj = State.booksList.find(b => b.english === item.book);
    const teluguName = bookObj ? bookObj.telugu : item.book;
    
    // Nice friendly time representation
    const date = new Date(item.timestamp);
    const timeStr = date.toLocaleDateString('te-IN', { month: 'short', day: 'numeric' }) + " " + date.toLocaleTimeString('te-IN', { hour: '2-digit', minute: '2-digit' });
    
    html += `
      <div class="history-item" onclick="navigateToReader('${item.book}', '${item.chapter}')">
        <div class="history-info">
          <span class="history-ref">${teluguName} - అధ్యాయము ${item.chapter}</span>
          <span class="history-time">${timeStr}</span>
        </div>
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--gold-primary)" stroke-width="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
      </div>
    `;
  });
  html += `</div>`;
  container.innerHTML = html;
}

function renderReadingStats() {
  // Bookmarks count
  document.getElementById("stat-bookmarks-count").textContent = State.bookmarks.length;
  // Highlights count
  document.getElementById("stat-highlights-count").textContent = Object.keys(State.highlights).length;
  // Notes count
  document.getElementById("stat-notes-count").textContent = Object.keys(State.notes).length;
  
  // Reading plan completion calculation (Total chapters read in Bible)
  // Total Bible chapters is 1189
  const totalReadCount = Object.keys(State.readChapters).length;
  const percent = Math.min(100, Math.round((totalReadCount / 1189) * 100));
  
  document.getElementById("plan-progress-percent").textContent = `${percent}%`;
  document.getElementById("plan-progress-text").textContent = `${totalReadCount} / 1189 అధ్యాయాలు చదివారు`;
  document.getElementById("plan-progress-fill").style.width = `${percent}%`;
}

function setupQuickNav() {
  const container = document.getElementById("quick-books-grid");
  if (!container) return;
  
  let currentTestament = "ot"; // 'ot' (Old) or 'nt' (New)
  
  const otToggle = document.getElementById("toggle-ot");
  const ntToggle = document.getElementById("toggle-nt");
  
  if (otToggle && ntToggle) {
    otToggle.onclick = () => {
      otToggle.classList.add("active");
      ntToggle.classList.remove("active");
      currentTestament = "ot";
      renderBooksList();
    };
    
    ntToggle.onclick = () => {
      ntToggle.classList.add("active");
      otToggle.classList.remove("active");
      currentTestament = "nt";
      renderBooksList();
    };
  }
  
  const renderBooksList = () => {
    container.innerHTML = "";
    
    // Split point: Old Testament ends at Malachi (Book 39 in Bible index)
    // Genesis starts, Malachi is 39th
    // In Books.json, we have exactly 66 books sorted in canonical order.
    // Index 0 to 38 are OT. Index 39 to 65 are NT.
    State.booksList.forEach((book, index) => {
      const isNT = index >= 39;
      if ((currentTestament === "ot" && isNT) || (currentTestament === "nt" && !isNT)) {
        return;
      }
      
      const card = document.createElement("div");
      card.className = "book-card";
      card.innerHTML = `
        <span class="book-telugu">${book.telugu}</span>
        <span class="book-english">${book.english}</span>
      `;
      card.onclick = () => {
        // Go straight to reader page for this book
        navigateToReader(book.english, "1");
      };
      container.appendChild(card);
    });
  };
  
  renderBooksList();
}

// --- SCREEN 2: BIBLE READER RENDER & LOGIC ---
async function renderReaderScreen() {
  // Stop SpeechSynthesis when changing chapters/books to avoid bleeding audio
  if (typeof AudioPlayer !== 'undefined' && AudioPlayer.isReading) {
    AudioPlayer.stop();
  }

  const versesContainer = document.getElementById("verses-scroll-container");
  if (!versesContainer) return;
  
  // Set UI labels
  const bookObj = State.booksList.find(b => b.english === State.currentBook);
  const bookTelugu = bookObj ? bookObj.telugu : State.currentBook;
  
  document.getElementById("btn-book-select").querySelector(".selector-value").textContent = bookTelugu;
  document.getElementById("btn-chapter-select").querySelector(".selector-value").textContent = State.currentChapter;
  
  // Show loaded loading screen first
  versesContainer.innerHTML = `
    <div class="loading-container">
      <div class="spinner"></div>
      <p style="font-family: 'Noto Sans Telugu', sans-serif;">అధ్యాయాన్ని లోడ్ చేస్తోంది...</p>
    </div>
  `;
  
  // Load book data
  const bookData = await fetchBookData(State.currentBook);
  if (!bookData) {
    versesContainer.innerHTML = `
      <div style="text-align: center; color: var(--text-muted); padding: 3rem 1rem;">
        ఈ పుస్తకాన్ని లోడ్ చేయడంలో విఫలమైంది. దయచేసి ఇంటర్నెట్ కనెక్షన్‌ని తనిఖీ చేయండి.
      </div>
    `;
    return;
  }
  
  // Find current chapter
  const chapterData = bookData.chapters.find(ch => ch.chapter === State.currentChapter);
  if (!chapterData) {
    versesContainer.innerHTML = `
      <div style="text-align: center; color: var(--text-muted); padding: 3rem 1rem;">
        అధ్యాయము ${State.currentChapter} కనుగొనబడలేదు.
      </div>
    `;
    return;
  }
  
  // Build verses list
  let html = `<div class="verses-list">`;
  chapterData.verses.forEach(vs => {
    const key = `${State.currentBook}-${State.currentChapter}-${vs.verse}`;
    const hlColor = State.highlights[key] || "";
    const hasBookmark = State.bookmarks.some(b => b.book === State.currentBook && b.chapter === State.currentChapter && b.verse === vs.verse);
    
    let rowClass = "verse-row";
    if (hlColor) rowClass += ` hl-${hlColor}`;
    if (hasBookmark) rowClass += " has-bookmark";
    
    html += `
      <div class="${rowClass}" data-verse="${vs.verse}" onclick="handleVerseInteraction(this, '${vs.verse}', \`${vs.text.replace(/"/g, '&quot;')}\`)">
        <div class="verse-num-badge">${vs.verse}</div>
        <div class="verse-text-body" style="font-size: ${State.settings.fontSize}px;">${vs.text}</div>
      </div>
    `;
  });
  html += `</div>`;
  
  // Set reader view controls
  const nextBtn = document.getElementById("reader-next-btn");
  const prevBtn = document.getElementById("reader-prev-btn");
  
  // Chapter pagination calculations
  const totalChapters = parseInt(bookData.count);
  const currentChNum = parseInt(State.currentChapter);
  
  // Next chapter action
  if (currentChNum < totalChapters) {
    nextBtn.style.display = "flex";
    nextBtn.onclick = () => {
      State.currentChapter = (currentChNum + 1).toString();
      updateReaderParams();
      renderReaderScreen();
    };
  } else {
    // Check if there is a next book
    const currentBookIndex = State.booksList.findIndex(b => b.english === State.currentBook);
    if (currentBookIndex < State.booksList.length - 1) {
      nextBtn.style.display = "flex";
      nextBtn.onclick = () => {
        State.currentBook = State.booksList[currentBookIndex + 1].english;
        State.currentChapter = "1";
        updateReaderParams();
        renderReaderScreen();
      };
    } else {
      nextBtn.style.display = "none";
    }
  }
  
  // Previous chapter action
  if (currentChNum > 1) {
    prevBtn.style.display = "flex";
    prevBtn.onclick = () => {
      State.currentChapter = (currentChNum - 1).toString();
      updateReaderParams();
      renderReaderScreen();
    };
  } else {
    // Check if there is a previous book
    const currentBookIndex = State.booksList.findIndex(b => b.english === State.currentBook);
    if (currentBookIndex > 0) {
      prevBtn.style.display = "flex";
      prevBtn.onclick = async () => {
        const prevBookName = State.booksList[currentBookIndex - 1].english;
        State.currentBook = prevBookName;
        // Fetch book to know chapter count
        const prevBookData = await fetchBookData(prevBookName);
        State.currentChapter = prevBookData ? prevBookData.count : "1";
        updateReaderParams();
        renderReaderScreen();
      };
    } else {
      prevBtn.style.display = "none";
    }
  }
  
  versesContainer.innerHTML = html;
  versesContainer.scrollTop = 0;
  
  // Save to Reading History
  const historyItem = {
    book: State.currentBook,
    chapter: State.currentChapter,
    timestamp: Date.now()
  };
  // Prepend to history, filter duplicates, keep last 20 items
  State.history.unshift(historyItem);
  State.history = State.history.slice(0, 30);
  saveData("history", State.history);
  
  // Mark this chapter as Read
  const readKey = `${State.currentBook}-${State.currentChapter}`;
  State.readChapters[readKey] = true;
  saveData("read_chapters", State.readChapters);
}

function updateReaderParams() {
  window.history.replaceState(null, "", `#reader?book=${encodeURIComponent(State.currentBook)}&chapter=${State.currentChapter}`);
}

// --- Interactive Verse Panel Context Handler ---
let activeSelectedVerse = null; // Stores { verseNum, text, element }

function handleVerseInteraction(element, verseNum, text) {
  activeSelectedVerse = { verseNum, text, element };
  
  const sheet = document.getElementById("verse-action-sheet");
  const backdrop = document.getElementById("modal-backdrop");
  
  if (!sheet || !backdrop) return;
  
  const bookObj = State.booksList.find(b => b.english === State.currentBook);
  const bookTelugu = bookObj ? bookObj.telugu : State.currentBook;
  const refString = `${bookTelugu} ${State.currentChapter}:${verseNum}`;
  
  document.getElementById("action-verse-ref").textContent = refString;
  document.getElementById("action-verse-preview").textContent = text;
  
  // Highlight indicator selection
  const key = `${State.currentBook}-${State.currentChapter}-${verseNum}`;
  const hlColor = State.highlights[key] || "";
  
  document.querySelectorAll(".hl-circle").forEach(circle => {
    if (circle.getAttribute("data-color") === hlColor) {
      circle.classList.add("selected");
    } else {
      circle.classList.remove("selected");
    }
  });
  
  // Bookmark button state toggle
  const hasBookmark = State.bookmarks.some(b => b.book === State.currentBook && b.chapter === State.currentChapter && b.verse === verseNum);
  const bookmarkBtn = document.getElementById("btn-action-bookmark");
  if (bookmarkBtn) {
    if (hasBookmark) {
      bookmarkBtn.querySelector("span").textContent = "బుక్‌మార్క్ తీసివేయి";
      bookmarkBtn.querySelector("svg").style.fill = "var(--gold-primary)";
    } else {
      bookmarkBtn.querySelector("span").textContent = "బుక్‌మార్క్";
      bookmarkBtn.querySelector("svg").style.fill = "none";
    }
  }
  
  // Open Notes input editor if notes exist
  const noteText = State.notes[key] || "";
  const noteContainer = document.getElementById("action-note-input-container");
  const noteArea = document.getElementById("action-note-text");
  
  if (noteContainer && noteArea) {
    noteArea.value = noteText;
    if (noteText) {
      noteContainer.classList.add("open");
    } else {
      noteContainer.classList.remove("open");
    }
  }
  
  // Show Sheet
  sheet.classList.add("open");
  backdrop.classList.add("active");
}

function closeVerseActions() {
  const sheet = document.getElementById("verse-action-sheet");
  const backdrop = document.getElementById("modal-backdrop");
  if (sheet) sheet.classList.remove("open");
  if (backdrop) backdrop.classList.remove("active");
  activeSelectedVerse = null;
}

// Setup Interactive Action Buttons Listeners
function setupActionListeners() {
  // Highlighter Circles Click
  document.querySelectorAll(".hl-circle").forEach(circle => {
    circle.onclick = () => {
      if (!activeSelectedVerse) return;
      
      const color = circle.getAttribute("data-color");
      const key = `${State.currentBook}-${State.currentChapter}-${activeSelectedVerse.verseNum}`;
      
      // Update local state
      if (color) {
        State.highlights[key] = color;
      } else {
        delete State.highlights[key]; // Clear
      }
      
      saveData("highlights", State.highlights);
      
      // Dynamic rendering update without full redraw
      const row = activeSelectedVerse.element;
      row.className = "verse-row";
      if (color) row.classList.add(`hl-${color}`);
      
      // Retain bookmark border if active
      const hasBookmark = State.bookmarks.some(b => b.book === State.currentBook && b.chapter === State.currentChapter && b.verse === activeSelectedVerse.verseNum);
      if (hasBookmark) row.classList.add("has-bookmark");
      
      closeVerseActions();
      showToast(color ? "రంగు హైలైట్ చేయబడింది!" : "హైలైట్ తీసివేయబడింది!");
    };
  });
  
  // Bookmark Toggle action
  document.getElementById("btn-action-bookmark").onclick = () => {
    if (!activeSelectedVerse) return;
    
    const verseNum = activeSelectedVerse.verseNum;
    const index = State.bookmarks.findIndex(b => b.book === State.currentBook && b.chapter === State.currentChapter && b.verse === verseNum);
    
    if (index > -1) {
      // Remove bookmark
      State.bookmarks.splice(index, 1);
      activeSelectedVerse.element.classList.remove("has-bookmark");
      showToast("బుక్‌మార్క్ తొలగించబడింది!");
    } else {
      // Add bookmark
      State.bookmarks.push({ book: State.currentBook, chapter: State.currentChapter, verse: verseNum });
      activeSelectedVerse.element.classList.add("has-bookmark");
      showToast("బుక్‌మార్క్ చేయబడింది!");
    }
    
    saveData("bookmarks", State.bookmarks);
    closeVerseActions();
  };
  
  // Copy Verse action
  document.getElementById("btn-action-copy").onclick = () => {
    if (!activeSelectedVerse) return;
    
    const bookObj = State.booksList.find(b => b.english === State.currentBook);
    const bookTelugu = bookObj ? bookObj.telugu : State.currentBook;
    const textToCopy = `“${activeSelectedVerse.text}”\n- ${bookTelugu} ${State.currentChapter}:${activeSelectedVerse.verseNum}`;
    
    navigator.clipboard.writeText(textToCopy).then(() => {
      showToast("వాక్యం కాపీ చేయబడింది!");
      closeVerseActions();
    });
  };
  
  // Toggle Note Editor visibility
  document.getElementById("btn-action-note").onclick = () => {
    const container = document.getElementById("action-note-input-container");
    container.classList.toggle("open");
    if (container.classList.contains("open")) {
      document.getElementById("action-note-text").focus();
    }
  };
  
  // Save Note Text
  document.getElementById("btn-save-note").onclick = () => {
    if (!activeSelectedVerse) return;
    
    const text = document.getElementById("action-note-text").value.trim();
    const key = `${State.currentBook}-${State.currentChapter}-${activeSelectedVerse.verseNum}`;
    
    if (text) {
      State.notes[key] = text;
      showToast("నోట్ భద్రపరచబడింది!");
    } else {
      delete State.notes[key];
      showToast("నోట్ తొలగించబడింది!");
    }
    
    saveData("notes", State.notes);
    closeVerseActions();
  };
  
  // Share Native Action
  document.getElementById("btn-action-share").onclick = () => {
    if (!activeSelectedVerse) return;
    
    const bookObj = State.booksList.find(b => b.english === State.currentBook);
    const bookTelugu = bookObj ? bookObj.telugu : State.currentBook;
    const shareText = `“${activeSelectedVerse.text}”\n- ${bookTelugu} ${State.currentChapter}:${activeSelectedVerse.verseNum}\nతెలుగు బైబిల్ ఆఫ్‌లైన్ యాప్`;
    
    if (navigator.share) {
      navigator.share({
        title: 'పరిశుద్ధ గ్రంథము వాక్యం',
        text: shareText
      }).catch(err => {
        console.log("Share canceled", err);
      });
    } else {
      // Fallback to copy and message
      navigator.clipboard.writeText(shareText).then(() => {
        showToast("షేర్ చేయడానికి కాపీ చేయబడింది!");
      });
    }
    closeVerseActions();
  };
}

// --- BOOK AND CHAPTER CHOICE BOTTOM SHEETS ---
let activeSelectionMode = ""; // 'book' or 'chapter'

function openSelectorSheet(mode) {
  activeSelectionMode = mode;
  const sheet = document.getElementById("bottom-selector-sheet");
  const backdrop = document.getElementById("modal-backdrop");
  const title = document.getElementById("sheet-title-label");
  const content = document.getElementById("sheet-scroll-content");
  
  if (!sheet || !backdrop || !content) return;
  
  content.innerHTML = "";
  
  if (mode === "book") {
    title.textContent = "పుస్తకాన్ని ఎంచుకోండి";
    
    // Render books categorised in grids
    const otTitle = document.createElement("h3");
    otTitle.className = "card-title";
    otTitle.style.marginTop = "0";
    otTitle.textContent = "పాత నిబంధన";
    content.appendChild(otTitle);
    
    const otGrid = document.createElement("div");
    otGrid.className = "sheet-chapters-grid";
    otGrid.style.gridTemplateColumns = "repeat(auto-fill, minmax(110px, 1fr))";
    otGrid.style.marginBottom = "2rem";
    
    const ntTitle = document.createElement("h3");
    ntTitle.className = "card-title";
    ntTitle.textContent = "క్రొత్త నిబంధన";
    
    const ntGrid = document.createElement("div");
    ntGrid.className = "sheet-chapters-grid";
    ntGrid.style.gridTemplateColumns = "repeat(auto-fill, minmax(110px, 1fr))";
    
    State.booksList.forEach((book, index) => {
      const btn = document.createElement("button");
      btn.className = "chapter-btn";
      btn.style.aspectRatio = "auto";
      btn.style.padding = "12px 6px";
      btn.style.height = "52px";
      btn.innerHTML = `<span style="font-family: 'Noto Sans Telugu', sans-serif; font-size: 0.8rem; font-weight:600; line-height:1.2;">${book.telugu}</span>`;
      
      btn.onclick = () => {
        State.currentBook = book.english;
        State.currentChapter = "1"; // Reset to chapter 1
        closeSelectorSheet();
        updateReaderParams();
        renderReaderScreen();
      };
      
      if (index >= 39) {
        ntGrid.appendChild(btn);
      } else {
        otGrid.appendChild(btn);
      }
    });
    
    content.appendChild(otGrid);
    content.appendChild(ntTitle);
    content.appendChild(ntGrid);
    
  } else if (mode === "chapter") {
    title.textContent = "అధ్యాయాన్ని ఎంచుకోండి";
    
    // We must fetch book data or look at loaded Cache to know chapter counts
    const bookData = BookCache[State.currentBook];
    if (!bookData) {
      content.innerHTML = `<div style="text-align:center; padding: 2rem;">లోడ్ అవుతోంది...</div>`;
      // Load index count in background
      fetchBookData(State.currentBook).then(data => {
        if (data) openSelectorSheet("chapter"); // Re-run
      });
      return;
    }
    
    const totalChapters = parseInt(bookData.count);
    const grid = document.createElement("div");
    grid.className = "sheet-chapters-grid";
    
    for (let i = 1; i <= totalChapters; i++) {
      const btn = document.createElement("button");
      btn.className = `chapter-btn ${State.currentChapter === i.toString() ? 'selected' : ''}`;
      btn.textContent = i;
      btn.onclick = () => {
        State.currentChapter = i.toString();
        closeSelectorSheet();
        updateReaderParams();
        renderReaderScreen();
      };
      grid.appendChild(btn);
    }
    content.appendChild(grid);
  }
  
  sheet.classList.add("open");
  backdrop.classList.add("active");
}

function closeSelectorSheet() {
  const sheet = document.getElementById("bottom-selector-sheet");
  const backdrop = document.getElementById("modal-backdrop");
  if (sheet) sheet.classList.remove("open");
  if (backdrop) backdrop.classList.remove("active");
  activeSelectionMode = "";
}

// --- READER OPTIONS SETTINGS POPUP ---
function openOptionsDialog() {
  document.getElementById("reader-options-dialog").classList.add("open");
  document.getElementById("modal-backdrop").classList.add("active");
  
  // Set current slider value
  document.getElementById("font-slider").value = State.settings.fontSize;
  document.getElementById("font-size-preview-val").textContent = State.settings.fontSize;
}

function closeOptionsDialog() {
  document.getElementById("reader-options-dialog").classList.remove("open");
  document.getElementById("modal-backdrop").classList.remove("active");
}

function applySettings() {
  const fontVal = parseInt(document.getElementById("font-slider").value);
  State.settings.fontSize = fontVal;
  saveData("settings", State.settings);
  
  // Re-adjust active DOM font size instantly
  document.querySelectorAll(".verse-text-body").forEach(body => {
    body.style.fontSize = `${fontVal}px`;
  });
  
  document.getElementById("font-size-preview-val").textContent = fontVal;
}

// --- SCREEN 3: ASYNCHRONOUS GLOBAL SEARCH SYSTEM ---
let searchTaskTimer = null;

function handleSearchInput(query) {
  clearTimeout(searchTaskTimer);
  const container = document.getElementById("search-results-container");
  const stats = document.getElementById("search-stats-label");
  
  if (!container) return;
  
  const trimQuery = query.trim();
  if (trimQuery.length < 2) {
    container.innerHTML = `
      <div style="text-align: center; color: var(--text-muted); padding: 3rem 1rem;">
        శోధించడానికి కనీసం రెండు అక్షరాలను టైప్ చేయండి.
      </div>
    `;
    stats.textContent = "";
    return;
  }
  
  // Debounce key presses by 400ms to allow smooth typing
  searchTaskTimer = setTimeout(() => {
    performGlobalSearch(trimQuery);
  }, 400);
}

async function performGlobalSearch(query) {
  const container = document.getElementById("search-results-container");
  const stats = document.getElementById("search-stats-label");
  
  container.innerHTML = `
    <div class="loading-container">
      <div class="spinner"></div>
      <p style="font-family: 'Noto Sans Telugu', sans-serif;">మొత్తం బైబిల్‌లో శోధిస్తోంది... దయచేసి వేచి ఉండండి.</p>
    </div>
  `;
  stats.textContent = "శోధిస్తోంది...";
  
  // Asynchronously scan across all books
  const results = [];
  const queryLower = query.toLowerCase();
  
  try {
    // Make sure books index list is ready
    await fetchBooksIndex();
    
    // We trigger dynamic fetches for all 66 books in sequence (in small parallel batches to avoid lockouts)
    // Since books are in Service Worker Cache, fetches resolve almost instantly.
    const batchSize = 10;
    for (let i = 0; i < State.booksList.length; i += batchSize) {
      const batch = State.booksList.slice(i, i + batchSize);
      
      await Promise.all(batch.map(async (book) => {
        const data = await fetchBookData(book.english);
        if (!data) return;
        
        const teluguBookName = book.telugu;
        const isNT = State.booksList.findIndex(b => b.english === book.english) >= 39;
        
        data.chapters.forEach(ch => {
          ch.verses.forEach(vs => {
            if (vs.text.toLowerCase().includes(queryLower)) {
              results.push({
                bookName: book.english,
                teluguBook: teluguBookName,
                chapter: ch.chapter,
                verse: vs.verse,
                text: vs.text,
                testament: isNT ? "క్రొత్త నిబంధన" : "పాత నిబంధన"
              });
            }
          });
        });
      }));
    }
    
    // Render Results
    if (results.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; color: var(--text-muted); padding: 3rem 1rem;">
          "${query}" కి సరిపోలే ఫలితాలు ఏవీ కనుగొనబడలేదు.
        </div>
      `;
      stats.textContent = "ఫలితాలు ఏవీ లేవు";
      return;
    }
    
    stats.textContent = `మొత్తం ${results.length} ఫలితాలు కనుగొనబడ్డాయి.`;
    
    let html = `<div class="search-results-list">`;
    results.slice(0, 150).forEach(res => { // Cap rendering list at 150 for super fast rendering performance
      // Regex highlight keywords
      const markedText = res.text.replace(new RegExp(`(${escapeRegExp(query)})`, 'gi'), '<mark>$1</mark>');
      
      html += `
        <div class="search-result-card" onclick="navigateToReader('${res.bookName}', '${res.chapter}')">
          <div class="search-result-header">
            <span class="search-result-ref">${res.teluguBook} ${res.chapter}:${res.verse}</span>
            <span class="search-result-testament">${res.testament}</span>
          </div>
          <p class="search-result-body">${markedText}</p>
        </div>
      `;
    });
    
    if (results.length > 150) {
      html += `
        <div style="text-align: center; color: var(--text-muted); padding: 1rem; font-size:0.85rem;">
          మరిన్ని ఫలితాలను చూపించడానికి మీ శోధనను మరింత నిర్దిష్టంగా చేయండి.
        </div>
      `;
    }
    
    html += `</div>`;
    container.innerHTML = html;
  } catch (err) {
    console.error("[Search Engine] Fatal error searching:", err);
    container.innerHTML = `<div style="text-align:center; padding:2rem; color:red;">శోధనలో సాంకేతిక లోపం సంభవించింది.</div>`;
  }
}

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// --- SCREEN 4: SAVED NOTES & BOOKMARKS HUB ---
function renderSavedScreen() {
  const container = document.getElementById("saved-items-container");
  if (!container) return;
  
  const activeTab = document.querySelector(".saved-tab-btn.active")?.getAttribute("data-tab") || "bookmarks";
  container.innerHTML = "";
  
  if (activeTab === "bookmarks") {
    if (State.bookmarks.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; color: var(--text-muted); padding: 3rem 1rem;">
          బుక్‌మార్క్‌లు ఏవీ లేవు.
        </div>
      `;
      return;
    }
    
    let html = `<div class="saved-items-list">`;
    // Fetch bookmarks details
    State.bookmarks.forEach((bm, index) => {
      const bookObj = State.booksList.find(b => b.english === bm.book);
      const teluguName = bookObj ? bookObj.telugu : bm.book;
      
      html += `
        <div class="saved-card">
          <div class="saved-card-header">
            <span class="saved-card-ref" onclick="navigateToReader('${bm.book}', '${bm.chapter}')">
              ${teluguName} ${bm.chapter}:${bm.verse}
            </span>
            <button class="saved-card-delete" onclick="removeBookmarkByIndex(${index})">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M10 11v6M14 11v6"/></svg>
            </button>
          </div>
          <p class="saved-card-text" id="bm-text-${index}">వాక్యాన్ని లోడ్ చేస్తోంది...</p>
        </div>
      `;
      
      // Async fetch loaded text
      fetchBookData(bm.book).then(data => {
        if (!data) return;
        const textElement = document.getElementById(`bm-text-${index}`);
        if (!textElement) return;
        const ch = data.chapters.find(c => c.chapter === bm.chapter);
        const vs = ch ? ch.verses.find(v => v.verse === bm.verse) : null;
        if (vs) textElement.textContent = vs.text;
      });
    });
    html += `</div>`;
    container.innerHTML = html;
    
  } else if (activeTab === "highlights") {
    const keys = Object.keys(State.highlights);
    if (keys.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; color: var(--text-muted); padding: 3rem 1rem;">
          హైలైట్లు ఏవీ లేవు.
        </div>
      `;
      return;
    }
    
    let html = `<div class="saved-items-list">`;
    keys.forEach((key, index) => {
      const [book, chapter, verse] = key.split("-");
      const bookObj = State.booksList.find(b => b.english === book);
      const teluguName = bookObj ? bookObj.telugu : book;
      const hlColor = State.highlights[key];
      
      html += `
        <div class="saved-card hl-${hlColor}">
          <div class="saved-card-header">
            <span class="saved-card-ref" onclick="navigateToReader('${book}', '${chapter}')">
              ${teluguName} ${chapter}:${verse}
            </span>
            <button class="saved-card-delete" onclick="removeHighlightByKey('${key}')">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M10 11v6M14 11v6"/></svg>
            </button>
          </div>
          <p class="saved-card-text" id="hl-text-${index}">వాక్యాన్ని లోడ్ చేస్తోంది...</p>
        </div>
      `;
      
      fetchBookData(book).then(data => {
        if (!data) return;
        const textElement = document.getElementById(`hl-text-${index}`);
        if (!textElement) return;
        const ch = data.chapters.find(c => c.chapter === chapter);
        const vs = ch ? ch.verses.find(v => v.verse === verse) : null;
        if (vs) textElement.textContent = vs.text;
      });
    });
    html += `</div>`;
    container.innerHTML = html;
    
  } else if (activeTab === "notes") {
    const keys = Object.keys(State.notes);
    if (keys.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; color: var(--text-muted); padding: 3rem 1rem;">
          రాసుకున్న నోట్స్ ఏవీ లేవు.
        </div>
      `;
      return;
    }
    
    let html = `<div class="saved-items-list">`;
    keys.forEach((key, index) => {
      const [book, chapter, verse] = key.split("-");
      const bookObj = State.booksList.find(b => b.english === book);
      const teluguName = bookObj ? bookObj.telugu : book;
      const noteText = State.notes[key];
      
      html += `
        <div class="saved-card">
          <div class="saved-card-header">
            <span class="saved-card-ref" onclick="navigateToReader('${book}', '${chapter}')">
              ${teluguName} ${chapter}:${verse}
            </span>
            <button class="saved-card-delete" onclick="removeNoteByKey('${key}')">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M10 11v6M14 11v6"/></svg>
            </button>
          </div>
          <p class="saved-card-text" style="color: var(--text-secondary); border-left:3px solid var(--gold-primary); padding-left:12px;" id="nt-text-${index}">వాక్యాన్ని లోడ్ చేస్తోంది...</p>
          <div class="saved-card-note-box">
            <strong>రాసిన వ్యాఖ్య:</strong> ${noteText}
          </div>
        </div>
      `;
      
      fetchBookData(book).then(data => {
        if (!data) return;
        const textElement = document.getElementById(`nt-text-${index}`);
        if (!textElement) return;
        const ch = data.chapters.find(c => c.chapter === chapter);
        const vs = ch ? ch.verses.find(v => v.verse === verse) : null;
        if (vs) textElement.textContent = vs.text;
      });
    });
    html += `</div>`;
    container.innerHTML = html;
    
  } else if (activeTab === "settings") {
    // Render backup / restore settings screen
    container.innerHTML = `
      <div class="settings-section">
        <h3 class="card-title" style="margin-top:0;">డేటా బ్యాకప్ & రీస్టోర్</h3>
        <p style="font-size:0.85rem; color:var(--text-secondary); margin-bottom:1.5rem;">
          మీరు సృష్టించిన నోట్స్, బుక్‌మార్క్‌లు మరియు హైలైట్‌లను సురక్షితంగా బ్యాకప్ ఫైల్‌గా డౌన్‌లోడ్ చేసుకోవచ్చు లేదా తిరిగి యాప్‌లోకి లోడ్ చేసుకోవచ్చు.
        </p>
        <div class="settings-row">
          <div>
            <div class="settings-label">డేటా బ్యాకప్ తీసుకోండి</div>
            <div class="settings-desc">భద్రపరిచిన మొత్తం సమాచారాన్ని ఫైల్‌గా డౌన్‌లోడ్ చేయండి</div>
          </div>
          <button class="btn-primary" onclick="exportUserData()">డౌన్‌లోడ్</button>
        </div>
        <div class="settings-row">
          <div>
            <div class="settings-label">బ్యాకప్ ఫైల్ రీస్టోర్ చేయండి</div>
            <div class="settings-desc">డౌన్‌లోడ్ చేసిన ఫైల్ నుండి డేటాను రీస్టోర్ చేయండి</div>
          </div>
          <div>
            <input type="file" id="import-backup-file" style="display:none;" accept=".json" onchange="importUserData(this)">
            <button class="btn-secondary" onclick="document.getElementById('import-backup-file').click()">ఫైల్ ఎంచుకో</button>
          </div>
        </div>
      </div>
      
      <div class="settings-section">
        <h3 class="card-title" style="color: #ef4444;">డేటా రీసెట్</h3>
        <div class="settings-row">
          <div>
            <div class="settings-label" style="color:#ef4444;">యాప్ మొత్తం రీసెట్ చేయి</div>
            <div class="settings-desc">నోట్స్, హిస్టరీ, బుక్‌మార్క్‌లతో సహా మొత్తం లోకల్ డేటా శాశ్వతంగా తొలగించబడుతుంది</div>
          </div>
          <button class="btn-secondary" style="border-color:#ef4444; color:#ef4444;" onclick="resetAllAppData()">పూర్తిగా రీసెట్ చేయి</button>
        </div>
      </div>
    `;
  }
}

// Quick state mutator actions from Saved Hub
window.removeBookmarkByIndex = function(index) {
  State.bookmarks.splice(index, 1);
  saveData("bookmarks", State.bookmarks);
  renderSavedScreen();
  showToast("బుక్‌మార్క్ తొలగించబడింది!");
};

window.removeHighlightByKey = function(key) {
  delete State.highlights[key];
  saveData("highlights", State.highlights);
  renderSavedScreen();
  showToast("హైలైట్ తొలగించబడింది!");
};

window.removeNoteByKey = function(key) {
  delete State.notes[key];
  saveData("notes", State.notes);
  renderSavedScreen();
  showToast("నోట్ తొలగించబడింది!");
};

// --- DATA EXPORT & IMPORT ---
window.exportUserData = function() {
  const exportBundle = {
    settings: State.settings,
    history: State.history,
    bookmarks: State.bookmarks,
    highlights: State.highlights,
    notes: State.notes,
    readChapters: State.readChapters,
    exportDate: new Date().toISOString()
  };
  
  const blob = new Blob([JSON.stringify(exportBundle, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `telugu_bible_backup_${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showToast("బ్యాకప్ ఫైల్ డౌన్‌లోడ్ చేయబడింది!");
};

window.importUserData = function(input) {
  const file = input.files[0];
  if (!file) return;
  
  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const data = JSON.parse(e.target.result);
      if (!data.bookmarks || !data.highlights || !data.notes) {
        throw new Error("Invalid backup schema");
      }
      
      // Merge or overwrite state
      State.settings = data.settings || State.settings;
      State.history = data.history || State.history;
      State.bookmarks = data.bookmarks || State.bookmarks;
      State.highlights = data.highlights || State.highlights;
      State.notes = data.notes || State.notes;
      State.readChapters = data.readChapters || State.readChapters;
      
      // Save all
      saveData("settings", State.settings);
      saveData("history", State.history);
      saveData("bookmarks", State.bookmarks);
      saveData("highlights", State.highlights);
      saveData("notes", State.notes);
      saveData("read_chapters", State.readChapters);
      
      // Re-apply theme
      applyTheme(State.settings.theme);
      renderSavedScreen();
      showToast("డేటా విజయవంతంగా రీస్టోర్ చేయబడింది!");
    } catch (err) {
      console.error(err);
      showToast("రీస్టోర్ ఫెయిల్ అయింది. సరైన ఫైల్ ఎంచుకోండి.");
    }
  };
  reader.readAsText(file);
};

window.resetAllAppData = function() {
  if (confirm("యాప్ సమాచారాన్ని పూర్తిగా రీసెట్ చేయాలనుకుంటున్నారా? మీ నోట్స్ మరియు బుక్‌మార్క్‌లు శాశ్వతంగా తొలగిపోతాయి!")) {
    localStorage.clear();
    location.reload();
  }
};

// --- GLOBAL NAVIGATION AND TOAST NOTIFICATION UTILS ---
window.navigateToReader = function(book, chapter) {
  State.currentBook = book;
  State.currentChapter = chapter;
  window.location.hash = `#reader?book=${encodeURIComponent(book)}&chapter=${chapter}`;
};

function showToast(message) {
  // Create beautiful toast if not exists
  let container = document.getElementById("toast-notification-container");
  if (!container) {
    container = document.createElement("div");
    container.id = "toast-notification-container";
    container.style.cssText = `
      position: fixed;
      bottom: 80px;
      left: 50%;
      transform: translateX(-50%) translateY(20px);
      background-color: var(--text-primary);
      color: var(--bg-primary);
      padding: 12px 24px;
      border-radius: 12px;
      font-size: 0.9rem;
      font-weight: 600;
      z-index: 2000;
      opacity: 0;
      pointer-events: none;
      box-shadow: var(--shadow-lg);
      transition: opacity var(--transition-normal), transform var(--transition-normal);
      font-family: 'Noto Sans Telugu', 'Outfit', sans-serif;
    `;
    document.body.appendChild(container);
  }
  
  container.textContent = message;
  container.style.opacity = "1";
  container.style.transform = "translateX(-50%) translateY(0)";
  
  setTimeout(() => {
    container.style.opacity = "0";
    container.style.transform = "translateX(-50%) translateY(20px)";
  }, 2200);
}

// --- PWA INSTALLATION CONTROL PROMPT ---
let deferredInstallPrompt = null;

function setupPWAInstallPrompt() {
  const banner = document.getElementById("pwa-install-banner");
  const installBtn = document.getElementById("pwa-btn-install");
  const closeBtn = document.getElementById("pwa-btn-close");
  
  if (!banner || !installBtn || !closeBtn) return;
  
  window.addEventListener('beforeinstallprompt', (e) => {
    // Prevent default Chrome banner
    e.preventDefault();
    deferredInstallPrompt = e;
    
    // Show custom high fidelity bottom bar banner
    banner.classList.add("open");
  });
  
  installBtn.onclick = () => {
    if (!deferredInstallPrompt) return;
    
    // Trigger Chrome browser installation dialog
    deferredInstallPrompt.prompt();
    
    deferredInstallPrompt.userChoice.then((choiceResult) => {
      if (choiceResult.outcome === 'accepted') {
        console.log('[PWA] User accepted installation.');
        banner.classList.remove("open");
      }
      deferredInstallPrompt = null;
    });
  };
  
  closeBtn.onclick = () => {
    banner.classList.remove("open");
  };
}

// --- READER SWIPE GESTURE CONTROLS ---
function setupSwipeNavigation() {
  const container = document.getElementById("verses-scroll-container");
  if (!container) return;
  
  let touchStartX = 0;
  let touchEndX = 0;
  
  container.addEventListener('touchstart', e => {
    touchStartX = e.changedTouches[0].screenX;
  }, { passive: true });
  
  container.addEventListener('touchend', e => {
    touchEndX = e.changedTouches[0].screenX;
    handleSwipe();
  }, { passive: true });
  
  function handleSwipe() {
    const threshold = 80; // Min pixels traveled
    const diff = touchEndX - touchStartX;
    
    if (Math.abs(diff) < threshold) return;
    
    if (diff > 0) {
      // Swiped Right -> Go to Previous Chapter
      document.getElementById("reader-prev-btn")?.click();
    } else {
      // Swiped Left -> Go to Next Chapter
      document.getElementById("reader-next-btn")?.click();
    }
  }
}

// --- BROWSER TEXT-TO-SPEECH AUDIO CONTROLLER ---
const AudioPlayer = {
  isReading: false,
  isPaused: false,
  currentVerseIndex: 0,
  versesList: [], // Array of { verseNum, text }
  utterance: null,
  speed: 1.0,
  
  init() {
    this.speed = parseFloat(document.getElementById("audio-speed-select")?.value || "1.0");
  },
  
  async start() {
    this.init();
    
    if (this.isReading && this.isPaused) {
      this.resume();
      return;
    }
    
    this.stop(); // Clear running voice
    
    const bookData = BookCache[State.currentBook];
    if (!bookData) return;
    
    const chapterData = bookData.chapters.find(ch => ch.chapter === State.currentChapter);
    if (!chapterData || chapterData.verses.length === 0) return;
    
    this.versesList = chapterData.verses.map(vs => ({
      verseNum: vs.verse,
      text: vs.text
    }));
    
    this.currentVerseIndex = 0;
    this.isReading = true;
    this.isPaused = false;
    
    document.getElementById("audio-panel").style.display = "flex";
    this.updateUI();
    this.readNext();
  },
  
  readNext() {
    if (!this.isReading || this.isPaused) return;
    
    if (this.currentVerseIndex >= this.versesList.length) {
      this.stop();
      showToast("అధ్యాయము పఠనం పూర్తయింది!");
      return;
    }
    
    const verseObj = this.versesList[this.currentVerseIndex];
    this.highlightVerse(verseObj.verseNum);
    
    window.speechSynthesis.cancel(); // Safety override
    
    this.utterance = new SpeechSynthesisUtterance(verseObj.text);
    this.utterance.lang = 'te-IN'; // Pure Telugu offline voice
    this.utterance.rate = this.speed;
    
    this.utterance.onend = () => {
      if (this.isReading && !this.isPaused) {
        this.currentVerseIndex++;
        this.readNext();
      }
    };
    
    this.utterance.onerror = (e) => {
      console.error("[Audio Synthesis Error]", e);
      if (this.isReading && !this.isPaused) {
        this.currentVerseIndex++;
        setTimeout(() => this.readNext(), 200);
      }
    };
    
    window.speechSynthesis.speak(this.utterance);
    document.getElementById("audio-status-label").textContent = `${this.currentVerseIndex + 1}వ వాక్యం చదువుతోంది`;
  },
  
  pause() {
    if (!this.isReading) return;
    window.speechSynthesis.pause();
    this.isPaused = true;
    this.updateUI();
    document.getElementById("audio-status-label").textContent = "ఆపబడింది";
  },
  
  resume() {
    if (!this.isReading) return;
    window.speechSynthesis.resume();
    
    // Fallback if browser SpeechSynthesis resume is bugged
    if (!window.speechSynthesis.speaking) {
      this.readNext();
    } else {
      this.isPaused = false;
      this.updateUI();
    }
  },
  
  stop() {
    window.speechSynthesis.cancel();
    this.isReading = false;
    this.isPaused = false;
    this.currentVerseIndex = 0;
    this.clearAllVerseHighlights();
    this.updateUI();
    document.getElementById("audio-panel").style.display = "none";
  },
  
  next() {
    if (!this.isReading) return;
    this.currentVerseIndex = Math.min(this.versesList.length - 1, this.currentVerseIndex + 1);
    this.isPaused = false;
    this.readNext();
  },
  
  prev() {
    if (!this.isReading) return;
    this.currentVerseIndex = Math.max(0, this.currentVerseIndex - 1);
    this.isPaused = false;
    this.readNext();
  },
  
  setSpeed(val) {
    this.speed = parseFloat(val);
    if (this.isReading && !this.isPaused) {
      this.readNext();
    }
  },
  
  highlightVerse(verseNum) {
    this.clearAllVerseHighlights();
    const row = document.querySelector(`.verse-row[data-verse="${verseNum}"]`);
    if (row) {
      row.classList.add("audio-active-reading");
      row.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  },
  
  clearAllVerseHighlights() {
    document.querySelectorAll(".verse-row").forEach(row => {
      row.classList.remove("audio-active-reading");
    });
  },
  
  updateUI() {
    const playBtn = document.getElementById("audio-btn-play");
    const playIcon = document.getElementById("audio-play-icon");
    if (!playBtn || !playIcon) return;
    
    if (this.isReading && !this.isPaused) {
      // Show Pause SVG
      playBtn.innerHTML = `<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" stroke="none"><rect x="5" y="4" width="4" height="16" rx="1" /><rect x="15" y="4" width="4" height="16" rx="1" id="audio-play-icon"/></svg>`;
      playBtn.classList.add("active");
    } else {
      // Show Play SVG
      playBtn.innerHTML = `<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" stroke="none"><polygon points="5 3 19 12 5 21 5 3" id="audio-play-icon"/></svg>`;
      playBtn.classList.remove("active");
    }
  }
};

// --- CORE APP SETUP UPON LOAD ---
async function main() {
  initDataStore();
  
  // Register Service Worker
  registerServiceWorker();
  
  // Load Books metadata list
  await fetchBooksIndex();
  
  // Listen for navigation routing
  window.addEventListener("hashchange", handleRouting);
  
  // Trigger initial routing setup
  handleRouting();
  
  // Custom dialogs backdrop dismissal
  document.getElementById("modal-backdrop").onclick = () => {
    closeVerseActions();
    closeSelectorSheet();
    closeOptionsDialog();
  };
  
  // Selectors action triggers
  document.getElementById("btn-book-select").onclick = () => openSelectorSheet("book");
  document.getElementById("btn-chapter-select").onclick = () => openSelectorSheet("chapter");
  document.getElementById("btn-sheet-close").onclick = () => closeSelectorSheet();
  
  // Floating Actions trigger options modal
  document.getElementById("btn-header-options").onclick = () => openOptionsDialog();
  document.getElementById("btn-options-close").onclick = () => closeOptionsDialog();
  
  // Action events setup inside Verse panel
  setupActionListeners();
  
  // Live listener font slider changes
  const fontSlider = document.getElementById("font-slider");
  fontSlider.oninput = applySettings;
  
  // Themes are locked to Notebook style - click switch listeners removed
  
  // Search key listeners
  const searchInput = document.getElementById("bible-search-input");
  searchInput.oninput = (e) => handleSearchInput(e.target.value);
  
  // Saved Hub segment tabs setup
  document.querySelectorAll(".saved-tab-btn").forEach(btn => {
    btn.onclick = () => {
      document.querySelectorAll(".saved-tab-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      renderSavedScreen();
    };
  });
  
  // Setup other structural gesture events
  setupPWAInstallPrompt();
  setupSwipeNavigation();

  // Speaker toggle button click listener
  document.getElementById("btn-reader-audio").onclick = () => {
    const panel = document.getElementById("audio-panel");
    if (panel.style.display === "none") {
      AudioPlayer.start();
    } else {
      AudioPlayer.stop();
    }
  };

  // Audio Player controls listeners
  document.getElementById("audio-btn-play").onclick = () => {
    if (AudioPlayer.isReading && !AudioPlayer.isPaused) {
      AudioPlayer.pause();
    } else {
      AudioPlayer.start();
    }
  };
  document.getElementById("audio-btn-stop").onclick = () => AudioPlayer.stop();
  document.getElementById("audio-btn-next").onclick = () => AudioPlayer.next();
  document.getElementById("audio-btn-prev").onclick = () => AudioPlayer.prev();
  document.getElementById("audio-speed-select").onchange = (e) => AudioPlayer.setSpeed(e.target.value);
}

// Launch
document.addEventListener("DOMContentLoaded", main);
