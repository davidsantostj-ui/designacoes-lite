import React, { useRef, useEffect, useState } from 'react';
import { Bold, Italic, Underline, Palette, Type, Type as TypeIcon, Eraser, Trash2, HelpCircle } from 'lucide-react';

const COLORS = [
  { name: 'Padrão', value: '#0f172a' }, // Slate-900
  { name: 'Azul', value: '#2563eb' },   // Blue-600
  { name: 'Verde', value: '#059669' },  // Emerald-600
  { name: 'Vermelho', value: '#dc2626' }, // Red-600
  { name: 'Laranja', value: '#ea580c' }, // Orange-600
  { name: 'Roxo', value: '#7c3aed' },    // Purple-600
  { name: 'Índigo', value: '#4f46e5' },  // Indigo-600
  { name: 'Cinza', value: '#475569' }    // Slate-600
];

const FONT_SIZES = [
  { label: 'Pequeno', value: '2' },
  { label: 'Normal', value: '3' },
  { label: 'Grande', value: '4' },
  { label: 'Muito Grande', value: '5' }
];

const FONT_FAMILIES = [
  { label: 'Padrão', value: 'Inter, system-ui, sans-serif' },
  { label: 'Serifa', value: 'Georgia, Cambria, serif' },
  { label: 'Mono', value: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace' }
];

export default function RichTextEditor({ value, onChange, placeholder = 'Escreva com formatação...' }) {
  const editorRef = useRef(null);
  const [showColors, setShowColors] = useState(false);
  const [showSizes, setShowSizes] = useState(false);
  const [showFonts, setShowFonts] = useState(false);

  // Synchronize incoming value only when editor's innerHTML differs from the value prop
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value || '';
    }
  }, [value]);

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const exec = (command, val = null) => {
    document.execCommand(command, false, val);
    handleInput();
    if (editorRef.current) {
      editorRef.current.focus();
    }
  };

  return (
    <div className="w-full flex flex-col rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition-all">
      {/* Editor Toolbar */}
      <div className="flex flex-wrap items-center gap-1 p-2 bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 select-none">
        
        <button
          type="button"
          onClick={() => exec('bold')}
          className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
          title="Negrito"
        >
          <Bold size={16} strokeWidth={2.5} />
        </button>

        <button
          type="button"
          onClick={() => exec('italic')}
          className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
          title="Itálico"
        >
          <Italic size={16} strokeWidth={2.5} />
        </button>

        <button
          type="button"
          onClick={() => exec('underline')}
          className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
          title="Sublinhado"
        >
          <Underline size={16} strokeWidth={2.5} />
        </button>

        <div className="w-px h-5 bg-slate-200 dark:bg-slate-800 mx-1"></div>

        {/* Cores */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setShowColors(!showColors);
              setShowSizes(false);
              setShowFonts(false);
            }}
            className={`p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-200 transition-colors flex items-center gap-1 ${showColors ? 'bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200' : ''}`}
            title="Cor do Texto"
          >
            <Palette size={16} />
          </button>
          
          {showColors && (
            <div className="absolute top-full left-0 mt-1 z-50 p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl flex gap-1.5 items-center animate-fade-in">
              {COLORS.map(color => (
                <button
                  key={color.value}
                  type="button"
                  onClick={() => {
                    exec('foreColor', color.value);
                    setShowColors(false);
                  }}
                  className="w-5.5 h-5.5 rounded-full border border-slate-300 dark:border-slate-700 hover:scale-110 active:scale-95 transition-all"
                  style={{ backgroundColor: color.value }}
                  title={color.name}
                />
              ))}
            </div>
          )}
        </div>

        {/* Tamanho da Fonte */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setShowSizes(!showSizes);
              setShowColors(false);
              setShowFonts(false);
            }}
            className={`p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-200 transition-colors flex items-center gap-1 ${showSizes ? 'bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200' : ''}`}
            title="Tamanho da Fonte"
          >
            <Type size={16} />
          </button>
          
          {showSizes && (
            <div className="absolute top-full left-0 mt-1 z-50 py-1.5 w-32 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl flex flex-col animate-fade-in">
              {FONT_SIZES.map(size => (
                <button
                  key={size.value}
                  type="button"
                  onClick={() => {
                    exec('fontSize', size.value);
                    setShowSizes(false);
                  }}
                  className="px-3 py-1.5 text-xs text-left hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold"
                >
                  {size.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Tipo da Fonte */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setShowFonts(!showFonts);
              setShowColors(false);
              setShowSizes(false);
            }}
            className={`p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-200 transition-colors flex items-center gap-1 ${showFonts ? 'bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200' : ''}`}
            title="Estilo da Fonte"
          >
            <TypeIcon size={16} className="rotate-90" />
          </button>
          
          {showFonts && (
            <div className="absolute top-full left-0 mt-1 z-50 py-1.5 w-32 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl flex flex-col animate-fade-in">
              {FONT_FAMILIES.map(font => (
                <button
                  key={font.value}
                  type="button"
                  onClick={() => {
                    exec('fontName', font.value);
                    setShowFonts(false);
                  }}
                  className="px-3 py-1.5 text-xs text-left hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold"
                  style={{ fontFamily: font.value }}
                >
                  {font.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="w-px h-5 bg-slate-200 dark:bg-slate-800 mx-1"></div>

        <button
          type="button"
          onClick={() => exec('removeFormat')}
          className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
          title="Limpar Formatação"
        >
          <Eraser size={16} />
        </button>

      </div>

      {/* Editor Content Area */}
      <div 
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        placeholder={placeholder}
        className="flex-1 min-h-[140px] max-h-[250px] overflow-y-auto p-4 text-sm outline-none dark:text-slate-200 focus:bg-white dark:focus:bg-slate-900/80 transition-all font-medium leading-relaxed select-text cursor-text"
        style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
      />
    </div>
  );
}
