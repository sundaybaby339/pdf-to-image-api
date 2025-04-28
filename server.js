app.post('/pdf-to-image', async (req, res) => {
  try {
    const pdfBuffer = req.body;
    if (!pdfBuffer || pdfBuffer.length === 0) {
      return res.status(400).send('Missing or invalid PDF data');
    }

    const browser = await puppeteer.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    const page = await browser.newPage();

    // Chuyển PDF buffer thành base64
    const pdfBase64 = pdfBuffer.toString('base64');
    const pdfDataUrl = `data:application/pdf;base64,${pdfBase64}`;

    // Dùng data URL để mở PDF
    await page.goto(pdfDataUrl, { waitUntil: 'networkidle0', timeout: 60000 });
    await page.setViewport({ width: 1280, height: 720 });

    const screenshot = await page.screenshot({ fullPage: true });

    await browser.close();

    res.contentType('image/png');
    res.send(screenshot);
  } catch (error) {
    res.status(500).send(error.message);
  }
});
