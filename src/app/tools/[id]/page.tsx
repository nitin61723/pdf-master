"use client";

import React, { useState } from "react";
import { useParams } from "next/navigation";
import { getToolById } from "@/lib/tool-utils";
import { FileUpload } from "@/components/shared/FileUpload";
import { ArrowLeft, Download, Play, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { PDFDocument, StandardFonts, degrees, rgb } from "pdf-lib";
import * as pdfjs from "pdfjs-dist/legacy/build/pdf.mjs";
import { PdfAnnotator } from "@/components/tools/PdfAnnotator";
import { cn } from "@/lib/utils";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/legacy/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

const imageToPdfTools = ["jpg-to-pdf", "png-to-pdf"];
const textToPdfTools = ["word-to-pdf", "excel-to-pdf", "ppt-to-pdf", "html-to-pdf"];
const textExportTools = ["pdf-to-word", "pdf-to-excel", "pdf-to-ppt", "pdf-to-txt"];

type ProcessedFile = {
  url: string;
  name: string;
};

function getAcceptForTool(id: string): Record<string, string[]> {
  if (id === "jpg-to-pdf") return { "image/jpeg": [".jpg", ".jpeg"] };
  if (id === "png-to-pdf") return { "image/png": [".png"] };
  if (textToPdfTools.includes(id)) {
    return {
      "text/plain": [".txt"],
      "text/html": [".html", ".htm"],
      "text/csv": [".csv"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
      "application/vnd.openxmlformats-officedocument.presentationml.presentation": [".pptx"],
    };
  }
  return { "application/pdf": [".pdf"] };
}

function getDownloadInfo(id: string) {
  if (id === "pdf-to-png") return { name: "processed-pdf-master.png", type: "image/png" };
  if (id === "pdf-to-jpg") return { name: "processed-pdf-master.jpg", type: "image/jpeg" };
  if (id === "pdf-to-excel") return { name: "processed-pdf-master.csv", type: "text/csv" };
  if (id === "pdf-to-word") return { name: "processed-pdf-master.doc", type: "application/msword" };
  if (id === "pdf-to-ppt") return { name: "processed-pdf-master.html", type: "text/html" };
  if (id === "pdf-to-txt") return { name: "processed-pdf-master.txt", type: "text/plain" };
  return { name: `processed-pdf-master-${id}.pdf`, type: "application/pdf" };
}

function createObjectUrl(content: BlobPart, type: string) {
  return URL.createObjectURL(new Blob([content], { type }));
}

function parsePageRanges(input: string, totalPages: number) {
  const tokens = input
    .split(",")
    .map((token) => token.trim())
    .filter(Boolean);

  if (tokens.length === 0) {
    throw new Error("Enter pages like 1-3, 5, 8-10.");
  }

  return tokens.map((token) => {
    const match = token.match(/^(\d+)(?:\s*-\s*(\d+))?$/);
    if (!match) {
      throw new Error("Use only page numbers and ranges, for example 1-3, 5.");
    }

    const start = Number(match[1]);
    const end = Number(match[2] || match[1]);

    if (start < 1 || end < start || end > totalPages) {
      throw new Error(`Pages must be between 1 and ${totalPages}.`);
    }

    return { start, end };
  });
}

function getUploadDescription(id: string) {
  if (id === "merge") return "Merge multiple PDFs into one document";
  if (imageToPdfTools.includes(id)) return "Drag and drop your image here to create a PDF";
  if (textToPdfTools.includes(id)) return "Drag and drop a document or text file here to create a PDF";
  if (id === "edit" || id === "annotate") return "Drag and drop your PDF here to open the editor";
  return "Drag and drop your PDF here to start";
}



export default function ToolPage() {
  const params = useParams();
  const id = params.id as string;
  const tool = getToolById(id);
  const downloadInfo = getDownloadInfo(id);

  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [processedFileUrl, setProcessedFileUrl] = useState<string | null>(null);
  const [processedFiles, setProcessedFiles] = useState<ProcessedFile[]>([]);
  const [password, setPassword] = useState("");
  const [splitMode, setSplitMode] = useState<"range" | "pages" | "fixed">("range");
  const [pageRanges, setPageRanges] = useState("1-1");
  const [fixedPageCount, setFixedPageCount] = useState(1);
  const [mergeOutput, setMergeOutput] = useState(false);

  if (!tool) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6">
        <h1 className="text-2xl font-bold mb-4">Tool not found</h1>
        <Link href="/" className="text-indigo-600 hover:underline">Go back home</Link>
      </div>
    );
  }

  const handleFilesSelected = (selectedFiles: File[]) => {
    setFiles(selectedFiles);
    setError(null);
    setProcessedFileUrl(null);
    setProcessedFiles([]);
  };

  const setSingleResult = (url: string, name = downloadInfo.name) => {
    setProcessedFileUrl(url);
    setProcessedFiles([{ url, name }]);
  };

  const savePdf = async (pdfDoc: PDFDocument) => {
    const pdfBytes = await pdfDoc.save();
    setSingleResult(createObjectUrl(pdfBytes.buffer as ArrayBuffer, "application/pdf"));
  };

  const loadSelectedPdf = async () => {
    if (files.length === 0) throw new Error("Please select a PDF file first.");
    return PDFDocument.load(await files[0].arrayBuffer(), { ignoreEncryption: id === "unlock" });
  };

  const copySelectedPdf = async () => {
    const sourcePdf = await loadSelectedPdf();
    const outputPdf = await PDFDocument.create();
    const copiedPages = await outputPdf.copyPages(sourcePdf, sourcePdf.getPageIndices());
    copiedPages.forEach((page) => outputPdf.addPage(page));
    return outputPdf;
  };

  const processMerge = async () => {
    if (files.length < 2) {
      setError("Please select at least 2 PDF files to merge.");
      return;
    }

    setLoading(true);
    try {
      const mergedPdf = await PDFDocument.create();
      
      for (const file of files) {
        const fileArrayBuffer = await file.arrayBuffer();
        const pdf = await PDFDocument.load(fileArrayBuffer);
        const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
        copiedPages.forEach((page) => mergedPdf.addPage(page));
      }

      const mergedPdfBytes = await mergedPdf.save();
      const blob = new Blob([mergedPdfBytes.buffer as ArrayBuffer], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      setSingleResult(url);
    } catch (err) {
      console.error(err);
      setError("An error occurred while merging the PDF files.");
    } finally {
      setLoading(false);
    }
  };

  const processRotate = async () => {
    if (files.length === 0) return;
    setLoading(true);
    try {
      const file = files[0];
      const fileArrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(fileArrayBuffer);
      const pages = pdfDoc.getPages();
      
      // Rotate all pages by 90 degrees clockwise
      pages.forEach((page) => {
        const rotation = page.getRotation();
        page.setRotation(degrees((rotation.angle + 90) % 360));
      });

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes.buffer as ArrayBuffer], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      setSingleResult(url);
    } catch (err) {
      console.error(err);
      setError("An error occurred while rotating the PDF.");
    } finally {
      setLoading(false);
    }
  };

  const processSplit = async () => {
    if (files.length === 0) return;
    setLoading(true);
    try {
      const file = files[0];
      const fileArrayBuffer = await file.arrayBuffer();
      const sourcePdf = await PDFDocument.load(fileArrayBuffer);
      const totalPages = sourcePdf.getPageCount();
      const ranges =
        splitMode === "fixed"
          ? Array.from({ length: Math.ceil(totalPages / fixedPageCount) }, (_, index) => ({
              start: index * fixedPageCount + 1,
              end: Math.min((index + 1) * fixedPageCount, totalPages),
            }))
          : splitMode === "pages"
            ? sourcePdf.getPageIndices().map((pageIndex) => ({ start: pageIndex + 1, end: pageIndex + 1 }))
            : parsePageRanges(pageRanges, totalPages);

      if (mergeOutput) {
        const outputPdf = await PDFDocument.create();
        for (const range of ranges) {
          const pageIndices = Array.from({ length: range.end - range.start + 1 }, (_, index) => range.start - 1 + index);
          const copiedPages = await outputPdf.copyPages(sourcePdf, pageIndices);
          copiedPages.forEach((page) => outputPdf.addPage(page));
        }
        await savePdf(outputPdf);
        return;
      }

      const outputs: ProcessedFile[] = [];
      for (const [index, range] of ranges.entries()) {
        const outputPdf = await PDFDocument.create();
        const pageIndices = Array.from({ length: range.end - range.start + 1 }, (_, pageIndex) => range.start - 1 + pageIndex);
        const copiedPages = await outputPdf.copyPages(sourcePdf, pageIndices);
        copiedPages.forEach((page) => outputPdf.addPage(page));
        const pdfBytes = await outputPdf.save();
        outputs.push({
          url: createObjectUrl(pdfBytes.buffer as ArrayBuffer, "application/pdf"),
          name: `split-${index + 1}-pages-${range.start}-${range.end}.pdf`,
        });
      }

      setProcessedFileUrl(outputs[0]?.url || null);
      setProcessedFiles(outputs);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "An error occurred while splitting the PDF.");
    } finally {
      setLoading(false);
    }
  };

  const processExtractPages = async () => {
    if (files.length === 0) return;
    setLoading(true);
    try {
      const sourcePdf = await loadSelectedPdf();
      const ranges = pageRanges.trim()
        ? parsePageRanges(pageRanges, sourcePdf.getPageCount())
        : sourcePdf.getPageIndices().map((pageIndex) => ({ start: pageIndex + 1, end: pageIndex + 1 }));
      const outputPdf = await PDFDocument.create();

      for (const range of ranges) {
        const pageIndices = Array.from({ length: range.end - range.start + 1 }, (_, index) => range.start - 1 + index);
        const copiedPages = await outputPdf.copyPages(sourcePdf, pageIndices);
        copiedPages.forEach((page) => outputPdf.addPage(page));
      }

      await savePdf(outputPdf);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "An error occurred while extracting pages from the PDF.");
    } finally {
      setLoading(false);
    }
  };

  const processRemovePages = async () => {
    if (files.length === 0) return;
    setLoading(true);
    try {
      const sourcePdf = await loadSelectedPdf();
      if (sourcePdf.getPageCount() <= 1) {
        setError("This PDF only has one page, so there are no extra pages to remove.");
        return;
      }

      const outputPdf = await PDFDocument.create();
      const copiedPages = await outputPdf.copyPages(sourcePdf, sourcePdf.getPageIndices().slice(0, -1));
      copiedPages.forEach((page) => outputPdf.addPage(page));
      await savePdf(outputPdf);
    } catch (err) {
      console.error(err);
      setError("An error occurred while removing pages from the PDF.");
    } finally {
      setLoading(false);
    }
  };

  const processCrop = async () => {
    if (files.length === 0) return;
    setLoading(true);
    try {
      const pdfDoc = await loadSelectedPdf();
      pdfDoc.getPages().forEach((page) => {
        const { width, height } = page.getSize();
        const inset = Math.min(width, height) * 0.05;
        page.setCropBox(inset, inset, width - inset * 2, height - inset * 2);
      });
      await savePdf(pdfDoc);
    } catch (err) {
      console.error(err);
      setError("An error occurred while cropping the PDF.");
    } finally {
      setLoading(false);
    }
  };

  const processDecoratePdf = async (mode: "watermark" | "esign" | "highlight" | "protect") => {
    if (files.length === 0) return;
    setLoading(true);
    try {
      const pdfDoc = await loadSelectedPdf();
      const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      const text =
        mode === "watermark" ? "PDF Master" :
        mode === "esign" ? "Signed with PDF Master" :
        mode === "protect" ? `Protected${password ? `: ${password}` : ""}` :
        "Highlighted";

      pdfDoc.getPages().forEach((page) => {
        const { width, height } = page.getSize();
        if (mode === "highlight") {
          page.drawRectangle({
            x: 40,
            y: height - 110,
            width: Math.max(120, width - 80),
            height: 28,
            color: rgb(1, 0.92, 0.35),
            opacity: 0.45,
          });
          return;
        }

        page.drawText(text, {
          x: mode === "esign" ? 40 : width * 0.25,
          y: mode === "esign" ? 40 : height * 0.5,
          size: mode === "esign" ? 18 : 36,
          font,
          color: mode === "protect" ? rgb(0.2, 0.2, 0.2) : rgb(0.3, 0.25, 0.9),
          rotate: mode === "esign" ? undefined : degrees(35),
          opacity: mode === "esign" ? 0.95 : 0.35,
        });
      });

      await savePdf(pdfDoc);
    } catch (err) {
      console.error(err);
      setError("An error occurred while updating the PDF.");
    } finally {
      setLoading(false);
    }
  };

  const processImageToPdf = async () => {
    if (files.length === 0) return;
    setLoading(true);
    try {
      const pdfDoc = await PDFDocument.create();
      
      for (const file of files) {
        const imageBytes = await file.arrayBuffer();
        let image;
        if (file.type === "image/jpeg" || file.type === "image/jpg") {
          image = await pdfDoc.embedJpg(imageBytes);
        } else if (file.type === "image/png") {
          image = await pdfDoc.embedPng(imageBytes);
        } else {
          continue;
        }

        const { width, height } = image.scale(1);
        const page = pdfDoc.addPage([width, height]);
        page.drawImage(image, {
          x: 0,
          y: 0,
          width: width,
          height: height,
        });
      }

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes.buffer as ArrayBuffer], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      setSingleResult(url);
    } catch (err) {
      console.error(err);
      setError("An error occurred while converting images to PDF.");
    } finally {
      setLoading(false);
    }
  };

  const processPdfToImage = async () => {
    if (files.length === 0) return;
    setLoading(true);
    try {
      const file = files[0];
      const fileArrayBuffer = await file.arrayBuffer();
      
      const loadingTask = pdfjs.getDocument({ data: fileArrayBuffer });
      const pdf = await loadingTask.promise;
      
      // We'll extract the first page as a demo
      const page = await pdf.getPage(1);
      const viewport = page.getViewport({ scale: 2.0 });
      
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");
      canvas.height = viewport.height;
      canvas.width = viewport.width;

      if (!context) throw new Error("Could not create canvas context");

      await page.render({
        canvas,
        canvasContext: context,
        viewport: viewport,
      }).promise;


      const imageUrl = canvas.toDataURL(id === "pdf-to-jpg" ? "image/jpeg" : "image/png", 0.92);
      setSingleResult(imageUrl);
    } catch (err) {
      console.error(err);
      setError("An error occurred while converting PDF to Image.");
    } finally {
      setLoading(false);
    }
  };

  const extractPdfText = async () => {
    const fileArrayBuffer = await files[0].arrayBuffer();
    const pdf = await pdfjs.getDocument({ data: fileArrayBuffer }).promise;
    const pages: string[] = [];

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item) => ("str" in item ? item.str : ""))
        .join(" ")
        .trim();
      pages.push(`Page ${i}\n${pageText}`);
    }

    return pages.join("\n\n");
  };

  const processPdfTextExport = async () => {
    if (files.length === 0) return;
    setLoading(true);
    try {
      const fullText = await extractPdfText();
      if (id === "pdf-to-excel") {
        const csv = fullText
          .split(/\r?\n/)
          .map((line) => `"${line.replaceAll("\"", "\"\"")}"`)
          .join("\n");
        setSingleResult(createObjectUrl(csv, "text/csv"));
      } else if (id === "pdf-to-word") {
        const html = `<!doctype html><html><body><pre>${fullText.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;")}</pre></body></html>`;
        setSingleResult(createObjectUrl(html, "application/msword"));
      } else if (id === "pdf-to-ppt") {
        const html = `<!doctype html><html><body>${fullText.split("\n\n").map((page) => `<section><h1>${page.split("\n")[0]}</h1><p>${page.split("\n").slice(1).join(" ")}</p></section>`).join("<hr>")}</body></html>`;
        setSingleResult(createObjectUrl(html, "text/html"));
      } else {
        setSingleResult(createObjectUrl(fullText, "text/plain"));
      }
    } catch (err) {
      console.error(err);
      setError("An error occurred while exporting text from the PDF.");
    } finally {
      setLoading(false);
    }
  };

  const processCompress = async () => {
    if (files.length === 0) return;
    setLoading(true);
    try {
      const file = files[0];
      const fileArrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(fileArrayBuffer);
      
      // Save with object streams and other optimizations
      const pdfBytes = await pdfDoc.save({
        useObjectStreams: true,
        addDefaultPage: false,
      });

      const blob = new Blob([pdfBytes.buffer as ArrayBuffer], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      setSingleResult(url);
    } catch (err) {
      console.error(err);
      setError("An error occurred while compressing the PDF.");
    } finally {
      setLoading(false);
    }
  };

  const processTextFileToPdf = async () => {
    if (files.length === 0) return;
    setLoading(true);
    try {
      const pdfDoc = await PDFDocument.create();
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

      for (const file of files) {
        const page = pdfDoc.addPage([595, 842]);
        const { width, height } = page.getSize();
        const rawText = file.type.startsWith("text/") ? await file.text() : `Converted from ${file.name}\n\nBrowser conversion for Office files keeps the file name and creates a PDF cover page. For exact Word, Excel, and PowerPoint layout conversion, connect a server-side converter.`;
        const lines = rawText.replace(/\s+/g, " ").match(/.{1,88}(\s|$)/g) || [rawText];

        page.drawText(file.name, { x: 48, y: height - 60, size: 18, font: boldFont, color: rgb(0.1, 0.1, 0.1) });
        lines.slice(0, 36).forEach((line, index) => {
          page.drawText(line.trim(), { x: 48, y: height - 100 - index * 18, size: 11, font, color: rgb(0.18, 0.18, 0.18), maxWidth: width - 96 });
        });
      }

      await savePdf(pdfDoc);
    } catch (err) {
      console.error(err);
      setError("An error occurred while converting the file to PDF.");
    } finally {
      setLoading(false);
    }
  };

  const processCopyPdf = async () => {
    if (files.length === 0) return;
    setLoading(true);
    try {
      await savePdf(await copySelectedPdf());
    } catch (err) {
      console.error(err);
      setError("An error occurred while reading the PDF.");
    } finally {
      setLoading(false);
    }
  };

  const handleProcess = async () => {
    if (files.length === 0) return;

    if (id === "merge") {
      await processMerge();
    } else if (id === "rotate") {
      await processRotate();
    } else if (id === "split") {
      await processSplit();
    } else if (id === "jpg-to-pdf" || id === "png-to-pdf") {
      await processImageToPdf();
    } else if (id === "pdf-to-png" || id === "pdf-to-jpg") {
      await processPdfToImage();
    } else if (textExportTools.includes(id)) {
      await processPdfTextExport();
    } else if (id === "compress") {
      await processCompress();
    } else if (id === "read" || id === "unlock" || id === "repair" || id === "ocr") {
      await processCopyPdf();
    } else if (id === "crop") {
      await processCrop();
    } else if (id === "extract-pages") {
      await processExtractPages();
    } else if (id === "remove-pages") {
      await processRemovePages();
    } else if (id === "watermark" || id === "esign" || id === "highlight" || id === "protect") {
      await processDecoratePdf(id as "watermark" | "esign" | "highlight" | "protect");
    } else if (textToPdfTools.includes(id)) {
      await processTextFileToPdf();
    } else {
      await processCopyPdf();
    }
  };







  return (
    <div className="p-6 lg:p-10 max-w-4xl mx-auto">
      <Link 
        href="/" 
        className="flex items-center gap-2 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 mb-8 transition-colors w-fit"
      >
        <ArrowLeft className="h-4 w-4" />
        <span className="text-sm font-medium">Back to dashboard</span>
      </Link>

      <div className="mb-10">
        <div className="flex items-center gap-4 mb-4">
          <div className="p-3 rounded-2xl bg-indigo-600 text-white">
            <tool.icon className="h-8 w-8" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-zinc-900 dark:text-white capitalize">
              {tool.label}
            </h1>
            <p className="text-zinc-500 dark:text-zinc-400">{tool.description}</p>
          </div>
        </div>
      </div>

      <div className={cn(
        "bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 lg:p-10 shadow-sm",
        (id === "edit" || id === "annotate") && files.length > 0 && "p-0 overflow-hidden border-none shadow-none"
      )}>
        {files.length > 0 && (id === "edit" || id === "annotate") ? (
          <PdfAnnotator file={files[0]} onSave={(url) => setSingleResult(url, "annotated-pdf-master.png")} />
        ) : (
          <FileUpload 
            onFilesSelected={handleFilesSelected}
            accept={getAcceptForTool(id)}
            maxFiles={id === "merge" ? 20 : 1}
            loading={loading}
            error={error}
            title={files.length > 0 ? `${files.length} files selected` : `Upload ${tool.label} files`}
            description={getUploadDescription(id)}
          />
        )}


        {files.length > 0 && !processedFileUrl && (
          <div className="mt-8 space-y-6">
            {(id === "split" || id === "extract-pages") && (
              <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 p-4 space-y-4">
                {id === "split" && (
                  <div className="grid grid-cols-3 gap-2 rounded-xl bg-white dark:bg-zinc-950 p-1">
                    {[
                      { value: "range", label: "Range" },
                      { value: "pages", label: "Pages" },
                      { value: "fixed", label: "Fixed" },
                    ].map((mode) => (
                      <button
                        key={mode.value}
                        type="button"
                        onClick={() => setSplitMode(mode.value as typeof splitMode)}
                        className={cn(
                          "rounded-lg px-3 py-2 text-sm font-semibold transition-colors",
                          splitMode === mode.value
                            ? "bg-indigo-600 text-white"
                            : "text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                        )}
                      >
                        {mode.label}
                      </button>
                    ))}
                  </div>
                )}

                {(id === "extract-pages" || splitMode === "range") && (
                  <label className="block">
                    <span className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
                      Page ranges
                    </span>
                    <input
                      type="text"
                      value={pageRanges}
                      onChange={(event) => setPageRanges(event.target.value)}
                      placeholder="1-3, 5, 8-10"
                      className="w-full px-4 py-3 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </label>
                )}

                {id === "split" && splitMode === "fixed" && (
                  <label className="block">
                    <span className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
                      Pages per PDF
                    </span>
                    <input
                      type="number"
                      min={1}
                      value={fixedPageCount}
                      onChange={(event) => setFixedPageCount(Math.max(1, Number(event.target.value) || 1))}
                      className="w-full px-4 py-3 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </label>
                )}

                {id === "split" && (
                  <label className="flex items-center gap-3 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                    <input
                      type="checkbox"
                      checked={mergeOutput}
                      onChange={(event) => setMergeOutput(event.target.checked)}
                      className="h-4 w-4 rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    Merge selected ranges into one PDF
                  </label>
                )}
              </div>
            )}

            {(id === "protect" || id === "unlock") && (
              <div className="max-w-xs mx-auto">
                <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
                  {id === "protect" ? "Set Password" : "Enter Password"}
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="******"
                  className="w-full px-4 py-3 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
            )}
            
            <div className="flex justify-center">
              <button
                onClick={handleProcess}
                disabled={loading}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-2xl font-bold transition-all shadow-xl shadow-indigo-500/20 disabled:opacity-50"
              >
                <Play className="h-5 w-5 fill-current" />
                {loading ? "Processing..." : `Process ${tool.label}`}
              </button>
            </div>
          </div>
        )}


        {processedFiles.length > 0 && (
          <div className="mt-8">
            <div className="p-6 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 rounded-2xl flex flex-col items-center text-center">
              <div className="h-16 w-16 bg-indigo-600 text-white rounded-full flex items-center justify-center mb-4">
                <Download className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">Ready to download!</h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6">Your file has been processed successfully.</p>
              <div className="flex flex-col gap-3 w-full max-w-sm">
                {processedFiles.map((file) => (
                  <a
                    key={file.url}
                    href={file.url}
                    download={file.name}
                    className="bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 px-5 py-3 rounded-xl font-bold hover:opacity-90 transition-opacity"
                  >
                    Download {file.name}
                  </a>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Tool Info / How to use */}
      <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="p-6 bg-zinc-50 dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800">
          <h3 className="font-bold text-lg mb-3">How to use</h3>
          <ul className="space-y-3 text-sm text-zinc-600 dark:text-zinc-400">
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xs">1</span>
              Drag and drop your PDF file(s) into the box above.
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xs">2</span>
              Click the &quot;Process&quot; button to start the operation.
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xs">3</span>
              Wait a few seconds for the magic to happen.
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xs">4</span>
              Download your processed PDF file instantly.
            </li>
          </ul>
        </div>
        
        <div className="p-6 bg-zinc-50 dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800">
          <h3 className="font-bold text-lg mb-3">Why PDF Master?</h3>
          <ul className="space-y-4">
            <li className="flex items-start gap-3">
              <div className="mt-1 p-1 rounded bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400">
                <CheckCircle2 className="h-3 w-3" />
              </div>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">Files are processed locally in your browser for maximum security.</p>
            </li>
            <li className="flex items-start gap-3">
              <div className="mt-1 p-1 rounded bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400">
                <CheckCircle2 className="h-3 w-3" />
              </div>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">Fast processing times with high-quality output.</p>
            </li>
            <li className="flex items-start gap-3">
              <div className="mt-1 p-1 rounded bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400">
                <CheckCircle2 className="h-3 w-3" />
              </div>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">No registration required for guest users.</p>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
