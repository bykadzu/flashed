import React, { useState } from 'react';
import { X, ExternalLink, Trash2, Smartphone, Monitor, Tablet, Code, Maximize2 } from 'lucide-react';
import { HTMLItem, VIEWPORTS } from '../types';
import Button from './Button';
import SandboxedFrame from './SandboxedFrame';

interface DetailViewProps {
  item: HTMLItem;
  onClose: () => void;
  onDelete: (id: string) => void;
}

const DetailView: React.FC<DetailViewProps> = ({ item, onClose, onDelete }) => {
  const [activeViewport, setActiveViewport] = useState(VIEWPORTS[0]); // Default Desktop
  const [showCode, setShowCode] = useState(false);

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      onDelete(item.id);
      onClose();
    }
  };

  const openInNewTab = () => {
    const blob = new Blob([item.content], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-md animate-fade-in flex flex-col">
      {/* Header */}
      <div className="h-16 flex items-center justify-between px-6 border-b border-white/10 bg-surface/50">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={onClose} size="sm">
            <X size={20} />
          </Button>
          <div>
            <h1 className="text-white font-semibold">{item.title}</h1>
            <p className="text-xs text-gray-400 flex items-center gap-2">
              {item.isTrusted ? (
                <span className="text-green-500 flex items-center gap-1">Trusted Mode <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span></span>
              ) : (
                <span className="text-yellow-500 flex items-center gap-1">Safe Mode <span className="w-1.5 h-1.5 rounded-full bg-yellow-500"></span></span>
              )}
            </p>
          </div>
        </div>

        {/* Viewport Controls */}
        <div className="hidden md:flex items-center bg-surfaceHighlight rounded-lg p-1 border border-white/5">
          {VIEWPORTS.map((vp) => (
            <button
              key={vp.label}
              onClick={() => setActiveViewport(vp)}
              className={`p-2 rounded-md transition-all ${
                activeViewport.label === vp.label 
                  ? 'bg-primary text-white shadow-lg' 
                  : 'text-gray-400 hover:text-white'
              }`}
              title={vp.label}
            >
              {vp.icon === 'monitor' && <Monitor size={18} />}
              {vp.icon === 'tablet' && <Tablet size={18} />}
              {vp.icon === 'smartphone' && <Smartphone size={18} />}
            </button>
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
           <Button variant="secondary" size="sm" onClick={() => setShowCode(!showCode)} icon={<Code size={16} />}>
            {showCode ? 'Preview' : 'Source'}
          </Button>
          <Button variant="secondary" size="sm" onClick={openInNewTab} icon={<ExternalLink size={16} />}>
            Open
          </Button>
          <Button variant="danger" size="sm" onClick={handleDelete} icon={<Trash2 size={16} />} />
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden relative flex justify-center bg-dots-pattern">
        {/* Background Pattern CSS */}
        <style>{`
          .bg-dots-pattern {
            background-image: radial-gradient(#27272a 1px, transparent 1px);
            background-size: 20px 20px;
          }
        `}</style>

        {showCode ? (
          <div className="w-full h-full p-6 overflow-auto">
            <div className="max-w-4xl mx-auto bg-surfaceHighlight border border-white/10 rounded-xl p-6 shadow-2xl">
              <pre className="text-sm font-mono text-gray-300 whitespace-pre-wrap break-words">
                {item.content}
              </pre>
            </div>
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center p-4 md:p-8">
            <div 
              className="bg-white shadow-2xl transition-all duration-500 ease-out overflow-hidden relative"
              style={{
                width: activeViewport.width,
                height: activeViewport.height === '100%' ? '100%' : activeViewport.height,
                maxHeight: '100%',
                borderRadius: activeViewport.label === 'Smartphone' ? '30px' : activeViewport.label === 'Tablet' ? '20px' : '8px',
                border: activeViewport.label !== 'Desktop' ? '8px solid #18181b' : '1px solid #27272a',
              }}
            >
               {/* Phone notch simulation */}
               {activeViewport.label === 'Smartphone' && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-[#18181b] rounded-b-xl z-10"></div>
               )}

              <SandboxedFrame 
                html={item.content} 
                title={item.title} 
                isTrusted={item.isTrusted}
                className="w-full h-full"
                interactive={true}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DetailView;