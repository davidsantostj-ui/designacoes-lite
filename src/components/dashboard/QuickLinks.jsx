import React from 'react';
import { useData } from '../../context/DataStore';
import { Globe, FileBarChart, BookOpen, Video, Link as LinkIcon, Download, MapPin, Search } from 'lucide-react';

const iconMap = {
  Globe,
  FileBarChart,
  BookOpen,
  Video,
  Link: LinkIcon,
  Download,
  MapPin,
  Search
};

export default function QuickLinks() {
  const { quickLinks } = useData();

  if (!quickLinks || quickLinks.length === 0) {
    return (
      <div className="h-full flex items-center justify-center p-4 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700">
        <p className="text-xs text-slate-400 font-bold text-center">Nenhum link configurado.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-3 w-full">
      {quickLinks.slice(0, 6).map((link) => {
        const Icon = iconMap[link.icon] || LinkIcon;
        return (
          <a
            key={link.id}
            href={link.url}
            target="_blank"
            rel="noreferrer"
            className="flex flex-col items-center justify-center p-3.5 rounded-[20px] bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md hover:scale-[1.02] active:scale-95 transition-all group"
          >
            <div className={`p-2.5 rounded-xl mb-2 transition-transform duration-300 group-hover:scale-110 ${link.color}`}>
              <Icon size={20} strokeWidth={2.5} />
            </div>
            <span className="text-[10px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-wider text-center line-clamp-1 w-full px-1 leading-normal">
              {link.label}
            </span>
          </a>
        );
      })}
    </div>
  );
}
