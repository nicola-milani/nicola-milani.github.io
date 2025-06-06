// All'avvio, genera un div di test fuori da Bootstrap
window.onload = async function() {
  // Carica il JSON e genera l'HTML del CV
  const response = await fetch('/data/pdf-content.json');
  const data = await response.json();
  const container = document.getElementById('cv-preview');
  if (!container) return;
  let html = '<div style="font-family: Arial, sans-serif; margin: auto;">';
  html += '<h1 style="text-align:center; font-size:2em;">Curriculum Vitae</h1>';
  data.forEach(section => {
    html += `<h2 style='border-bottom:1px solid #ccc; font-size:1.2em; margin-top:1.5em;'>${section.section}</h2>`;
    if (section.fields) {
      html += '<table style="width:100%; margin-bottom:1em;">';
      section.fields.forEach(field => {
        html += `<tr><td style='width:35%; font-weight:bold; vertical-align:top;'>${field.label}:</td><td>${field.value}</td></tr>`;
      });
      html += '</table>';
    }
    if (section.items) {
      section.items.forEach(item => {
        html += '<div style="margin-bottom:0.5em;">';
        if (item.period) html += `<span style='font-weight:bold;'>${item.period}</span> `;
        if (item.role && item.company) html += `<span>${item.role} - ${item.company}</span><br/>`;
        if (item.title && item.institute) html += `<span>${item.title} - ${item.institute}</span><br/>`;
        if (item.description) html += `<span>${item.description}</span>`;
        html += '</div>';
      });
    }
  });
  html += '</div>';
  container.innerHTML = html;
};

// Utility per decodificare una stringa base64
function decodeBase64(str) {
  try {
    return decodeURIComponent(escape(window.atob(str)));
  } catch (e) {
    return str;
  }
}

// Utility per caricare e compilare un template HTML con Handlebars
async function renderCVPreview(templatePath, data, decode = false) {
  const container = document.getElementById('cv-preview');
  if (!container) return;
  const templateResp = await fetch(templatePath);
  const templateHtml = await templateResp.text();
  // Se decode è true, decodifica i campi base64
  if (decode) {
    data.forEach(section => {
      if (section.fields) {
        section.fields.forEach(field => {
          if (field.base64) {
            field.value = decodeBase64(field.value);
          }
        });
      }
    });
  }
  // Usa Handlebars per compilare il template
  const compiled = Handlebars.compile(templateHtml);
  container.innerHTML = compiled({ data });
}

document.getElementById('show-europass-preview').addEventListener('click', async function(e) {
  e.preventDefault();
  const response = await fetch('/data/pdf-content.json');
  const data = await response.json();
  await renderCVPreview('/templates/cv-europass.html', data, false);
});

document.getElementById('show-custom-preview').addEventListener('click', async function(e) {
  e.preventDefault();
  const response = await fetch('/data/pdf-content.json');
  const data = await response.json();
  await renderCVPreview('/templates/cv-custom.html', data, false);
});

document.getElementById('generate-pdf').addEventListener('click', async function() {
  // Decodifica i dati solo per il PDF
  const response = await fetch('/data/pdf-content.json');
  const data = await response.json();
  await renderCVPreview('/templates/cv-europass.html', data, true); // o custom, a seconda della preview attiva
  const element = document.getElementById('cv-preview');
  if (element) {
    if (typeof window.html2pdf !== 'undefined') {
      window.html2pdf().from(element).save();
    } else {
      alert('html2pdf non è caricato!');
    }
  }
});

document.getElementById('generate-pdf-simple').addEventListener('click', function() {
  // Genera un PDF di esempio semplice
  const doc = new window.jspdf.jsPDF();
  doc.setFontSize(22);
  doc.text('PDF di esempio', 20, 30);
  doc.setFontSize(14);
  doc.text('Questo è un PDF generato come test.', 20, 50);
  doc.save('esempio-semplice.pdf');
});


