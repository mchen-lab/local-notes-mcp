import React from 'react';
import { Bold, Italic, List, Link, Code, Heading, Quote, Image, Strikethrough, Smile } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import EmojiPicker from 'emoji-picker-react';

export function MarkdownToolbar({ textareaRef, value, setValue }) {
  const insertText = (before, after = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    
    // Check if we are "toggling" off (rudimentary check)
    // For now, just simple insertion/wrapping
    
    const newText = value.substring(0, start) + before + selectedText + after + value.substring(end);
    
    // We update the parent state
    setValue(newText);
    
    // We need to restore focus and selection. 
    // Since React state update is async, we use setTimeout to run this after render
    setTimeout(() => {
        textarea.focus();
        // If we wrapped text, select the wrapped text (inner). 
        // If we just inserted (empty selection), put cursor between tags.
        const newCursorPos = start + before.length;
        if (selectedText.length > 0) {
            textarea.setSelectionRange(newCursorPos, newCursorPos + selectedText.length);
        } else {
            textarea.setSelectionRange(newCursorPos, newCursorPos);
        }
    }, 0);
  };

  const onEmojiClick = (emojiData) => {
    insertText(emojiData.emoji);
  };

  return (
    <div className="flex items-center gap-0.5 p-1 border-b bg-muted/40 overflow-x-auto">
      <ToolbarButton icon={<Bold className="w-4 h-4" />} onClick={() => insertText('**', '**')} tooltip="Bold" />
      <ToolbarButton icon={<Italic className="w-4 h-4" />} onClick={() => insertText('*', '*')} tooltip="Italic" />
      <ToolbarButton icon={<Strikethrough className="w-4 h-4" />} onClick={() => insertText('~~', '~~')} tooltip="Strikethrough" />
      <div className="w-px h-4 bg-border mx-1 shrink-0" />
      <ToolbarButton icon={<Heading className="w-4 h-4" />} onClick={() => insertText('### ')} tooltip="Heading" />
      <ToolbarButton icon={<List className="w-4 h-4" />} onClick={() => insertText('- ')} tooltip="List" />
      <ToolbarButton icon={<Quote className="w-4 h-4" />} onClick={() => insertText('> ')} tooltip="Quote" />
      <div className="w-px h-4 bg-border mx-1 shrink-0" />
      <ToolbarButton icon={<Code className="w-4 h-4" />} onClick={() => insertText('`', '`')} tooltip="Inline Code" />
      <ToolbarButton icon={<div className="font-mono text-[10px] items-center flex font-bold">&lt;/&gt;</div>} onClick={() => insertText('```\n', '\n```')} tooltip="Code Block" />
      <ToolbarButton icon={<Link className="w-4 h-4" />} onClick={() => insertText('[', '](url)')} tooltip="Link" />
      <ToolbarButton icon={<Image className="w-4 h-4" />} onClick={() => insertText('![alt](', ')')} tooltip="Image" />
      <div className="w-px h-4 bg-border mx-1 shrink-0" />
      <Popover>
        <PopoverTrigger asChild>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 hover:bg-muted" 
            title="Emoji"
            type="button"
          >
            <Smile className="w-4 h-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 border-none" align="start">
          <EmojiPicker onEmojiClick={onEmojiClick} />
        </PopoverContent>
      </Popover>
    </div>
  );
}

function ToolbarButton({ icon, onClick, tooltip }) {
    return (
        <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 hover:bg-muted" 
            onClick={onClick}
            title={tooltip}
            type="button" // Prevent form submission if inside form
            tabIndex={-1}
        >
            {icon}
        </Button>
    )
}
