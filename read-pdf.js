const fs = require('fs');
const pdfParse = require('pdf-parse');

const pdfPath = 'RoschCapital_Receipt_cmja1rld80006qo0qvbk3pj85 (1).pdf';

async function readPDF() {
  try {
    const dataBuffer = fs.readFileSync(pdfPath);
    const data = await pdfParse.default(dataBuffer);
    
    console.log('\n=== PDF CONTENT ===\n');
    console.log(data.text);
    console.log('\n=== END PDF CONTENT ===\n');
    
  } catch (error) {
    console.error('Error reading PDF:', error);
  }
}

readPDF();
