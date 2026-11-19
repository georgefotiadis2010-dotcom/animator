import React, { useEffect, useRef, useState } from 'react';
import {
  Check,
  Code2,
  Copy,
  Download,
  RotateCw,
  Sparkles,
  X,
} from 'lucide-react';
import {
  VIBE_ANIMATIONS,
  VibeAnimationEntry,
  buildAntigravityPrompt,
} from '../vibes/registry';

export const VibeGallery: React.FC = () => {
  const [filter, setFilter] = useState<string>('All');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [replayKeys, setReplayKeys] = useState<Record<string, number>>({});
  const [inspectEntry, setInspectEntry] = useState<VibeAnimationEntry | null>(
    null
  );
  const [modalCopied, setModalCopied] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);

  const allTags = ['All', '2D', '3D', 'SVG', 'Canvas', 'UI', 'Interactive'];

  const visibleAnimations =
    filter === 'All'
      ? VIBE_ANIMATIONS
      : VIBE_ANIMATIONS.filter((a) => a.tags.includes(filter));

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (inspectEntry && !dialog.open) {
      dialog.showModal();
    } else if (!inspectEntry && dialog.open) {
      dialog.close();
    }
  }, [inspectEntry]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog || 'closedBy' in HTMLDialogElement.prototype) return;
    const outside = (e: PointerEvent) => {
      const r = dialog.getBoundingClientRect();
      return (
        e.clientX < r.left ||
        e.clientX > r.right ||
        e.clientY < r.top ||
        e.clientY > r.bottom
      );
    };
    let pressedOutside = false;
    const onDown = (e: PointerEvent) => {
      pressedOutside = outside(e);
    };
    const onUp = (e: PointerEvent) => {
      if (pressedOutside && outside(e)) dialog.close();
    };
    dialog.addEventListener('pointerdown', onDown);
    dialog.addEventListener('pointerup', onUp);
    return () => {
      dialog.removeEventListener('pointerdown', onDown);
      dialog.removeEventListener('pointerup', onUp);
    };
  }, []);

  const handleCopyForAntigravity = async (entry: VibeAnimationEntry) => {
    await navigator.clipboard.writeText(buildAntigravityPrompt(entry));
    setCopiedId(entry.id);
    setTimeout(() => setCopiedId((prev) => (prev === entry.id ? null : prev)), 1800);
  };

  const handleDownloadTsx = (entry: VibeAnimationEntry) => {
    const blob = new Blob([entry.rawCode], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${entry.componentName}.tsx`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="vibe-gallery-page">
      <div className="vibe-hero">
        <div className="vibe-hero-text">
          <h1>Vibe-Coded Animations</h1>
          <p>
            Describe any animation to Antigravity, preview it live here, and
            click <strong>Copy for Antigravity</strong> when you like it to
            drop it straight into another project.
          </p>
        </div>

        <div className="vibe-filters" role="group" aria-label="Filter animations">
          {allTags.map((tag) => (
            <button
              key={tag}
              type="button"
              className={`chip-btn ${filter === tag ? 'active' : ''}`}
              onClick={() => setFilter(tag)}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      <div className="vibe-grid">
        {visibleAnimations.map((entry) => {
          const Comp = entry.Component;
          const isCopied = copiedId === entry.id;
          const replayKey = replayKeys[entry.id] ?? 0;

          return (
            <article key={entry.id} className="vibe-card">
              <div className="vibe-preview-box">
                <button
                  type="button"
                  className="icon-btn-xs vibe-replay-btn"
                  onClick={() =>
                    setReplayKeys((prev) => ({
                      ...prev,
                      [entry.id]: (prev[entry.id] ?? 0) + 1,
                    }))
                  }
                  title="Restart animation"
                  aria-label={`Restart ${entry.name}`}
                >
                  <RotateCw size={13} />
                </button>
                <Comp key={replayKey} />
              </div>

              <div className="vibe-card-body">
                <div className="vibe-card-title-row">
                  <h2>{entry.name}</h2>
                  <div className="vibe-tags">
                    {entry.tags.map((t) => (
                      <span key={t} className="badge">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
                <p className="vibe-card-desc">{entry.description}</p>

                <div className="vibe-card-actions">
                  <button
                    type="button"
                    className="btn-primary vibe-copy-btn"
                    onClick={() => handleCopyForAntigravity(entry)}
                  >
                    {isCopied ? <Check size={14} /> : <Sparkles size={14} />}
                    <span>
                      {isCopied ? 'Copied!' : 'Copy for Antigravity'}
                    </span>
                  </button>
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => setInspectEntry(entry)}
                  >
                    <Code2 size={14} />
                    <span>Code</span>
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      <dialog
        ref={dialogRef}
        className="export-dialog"
        aria-labelledby="vibe-code-title"
        {...({ closedby: 'any' } as Record<string, string>)}
        onClose={() => {
          if (dialogRef.current) dialogRef.current.returnValue = '';
          setInspectEntry(null);
          setModalCopied(false);
        }}
      >
        {inspectEntry && (
          <>
            <div className="dialog-header">
              <div className="dialog-title-wrap">
                <Code2 size={18} className="brand-icon" />
                <h2 id="vibe-code-title">
                  {inspectEntry.name} ({inspectEntry.componentName}.tsx)
                </h2>
              </div>
              <button
                type="button"
                className="icon-btn"
                onClick={() => dialogRef.current?.close()}
                aria-label="Close code dialog"
              >
                <X size={16} />
              </button>
            </div>

            <div className="dialog-body">
              <div className="export-callout">
                Self-contained zero-dependency React component. Copy for
                Antigravity or download <code>{inspectEntry.componentName}.tsx</code>.
              </div>
              <pre className="code-preview">
                <code>{inspectEntry.rawCode}</code>
              </pre>
            </div>

            <div className="dialog-footer">
              <button
                type="button"
                className="btn-primary"
                autoFocus
                onClick={async () => {
                  await navigator.clipboard.writeText(
                    buildAntigravityPrompt(inspectEntry)
                  );
                  setModalCopied(true);
                  setTimeout(() => setModalCopied(false), 1800);
                }}
              >
                {modalCopied ? <Check size={15} /> : <Copy size={15} />}
                <span>
                  {modalCopied ? 'Copied!' : 'Copy for Antigravity'}
                </span>
              </button>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => handleDownloadTsx(inspectEntry)}
              >
                <Download size={15} />
                <span>Download .tsx</span>
              </button>
            </div>
          </>
        )}
      </dialog>
    </div>
  );
};
