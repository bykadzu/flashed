/**
 * Toast - Notification component for user feedback
 */

import React, { useEffect, useState } from 'react';
import { nanoid } from 'nanoid';
import { TOAST_DURATION_DEFAULT, TOAST_DURATION_ERROR } from '../constants';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastMessage {
    id: string;
    type: ToastType;
    message: string;
    duration?: number;
}

interface ToastProps {
    toasts: ToastMessage[];
    onDismiss: (id: string) => void;
}

// Individual toast item
function ToastItem({ toast, onDismiss }: { toast: ToastMessage; onDismiss: () => void }) {
    const [isExiting, setIsExiting] = useState(false);

    useEffect(() => {
        const duration = toast.duration || TOAST_DURATION_DEFAULT;
        const timer = setTimeout(() => {
            setIsExiting(true);
            setTimeout(onDismiss, 300); // Wait for exit animation
        }, duration);

        return () => clearTimeout(timer);
    }, [toast.duration, onDismiss]);

    const handleDismiss = () => {
        setIsExiting(true);
        setTimeout(onDismiss, 300);
    };

    const icons: Record<ToastType, string> = {
        success: '✓',
        error: '✕',
        warning: '⚠',
        info: 'ℹ',
    };

    return (
        <div
            className={`toast toast-${toast.type} ${isExiting ? 'toast-exit' : ''}`}
            role="alert"
            aria-live="polite"
        >
            <span className="toast-icon">{icons[toast.type]}</span>
            <span className="toast-message">{toast.message}</span>
            <button
                className="toast-dismiss"
                onClick={handleDismiss}
                aria-label="Dismiss notification"
            >
                ×
            </button>
        </div>
    );
}

// Toast container
export default function Toast({ toasts, onDismiss }: ToastProps) {
    if (toasts.length === 0) return null;

    return (
        <div className="toast-container" aria-label="Notifications">
            {toasts.map(toast => (
                <ToastItem
                    key={toast.id}
                    toast={toast}
                    onDismiss={() => onDismiss(toast.id)}
                />
            ))}
        </div>
    );
}

// Hook for managing toasts
export function useToast() {
    const [toasts, setToasts] = useState<ToastMessage[]>([]);

    const addToast = (type: ToastType, message: string, duration?: number) => {
        const id = nanoid(9);
        setToasts(prev => [...prev, { id, type, message, duration }]);
        return id;
    };

    const dismissToast = (id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    };

    const showSuccess = (message: string, duration?: number) => addToast('success', message, duration);
    const showError = (message: string, duration?: number) => addToast('error', message, duration || TOAST_DURATION_ERROR);
    const showWarning = (message: string, duration?: number) => addToast('warning', message, duration);
    const showInfo = (message: string, duration?: number) => addToast('info', message, duration);

    return {
        toasts,
        dismissToast,
        showSuccess,
        showError,
        showWarning,
        showInfo,
    };
}
