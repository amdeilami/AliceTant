import { useState, useRef, useEffect } from 'react';

/**
 * A single field that shows its value as text, and on click turns into an input.
 * Saves on blur or Enter, cancels on Escape.
 */
const InlineEditField = ({
    value,
    onSave,
    label,
    type = 'text',
    multiline = false,
    placeholder = '',
    inputClassName = '',
    maxLength = 0,
}) => {
    const [editing, setEditing] = useState(false);
    const [draft, setDraft] = useState(value);
    const [saving, setSaving] = useState(false);
    const inputRef = useRef(null);

    useEffect(() => { setDraft(value); }, [value]);
    useEffect(() => { if (editing && inputRef.current) inputRef.current.focus(); }, [editing]);

    const save = async () => {
        const trimmed = typeof draft === 'string' ? draft.trim() : draft;
        if (trimmed === value) { setEditing(false); return; }
        setSaving(true);
        try {
            await onSave(trimmed);
            setEditing(false);
        } catch { /* parent handles error */ }
        finally { setSaving(false); }
    };

    const cancel = () => { setDraft(value); setEditing(false); };

    const onKeyDown = (e) => {
        if (e.key === 'Enter' && !multiline) save();
        if (e.key === 'Escape') cancel();
    };

    if (editing) {
        const cls = `w-full px-3 py-1.5 border border-indigo-300 rounded-md text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${inputClassName}`;
        const handleChange = (e) => {
            const v = e.target.value;
            if (maxLength > 0 && v.length > maxLength) return;
            setDraft(v);
        };
        return (
            <div className="group">
                {label && <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</span>}
                {multiline ? (
                    <textarea
                        ref={inputRef}
                        value={draft}
                        onChange={handleChange}
                        onBlur={save}
                        onKeyDown={e => { if (e.key === 'Escape') cancel(); }}
                        rows={4}
                        className={cls}
                        disabled={saving}
                    />
                ) : (
                    <input
                        ref={inputRef}
                        type={type}
                        value={draft}
                        onChange={handleChange}
                        onBlur={save}
                        onKeyDown={onKeyDown}
                        className={cls}
                        disabled={saving}
                        placeholder={placeholder}
                    />
                )}
                <div className="flex items-center justify-between mt-0.5">
                    {saving && <span className="text-xs text-indigo-500">Saving...</span>}
                    {!saving && maxLength > 0 && (
                        <span className={`text-xs ml-auto ${draft.length > maxLength * 0.9 ? 'text-amber-600' : 'text-gray-400'}`}>
                            {draft.length}/{maxLength}
                        </span>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div
            className="group cursor-pointer rounded-md px-2 py-1 -mx-2 hover:bg-gray-50 transition-colors"
            onClick={() => setEditing(true)}
            title="Click to edit"
        >
            {label && <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</span>}
            <div className="flex items-center justify-between">
                <span className={`text-sm ${value ? 'text-gray-900' : 'text-gray-400 italic'}`}>
                    {value || placeholder || 'Click to add'}
                </span>
                <svg className="w-3.5 h-3.5 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 ml-2" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                    <path d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
            </div>
        </div>
    );
};

export default InlineEditField;
