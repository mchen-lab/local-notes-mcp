import React, { useEffect, useState } from 'react'
import { PlusIcon, ChevronRightIcon, ChevronDownIcon, XMarkIcon, StarIcon } from '@heroicons/react/24/outline'
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid'

export default function NotesList({ notes, selectedId, onSelect, onAdd, searchTerm, onSearchChange, onToggleFavorite, favorOnly, onFavorOnlyChange }) {
  const [expandedMonths, setExpandedMonths] = useState(new Set())

  useEffect(() => {
    const keys = Array.from(new Set(notes.map(n => {
      const d = new Date(n.createdAt)
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    })))
    setExpandedMonths(prev => {
      if (prev.size === 0) return new Set(keys)
      const next = new Set(prev)
      for (const k of keys) next.add(k)
      return next
    })
  }, [notes])

  function toggleMonth(monthKey) {
    setExpandedMonths(prev => {
      const next = new Set(prev)
      if (next.has(monthKey)) next.delete(monthKey)
      else next.add(monthKey)
      return next
    })
  }

  const monthCounts = {}
  for (const n of notes) {
    const d = new Date(n.createdAt)
    const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    monthCounts[k] = (monthCounts[k] || 0) + 1
  }

  const items = []
  let lastMonth = null
  let monthExpanded = true
  for (const n of notes) {
    const d = new Date(n.createdAt)
    const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    if (monthKey !== lastMonth) {
      lastMonth = monthKey
      monthExpanded = expandedMonths.has(monthKey)
      items.push(
        <li
          key={`month-${monthKey}`}
          className="month-divider"
          onClick={() => toggleMonth(monthKey)}
          aria-expanded={String(monthExpanded)}
        >
          <span className="month-left">
            {monthExpanded ? (
              <ChevronDownIcon className="month-arrow" />
            ) : (
              <ChevronRightIcon className="month-arrow" />
            )}
            <span className="month-label">{monthKey}</span>
          </span>
          <span className="month-right">
            <span className="month-count">{monthCounts[monthKey] || 0}</span>
          </span>
        </li>
      )
    }
    if (monthExpanded) {
      items.push(
        <li key={n.id} className={selectedId === n.id ? 'active' : ''}>
          <div className="note-item-content" onClick={() => onSelect(n.id)}>
            <div className="note-title">{n.title}</div>
            <div className="note-time">{new Date(n.createdAt).toLocaleString()}</div>
          </div>
          <div 
            className="note-favorite-star" 
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite(n.id);
            }}
          >
            {n.favorite ? (
              <StarIconSolid className="star-icon star-filled" />
            ) : (
              <StarIcon className="star-icon star-outline" />
            )}
          </div>
        </li>
      )
    }
  }
  return (
    <div className="notes-list">
      <div className="notes-header">
        <div className="search">
          <span className="search-icon">🔍</span>
          <input className="search-input" value={searchTerm} onChange={e => onSearchChange(e.target.value)} placeholder="Search" />
          {searchTerm ? (
            <XMarkIcon className="search-clear" onClick={() => onSearchChange("")} aria-label="Clear" title="Clear" />
          ) : null}
        </div>
        <PlusIcon className="action-icon action-icon-accent" onClick={onAdd} aria-label="Add" title="Add" />
      </div>
      <div className="notes-filter">
        <label className="favor-only-checkbox">
          <input 
            type="checkbox" 
            checked={favorOnly} 
            onChange={e => onFavorOnlyChange(e.target.checked)}
          />
          <span>Favor only</span>
        </label>
      </div>
      <ul>{items}</ul>
    </div>
  )
}
