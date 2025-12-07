import React, { useState } from 'react';
import { X, Maximize2, Printer } from 'lucide-react';
import { DynamicCalculator } from './DynamicCalculator';
import type { DynamicCalculatorProps } from './DynamicCalculator';
import type { CalculatorTotals, CalculatorRow } from '../../types/calculator';

interface CalculatorPreviewModalProps extends Omit<DynamicCalculatorProps, 'onChange'> {
    isOpen: boolean;
    onClose: () => void;
    onDataChange?: (data: CalculatorRow[], totals: CalculatorTotals) => void;
}

export const CalculatorPreviewModal: React.FC<CalculatorPreviewModalProps> = ({
    isOpen,
    onClose,
    onDataChange,
    ...calculatorProps
}) => {
    const [isMaximized] = useState(true);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div
                className={`relative bg-white rounded-2xl shadow-2xl flex flex-col ${isMaximized ? 'w-[95vw] h-[95vh]' : 'w-[80vw] h-[80vh] max-w-5xl'
                    }`}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50 rounded-t-2xl">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-[#8C0000] to-[#500000] rounded-xl flex items-center justify-center">
                            <Maximize2 className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-gray-900">
                                {calculatorProps.schema.name || 'Calculator Preview'}
                            </h2>
                            <p className="text-sm text-gray-500">Full-page view</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => window.print()}
                            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                            title="Print"
                        >
                            <Printer className="w-5 h-5" />
                        </button>
                        <button
                            onClick={onClose}
                            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-auto p-6 bg-gray-50">
                    <div className="max-w-6xl mx-auto bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <DynamicCalculator
                            {...calculatorProps}
                            onChange={onDataChange}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};
