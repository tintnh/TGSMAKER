"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { v4 as uuidv4 } from "uuid";

type Keyframe = {
  time: number;
  x: number;
  y: number;
};

type SvgLayer = {
  id: string;
  name: string;
  img: HTMLImageElement;
  x: number;
  y: number;
  keyframes: Keyframe[];
};

export default function Page() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [layers, setLayers] = useState<SvgLayer[]>([]);
  const [draggedLayerId, setDraggedLayerId] = useState<string | null>(null);
  const [offset, setOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [playing, setPlaying] = useState(false);
  const animationRef = useRef<number | null>(null);
  const playStartTime = useRef<number | null>(null);

  // Upload SVG and add as layer
  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || file.type !== "image/svg+xml") return;

    const reader = new FileReader();
    reader.onload = () => {
      const svgText = reader.result as string;
      const blob = new Blob([svgText], { type: "image/svg+xml" });
      const url = URL.createObjectURL(blob);

      const img = new Image();
      img.onload = () => {
        const newLayer: SvgLayer = {
          id: uuidv4(),
          name: file.name,
          img,
          x: 50,
          y: 50,
          keyframes: [],
        };
        setLayers((prev) => [...prev, newLayer]);
        URL.revokeObjectURL(url);
      };
      img.src = url;
    };
    reader.readAsText(file);
  };

  // Redraw all layers
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (const layer of layers) {
      ctx.drawImage(layer.img, layer.x, layer.y);
    }
  }, [layers]);

  useEffect(() => {
    draw();
  }, [draw]);

  // Drag logic
  const handleMouseDown = (e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    for (const layer of [...layers].reverse()) {
      const { x, y, img } = layer;
      if (
        mouseX >= x &&
        mouseX <= x + img.width &&
        mouseY >= y &&
        mouseY <= y + img.height
      ) {
        setDraggedLayerId(layer.id);
        setOffset({ x: mouseX - x, y: mouseY - y });
        return;
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!draggedLayerId) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    setLayers((prev) =>
      prev.map((layer) =>
        layer.id === draggedLayerId
          ? {
              ...layer,
              x: mouseX - offset.x,
              y: mouseY - offset.y,
            }
          : layer
      )
    );
  };

  const handleMouseUp = () => {
    setDraggedLayerId(null);
  };

  // Keyframe logic
  const addKeyframe = (layerId: string) => {
    setLayers((prev) =>
      prev.map((layer) =>
        layer.id === layerId
          ? {
              ...layer,
              keyframes: [...layer.keyframes, {
                time: currentTime,
                x: layer.x,
                y: layer.y
              }],
            }
          : layer
      )
    );
  };

  // Play animation
  const play = () => {
    setPlaying(true);
    playStartTime.current = performance.now();
    animate();
  };

  const stop = () => {
    setPlaying(false);
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
  };

  const animate = () => {
    const now = performance.now();
    const elapsed = (now - (playStartTime.current || 0)) / 1000; // seconds
    setCurrentTime(elapsed);

    setLayers((prev) =>
      prev.map((layer) => {
        const before = [...layer.keyframes].filter(k => k.time <= elapsed).sort((a, b) => b.time - a.time)[0];
        const after = [...layer.keyframes].filter(k => k.time > elapsed).sort((a, b) => a.time - b.time)[0];

        if (!before || !after) return layer;

        const t = (elapsed - before.time) / (after.time - before.time);
        const x = before.x + (after.x - before.x) * t;
        const y = before.y + (after.y - before.y) * t;

        return { ...layer, x, y };
      })
    );

    draw();
    animationRef.current = requestAnimationFrame(animate);
  };

  return (
    <main className="p-6">
      <h1 className="text-2xl font-bold mb-4">SVG Timeline Animation Studio</h1>

      <input type="file" accept=".svg" onChange={handleUpload} className="mb-4" />

      <div className="border border-gray-300 mb-4 relative">
        <canvas
          ref={canvasRef}
          width={800}
          height={400}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          className="bg-white w-full"
        />
      </div>

      <div className="mb-4">
        <label className="mr-2">Time: {currentTime.toFixed(2)}s</label>
        <input
          type="range"
          min={0}
          max={10}
          step={0.1}
          value={currentTime}
          onChange={(e) => setCurrentTime(parseFloat(e.target.value))}
          className="w-full"
        />
      </div>

      <div className="space-y-4">
        {layers.map((layer) => (
          <div key={layer.id} className="flex items-center gap-4">
            <span className="w-32 truncate">{layer.name}</span>
            <button
              onClick={() => addKeyframe(layer.id)}
              className="bg-blue-500 text-white px-3 py-1 rounded"
            >
              + Keyframe @ {currentTime.toFixed(1)}s
            </button>
            <span>
              🎯 {layer.x}, {layer.y}
            </span>
            <span>
              ⏱️ {layer.keyframes.length} keyframes
            </span>
          </div>
        ))}
      </div>

      <div className="mt-6 flex gap-4">
        <button
          onClick={play}
          className="bg-green-600 text-white px-4 py-2 rounded"
        >
          ▶ Play
        </button>
        <button
          onClick={stop}
          className="bg-red-600 text-white px-4 py-2 rounded"
        >
          ⏹ Stop
        </button>
      </div>
    </main>
  );
}
