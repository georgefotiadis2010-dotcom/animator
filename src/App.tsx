import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  AnimatableProp,
  AnimationProject,
  CelStroke,
  DEFAULT_LAYER_BASE,
  EasingType,
  Layer,
  LayerType,
} from './types/animation';
import { PRESET_PROJECTS } from './engine/presets';
import { uid } from './engine/interpolation';
import { TopBar } from './components/TopBar';
import { LayerPanel } from './components/LayerPanel';
import { Stage } from './components/Stage';
import { InspectorPanel } from './components/InspectorPanel';
import { Timeline } from './components/Timeline';
import { ExportModal } from './components/ExportModal';
import { VibeGallery } from './components/VibeGallery';

const STORAGE_KEY = 'animator_studio_project_v1';

function loadInitialProject(): AnimationProject {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as AnimationProject;
      if (parsed && Array.isArray(parsed.layers)) return parsed;
    }
  } catch {
    // ignore storage errors
  }
  return structuredClone(PRESET_PROJECTS[0]);
}

export const App: React.FC = () => {
  const [project, setProject] = useState<AnimationProject>(loadInitialProject);
  const [history, setHistory] = useState<AnimationProject[]>([]);
  const [future, setFuture] = useState<AnimationProject[]>([]);
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(
    () => project.layers[project.layers.length - 1]?.id ?? null
  );
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [autoKeyframe, setAutoKeyframe] = useState(true);
  const [exportOpen, setExportOpen] = useState(false);
  const [mode, setMode] = useState<'vibes' | 'studio'>('vibes');

  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(project));
    } catch {
      // ignore quota errors
    }
  }, [project]);

  const commitProject = useCallback(
    (updater: (prev: AnimationProject) => AnimationProject) => {
      setProject((prev) => {
        const next = updater(prev);
        setHistory((h) => [...h.slice(-29), prev]);
        setFuture([]);
        return next;
      });
    },
    []
  );

  const handleUndo = useCallback(() => {
    setHistory((h) => {
      if (h.length === 0) return h;
      const previous = h[h.length - 1];
      setProject((curr) => {
        setFuture((f) => [curr, ...f]);
        return previous;
      });
      return h.slice(0, -1);
    });
  }, []);

  const handleRedo = useCallback(() => {
    setFuture((f) => {
      if (f.length === 0) return f;
      const next = f[0];
      setProject((curr) => {
        setHistory((h) => [...h, curr]);
        return next;
      });
      return f.slice(1);
    });
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) handleRedo();
        else handleUndo();
      } else if (
        e.code === 'Space' &&
        !['INPUT', 'TEXTAREA', 'SELECT'].includes(
          (e.target as HTMLElement)?.tagName ?? ''
        )
      ) {
        e.preventDefault();
        setIsPlaying((p) => !p);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleUndo, handleRedo]);

  useEffect(() => {
    if (!isPlaying) return;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      setCurrentTime((prev) => {
        const next = prev + dt;
        if (next >= project.duration) {
          if (project.loop) return next % project.duration;
          setIsPlaying(false);
          return project.duration;
        }
        return next;
      });
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [isPlaying, project.duration, project.loop]);

  const handleSelectPreset = (presetId: string) => {
    const preset = PRESET_PROJECTS.find((p) => p.id === presetId);
    if (!preset) return;
    const clone = structuredClone(preset);
    commitProject(() => clone);
    setSelectedLayerId(clone.layers[clone.layers.length - 1]?.id ?? null);
    setCurrentTime(0);
    setIsPlaying(true);
  };

  const handleAddLayer = (type: LayerType) => {
    const newLayer: Layer = {
      id: uid('layer'),
      name:
        type === 'framebyframe'
          ? `Cel Drawing ${project.layers.length + 1}`
          : `${type.charAt(0).toUpperCase() + type.slice(1)} ${
              project.layers.length + 1
            }`,
      type,
      visible: true,
      locked: false,
      fill:
        type === 'text'
          ? '#f8fafc'
          : type === 'star'
          ? '#f59e0b'
          : '#6366f1',
      stroke: type === 'text' ? 'transparent' : '#a5b4fc',
      strokeWidth: type === 'text' ? 0 : 2,
      text: type === 'text' ? 'Hello Motion' : undefined,
      fontSize: type === 'text' ? 24 : undefined,
      shadowBlur: 12,
      shadowColor: 'rgba(99, 102, 241, 0.35)',
      base: {
        ...DEFAULT_LAYER_BASE,
        x: Math.round(project.width / 2),
        y: Math.round(project.height / 2),
        width: type === 'framebyframe' ? project.width : type === 'text' ? 180 : 96,
        height: type === 'framebyframe' ? project.height : type === 'text' ? 40 : 96,
      },
      keyframes: {},
      cels: type === 'framebyframe' ? [] : undefined,
    };

    commitProject((prev) => ({
      ...prev,
      layers: [...prev.layers, newLayer],
    }));
    setSelectedLayerId(newLayer.id);
    if (type === 'framebyframe') setIsPlaying(false);
  };

  const handleSetLayerProp = (
    layerId: string,
    prop: AnimatableProp,
    value: number
  ) => {
    commitProject((prev) => ({
      ...prev,
      layers: prev.layers.map((l) => {
        if (l.id !== layerId) return l;
        const existingKfs = l.keyframes[prop] ?? [];
        const shouldKeyframe = autoKeyframe || existingKfs.length > 0;
        if (!shouldKeyframe) {
          return { ...l, base: { ...l.base, [prop]: value } };
        }
        const matchIdx = existingKfs.findIndex(
          (k) => Math.abs(k.time - currentTime) < 0.03
        );
        const nextKfs = [...existingKfs];
        if (matchIdx >= 0) {
          nextKfs[matchIdx] = { ...nextKfs[matchIdx], value };
        } else {
          nextKfs.push({
            id: uid('kf'),
            time: Number(currentTime.toFixed(3)),
            value,
            easing: 'easeInOut',
          });
          nextKfs.sort((a, b) => a.time - b.time);
        }
        return {
          ...l,
          keyframes: { ...l.keyframes, [prop]: nextKfs },
        };
      }),
    }));
  };

  const handleMoveLayer = (layerId: string, x: number, y: number) => {
    setProject((prev) => ({
      ...prev,
      layers: prev.layers.map((l) => {
        if (l.id !== layerId) return l;
        const nextBase = { ...l.base, x, y };
        const nextKfs = { ...l.keyframes };
        (['x', 'y'] as const).forEach((prop) => {
          const val = prop === 'x' ? x : y;
          const kfs = nextKfs[prop] ?? [];
          if (autoKeyframe || kfs.length > 0) {
            const idx = kfs.findIndex(
              (k) => Math.abs(k.time - currentTime) < 0.03
            );
            const updated = [...kfs];
            if (idx >= 0) {
              updated[idx] = { ...updated[idx], value: val };
            } else {
              updated.push({
                id: uid('kf'),
                time: Number(currentTime.toFixed(3)),
                value: val,
                easing: 'easeInOut',
              });
              updated.sort((a, b) => a.time - b.time);
            }
            nextKfs[prop] = updated;
          }
        });
        return { ...l, base: nextBase, keyframes: nextKfs };
      }),
    }));
  };

  const handleToggleKeyframe = (layerId: string, prop: AnimatableProp) => {
    commitProject((prev) => ({
      ...prev,
      layers: prev.layers.map((l) => {
        if (l.id !== layerId) return l;
        const kfs = l.keyframes[prop] ?? [];
        const existing = kfs.find((k) => Math.abs(k.time - currentTime) < 0.03);
        if (existing) {
          return {
            ...l,
            keyframes: {
              ...l.keyframes,
              [prop]: kfs.filter((k) => k.id !== existing.id),
            },
          };
        }
        const nextKfs = [
          ...kfs,
          {
            id: uid('kf'),
            time: Number(currentTime.toFixed(3)),
            value: l.base[prop],
            easing: 'easeInOut' as EasingType,
          },
        ].sort((a, b) => a.time - b.time);
        return {
          ...l,
          keyframes: { ...l.keyframes, [prop]: nextKfs },
        };
      }),
    }));
  };

  const handleAddCelStroke = (
    layerId: string,
    frameIndex: number,
    stroke: CelStroke
  ) => {
    commitProject((prev) => ({
      ...prev,
      layers: prev.layers.map((l) => {
        if (l.id !== layerId) return l;
        const cels = [...(l.cels ?? [])];
        const idx = cels.findIndex((c) => c.frameIndex === frameIndex);
        if (idx >= 0) {
          cels[idx] = {
            ...cels[idx],
            strokes: [...cels[idx].strokes, stroke],
          };
        } else {
          cels.push({ frameIndex, strokes: [stroke] });
        }
        return { ...l, cels };
      }),
    }));
  };

  const handleClearCelFrame = (layerId: string, frameIndex: number) => {
    commitProject((prev) => ({
      ...prev,
      layers: prev.layers.map((l) => {
        if (l.id !== layerId) return l;
        return {
          ...l,
          cels: (l.cels ?? []).filter((c) => c.frameIndex !== frameIndex),
        };
      }),
    }));
  };

  const selectedLayer = project.layers.find((l) => l.id === selectedLayerId);

  return (
    <div className={mode === 'vibes' ? 'vibe-shell' : 'studio-shell'}>
      <div className="mode-bar">
        <div className="mode-bar-brand">Animator</div>
        <div className="mode-switcher" role="tablist" aria-label="App mode">
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'vibes'}
            className={`mode-tab ${mode === 'vibes' ? 'active' : ''}`}
            onClick={() => setMode('vibes')}
          >
            Vibe Gallery
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'studio'}
            className={`mode-tab ${mode === 'studio' ? 'active' : ''}`}
            onClick={() => setMode('studio')}
          >
            Visual Studio
          </button>
        </div>
      </div>

      {mode === 'vibes' ? (
        <VibeGallery />
      ) : (
        <>
          <TopBar
            project={project}
            canUndo={history.length > 0}
            canRedo={future.length > 0}
            onRename={(name) => commitProject((p) => ({ ...p, name }))}
            onSelectPreset={handleSelectPreset}
            onUndo={handleUndo}
            onRedo={handleRedo}
            onImportProject={(imported) => {
              commitProject(() => imported);
              setSelectedLayerId(imported.layers[0]?.id ?? null);
              setCurrentTime(0);
            }}
            onOpenExport={() => setExportOpen(true)}
          />

          <div className="workspace-grid">
            <LayerPanel
              layers={project.layers}
              selectedLayerId={selectedLayerId}
              onSelectLayer={setSelectedLayerId}
              onAddLayer={handleAddLayer}
              onToggleVisible={(id) =>
                commitProject((p) => ({
                  ...p,
                  layers: p.layers.map((l) =>
                    l.id === id ? { ...l, visible: !l.visible } : l
                  ),
                }))
              }
              onToggleLock={(id) =>
                commitProject((p) => ({
                  ...p,
                  layers: p.layers.map((l) =>
                    l.id === id ? { ...l, locked: !l.locked } : l
                  ),
                }))
              }
              onDuplicateLayer={(id) => {
                const orig = project.layers.find((l) => l.id === id);
                if (!orig) return;
                const copy: Layer = {
                  ...structuredClone(orig),
                  id: uid('layer'),
                  name: `${orig.name} Copy`,
                };
                copy.base.x += 24;
                copy.base.y += 24;
                commitProject((p) => ({ ...p, layers: [...p.layers, copy] }));
                setSelectedLayerId(copy.id);
              }}
              onDeleteLayer={(id) => {
                commitProject((p) => ({
                  ...p,
                  layers: p.layers.filter((l) => l.id !== id),
                }));
                if (selectedLayerId === id) setSelectedLayerId(null);
              }}
            />

            <Stage
              project={project}
              currentTime={currentTime}
              selectedLayerId={selectedLayerId}
              onSelectLayer={setSelectedLayerId}
              onMoveLayer={handleMoveLayer}
              onAddCelStroke={handleAddCelStroke}
              onClearCelFrame={handleClearCelFrame}
            />

            <InspectorPanel
              project={project}
              selectedLayer={selectedLayer}
              currentTime={currentTime}
              onUpdateProject={(patch) =>
                commitProject((p) => ({ ...p, ...patch }))
              }
              onUpdateLayer={(id, patch) =>
                commitProject((p) => ({
                  ...p,
                  layers: p.layers.map((l) =>
                    l.id === id ? { ...l, ...patch } : l
                  ),
                }))
              }
              onSetLayerProp={handleSetLayerProp}
              onToggleKeyframe={handleToggleKeyframe}
            />
          </div>

          <Timeline
            project={project}
            selectedLayer={selectedLayer}
            currentTime={currentTime}
            isPlaying={isPlaying}
            autoKeyframe={autoKeyframe}
            onTogglePlay={() => setIsPlaying((p) => !p)}
            onStop={() => {
              setIsPlaying(false);
              setCurrentTime(0);
            }}
            onSeek={(t) => {
              setIsPlaying(false);
              setCurrentTime(Math.max(0, Math.min(project.duration, t)));
            }}
            onToggleLoop={() =>
              commitProject((p) => ({ ...p, loop: !p.loop }))
            }
            onToggleAutoKeyframe={() => setAutoKeyframe((a) => !a)}
            onUpdateKeyframeEasing={(layerId, prop, kfId, easing) =>
              commitProject((p) => ({
                ...p,
                layers: p.layers.map((l) => {
                  if (l.id !== layerId) return l;
                  return {
                    ...l,
                    keyframes: {
                      ...l.keyframes,
                      [prop]: (l.keyframes[prop] ?? []).map((k) =>
                        k.id === kfId ? { ...k, easing } : k
                      ),
                    },
                  };
                }),
              }))
            }
            onDeleteKeyframe={(layerId, prop, kfId) =>
              commitProject((p) => ({
                ...p,
                layers: p.layers.map((l) => {
                  if (l.id !== layerId) return l;
                  return {
                    ...l,
                    keyframes: {
                      ...l.keyframes,
                      [prop]: (l.keyframes[prop] ?? []).filter(
                        (k) => k.id !== kfId
                      ),
                    },
                  };
                }),
              }))
            }
          />

          <ExportModal
            open={exportOpen}
            project={project}
            currentTime={currentTime}
            onClose={() => setExportOpen(false)}
          />
        </>
      )}
    </div>
  );
};
