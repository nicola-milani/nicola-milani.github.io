/**
 * Configurazione centralizzata del generatore PDF
 */
const CONFIG = {
  endpoints: {
    data: '/data/pdf-content.json'
  },
  templates: {
    'europass': '/templates/cv-europass.html',
    'europass-no-logo': '/templates/cv-europass-no-logo.html',
    'custom': '/templates/cv-custom.html'
  },
  defaultStyle: 'europass-no-logo'
};

/**
 * Stato dell'applicazione
 */
const STATE = {
  selectedStyle: CONFIG.defaultStyle,
  isGenerating: false
};

/**
 * Utility per decodificare una stringa base64 (supporto UTF-8)
 */
function decodeBase64(str) {
  try {
    // Metodo moderno compatibile con UTF-8
    const binaryString = window.atob(str);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return new TextDecoder().decode(bytes);
  } catch (e) {
    console.warn('Errore decodifica Base64 moderna, fallback su metodo legacy', e);
    try {
      return decodeURIComponent(escape(window.atob(str)));
    } catch (e2) {
      console.error('Errore decodifica Base64:', e2);
      return str;
    }
  }
}

/**
 * Utility per formattare le descrizioni (placeholder)
 */
function formatDescription(text) {
  return text || '';
}

/**
 * Fetch wrapper con gestione errori
 */
async function fetchData(url, type = 'json') {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return type === 'json' ? await response.json() : await response.text();
  } catch (error) {
    console.error(`Errore caricamento ${url}:`, error);
    throw error;
  }
}

/**
 * Carica e compila il template Handlebars
 */
async function renderCVPreview(templatePath, data, decode = false, signature = null) {
  const container = document.getElementById('cv-preview');
  if (!container) return;

  try {
    const templateHtml = await fetchData(templatePath, 'text');

    // Clona i dati per non mutare l'oggetto originale se non necessario
    // o processa direttamente (qui manteniamo la logica originale di mutazione/processing)
    // Nota: la logica originale mutava i dati 'data'.

    if (decode) {
      console.log('Decodifica Base64 in corso...');
      processDataFields(data, true);
    } else {
      processDataFields(data, false);
    }

    const compiled = Handlebars.compile(templateHtml);
    container.innerHTML = compiled({ data, signature });
  } catch (error) {
    container.innerHTML = `<div class="alert alert-danger">Errore nel rendering della preview: ${error.message}</div>`;
  }
}

/**
 * Processa i campi dei dati (decodifica e formattazione)
 */
function processDataFields(data, shouldDecode) {
  data.forEach(section => {
    if (section.fields && shouldDecode) {
      section.fields.forEach(field => {
        if (field.base64) {
          field.value = decodeBase64(field.value);
        }
      });
    }
    if (section.items) {
      section.items.forEach(item => {
        if (item.description) {
          item.description = formatDescription(item.description);
        }
      });
    }
  });
}

/**
 * Gestisce il cambio di stile della preview
 */
async function handlePreviewChange(style) {
  const templatePath = CONFIG.templates[style];
  if (!templatePath) return;

  STATE.selectedStyle = style;

  // Feedback visivo semplice
  const container = document.getElementById('cv-preview');
  if (container) container.style.opacity = '0.5';

  try {
    const data = await fetchData(CONFIG.endpoints.data);
    await renderCVPreview(templatePath, data, false);
  } catch (error) {
    alert('Impossibile aggiornare la preview. Controlla la console per i dettagli.');
  } finally {
    if (container) container.style.opacity = '1';
  }
}

/**
 * Attende il caricamento delle immagini
 */
async function waitForImagesToLoad(container) {
  const images = Array.from(container.getElementsByTagName('img'));
  if (images.length === 0) return;

  const promises = images.map(img => {
    if (img.complete && img.naturalHeight !== 0) return Promise.resolve();
    return new Promise(resolve => {
      img.onload = img.onerror = resolve;
    });
  });

  return Promise.all(promises);
}


/**
 * Crea un iframe nascosto per la stampa isolata
 */
async function printElement(element) {
  // Crea iframe nascosto
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow.document;

  // Scrivi il contenuto
  // Implementiamo stili base per il reset e la stampa
  doc.open();
  doc.write(`
    <html>
      <head>
        <title>Curriculum Vitae</title>
        <style>
          body { 
            margin: 0; 
            padding: 0; 
            font-family: Arial, sans-serif;
            background: white;
          }
          @page { 
            size: auto;   /* auto is the initial value */
            margin: 0mm;  /* this affects the margin in the printer settings */
          }
          /* Assicuriamoci che i colori di sfondo vengano stampati */
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          /* Riprendiamo le regole inline dei template */
          .keep-together {
            page-break-inside: avoid;
            break-inside: avoid;
          }
        </style>
      </head>
      <body>
        ${element.innerHTML}
      </body>
    </html>
  `);
  doc.close();

  // Attendi caricamento immagini nell'iframe
  await waitForImagesToLoad(doc.body);

  // Focus e stampa
  iframe.contentWindow.focus();
  iframe.contentWindow.print();

  // Rimuovi iframe dopo la stampa (con un delay per permettere l'invio al driver di stampa)
  setTimeout(() => {
    document.body.removeChild(iframe);
  }, 2000);
}


// Event listener per generare il PDF
// Carica i dati, renderizza il template selezionato e lancia la stampa tramite iframe
async function handlePdfExectution() {
  const btn = document.getElementById('generate-pdf');
  if (STATE.isGenerating || !btn) return;

  // UI Loading State
  STATE.isGenerating = true;
  const originalText = btn.innerHTML;
  btn.innerHTML = 'Preparazione stampa...';
  btn.disabled = true;

  try {
    const data = await fetchData(CONFIG.endpoints.data);
    const now = new Date();
    const dateString = now.toLocaleDateString('it-IT', { year: 'numeric', month: '2-digit', day: '2-digit' });

    // Inseriamo la firma se desiderata
    const signature = `Documento generato il ${dateString}`;

    let templatePath = CONFIG.templates[STATE.selectedStyle];

    // Renderizza la preview "pulita" ma con la firma pronta per la stampa
    await renderCVPreview(templatePath, data, true, signature);

    const element = document.getElementById('cv-preview');
    if (element) {
      await waitForImagesToLoad(element); // Attendi caricamento immagini nel DOM principale

      // Breve ritardo per assicurare il rendering del DOM
      await new Promise(resolve => setTimeout(resolve, 300));

      // Lancia la stampa isolata
      await printElement(element);
    }
  } catch (error) {
    console.error('Errore durante la preparazione alla stampa:', error);
    alert('Errore durante la preparazione: ' + error.message);
  } finally {
    // Ripristino UI
    STATE.isGenerating = false;
    btn.innerHTML = originalText;
    btn.disabled = false;
  }
}

/**
 * Inizializzazione Event Listeners
 */
document.addEventListener('DOMContentLoaded', () => {
  // Listener per i bottoni di preview
  const previewButtons = {
    'show-europass-preview': 'europass',
    'show-europass-no-logo-preview': 'europass-no-logo',
    'show-custom-preview': 'custom'
  };

  Object.entries(previewButtons).forEach(([id, style]) => {
    const btn = document.getElementById(id);
    if (btn) {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        handlePreviewChange(style);
      });
    }
  });

  // Listener generazione PDF principale
  const generateBtn = document.getElementById('generate-pdf');
  if (generateBtn) {
    generateBtn.addEventListener('click', (e) => {
      e.preventDefault();
      handlePdfExectution();
    });
  }

  // Listener PDF semplice (test)
  const btnSimple = document.getElementById('generate-pdf-simple');
  if (btnSimple) {
    btnSimple.addEventListener('click', () => {
      const doc = new window.jspdf.jsPDF();
      doc.setFontSize(22);
      doc.text('PDF di esempio', 20, 30);
      doc.setFontSize(14);
      doc.text('Questo è un PDF generato come test.', 20, 50);
      doc.save('esempio-semplice.pdf');
    });
  }
});
