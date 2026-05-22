"use client";

import React, { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, File, X, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface FileUploadProps {
  onFilesSelected: (files: File[]) => void;
  accept?: Record<string, string[]>;
  maxFiles?: number;
  loading?: boolean;
  error?: string | null;
  success?: boolean;
  title?: string;
  description?: string;
}

export function FileUpload({
  onFilesSelected,
  accept = { "application/pdf": [".pdf"] },
  maxFiles = 1,
  loading = false,
  error = null,
  success = false,
  title = "Select PDF files",
  description = "or drag and drop them here"
}: FileUploadProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setSelectedFiles(acceptedFiles);
    onFilesSelected(acceptedFiles);
  }, [onFilesSelected]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
    maxFiles,
  });

  const removeFile = (index: number) => {
    const newFiles = [...selectedFiles];
    newFiles.splice(index, 1);
    setSelectedFiles(newFiles);
    onFilesSelected(newFiles);
  };

  return (
    <div className="w-full">
      <div
        {...getRootProps()}
        className={cn(
          "relative border-2 border-dashed rounded-3xl p-12 transition-all cursor-pointer group flex flex-col items-center justify-center text-center",
          isDragActive 
            ? "border-indigo-500 bg-indigo-50/50 dark:bg-indigo-500/10" 
            : "border-zinc-200 dark:border-zinc-800 hover:border-indigo-400 dark:hover:border-zinc-700 bg-white dark:bg-zinc-900",
          loading && "pointer-events-none opacity-50"
        )}
      >
        <input {...getInputProps()} />
        
        <div className="mb-6 p-4 rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 group-hover:scale-110 group-hover:bg-indigo-500 group-hover:text-white transition-all">
          {loading ? (
            <Loader2 className="h-10 w-10 animate-spin" />
          ) : (
            <Upload className="h-10 w-10" />
          )}
        </div>

        <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">{title}</h3>
        <p className="text-zinc-500 dark:text-zinc-400">{description}</p>
        
        {isDragActive && (
          <div className="absolute inset-0 bg-indigo-500/10 backdrop-blur-sm rounded-3xl flex items-center justify-center">
            <p className="text-indigo-600 dark:text-indigo-400 font-bold text-lg">Drop your files here</p>
          </div>
        )}
      </div>

      <AnimatePresence>
        {selectedFiles.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="mt-6 space-y-3"
          >
            {selectedFiles.map((file, index) => (
              <div 
                key={`${file.name}-${index}`}
                className="flex items-center justify-between p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl"
              >
                <div className="flex items-center gap-4">
                  <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400">
                    <File className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-zinc-900 dark:text-white truncate max-w-[200px] sm:max-w-[300px]">
                      {file.name}
                    </p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      {(file.size / (1024 * 1024)).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => removeFile(index)}
                  className="p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {(error || success) && (
        <motion.div 
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className={cn(
            "mt-4 p-4 rounded-xl flex items-center gap-3",
            error ? "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400" : "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400"
          )}
        >
          {error ? <AlertCircle className="h-5 w-5" /> : <CheckCircle2 className="h-5 w-5" />}
          <p className="text-sm font-medium">{error || "Process completed successfully!"}</p>
        </motion.div>
      )}
    </div>
  );
}
