import React from 'react';
import { 
  FileText, 
  FileSpreadsheet, 
  FileImage, 
  FileCode, 
  File as FileGeneric, 
  Download, 
  ExternalLink 
} from 'lucide-react';
import { SmartschoolAttachment } from '../../../types/school';

interface AttachmentCardProps {
  attachment: SmartschoolAttachment;
}

export const AttachmentCard: React.FC<AttachmentCardProps> = ({ attachment }) => {
  const getFileIcon = () => {
    const ext = attachment.name.split('.').pop()?.toLowerCase() || '';
    const mime = attachment.mime.toLowerCase();

    if (ext === 'pdf' || mime.includes('pdf')) {
      return <FileText className="w-5 h-5 text-rose-500" />;
    }
    if (['doc', 'docx'].includes(ext) || mime.includes('word') || mime.includes('document')) {
      return <FileText className="w-5 h-5 text-blue-600" />;
    }
    if (['xls', 'xlsx', 'csv'].includes(ext) || mime.includes('sheet') || mime.includes('excel')) {
      return <FileSpreadsheet className="w-5 h-5 text-emerald-600" />;
    }
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext) || mime.includes('image')) {
      return <FileImage className="w-5 h-5 text-amber-500" />;
    }
    if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) {
      return <FileCode className="w-5 h-5 text-purple-600" />;
    }
    return <FileGeneric className="w-5 h-5 text-slate-500" />;
  };

  const directDownloadUrl = `/?module=Messages&file=download&fileID=${attachment.fileID}`;
  const wopiUrl = `/?module=Messages&file=wopi&fileID=${attachment.fileID}`;

  return (
    <div className="flex items-center justify-between p-3 rounded-card bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 hover:border-indigo-300 dark:hover:border-indigo-700/70 transition-all duration-200 group">
      <div className="flex items-center gap-3 min-w-0 pr-2">
        <div className="w-10 h-10 rounded-input bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-700 flex items-center justify-center shrink-0 shadow-subtle">
          {getFileIcon()}
        </div>
        <div className="min-w-0">
          <p className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
            {attachment.name}
          </p>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
            {attachment.size || 'Fichier joint'}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        {attachment.wopiAllowed && (
          <a
            href={wopiUrl}
            target="_blank"
            rel="noopener noreferrer"
            title="Aperçu Office 365"
            className="p-2 rounded-input text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-white dark:hover:bg-slate-700/70 border border-transparent hover:border-slate-200/80 dark:hover:border-slate-600 transition-all m3-press active:scale-[0.97]"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        )}

        <a
          href={directDownloadUrl}
          download={attachment.name}
          title="Télécharger le fichier"
          className="p-2 rounded-input text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-white dark:hover:bg-slate-700/70 border border-transparent hover:border-slate-200/80 dark:hover:border-slate-600 transition-all m3-press active:scale-[0.97]"
        >
          <Download className="w-4 h-4" />
        </a>
      </div>
    </div>
  );
};
