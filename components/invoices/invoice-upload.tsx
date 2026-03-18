"use client";

import React, { useState, useTransition } from 'react';
import { useDropzone } from 'react-dropzone';
import { processInvoiceDocument } from '@/app/actions/invoices';
import { UploadCloud, FileType, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function InvoiceUploadZone() {
  const [isPending, startTransition] = useTransition();
  const [uploadStatus, setUploadStatus] = useState<"idle" | "uploading" | "success" | "error">("idle");

  const onDrop = (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    const file = acceptedFiles[0];
    
    // We only process one file at a time for simplicity and stability
    const formData = new FormData();
    formData.append('file', file);

    setUploadStatus("uploading");
    
    startTransition(async () => {
      try {
        const result = await processInvoiceDocument(null, formData);
        if (result.success) {
          setUploadStatus("success");
          toast.success(result.message || "Facture traitée avec succès");
        } else {
          setUploadStatus("error");
          toast.error(result.message || "Une erreur est survenue");
        }
      } catch (err) {
        setUploadStatus("error");
        toast.error("Erreur inattendue");
      }
    });
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png']
    },
    maxFiles: 1,
    disabled: isPending
  });

  return (
    <div className="w-full">
      <div 
        {...getRootProps()} 
        className={`relative flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-xl transition-all duration-200 ease-in-out cursor-pointer overflow-hidden
          ${isDragActive ? 'border-primary bg-primary/10 scale-105' : 'border-gray-300 hover:border-primary/50 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800'}
          ${isPending ? 'opacity-70 cursor-not-allowed' : ''}
        `}
      >
        <input {...getInputProps()} />
        
        {isPending ? (
          <div className="flex flex-col items-center space-y-4">
            <Loader2 className="w-12 h-12 text-primary animate-spin" />
            <p className="text-sm font-medium text-gray-600 dark:text-gray-300 animate-pulse">
              Analyse par l'IA en cours...
            </p>
          </div>
        ) : uploadStatus === "success" ? (
          <div className="flex flex-col items-center space-y-4 text-green-600">
            <CheckCircle className="w-12 h-12" />
            <p className="text-sm font-medium">Facture téléversée et découpée !</p>
            <p className="text-xs text-gray-500">Glissez-en une autre pour continuer</p>
          </div>
        ) : uploadStatus === "error" ? (
          <div className="flex flex-col items-center space-y-4 text-red-600">
            <AlertCircle className="w-12 h-12" />
            <p className="text-sm font-medium">Échec du traitement</p>
            <p className="text-xs text-gray-500">Cliquez ou glissez pour réessayer</p>
          </div>
        ) : (
          <div className="flex flex-col items-center space-y-4 text-gray-500">
            <div className="p-4 bg-primary/10 rounded-full">
              <UploadCloud className="w-8 h-8 text-primary" />
            </div>
            <div className="text-center">
              <p className="text-base font-semibold text-gray-700 dark:text-gray-200">
                Cliquez ou glissez-déposez un lot de factures (PDF)
              </p>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                L'IA se charge de découper, lire et classer automatiquement.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
