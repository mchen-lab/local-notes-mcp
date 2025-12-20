import React, { useEffect, useRef } from 'react'

export default function Editor({ title, content, onTitleChange, onContentChange, onSave, onCancel, disabled }) {
  const headerRef = useRef(null)
  const titleRef = useRef(null)

  useEffect(() => {
    if (titleRef.current) {
      titleRef.current.style.height = 'auto'
      titleRef.current.style.height = `${titleRef.current.scrollHeight}px`
    }
    if (headerRef.current) {
      const h = headerRef.current.offsetHeight
      document.documentElement.style.setProperty('--editor-header-height', `${h}px`)
    }
  }, [title])

  return (
    <div className="editor-pane">
      <div className="editor-header" ref={headerRef}>
        <textarea ref={titleRef} className="title-textarea" value={title} onChange={e => onTitleChange(e.target.value)} placeholder="Title" disabled={disabled} rows={3} />
        <div className="editor-actions">
          <button className="btn btn-accent" onClick={onSave} disabled={disabled}>Save</button>
          <button className="btn btn-ghost" onClick={onCancel} disabled={disabled}>Cancel</button>
        </div>
      </div>
      <textarea className="content-input" value={content} onChange={e => onContentChange(e.target.value)} placeholder="Write Markdown" disabled={disabled} />
    </div>
  )
}
