import React from 'react';
import { AVAILABLE_MODELS, ModelId } from '../lib/openrouter';
import { XIcon } from './Icons';

interface SettingsProps {
  isOpen: boolean;
  onClose: () => void;
  selectedModel: ModelId;
  onModelChange: (modelId: ModelId) => void;
}

export default function Settings({ isOpen, onClose, selectedModel, onModelChange }: SettingsProps) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content settings-modal"
        onClick={e => e.stopPropagation()}
        style={{
          maxWidth: '480px',
          background: 'rgba(20, 20, 25, 0.95)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '16px',
          padding: '24px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600 }}>Settings</h2>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'rgba(255,255,255,0.6)',
              cursor: 'pointer',
              padding: '8px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <XIcon />
          </button>
        </div>

        <div>
          <label style={{
            display: 'block',
            marginBottom: '12px',
            fontSize: '0.875rem',
            color: 'rgba(255,255,255,0.7)',
            fontWeight: 500
          }}>
            AI Model
          </label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {AVAILABLE_MODELS.map(model => (
              <button
                key={model.id}
                onClick={() => onModelChange(model.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 16px',
                  background: selectedModel === model.id
                    ? 'rgba(99, 102, 241, 0.2)'
                    : 'rgba(255, 255, 255, 0.05)',
                  border: selectedModel === model.id
                    ? '1px solid rgba(99, 102, 241, 0.5)'
                    : '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  textAlign: 'left',
                }}
              >
                <div>
                  <div style={{
                    color: selectedModel === model.id ? '#fff' : 'rgba(255,255,255,0.9)',
                    fontWeight: 500,
                    fontSize: '0.9rem'
                  }}>
                    {model.name}
                  </div>
                  <div style={{
                    color: 'rgba(255,255,255,0.5)',
                    fontSize: '0.75rem',
                    marginTop: '2px'
                  }}>
                    {model.provider}
                  </div>
                </div>
                {selectedModel === model.id && (
                  <div style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: '#6366f1'
                  }} />
                )}
              </button>
            ))}
          </div>
        </div>

        <div style={{
          marginTop: '24px',
          padding: '12px',
          background: 'rgba(255,255,255,0.03)',
          borderRadius: '8px',
          fontSize: '0.75rem',
          color: 'rgba(255,255,255,0.5)'
        }}>
          Model selection is saved locally and persists across sessions.
        </div>
      </div>
    </div>
  );
}
