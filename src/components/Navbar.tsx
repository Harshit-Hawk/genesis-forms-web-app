'use client';

import React from 'react';
import { ActiveTab, FilterState, FormItem, User } from '@/types';
import {
  Search,
  RotateCw,
  Plus,
  Sun,
  Moon,
  LogOut,
  LayoutGrid,
  LayoutDashboard,
  Bot
} from 'lucide-react';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  forms: FormItem[];
  user: User;
  onLogout: () => void;
  onSync: () => void;
  isSyncing: boolean;
  onOpenAddForm: () => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  filters,
  setFilters,
  forms,
  user,
  onLogout,
  onSync,
  isSyncing,
  onOpenAddForm,
  theme,
  onToggleTheme
}) => {
  const categories = Array.from(new Set(forms.map(f => f.category))).sort();

  return (
    <header style={{
      background: 'var(--bg-surface)',
      borderBottom: '1px solid var(--border)',
      position: 'sticky',
      top: 0,
      zIndex: 40
    }}>
      {/* Main Bar */}
      <div style={{
        maxWidth: '1440px',
        margin: '0 auto',
        padding: '12px 18px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '14px',
        flexWrap: 'wrap'
      }}>
        {/* Left: Brand + Navigation Tabs */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '28px',
              height: '28px',
              background: 'var(--accent)',
              color: '#ffffff',
              borderRadius: '7px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '14px'
            }}>
              G
            </div>
            <span style={{ fontWeight: 700, fontSize: '15px', letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
              Genesis Forms
            </span>
            <span className="pulse-dot" title="Live Polling Active"></span>
          </div>

          {/* View Mode Switcher */}
          <div style={{
            display: 'flex',
            background: 'var(--bg-subtle)',
            padding: '3px',
            borderRadius: '7px',
            border: '1px solid var(--border)'
          }}>
            <button
              type="button"
              onClick={() => setActiveTab('overview')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '5px 12px',
                fontSize: '12px',
                fontWeight: 600,
                borderRadius: '5px',
                border: 'none',
                cursor: 'pointer',
                background: activeTab === 'overview' ? 'var(--bg-surface)' : 'transparent',
                color: activeTab === 'overview' ? 'var(--accent)' : 'var(--text-muted)',
                boxShadow: activeTab === 'overview' ? '0 1px 2px rgba(0,0,0,0.05)' : 'none'
              }}
            >
              <LayoutDashboard size={13} />
              <span>Dashboard</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('desk')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '5px 12px',
                fontSize: '12px',
                fontWeight: 600,
                borderRadius: '5px',
                border: 'none',
                cursor: 'pointer',
                background: activeTab === 'desk' ? 'var(--bg-surface)' : 'transparent',
                color: activeTab === 'desk' ? 'var(--text-primary)' : 'var(--text-muted)',
                boxShadow: activeTab === 'desk' ? '0 1px 2px rgba(0,0,0,0.05)' : 'none'
              }}
            >
              <LayoutGrid size={13} />
              <span>Desk</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('ai_table')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '5px 12px',
                fontSize: '12px',
                fontWeight: 600,
                borderRadius: '5px',
                border: 'none',
                cursor: 'pointer',
                background: activeTab === 'ai_table' ? 'var(--bg-surface)' : 'transparent',
                color: activeTab === 'ai_table' ? 'var(--accent)' : 'var(--text-muted)',
                boxShadow: activeTab === 'ai_table' ? '0 1px 2px rgba(0,0,0,0.05)' : 'none'
              }}
            >
              <Bot size={13} />
              <span>AI Table</span>
            </button>
          </div>
        </div>

        {/* Right Actions: Sync, Add Form, Theme, Profile */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Sync Button */}
          <button
            type="button"
            onClick={onSync}
            disabled={isSyncing}
            title="Refresh response sheets"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 11px',
              borderRadius: '6px',
              border: '1px solid var(--border)',
              background: 'var(--bg-surface)',
              color: 'var(--text-secondary)',
              fontSize: '12px',
              fontWeight: 500,
              cursor: isSyncing ? 'not-allowed' : 'pointer',
              opacity: isSyncing ? 0.6 : 1
            }}
          >
            <RotateCw size={13} style={{ animation: isSyncing ? 'spin 1s linear infinite' : 'none' }} />
            <span>{isSyncing ? 'Syncing...' : 'Sync'}</span>
          </button>

          {/* Add Form */}
          <button
            type="button"
            onClick={onOpenAddForm}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 11px',
              borderRadius: '6px',
              border: 'none',
              background: 'var(--accent)',
              color: '#ffffff',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            <Plus size={14} />
            <span>Connect Form</span>
          </button>

          {/* Theme Toggle */}
          <button
            type="button"
            onClick={onToggleTheme}
            title={theme === 'dark' ? 'Switch to Light' : 'Switch to Dark'}
            style={{
              padding: '6px 8px',
              borderRadius: '6px',
              border: '1px solid var(--border)',
              background: 'var(--bg-surface)',
              color: 'var(--text-secondary)',
              cursor: 'pointer'
            }}
          >
            {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
          </button>

          {/* User Badge & Logout */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '3px 8px',
            borderRadius: '6px',
            background: 'var(--bg-subtle)',
            border: '1px solid var(--border)'
          }}>
            <div style={{
              width: '22px',
              height: '22px',
              borderRadius: '50%',
              background: 'var(--accent)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '11px',
              fontWeight: 700
            }}>
              {(user.email || 'O')[0].toUpperCase()}
            </div>
            <span style={{ fontSize: '11.5px', color: 'var(--text-secondary)', fontWeight: 500, maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user.email}
            </span>
            <button
              type="button"
              onClick={onLogout}
              title="Sign Out"
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-dim)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                padding: '2px'
              }}
            >
              <LogOut size={13} />
            </button>
          </div>
        </div>
      </div>

      {/* Filter Toolbar (Visible on Desk mode) */}
      {activeTab === 'desk' && (
        <div style={{
          borderTop: '1px solid var(--border)',
          background: 'var(--bg-subtle)',
          padding: '8px 18px'
        }}>
          <div style={{
            maxWidth: '1440px',
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            flexWrap: 'wrap'
          }}>
            {/* Search Input */}
            <div style={{ position: 'relative', flex: '1', minWidth: '220px' }}>
              <input
                type="text"
                value={filters.query}
                onChange={(e) => setFilters(prev => ({ ...prev, query: e.target.value }))}
                placeholder="Search attendee, team, phone, or UTR..."
                style={{
                  width: '100%',
                  padding: '6px 12px 6px 30px',
                  fontSize: '12px',
                  borderRadius: '6px',
                  border: '1px solid var(--border)',
                  background: 'var(--bg-surface)',
                  color: 'var(--text-primary)',
                  outline: 'none'
                }}
              />
              <Search size={13} style={{ position: 'absolute', left: '9px', top: '8px', color: 'var(--text-dim)' }} />
            </div>

            {/* Event Dropdown */}
            <select
              value={filters.event}
              onChange={(e) => {
                const selected = e.target.value;
                const matchedCat = forms.find(f => f.name.toLowerCase() === selected.toLowerCase())?.category || '';
                setFilters(prev => ({
                  ...prev,
                  event: selected,
                  category: selected && matchedCat ? matchedCat : (selected ? '' : prev.category)
                }));
              }}
              style={{
                padding: '6px 10px',
                fontSize: '12px',
                borderRadius: '6px',
                border: '1px solid var(--border)',
                background: 'var(--bg-surface)',
                color: 'var(--text-secondary)',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              <option value="">All Events {filters.category ? `(${forms.filter(f => f.category.toLowerCase().trim() === filters.category.toLowerCase().trim()).length})` : `(${forms.length})`}</option>
              {forms
                .filter(f => !filters.category || f.category.toLowerCase().trim() === filters.category.toLowerCase().trim())
                .map(f => (
                  <option key={f.id} value={f.name}>{f.name}</option>
                ))}
            </select>

            {/* Category Dropdown */}
            <select
              value={filters.category}
              onChange={(e) => {
                const newCat = e.target.value;
                setFilters(prev => ({
                  ...prev,
                  category: newCat,
                  event: (newCat && prev.event && forms.find(f => f.name.toLowerCase().trim() === prev.event.toLowerCase().trim())?.category.toLowerCase().trim() !== newCat.toLowerCase().trim()) ? '' : prev.event
                }));
              }}
              style={{
                padding: '6px 10px',
                fontSize: '12px',
                borderRadius: '6px',
                border: '1px solid var(--border)',
                background: 'var(--bg-surface)',
                color: 'var(--text-secondary)',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              <option value="">All Categories</option>
              {categories.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>

            {/* Status Dropdown */}
            <select
              value={filters.attendance}
              onChange={(e) => setFilters(prev => ({ ...prev, attendance: e.target.value as FilterState['attendance'] }))}
              style={{
                padding: '6px 10px',
                fontSize: '12px',
                borderRadius: '6px',
                border: '1px solid var(--border)',
                background: 'var(--bg-surface)',
                color: 'var(--text-secondary)',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              <option value="all">All Status</option>
              <option value="checked_in">Checked In Only</option>
              <option value="pending">Pending Verification</option>
            </select>
          </div>
        </div>
      )}
    </header>
  );
};

