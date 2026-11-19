import React, { useState } from 'react';
import {
  Pause,
  Play,
  Repeat,
  RotateCcw,
  Trash2,
} from 'lucide-react';
import {
  ANIMATABLE_PROP_META,
  AnimatableProp,
  AnimationProject,
  EasingType,
  Keyframe,
  Layer,
} from '../types/animation';
import { getFrameIndex } from '../engine/interpolation';

interface TimelineProps {
  project: AnimationProject;
  selectedLayer: Layer | undefined;
  currentTime: number;
  isPlaying: boolean;
  autoKeyframe: boolean;
  onTogglePlay: () => void;
  onStop: () => void;
  onSeek: (time: number) => void;
  onToggleLoop: () => void;
  onToggleAutoKeyframe: () => void;
  onUpdateKeyframeEasing: (
    layerId: string,
    prop: AnimatableProp,
    kfId: string,
    easing: EasingType
  ) => void;
  onDeleteKeyframe: (
    layerId: string,
    prop: AnimatableProp,
    kfId: string
  ) => void;
}

const EASINGS: EasingType[] = [
  'linear',
  'easeIn',
  'easeOut',
  'easeInOut',
  'spring',
  'bounce',
];

export const Timeline: React.FC<TimelineProps> = ({
  project,
  selectedLayer,
  currentTime,
  isPlaying,
  autoKeyframe,
  onTogglePlay,
  onStop,
  onSeek,
  onToggleLoop,
  onToggleAutoKeyframe,
  onUpdateKeyframeEasing,
  onDeleteKeyframe,
}) => {
  const [selectedKf, setSelectedKf] = useState<{
    layerId: string;
    prop: AnimatableProp;
    kf: Keyframe;
  } | null>(null);

  const totalFrames = Math.max(1, Math.round(project.duration * project.fps));
  const currentFrame = getFrameIndex(currentTime, project.fps, project.duration);

  const tracks = selectedLayer
    ? (Object.entries(selectedLayer.keyframes) as [
        AnimatableProp,
        Keyframe[] | undefined
      ][]).filter(([, kfs]) => kfs && kfs.length > 0)
    : [];

  return (
    <section className="timeline">
      <div className="timeline-controls">
        <div className="transport-left">
          <button
            type="button"
            className="btn-play"
            onClick={onTogglePlay}
            aria-label={isPlaying ? 'Pause animation' : 'Play animation'}
          >
            {isPlaying ? <Pause size={15} /> : <Play size={15} />}
            <span>{isPlaying ? 'Pause' : 'Play'}</span>
          </button>
          <button
            type="button"
            className="icon-btn"
            onClick={onStop}
            title="Reset to 0s"
            aria-label="Reset to start"
          >
            <RotateCcw size={15} />
          </button>
          <button
            type="button"
            className={`chip-btn ${project.loop ? 'active' : ''}`}
            onClick={onToggleLoop}
            title="Toggle Loop"
          >
            <Repeat size={13} />
            <span>Loop</span>
          </button>
          <button
            type="button"
            className={`chip-btn ${autoKeyframe ? 'active-warn' : ''}`}
            onClick={onToggleAutoKeyframe}
            title="Automatically record keyframes when moving or editing properties"
          >
            <span>Auto-Key</span>
          </button>
        </div>

        <div className="transport-center">
          <input
            type="range"
            className="scrubber-range"
            min={0}
            max={project.duration}
            step={1 / project.fps}
            value={currentTime}
            onChange={(e) => onSeek(Number(e.target.value))}
            aria-label="Timeline scrubber"
          />
        </div>

        <div className="transport-right">
          <span className="timecode">
            {currentTime.toFixed(2)}s / {project.duration.toFixed(2)}s
          </span>
          <span className="framecode">
            F {currentFrame + 1}/{totalFrames}
          </span>
        </div>
      </div>

      {selectedKf && (
        <div className="kf-bar">
          <span>
            Keyframe <strong>{selectedKf.prop}</strong> @{' '}
            {selectedKf.kf.time.toFixed(2)}s (val:{' '}
            {selectedKf.kf.value.toFixed(2)})
          </span>
          <label className="easing-picker">
            Easing:
            <select
              value={selectedKf.kf.easing}
              onChange={(e) => {
                const nextEasing = e.target.value as EasingType;
                onUpdateKeyframeEasing(
                  selectedKf.layerId,
                  selectedKf.prop,
                  selectedKf.kf.id,
                  nextEasing
                );
                setSelectedKf({
                  ...selectedKf,
                  kf: { ...selectedKf.kf, easing: nextEasing },
                });
              }}
            >
              {EASINGS.map((es) => (
                <option key={es} value={es}>
                  {es}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            className="chip-btn danger"
            onClick={() => {
              onDeleteKeyframe(
                selectedKf.layerId,
                selectedKf.prop,
                selectedKf.kf.id
              );
              setSelectedKf(null);
            }}
          >
            <Trash2 size={12} />
            <span>Delete Keyframe</span>
          </button>
        </div>
      )}

      <div className="timeline-tracks">
        {!selectedLayer && (
          <div className="timeline-empty">
            Select a layer to view or add keyframes, or scrub the timeline above.
          </div>
        )}

        {selectedLayer?.type === 'framebyframe' && (
          <div className="cel-strip">
            <div className="cel-strip-label">
              Cel Frames ({project.fps} fps)
            </div>
            <div className="cel-cells">
              {Array.from({ length: Math.min(totalFrames, 60) }).map((_, idx) => {
                const cel = selectedLayer.cels?.find(
                  (c) => c.frameIndex === idx
                );
                const hasContent = Boolean(cel && cel.strokes.length > 0);
                const isCurrent = idx === currentFrame;
                return (
                  <button
                    key={idx}
                    type="button"
                    className={`cel-cell ${hasContent ? 'filled' : ''} ${
                      isCurrent ? 'current' : ''
                    }`}
                    onClick={() => onSeek(idx / project.fps)}
                    title={`Frame ${idx + 1}`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {selectedLayer &&
          tracks.map(([prop, kfs]) => {
            const label =
              ANIMATABLE_PROP_META.find((m) => m.key === prop)?.label ?? prop;
            return (
              <div className="track-row" key={prop}>
                <div className="track-label">{label}</div>
                <div className="track-lane">
                  <div
                    className="playhead-line"
                    style={{
                      left: `${(currentTime / project.duration) * 100}%`,
                    }}
                  />
                  {kfs?.map((kf) => {
                    const leftPct = (kf.time / project.duration) * 100;
                    const isActive = selectedKf?.kf.id === kf.id;
                    return (
                      <button
                        key={kf.id}
                        type="button"
                        className={`kf-diamond ${isActive ? 'selected' : ''}`}
                        style={{ left: `${leftPct}%` }}
                        onClick={() => {
                          onSeek(kf.time);
                          setSelectedKf({
                            layerId: selectedLayer.id,
                            prop,
                            kf,
                          });
                        }}
                        title={`${label}: ${kf.value} @ ${kf.time.toFixed(2)}s (${kf.easing})`}
                        aria-label={`Keyframe ${label} at ${kf.time.toFixed(2)} seconds`}
                      />
                    );
                  })}
                </div>
              </div>
            );
          })}
      </div>
    </section>
  );
};
