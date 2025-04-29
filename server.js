const express = require('express');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const archiver = require('archiver');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.raw({ type: 'application/pdf', limit: '20mb' }));

// Endpoint convert PDF -> ZIP ảnh
app.post('/pdf-to-image', async (req, res) => {
  const tempPdfPath = '/tmp/temp.pdf';
  const outputDir = '/tmp/pdf-images';

  try {
    const pdfBuffer = req.body;
    if (!pdfBuffer || pdfBuffer.length === 0) {
      return res.status(400).send('Missing or invalid PDF data');
    }

    // Ghi file PDF tạm
    fs.writeFileSync(tempPdfPath, pdfBuffer);

    // Tạo thư mục output
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir);
    }

    // Convert PDF sang PNG dùng poppler-utils (pdftoppm)
    const outputPrefix = path.join(outputDir, 'page');
    await new Promise((resolve, reject) => {
      exec(`pdftoppm -png "${tempPdfPath}" "${outputPrefix}"`, (error, stdout, stderr) => {
        if (error) {
          reject(new Error(stderr || stdout || error.message));
        } else {
          resolve();
        }
      });
    });

    // Zip ảnh lại
    const zipPath = '/tmp/images.zip';
    const output = fs.createWriteStream(zipPath);
    const archive = archiver('zip', { zlib: { level: 9 } });

    output.on('close', () => {
      res.download(zipPath, 'images.zip', () => {
        // Dọn file tạm
        fs.unlinkSync(tempPdfPath);
        fs.unlinkSync(zipPath);
        fs.rmSync(outputDir, { recursive: true, force: true });
      });
    });

    archive.on('error', err => { throw err; });

    archive.pipe(output);
    archive.directory(outputDir, false);
    archive.finalize();
  } catch (error) {
    console.error('Error:', error.message);
    res.status(500).send(`Error processing PDF: ${error.message}`);
    if (fs.existsSync(tempPdfPath)) fs.unlinkSync(tempPdfPath);
    if (fs.existsSync(outputDir)) fs.rmSync(outputDir, { recursive: true, force: true });
  }
});

// Check server
app.get('/', (req, res) => {
  res.send('PDF to Image Server is running.');
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
