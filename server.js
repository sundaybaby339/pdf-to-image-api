const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { fromPath } = require('pdf2pic');

const app = express();
const upload = multer({ dest: 'uploads/' });

app.post('/convert', upload.single('pdf'), async (req, res) => {
  if (!req.file) return res.status(400).send('No file uploaded.');

  const outputPath = path.join(__dirname, 'output');
  if (!fs.existsSync(outputPath)) fs.mkdirSync(outputPath);

  const options = {
    density: 150,
    saveFilename: 'converted',
    savePath: outputPath,
    format: 'png',
    width: 800,
    height: 1000,
  };

  const storeAsImage = fromPath(req.file.path, options);

  try {
    const result = await storeAsImage(1); // Chuyển trang đầu tiên
    const imageBuffer = fs.readFileSync(result.path);
    const base64Image = imageBuffer.toString('base64');

    res.json({ image_base64: base64Image });
  } catch (error) {
    res.status(500).send('Failed to convert PDF');
  } finally {
    fs.unlinkSync(req.file.path);
  }
});

app.get('/', (req, res) => {
  res.send('PDF to Image API is running');
});

app.listen(3000, () => {
  console.log('Server started on http://localhost:3000');
});
