"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getToolById } from "@/lib/tool-utils";
import { FileUpload } from "@/components/shared/FileUpload";
import { ArrowLeft, Download, Play, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { PDFDocument, degrees } from "pdf-lib";
import * as pdfjs from "pdfjs-dist";
import { PdfAnnotator } from "@/components/tools/PdfAnnotator";
import { cn } from "@/lib/utils";

// Set up the worker for pdf.js
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;



export default function ToolPage() {
  const params = useParams();
  const id = params.id as string;
  const tool = getToolById(id);
  const router = useRouter();

  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [processedFileUrl, setProcessedFileUrl] = useState<string | null>(null);
  const [password, setPassword] = useState("");

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
      setProcessedFileUrl(url);
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
      setProcessedFileUrl(url);
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
      const pdfDoc = await PDFDocument.load(fileArrayBuffer);
      
      // For this simple version, we'll just extract the first page as a "split" demo
      // In a real tool, we'd have a UI to select pages.
      const splitPdf = await PDFDocument.create();
      const [copiedPage] = await splitPdf.copyPages(pdfDoc, [0]);
      splitPdf.addPage(copiedPage);

      const pdfBytes = await splitPdf.save();
      const blob = new Blob([pdfBytes.buffer as ArrayBuffer], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      setProcessedFileUrl(url);
    } catch (err) {
      console.error(err);
      setError("An error occurred while splitting the PDF. Note: This demo extracts the first page.");
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
      setProcessedFileUrl(url);
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

      await (page as any).render({
        canvasContext: context,
        viewport: viewport,
      }).promise;


      const imageUrl = canvas.toDataURL("image/png");
      setProcessedFileUrl(imageUrl);
    } catch (err) {
      console.error(err);
      setError("An error occurred while converting PDF to Image.");
    } finally {
      setLoading(false);
    }
  };

  const processPdfToText = async () => {
    if (files.length === 0) return;
    setLoading(true);
    try {
      const file = files[0];
      const fileArrayBuffer = await file.arrayBuffer();
      
      const loadingTask = pdfjs.getDocument({ data: fileArrayBuffer });
      const pdf = await loadingTask.promise;
      
      let fullText = "";
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(" ");
        fullText += `Page ${i}\n${pageText}\n\n`;
      }

      const blob = new Blob([fullText], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      setProcessedFileUrl(url);
    } catch (err) {
      console.error(err);
      setError("An error occurred while extracting text from PDF.");
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
      setProcessedFileUrl(url);
    } catch (err) {
      console.error(err);
      setError("An error occurred while compressing the PDF.");
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
    } else if (id === "pdf-to-txt") {
      await processPdfToText();
    } else if (id === "compress") {
      await processCompress();
    } else {
      setError(`The ${tool.label} tool is currently under development. Try 'Merge', 'Rotate', 'Compress' or 'PDF to TXT' instead!`);
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
          <PdfAnnotator file={files[0]} onSave={(url) => setProcessedFileUrl(url)} />
        ) : (
          <FileUpload 
            onFilesSelected={handleFilesSelected}
            maxFiles={id === "merge" ? 20 : 1}
            loading={loading}
            error={error}
            title={files.length > 0 ? `${files.length} files selected` : `Upload ${tool.label} files`}
            description={id === "merge" ? "Merge multiple PDFs into one document" : "Drag and drop your PDF here to start"}
          />
        )}


        {files.length > 0 && !processedFileUrl && (
          <div className="mt-8 space-y-6">
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


        {processedFileUrl && (
          <div className="mt-8">
            <div className="p-6 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 rounded-2xl flex flex-col items-center text-center">
              <div className="h-16 w-16 bg-indigo-600 text-white rounded-full flex items-center justify-center mb-4">
                <Download className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">Ready to download!</h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6">Your file has been processed successfully.</p>
              <a 
                href={processedFileUrl} 
                download={`processed-pdf-master-${id}.pdf`}
                className="bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 px-8 py-3 rounded-xl font-bold hover:opacity-90 transition-opacity"
              >
                Download PDF
              </a>
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
              Click the "Process" button to start the operation.
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
