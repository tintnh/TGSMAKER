'use client'

import type React from "react"
import { useCallback } from "react"
import { Upload, FileIcon } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ImageUploaderProps {
  onImagesAdded: (files: File[]) => void
}

export function ImageUploader({ onImagesAdded }: ImageUploaderProps) {
  const handleFileChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(event.target.files || []);
      if (files.length > 0) {
        onImagesAdded(files); // send all files (no filter)
      }
    },
    [onImagesAdded],
  );

  const handleDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      const files = Array.from(event.dataTransfer.files);
      if (files.length > 0) {
        onImagesAdded(files); // send all files (no filter)
      }
    },
    [onImagesAdded],
  );

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
  }, []);

  return (
    <div
      className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors"
      onDrop={handleDrop}
      onDragOver={handleDragOver}
    >
      <FileIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
      <p className="text-sm text-gray-600 mb-4">
        Drag and drop <strong>any file</strong> here, or click to select
      </p>
      <input
        type="file"
        multiple
        onChange={handleFileChange}
        className="hidden"
        id="file-upload"
      />
      <Button asChild variant="outline">
        <label htmlFor="file-upload" className="cursor-pointer">
          <Upload className="w-4 h-4 mr-2" />
          Upload Files
        </label>
      </Button>
    </div>
  )
}
