// All'avvio, genera un div di test fuori da Bootstrap
//window.onload = async function() {
//  // Carica il JSON e genera l'HTML del CV di default (solo per test/placeholder)
//  const response = await fetch('/data/pdf-content.json');
//  const data = await response.json();
//  const container = document.getElementById('cv-preview');
//  if (!container) return;
//  let html = '<div style="font-family: Arial, sans-serif; margin: auto;">';
//  html += '<h1 style="text-align:center; font-size:2em;">Curriculum Vitae</h1>';
//  // Ciclo sulle sezioni del CV
//  data.forEach(section => {
//    html += `<h2 style='border-bottom:1px solid #ccc; font-size:1.2em; margin-top:1.5em;'>${section.section}</h2>`;
//    // Sezione con campi tabellari
//    if (section.fields) {
//      html += '<table style="width:100%; margin-bottom:1em;">';
//      section.fields.forEach(field => {
//        html += `<tr><td style='width:35%; font-weight:bold; vertical-align:top;'>${field.label}:</td><td>${field.value}</td></tr>`;
//      });
//      html += '</table>';
//    }
//    // Sezione con lista di item (es. esperienze)
//    if (section.items) {
//      section.items.forEach(item => {
//        html += '<div style="margin-bottom:0.5em;">';
//        if (item.period) html += `<span style='font-weight:bold;'>${item.period}</span> `;
//        if (item.role && item.company) html += `<span>${item.role} - ${item.company}</span><br/>`;
//        if (item.title && item.institute) html += `<span>${item.title} - ${item.institute}</span><br/>`;
//        if (item.description) html += `<span>${item.description}</span>`;
//        html += '</div>';
//      });
//    }
//  });
//  html += '</div>';
//  container.innerHTML = html;
//};

// Utility per decodificare una stringa base64
function decodeBase64(str) {
  try {
    return decodeURIComponent(escape(window.atob(str)));
  } catch (e) {
    return str;
  }
}

// Utility per convertire i ritorni a capo (\n) in <br> o <p> per i campi descrizione
// Se vuoi inserire direttamente <br> nel JSON, questa funzione non deve più modificare la descrizione
function formatDescription(text) {
  return text || '';
}

// Utility per caricare e compilare un template HTML con Handlebars
// Se decode=true, decodifica i campi base64 prima di renderizzare
async function renderCVPreview(templatePath, data, decode = false, signature = null) {
  const container = document.getElementById('cv-preview');
  if (!container) return;
  const templateResp = await fetch(templatePath);
  const templateHtml = await templateResp.text();
  // Decodifica i campi base64 se richiesto (solo per PDF)
  if (decode) {
    data.forEach(section => {
      if (section.fields) {
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
  } else {
    data.forEach(section => {
      if (section.items) {
        section.items.forEach(item => {
          if (item.description) {
            item.description = formatDescription(item.description);
          }
        });
      }
    });
  }
  // Compila e inserisce il template Handlebars, passando anche la firma se presente
  const compiled = Handlebars.compile(templateHtml);
  container.innerHTML = compiled({ data, signature });
}

// Variabile globale per tracciare lo stile selezionato
let selectedStyle = 'europass';

// Event listener per mostrare la preview Europass
// Carica i dati e il template Europass, senza decodifica base64
// Mostra la preview solo dopo selezione esplicita
document.getElementById('show-europass-preview').addEventListener('click', async function(e) {
  e.preventDefault();
  selectedStyle = 'europass';
  const response = await fetch('/data/pdf-content.json');
  const data = await response.json();
  await renderCVPreview('/templates/cv-europass.html', data, false);
});

// Event listener per mostrare la preview Custom
// Carica i dati e il template custom, senza decodifica base64
document.getElementById('show-custom-preview').addEventListener('click', async function(e) {
  e.preventDefault();
  selectedStyle = 'custom';
  const response = await fetch('/data/pdf-content.json');
  const data = await response.json();
  await renderCVPreview('/templates/cv-custom.html', data, false);
});

// Event listener per generare il PDF
// Carica i dati, decodifica i campi base64, renderizza il template selezionato
// e genera il PDF dalla preview visibile
document.getElementById('generate-pdf').addEventListener('click', async function() {
  const response = await fetch('/data/pdf-content.json');
  const data = await response.json();
  const now = new Date();
  const dateString = now.toLocaleDateString('it-IT', { year: 'numeric', month: '2-digit', day: '2-digit' });
  const signature = `Documento generato il ${dateString}`;
  let templatePath = '/templates/cv-europass.html';
  if (selectedStyle === 'custom') {
    templatePath = '/templates/cv-custom.html';
  }
  await renderCVPreview(templatePath, data, true, signature);
  const element = document.getElementById('cv-preview');
  if (element) {
    if (typeof window.html2pdf !== 'undefined') {
      window.html2pdf().from(element).save();
    } else {
      alert('html2pdf non è caricato!');
    }
  }
  // Dopo la generazione, ripristina la preview senza firma
  await renderCVPreview(templatePath, data, false, null);
});

// Event listener per PDF semplice di test (se il bottone esiste)
const btnSimple = document.getElementById('generate-pdf-simple');
if (btnSimple) {
  btnSimple.addEventListener('click', function() {
    // Genera un PDF di esempio semplice
    const doc = new window.jspdf.jsPDF();
    doc.setFontSize(22);
    doc.text('PDF di esempio', 20, 30);
    doc.setFontSize(14);
    doc.text('Questo è un PDF generato come test.', 20, 50);
    doc.save('esempio-semplice.pdf');
  });
}


