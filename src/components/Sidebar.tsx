'use client';

import React from 'react';
import { ActiveTab, FormItem, User } from '@/types';
import { RealtimeStatus } from '@/lib/realtime';
import {
  LayoutDashboard,
  Users,
  Bot,
  RotateCw,
  Plus,
  Sun,
  Moon,
  LogOut,
  Radio,
  X,
  ChevronRight,
  Wifi
} from 'lucide-react';

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  forms: FormItem[];
  selectedEvent: string;
  onSelectEvent: (eventName: string) => void;
  totalRegistrations: number;
  user: User;
  onLogout: () => void;
  onSync: () => void;
  isSyncing: boolean;
  onOpenAddForm: () => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
  realtimeStatus?: RealtimeStatus;
  onlineCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  forms,
  selectedEvent,
  onSelectEvent,
  totalRegistrations,
  user,
  onLogout,
  onSync,
  isSyncing,
  onOpenAddForm,
  theme,
  onToggleTheme,
  isMobileOpen,
  onCloseMobile,
  realtimeStatus = 'connected',
  onlineCount = 1
}) => {
  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          onClick={onCloseMobile}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 49,
            display: 'block'
          }}
        />
      )}

      {/* Sidebar Container */}
      <aside
        style={{
          width: '250px',
          height: '100vh',
          position: 'sticky',
          top: 0,
          background: 'var(--bg-surface)',
          borderRight: '1px solid var(--border)',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 50,
          flexShrink: 0,
          transition: 'transform 0.2s ease-in-out'
        }}
        className={isMobileOpen ? 'sidebar-mobile-open' : 'sidebar-desktop'}
      >
        {/* Brand / Logo Header */}
        <div style={{
          padding: '16px 18px',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
            <div style={{
              width: '28px',
              height: '28px',
              borderRadius: '7px',
              background: 'linear-gradient(135deg, var(--accent) 0%, #004ecc 100%)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: '15px',
              boxShadow: '0 2px 5px rgba(0, 98, 255, 0.25)'
            }}>
              G
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontWeight: 700, fontSize: '14.5px', letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
                  Genesis Forms
                </span>
                <span className="pulse-dot" title="Live Google Sheets sync active"></span>
              </div>
              <div style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>
                Event Desk 2026
              </div>
            </div>
          </div>

          {/* Close button on mobile */}
          <button
            type="button"
            onClick={onCloseMobile}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              display: isMobileOpen ? 'flex' : 'none',
              alignItems: 'center'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Navigation Area */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '14px 10px',
          display: 'flex',
          flexDirection: 'column',
          gap: '18px'
        }}>
          {/* Main Navigation Section */}
          <div>
            <div style={{
              fontSize: '10.5px',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              color: 'var(--text-dim)',
              padding: '0 10px 8px'
            }}>
              Views
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
              {/* Dashboard Tab */}
              <button
                type="button"
                onClick={() => {
                  setActiveTab('overview');
                  onCloseMobile();
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 12px',
                  borderRadius: '7px',
                  border: 'none',
                  background: activeTab === 'overview' ? 'var(--accent-light)' : 'transparent',
                  color: activeTab === 'overview' ? 'var(--accent)' : 'var(--text-secondary)',
                  fontWeight: activeTab === 'overview' ? 600 : 500,
                  fontSize: '12.5px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'background 0.12s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
                  <LayoutDashboard size={15} color={activeTab === 'overview' ? 'var(--accent)' : 'var(--text-muted)'} />
                  <span>Dashboard</span>
                </div>
                {activeTab === 'overview' && (
                  <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: 'var(--accent)' }}></span>
                )}
              </button>

              {/* Desk Tab */}
              <button
                type="button"
                onClick={() => {
                  setActiveTab('desk');
                  onCloseMobile();
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 12px',
                  borderRadius: '7px',
                  border: 'none',
                  background: activeTab === 'desk' ? 'var(--accent-light)' : 'transparent',
                  color: activeTab === 'desk' ? 'var(--accent)' : 'var(--text-secondary)',
                  fontWeight: activeTab === 'desk' ? 600 : 500,
                  fontSize: '12.5px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'background 0.12s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
                  <Users size={15} color={activeTab === 'desk' ? 'var(--accent)' : 'var(--text-muted)'} />
                  <span>Check-In Desk</span>
                </div>
                <span style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  padding: '1px 6px',
                  borderRadius: '10px',
                  background: activeTab === 'desk' ? 'var(--accent)' : 'var(--bg-subtle)',
                  color: activeTab === 'desk' ? '#ffffff' : 'var(--text-muted)',
                  border: activeTab === 'desk' ? 'none' : '1px solid var(--border)'
                }}>
                  {totalRegistrations}
                </span>
              </button>

              {/* AI Table Tab */}
              <button
                type="button"
                onClick={() => {
                  setActiveTab('ai_table');
                  onCloseMobile();
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 12px',
                  borderRadius: '7px',
                  border: 'none',
                  background: activeTab === 'ai_table' ? 'var(--accent-light)' : 'transparent',
                  color: activeTab === 'ai_table' ? 'var(--accent)' : 'var(--text-secondary)',
                  fontWeight: activeTab === 'ai_table' ? 600 : 500,
                  fontSize: '12.5px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'background 0.12s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
                  <Bot size={15} color={activeTab === 'ai_table' ? 'var(--accent)' : 'var(--text-muted)'} />
                  <span>AI Table</span>
                </div>
                {activeTab === 'ai_table' && (
                  <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: 'var(--accent)' }}></span>
                )}
              </button>
            </div>
          </div>

          {/* Linked Events Directory */}
          <div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0 10px 8px'
            }}>
              <span style={{
                fontSize: '10.5px',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                color: 'var(--text-dim)'
              }}>
                Event Sheets ({forms.length})
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', maxHeight: '280px', overflowY: 'auto' }}>
              {forms.map(form => {
                const isSelected = selectedEvent.toLowerCase().trim() === form.name.toLowerCase().trim();
                return (
                  <button
                    key={form.id}
                    type="button"
                    onClick={() => {
                      onSelectEvent(form.name);
                      onCloseMobile();
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '6px 10px',
                      borderRadius: '6px',
                      border: 'none',
                      background: isSelected ? 'var(--bg-hover)' : 'transparent',
                      color: isSelected ? 'var(--accent)' : 'var(--text-secondary)',
                      fontSize: '11.5px',
                      fontWeight: isSelected ? 600 : 400,
                      cursor: 'pointer',
                      textAlign: 'left',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}
                  >
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '170px' }}>
                      {form.name}
                    </span>
                    {isSelected && (
                      <ChevronRight size={12} color="var(--accent)" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Bottom Utility Controls */}
        <div style={{
          padding: '12px 14px',
          borderTop: '1px solid var(--border)',
          background: 'var(--bg-subtle)',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}>
          {/* Action Row: Sync & Add Form */}
          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              type="button"
              onClick={onSync}
              disabled={isSyncing}
              title="Pull latest submissions from Google Sheets"
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                padding: '6px 10px',
                borderRadius: '6px',
                border: '1px solid var(--border)',
                background: 'var(--bg-surface)',
                color: 'var(--text-secondary)',
                fontSize: '11.5px',
                fontWeight: 600,
                cursor: isSyncing ? 'not-allowed' : 'pointer',
                opacity: isSyncing ? 0.6 : 1
              }}
            >
              <RotateCw size={12} style={{ animation: isSyncing ? 'spin 1s linear infinite' : 'none' }} />
              <span>{isSyncing ? 'Syncing...' : 'Sync'}</span>
            </button>

            <button
              type="button"
              onClick={onOpenAddForm}
              title="Connect a new Google Form Sheet"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '6px 9px',
                borderRadius: '6px',
                border: '1px solid var(--border)',
                background: 'var(--bg-surface)',
                color: 'var(--accent)',
                cursor: 'pointer'
              }}
            >
              <Plus size={13} />
            </button>

            <button
              type="button"
              onClick={onToggleTheme}
              title={theme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '6px 9px',
                borderRadius: '6px',
                border: '1px solid var(--border)',
                background: 'var(--bg-surface)',
                color: 'var(--text-secondary)',
                cursor: 'pointer'
              }}
            >
              {theme === 'dark' ? <Sun size={13} /> : <Moon size={13} />}
            </button>
          </div>

          {/* Realtime Status Indicator */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '5px 8px',
            borderRadius: '6px',
            background: realtimeStatus === 'connected' ? 'rgba(16, 185, 129, 0.06)' : 'var(--bg-surface)',
            border: `1px solid ${realtimeStatus === 'connected' ? 'rgba(16, 185, 129, 0.25)' : 'var(--border)'}`,
            fontSize: '11px',
            color: 'var(--text-secondary)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  backgroundColor: realtimeStatus === 'connected' ? '#10b981' : realtimeStatus === 'connecting' ? '#f59e0b' : '#9ca3af',
                  boxShadow: realtimeStatus === 'connected' ? '0 0 6px #10b981' : 'none',
                  display: 'inline-block'
                }}
              />
              <span style={{
                fontWeight: 600,
                fontSize: '10.5px',
                color: realtimeStatus === 'connected' ? '#059669' : 'var(--text-secondary)'
              }}>
                {realtimeStatus === 'connected' ? 'Supabase Realtime' : realtimeStatus === 'connecting' ? 'Connecting Realtime...' : 'Offline Polling'}
              </span>
            </div>
            <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
              {onlineCount} {onlineCount === 1 ? 'device' : 'devices'}
            </span>
          </div>

          {/* User Account Item */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '6px 8px',
            borderRadius: '6px',
            background: 'var(--bg-surface)',
            border: '1px solid var(--border)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
              <div style={{
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                background: 'var(--accent)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '11px',
                fontWeight: 700,
                flexShrink: 0
              }}>
                {(user.email || 'O')[0].toUpperCase()}
              </div>
              <div style={{ overflow: 'hidden' }}>
                <div style={{
                  fontSize: '11.5px',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  maxWidth: '125px'
                }}>
                  {user.name || user.email.split('@')[0]}
                </div>
                <div style={{ fontSize: '10px', color: 'var(--text-dim)' }}>
                  {user.role || 'Organizer'}
                </div>
              </div>
            </div>

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
                padding: '3px'
              }}
            >
              <LogOut size={13} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

