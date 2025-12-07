import { type ReactNode, useRef, useState, useCallback, useEffect } from 'react';
import { useEditorOptional } from '../../contexts/EditorContext';
import { Sparkles, Trash2, GripVertical, Pencil } from 'lucide-react';

interface EditableWrapperProps {
    blockType: 'tier' | 'addon' | 'column' | 'section' | 'header';
    blockId: string;
    blockData: any;
    children: ReactNode;
    onDelete?: () => void;
    className?: string;
}

export function EditableWrapper({
    blockType,
    blockId,
    blockData,
    children,
    onDelete,
    className = '',
}: EditableWrapperProps) {
    const editor = useEditorOptional();
    const wrapperRef = useRef<HTMLDivElement>(null);
    const [isHovered, setIsHovered] = useState(false);
    const [showContextMenu, setShowContextMenu] = useState(false);
    const [contextMenuPos, setContextMenuPos] = useState({ x: 0, y: 0 });

    // Determine if we're in edit mode
    const isInEditMode = editor?.isEditMode ?? false;
    const isSelected = isInEditMode && editor?.selectedBlock?.id === blockId && editor?.selectedBlock?.type === blockType;

    const handleClick = useCallback((e: React.MouseEvent) => {
        if (!editor || !isInEditMode) return;
        e.stopPropagation();
        if (isSelected) {
            return;
        }
        editor.selectBlock({
            type: blockType,
            id: blockId,
            data: blockData,
        });
    }, [editor, blockType, blockId, blockData, isSelected, isInEditMode]);

    const handleContextMenu = useCallback((e: React.MouseEvent) => {
        if (!isInEditMode) return;
        e.preventDefault();
        e.stopPropagation();
        setShowContextMenu(true);
        setContextMenuPos({ x: e.clientX, y: e.clientY });
    }, [isInEditMode]);

    const handleEditWithAI = useCallback(() => {
        if (!editor) return;
        editor.selectBlock({
            type: blockType,
            id: blockId,
            data: blockData,
        });
        editor.setShowAIPanel(true);
        setShowContextMenu(false);
    }, [editor, blockType, blockId, blockData]);

    const handleManualEdit = useCallback(() => {
        if (!editor) return;
        editor.selectBlock({
            type: blockType,
            id: blockId,
            data: blockData,
        });
        editor.setShowManualPanel(true);
        setShowContextMenu(false);
    }, [editor, blockType, blockId, blockData]);

    const handleDelete = useCallback(() => {
        if (onDelete) {
            onDelete();
        }
        setShowContextMenu(false);
    }, [onDelete]);

    // Close context menu when clicking outside
    useEffect(() => {
        const handleClickOutside = () => setShowContextMenu(false);
        if (showContextMenu) {
            document.addEventListener('click', handleClickOutside);
            return () => document.removeEventListener('click', handleClickOutside);
        }
    }, [showContextMenu]);

    // If no editor context or not in edit mode, render children without wrapper effects
    if (!isInEditMode) {
        return <>{children}</>;
    }

    const blockLabel = {
        tier: 'Tier',
        addon: 'Add-on',
        column: 'Column',
        section: 'Section',
        header: 'Header'
    }[blockType];

    return (
        <div
            ref={wrapperRef}
            className={`relative group transition-all duration-150 ${className}`}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onClick={handleClick}
            onContextMenu={handleContextMenu}
            style={{
                outline: isSelected
                    ? '2px solid #3b82f6'
                    : isHovered
                        ? '2px dashed #93c5fd'
                        : '2px solid transparent',
                outlineOffset: '2px',
                borderRadius: '12px',
                cursor: 'pointer',
            }}
        >
            {/* Edit indicator */}
            {(isHovered || isSelected) && (
                <div className="absolute -top-3 -left-1 z-10 flex items-center gap-1">
                    <div className="bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full font-medium shadow-sm flex items-center gap-1">
                        <GripVertical className="w-3 h-3" />
                        {blockLabel}
                    </div>
                </div>
            )}

            {/* Action buttons on selection */}
            {isSelected && (
                <div className="absolute -top-3 -right-1 z-10 flex items-center gap-1">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            handleManualEdit();
                        }}
                        className="bg-blue-500 hover:bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full font-medium shadow-sm flex items-center gap-1 transition-colors"
                    >
                        <Pencil className="w-3 h-3" />
                        Edit
                    </button>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            handleEditWithAI();
                        }}
                        className="bg-emerald-500 hover:bg-emerald-600 text-white text-xs px-2 py-0.5 rounded-full font-medium shadow-sm flex items-center gap-1 transition-colors"
                    >
                        <Sparkles className="w-3 h-3" />
                        AI Edit
                    </button>
                    {onDelete && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                handleDelete();
                            }}
                            className="bg-red-500 hover:bg-red-600 text-white p-1 rounded-full shadow-sm transition-colors"
                        >
                            <Trash2 className="w-3 h-3" />
                        </button>
                    )}
                </div>
            )}

            {/* Children with pointer events preserved */}
            <div className="relative">
                {children}
            </div>

            {/* Context Menu */}
            {showContextMenu && (
                <div
                    className="fixed bg-white rounded-lg shadow-xl border border-gray-200 py-1 z-50 min-w-[160px]"
                    style={{ left: contextMenuPos.x, top: contextMenuPos.y }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <button
                        onClick={handleManualEdit}
                        className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                    >
                        <Pencil className="w-4 h-4 text-blue-500" />
                        Edit Manually
                    </button>
                    <button
                        onClick={handleEditWithAI}
                        className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                    >
                        <Sparkles className="w-4 h-4 text-emerald-500" />
                        Edit with AI
                    </button>
                    {onDelete && (
                        <button
                            onClick={handleDelete}
                            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 text-red-600"
                        >
                            <Trash2 className="w-4 h-4" />
                            Delete
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}
