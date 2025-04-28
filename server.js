const express = require('express');
const puppeteer = require('puppeteer');
const { fromBuffer } = require('pdf2pic');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware để nhận file PDF binary
app.use(express.raw({ type: 'application/pdf', limit: '10mb' }));

// Endpoint mới để chuyển PDF thành ảnh
app.post('/pdf-to-image', async (req, res) => {
  try {
    const pdfBuffer = req.body;
    if (!pdfBuffer || pdfBuffer.length === 0) {
      return res.status(400).send('Missing or invalid PDF data');
    }

    const output = fromBuffer(pdfBuffer, {
      density: 100,
      format: 'png',
      width: 600,
      height: 600,
    });
    const images = await output.bulk(-1); // Chuyển tất cả trang thành ảnh
    res.contentType('image/png');
    res.send(images[0].buffer); // Trả về ảnh đầu tiên
  } catch (error) {
    res.status(500).send(error.message);
  }
});

// Giữ nguyên endpoint hiện tại
app.get('/screenshot', async (req, res) => {
  const { url } = req.query;
  if (!url) {
    return res.status(400).send('Missing URL');
  }

  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: 'networkidle2' });

  const screenshot = await page.screenshot({ fullPage: true });
  await browser.close();

  res.contentType('image/png');
  res.send(screenshot);
});

app.get('/', (req, res) => {
  res.send('Puppeteer Server is running.');
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
