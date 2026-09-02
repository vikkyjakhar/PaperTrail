export type ToolCategory = 'core' | 'ai' | 'cloudconvert' | 'planned';

export interface Tool {
  id: string;
  name: string;
  description: string;
  category: ToolCategory;
  iconName: string;
  path: string;
  acceptedFormats?: string;
  aiPromptPlaceholder?: string;
  plannedLabel?: string;
}

export const tools: Tool[] = [
  // Core tools — fully client-side
  {
    id: 'image-to-pdf',
    name: 'Image to PDF',
    description: 'Convert JPG, PNG, or WebP images into a PDF document instantly in your browser.',
    category: 'core',
    iconName: 'Image',
    path: '/tools/image-to-pdf',
    acceptedFormats: 'JPG, PNG, WebP, GIF (max 50 MB)',
  },
  {
    id: 'pdf-to-jpg',
    name: 'PDF to JPG',
    description: 'Extract every page from a PDF as high-quality JPEG images — no upload needed.',
    category: 'core',
    iconName: 'FileImage',
    path: '/tools/pdf-to-jpg',
    acceptedFormats: 'PDF (max 100 MB)',
  },
  {
    id: 'txt-to-pdf',
    name: 'TXT to PDF',
    description: 'Convert plain text files into clean, formatted PDF documents with a single click.',
    category: 'core',
    iconName: 'FileText',
    path: '/tools/txt-to-pdf',
    acceptedFormats: 'TXT, MD (max 10 MB)',
  },
  {
    id: 'csv-to-pdf',
    name: 'CSV to PDF',
    description: 'Turn spreadsheet data into a clean, printable PDF table with proper formatting.',
    category: 'core',
    iconName: 'Table',
    path: '/tools/csv-to-pdf',
    acceptedFormats: 'CSV, TSV (max 10 MB)',
  },
  {
    id: 'html-to-pdf',
    name: 'HTML to PDF',
    description: 'Render any HTML file or snippet as a pixel-perfect PDF document.',
    category: 'core',
    iconName: 'Code',
    path: '/tools/html-to-pdf',
    acceptedFormats: 'HTML (max 5 MB)',
  },
  {
    id: 'pdf-ocr',
    name: 'PDF OCR',
    description: 'Extract readable, searchable text from scanned or image-based PDF files.',
    category: 'core',
    iconName: 'Scan',
    path: '/tools/pdf-ocr',
    acceptedFormats: 'PDF (max 50 MB)',
  },
  {
    id: 'flatten-pdf',
    name: 'Flatten PDF',
    description: 'Merge all form fields and annotations into a flat, static PDF for safe sharing.',
    category: 'core',
    iconName: 'Layers',
    path: '/tools/flatten-pdf',
    acceptedFormats: 'PDF (max 100 MB)',
  },

  // AI tools — Gemini powered, rate-limited
  {
    id: 'chat-with-pdf',
    name: 'Chat with PDF',
    description: 'Ask questions about any PDF document in natural language and get precise answers.',
    category: 'ai',
    iconName: 'MessageSquare',
    path: '/ai/chat-with-pdf',
    acceptedFormats: 'PDF (max 20 MB)',
    aiPromptPlaceholder: 'Ask anything — "What is the main argument?" · "Summarize section 3." · "List all dates mentioned."',
  },
  {
    id: 'ai-summarizer',
    name: 'AI PDF Summarizer',
    description: 'Get a concise, structured summary of any PDF in seconds — bullet points or prose.',
    category: 'ai',
    iconName: 'Zap',
    path: '/ai/ai-summarizer',
    acceptedFormats: 'PDF (max 20 MB)',
    aiPromptPlaceholder: 'How do you want the summary? (e.g. "bullet points", "executive summary", "key takeaways in 5 sentences")',
  },
  {
    id: 'translate-pdf',
    name: 'Translate PDF',
    description: 'Translate PDF content into over 100 languages while preserving document structure.',
    category: 'ai',
    iconName: 'Globe',
    path: '/ai/translate-pdf',
    acceptedFormats: 'PDF (max 20 MB)',
    aiPromptPlaceholder: 'Which language should this PDF be translated into? (e.g. "Spanish", "French", "Japanese")',
  },
  {
    id: 'question-gen',
    name: 'AI Question Generator',
    description: 'Auto-generate study questions, quizzes, or comprehension tests from any PDF.',
    category: 'ai',
    iconName: 'HelpCircle',
    path: '/ai/question-gen',
    acceptedFormats: 'PDF (max 20 MB)',
    aiPromptPlaceholder: 'How many questions? What style? (e.g. "10 multiple choice, medium difficulty" or "5 open-ended essay questions")',
  },
  {
    id: 'ai-assistant',
    name: 'AI PDF Assistant',
    description: 'A general-purpose AI assistant for any PDF task — rewrite, extract, analyze, format.',
    category: 'ai',
    iconName: 'Sparkles',
    path: '/ai/ai-assistant',
    acceptedFormats: 'PDF (max 20 MB)',
    aiPromptPlaceholder: 'Describe what you\'d like to do with this PDF — rewrite, extract specific data, analyze tone, compare sections...',
  },

  // Planned tools — requires paid service
  {
    id: 'pdf-to-word',
    name: 'PDF to Word',
    description: 'Convert PDFs to editable .docx files with layout and formatting preserved.',
    category: 'planned',
    iconName: 'FileType',
    path: '/tools/pdf-to-word',
    plannedLabel: 'In Development',
  },
  {
    id: 'pdf-to-excel',
    name: 'PDF to Excel',
    description: 'Extract tables and structured data from PDFs into .xlsx spreadsheets.',
    category: 'planned',
    iconName: 'BarChart2',
    path: '/tools/pdf-to-excel',
    plannedLabel: 'In Development',
  },
  {
    id: 'pdf-to-ppt',
    name: 'PDF to PowerPoint',
    description: 'Convert PDF slides into editable .pptx presentations with slide structure intact.',
    category: 'planned',
    iconName: 'Monitor',
    path: '/tools/pdf-to-ppt',
    plannedLabel: 'In Development',
  },
  {
    id: 'word-to-pdf',
    name: 'Word to PDF',
    description: 'Convert .docx Word files to PDF with perfect formatting and font rendering.',
    category: 'planned',
    iconName: 'FileOutput',
    path: '/tools/word-to-pdf',
    plannedLabel: 'Coming Soon',
  },
  {
    id: 'excel-to-pdf',
    name: 'Excel to PDF',
    description: 'Export .xlsx spreadsheets to print-ready PDF in a single click.',
    category: 'planned',
    iconName: 'FileOutput',
    path: '/tools/excel-to-pdf',
    plannedLabel: 'Coming Soon',
  },
  {
    id: 'ppt-to-pdf',
    name: 'PPT to PDF',
    description: 'Export PowerPoint presentations as polished PDF files.',
    category: 'planned',
    iconName: 'FileOutput',
    path: '/tools/ppt-to-pdf',
    plannedLabel: 'Coming Soon',
  },
  {
    id: 'odt-to-pdf',
    name: 'ODT / ODS / ODP to PDF',
    description: 'Convert LibreOffice Writer, Calc, and Impress documents to PDF.',
    category: 'planned',
    iconName: 'Files',
    path: '/tools/odt-to-pdf',
    plannedLabel: 'Coming Soon',
  },
  {
    id: 'compress-pdf',
    name: 'Compress PDF',
    description: 'Reduce PDF file size significantly without sacrificing visible quality.',
    category: 'planned',
    iconName: 'Minimize2',
    path: '/tools/compress-pdf',
    plannedLabel: 'In Development',
  },
  {
    id: 'protect-pdf',
    name: 'Protect / Unlock PDF',
    description: 'Add password protection to any PDF, or remove it from an existing one.',
    category: 'planned',
    iconName: 'ShieldCheck',
    path: '/tools/protect-pdf',
    plannedLabel: 'In Development',
  },
  {
    id: 'pages-to-pdf',
    name: 'Pages to PDF',
    description: 'Convert Apple Pages documents to PDF with typography preserved.',
    category: 'planned',
    iconName: 'BookOpen',
    path: '/tools/pages-to-pdf',
    plannedLabel: 'Coming Soon',
  },
];

export function getToolById(id: string): Tool | undefined {
  return tools.find(t => t.id === id);
}

export function getToolsByCategory(cat: ToolCategory): Tool[] {
  return tools.filter(t => t.category === cat);
}
