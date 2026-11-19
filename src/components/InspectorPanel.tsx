import React from 'react';
import { Diamond } from 'lucide-react';
import {
  ANIMATABLE_PROP_META,
  AnimatableProp,
  AnimationProject,
  Layer,
} from '../types/animation';
import { evaluateLayerAtTime } from '../engine/interpolation';

interface InspectorPanelProps {
  project: AnimationProject;
  selectedLayer: Layer | undefined;
  currentTime: number;
  onUpdateProject: (patch: Partial<AnimationProject>) => void;
  onUpdateLayer: (id: string, patch: Partial<Layer>) => void;
  onSetLayerProp: (id: string, prop: AnimatableProp, value: number) => void;
  onToggleKeyframe: (id: string, prop: AnimatableProp) => void;
}

export const InspectorPanel: React.FC<InspectorPanelProps> = ({
  project,
  selectedLayer,
  currentTime,
  onUpdateProject,
  onUpdateLayer,
  onSetLayerProp,
  onToggleKeyframe,
}) => {
  if (!selectedLayer) {
    return (
      <aside className="panel panel-right">
        <div className="panel-header">
          <span>Canvas Settings</span>
        </div>
        <div className="inspector-body">
          <div className="prop-group">
            <label className="prop-row">
              <span>Width (px)</span>
              <input
                type="number"
                value={project.width}
                min={120}
                max={1920}
                onChange={(e) =>
                  onUpdateProject({ width: Math.max(120, Number(e.target.value)) })
                }
              />
            </label>
            <label className="prop-row">
              <span>Height (px)</span>
              <input
                type="number"
                value={project.height}
                min={120}
                max={1080}
                onChange={(e) =>
                  onUpdateProject({ height: Math.max(120, Number(e.target.value)) })
                }
              />
            </label>
            <label className="prop-row">
              <span>Duration (s)</span>
              <input
                type="number"
                step={0.1}
                min={0.2}
                max={30}
                value={project.duration}
                onChange={(e) =>
                  onUpdateProject({
                    duration: Math.max(0.2, Number(e.target.value)),
                  })
                }
              />
            </label>
            <label className="prop-row">
              <span>FPS</span>
              <input
                type="number"
                min={6}
                max={120}
                value={project.fps}
                onChange={(e) =>
                  onUpdateProject({ fps: Math.max(6, Number(e.target.value)) })
                }
              />
            </label>
            <label className="prop-row">
              <span>3D Perspective</span>
              <input
                type="number"
                step={50}
                min={200}
                max={3000}
                value={project.perspective}
                onChange={(e) =>
                  onUpdateProject({
                    perspective: Math.max(200, Number(e.target.value)),
                  })
                }
              />
            </label>
            <label className="prop-row">
              <span>Background</span>
              <div className="bg-controls">
                <input
                  type="color"
                  value={
                    project.background === 'transparent'
                      ? '#0f172a'
                      : project.background
                  }
                  onChange={(e) =>
                    onUpdateProject({ background: e.target.value })
                  }
                />
                <button
                  type="button"
                  className="chip-btn"
                  onClick={() => onUpdateProject({ background: 'transparent' })}
                >
                  Transparent
                </button>
              </div>
            </label>
          </div>
          <p className="empty-hint">
            Select a layer on the canvas or in the Layers panel to edit its style, 3D transforms, and keyframes.
          </p>
        </div>
      </aside>
    );
  }

  const evaluated = evaluateLayerAtTime(selectedLayer, currentTime);

  return (
    <aside className="panel panel-right">
      <div className="panel-header">
        <span>Inspector</span>
        <span className="badge">{selectedLayer.type}</span>
      </div>
      <div className="inspector-body">
        <div className="prop-group">
          <label className="prop-row">
            <span>Name</span>
            <input
              type="text"
              value={selectedLayer.name}
              onChange={(e) =>
                onUpdateLayer(selectedLayer.id, { name: e.target.value })
              }
            />
          </label>

          {selectedLayer.type === 'text' && (
            <>
              <label className="prop-row">
                <span>Text</span>
                <input
                  type="text"
                  value={selectedLayer.text ?? ''}
                  onChange={(e) =>
                    onUpdateLayer(selectedLayer.id, { text: e.target.value })
                  }
                />
              </label>
              <label className="prop-row">
                <span>Font Size</span>
                <input
                  type="number"
                  min={8}
                  max={140}
                  value={selectedLayer.fontSize ?? 18}
                  onChange={(e) =>
                    onUpdateLayer(selectedLayer.id, {
                      fontSize: Number(e.target.value),
                    })
                  }
                />
              </label>
            </>
          )}

          {selectedLayer.type !== 'framebyframe' && (
            <>
              <label className="prop-row">
                <span>Fill</span>
                <input
                  type="color"
                  value={
                    selectedLayer.fill.startsWith('#')
                      ? selectedLayer.fill
                      : '#6366f1'
                  }
                  onChange={(e) =>
                    onUpdateLayer(selectedLayer.id, { fill: e.target.value })
                  }
                />
              </label>
              <label className="prop-row">
                <span>Stroke</span>
                <div className="bg-controls">
                  <input
                    type="color"
                    value={
                      selectedLayer.stroke.startsWith('#')
                        ? selectedLayer.stroke
                        : '#ffffff'
                    }
                    onChange={(e) =>
                      onUpdateLayer(selectedLayer.id, { stroke: e.target.value })
                    }
                  />
                  <input
                    type="number"
                    min={0}
                    max={24}
                    style={{ width: 52 }}
                    value={selectedLayer.strokeWidth}
                    onChange={(e) =>
                      onUpdateLayer(selectedLayer.id, {
                        strokeWidth: Number(e.target.value),
                      })
                    }
                  />
                </div>
              </label>
              <label className="prop-row">
                <span>Shadow Blur</span>
                <input
                  type="number"
                  min={0}
                  max={80}
                  value={selectedLayer.shadowBlur}
                  onChange={(e) =>
                    onUpdateLayer(selectedLayer.id, {
                      shadowBlur: Number(e.target.value),
                    })
                  }
                />
              </label>
            </>
          )}
        </div>

        <div className="prop-section-title">
          Transform &amp; Keyframes ({currentTime.toFixed(2)}s)
        </div>
        <div className="prop-group">
          {ANIMATABLE_PROP_META.map((meta) => {
            const kfs = selectedLayer.keyframes[meta.key] ?? [];
            const hasKfAtTime = kfs.some(
              (k) => Math.abs(k.time - currentTime) < 0.03
            );
            const hasAnyKf = kfs.length > 0;
            const val = Number(evaluated[meta.key].toFixed(2));

            return (
              <div className="prop-row" key={meta.key}>
                <span>{meta.label}</span>
                <div className="prop-input-kf">
                  <input
                    type="number"
                    step={meta.step}
                    min={meta.min}
                    max={meta.max}
                    value={val}
                    onChange={(e) =>
                      onSetLayerProp(
                        selectedLayer.id,
                        meta.key,
                        Number(e.target.value)
                      )
                    }
                  />
                  <button
                    type="button"
                    className={`kf-btn ${hasKfAtTime ? 'active' : ''} ${
                      hasAnyKf && !hasKfAtTime ? 'has-track' : ''
                    }`}
                    onClick={() => onToggleKeyframe(selectedLayer.id, meta.key)}
                    title={
                      hasKfAtTime
                        ? `Remove ${meta.label} keyframe at ${currentTime.toFixed(2)}s`
                        : `Add ${meta.label} keyframe at ${currentTime.toFixed(2)}s`
                    }
                    aria-label={`Toggle keyframe for ${meta.label}`}
                  >
                    <Diamond size={12} fill={hasKfAtTime ? 'currentColor' : 'none'} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </aside>
  );
};
