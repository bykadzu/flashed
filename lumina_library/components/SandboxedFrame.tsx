import React, { useMemo } from 'react';
import { prepareSafeHTML } from '../utils/htmlHelpers';

interface SandboxedFrameProps {
  html: string;
  title: string;
  isTrusted?: boolean;
  className?: string;
  scale?: number; // For scaling down in preview cards
  interactive?: boolean;
}

const SandboxedFrame: React.FC<SandboxedFrameProps> = ({ 
  html, 
  title, 
  isTrusted = false, 
  className = "",
  scale = 1,
  interactive = false
}) => {
  
  const safeContent = useMemo(() => prepareSafeHTML(html, isTrusted), [html, isTrusted]);

  // If we are scaling, we need a wrapper to handle the transform
  const style: React.CSSProperties = scale !== 1 ? {
    transform: `scale(${scale})`,
    transformOrigin: 'top left',
    width: `${100 / scale}%`,
    height: `${100 / scale}%`,
    pointerEvents: interactive ? 'auto' : 'none', // Disable interaction in preview mode
  } : {
    width: '100%',
    height: '100%',
    pointerEvents: interactive ? 'auto' : 'none',
  };

  return (
    <div className={`overflow-hidden bg-white ${className}`}>
      <iframe
        title={`Preview of ${title}`}
        srcDoc={safeContent}
        sandbox={isTrusted ? "allow-scripts allow-forms" : "allow-same-origin"}
        className="border-none block"
        style={style}
        loading="lazy"
      />
    </div>
  );
};

export default SandboxedFrame;