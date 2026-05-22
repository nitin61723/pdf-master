"use client";

import React, { useEffect, useRef, useState } from "react";
import * as pdfjs from "pdfjs-dist";
import { fabric } from "fabric";
import { Loader2, Type, MousePointer2, Pencil, Square, Circle, Eraser, Download, Save } from "lucide-react";
import { cn } from "@/lib/utils";

// Set up the worker for pdf.js (redundant but safe)
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

interface PdfAnnotatorProps {
  file: File;
  onSave: (processedPdfUrl: string) => void;
}

export function PdfAnnotator({ file, onSave }: PdfAnnotatorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricRef = useRef<fabric.Canvas | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [activeTool, setActiveTool] = useState<"select" | "text" | "draw" | "rect" | "circle">("select");
  const [pdfDoc, setPdfDoc] = useState<pdfjs.PDFDocumentProxy | null>(null);

  useEffect(() => {
    const initPdf = async () => {
      setLoading(true);
      try {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
        setPdfDoc(pdf);
        setTotalPages(pdf.numPages);
        await renderPage(pdf, 1);
      } catch (err) {
        console.error("Error loading PDF:", err);
      } finally {
        setLoading(false);
      }
    };

    initPdf();
  }, [file]);

  const renderPage = async (pdf: pdfjs.PDFDocumentProxy, pageNum: number) => {
    const page = await pdf.getPage(pageNum);
    const viewport = page.getViewport({ scale: 1.5 });
    
    // First render PDF to an image to use as fabric background
    const tempCanvas = document.createElement("canvas");
    const tempContext = tempCanvas.getContext("2d");
    tempCanvas.height = viewport.height;
    tempCanvas.width = viewport.width;

    if (!tempContext) return;

    await (page as any).render({
      canvasContext: tempContext,
      viewport: viewport,
    }).promise;

    const bgImage = tempCanvas.toDataURL("image/png");

    // Initialize or Update Fabric Canvas
    if (!fabricRef.current && canvasRef.current) {
      fabricRef.current = new fabric.Canvas(canvasRef.current, {
        height: viewport.height,
        width: viewport.width,
        isDrawingMode: false,
      });
    }

    const fCanvas = fabricRef.current;
    if (fCanvas) {
      fCanvas.setHeight(viewport.height);
      fCanvas.setWidth(viewport.width);
      
      fabric.Image.fromURL(bgImage, (img) => {
        fCanvas.setBackgroundImage(img, fCanvas.renderAll.bind(fCanvas), {
          originX: 'left',
          originY: 'top',
        });
      });
    }
  };

  const handleToolChange = (tool: typeof activeTool) => {
    setActiveTool(tool);
    const fCanvas = fabricRef.current;
    if (!fCanvas) return;

    fCanvas.isDrawingMode = (tool === "draw");
    if (tool === "draw") {
      fCanvas.freeDrawingBrush = new fabric.PencilBrush(fCanvas);
      fCanvas.freeDrawingBrush.width = 3;
      fCanvas.freeDrawingBrush.color = "#4f46e5";
    }
  };

  const addText = () => {
    const fCanvas = fabricRef.current;
    if (!fCanvas) return;
    
    const text = new fabric.IText("Type something...", {
      left: 100,
      top: 100,
      fontSize: 20,
      fill: "#000000",
      fontFamily: "Inter"
    });
    fCanvas.add(text);
    fCanvas.setActiveObject(text);
    setActiveTool("select");
  };

  const addRect = () => {
    const fCanvas = fabricRef.current;
    if (!fCanvas) return;
    const rect = new fabric.Rect({
      left: 100,
      top: 100,
      width: 100,
      height: 60,
      fill: "transparent",
      stroke: "#4f46e5",
      strokeWidth: 2,
    });
    fCanvas.add(rect);
    setActiveTool("select");
  };

  const saveAnnotations = async () => {
    const fCanvas = fabricRef.current;
    if (!fCanvas) return;
    
    // For now, we'll just save the current canvas state as an image/pdf preview
    // In a full version, we'd use pdf-lib to merge these annotations back into the original PDF
    const dataUrl = fCanvas.toDataURL({ format: 'png' });
    onSave(dataUrl);
  };

  return (
    <div className="flex flex-col h-full bg-zinc-100 dark:bg-zinc-900 rounded-3xl overflow-hidden border border-zinc-200 dark:border-zinc-800">
      {/* Toolbar */}
      <div className="p-4 bg-white dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button 
            onClick={() => handleToolChange("select")}
            className={cn("p-2 rounded-lg transition-colors", activeTool === "select" ? "bg-indigo-600 text-white" : "hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-600 dark:text-zinc-400")}
          >
            <MousePointer2 className="h-5 w-5" />
          </button>
          <button 
            onClick={() => handleToolChange("draw")}
            className={cn("p-2 rounded-lg transition-colors", activeTool === "draw" ? "bg-indigo-600 text-white" : "hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-600 dark:text-zinc-400")}
          >
            <Pencil className="h-5 w-5" />
          </button>
          <button 
            onClick={addText}
            className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-600 dark:text-zinc-400 transition-colors"
          >
            <Type className="h-5 w-5" />
          </button>
          <button 
            onClick={addRect}
            className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-600 dark:text-zinc-400 transition-colors"
          >
            <Square className="h-5 w-5" />
          </button>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-zinc-500">
            Page {currentPage} of {totalPages}
          </span>
          <button 
            onClick={saveAnnotations}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl text-sm font-bold transition-all shadow-lg shadow-green-900/20"
          >
            <Save className="h-4 w-4" />
            Save Changes
          </button>
        </div>
      </div>

      {/* Canvas Area */}
      <div 
        ref={containerRef}
        className="flex-1 overflow-auto p-8 flex justify-center items-start custom-scrollbar bg-zinc-50 dark:bg-zinc-900"
      >
        {loading ? (
          <div className="flex flex-col items-center justify-center p-20">
            <Loader2 className="h-10 w-10 animate-spin text-indigo-600 mb-4" />
            <p className="text-zinc-500 font-medium">Loading document viewer...</p>
          </div>
        ) : (
          <div className="bg-white shadow-2xl relative">
            <canvas ref={canvasRef} />
          </div>
        )}
      </div>
    </div>
  );
}
