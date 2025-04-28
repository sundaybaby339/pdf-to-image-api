const express = require('express');
const puppeteer = require('puppeteer');
const fs = require('fs').promises;

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.raw({ type: 'application/pdf', limit: '10mb' }));

app.post('/pdf-to-image', async (req, res) => {
  try {
    const pdfBuffer = req.body;
    if (!pdfBuffer || pdfBuffer.length === 0) {
      return res.status(400).send('Missing or invalid PDF data');
    }

    const pdfPath = '/tmp/input.pdf';
    await fs.writeFile(pdfPath, pdfBuffer);

    const browser = await puppeteer.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    const page = await browser.newPage();

    await page.goto(`file://${pdfPath}`, { waitUntil: 'networkidle0', timeout: 60000 });
    await page.setViewport({ width: 1280, height: 720 });

    const screenshot = await page.screenshot({ fullPage: true });

    await browser.close();
    await fs.unlink(pdfPath);

    res.contentType('image/png');
    res.send(screenshot);
  } catch (error) {
    res.status(500).send(error.message);
  }
});

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
