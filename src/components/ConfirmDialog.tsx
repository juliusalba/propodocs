import React from 'react';
import { AlertTriangle, Info, CheckCircle, XCircle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export type ConfirmDialogVariant = 'danger' | 'warning' | 'info' | 'success';

interface ConfirmDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    variant?: ConfirmDialogVariant;
    isLoading?: boolean;
}

const variantConfig = {
    danger: {
        icon: XCircle,
        iconColor: 'text-red-500',
        iconBg: 'bg-red-100',
        confirmBg: 'bg-red-600 hover:bg-red-700',
        confirmText: 'text-white',
    },
    warning: {
        icon: AlertTriangle,
        iconColor: 'text-yellow-500',
        iconBg: 'bg-yellow-100',
        confirmBg: 'bg-yellow-600 hover:bg-yellow-700',
        confirmText: 'text-white',
    },
    info: {
        icon: Info,
        iconColor: 'text-blue-500',
        iconBg: 'bg-blue-100',
        confirmBg: 'bg-blue-600 hover:bg-blue-700',
        confirmText: 'text-white',
    },
    success: {
        icon: CheckCircle,
        iconColor: 'text-green-500',
        iconBg: 'bg-green-100',
        confirmBg: 'bg-green-600 hover:bg-green-700',
        confirmText: 'text-white',
    },
};

export function ConfirmDialog({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    variant = 'danger',
    isLoading = false,
}: ConfirmDialogProps) {
    const config = variantConfig[variant];
    const Icon = config.icon;

    const handleConfirm = () => {
        onConfirm();
        if (!isLoading) {
            onClose();
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
                    />

                    {/* Modal */}
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            transition={{ type: 'spring', duration: 0.3 }}
                            className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Header */}
                            <div className="relative p-6 pb-4">
                                <button
                                    onClick={onClose}
                                    className="absolute top-4 right-4 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                                >
                                    <X className="w-5 h-5 text-gray-400" />
                                </button>

                                <div className="flex items-start gap-4">
                                    <div className={`p-3 rounded-xl ${config.iconBg} flex-shrink-0`}>
                                        <Icon className={`w-6 h-6 ${config.iconColor}`} />
                                    </div>
                                    <div className="flex-1 pt-1">
                                        <h3 className="text-lg font-semibold text-gray-900 mb-1">
                                            {title}
                                        </h3>
                                        <p className="text-sm text-gray-600 leading-relaxed">
                                            {message}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="px-6 py-4 bg-gray-50 flex items-center justify-end gap-3">
                                <button
                                    onClick={onClose}
                                    disabled={isLoading}
                                    className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {cancelText}
                                </button>
                                <button
                                    onClick={handleConfirm}
                                    disabled={isLoading}
                                    className={`px-4 py-2.5 text-sm font-medium rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${config.confirmBg} ${config.confirmText} shadow-sm`}
                                >
                                    {isLoading ? (
                                        <span className="flex items-center gap-2">
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            Processing...
                                        </span>
                                    ) : (
                                        confirmText
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>
    );
}

// Hook for easier usage
export function useConfirmDialog() {
    const [dialogState, setDialogState] = React.useState<{
        isOpen: boolean;
        title: string;
        message: string;
        confirmText?: string;
        cancelText?: string;
        variant?: ConfirmDialogVariant;
        onConfirm: () => void;
    }>({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => { },
    });

    const showConfirm = (options: Omit<typeof dialogState, 'isOpen'>) => {
        setDialogState({ ...options, isOpen: true });
    };

    const closeDialog = () => {
        setDialogState((prev) => ({ ...prev, isOpen: false }));
    };

    const ConfirmDialogComponent = () => (
        <ConfirmDialog
            isOpen={dialogState.isOpen}
            onClose={closeDialog}
            onConfirm={dialogState.onConfirm}
            title={dialogState.title}
            message={dialogState.message}
            confirmText={dialogState.confirmText}
            cancelText={dialogState.cancelText}
            variant={dialogState.variant}
        />
    );

    return { showConfirm, ConfirmDialogComponent };
}
