import React from 'react';
import {
  Circle,
  Copy,
  Eye,
  EyeOff,
  Lock,
  Pencil,
  Square,
  Star,
  Trash2,
  Type,
  Unlock,
} from 'lucide-react';
import { Layer, LayerType } from '../types/animation';

interface LayerPanelProps {
  layers: Layer[];
  selectedLayerId: string | null;
  onSelectLayer: (id: string) => void;
  onAddLayer: (type: LayerType) => void;
  onToggleVisible: (id: string) => void;
  onToggleLock: (id: string) => void;
  onDuplicateLayer: (id: string) => void;
  onDeleteLayer: (id: string) => void;
}

const LAYER_ICONS: Record<LayerType, React.ReactNode> = {
  rect: <Square size={14} />,
  circle: <Circle size={14} />,
  star: <Star size={14} />,
  text: <Type size={14} />,
  framebyframe: <Pencil size={14} />,
};

export const LayerPanel: React.FC<LayerPanelProps> = ({
  layers,
  selectedLayerId,
  onSelectLayer,
  onAddLayer,
  onToggleVisible,
  onToggleLock,
  onDuplicateLayer,
  onDeleteLayer,
}) => {
  return (
    <aside className="panel panel-left">
      <div className="panel-header">
        <span>Layers</span>
        <div className="add-layer-bar">
          <button
            type="button"
            className="icon-btn-sm"
            onClick={() => onAddLayer('rect')}
            title="Add Rectangle"
            aria-label="Add Rectangle"
          >
            <Square size={13} />
          </button>
          <button
            type="button"
            className="icon-btn-sm"
            onClick={() => onAddLayer('circle')}
            title="Add Circle"
            aria-label="Add Circle"
          >
            <Circle size={13} />
          </button>
          <button
            type="button"
            className="icon-btn-sm"
            onClick={() => onAddLayer('star')}
            title="Add Star"
            aria-label="Add Star"
          >
            <Star size={13} />
          </button>
          <button
            type="button"
            className="icon-btn-sm"
            onClick={() => onAddLayer('text')}
            title="Add Text"
            aria-label="Add Text"
          >
            <Type size={13} />
          </button>
          <button
            type="button"
            className="icon-btn-sm accent"
            onClick={() => onAddLayer('framebyframe')}
            title="Add Frame-by-Frame Drawing Layer"
            aria-label="Add Frame-by-Frame Layer"
          >
            <Pencil size={13} />
          </button>
        </div>
      </div>

      <div className="layer-list">
        {layers.length === 0 && (
          <div className="empty-hint">
            No layers yet. Click an icon above to add a shape, text, or drawing layer.
          </div>
        )}
        {[...layers].reverse().map((layer) => {
          const isSelected = layer.id === selectedLayerId;
          return (
            <div
              key={layer.id}
              className={`layer-item ${isSelected ? 'selected' : ''}`}
              onClick={() => onSelectLayer(layer.id)}
            >
              <div className="layer-item-left">
                <span className="layer-type-icon">{LAYER_ICONS[layer.type]}</span>
                <span className="layer-name">{layer.name}</span>
              </div>
              <div
                className="layer-item-actions"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  className="icon-btn-xs"
                  onClick={() => onToggleVisible(layer.id)}
                  title={layer.visible ? 'Hide' : 'Show'}
                  aria-label={layer.visible ? 'Hide layer' : 'Show layer'}
                >
                  {layer.visible ? <Eye size={13} /> : <EyeOff size={13} />}
                </button>
                <button
                  type="button"
                  className="icon-btn-xs"
                  onClick={() => onToggleLock(layer.id)}
                  title={layer.locked ? 'Unlock' : 'Lock'}
                  aria-label={layer.locked ? 'Unlock layer' : 'Lock layer'}
                >
                  {layer.locked ? <Lock size={13} /> : <Unlock size={13} />}
                </button>
                <button
                  type="button"
                  className="icon-btn-xs"
                  onClick={() => onDuplicateLayer(layer.id)}
                  title="Duplicate"
                  aria-label="Duplicate layer"
                >
                  <Copy size={13} />
                </button>
                <button
                  type="button"
                  className="icon-btn-xs danger"
                  onClick={() => onDeleteLayer(layer.id)}
                  title="Delete"
                  aria-label="Delete layer"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </aside>
  );
};
