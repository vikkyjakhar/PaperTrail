# CLOUDCONVERT API INTEGRATION — "Coming Soon" Tools

Wire up the following tools using the CloudConvert API. These tools are 
currently placeholder/greyed-out "Coming Soon" tiles — implement them for 
real now.

⚠️ SECURITY REQUIREMENT — READ FIRST
The CloudConvert API key must NEVER appear in frontend code, never be sent 
to the browser, and never be visible in page source. It must live ONLY as 
a backend environment variable (e.g. `CLOUDCONVERT_API_KEY`), read by 
server-side code only. The frontend calls OUR OWN backend routes; our 
backend is the only thing that ever talks to CloudConvert directly. If any 
generated code puts the API key in a frontend file, that is a critical bug.

---

## Tools to implement
- PDF → Word / Excel / PPT
- Word / Excel / PPT → PDF
- ODT / ODS / ODP → PDF
- Compress PDF
- Protect PDF (add password)
- Unlock PDF (remove password)
- Pages → PDF

---

## Architecture

1. User uploads a file in the browser (existing upload UI already built)
2. Frontend sends the file to OUR backend route (e.g. `POST /api/convert`), 
   not to CloudConvert directly
3. Backend creates a CloudConvert "job" with three chained tasks:
   - `import/upload` — accepts the file we forward from our backend
   - `convert` — the actual format conversion
   - `export/url` — produces a temporary download link for the result
4. Backend uploads the file bytes to the import task's upload URL
5. Backend polls the job status until it's finished
6. Backend returns the final download URL to the frontend
7. Frontend shows "Download Result" using that URL — file is never stored 
   on our own server, only passes through CloudConvert temporarily

---

## Backend implementation (Node.js/Express example)

```js
const CLOUDCONVERT_API_KEY = process.env.CLOUDCONVERT_API_KEY; // backend env var ONLY
const CLOUDCONVERT_BASE = 'https://api.cloudconvert.com/v2';

app.post('/api/convert', upload.single('file'), async (req, res) => {
  try {
    const { inputFormat, outputFormat, options } = req.body; // e.g. 'docx' -> 'pdf'
    const file = req.file; // from multer or similar upload middleware

    // 1. Create the job with chained tasks
    const jobRes = await fetch(`${CLOUDCONVERT_BASE}/jobs`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CLOUDCONVERT_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tasks: {
          'import-file': { operation: 'import/upload' },
          'convert-file': {
            operation: 'convert',
            input: 'import-file',
            input_format: inputFormat,
            output_format: outputFormat,
            ...(options || {}), // e.g. { engine: 'office' } or compression level
          },
          'export-file': {
            operation: 'export/url',
            input: 'convert-file',
          },
        },
      }),
    });

    if (!jobRes.ok) {
      const errText = await jobRes.text();
      console.error('CloudConvert job creation failed:', jobRes.status, errText);
      return res.status(502).json({ message: 'Conversion service error' });
    }

    const job = await jobRes.json();
    const importTask = job.data.tasks.find(t => t.name === 'import-file');
    const uploadUrl = importTask.result.form.url;
    const uploadParams = importTask.result.form.parameters;

    // 2. Upload the actual file bytes to CloudConvert's upload URL
    const formData = new FormData();
    Object.entries(uploadParams).forEach(([key, value]) => formData.append(key, value));
    formData.append('file', file.buffer, file.originalname);

    const uploadRes = await fetch(uploadUrl, { method: 'POST', body: formData });
    if (!uploadRes.ok) {
      console.error('CloudConvert file upload failed:', uploadRes.status);
      return res.status(502).json({ message: 'File upload to conversion service failed' });
    }

    // 3. Poll job status until finished
    let jobStatus;
    const jobId = job.data.id;
    for (let attempt = 0; attempt < 30; attempt++) { // ~30s timeout, adjust as needed
      await new Promise(r => setTimeout(r, 1000));
      const statusRes = await fetch(`${CLOUDCONVERT_BASE}/jobs/${jobId}`, {
        headers: { 'Authorization': `Bearer ${CLOUDCONVERT_API_KEY}` },
      });
      jobStatus = await statusRes.json();
      if (jobStatus.data.status === 'finished') break;
      if (jobStatus.data.status === 'error') {
        console.error('CloudConvert job failed:', jobStatus.data);
        return res.status(502).json({ message: 'Conversion failed' });
      }
    }

    if (jobStatus.data.status !== 'finished') {
      return res.status(504).json({ message: 'Conversion timed out, please try again' });
    }

    // 4. Extract the final download URL from the export task
    const exportTask = jobStatus.data.tasks.find(t => t.name === 'export-file');
    const downloadUrl = exportTask.result.files[0].url;

    res.json({ downloadUrl, filename: exportTask.result.files[0].filename });
  } catch (err) {
    console.error('Conversion route crashed:', err);
    res.status(500).json({ message: 'Server error' });
  }
});
```

## Frontend implementation

```js
async function convertViaCloudConvert(file, inputFormat, outputFormat, options = {}) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('inputFormat', inputFormat);
  formData.append('outputFormat', outputFormat);
  formData.append('options', JSON.stringify(options));

  const res = await fetch('/api/convert', { method: 'POST', body: formData });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Conversion failed');
  }
  const { downloadUrl, filename } = await res.json();
  return { downloadUrl, filename }; // render as a "Download Result" link/button
}
```

---

## Per-tool operation mapping

| Tool | input_format | output_format | Extra options |
|---|---|---|---|
| PDF → Word | pdf | docx | — |
| PDF → Excel | pdf | xlsx | — |
| PDF → PPT | pdf | pptx | — |
| Word → PDF | docx | pdf | — |
| Excel → PDF | xlsx | pdf | — |
| PPT → PDF | pptx | pdf | — |
| ODT → PDF | odt | pdf | — |
| ODS → PDF | ods | pdf | — |
| ODP → PDF | odp | pdf | — |
| Pages → PDF | pages | pdf | — |
| Compress PDF | pdf | pdf | Add `"engine": "compress"` or check CloudConvert docs for the current compress-specific task/option name |
| Protect PDF | pdf | pdf | Requires a `protect` operation task (not `convert`) with a `password` parameter — check CloudConvert's Protect API reference for exact task shape before implementing |
| Unlock PDF | pdf | pdf | Requires an `unlock` or similar task with the existing password supplied — check CloudConvert's docs for the exact operation name |

⚠️ Compress/Protect/Unlock may use different CloudConvert *operations* than 
plain `convert` (e.g. dedicated `optimize`, `protect`, or similar task 
types rather than format conversion). Please check CloudConvert's official 
API reference for these three specifically before implementing, rather than 
assuming they follow the same `convert` task shape as format conversions.

---

## UI requirements
- Remove "Coming Soon" tag from these tool cards once wired up
- Add a processing/progress state while polling (this can take several 
  seconds, not instant like the client-side tools) — show "Converting via 
  CloudConvert..." not a generic spinner, since this is honest to the user 
  about it involving an external service
- On error, show the actual message from the backend (e.g. "Conversion 
  failed" / "Conversion timed out") — not a silent failure
- Update the data-handling / security page copy to reflect that these 
  specific tools DO send the file to a third-party service (CloudConvert) 
  temporarily for conversion — the "no upload" claim only applies to the 
  client-side tool tier, and this distinction should be clear to users on 
  these specific tool pages

---

## Environment setup checklist
- [ ] `CLOUDCONVERT_API_KEY` set as a backend environment variable/secret 
      (NOT in any frontend file, NOT committed to the repo)
- [ ] Confirm no `.env` file containing the real key is committed to git — 
      add `.env` to `.gitignore` if not already present
- [ ] Test each tool end-to-end after implementation using the checklist 
      table above, one tool at a time
