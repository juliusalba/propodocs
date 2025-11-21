import { Plus, Minus, Info } from 'lucide-react';
import type { AddOnsState } from '../types';

interface AddonsSectionProps {
    addOns: AddOnsState;
    onUpdate: (key: keyof AddOnsState, value: any) => void;
}

export function AddonsSection({ addOns, onUpdate }: AddonsSectionProps) {
    return (
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Plus className="w-5 h-5 text-blue-600" />
                Add-ons
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Landing Pages */}
                <div className="bg-slate-50 rounded-lg p-3 border border-slate-200 flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-1.5">
                            <h3 className="font-semibold text-gray-700 text-sm">Landing Pages</h3>
                            <div className="group relative">
                                <Info className="w-3.5 h-3.5 text-gray-400 cursor-help" />
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                                    Custom landing page builds
                                </div>
                            </div>
                        </div>
                        <div className="text-xs text-gray-500">$2,500 each</div>
                    </div>
                    <div className="flex items-center gap-2 bg-white rounded-md border border-gray-200 p-1">
                        <button
                            onClick={() => onUpdate('landingPages', Math.max(0, addOns.landingPages - 1))}
                            className="w-6 h-6 flex items-center justify-center rounded hover:bg-gray-100 text-gray-600"
                        >
                            <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-4 text-center font-semibold text-sm">{addOns.landingPages}</span>
                        <button
                            onClick={() => onUpdate('landingPages', addOns.landingPages + 1)}
                            className="w-6 h-6 flex items-center justify-center rounded hover:bg-gray-100 text-gray-600"
                        >
                            <Plus className="w-3 h-3" />
                        </button>
                    </div>
                </div>

                {/* Sales Funnels */}
                <div className="bg-slate-50 rounded-lg p-3 border border-slate-200 flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-1.5">
                            <h3 className="font-semibold text-gray-700 text-sm">Sales Funnels</h3>
                            <div className="group relative">
                                <Info className="w-3.5 h-3.5 text-gray-400 cursor-help" />
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                                    Complete sales funnel setup
                                </div>
                            </div>
                        </div>
                        <div className="text-xs text-gray-500">$6.25K each</div>
                    </div>
                    <div className="flex items-center gap-2 bg-white rounded-md border border-gray-200 p-1">
                        <button
                            onClick={() => onUpdate('funnels', Math.max(0, addOns.funnels - 1))}
                            className="w-6 h-6 flex items-center justify-center rounded hover:bg-gray-100 text-gray-600"
                        >
                            <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-4 text-center font-semibold text-sm">{addOns.funnels}</span>
                        <button
                            onClick={() => onUpdate('funnels', addOns.funnels + 1)}
                            className="w-6 h-6 flex items-center justify-center rounded hover:bg-gray-100 text-gray-600"
                        >
                            <Plus className="w-3 h-3" />
                        </button>
                    </div>
                </div>

                {/* Analytics Dashboard */}
                <div className="bg-slate-50 rounded-lg p-3 border border-slate-200 flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-1.5">
                            <h3 className="font-semibold text-gray-700 text-sm">Analytics Dashboard</h3>
                            <div className="group relative">
                                <Info className="w-3.5 h-3.5 text-gray-400 cursor-help" />
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                                    Custom reporting dashboard
                                </div>
                            </div>
                        </div>
                        <div className="text-xs text-gray-500">$2K setup + $500/mo</div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            checked={addOns.dashboard}
                            onChange={(e) => onUpdate('dashboard', e.target.checked)}
                            className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                </div>

                {/* Strategy Workshop */}
                <div className="bg-slate-50 rounded-lg p-3 border border-slate-200 flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-1.5">
                            <h3 className="font-semibold text-gray-700 text-sm">Strategy Workshop</h3>
                        </div>
                        <div className="text-xs text-gray-500">$3.5K - $6K</div>
                    </div>
                    <select
                        value={addOns.workshop || ''}
                        onChange={(e) => onUpdate('workshop', e.target.value || null)}
                        className="text-sm border-gray-300 rounded-md shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50 p-1.5 bg-white"
                    >
                        <option value="">None</option>
                        <option value="halfDay">Half-day</option>
                        <option value="fullDay">Full-day</option>
                    </select>
                </div>

                {/* Video Pack */}
                <div className="bg-slate-50 rounded-lg p-3 border border-slate-200 flex items-center justify-between col-span-1 md:col-span-2">
                    <div>
                        <div className="flex items-center gap-1.5">
                            <h3 className="font-semibold text-gray-700 text-sm">Video Pack</h3>
                            <div className="group relative">
                                <Info className="w-3.5 h-3.5 text-gray-400 cursor-help" />
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                                    5 professional videos
                                </div>
                            </div>
                        </div>
                        <div className="text-xs text-gray-500">$4K (5 videos)</div>
                    </div>
                    <div className="flex items-center gap-2 bg-white rounded-md border border-gray-200 p-1">
                        <button
                            onClick={() => onUpdate('videoPack', Math.max(0, addOns.videoPack - 1))}
                            className="w-6 h-6 flex items-center justify-center rounded hover:bg-gray-100 text-gray-600"
                        >
                            <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-4 text-center font-semibold text-sm">{addOns.videoPack}</span>
                        <button
                            onClick={() => onUpdate('videoPack', addOns.videoPack + 1)}
                            className="w-6 h-6 flex items-center justify-center rounded hover:bg-gray-100 text-gray-600"
                        >
                            <Plus className="w-3 h-3" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
