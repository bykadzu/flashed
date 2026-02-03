import React from 'react';
import { Tag, Clock, HardDrive, ShieldCheck, ShieldAlert } from 'lucide-react';
import { HTMLItem } from '../types';
import SandboxedFrame from './SandboxedFrame';

interface PreviewCardProps {
  item: HTMLItem;
  onClick: (item: HTMLItem) => void;
}

const PreviewCard: React.FC<PreviewCardProps> = ({ item, onClick }) => {
  // Format date
  const dateStr = new Date(item.createdAt).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });

  // Format size
  const sizeStr = item.size > 1024 
    ? `${(item.size / 1024).toFixed(1)} KB` 
    : `${item.size} B`;

  return (
    <div 
      className="group relative bg-surface border border-white/5 rounded-2xl overflow-hidden cursor-pointer hover:border-primary/50 hover:shadow-2xl hover:shadow-primary/10 transition-all duration-300 hover:-translate-y-1"
      onClick={() => onClick(item)}
    >
      {/* Preview Area - Fixed Aspect Ratio */}
      <div className="relative aspect-[4/3] w-full bg-surfaceHighlight overflow-hidden">
        {/* We use a scaled down version of the iframe for the preview */}
        <div className="absolute inset-0 w-[400%] h-[400%] origin-top-left transform scale-25 pointer-events-none select-none">
          <SandboxedFrame 
            html={item.content} 
            title={item.title} 
            isTrusted={false} // Always untrusted in card view for safety/performance
            scale={1} // The scaling is handled by the parent div to allow better clipping
            interactive={false}
          />
        </div>
        
        {/* Overlay on hover */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[1px]">
          <span className="bg-white text-black font-semibold px-4 py-2 rounded-full transform scale-90 group-hover:scale-100 transition-transform">
            View Details
          </span>
        </div>

        {/* Badges */}
        <div className="absolute top-3 right-3 flex gap-2">
           {item.isTrusted ? (
             <div className="bg-green-500/20 text-green-400 p-1.5 rounded-full backdrop-blur-md border border-green-500/20" title="Trusted: Scripts Enabled">
               <ShieldCheck size={14} />
             </div>
           ) : (
            <div className="bg-black/40 text-gray-400 p-1.5 rounded-full backdrop-blur-md border border-white/10" title="Safe Mode">
               <ShieldAlert size={14} />
             </div>
           )}
        </div>
      </div>

      {/* Info Area */}
      <div className="p-4">
        <h3 className="font-semibold text-white truncate mb-1" title={item.title}>{item.title}</h3>
        
        {item.description && (
          <p className="text-gray-400 text-xs line-clamp-2 mb-3 h-8">
            {item.description}
          </p>
        )}

        <div className="flex flex-wrap gap-2 mb-3">
          {item.tags.slice(0, 3).map((tag, idx) => (
            <span key={idx} className="flex items-center gap-1 text-[10px] uppercase tracking-wider font-semibold text-accent bg-accent/10 px-2 py-1 rounded-md">
              <Tag size={10} />
              {tag}
            </span>
          ))}
        </div>

        <div className="flex items-center justify-between text-xs text-gray-500 pt-3 border-t border-white/5">
          <div className="flex items-center gap-1">
            <Clock size={12} />
            {dateStr}
          </div>
          <div className="flex items-center gap-1">
            <HardDrive size={12} />
            {sizeStr}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PreviewCard;