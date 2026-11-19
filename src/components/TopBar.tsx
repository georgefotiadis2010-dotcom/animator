import React, { useRef } from 'react';
import {
  Download,
  FolderOpen,
  Redo2,
  Sparkles,
  Undo2,
} from 'lucide-react';
import { AnimationProject } from '../types/animation';
import { PRESET_PROJECTS } from '../engine/presets';

interface TopBarProps {
  project: AnimationProject;
  canUndo: boolean;
  canRedo: boolean;
  onRename: (name: string) => void;
  onSelectPreset: (presetId: string) => void;
  onUndo: () => void;
  onRedo: () => void;
  onImportProject: (project: AnimationProject) => void;
  onOpenExport: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  project,
  canUndo,
  canRedo,
  onRename,
  onSelectPreset,
  onUndo,
  onRedo,
  onImportProject,
  onOpenExport,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result)) as AnimationProject;
        if (parsed && Array.isArray(parsed.layers)) {
          onImportProject(parsed);
        }
      } catch {
        alert('Invalid .anim.json file.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <header className="topbar">
      <div className="topbar-left">
        <div className="brand">
          <Sparkles size={18} className="brand-icon" />
          <span>Animator</span>
        </div>
        <input
          className="project-name-input"
          type="text"
          value={project.name}
          onChange={(e) => onRename(e.target.value)}
          aria-label="Project name"
        />
        <select
          className="preset-select"
          value=""
          onChange={(e) => {
            if (e.target.value) onSelectPreset(e.target.value);
          }}
          aria-label="Load starter preset"
        >
          <option value="" disabled>
            Load Preset...
          </option>
          {PRESET_PROJECTS.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      <div className="topbar-right">
        <button
          type="button"
          className="icon-btn"
          onClick={onUndo}
          disabled={!canUndo}
          title="Undo (Cmd/Ctrl+Z)"
          aria-label="Undo"
        >
          <Undo2 size={16} />
        </button>
        <button
          type="button"
          className="icon-btn"
          onClick={onRedo}
          disabled={!canRedo}
          title="Redo (Cmd/Ctrl+Shift+Z)"
          aria-label="Redo"
        >
          <Redo2 size={16} />
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept=".json,.anim.json"
          onChange={handleFileChange}
          hidden
        />
        <button
          type="button"
          className="btn-secondary"
          onClick={() => fileInputRef.current?.click()}
          title="Import .anim.json project"
        >
          <FolderOpen size={15} />
          <span>Import</span>
        </button>

        <button
          type="button"
          className="btn-primary"
          onClick={onOpenExport}
        >
          <Download size={15} />
          <span>Export / Copy for Antigravity</span>
        </button>
      </div>
    </header>
  );
};
