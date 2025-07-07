"use client";

import { useState, useRef, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";

type SvgLayer = {
  id: string;
  content: string;
};

export default function HomePage() {
  const [layers, setLayers] = useState<SvgLayer[]>([]);
  const [error, setError] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== "image/svg+xml") {
      setError("Please upload a valid SVG file.");
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      const text = reader.result as string;
      const newLayer: SvgLayer = {
        id: uuidv4(),
        content: text,
      };
      setLayers([newLayer]); // For now, only keep one layer
      setError(null);
    };

    reader.onerror = () => {
      setError("Error reading file.");
    };

    reader.readAsText(file);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || layers.length === 0) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const layer = layers[0]; // Only show the first one for now

    const svgBlob = new Blob([layer.content], {
      type: "image/svg+xml;charset=utf-8",
    });
    const url = URL.createObjectURL(svgBlob);

    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);
    };
    img.onerror = () => {
      setError("Failed to load SVG onto canvas.");
    };
    img.src = url;
  }, [layers]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <h1 className="text-2xl font-bold mb-4">Upload SVG to Preview</h1>

      <input
        type="file"
        accept=".svg"
        onChange={handleFileUpload}
        className="mb-4"
      />

      {error && <p className="text-red-500">{error}</p>}

      <canvas
        ref={canvasRef}
        style={{
          border: "1px solid #ccc",
          maxWidth: "100%",
          background: "#f5f5f5",
        }}
      />
    </main>
  );
}
