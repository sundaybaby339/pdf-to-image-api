const express = require('express');
const puppeteer = require('puppeteer');

const app = express();
const PORT = process.env.PORT || 3000;

app.get('/screenshot', async (req, res) => {
  const { url } = req.query;
  if (!url) {
    return res.status(400).send('Missing URL');
  }

  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox']
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
