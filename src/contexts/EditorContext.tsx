import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

export interface SelectedBlock {
    type: 'tier' | 'addon' | 'column' | 'section' | 'header';
    id: string;
    data: any;
}

interface EditorContextState {
    isEditMode: boolean;
    selectedBlock: SelectedBlock | null;
    showAIPanel: boolean;
    showManualPanel: boolean;
    showCodeView: boolean;
    aiInstruction: string;
    isProcessingAI: boolean;
}

interface EditorContextValue extends EditorContextState {
    toggleEditMode: () => void;
    setEditMode: (value: boolean) => void;
    selectBlock: (block: SelectedBlock | null) => void;
    setShowAIPanel: (value: boolean) => void;
    setShowManualPanel: (value: boolean) => void;
    setShowCodeView: (value: boolean) => void;
    setAIInstruction: (value: string) => void;
    setIsProcessingAI: (value: boolean) => void;
    clearSelection: () => void;
}

const EditorContext = createContext<EditorContextValue | null>(null);

export function EditorProvider({ children }: { children: ReactNode }) {
    const [state, setState] = useState<EditorContextState>({
        isEditMode: true, // Default to edit mode in builder
        selectedBlock: null,
        showAIPanel: false,
        showManualPanel: false,
        showCodeView: false,
        aiInstruction: '',
        isProcessingAI: false,
    });

    const toggleEditMode = useCallback(() => {
        setState(prev => ({
            ...prev,
            isEditMode: !prev.isEditMode,
            selectedBlock: null,
            showAIPanel: false,
            showManualPanel: false,
        }));
    }, []);

    const setEditMode = useCallback((value: boolean) => {
        setState(prev => ({
            ...prev,
            isEditMode: value,
            selectedBlock: value ? prev.selectedBlock : null,
            showAIPanel: value ? prev.showAIPanel : false,
            showManualPanel: value ? prev.showManualPanel : false,
        }));
    }, []);

    const selectBlock = useCallback((block: SelectedBlock | null) => {
        setState(prev => ({
            ...prev,
            selectedBlock: block,
            // Don't auto-show panels, let buttons control this
            aiInstruction: '',
        }));
    }, []);

    const setShowAIPanel = useCallback((value: boolean) => {
        setState(prev => ({ ...prev, showAIPanel: value, showManualPanel: value ? false : prev.showManualPanel }));
    }, []);

    const setShowManualPanel = useCallback((value: boolean) => {
        setState(prev => ({ ...prev, showManualPanel: value, showAIPanel: value ? false : prev.showAIPanel }));
    }, []);

    const setShowCodeView = useCallback((value: boolean) => {
        setState(prev => ({ ...prev, showCodeView: value }));
    }, []);

    const setAIInstruction = useCallback((value: string) => {
        setState(prev => ({ ...prev, aiInstruction: value }));
    }, []);

    const setIsProcessingAI = useCallback((value: boolean) => {
        setState(prev => ({ ...prev, isProcessingAI: value }));
    }, []);

    const clearSelection = useCallback(() => {
        setState(prev => ({
            ...prev,
            selectedBlock: null,
            showAIPanel: false,
            showManualPanel: false,
            aiInstruction: '',
        }));
    }, []);

    return (
        <EditorContext.Provider
            value={{
                ...state,
                toggleEditMode,
                setEditMode,
                selectBlock,
                setShowAIPanel,
                setShowManualPanel,
                setShowCodeView,
                setAIInstruction,
                setIsProcessingAI,
                clearSelection,
            }}
        >
            {children}
        </EditorContext.Provider>
    );
}

export function useEditor() {
    const context = useContext(EditorContext);
    if (!context) {
        throw new Error('useEditor must be used within an EditorProvider');
    }
    return context;
}

export function useEditorOptional() {
    return useContext(EditorContext);
}
