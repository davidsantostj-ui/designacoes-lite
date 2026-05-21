import React from 'react';
import { parseLinks } from '../utils/textUtils';

export default function RichTextDisplay({ content, className = '' }) {
  if (!content) return null;

  // Simple regex to check if content contains HTML tags (e.g. <span, <b>, <i>, <font, etc.)
  const hasHtml = /<[a-z][\s\S]*>/i.test(content);

  if (hasHtml) {
    return (
      <div 
        className={`rich-text-display prose dark:prose-invert max-w-none text-sm leading-relaxed text-slate-700 dark:text-slate-300 break-words font-medium ${className}`}
        style={{
          // Apply line-height and margin styles directly to ensure standard paragraph layout matches design
          lineHeight: '1.625'
        }}
        dangerouslySetInnerHTML={{ __html: content }}
      />
    );
  }

  // Fallback for plain text: split into paragraphs by line break and render links correctly
  const lines = content.split('\n');

  return (
    <div className={`space-y-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300 font-medium ${className}`}>
      {lines.map((line, lineIdx) => {
        // If it's a completely empty line, we can render a line break
        if (line.trim() === '') {
          return <div key={lineIdx} className="h-2" />;
        }
        
        return (
          <p key={lineIdx}>
            {parseLinks(line).map((chunk, index) => 
              chunk.isLink ? (
                <a 
                  key={index} 
                  href={chunk.text} 
                  target="_blank" 
                  rel="noreferrer" 
                  className="text-blue-600 dark:text-blue-400 hover:underline break-all font-black"
                >
                  {chunk.text}
                </a>
              ) : (
                chunk.text
              )
            )}
          </p>
        );
      })}
    </div>
  );
}
