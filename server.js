const express = require('express');
const multer = require('multer');
const fs = require('fs');
const { exec } = require('child_process');
const path = require('path');

const app = express();
const upload = multer({ dest: '/tmp/' });

app.post('/pdf-to-image', upload.single('file'), async (req, res) => {
  const pdfPath = req.file.path;
  const outputPrefix = path.join('/tmp', `image-${Date.now()}`);
  const outputPattern = `${outputPrefix}-%d.png`;

  // Chuyển PDF thành ảnh PNG (mỗi trang một ảnh)
  exec(`pdftoppm -png "${pdfPath}" "${outputPrefix}"`, (err) => {
    if (err) {
      console.error('pdftoppm error:', err);
      fs.unlinkSync(pdfPath);
      return res.status(500).send('PDF conversion failed');
    }

    // Tìm các ảnh đã tạo
    fs.readdir('/tmp', (err, files) => {
      const images = files
        .filter(f => f.startsWith(path.basename(outputPrefix)))
        .map(f => path.join('/tmp', f));

      if (images.length === 0) {
        fs.unlinkSync(pdfPath);
        return res.status(500).send('No image generated');
      }

      // Gộp các ảnh thành 1 zip hoặc gửi ảnh đầu tiên (tuỳ bạn)
      const imagePath = images[0];
      res.sendFile(imagePath, () => {
        // Cleanup sau khi gửi
        fs.unlinkSync(pdfPath);
        images.forEach(img => fs.unlinkSync(img));
      });
    });
  });
});

app.get('/', (req, res) => {
  res.send('PDF to Image Service is running.');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
