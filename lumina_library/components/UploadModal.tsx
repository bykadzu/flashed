import React, { useState, useRef } from 'react';
import { Upload, X, FileCode, CheckCircle, AlertTriangle } from 'lucide-react';
import Button from './Button';
import { extractMetadata, generateId } from '../utils/htmlHelpers';
import { HTMLItem } from '../types';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: HTMLItem) => void;
}

const UploadModal: React.FC<UploadModalProps> = ({ isOpen, onClose, onSave }) => {
  const [mode, setMode] = useState<'upload' | 'paste'>('upload');
  const [content, setContent] = useState('');
  const [fileName, setFileName] = useState('');
  const [tags, setTags] = useState('');
  const [isTrusted, setIsTrusted] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        setContent(text);
        setFileName(file.name.replace('.html', ''));
      };
      reader.readAsText(file);
    }
  };

  const handleSave = () => {
    if (!content.trim()) return;

    const metadata = extractMetadata(content);
    
    // Use user provided filename or extracted title, fallback to Untitled
    const finalTitle = fileName.trim() || metadata.title || 'Untitled';
    
    const newItem: HTMLItem = {
      id: generateId(),
      title: finalTitle,
      description: metadata.description,
      content: content,
      createdAt: Date.now(),
      tags: tags.split(',').map(t => t.trim()).filter(Boolean),
      isTrusted,
      size: new Blob([content]).size,
    };

    onSave(newItem);
    resetForm();
    onClose();
  };

  const resetForm = () => {
    setContent('');
    setFileName('');
    setTags('');
    setIsTrusted(false);
    setMode('upload');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div 
        className="w-full max-w-2xl bg-surface border border-white/10 rounded-2xl shadow-2xl animate-slide-up overflow-hidden"
        role="dialog"
      >
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <h2 className="text-xl font-semibold text-white">Add to Library</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Mode Selection */}
          <div className="flex gap-4 mb-4">
            <button
              onClick={() => setMode('upload')}
              className={`flex-1 p-4 rounded-xl border transition-all ${mode === 'upload' ? 'bg-primary/10 border-primary text-primary' : 'bg-surfaceHighlight border-transparent text-gray-400 hover:text-white'}`}
            >
              <div className="flex flex-col items-center gap-2">
                <Upload size={24} />
                <span className="font-medium">Upload File</span>
              </div>
            </button>
            <button
              onClick={() => setMode('paste')}
              className={`flex-1 p-4 rounded-xl border transition-all ${mode === 'paste' ? 'bg-primary/10 border-primary text-primary' : 'bg-surfaceHighlight border-transparent text-gray-400 hover:text-white'}`}
            >
              <div className="flex flex-col items-center gap-2">
                <FileCode size={24} />
                <span className="font-medium">Paste Code</span>
              </div>
            </button>
          </div>

          {/* Content Input */}
          <div className="space-y-4">
            {mode === 'upload' ? (
              <div 
                className="border-2 border-dashed border-white/10 rounded-xl p-8 text-center hover:border-primary/50 transition-colors cursor-pointer bg-black/20"
                onClick={() => fileInputRef.current?.click()}
              >
                <input 
                  type="file" 
                  ref={fileInputRef}
                  className="hidden" 
                  accept=".html,.htm"
                  onChange={handleFileUpload}
                />
                <div className="flex flex-col items-center gap-2 text-gray-400">
                  {content ? (
                     <CheckCircle size={32} className="text-green-500" />
                  ) : (
                    <Upload size={32} />
                  )}
                  <p>{content ? 'File loaded successfully' : 'Click to select an HTML file'}</p>
                  {fileName && <p className="text-sm text-white font-medium">{fileName}.html</p>}
                </div>
              </div>
            ) : (
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="<!DOCTYPE html><html>..."
                className="w-full h-48 bg-black/20 border border-white/10 rounded-xl p-4 text-sm font-mono text-gray-300 focus:outline-none focus:border-primary resize-none"
              />
            )}
          </div>

          {/* Metadata */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Title (Optional)</label>
              <input
                type="text"
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
                placeholder="My Awesome Component"
                className="w-full bg-surfaceHighlight border border-white/5 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Tags (comma separated)</label>
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="dashboard, widget, dark"
                className="w-full bg-surfaceHighlight border border-white/5 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          {/* Security Toggle */}
          <div className="flex items-center gap-3 p-4 bg-yellow-500/5 border border-yellow-500/10 rounded-xl">
            <AlertTriangle size={20} className="text-yellow-500 flex-shrink-0" />
            <div className="flex-1">
              <h4 className="text-sm font-medium text-yellow-500">Enable Scripts (Trusted Mode)</h4>
              <p className="text-xs text-yellow-500/70">Only enable this if you trust the source code. It allows JavaScript execution.</p>
            </div>
            <div 
              className={`w-12 h-6 rounded-full p-1 cursor-pointer transition-colors ${isTrusted ? 'bg-yellow-500' : 'bg-white/10'}`}
              onClick={() => setIsTrusted(!isTrusted)}
            >
              <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${isTrusted ? 'translate-x-6' : 'translate-x-0'}`} />
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-white/10 flex justify-end gap-3 bg-surfaceHighlight/30">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={!content.trim()}>
            Add to Library
          </Button>
        </div>
      </div>
    </div>
  );
};

export default UploadModal;