'use client';

import React, { useState } from 'react';
import { FormItem } from '@/types';
import { X, Plus, FileSpreadsheet } from 'lucide-react';

interface AddFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddForm: (form: FormItem) => void;
}

const CATEGORIES = [
  'Esports',
  'Gaming',
  'Hackathon',
  'Technical',
  'Design',
  'Management',
  'Cultural'
];

export const AddFormModal: React.FC<AddFormModalProps> = ({
  isOpen,
  onClose,
  onAddForm
}) => {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Technical');
  const [sheetInput, setSheetInput] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const trimmedName = name.trim();
    const trimmedInput = sheetInput.trim();

    if (!trimmedName) {
      setError('Please provide an event name.');
      return;
    }
    if (!trimmedInput) {
      setError('Please enter a Google Sheet URL or ID.');
      return;
    }

    // Extract spreadsheet ID from link if full URL was pasted
    let sheetId = trimmedInput;
    const match = trimmedInput.match(/\/d\/([a-zA-Z0-9-_]+)/);
    if (match && match[1]) {
      sheetId = match[1];
    }

    const newForm: FormItem = {
      id: Math.random().toString(36).substring(2, 12),
      name: trimmedName,
      category,
      sheet_id: sheetId,
      url: trimmedInput.startsWith('http') ? trimmedInput : `https://docs.google.com/spreadsheets/d/${sheetId}`
    };

    onAddForm(newForm);
    setName('');
    setSheetInput('');
    onClose();
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(15, 23, 42, 0.65)',
      backdropFilter: 'blur(3px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      zIndex: 100
    }} onClick={onClose}>
      <div style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border)',
        borderRadius: '12px',
        width: '100%',
        maxWidth: '480px',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.2)',
        overflow: 'hidden'
      }} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'var(--bg-subtle)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileSpreadsheet size={18} color="var(--accent)" />
            <h2 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
              Connect Google Form Sheet
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-dim)',
              cursor: 'pointer',
              padding: '4px',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ padding: '20px' }}>
          {error && (
            <div style={{
              padding: '8px 12px',
              background: 'var(--danger-bg)',
              color: 'var(--danger)',
              border: '1px solid var(--danger)',
              borderRadius: '6px',
              fontSize: '12px',
              marginBottom: '14px'
            }}>
              {error}
            </div>
          )}

          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '5px' }}>
              Event Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. AI Hackathon 2026"
              required
              style={{
                width: '100%',
                padding: '8px 12px',
                fontSize: '13px',
                borderRadius: '6px',
                border: '1px solid var(--border)',
                background: 'var(--bg-surface)',
                color: 'var(--text-primary)',
                outline: 'none'
              }}
            />
          </div>

          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '5px' }}>
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                fontSize: '13px',
                borderRadius: '6px',
                border: '1px solid var(--border)',
                background: 'var(--bg-surface)',
                color: 'var(--text-primary)',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              {CATEGORIES.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '5px' }}>
              Google Sheets Link or ID
            </label>
            <input
              type="text"
              value={sheetInput}
              onChange={(e) => setSheetInput(e.target.value)}
              placeholder="https://docs.google.com/spreadsheets/d/1zW0iPE3c... or Sheet ID"
              required
              style={{
                width: '100%',
                padding: '8px 12px',
                fontSize: '12.5px',
                borderRadius: '6px',
                border: '1px solid var(--border)',
                background: 'var(--bg-surface)',
                color: 'var(--text-primary)',
                outline: 'none',
                fontFamily: 'monospace'
              }}
            />
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
              Tip: In Google Forms, go to <strong>Responses → Link to Sheets</strong> to create or find this spreadsheet.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '8px 14px',
                borderRadius: '6px',
                border: '1px solid var(--border)',
                background: 'var(--bg-surface)',
                color: 'var(--text-secondary)',
                fontSize: '12px',
                fontWeight: 500,
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{
                padding: '8px 16px',
                borderRadius: '6px',
                border: 'none',
                background: 'var(--accent)',
                color: '#ffffff',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px'
              }}
            >
              <Plus size={14} />
              <span>Connect Sheet</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

