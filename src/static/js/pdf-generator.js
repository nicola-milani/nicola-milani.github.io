document.getElementById('generate-pdf').addEventListener('click', async function() {
  // Genera il PDF dal div #cv-preview
  const element = document.getElementById('cv-preview');
  if (element) {
    html2pdf().from(element).set({
      margin: 10,
      filename: 'cv-europass.pdf',
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    }).save();
  }
});

// All'avvio, carica il JSON e genera l'HTML del CV
window.addEventListener('DOMContentLoaded', async function() {
  const response = await fetch('/data/pdf-content.json');
  const data = await response.json();
  const container = document.getElementById('cv-preview');
  if (!container) return;
  let html = '<div style="font-family: Arial, sans-serif; max-width: 800px; margin: auto;">';
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
});
