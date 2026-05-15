/**
 * Configurazione centralizzata del generatore PDF.
 * Per aggiungere una lingua o uno stile, basta aggiungere una entry qui.
 */
const CONFIG = {
  defaultStyle: 'europass-no-logo',
  defaultLanguage: 'it',
  languages: {
    it: {
      label: 'Italiano',
      flag: '🇮🇹',
      locale: 'it-IT',
      dataUrl: '/data/pdf-content.json',
      signaturePrefix: 'Documento generato il',
    },
    en: {
      label: 'English',
      flag: '🇬🇧',
      locale: 'en-US',
      dataUrl: '/data/pdf-content-en.json',
      signaturePrefix: 'Document generated on',
    },
  },
  styles: {
    'europass': {
      label: 'Europass',
      templateUrl: '/templates/cv-europass.html',
    },
    'europass-no-logo': {
      label: 'Europass senza loghi',
      templateUrl: '/templates/cv-europass-no-logo.html',
    },
    'custom': {
      label: 'Personalizzato',
      templateUrl: '/templates/cv-custom.html',
    },
  },
};

const STATE = {
  selectedStyle: CONFIG.defaultStyle,
  selectedLanguage: CONFIG.defaultLanguage,
  isGenerating: false,
  labels: {},
};

function decodeBase64(str) {
  try {
    const binaryString = window.atob(str);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return new TextDecoder().decode(bytes);
  } catch (e) {
    console.warn('Base64 decode (modern) failed, falling back', e);
    try {
      return decodeURIComponent(escape(window.atob(str)));
    } catch (e2) {
      console.error('Base64 decode failed:', e2);
      return str;
    }
  }
}

async function fetchData(url, type = 'json') {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`HTTP ${response.status} on ${url}`);
  return type === 'json' ? await response.json() : await response.text();
}

function processDataFields(sections, shouldDecode) {
  sections.forEach(section => {
    if (section.fields && shouldDecode) {
      section.fields.forEach(field => {
        if (field.base64) field.value = decodeBase64(field.value);
      });
    }
    if (section.items) {
      let prevCompany = null;
      section.items.forEach(item => {
        item.displayCompany = !!item.company && item.company !== prevCompany;
        prevCompany = item.company;
        // Long entries (with bullet lists) may span pages; short ones stay together
        item.allowBreak = /<ul[\s>]/i.test(item.description || '');
      });
    }
  });
}

function buildHeaderData(sections) {
  const first = sections[0];
  if (!first || !first.fields) return { headerName: null, headerContacts: [] };
  const nameField = first.fields.find(f => /^(nome|name)$/i.test(f.label || ''));
  const headerName = nameField ? nameField.value : null;
  const headerContacts = first.fields
    .filter(f => f !== nameField)
    .map(f => f.value)
    .filter(Boolean);
  return { headerName, headerContacts };
}

async function renderCVPreview(templatePath, data, decode = false, signature = null) {
  const container = document.getElementById('cv-preview');
  if (!container) return;

  try {
    const templateHtml = await fetchData(templatePath, 'text');
    processDataFields(data.sections, decode);
    const compiled = Handlebars.compile(templateHtml);
    const { labels, sections, presentation } = data;
    const { headerName, headerContacts } = buildHeaderData(sections);
    container.innerHTML = compiled({ labels, sections, presentation, signature, headerName, headerContacts });
  } catch (error) {
    container.innerHTML = `<div class="alert alert-danger">Errore nel rendering della preview: ${error.message}</div>`;
  }
}

function updateUrlParams() {
  const url = new URL(window.location.href);
  if (url.searchParams.get('lang') === STATE.selectedLanguage &&
      url.searchParams.get('style') === STATE.selectedStyle) return;
  url.searchParams.set('lang', STATE.selectedLanguage);
  url.searchParams.set('style', STATE.selectedStyle);
  window.history.replaceState({}, '', url.toString());
}

function applyLabelsToUi(labels) {
  STATE.labels = labels || {};

  const title = document.getElementById('downloadResume-title');
  if (title && labels.sectionTitle) title.textContent = labels.sectionTitle;

  const generateBtn = document.getElementById('generate-pdf');
  if (generateBtn && labels.generateBtn) generateBtn.textContent = labels.generateBtn;

  const langBtn = document.getElementById('languageDropdown');
  if (langBtn) {
    const lang = CONFIG.languages[STATE.selectedLanguage];
    const dropdownLabel = labels.languageDropdown || 'Lingua';
    langBtn.textContent = `${lang.flag} ${dropdownLabel}: ${lang.label}`;
  }

  const styleBtn = document.getElementById('previewDropdown');
  if (styleBtn) {
    const styleLabel = CONFIG.styles[STATE.selectedStyle]?.label || STATE.selectedStyle;
    const dropdownLabel = labels.styleDropdown || 'Stile';
    styleBtn.textContent = `${dropdownLabel}: ${styleLabel}`;
  }
}

function setActiveDropdownItem(menuId, activeId) {
  const menu = document.getElementById(menuId);
  if (!menu) return;
  menu.querySelectorAll('.dropdown-item').forEach(el => {
    el.classList.toggle('active', el.dataset.id === activeId);
  });
}

async function handlePreviewChange(style) {
  const styleDef = CONFIG.styles[style];
  if (!styleDef) return;

  STATE.selectedStyle = style;
  setActiveDropdownItem('previewDropdown-menu', style);

  const container = document.getElementById('cv-preview');
  if (container) container.style.opacity = '0.5';

  try {
    const dataUrl = CONFIG.languages[STATE.selectedLanguage].dataUrl;
    const fullData = await fetchData(dataUrl);
    applyLabelsToUi(fullData.labels);
    await renderCVPreview(styleDef.templateUrl, fullData, false);
    updateUrlParams();
  } catch (error) {
    console.error('Preview update failed:', error);
    alert(STATE.labels.errorPreview || 'Errore aggiornamento preview.');
  } finally {
    if (container) container.style.opacity = '1';
  }
}

async function handleLanguageChange(lang) {
  if (STATE.selectedLanguage === lang || !CONFIG.languages[lang]) return;
  STATE.selectedLanguage = lang;
  setActiveDropdownItem('languageDropdown-menu', lang);
  await handlePreviewChange(STATE.selectedStyle);
}

async function waitForImagesToLoad(container) {
  const images = Array.from(container.getElementsByTagName('img'));
  if (images.length === 0) return;
  const promises = images.map(img => {
    if (img.complete && img.naturalHeight !== 0) return Promise.resolve();
    return new Promise(resolve => { img.onload = img.onerror = resolve; });
  });
  return Promise.all(promises);
}

async function printElement(element) {
  const iframe = document.createElement('iframe');
  iframe.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;';
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow.document;
  doc.open();
  doc.write(`<html><head><title>Curriculum Vitae</title><style>
    body { margin: 0; padding: 0; font-family: Arial, sans-serif; background: white; }
    @page { size: auto; margin: 0mm; }
    * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
    .keep-together { page-break-inside: avoid; break-inside: avoid; }
  </style></head><body>${element.innerHTML}</body></html>`);
  doc.close();

  await waitForImagesToLoad(doc.body);

  const cleanup = () => {
    if (iframe.parentNode) iframe.parentNode.removeChild(iframe);
  };
  iframe.contentWindow.onafterprint = cleanup;
  // Safety net: some browsers don't reliably fire onafterprint
  setTimeout(cleanup, 60000);

  iframe.contentWindow.focus();
  iframe.contentWindow.print();
}

async function handlePdfExecution() {
  const btn = document.getElementById('generate-pdf');
  if (STATE.isGenerating || !btn) return;

  STATE.isGenerating = true;
  const originalText = btn.innerHTML;
  btn.innerHTML = STATE.labels.preparing || 'Preparazione stampa...';
  btn.disabled = true;

  try {
    const langDef = CONFIG.languages[STATE.selectedLanguage];
    const fullData = await fetchData(langDef.dataUrl);
    const dateString = new Date().toLocaleDateString(langDef.locale, {
      year: 'numeric', month: '2-digit', day: '2-digit',
    });
    const signature = `${langDef.signaturePrefix} ${dateString}`;

    const templatePath = CONFIG.styles[STATE.selectedStyle].templateUrl;
    await renderCVPreview(templatePath, fullData, true, signature);

    const element = document.getElementById('cv-preview');
    if (element) {
      await waitForImagesToLoad(element);
      await new Promise(resolve => setTimeout(resolve, 300));
      await printElement(element);
    }
  } catch (error) {
    console.error('Print preparation failed:', error);
    alert((STATE.labels.errorGenerate || 'Errore') + ': ' + error.message);
  } finally {
    STATE.isGenerating = false;
    btn.innerHTML = originalText;
    btn.disabled = false;
  }
}

function buildDropdownMenu(menuId, items, activeId, onSelect) {
  const menu = document.getElementById(menuId);
  if (!menu) return;
  menu.innerHTML = '';
  items.forEach(({ id, label }) => {
    const li = document.createElement('li');
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'dropdown-item' + (id === activeId ? ' active' : '');
    btn.dataset.id = id;
    btn.textContent = label;
    btn.addEventListener('click', e => {
      e.preventDefault();
      onSelect(id);
    });
    li.appendChild(btn);
    menu.appendChild(li);
  });
}

function initialize() {
  // Read URL params
  const params = new URLSearchParams(window.location.search);
  const langParam = params.get('lang');
  const styleParam = params.get('style');
  if (langParam && CONFIG.languages[langParam]) STATE.selectedLanguage = langParam;
  if (styleParam && CONFIG.styles[styleParam]) STATE.selectedStyle = styleParam;

  // Build dropdowns from CONFIG
  buildDropdownMenu(
    'languageDropdown-menu',
    Object.entries(CONFIG.languages).map(([id, l]) => ({ id, label: `${l.flag} ${l.label}` })),
    STATE.selectedLanguage,
    handleLanguageChange
  );
  buildDropdownMenu(
    'previewDropdown-menu',
    Object.entries(CONFIG.styles).map(([id, s]) => ({ id, label: s.label })),
    STATE.selectedStyle,
    handlePreviewChange
  );

  const generateBtn = document.getElementById('generate-pdf');
  if (generateBtn) {
    generateBtn.addEventListener('click', e => {
      e.preventDefault();
      handlePdfExecution();
    });
  }

  handlePreviewChange(STATE.selectedStyle).then(() => {
    if (window.location.hash) {
      const target = document.querySelector(window.location.hash);
      if (target) setTimeout(() => target.scrollIntoView({ behavior: 'smooth' }), 300);
    }
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initialize);
} else {
  initialize();
}
