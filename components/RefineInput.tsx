/**
 * RefineInput - Conversational refinement for artifacts
 */

import React, { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { ArrowUpIcon, ThinkingIcon } from './Icons';

interface RefineInputProps {
    isVisible: boolean;
    isRefining: boolean;
    onRefine: (instruction: string) => void;
    placeholder?: string;
}

export interface RefineInputHandle {
    focusInput: () => void;
}

const RefineInput = forwardRef<RefineInputHandle, RefineInputProps>(function RefineInput(
    { isVisible, isRefining, onRefine, placeholder },
    ref
) {
    const [value, setValue] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    useImperativeHandle(ref, () => ({
        focusInput: () => {
            inputRef.current?.focus();
        }
    }));

    useEffect(() => {
        if (isVisible && !isRefining && inputRef.current) {
            // Small delay to allow animation to start
            setTimeout(() => inputRef.current?.focus(), 300);
        }
    }, [isVisible, isRefining]);
    
    const handleSubmit = () => {
        if (value.trim() && !isRefining) {
            onRefine(value.trim());
            setValue('');
        }
    };
    
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !isRefining) {
            e.preventDefault();
            handleSubmit();
        }
    };
    
    return (
        <div className={`refine-input-container ${isVisible ? 'visible' : ''}`}>
            <div className={`refine-input-wrapper ${isRefining ? 'refining' : ''}`}>
                {isRefining ? (
                    <div className="refine-status">
                        <ThinkingIcon />
                        <span>Refining design...</span>
                    </div>
                ) : (
                    <>
                        <input
                            ref={inputRef}
                            type="text"
                            value={value}
                            onChange={(e) => setValue(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder={placeholder || "Refine: 'Make the hero more minimal' or 'Change to blue theme'"}
                            disabled={isRefining}
                        />
                        <button
                            className="refine-btn"
                            onClick={handleSubmit}
                            disabled={isRefining || !value.trim()}
                            aria-label="Submit refinement"
                        >
                            <ArrowUpIcon />
                        </button>
                    </>
                )}
            </div>
            
        </div>
    );
});

export default RefineInput;
