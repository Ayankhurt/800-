import { useState, useCallback } from 'react';
import { ToastType } from '@/components/Toast';

interface ToastItem {
    id: string;
    type: ToastType;
    message: string;
    visible: boolean;
}

export const useToast = () => {
    const [toasts, setToasts] = useState<ToastItem[]>([]);

    const showToast = useCallback((type: ToastType, message: string) => {
        const id = Date.now().toString();
        const newToast: ToastItem = {
            id,
            type,
            message,
            visible: true,
        };

        setToasts((prev) => [...prev, newToast]);

        // Auto-remove after animation completes
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 3500); // Duration + animation time
    }, []);

    const success = useCallback(
        (message: string) => showToast('success', message),
        [showToast]
    );

    const error = useCallback(
        (message: string) => showToast('error', message),
        [showToast]
    );

    const warning = useCallback(
        (message: string) => showToast('warning', message),
        [showToast]
    );

    const info = useCallback(
        (message: string) => showToast('info', message),
        [showToast]
    );

    const dismissToast = useCallback((id: string) => {
        setToasts((prev) =>
            prev.map((toast) =>
                toast.id === id ? { ...toast, visible: false } : toast
            )
        );

        // Remove from array after animation
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 300);
    }, []);

    return {
        toasts,
        success,
        error,
        warning,
        info,
        dismissToast,
    };
};
