/* ===== QR FIRELY - app.js ===== */

'use strict';

/* ===== STATE ===== */
const state = {
  type: 'url',
  data: '',
  fgColor: '#ff7a00',
  bgColor: '#0f172a',
  gradient: false,
  gradColor: '#ff3c00',
  gradType: 'linear',
  dotStyle: 'rounded',
  cornerSquareStyle: 'extra-rounded',
  cornerDotStyle: 'dot',
  logoData: null,
  logoFile: null,
  size: 300,
};

/* ===== DOM REFS ===== */
const dom = {
  typeTabs:          document.getElementById('typeTabs'),
  previewBadge:      document.getElementById('previewType'),
  previewHint:       document.getElementById('previewHint'),
  qrCanvas:          document.getElementById('qrCanvas'),

  fgColor:           document.getElementById('fgColor'),
  fgColorHex:        document.getElementById('fgColorHex'),
  bgColor:           document.getElementById('bgColor'),
  bgColorHex:        document.getElementById('bgColorHex'),

  gradientToggle:    document.getElementById('gradientToggle'),
  gradientOptions:   document.getElementById('gradientOptions'),
  gradColor:         document.getElementById('gradColor'),
  gradColorHex:      document.getElementById('gradColorHex'),
  gradType:          document.getElementById('gradType'),

  dotStyleGrid:      document.getElementById('dotStyleGrid'),
  cornerSquareGrid:  document.getElementById('cornerSquareGrid'),
  cornerDotGrid:     document.getElementById('cornerDotGrid'),

  logoInput:         document.getElementById('logoInput'),
  logoBtn:           document.getElementById('logoBtn'),
  logoRemoveBtn:     document.getElementById('logoRemoveBtn'),
  logoFilename:      document.getElementById('logoFilename'),

  qrSize:            document.getElementById('qrSize'),
  qrSizeLabel:       document.getElementById('qrSizeLabel'),

  downloadPng:       document.getElementById('downloadPng'),
  downloadSvg:       document.getElementById('downloadSvg'),
  shareBtn:          document.getElementById('shareBtn'),
  copyLinkBtn:       document.getElementById('copyLinkBtn'),

  toggleCustomize:   document.getElementById('toggleCustomize'),
  customizeBody:     document.getElementById('customizeBody'),
  customizeChevron:  document.getElementById('customizeChevron'),

  toggleHistory:     document.getElementById('toggleHistory'),
  historyBody:       document.getElementById('historyBody'),
  historyChevron:    document.getElementById('historyChevron'),
  historyList:       document.getElementById('historyList'),
  historyCount:      document.getElementById('historyCount'),
  historyEmpty:      document.getElementById('historyEmpty'),
  clearHistoryBtn:   document.getElementById('clearHistoryBtn'),

  toast:             document.getElementById('toast'),
  toastMsg:          document.getElementById('toastMsg'),

  historyTemplate:   document.getElementById('historyItemTemplate'),
};

/* ===== QR INSTANCE ===== */
let qrCode = null;
let generateTimer = null;

/* ===== INIT ===== */
function init() {
  setupTabs();
  setupColorPickers();
  setupGradientToggle();
  setupStyleButtons();
  setupLogoUpload();
  setupSizeSlider();
  setupDownloads();
  setupShare();
  setupCollapsibles();
  setupInputListeners();
  loadHistory();
  setupHistoryControls();
  buildQR();
}

/* ===== TABS ===== */
function setupTabs() {
  dom.typeTabs.addEventListener('click', (e) => {
    const btn = e.target.closest('.tab');
    if (!btn) return;
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    btn.classList.add('active');
    state.type = btn.dataset.type;
    document.querySelectorAll('.qr-form').forEach(f => f.classList.remove('active'));
    const form = document.getElementById(`form-${state.type}`);
    if (form) form.classList.add('active');
    dom.previewBadge.textContent = btn.textContent.trim().toUpperCase();
    scheduleGenerate();
  });
}

/* ===== INPUT LISTENERS ===== */
function setupInputListeners() {
  const inputIds = [
    'input-url', 'input-text',
    'input-wifi-ssid', 'input-wifi-pass', 'input-wifi-sec',
    'input-phone',
    'input-email-to', 'input-email-sub', 'input-email-body',
    'input-wa-num', 'input-wa-msg',
    'input-upi-id', 'input-upi-name', 'input-upi-amt', 'input-upi-note',
  ];
  inputIds.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('input', scheduleGenerate);
    el.addEventListener('change', scheduleGenerate);
  });
}

/* ===== DEBOUNCED GENERATE ===== */
function scheduleGenerate() {
  clearTimeout(generateTimer);
  generateTimer = setTimeout(buildQR, 280);
}

/* ===== BUILD QR DATA STRING ===== */
function getQRData() {
  switch (state.type) {
    case 'url': {
      const val = document.getElementById('input-url').value.trim();
      return val || '';
    }
    case 'text': {
      return document.getElementById('input-text').value.trim();
    }
    case 'wifi': {
      const ssid = document.getElementById('input-wifi-ssid').value.trim();
      const pass = document.getElementById('input-wifi-pass').value.trim();
      const sec  = document.getElementById('input-wifi-sec').value;
      if (!ssid) return '';
      return `WIFI:T:${sec};S:${ssid};P:${pass};;`;
    }
    case 'phone': {
      const phone = document.getElementById('input-phone').value.trim();
      if (!phone) return '';
      return `tel:${phone}`;
    }
    case 'email': {
      const to   = document.getElementById('input-email-to').value.trim();
      const sub  = document.getElementById('input-email-sub').value.trim();
      const body = document.getElementById('input-email-body').value.trim();
      if (!to) return '';
      const params = [];
      if (sub)  params.push(`subject=${encodeURIComponent(sub)}`);
      if (body) params.push(`body=${encodeURIComponent(body)}`);
      return `mailto:${to}${params.length ? '?' + params.join('&') : ''}`;
    }
    case 'whatsapp': {
      const num = document.getElementById('input-wa-num').value.trim().replace(/\D/g, '');
      const msg = document.getElementById('input-wa-msg').value.trim();
      if (!num) return '';
      return `https://wa.me/${num}${msg ? '?text=' + encodeURIComponent(msg) : ''}`;
    }
    case 'upi': {
      const id   = document.getElementById('input-upi-id').value.trim();
      const name = document.getElementById('input-upi-name').value.trim();
      const amt  = document.getElementById('input-upi-amt').value.trim();
      const note = document.getElementById('input-upi-note').value.trim();
      if (!id) return '';
      let upi = `upi://pay?pa=${encodeURIComponent(id)}`;
      if (name) upi += `&pn=${encodeURIComponent(name)}`;
      if (amt)  upi += `&am=${encodeURIComponent(amt)}`;
      if (note) upi += `&tn=${encodeURIComponent(note)}`;
      upi += '&cu=INR';
      return upi;
    }
    default:
      return '';
  }
}

/* ===== BUILD QR CODE ===== */
function buildQR() {
  const data = getQRData();
  state.data = data;

  if (!data) {
    dom.qrCanvas.innerHTML = '';
    dom.previewHint.style.display = 'block';
    qrCode = null;
    return;
  }

  dom.previewHint.style.display = 'none';

  const size = state.size;

  const options = {
    width: size,
    height: size,
    data: data,
    margin: 16,
    qrOptions: {
      errorCorrectionLevel: state.logoData ? 'H' : 'M',
    },
    dotsOptions: {
      type: state.dotStyle,
      color: state.fgColor,
    },
    backgroundOptions: {
      color: state.bgColor,
    },
    cornersSquareOptions: {
      type: state.cornerSquareStyle,
      color: state.fgColor,
    },
    cornersDotOptions: {
      type: state.cornerDotStyle,
      color: state.fgColor,
    },
    imageOptions: {
      crossOrigin: 'anonymous',
      margin: 6,
      imageSize: 0.3,
    },
  };

  if (state.gradient) {
    options.dotsOptions.gradient = {
      type: state.gradType,
      rotation: 45,
      colorStops: [
        { offset: 0, color: state.fgColor },
        { offset: 1, color: state.gradColor },
      ],
    };
    delete options.dotsOptions.color;
  }

  if (state.logoData) {
    options.image = state.logoData;
  }

  dom.qrCanvas.innerHTML = '';

  try {
    qrCode = new QRCodeStyling(options);
    qrCode.append(dom.qrCanvas);
    saveToHistory(data);
  } catch (err) {
    console.error('QR generation error:', err);
    dom.qrCanvas.innerHTML = '<p style="color:#ef4444;font-size:0.85rem;">Failed to generate QR</p>';
  }
    }
--- app.js PART 2/4 ---

```javascript
/* ===== COLOR PICKERS ===== */
function setupColorPickers() {
  function syncColor(picker, hexInput, stateKey) {
    picker.addEventListener('input', () => {
      const val = picker.value;
      hexInput.value = val;
      state[stateKey] = val;
      scheduleGenerate();
    });

    hexInput.addEventListener('input', () => {
      const val = hexInput.value.trim();
      if (/^#[0-9a-fA-F]{6}$/.test(val)) {
        picker.value = val;
        state[stateKey] = val;
        scheduleGenerate();
      }
    });

    hexInput.addEventListener('blur', () => {
      const val = hexInput.value.trim();
      if (!/^#[0-9a-fA-F]{6}$/.test(val)) {
        hexInput.value = state[stateKey];
      }
    });
  }

  syncColor(dom.fgColor,    dom.fgColorHex,   'fgColor');
  syncColor(dom.bgColor,    dom.bgColorHex,   'bgColor');
  syncColor(dom.gradColor,  dom.gradColorHex, 'gradColor');
}

/* ===== GRADIENT TOGGLE ===== */
function setupGradientToggle() {
  dom.gradientToggle.addEventListener('change', () => {
    state.gradient = dom.gradientToggle.checked;
    dom.gradientOptions.classList.toggle('hidden', !state.gradient);
    scheduleGenerate();
  });

  dom.gradType.addEventListener('change', () => {
    state.gradType = dom.gradType.value;
    scheduleGenerate();
  });
}

/* ===== STYLE BUTTONS ===== */
function setupStyleButtons() {
  dom.dotStyleGrid.addEventListener('click', (e) => {
    const btn = e.target.closest('.style-btn');
    if (!btn) return;
    dom.dotStyleGrid.querySelectorAll('.style-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    state.dotStyle = btn.dataset.dot;
    scheduleGenerate();
  });

  dom.cornerSquareGrid.addEventListener('click', (e) => {
    const btn = e.target.closest('.style-btn');
    if (!btn) return;
    dom.cornerSquareGrid.querySelectorAll('.style-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    state.cornerSquareStyle = btn.dataset.cornerSq;
    scheduleGenerate();
  });

  dom.cornerDotGrid.addEventListener('click', (e) => {
    const btn = e.target.closest('.style-btn');
    if (!btn) return;
    dom.cornerDotGrid.querySelectorAll('.style-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    state.cornerDotStyle = btn.dataset.cornerDot;
    scheduleGenerate();
  });
}

/* ===== LOGO UPLOAD ===== */
function setupLogoUpload() {
  dom.logoBtn.addEventListener('click', () => {
    dom.logoInput.click();
  });

  dom.logoInput.addEventListener('change', () => {
    const file = dom.logoInput.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Please select a valid image file.');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      showToast('Logo image must be under 2MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      state.logoData = e.target.result;
      state.logoFile = file.name;
      dom.logoFilename.textContent = file.name;
      dom.logoRemoveBtn.style.display = 'inline-flex';
      scheduleGenerate();
    };
    reader.readAsDataURL(file);
  });

  dom.logoRemoveBtn.addEventListener('click', () => {
    state.logoData = null;
    state.logoFile = null;
    dom.logoInput.value = '';
    dom.logoFilename.textContent = '';
    dom.logoRemoveBtn.style.display = 'none';
    scheduleGenerate();
  });
}

/* ===== SIZE SLIDER ===== */
function setupSizeSlider() {
  dom.qrSize.addEventListener('input', () => {
    state.size = parseInt(dom.qrSize.value, 10);
    dom.qrSizeLabel.textContent = `${state.size}px`;
    scheduleGenerate();
  });
}

/* ===== DOWNLOADS ===== */
function setupDownloads() {
  dom.downloadPng.addEventListener('click', () => {
    if (!qrCode) {
      showToast('Generate a QR code first.');
      return;
    }
    qrCode.download({
      name: `qr-firely-${state.type}-${Date.now()}`,
      extension: 'png',
    });
    showToast('PNG downloaded successfully.');
  });

  dom.downloadSvg.addEventListener('click', () => {
    if (!qrCode) {
      showToast('Generate a QR code first.');
      return;
    }
    qrCode.download({
      name: `qr-firely-${state.type}-${Date.now()}`,
      extension: 'svg',
    });
    showToast('SVG downloaded successfully.');
  });
}

/* ===== SHARE ===== */
function setupShare() {
  dom.shareBtn.addEventListener('click', async () => {
    if (!qrCode) {
      showToast('Generate a QR code first.');
      return;
    }

    if (!navigator.share) {
      showToast('Web Share not supported on this device.');
      return;
    }

    try {
      const blob = await getQRBlob();
      if (!blob) return;

      const file = new File([blob], `qr-firely-${state.type}.png`, { type: 'image/png' });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: 'QR Firely',
          text: `QR Code: ${state.data}`,
          files: [file],
        });
      } else {
        await navigator.share({
          title: 'QR Firely',
          text: `QR Code: ${state.data}`,
        });
      }
      showToast('Shared successfully.');
    } catch (err) {
      if (err.name !== 'AbortError') {
        showToast('Share failed. Try copying the link.');
      }
    }
  });

  dom.copyLinkBtn.addEventListener('click', () => {
    if (!state.data) {
      showToast('Generate a QR code first.');
      return;
    }
    copyToClipboard(state.data);
  });
}

/* ===== GET QR BLOB ===== */
function getQRBlob() {
  return new Promise((resolve) => {
    if (!qrCode) { resolve(null); return; }
    qrCode.getRawData('png').then(resolve).catch(() => resolve(null));
  });
}

/* ===== COPY TO CLIPBOARD ===== */
async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    showToast('Copied to clipboard.');
  } catch {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    showToast('Copied to clipboard.');
  }
}

/* ===== COLLAPSIBLES ===== */
function setupCollapsibles() {
  dom.toggleCustomize.addEventListener('click', () => {
    const isOpen = dom.customizeBody.classList.contains('open');
    dom.customizeBody.classList.toggle('open', !isOpen);
    dom.customizeBody.classList.toggle('collapsed', isOpen);
    dom.customizeChevron.classList.toggle('rotated', !isOpen);
  });

  dom.toggleHistory.addEventListener('click', () => {
    const isOpen = dom.historyBody.classList.contains('open');
    dom.historyBody.classList.toggle('open', !isOpen);
    dom.historyBody.classList.toggle('collapsed', isOpen);
    dom.historyChevron.classList.toggle('rotated', !isOpen);
  });
}

/* ===== TOAST ===== */
let toastTimer = null;

function showToast(msg, duration = 2800) {
  dom.toastMsg.textContent = msg;
  dom.toast.classList.remove('hidden');
  void dom.toast.offsetWidth;
  dom.toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    dom.toast.classList.remove('show');
    setTimeout(() => dom.toast.classList.add('hidden'), 350);
  }, duration);
}
```
--- app.js PART 3/4 ---

```javascript
/* ===== HISTORY ===== */
const HISTORY_KEY = 'qrfirely_history';
const HISTORY_MAX = 10;

function loadHistory() {
  const history = getHistory();
  renderHistory(history);
}

function getHistory() {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveHistory(history) {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  } catch {
    console.warn('Could not save history to localStorage.');
  }
}

function saveToHistory(data) {
  if (!data) return;

  const history = getHistory();

  const existing = history.findIndex(
    item => item.data === data && item.type === state.type
  );
  if (existing !== -1) {
    history.splice(existing, 1);
  }

  const entry = {
    id:        Date.now(),
    type:      state.type,
    data:      data,
    fgColor:   state.fgColor,
    bgColor:   state.bgColor,
    gradient:  state.gradient,
    gradColor: state.gradColor,
    gradType:  state.gradType,
    dotStyle:  state.dotStyle,
    cornerSquareStyle: state.cornerSquareStyle,
    cornerDotStyle:    state.cornerDotStyle,
    size:      state.size,
    date:      new Date().toISOString(),
  };

  history.unshift(entry);

  if (history.length > HISTORY_MAX) {
    history.splice(HISTORY_MAX);
  }

  saveHistory(history);
  renderHistory(history);
}

function renderHistory(history) {
  dom.historyCount.textContent = history.length;

  if (history.length === 0) {
    dom.historyEmpty.classList.remove('hidden');
    dom.historyList.innerHTML = '';
    return;
  }

  dom.historyEmpty.classList.add('hidden');
  dom.historyList.innerHTML = '';

  history.forEach(entry => {
    const node = createHistoryItem(entry);
    dom.historyList.appendChild(node);
  });
}

function createHistoryItem(entry) {
  const template = dom.historyTemplate.content.cloneNode(true);
  const item      = template.querySelector('.history-item');
  const canvas    = template.querySelector('[data-canvas]');
  const typeLabel = template.querySelector('[data-type-label]');
  const value     = template.querySelector('[data-value]');
  const date      = template.querySelector('[data-date]');
  const loadBtn   = template.querySelector('[data-action="load"]');
  const deleteBtn = template.querySelector('[data-action="delete"]');

  typeLabel.textContent = entry.type.toUpperCase();
  value.textContent     = formatHistoryValue(entry.data, entry.type);
  date.textContent      = formatDate(entry.date);

  renderMiniQR(canvas, entry);

  loadBtn.addEventListener('click', () => loadHistoryEntry(entry));
  deleteBtn.addEventListener('click', () => deleteHistoryEntry(entry.id));

  return template;
}

function renderMiniQR(container, entry) {
  try {
    const miniQR = new QRCodeStyling({
      width:  52,
      height: 52,
      data:   entry.data,
      margin: 4,
      qrOptions: {
        errorCorrectionLevel: 'M',
      },
      dotsOptions: {
        type:  entry.dotStyle  || 'rounded',
        color: entry.fgColor   || '#ff7a00',
      },
      backgroundOptions: {
        color: entry.bgColor || '#0f172a',
      },
      cornersSquareOptions: {
        type:  entry.cornerSquareStyle || 'extra-rounded',
        color: entry.fgColor || '#ff7a00',
      },
      cornersDotOptions: {
        type:  entry.cornerDotStyle || 'dot',
        color: entry.fgColor || '#ff7a00',
      },
    });
    miniQR.append(container);
  } catch (err) {
    console.warn('Mini QR render failed:', err);
  }
}

function formatHistoryValue(data, type) {
  switch (type) {
    case 'url':       return data;
    case 'text':      return data.length > 40 ? data.slice(0, 40) + '...' : data;
    case 'wifi':      {
      const match = data.match(/S:([^;]+)/);
      return match ? `Network: ${match[1]}` : data;
    }
    case 'phone':     return data.replace('tel:', '');
    case 'email':     return data.replace('mailto:', '').split('?')[0];
    case 'whatsapp':  return data.replace('https://wa.me/', '').split('?')[0];
    case 'upi':       {
      const match = data.match(/pa=([^&]+)/);
      return match ? decodeURIComponent(match[1]) : data;
    }
    default:          return data;
  }
}

function formatDate(iso) {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, {
      month: 'short',
      day:   'numeric',
      year:  'numeric',
    }) + ' ' + d.toLocaleTimeString(undefined, {
      hour:   '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '';
  }
}

function loadHistoryEntry(entry) {
  state.type             = entry.type;
  state.fgColor          = entry.fgColor;
  state.bgColor          = entry.bgColor;
  state.gradient         = entry.gradient;
  state.gradColor        = entry.gradColor;
  state.gradType         = entry.gradType;
  state.dotStyle         = entry.dotStyle;
  state.cornerSquareStyle = entry.cornerSquareStyle;
  state.cornerDotStyle   = entry.cornerDotStyle;
  state.size             = entry.size || 300;

  document.querySelectorAll('.tab').forEach(t => {
    t.classList.toggle('active', t.dataset.type === entry.type);
  });

  document.querySelectorAll('.qr-form').forEach(f => f.classList.remove('active'));
  const form = document.getElementById(`form-${entry.type}`);
  if (form) form.classList.add('active');

  dom.previewBadge.textContent = entry.type.toUpperCase();

  dom.fgColor.value    = entry.fgColor;
  dom.fgColorHex.value = entry.fgColor;
  dom.bgColor.value    = entry.bgColor;
  dom.bgColorHex.value = entry.bgColor;

  dom.gradientToggle.checked = entry.gradient;
  dom.gradientOptions.classList.toggle('hidden', !entry.gradient);
  dom.gradColor.value    = entry.gradColor;
  dom.gradColorHex.value = entry.gradColor;
  dom.gradType.value     = entry.gradType;

  dom.qrSize.value         = state.size;
  dom.qrSizeLabel.textContent = `${state.size}px`;

  document.querySelectorAll('#dotStyleGrid .style-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.dot === entry.dotStyle);
  });
  document.querySelectorAll('#cornerSquareGrid .style-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.cornerSq === entry.cornerSquareStyle);
  });
  document.querySelectorAll('#cornerDotGrid .style-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.cornerDot === entry.cornerDotStyle);
  });

  populateFormFromData(entry.type, entry.data);

  window.scrollTo({ top: 0, behavior: 'smooth' });
  showToast('QR code loaded.');
  scheduleGenerate();
}

function populateFormFromData(type, data) {
  switch (type) {
    case 'url':
      document.getElementById('input-url').value = data;
      break;
    case 'text':
      document.getElementById('input-text').value = data;
      break;
    case 'phone':
      document.getElementById('input-phone').value = data.replace('tel:', '');
      break;
    case 'email': {
      const parts = data.replace('mailto:', '').split('?');
      document.getElementById('input-email-to').value = parts[0] || '';
      if (parts[1]) {
        const params = new URLSearchParams(parts[1]);
        document.getElementById('input-email-sub').value  = params.get('subject') || '';
        document.getElementById('input-email-body').value = params.get('body')    || '';
      }
      break;
    }
    case 'whatsapp': {
      const waUrl    = new URL(data);
      const waNum    = waUrl.pathname.replace('/', '');
      const waMsg    = waUrl.searchParams.get('text') || '';
      document.getElementById('input-wa-num').value = waNum;
      document.getElementById('input-wa-msg').value = waMsg;
      break;
    }
    case 'wifi': {
      const ssid = (data.match(/S:([^;]+)/)  || [])[1] || '';
      const pass = (data.match(/P:([^;]+)/)  || [])[1] || '';
      const sec  = (data.match(/T:([^;]+)/)  || [])[1] || 'WPA';
      document.getElementById('input-wifi-ssid').value = ssid;
      document.getElementById('input-wifi-pass').value = pass;
      document.getElementById('input-wifi-sec').value  = sec;
      break;
    }
    case 'upi': {
      try {
        const upiUrl = new URL(data);
        document.getElementById('input-upi-id').value   = upiUrl.searchParams.get('pa')  || '';
        document.getElementById('input-upi-name').value = upiUrl.searchParams.get('pn')  || '';
        document.getElementById('input-upi-amt').value  = upiUrl.searchParams.get('am')  || '';
        document.getElementById('input-upi-note').value = upiUrl.searchParams.get('tn')  || '';
      } catch {
        document.getElementById('input-upi-id').value = data;
      }
      break;
    }
  }
}
```
--- app.js PART 4/4 ---

```javascript
/* ===== HISTORY CONTROLS ===== */
function setupHistoryControls() {
  dom.clearHistoryBtn.addEventListener('click', () => {
    const history = getHistory();
    if (history.length === 0) {
      showToast('History is already empty.');
      return;
    }
    if (!confirm('Clear all saved QR codes?')) return;
    saveHistory([]);
    renderHistory([]);
    showToast('History cleared.');
  });
}

function deleteHistoryEntry(id) {
  const history = getHistory().filter(item => item.id !== id);
  saveHistory(history);
  renderHistory(history);
  showToast('QR code removed.');
}

/* ===== KEYBOARD SHORTCUTS ===== */
document.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === 's') {
    e.preventDefault();
    if (qrCode) {
      qrCode.download({
        name: `qr-firely-${state.type}-${Date.now()}`,
        extension: 'png',
      });
      showToast('PNG downloaded.');
    }
  }

  if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
    e.preventDefault();
    const activeForm = document.querySelector('.qr-form.active');
    if (activeForm) {
      const firstInput = activeForm.querySelector('input, textarea');
      if (firstInput) firstInput.focus();
    }
  }
});

/* ===== VISIBILITY CHANGE - RE-RENDER ===== */
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && state.data) {
    buildQR();
  }
});

/* ===== ONLINE / OFFLINE BANNER ===== */
function handleNetworkStatus() {
  if (!navigator.onLine) {
    showToast('You are offline. App works without internet.', 4000);
  }
}

window.addEventListener('online',  () => showToast('Back online.'));
window.addEventListener('offline', () => showToast('You are offline. App works without internet.', 4000));

/* ===== RESIZE OBSERVER - RESPONSIVE QR ===== */
(function setupResizeObserver() {
  if (!window.ResizeObserver) return;

  const observer = new ResizeObserver(() => {
    const wrap    = dom.qrCanvas;
    const maxSize = Math.min(wrap.clientWidth || 300, 500);
    const clamped = Math.max(200, Math.min(state.size, maxSize));
    if (clamped !== state.size && wrap.clientWidth > 0) {
      dom.qrSize.max   = String(maxSize);
    }
  });

  observer.observe(dom.qrCanvas);
})();

/* ===== FIRST VISIT HINT ===== */
(function firstVisitHint() {
  const seen = localStorage.getItem('qrfirely_seen');
  if (!seen) {
    setTimeout(() => {
      showToast('Welcome to QR Firely! Enter a URL to get started.', 4000);
    }, 800);
    localStorage.setItem('qrfirely_seen', '1');
  }
})();

/* ===== EXPORT STATE FOR DEBUGGING ===== */
window.__qrFirelyState = () => ({ ...state });

/* ===== HANDLE PASTE INTO PAGE ===== */
document.addEventListener('paste', (e) => {
  const active = document.activeElement;
  const isInput = active && (
    active.tagName === 'INPUT' ||
    active.tagName === 'TEXTAREA'
  );
  if (isInput) return;

  const text = e.clipboardData.getData('text');
  if (!text) return;

  const urlInput = document.getElementById('input-url');
  if (!urlInput) return;

  document.querySelectorAll('.tab').forEach(t => {
    t.classList.toggle('active', t.dataset.type === 'url');
  });

  document.querySelectorAll('.qr-form').forEach(f => f.classList.remove('active'));
  document.getElementById('form-url').classList.add('active');

  state.type = 'url';
  dom.previewBadge.textContent = 'URL';
  urlInput.value = text;
  scheduleGenerate();
  showToast('Pasted and generating QR code.');
});

/* ===== SMOOTH SCROLL TO PREVIEW ON GENERATE ===== */
(function setupScrollToPreview() {
  const previewSection = document.querySelector('.preview-section');
  if (!previewSection) return;

  document.querySelectorAll('.qr-form input, .qr-form textarea, .qr-form select')
    .forEach(el => {
      el.addEventListener('focus', () => {
        setTimeout(() => {
          previewSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }, 300);
      });
    });
})();

/* ===== THEME COLOR META UPDATE ===== */
function updateThemeColor(color) {
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', color);
}

/* ===== STARTUP NETWORK CHECK ===== */
handleNetworkStatus();

/* ===== BOOT ===== */
document.addEventListener('DOMContentLoaded', init);
```
