'use client';

import { useState, useEffect, useRef, useCallback, type DragEvent } from 'react';
import { MentionPopup } from './MentionPopup';

export function ChatComposer({
  onSend,
  sending,
}: {
  onSend: (text: string, files: File[]) => void;
  sending: boolean;
}) {
  const [text, setText] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [showMention, setShowMention] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-resize
  useEffect(() => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = 'auto';
      el.style.height = Math.min(el.scrollHeight, 160) + 'px';
    }
  }, [text]);

  const handleSend = useCallback(() => {
    if (!text.trim() && files.length === 0) return;
    onSend(text, files);
    setText('');
    setFiles([]);
  }, [text, files, onSend]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  const handleTextChange = useCallback((value: string) => {
    setText(value);
    // Detect @ for mention
    const cursorPos = textareaRef.current?.selectionStart || value.length;
    const beforeCursor = value.slice(0, cursorPos);
    const atMatch = beforeCursor.match(/@(\w*)$/);
    if (atMatch) {
      setMentionQuery(atMatch[1]);
      setShowMention(true);
    } else {
      setShowMention(false);
    }
  }, []);

  const handleMentionSelect = useCallback((username: string) => {
    const el = textareaRef.current;
    if (!el) return;
    const pos = el.selectionStart || text.length;
    const beforeAt = text.slice(0, pos).replace(/@\w*$/, '');
    const after = text.slice(pos);
    const newText = beforeAt + '@' + username + ' ' + after;
    setText(newText);
    setShowMention(false);
    el.focus();
  }, [text]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles((prev) => [...prev, ...Array.from(e.target.files!)]);
    }
  }, []);

  const handleDrop = useCallback((e: DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files) {
      setFiles((prev) => [...prev, ...Array.from(e.dataTransfer.files)]);
    }
  }, []);

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (items) {
      const imageFiles: File[] = [];
      for (const item of Array.from(items)) {
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile();
          if (file) imageFiles.push(file);
        }
      }
      if (imageFiles.length > 0) {
        setFiles((prev) => [...prev, ...imageFiles]);
      }
    }
  }, []);

  const removeFile = useCallback((idx: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
  }, []);

  return (
    <div style={{ position: 'relative', padding: '12px 24px', borderTop: '1px solid rgba(0,0,0,0.08)' }}>
      {/* File previews */}
      {files.length > 0 && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
          {files.map((f, i) => (
            <div key={i} style={{
              position: 'relative',
              padding: '4px 8px',
              borderRadius: 6,
              border: '1px solid rgba(0,0,0,0.1)',
              fontSize: 12,
              display: 'flex', alignItems: 'center', gap: 4,
            }}>
              {f.type.startsWith('image/') ? '🖼' : '📎'} {f.name.length > 20 ? f.name.slice(0, 17) + '...' : f.name}
              <button type="button" onClick={() => removeFile(i)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 14, color: '#ef4444' }}>×</button>
            </div>
          ))}
        </div>
      )}

      {/* Mention popup */}
      {showMention && (
        <MentionPopup query={mentionQuery} onSelect={handleMentionSelect} onClose={() => setShowMention(false)} />
      )}

      <div
        style={{
          display: 'flex', alignItems: 'flex-end', gap: 8,
          padding: '8px 12px', borderRadius: 12,
          border: '1px solid rgba(0,0,0,0.12)', background: '#fff',
        }}
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
      >
        <input ref={fileInputRef} type="file" multiple hidden onChange={handleFileSelect} accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.zip" />
        <button type="button" onClick={() => fileInputRef.current?.click()} style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 18, padding: '4px 2px', color: '#6b7280' }}>📎</button>

        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => handleTextChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          placeholder="Message @name or @ai..."
          rows={1}
          style={{
            flex: 1, border: 'none', outline: 'none', resize: 'none',
            fontSize: 14, lineHeight: '20px', padding: '4px 0',
            fontFamily: 'inherit', background: 'transparent',
            maxHeight: 160,
          }}
        />

        <button
          type="button"
          onClick={handleSend}
          disabled={!text.trim() && files.length === 0 || sending}
          style={{
            padding: '4px 12px', borderRadius: 8, border: 'none',
            background: (text.trim() || files.length > 0) && !sending ? '#008060' : '#d2d5d8',
            color: '#fff', cursor: (text.trim() || files.length > 0) && !sending ? 'pointer' : 'default',
            fontSize: 13, fontWeight: 500, flexShrink: 0,
          }}
        >
          {sending ? '...' : 'Send'}
        </button>
      </div>
    </div>
  );
}
