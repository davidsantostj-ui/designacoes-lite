import React from 'react';
import { ChevronLeft } from 'lucide-react';

const PageHeader = ({ eyebrow = '', title, description = '', onBack, actions = null }) => (
  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
    <div className="min-w-0">
      <div className="flex flex-wrap items-center gap-2">
        {typeof onBack === 'function' && (
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-slate-600 dark:bg-navy-800 dark:text-slate-200"
          >
            <ChevronLeft size={14} />
            Voltar
          </button>
        )}
        {eyebrow ? (
          <span className="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 dark:bg-navy-800 dark:text-slate-300">
            {eyebrow}
          </span>
        ) : null}
      </div>
      <h2 className="mt-3 text-2xl font-black tracking-tight text-slate-900 dark:text-white">
        {title}
      </h2>
      {description ? (
        <p className="mt-1 max-w-[60ch] text-sm leading-snug text-slate-500 dark:text-slate-300">
          {description}
        </p>
      ) : null}
    </div>

    {actions ? <div className="flex shrink-0 flex-wrap gap-2">{actions}</div> : null}
  </div>
);

export default PageHeader;
