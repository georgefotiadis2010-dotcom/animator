import React, { useRef, useState } from 'react';
import { Eraser, Grid, Layers } from 'lucide-react';
import {
  AnimationProject,
  CelStroke,
  Layer,
} from '../types/animation';
import {
  evaluateLayerAtTime,
  getCelForFrame,
  getFrameIndex,
  uid,
} from '../engine/interpolation';

interface StageProps {
  project: AnimationProject;
  currentTime: number;
  selectedLayerId: string | null;
  onSelectLayer: (id: string | null) => void;
  onMoveLayer: (id: string, x: number, y: number) => void;
  onAddCelStroke: (layerId: string, frameIndex: number, stroke: CelStroke) => void;
  onClearCelFrame: (layerId: string, frameIndex: number) => void;
}

export const Stage: React.FC<StageProps> = ({
  project,
  currentTime,
  selectedLayerId,
  onSelectLayer,
  onMoveLayer,
  onAddCelStroke,
  onClearCelFrame,
}) => {
  const stageRef = useRef<HTMLDivElement>(null);
  const [showGrid, setShowGrid] = useState(true);
  const [onionSkin, setOnionSkin] = useState(true);
  const [brushColor, setBrushColor] = useState('#facc15');
  const [brushSize, setBrushSize] = useState(5);
  const [activeStroke, setActiveStroke] = useState<CelStroke | null>(null);
  const [dragInfo, setDragInfo] = useState<{
    layerId: string;
    startX: number;
    startY: number;
    origX: number;
    origY: number;
  } | null>(null);

  const selectedLayer = project.layers.find((l) => l.id === selectedLayerId);
  const isDrawingMode = selectedLayer?.type === 'framebyframe' && !selectedLayer.locked;
  const currentFrame = getFrameIndex(currentTime, project.fps, project.duration);

  const getLocalCoords = (e: React.PointerEvent) => {
    const rect = stageRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return {
      x: Math.round(e.clientX - rect.left),
      y: Math.round(e.clientY - rect.top),
    };
  };

  const handleStagePointerDown = (e: React.PointerEvent) => {
    if (isDrawingMode && selectedLayer) {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      const pt = getLocalCoords(e);
      setActiveStroke({
        id: uid('stroke'),
        color: brushColor,
        size: brushSize,
        points: [pt],
      });
      return;
    }
    if (e.target === stageRef.current) {
      onSelectLayer(null);
    }
  };

  const handleStagePointerMove = (e: React.PointerEvent) => {
    if (activeStroke && isDrawingMode) {
      const pt = getLocalCoords(e);
      setActiveStroke((prev) =>
        prev ? { ...prev, points: [...prev.points, pt] } : null
      );
      return;
    }
    if (dragInfo) {
      const dx = e.clientX - dragInfo.startX;
      const dy = e.clientY - dragInfo.startY;
      onMoveLayer(
        dragInfo.layerId,
        Math.round(dragInfo.origX + dx),
        Math.round(dragInfo.origY + dy)
      );
    }
  };

  const handleStagePointerUp = () => {
    if (activeStroke && selectedLayer && activeStroke.points.length > 0) {
      const finalized =
        activeStroke.points.length === 1
          ? {
              ...activeStroke,
              points: [
                activeStroke.points[0],
                {
                  x: activeStroke.points[0].x + 0.5,
                  y: activeStroke.points[0].y + 0.5,
                },
              ],
            }
          : activeStroke;
      onAddCelStroke(selectedLayer.id, currentFrame, finalized);
      setActiveStroke(null);
    }
    if (dragInfo) {
      setDragInfo(null);
    }
  };

  const renderLayer = (layer: Layer) => {
    if (!layer.visible) return null;
    const v = evaluateLayerAtTime(layer, currentTime);
    const isSelected = layer.id === selectedLayerId;

    if (layer.type === 'framebyframe') {
      const cel = getCelForFrame(layer, currentFrame);
      const prevCel = onionSkin ? getCelForFrame(layer, currentFrame - 1) : undefined;
      const nextCel = onionSkin ? getCelForFrame(layer, currentFrame + 1) : undefined;

      return (
        <svg
          key={layer.id}
          width={project.width}
          height={project.height}
          style={{
            position: 'absolute',
            inset: 0,
            opacity: v.opacity,
            pointerEvents: 'none',
          }}
        >
          {prevCel?.strokes.map((st) => (
            <polyline
              key={`prev_${st.id}`}
              fill="none"
              stroke="#ef4444"
              strokeOpacity={0.25}
              strokeWidth={st.size}
              strokeLinecap="round"
              strokeLinejoin="round"
              points={st.points.map((p) => `${p.x},${p.y}`).join(' ')}
            />
          ))}
          {nextCel?.strokes.map((st) => (
            <polyline
              key={`next_${st.id}`}
              fill="none"
              stroke="#3b82f6"
              strokeOpacity={0.25}
              strokeWidth={st.size}
              strokeLinecap="round"
              strokeLinejoin="round"
              points={st.points.map((p) => `${p.x},${p.y}`).join(' ')}
            />
          ))}
          {cel?.strokes.map((st) => (
            <polyline
              key={st.id}
              fill="none"
              stroke={st.color}
              strokeWidth={st.size}
              strokeLinecap="round"
              strokeLinejoin="round"
              points={st.points.map((p) => `${p.x},${p.y}`).join(' ')}
            />
          ))}
          {isSelected && activeStroke && (
            <polyline
              fill="none"
              stroke={activeStroke.color}
              strokeWidth={activeStroke.size}
              strokeLinecap="round"
              strokeLinejoin="round"
              points={activeStroke.points.map((p) => `${p.x},${p.y}`).join(' ')}
            />
          )}
        </svg>
      );
    }

    const transform = `translate3d(${v.x - v.width / 2}px, ${
      v.y - v.height / 2
    }px, ${v.z}px) rotateX(${v.rotateX}deg) rotateY(${v.rotateY}deg) rotate(${
      v.rotate
    }deg) scale(${v.scaleX}, ${v.scaleY})`;

    const commonStyle: React.CSSProperties = {
      position: 'absolute',
      width: v.width,
      height: v.height,
      opacity: v.opacity,
      transform,
      cursor: layer.locked ? 'default' : 'grab',
      outline: isSelected ? '2px solid #6366f1' : 'none',
      outlineOffset: 3,
      userSelect: 'none',
    };

    const onLayerPointerDown = (e: React.PointerEvent) => {
      if (isDrawingMode) return;
      e.stopPropagation();
      onSelectLayer(layer.id);
      if (layer.locked) return;
      setDragInfo({
        layerId: layer.id,
        startX: e.clientX,
        startY: e.clientY,
        origX: v.x,
        origY: v.y,
      });
    };

    if (layer.type === 'star') {
      return (
        <svg
          key={layer.id}
          viewBox="0 0 100 100"
          onPointerDown={onLayerPointerDown}
          style={{
            ...commonStyle,
            filter:
              layer.shadowBlur > 0
                ? `drop-shadow(0 0 ${layer.shadowBlur / 2}px ${layer.shadowColor})`
                : undefined,
          }}
        >
          <polygon
            points="50,5 63,36 96,38 70,59 79,92 50,73 21,92 30,59 4,38 37,36"
            fill={layer.fill}
            stroke={layer.stroke}
            strokeWidth={layer.strokeWidth * 2}
          />
        </svg>
      );
    }

    if (layer.type === 'text') {
      return (
        <div
          key={layer.id}
          onPointerDown={onLayerPointerDown}
          style={{
            ...commonStyle,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: layer.fill,
            fontSize: layer.fontSize ?? 18,
            fontWeight: 700,
            whiteSpace: 'nowrap',
          }}
        >
          {layer.text ?? 'Text'}
        </div>
      );
    }

    return (
      <div
        key={layer.id}
        onPointerDown={onLayerPointerDown}
        style={{
          ...commonStyle,
          background: layer.fill,
          border:
            layer.strokeWidth > 0
              ? `${layer.strokeWidth}px solid ${layer.stroke}`
              : undefined,
          borderRadius: layer.type === 'circle' ? '9999px' : v.borderRadius,
          boxShadow:
            layer.shadowBlur > 0
              ? `0 8px ${layer.shadowBlur}px ${layer.shadowColor}`
              : undefined,
        }}
      />
    );
  };

  return (
    <main className="stage-workspace">
      <div className="stage-toolbar">
        <button
          type="button"
          className={`chip-btn ${showGrid ? 'active' : ''}`}
          onClick={() => setShowGrid((g) => !g)}
        >
          <Grid size={13} />
          <span>Grid</span>
        </button>

        {isDrawingMode && (
          <div className="draw-tools">
            <span className="draw-badge">Draw Mode (Frame {currentFrame})</span>
            <input
              type="color"
              value={brushColor}
              onChange={(e) => setBrushColor(e.target.value)}
              aria-label="Brush color"
            />
            <label className="size-label">
              Size
              <input
                type="range"
                min={1}
                max={24}
                value={brushSize}
                onChange={(e) => setBrushSize(Number(e.target.value))}
              />
            </label>
            <button
              type="button"
              className={`chip-btn ${onionSkin ? 'active' : ''}`}
              onClick={() => setOnionSkin((o) => !o)}
              title="Toggle Onion Skinning"
            >
              <Layers size={13} />
              <span>Onion</span>
            </button>
            <button
              type="button"
              className="chip-btn danger"
              onClick={() =>
                selectedLayer && onClearCelFrame(selectedLayer.id, currentFrame)
              }
              title="Clear strokes on current frame"
            >
              <Eraser size={13} />
              <span>Clear Frame</span>
            </button>
          </div>
        )}
      </div>

      <div className="stage-scroll">
        <div
          ref={stageRef}
          className={`stage-artboard ${
            project.background === 'transparent' ? 'checkerboard' : ''
          } ${isDrawingMode ? 'drawing-cursor' : ''}`}
          style={{
            width: project.width,
            height: project.height,
            backgroundColor:
              project.background === 'transparent'
                ? undefined
                : project.background,
            perspective: project.perspective,
          }}
          onPointerDown={handleStagePointerDown}
          onPointerMove={handleStagePointerMove}
          onPointerUp={handleStagePointerUp}
        >
          {showGrid && <div className="stage-grid" />}
          {project.layers.map(renderLayer)}
        </div>
      </div>

      <div className="stage-footer">
        <span>
          {project.width} × {project.height}px • {project.fps} fps •{' '}
          {project.duration.toFixed(2)}s
        </span>
        {selectedLayer && (
          <span className="selected-pill">
            Selected: <strong>{selectedLayer.name}</strong>
          </span>
        )}
      </div>
    </main>
  );
};
