import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Check,
  Copy,
  Download,
  FileCode2,
  Film,
  Image as ImageIcon,
  Sparkles,
  X,
} from 'lucide-react';
import { AnimationProject } from '../types/animation';
import {
  exportFramePng,
  exportWebmVideo,
  generateAntigravityBundle,
  generateHtmlCss,
  generateLottieJson,
  generateReactComponent,
} from '../engine/exporters';

interface ExportModalProps {
  open: boolean;
  project: AnimationProject;
  currentTime: number;
  onClose: () => void;
}

type ExportTab = 'antigravity' | 'react' | 'html' | 'lottie' | 'media';

export const ExportModal: React.FC<ExportModalProps> = ({
  open,
  project,
  currentTime,
  onClose,
}) => {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [tab, setTab] = useState<ExportTab>('antigravity');
  const [copied, setCopied] = useState(false);
  const [recording, setRecording] = useState(false);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  // Fallback for browsers without <dialog closedby="any">
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

  const codeOutput = useMemo(() => {
    switch (tab) {
      case 'antigravity':
        return generateAntigravityBundle(project);
      case 'react':
        return generateReactComponent(project);
      case 'html':
        return generateHtmlCss(project);
      case 'lottie':
        return generateLottieJson(project);
      case 'media':
        return JSON.stringify(project, null, 2);
    }
  }, [project, tab]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(codeOutput);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const handleDownloadText = (ext: string, mime = 'text/plain') => {
    const blob = new Blob([codeOutput], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.name.toLowerCase().replace(/\s+/g, '-')}.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportWebM = async () => {
    setRecording(true);
    try {
      await exportWebmVideo(project);
    } finally {
      setRecording(false);
    }
  };

  return (
    <dialog
      ref={dialogRef}
      className="export-dialog"
      aria-labelledby="export-dialog-title"
      {...({ closedby: 'any' } as Record<string, string>)}
      onClose={() => {
        if (dialogRef.current) dialogRef.current.returnValue = '';
        onClose();
      }}
    >
      <div className="dialog-header">
        <div className="dialog-title-wrap">
          <Sparkles size={18} className="brand-icon" />
          <h2 id="export-dialog-title">Export Animation</h2>
        </div>
        <button
          type="button"
          className="icon-btn"
          onClick={() => dialogRef.current?.close()}
          aria-label="Close export dialog"
        >
          <X size={16} />
        </button>
      </div>

      <div className="export-tabs">
        <button
          type="button"
          className={`tab-btn ${tab === 'antigravity' ? 'active' : ''}`}
          onClick={() => setTab('antigravity')}
        >
          <Sparkles size={14} />
          <span>Antigravity (Easiest)</span>
        </button>
        <button
          type="button"
          className={`tab-btn ${tab === 'react' ? 'active' : ''}`}
          onClick={() => setTab('react')}
        >
          <FileCode2 size={14} />
          <span>React (.tsx)</span>
        </button>
        <button
          type="button"
          className={`tab-btn ${tab === 'html' ? 'active' : ''}`}
          onClick={() => setTab('html')}
        >
          <span>HTML + CSS</span>
        </button>
        <button
          type="button"
          className={`tab-btn ${tab === 'lottie' ? 'active' : ''}`}
          onClick={() => setTab('lottie')}
        >
          <span>Lottie JSON</span>
        </button>
        <button
          type="button"
          className={`tab-btn ${tab === 'media' ? 'active' : ''}`}
          onClick={() => setTab('media')}
        >
          <Film size={14} />
          <span>Video / PNG / Project</span>
        </button>
      </div>

      <div className="dialog-body">
        {tab === 'antigravity' && (
          <div className="export-callout">
            <strong>One-paste handoff to Antigravity:</strong> Click{' '}
            <em>Copy for Antigravity</em> below, then paste it into Antigravity
            inside any other app workspace. It includes the prompt + a
            zero-dependency component!
          </div>
        )}

        {tab === 'media' ? (
          <div className="media-export-grid">
            <div className="media-card">
              <h3>WebM Video</h3>
              <p>
                Records {project.duration.toFixed(1)}s at {project.fps} fps
                directly from the stage.
              </p>
              <button
                type="button"
                className="btn-primary"
                disabled={recording}
                onClick={handleExportWebM}
              >
                <Film size={15} />
                <span>
                  {recording ? 'Recording WebM...' : 'Download .webm'}
                </span>
              </button>
            </div>
            <div className="media-card">
              <h3>PNG Frame</h3>
              <p>
                Saves the current frame ({currentTime.toFixed(2)}s) as a
                transparent PNG.
              </p>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => exportFramePng(project, currentTime)}
              >
                <ImageIcon size={15} />
                <span>Download .png</span>
              </button>
            </div>
            <div className="media-card">
              <h3>Animator Project File</h3>
              <p>
                Save your full editable timeline &amp; cel layers to re-import
                later.
              </p>
              <button
                type="button"
                className="btn-secondary"
                onClick={() =>
                  handleDownloadText('anim.json', 'application/json')
                }
              >
                <Download size={15} />
                <span>Download .anim.json</span>
              </button>
            </div>
          </div>
        ) : (
          <pre className="code-preview">
            <code>{codeOutput}</code>
          </pre>
        )}
      </div>

      <div className="dialog-footer">
        {tab !== 'media' && (
          <>
            <button
              type="button"
              className="btn-primary"
              onClick={handleCopy}
              autoFocus
            >
              {copied ? <Check size={15} /> : <Copy size={15} />}
              <span>
                {copied
                  ? 'Copied to Clipboard!'
                  : tab === 'antigravity'
                  ? 'Copy for Antigravity'
                  : 'Copy Code'}
              </span>
            </button>
            {tab === 'react' && (
              <button
                type="button"
                className="btn-secondary"
                onClick={() => handleDownloadText('tsx')}
              >
                <Download size={15} />
                <span>Download .tsx</span>
              </button>
            )}
            {tab === 'html' && (
              <button
                type="button"
                className="btn-secondary"
                onClick={() => handleDownloadText('html', 'text/html')}
              >
                <Download size={15} />
                <span>Download .html</span>
              </button>
            )}
            {tab === 'lottie' && (
              <button
                type="button"
                className="btn-secondary"
                onClick={() =>
                  handleDownloadText('lottie.json', 'application/json')
                }
              >
                <Download size={15} />
                <span>Download .json</span>
              </button>
            )}
          </>
        )}
      </div>
    </dialog>
  );
};
