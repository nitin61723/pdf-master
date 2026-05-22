import { 
  FileEdit, 
  BookOpen, 
  Zap, 
  FlipHorizontal, 
  Crop, 
  Highlighter, 
  MessageSquare, 
  Unlock, 
  Scissors,
  FileText,
  Table,
  Presentation,
  Image as ImageIcon,
  Type,
  Layout,
  RefreshCw,
  Stamp,
  Trash2,
  ExternalLink,
  PenTool,
  ShieldCheck,
  Search,
  Wrench
} from "lucide-react";

export const navigationItems = [
  {
    title: "Edit & Read",
    items: [
      { id: "edit", label: "Edit PDF", icon: FileEdit, description: "Directly edit text and images in PDF." },
      { id: "read", label: "Read PDF", icon: BookOpen, description: "Professional PDF viewer and reader." },
      { id: "compress", label: "Compress PDF", icon: Zap, description: "Reduce PDF file size without quality loss." },
      { id: "merge", label: "Merge PDF", icon: FlipHorizontal, description: "Combine multiple PDFs into one." },
      { id: "crop", label: "Crop PDF", icon: Crop, description: "Trim PDF margins or specific areas." },
      { id: "highlight", label: "Highlight PDF", icon: Highlighter, description: "Mark important text in your PDF." },
      { id: "annotate", label: "Annotate PDF", icon: MessageSquare, description: "Add comments and notes to your PDF." },
      { id: "unlock", label: "Unlock PDF", icon: Unlock, description: "Remove password and restrictions from PDF." },
      { id: "split", label: "Split PDF", icon: Scissors, description: "Separate one page or whole set." },
    ]
  },
  {
    title: "Convert from PDF",
    items: [
      { id: "pdf-to-word", label: "PDF to Word", icon: FileText, description: "Convert PDF documents to Word." },
      { id: "pdf-to-excel", label: "PDF to Excel", icon: Table, description: "Extract data from PDF to Excel." },
      { id: "pdf-to-ppt", label: "PDF to PPT", icon: Presentation, description: "Convert PDF to PowerPoint slides." },
      { id: "pdf-to-jpg", label: "PDF to JPG", icon: ImageIcon, description: "Extract images or pages to JPG." },
      { id: "pdf-to-png", label: "PDF to PNG", icon: ImageIcon, description: "Convert PDF pages to PNG images." },
      { id: "pdf-to-txt", label: "PDF to TXT", icon: Type, description: "Extract plain text from your PDF." },
    ]
  },
  {
    title: "Convert to PDF",
    items: [
      { id: "word-to-pdf", label: "Word to PDF", icon: FileText, description: "Convert Word documents to PDF." },
      { id: "excel-to-pdf", label: "Excel to PDF", icon: Table, description: "Transform Excel sheets to PDF." },
      { id: "ppt-to-pdf", label: "PPT to PDF", icon: Presentation, description: "Convert PPT slides to PDF." },
      { id: "jpg-to-pdf", label: "JPG to PDF", icon: ImageIcon, description: "Convert JPG images to PDF." },
      { id: "png-to-pdf", label: "PNG to PDF", icon: ImageIcon, description: "Convert PNG images to PDF." },
      { id: "html-to-pdf", label: "HTML to PDF", icon: Layout, description: "Generate PDF from web pages." },
    ]
  },
  {
    title: "More Tools",
    items: [
      { id: "rotate", label: "Rotate PDF", icon: RefreshCw, description: "Rotate PDF pages to your liking." },
      { id: "watermark", label: "Add Watermark", icon: Stamp, description: "Add image or text watermark to PDF." },
      { id: "remove-pages", label: "Remove Pages", icon: Trash2, description: "Delete unwanted pages from PDF." },
      { id: "extract-pages", label: "Extract Pages", icon: ExternalLink, description: "Save chosen PDF pages as new file." },
      { id: "esign", label: "eSign PDF", icon: PenTool, description: "Digitally sign your PDF documents." },
      { id: "protect", label: "Protect PDF", icon: ShieldCheck, description: "Secure PDF with a password." },
      { id: "ocr", label: "OCR PDF", icon: Search, description: "Make scanned PDF searchable and editable." },
      { id: "repair", label: "Repair PDF", icon: Wrench, description: "Fix and recover data from corrupt PDFs." },
    ]
  }
];
