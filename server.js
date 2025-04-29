const express = require('express');
const fs = require('fs');
const path = require('path');
const { PdfConverter } = require('pdf-poppler');
const archiver = require('archiver');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.raw({ type: 'application/pdf', limit: '20mb' }));

// Endpoint chuyển PDF thành zip ảnh
app.post('/pdf-to-image', async (req, res) => {
  const tempPdfPath = '/tmp/temp.pdf';
  const outputDir = '/tmp/pdf-images';

  try {
    // Kiểm tra dữ liệu
    const pdfBuffer = req.body;
    if (!pdfBuffer || pdfBuffer.length === 0) {
      return res.status(400).send('Missing or invalid PDF data');
    }

    // Ghi file PDF tạm
    fs.writeFileSync(tempPdfPath, pdfBuffer);

    // Tạo thư mục output nếu chưa có
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir);
    }

    // Convert PDF -> PNG
    const converter = new PdfConverter(tempPdfPath);
    await converter.convert(outputDir, {
      format: 'png',
      outPrefix: 'page',
      page: null,
      dpi: 150
    });

    // Zip các ảnh
    const zipPath = '/tmp/images.zip';
    const output = fs.createWriteStream(zipPath);
    const archive = archiver('zip', { zlib: { level: 9 } });

    output.on('close', () => {
      // Trả file zip
      res.download(zipPath, 'images.zip', () => {
        // Xoá file tạm
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
    // Dọn file tạm nếu lỗi
    if (fs.existsSync(tempPdfPath)) fs.unlinkSync(tempPdfPath);
    if (fs.existsSync(outputDir)) fs.rmSync(outputDir, { recursive: true, force: true });
  }
});

// Check server
app.get('/', (req, res) => {
  res.send('PDF to Image Server is running.');
});

// Start app
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
