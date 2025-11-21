import { Calendar } from 'lucide-react';
import { cn } from '../lib/utils';

interface ContractTermsProps {
    term: '6' | '12';
    onChange: (term: '6' | '12') => void;
}

export function ContractTerms({ term, onChange }: ContractTermsProps) {
    return (
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-600" />
                Contract Terms
            </h2>

            <div className="flex flex-col gap-3">
                <label className={cn(
                    "flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer transition-all",
                    term === '6'
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:bg-gray-50 hover:border-gray-300"
                )}>
                    <input
                        type="radio"
                        name="contract"
                        value="6"
                        checked={term === '6'}
                        onChange={() => onChange('6')}
                        className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                    />
                    <div>
                        <div className="font-semibold text-gray-900">6 months</div>
                        <div className="text-xs text-gray-500">Standard terms</div>
                    </div>
                </label>

                <label className={cn(
                    "flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer transition-all",
                    term === '12'
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:bg-gray-50 hover:border-gray-300"
                )}>
                    <input
                        type="radio"
                        name="contract"
                        value="12"
                        checked={term === '12'}
                        onChange={() => onChange('12')}
                        className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                    />
                    <div>
                        <div className="font-semibold text-gray-900">12 months</div>
                        <div className="text-xs text-emerald-600 font-medium">5% discount applied</div>
                    </div>
                </label>
            </div>
        </div>
    );
}
