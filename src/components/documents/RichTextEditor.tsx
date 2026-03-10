"use client";

import { useEffect, useRef, useCallback } from "react";

interface RichTextEditorProps {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
  className?: string;
  editable?: boolean;
}

export function RichTextEditor({
  content,
  onChange,
  placeholder = "Digite o conteúdo...",
  className = "",
  editable = true,
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const lastContentRef = useRef<string>("");

  const handleInput = useCallback(() => {
    if (!editorRef.current || !editable) return;
    const html = editorRef.current.innerHTML;
    lastContentRef.current = html;
    onChange(html);
  }, [onChange, editable]);

  useEffect(() => {
    if (!editorRef.current) return;
    if (content !== lastContentRef.current) {
      lastContentRef.current = content;
      editorRef.current.innerHTML = content || "";
    }
  }, [content]);

  return (
    <div
      className={`rounded-md border border-input bg-background ${className}`}
    >
      <div
        ref={editorRef}
        contentEditable={editable}
        suppressContentEditableWarning
        onInput={handleInput}
        data-placeholder={placeholder}
        className="prose prose-sm dark:prose-invert max-w-none min-h-[350px] p-4 focus:outline-none [&:empty]:before:content-[attr(data-placeholder)] [&:empty]:before:text-muted-foreground"
      />
    </div>
  );
}
