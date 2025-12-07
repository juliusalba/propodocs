import { useState, useEffect, useCallback } from 'react';
import { AlertCircle, Check, Copy, RotateCcw } from 'lucide-react';
import type { CalculatorSchema } from '../../types/calculator';

interface SchemaCodeEditorProps {
    schema: CalculatorSchema;
    onChange: (schema: CalculatorSchema) => void;
}

export function SchemaCodeEditor({ schema, onChange }: SchemaCodeEditorProps) {
    const [code, setCode] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isDirty, setIsDirty] = useState(false);
    const [copied, setCopied] = useState(false);

    // Sync from schema to code when schema changes externally
    useEffect(() => {
        const formatted = JSON.stringify(schema, null, 2);
        setCode(formatted);
        setIsDirty(false);
        setError(null);
    }, [schema]);

    const handleCodeChange = useCallback((newCode: string) => {
        setCode(newCode);
        setIsDirty(true);

        // Validate JSON
        try {
            JSON.parse(newCode);
            setError(null);
        } catch (e: any) {
            setError(`JSON Error: ${e.message}`);
        }
    }, []);

    const handleApply = useCallback(() => {
        try {
            const parsed = JSON.parse(code);
            onChange(parsed);
            setIsDirty(false);
            setError(null);
        } catch (e: any) {
            setError(`Cannot apply: ${e.message}`);
        }
    }, [code, onChange]);

    const handleReset = useCallback(() => {
        const formatted = JSON.stringify(schema, null, 2);
        setCode(formatted);
        setIsDirty(false);
        setError(null);
    }, [schema]);

    const handleCopy = useCallback(() => {
        navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }, [code]);

    const handleFormat = useCallback(() => {
        try {
            const parsed = JSON.parse(code);
            const formatted = JSON.stringify(parsed, null, 2);
            setCode(formatted);
        } catch (e) {
            // Can't format invalid JSON
        }
    }, [code]);

    return (
        <div className="h-full flex flex-col bg-gray-900 rounded-xl overflow-hidden">
            {/* Toolbar */}
            <div className="flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700">
                <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-300">Schema JSON</span>
                    {isDirty && (
                        <span className="px-2 py-0.5 text-xs bg-amber-500/20 text-amber-400 rounded-full">
                            Modified
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={handleCopy}
                        className="px-2 py-1 text-xs text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors flex items-center gap-1"
                    >
                        {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        {copied ? 'Copied!' : 'Copy'}
                    </button>
                    <button
                        onClick={handleFormat}
                        className="px-2 py-1 text-xs text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors"
                    >
                        Format
                    </button>
                    {isDirty && (
                        <>
                            <button
                                onClick={handleReset}
                                className="px-2 py-1 text-xs text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors flex items-center gap-1"
                            >
                                <RotateCcw className="w-3 h-3" />
                                Reset
                            </button>
                            <button
                                onClick={handleApply}
                                disabled={!!error}
                                className="px-3 py-1 text-xs bg-emerald-600 text-white hover:bg-emerald-700 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                            >
                                <Check className="w-3 h-3" />
                                Apply
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Error Banner */}
            {error && (
                <div className="px-4 py-2 bg-red-900/30 border-b border-red-800 flex items-center gap-2 text-red-400 text-sm">
                    <AlertCircle className="w-4 h-4" />
                    {error}
                </div>
            )}

            {/* Code Editor */}
            <div className="flex-1 relative">
                <textarea
                    value={code}
                    onChange={(e) => handleCodeChange(e.target.value)}
                    className="absolute inset-0 w-full h-full p-4 bg-transparent text-gray-100 font-mono text-sm resize-none focus:outline-none leading-relaxed"
                    spellCheck={false}
                    style={{ tabSize: 2 }}
                />
            </div>

            {/* Stats Footer */}
            <div className="px-4 py-2 bg-gray-800 border-t border-gray-700 flex items-center justify-between text-xs text-gray-500">
                <span>
                    {schema.tiers?.length || 0} tiers • {schema.addOns?.length || 0} add-ons • {schema.columns?.length || 0} columns
                </span>
                <span>
                    {code.split('\n').length} lines
                </span>
            </div>
        </div>
    );
}
