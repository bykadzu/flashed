/**
 * RefineInput - Conversational refinement for artifacts
 */

import React, { useState, useRef, useEffect } from 'react';
import { ArrowUpIcon, ThinkingIcon } from './Icons';

interface RefineInputProps {
    isVisible: boolean;
    isRefining: boolean;
    onRefine: (instruction: string) => void;
    placeholder?: string;
}

export default function RefineInput({ isVisible, isRefining, onRefine, placeholder }: RefineInputProps) {
    const [value, setValue] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);
    
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
            
            {/* Quick suggestions */}
            {isVisible && !isRefining && !value && (
                <div className="refine-suggestions">
                    {['More minimal', 'Bolder colors', 'Add animations', 'Change font style'].map(suggestion => (
                        <button 
                            key={suggestion}
                            className="refine-suggestion"
                            onClick={() => {
                                setValue(suggestion);
                                inputRef.current?.focus();
                            }}
                        >
                            {suggestion}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
