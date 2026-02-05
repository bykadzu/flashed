import React, { useEffect } from 'react';
import { AVAILABLE_MODELS, ModelId } from '../lib/openrouter';
import { XIcon } from './Icons';

interface SettingsProps {
  isOpen: boolean;
  onClose: () => void;
  selectedModel: ModelId;
  onModelChange: (modelId: ModelId) => void;
}

export default function Settings({ isOpen, onClose, selectedModel, onModelChange }: SettingsProps) {
  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="settings-modal-overlay" onClick={onClose}>
      <div
        className="settings-modal"
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-title"
      >
        <div className="settings-modal-header">
          <h2 id="settings-title">Settings</h2>
          <button onClick={onClose} className="settings-modal-close" aria-label="Close settings">
            <XIcon />
          </button>
        </div>

        <div>
          <label className="settings-label">AI Model</label>
          <div className="settings-model-list" role="radiogroup" aria-label="Select AI Model">
            {AVAILABLE_MODELS.map(model => (
              <button
                key={model.id}
                onClick={() => onModelChange(model.id)}
                className={`settings-model-btn ${selectedModel === model.id ? 'selected' : ''}`}
                role="radio"
                aria-checked={selectedModel === model.id}
              >
                <div>
                  <div className="settings-model-name">{model.name}</div>
                  <div className="settings-model-provider">{model.provider}</div>
                </div>
                {selectedModel === model.id && (
                  <div className="settings-model-indicator" />
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="settings-footer-note">
          Model selection is saved locally and persists across sessions.
        </div>
      </div>
    </div>
  );
}
