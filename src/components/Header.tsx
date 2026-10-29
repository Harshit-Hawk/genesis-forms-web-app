'use client';

import React from 'react';
import { ActiveTab, FilterState, FormItem } from '@/types';
import { RealtimeStatus } from '@/lib/realtime';
import {
  Menu,
  Search,
  SlidersHorizontal,
  Users,
  Radio
} from 'lucide-react';

interface HeaderProps {
  activeTab: ActiveTab;
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  forms: FormItem[];
  onOpenMobileSidebar: () => void;
  totalRegistrations: number;
  realtimeStatus?: RealtimeStatus;
  onlineCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  filters,
  setFilters,
  forms,
  onOpenMobileSidebar,
  totalRegistrations,
  realtimeStatus = 'connected',
  onlineCount = 1
}) => {
  const categories = Array.from(new Set(forms.map(f => f.category))).sort();

  return (
    <header style={{
      background: 'var(--bg-surface)',
      borderBottom: '1px solid var(--border)',
      position: 'sticky',
      top: 0,
      zIndex: 30
    }}>
      {/* Top Header Row */}
      <div style={{
        padding: '10px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        minHeight: '52px',
        gap: '12px'
      }}>
        {/* Left: Mobile Toggle & Page Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            type="button"
            onClick={onOpenMobileSidebar}
            className="mobile-menu-toggle"
            title="Open Navigation Menu"
            style={{
              background: 'transparent',
              border: '1px solid var(--border)',
              borderRadius: '6px',
              padding: '6px',
              cursor: 'pointer',
              color: 'var(--text-secondary)',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Menu size={16} />
          </button>

          <div>
            <h1 style={{
              fontSize: '14.5px',
              fontWeight: 700,
              color: 'var(--text-primary)',
              letterSpacing: '-0.01em',
              margin: 0
            }}>
              {activeTab === 'overview' && 'Dashboard Overview'}
              {activeTab === 'desk' && 'Attendee Check-In Desk'}
              {activeTab === 'ai_table' && 'AI Table & Venue Projections'}
            </h1>
          </div>
        </div>

        {/* Right: Realtime Status Pill */}
        <div
          title={
            realtimeStatus === 'connected'
              ? `Supabase Realtime WebSocket Active • ${onlineCount} desk device${onlineCount === 1 ? '' : 's'} connected`
              : realtimeStatus === 'connecting'
              ? 'Connecting to Supabase Realtime WebSocket...'
              : 'Polling live Google Sheets every 45s'
          }
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '7px',
            background: realtimeStatus === 'connected' ? 'rgba(16, 185, 129, 0.08)' : 'var(--bg-subtle)',
            border: `1px solid ${realtimeStatus === 'connected' ? 'rgba(16, 185, 129, 0.3)' : 'var(--border)'}`,
            padding: '4px 10px',
            borderRadius: '20px',
            fontSize: '11.5px',
            color: realtimeStatus === 'connected' ? '#059669' : 'var(--text-secondary)',
            fontWeight: 600,
            flexShrink: 0,
            transition: 'all 0.2s ease'
          }}
        >
          <span
            className={realtimeStatus === 'connected' ? 'pulse-dot' : ''}
            style={{
              width: '7px',
              height: '7px',
              borderRadius: '50%',
              backgroundColor: realtimeStatus === 'connected' ? '#10b981' : realtimeStatus === 'connecting' ? '#f59e0b' : '#6b7280',
              display: 'inline-block'
            }}
          />
          <span className="hide-on-mobile">
            {realtimeStatus === 'connected'
              ? `Realtime Live • ${onlineCount} Online`
              : `${totalRegistrations} Live Registrations`}
          </span>
          <span className="show-on-mobile">
            {realtimeStatus === 'connected' ? `Live (${onlineCount})` : `${totalRegistrations} Live`}
          </span>
        </div>
      </div>

      {/* Desk View Filter Controls Bar (Only shown on Desk tab) */}
      {activeTab === 'desk' && (
        <div style={{
          borderTop: '1px solid var(--border)',
          background: 'var(--bg-subtle)',
          padding: '8px 16px'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            flexWrap: 'wrap'
          }}>
            {/* Search Input */}
            <div style={{ position: 'relative', flex: '1 1 200px', minWidth: '180px' }}>
              <input
                type="text"
                value={filters.query}
                onChange={(e) => setFilters(prev => ({ ...prev, query: e.target.value }))}
                placeholder="Search attendee, team, phone, or UTR..."
                style={{
                  width: '100%',
                  padding: '7px 12px 7px 30px',
                  fontSize: '12px',
                  borderRadius: '6px',
                  border: '1px solid var(--border)',
                  background: 'var(--bg-surface)',
                  color: 'var(--text-primary)',
                  outline: 'none',
                  minHeight: '36px'
                }}
              />
              <Search size={13} style={{ position: 'absolute', left: '9px', top: '11px', color: 'var(--text-dim)' }} />
            </div>

            {/* Dropdowns Container for Mobile Flexibility */}
            <div style={{ display: 'flex', gap: '8px', flex: '1 1 auto', flexWrap: 'wrap' }}>
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
                  flex: '1 1 140px',
                  padding: '7px 10px',
                  fontSize: '12px',
                  borderRadius: '6px',
                  border: '1px solid var(--border)',
                  background: 'var(--bg-surface)',
                  color: 'var(--text-secondary)',
                  outline: 'none',
                  cursor: 'pointer',
                  minHeight: '36px'
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
                  flex: '1 1 120px',
                  padding: '7px 10px',
                  fontSize: '12px',
                  borderRadius: '6px',
                  border: '1px solid var(--border)',
                  background: 'var(--bg-surface)',
                  color: 'var(--text-secondary)',
                  outline: 'none',
                  cursor: 'pointer',
                  minHeight: '36px'
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
                  flex: '1 1 110px',
                  padding: '7px 10px',
                  fontSize: '12px',
                  borderRadius: '6px',
                  border: '1px solid var(--border)',
                  background: 'var(--bg-surface)',
                  color: 'var(--text-secondary)',
                  outline: 'none',
                  cursor: 'pointer',
                  minHeight: '36px'
                }}
              >
                <option value="all">All Status</option>
                <option value="checked_in">Checked In Only</option>
                <option value="pending">Pending Verification</option>
              </select>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

