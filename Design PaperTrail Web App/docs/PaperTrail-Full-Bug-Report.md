# URGENT — SYSTEM-WIDE BUG AUDIT REQUIRED

Multiple tools across this app are broken with related symptoms (corrupted 
output files, wrong file types returned, AI requests failing outright). 
This pattern — different tools, same category of failure — means the root 
cause is very likely in SHARED utility functions (file handling, Blob 
creation, download triggering, or API request logic) rather than each tool 
being broken independently.

Do not patch each tool in isolation. Trace every broken tool back to its 
shared dependencies first, fix those, then verify each tool individually 
against the checklist at the end of this document. Treat this as a full 
audit, not a quick patch — confirm each tool actually works before moving 
to the next.

---

## STEP 1 — Find and audit shared utilities

Before touching individual tools, locate and review:
- The function that creates the final output Blob (shared across PDF-
  generating tools)
- The function that triggers file download (shared across ALL tools)
- The function that reads uploaded files (shared across ALL tools)
- The function/service that makes the Gemini API request (shared across ALL 
  AI tools)

If any of these are broken, EVERY tool using them will fail the same way. 
Fix once at the source, not per-tool.

---

## STEP 2 — Correct reference implementations per tool

### Image to PDF
```js
async function convertImageToPdf(file) {
  const pdfDoc = await PDFDocument.create();
  const imageBytes = await file.arrayBuffer(); // raw bytes, not a data URL

  let image;
  if (file.type === 'image/jpeg' || file.type === 'image/jpg') {
    image = await pdfDoc.embedJpg(imageBytes);
  } else if (file.type === 'image/png') {
    image = await pdfDoc.embedPng(imageBytes);
  } else {
    throw new Error('Unsupported format — only JPG and PNG supported');
  }

  const page = pdfDoc.addPage([image.width, image.height]);
  page.drawImage(image, { x: 0, y: 0, width: image.width, height: image.height });

  const pdfBytes = await pdfDoc.save(); // MUST be awaited
  return new Blob([pdfBytes], { type: 'application/pdf' }); // single-wrapped array
}
```

### PDF to JPG
```js
async function convertPdfToImages(file) {
  const pdfData = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: pdfData }).promise;
  const images = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale: 2 });
    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const context = canvas.getContext('2d');

    await page.render({ canvasContext: context, viewport }).promise;

    const blob = await new Promise((resolve) =>
      canvas.toBlob(resolve, 'image/jpeg', 0.92) // must be image/jpeg
    );
    images.push(blob);
  }
  return images; // array of JPEG blobs — verify download uses THIS, not the original file
}
```
⚠️ Specifically check: is the download button referencing the original 
uploaded file object instead of the newly generated `images` array? This 
is the most common cause of "PDF comes back instead of JPG."

### TXT to PDF
```js
async function convertTxtToPdf(text) {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  let page = pdfDoc.addPage();
  let y = page.getHeight() - 40;
  const lines = text.split('\n');

  for (const line of lines) {
    if (y < 40) {
      page = pdfDoc.addPage();
      y = page.getHeight() - 40;
    }
    page.drawText(line, { x: 40, y, size: 11, font });
    y -= 16;
  }

  const pdfBytes = await pdfDoc.save();
  return new Blob([pdfBytes], { type: 'application/pdf' });
}
```

### CSV to PDF
```js
async function convertCsvToPdf(csvText) {
  const rows = parseCsv(csvText); // e.g. PapaParse
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  let page = pdfDoc.addPage();
  let y = page.getHeight() - 40;

  for (const row of rows) {
    if (y < 40) {
      page = pdfDoc.addPage(); // handle overflow — don't cut off data
      y = page.getHeight() - 40;
    }
    page.drawText(row.join(' | '), { x: 40, y, size: 10, font });
    y -= 15;
  }

  const pdfBytes = await pdfDoc.save();
  return new Blob([pdfBytes], { type: 'application/pdf' });
}
```

### HTML to PDF
```js
async function convertHtmlToPdf(element) {
  const canvas = await html2canvas(element);
  const imgData = canvas.toDataURL('image/png');

  const pdfDoc = await PDFDocument.create();
  const pngImage = await pdfDoc.embedPng(imgData); // must await embed
  const page = pdfDoc.addPage([pngImage.width, pngImage.height]);
  page.drawImage(pngImage, { x: 0, y: 0, width: pngImage.width, height: pngImage.height });

  const pdfBytes = await pdfDoc.save();
  return new Blob([pdfBytes], { type: 'application/pdf' });
}
```

### PDF OCR (Tesseract.js)
```js
async function ocrPdf(file) {
  const pdfData = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: pdfData }).promise;
  const worker = await Tesseract.createWorker('eng'); // must await worker creation
  let fullText = '';

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale: 2 });
    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;

    const { data: { text } } = await worker.recognize(canvas);
    fullText += text + '\n';
  }

  await worker.terminate(); // must clean up or memory leaks across uses
  return fullText;
}
```

### Flatten PDF
```js
async function flattenPdf(file) {
  const pdfBytesIn = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(pdfBytesIn);
  const form = pdfDoc.getForm();
  form.flatten(); // synchronous, but save() after it is NOT

  const pdfBytesOut = await pdfDoc.save();
  return new Blob([pdfBytesOut], { type: 'application/pdf' });
}
```

### Universal download trigger (used by every tool — audit this first)
```js
function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url); // revoke AFTER click, not before
}
```
⚠️ Check: is `revokeObjectURL` being called too early (before the download 
actually starts)? That silently produces a broken/empty downloaded file — 
another very common bug matching the "won't open" symptom.

---

## STEP 3 — AI tools (Chat with PDF, Summarizer, Translator, Question 
Generator) — "Failed to fetch" error

"Failed to fetch" is a network-level error — the request never got any 
response. Root causes, in order of likelihood:

1. **Frontend calling Gemini directly** — will always fail (CORS) and 
   would expose the API key if it somehow worked. Must route through your 
   own backend.
2. **Backend route doesn't exist or isn't deployed**
3. **GEMINI_API_KEY missing from environment/secrets**
4. **Backend crashed on that request** (check server logs, not just the 
   frontend error)

Correct architecture:
```js
// Frontend — calls YOUR backend, never Google directly
async function chatWithPdf(pdfText, question) {
  const res = await fetch('/api/chat-pdf', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pdfText, question }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Request failed');
  }
  return res.json();
}

// Backend
app.post('/api/chat-pdf', async (req, res) => {
  try {
    const { pdfText, question } = req.body;
    const apiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `${pdfText}\n\nQuestion: ${question}` }] }],
        }),
      }
    );
    if (!apiRes.ok) {
      const errBody = await apiRes.text();
      console.error('Gemini API error:', apiRes.status, errBody);
      return res.status(502).json({ message: 'AI service error' });
    }
    const data = await apiRes.json();
    res.json(data);
  } catch (err) {
    console.error('chat-pdf route crashed:', err);
    res.status(500).json({ message: 'Server error' });
  }
});
```

Please confirm explicitly:
- Is `GEMINI_API_KEY` actually set in the deployed environment?
- Does a real `/api/...` backend route exist and respond to a manual test 
  (e.g. via curl or Postman), independent of the frontend?
- What does the SERVER log show when the error happens (not just what the 
  browser shows)?

---

## STEP 4 — Verification checklist (test each after fixes, do not assume)

- [ ] Image to PDF — output opens correctly in browser AND Adobe/other 
      PDF reader
- [ ] PDF to JPG — output is actually JPG image(s), not the original PDF
- [ ] TXT to PDF — output opens, text is readable, multi-page overflow works
- [ ] CSV to PDF — output opens, rows aren't cut off, multi-page overflow works
- [ ] HTML to PDF — output opens, visually matches the source element
- [ ] PDF OCR — extracted text is accurate and returned to the UI
- [ ] Flatten PDF — output opens, form fields are no longer editable
- [ ] Chat with PDF — returns a real answer, no fetch error
- [ ] AI Summarizer — returns a real summary, no fetch error
- [ ] Translate PDF — returns translated text, no fetch error
- [ ] AI Question Generator — returns generated questions, no fetch error
- [ ] Confirm the downloaded file's size is NOT 0 KB or suspiciously small 
      for every tool above (a strong sign of a broken Blob)

Report back tool-by-tool with pass/fail — do not report "all fixed" 
without having actually re-tested each one from this checklist.
