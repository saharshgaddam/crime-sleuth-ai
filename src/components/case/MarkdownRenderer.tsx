
import React from 'react';
import ReactMarkdown from 'react-markdown';

interface MarkdownRendererProps {
  content: string | null;
  className?: string;
}

export function MarkdownRenderer({ content, className = "" }: MarkdownRendererProps) {
  if (!content) return null;
  
  return (
    <div className={`prose prose-sm max-w-none ${className}`}>
      <ReactMarkdown>{content}</ReactMarkdown>
    </div>
  );
}
