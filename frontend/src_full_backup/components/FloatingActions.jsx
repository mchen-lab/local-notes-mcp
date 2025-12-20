import React, { useState } from 'react';
import {
  ArrowUpIcon,
  ClipboardDocumentIcon,
  ArrowDownTrayIcon,
  PencilSquareIcon,
  TrashIcon,
  PrinterIcon
} from '@heroicons/react/24/outline';

export default function FloatingActions({ content, title, onScrollToTop, onEdit, onDelete }) {
  const [showCopied, setShowCopied] = useState(false);

  const handleCopyToClipboard = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(content || '');
      } else {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = content || '';
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setShowCopied(true);
      setTimeout(() => setShowCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
      alert('Failed to copy to clipboard');
    }
  };

  const handleExportMarkdown = () => {
    const blob = new Blob([content || ''], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title || 'note'}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="floating-actions">
      <button
        className="floating-action-btn"
        onClick={onScrollToTop}
        title="Jump to beginning"
        aria-label="Jump to beginning"
      >
        <ArrowUpIcon className="floating-action-icon" />
      </button>
      <button
        className="floating-action-btn"
        onClick={handleCopyToClipboard}
        title="Copy to clipboard"
        aria-label="Copy to clipboard"
      >
        <ClipboardDocumentIcon className="floating-action-icon" />
      </button>
      <button
        className="floating-action-btn"
        onClick={handleExportMarkdown}
        title="Export markdown file"
        aria-label="Export markdown file"
      >
        <ArrowDownTrayIcon className="floating-action-icon" />
      </button>
      <button
        className="floating-action-btn"
        onClick={handlePrint}
        title="Print"
        aria-label="Print"
      >
        <PrinterIcon className="floating-action-icon" />
      </button>
      <button
        className="floating-action-btn floating-action-btn-accent"
        onClick={onEdit}
        title="Edit"
        aria-label="Edit"
      >
        <PencilSquareIcon className="floating-action-icon" />
      </button>
      <button
        className="floating-action-btn floating-action-btn-destructive"
        onClick={onDelete}
        title="Delete"
        aria-label="Delete"
      >
        <TrashIcon className="floating-action-icon" />
      </button>
      {showCopied && (
        <div className="floating-toast">
          Copied to clipboard!
        </div>
      )}
    </div>
  );
}

