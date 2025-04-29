const express = require('express');
const { Converter } = require('pdf-poppler');
const fs = require('fs');
const path = require('path');
const archiver = require('archiver');
const util = require('util');
const rimraf = require('rimraf');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware để nhận PDF binary
app.use(express.raw({ type: 'application/pdf', limit: '10mb' }));

// API: Chuyển PDF thành nhiều ảnh rồi nén zip
app.post('/pdf-to-image', async (req, res) => {
  const tempDir = '/tmp';
  const tempPdfPath = path.join(tempDir, 'temp.pdf');
  const outputPrefix = 'page';

  try {
    const pdfBuffer = req.body;
    if (!pdfBuffer || pdfBuffer.length === 0) {
      return res.status(400).send('Missing or invalid PDF data');
    }

    // Bước 1: Lưu PDF
    fs.writeFileSync(tempPdfPath, pdfBuffer);

    const options = {
      format: 'png',
      out_dir: tempDir,
      out_prefix: outputPrefix,
      dpi: 150,
    };

    // Bước 2: Convert PDF sang PNG
    await Converter.convert(tempPdfPath, options);

    // Bước 3: Gom tất cả ảnh page-*.png
    const imageFiles = fs.readdirSync(tempDir)
      .filter(file => file.startsWith(outputPrefix) && file.endsWith('.png'))
      .map(file => path.join(tempDir, file));

    if (imageFiles.length === 0) {
      throw new Error('No images generated from PDF');
    }

    // Bước 4: Tạo file zip
    const zipPath = path.join(tempDir, 'images.zip');
    const output = fs.createWriteStream(zipPath);
    const archive = archiver('zip', { zlib: { level: 9 } });

    archive.pipe(output);

    for (const filePath of imageFiles) {
      archive.file(filePath, { name: path.basename(filePath) });
    }

    await archive.finalize();

    // Chờ zip xong
    await new Promise(resolve => output.on('close', resolve));

    const zipBuffer = fs.readFileSync(zipPath);

    // Bước 5: Trả file zip
    res.contentType('application/zip');
    res.send(zipBuffer);

  } catch (error) {
    console.error('Error:', error.message);
    res.status(500).send(`Error processing PDF: ${error.message}`);
  } finally {
    // Bước 6: Dọn rác /tmp
    try {
      const files = fs.readdirSync(tempDir);
      for (const file of files) {
        if (file.startsWith(outputPrefix) || file === 'temp.pdf' || file === 'images.zip') {
          fs.unlinkSync(path.join(tempDir, file));
        }
      }
      console.log('Cleaned temporary files.');
    } catch (cleanupError) {
      console.error('Error cleaning up temporary files:', cleanupError.message);
    }
  }
});

// API gốc
app.get('/', (req, res) => {
  res.send('PDF to Image server is running.');
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
