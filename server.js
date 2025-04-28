const express = require('express');
const puppeteer = require('puppeteer');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware để nhận dữ liệu PDF binary
app.use(express.raw({ type: 'application/pdf', limit: '10mb' }));

// Endpoint chuyển PDF thành ảnh
app.post('/pdf-to-image', async (req, res) => {
  try {
    // Kiểm tra dữ liệu đầu vào
    const pdfBuffer = req.body;
    if (!pdfBuffer || pdfBuffer.length === 0) {
      console.error('Invalid PDF data: Buffer is empty');
      return res.status(400).send('Missing or invalid PDF data');
    }

    console.log(`Received PDF Buffer Size: ${pdfBuffer.length} bytes`); // Debug

    // Khởi động Puppeteer
    const browser = await puppeteer.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      headless: 'new', // Đảm bảo dùng headless mode mới
      timeout: 60000, // Tăng timeout khởi động browser
    });

    const page = await browser.newPage();

    // Tăng timeout cho các thao tác trên page
    await page.setDefaultNavigationTimeout(60000);

    // Chuyển PDF buffer thành base64
    const pdfBase64 = pdfBuffer.toString('base64');
    const pdfDataUrl = `data:application/pdf;base64,${pdfBase64}`;

    console.log('Opening PDF via data URL'); // Debug

    // Mở PDF bằng data URL
    await page.goto(pdfDataUrl, { waitUntil: 'networkidle0', timeout: 60000 });

    // Đặt kích thước viewport để chụp ảnh
    await page.setViewport({ width: 1280, height: 720 });

    // Chụp ảnh màn hình
    const screenshot = await page.screenshot({ fullPage: true });

    console.log('Screenshot captured successfully'); // Debug

    // Đóng browser
    await browser.close();

    // Trả về ảnh PNG
    res.contentType('image/png');
    res.send(screenshot);
  } catch (error) {
    console.error('Error in /pdf-to-image:', error.message); // Debug lỗi
    res.status(500).send(`Error processing PDF: ${error.message}`);
  }
});

// Endpoint chụp ảnh màn hình từ URL (giữ nguyên từ code ban đầu)
app.get('/screenshot', async (req, res) => {
  try {
    const { url } = req.query;
    if (!url) {
      return res.status(400).send('Missing URL');
    }

    const browser = await puppeteer.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      headless: 'new',
      timeout: 60000,
    });

    const page = await browser.newPage();
    await page.setDefaultNavigationTimeout(60000);

    await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });

    const screenshot = await page.screenshot({ fullPage: true });

    await browser.close();

    res.contentType('image/png');
    res.send(screenshot);
  } catch (error) {
    console.error('Error in /screenshot:', error.message);
    res.status(500).send(`Error capturing screenshot: ${error.message}`);
  }
});

// Endpoint gốc
app.get('/', (req, res) => {
  res.send('Puppeteer Server is running.');
});

// Khởi động server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
