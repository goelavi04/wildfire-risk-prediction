// ── Navigation ─────────────────────────────────
function showPage(name) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
  document.getElementById('page-' + name).classList.add('active');
  document.querySelectorAll('.nav-link').forEach(l => {
    if (l.textContent.toLowerCase().includes(name.toLowerCase()) ||
       (name === 'home'      && l.textContent === 'Home')      ||
       (name === 'predictor' && l.textContent === 'Predictor') ||
       (name === 'map'       && l.textContent === 'Risk Map')  ||
       (name === 'models'    && l.textContent === 'Models')    ||
       (name === 'about'     && l.textContent === 'About')) {
      l.classList.add('active');
    }
  });
  // Init map when map page opens
  if (name === 'map') setTimeout(initMap, 100);
  // Init charts when models page opens
  if (name === 'models') setTimeout(initCharts, 100);
}

// ── Slider Update ───────────────────────────────
function updateSlider(id, valId, suffix) {
  const val = document.getElementById(id).value;
  const el  = document.getElementById(valId);
  if (id === 'max_temp' || id === 'min_temp') el.textContent = val + '°F';
  else if (id === 'wind_speed')               el.textContent = val + ' mph';
  else if (id === 'precipitation')            el.textContent = parseFloat(val).toFixed(1) + ' in';
}

// ── Prediction ──────────────────────────────────
async function runPrediction() {
  const btn = document.querySelector('.predict-btn');
  btn.textContent = '⏳ Predicting...';
  btn.disabled    = true;

  const payload = {
    max_temp:      parseFloat(document.getElementById('max_temp').value),
    min_temp:      parseFloat(document.getElementById('min_temp').value),
    wind_speed:    parseFloat(document.getElementById('wind_speed').value),
    precipitation: parseFloat(document.getElementById('precipitation').value),
    month:         parseInt(document.getElementById('month').value),
    season:        parseInt(document.getElementById('season').value),
    year:          parseInt(document.getElementById('year').value),
  };

  try {
    const res  = await fetch('http://127.0.0.1:8000/predict', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload),
    });
    const data = await res.json();
    showResult(data);
  } catch (err) {
    document.getElementById('result-box').innerHTML = `
      <div style="text-align:center;color:#E63B2E">
        <div style="font-size:40px">⚠️</div>
        <div style="margin-top:12px">Could not connect to server.<br>
        Make sure backend is running.</div>
      </div>`;
  }

  btn.textContent = '🔥 Predict Fire Risk';
  btn.disabled    = false;
}

function showResult(data) {
  const emojis = { EXTREME:'🔴', HIGH:'🟠', MODERATE:'🟡', LOW:'🟢' };
  const advice = {
    EXTREME:  '⚠️ EXTREME FIRE DANGER — Avoid all outdoor burning. Alert local fire authorities immediately.',
    HIGH:     '⚠️ HIGH FIRE DANGER — Exercise extreme caution. Avoid any fire sources outdoors.',
    MODERATE: '🟡 MODERATE FIRE DANGER — Stay alert and follow local fire guidelines.',
    LOW:      '✅ LOW FIRE DANGER — Conditions are relatively safe today.',
  };
  const adviceColors = {
    EXTREME:  'rgba(230,59,46,0.15)',
    HIGH:     'rgba(244,116,33,0.15)',
    MODERATE: 'rgba(249,194,26,0.1)',
    LOW:      'rgba(76,175,80,0.1)',
  };

  document.getElementById('result-box').innerHTML = `
    <div class="result-content">
      <div class="result-emoji">${emojis[data.risk_level]}</div>
      <div class="result-level" style="color:${data.color}">${data.risk_level} RISK</div>
      <div class="result-prob"  style="color:${data.color}">${data.ensemble_probability}%</div>
      <div class="result-label">Fire Probability (Ensemble)</div>
      <div class="result-progress">
        <div class="result-bar"
             style="width:${data.ensemble_probability}%;
                    background:linear-gradient(90deg,${data.color}99,${data.color})">
        </div>
      </div>
      <div class="result-advice" style="background:${adviceColors[data.risk_level]};
           border:1px solid ${data.color}44;color:${data.color}">
        ${advice[data.risk_level]}
      </div>
    </div>`;

  // Model scores
  const ms = document.getElementById('model-scores');
  ms.style.display = 'block';
  setBar('xgb-bar', 'xgb-pct', data.xgb_probability, data.color);
  setBar('rf-bar',  'rf-pct',  data.rf_probability,   data.color);
  setBar('ens-bar', 'ens-pct', data.ensemble_probability, data.color);
}

function setBar(barId, pctId, value, color) {
  document.getElementById(barId).style.width      = value + '%';
  document.getElementById(barId).style.background = `linear-gradient(90deg,${color}88,${color})`;
  document.getElementById(pctId).textContent      = value + '%';
}

// ── Map ─────────────────────────────────────────
let mapInitialized = false;
let leafletMap     = null;

async function initMap() {
  if (mapInitialized) return;
  mapInitialized = true;

  leafletMap = L.map('map').setView([37.5, -119.5], 6);

  // Dark tile layer
  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '© OpenStreetMap © CARTO',
    maxZoom: 18,
  }).addTo(leafletMap);

  try {
    const res      = await fetch('http://127.0.0.1:8000/county_risks');
    const counties = await res.json();
    renderCounties(counties);
    buildCountyTable(counties);
  } catch (err) {
    document.getElementById('map').innerHTML =
      '<div style="color:#E63B2E;padding:40px;text-align:center">⚠️ Could not load map data.<br>Make sure backend is running.</div>';
  }
}

function renderCounties(counties) {
  counties.forEach(c => {
    const radius = 8 + (c.probability / 100) * 18;

    // Glow circle
    L.circleMarker([c.lat, c.lng], {
      radius:      radius + 8,
      color:       'transparent',
      fillColor:   c.color,
      fillOpacity: 0.15,
    }).addTo(leafletMap);

    // Main circle
    L.circleMarker([c.lat, c.lng], {
      radius:      radius,
      color:       c.color,
      weight:      2,
      fillColor:   c.color,
      fillOpacity: 0.75,
    })
    .bindPopup(`
      <div style="font-family:'Space Grotesk',sans-serif;min-width:160px">
        <div style="font-size:15px;font-weight:700;margin-bottom:8px">${c.county} County</div>
        <div style="margin-bottom:4px">
          Risk: <b style="color:${c.color}">${c.level}</b>
        </div>
        <div style="margin-bottom:4px">Probability: <b>${c.probability}%</b></div>
        <div style="margin-bottom:4px">Max Temp: ${c.max_temp}°F</div>
        <div style="margin-bottom:4px">Min Temp: ${c.min_temp}°F</div>
        <div>Wind: ${c.wind} mph</div>
      </div>
    `)
    .addTo(leafletMap);
  });
}

function buildCountyTable(counties) {
  const sorted = [...counties].sort((a, b) => b.probability - a.probability);
  const wrap   = document.getElementById('county-table');
  wrap.innerHTML = sorted.map(c => `
    <div class="county-row">
      <span class="county-name">${c.county}</span>
      <span class="risk-pill"
            style="background:${c.color}22;color:${c.color};border:1px solid ${c.color}44">
        ${c.level}
      </span>
      <span style="font-family:'DM Mono',monospace;font-size:11px">${c.probability}%</span>
    </div>
  `).join('');
}

// ── Charts ──────────────────────────────────────
let chartsInitialized = false;

function initCharts() {
  if (chartsInitialized) return;
  chartsInitialized = true;

  // Comparison chart
  new Chart(document.getElementById('compChart'), {
    type: 'bar',
    data: {
      labels:   ['Accuracy', 'Precision', 'Recall', 'F1 Score', 'ROC-AUC'],
      datasets: [
        {
          label:           'XGBoost',
          data:            [80.0, 72.0, 65.5, 68.6, 86.3],
          backgroundColor: 'rgba(244,116,33,0.8)',
          borderRadius:    6,
        },
        {
          label:           'Random Forest',
          data:            [79.3, 70.3, 65.1, 67.6, 85.7],
          backgroundColor: 'rgba(249,194,26,0.7)',
          borderRadius:    6,
        },
      ],
    },
    options: {
      responsive:          true,
      maintainAspectRatio: false,
      plugins: { legend: { labels: { color: '#8A8A9A', font: { size: 11 } } } },
      scales: {
        x: { ticks: { color: '#8A8A9A' }, grid: { color: 'rgba(255,255,255,0.04)' } },
        y: { min: 60, max: 95, ticks: { color: '#8A8A9A' }, grid: { color: 'rgba(255,255,255,0.04)' } },
      },
    },
  });

  // ROC curve
  const rocPts = (a) =>
    Array.from({ length: 20 }, (_, i) => {
      const fpr = i / 19;
      return { x: fpr, y: Math.min(1, Math.pow(fpr, 1 / (a + 0.001))) };
    });

  new Chart(document.getElementById('rocChart'), {
    type: 'line',
    data: {
      datasets: [
        { label: 'XGBoost (AUC=0.863)',       data: rocPts(3.1), borderColor: '#F47421', backgroundColor: 'rgba(244,116,33,0.08)', fill: true, tension: 0.3, pointRadius: 0, borderWidth: 2.5 },
        { label: 'Random Forest (AUC=0.857)',  data: rocPts(2.8), borderColor: '#F9C21A', backgroundColor: 'rgba(249,194,26,0.06)', fill: true, tension: 0.3, pointRadius: 0, borderWidth: 2 },
        { label: 'Baseline',                   data: [{ x: 0, y: 0 }, { x: 1, y: 1 }], borderColor: 'rgba(255,255,255,0.2)', borderDash: [4, 4], pointRadius: 0, borderWidth: 1 },
      ],
    },
    options: {
      responsive:          true,
      maintainAspectRatio: false,
      plugins: { legend: { labels: { color: '#8A8A9A', font: { size: 11 } } } },
      scales: {
        x: { type: 'linear', min: 0, max: 1, title: { display: true, text: 'FPR', color: '#8A8A9A' }, ticks: { color: '#8A8A9A' }, grid: { color: 'rgba(255,255,255,0.04)' } },
        y: { min: 0, max: 1, title: { display: true, text: 'TPR', color: '#8A8A9A' }, ticks: { color: '#8A8A9A' }, grid: { color: 'rgba(255,255,255,0.04)' } },
      },
    },
  });

  // Confusion matrix as grouped bar
  new Chart(document.getElementById('cmChart'), {
    type: 'bar',
    data: {
      labels:   ['True Negative', 'False Positive', 'False Negative', 'True Positive'],
      datasets: [{
        label:           'Count',
        data:            [1731, 273, 347, 647],
        backgroundColor: ['rgba(76,175,80,0.7)', 'rgba(230,59,46,0.7)', 'rgba(230,59,46,0.7)', 'rgba(76,175,80,0.7)'],
        borderRadius:    6,
      }],
    },
    options: {
      responsive:          true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { ticks: { color: '#8A8A9A', font: { size: 10 } }, grid: { color: 'rgba(255,255,255,0.04)' } },
        y: { ticks: { color: '#8A8A9A' }, grid: { color: 'rgba(255,255,255,0.04)' } },
      },
    },
  });
}

// ── Init ─────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  showPage('home');
});
