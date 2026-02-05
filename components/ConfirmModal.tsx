/**
 * ConfirmModal - Reusable confirmation dialog
 */

import React, { useEffect, useRef } from 'react';

export interface ConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'danger' | 'warning' | 'primary';
    isLoading?: boolean;
}

export default function ConfirmModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    variant = 'danger',
    isLoading = false,
}: ConfirmModalProps) {
    const confirmButtonRef = useRef<HTMLButtonElement>(null);

    // Focus confirm button when opened
    useEffect(() => {
        if (isOpen) {
            confirmButtonRef.current?.focus();
        }
    }, [isOpen]);

    // Handle escape key
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen && !isLoading) {
                onClose();
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, isLoading, onClose]);

    if (!isOpen) return null;

    const icons: Record<string, string> = {
        danger: '🗑️',
        warning: '⚠️',
        primary: '❓',
    };

    return (
        <div
            className="confirm-modal-overlay"
            onClick={isLoading ? undefined : onClose}
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-title"
        >
            <div
                className="confirm-modal"
                onClick={e => e.stopPropagation()}
            >
                <div className={`confirm-modal-icon ${variant}`}>
                    {icons[variant]}
                </div>
                <h3 id="confirm-title">{title}</h3>
                <p>{message}</p>
                <div className="confirm-modal-actions">
                    <button
                        className="cancel-btn"
                        onClick={onClose}
                        disabled={isLoading}
                    >
                        {cancelText}
                    </button>
                    <button
                        ref={confirmButtonRef}
                        className={`confirm-btn ${variant === 'primary' ? 'primary' : ''}`}
                        onClick={onConfirm}
                        disabled={isLoading}
                    >
                        {isLoading ? 'Please wait...' : confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
}

// Hook for easier confirm modal usage
export function useConfirmModal() {
    const [state, setState] = React.useState<{
        isOpen: boolean;
        props: Omit<ConfirmModalProps, 'isOpen' | 'onClose' | 'onConfirm'>;
        resolve: ((value: boolean) => void) | null;
    }>({
        isOpen: false,
        props: { title: '', message: '' },
        resolve: null,
    });

    const confirm = (props: Omit<ConfirmModalProps, 'isOpen' | 'onClose' | 'onConfirm'>): Promise<boolean> => {
        return new Promise(resolve => {
            setState({ isOpen: true, props, resolve });
        });
    };

    const handleClose = () => {
        state.resolve?.(false);
        setState(s => ({ ...s, isOpen: false, resolve: null }));
    };

    const handleConfirm = () => {
        state.resolve?.(true);
        setState(s => ({ ...s, isOpen: false, resolve: null }));
    };

    const ConfirmModalComponent = () => (
        <ConfirmModal
            isOpen={state.isOpen}
            onClose={handleClose}
            onConfirm={handleConfirm}
            {...state.props}
        />
    );

    return { confirm, ConfirmModal: ConfirmModalComponent };
}
