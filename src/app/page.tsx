'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { ActiveTab, FilterState, FormItem, ResponseItem, User } from '@/types';
import { DEFAULT_FORMS, DEFAULT_RESPONSES } from '@/lib/data';
import { storage } from '@/lib/storage';
import { supabase } from '@/lib/supabase';
import {
  initRealtimeDesk,
  broadcastCheckIn,
  broadcastSheetsSync,
  RealtimeStatus
} from '@/lib/realtime';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { EventsOverview } from '@/components/EventsOverview';
import { DeskView } from '@/components/DeskView';
import { AITableAnalyzer } from '@/components/AITableAnalyzer';
import { AttendeeModal } from '@/components/AttendeeModal';
import { AddFormModal } from '@/components/AddFormModal';
import { AuthScreen } from '@/components/AuthScreen';
import { Check, Info } from 'lucide-react';

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');
  const [forms, setForms] = useState<FormItem[]>(DEFAULT_FORMS);
  const [responses, setResponses] = useState<ResponseItem[]>(DEFAULT_RESPONSES);
  const [selectedAttendee, setSelectedAttendee] = useState<ResponseItem | null>(null);
  const [isAddFormOpen, setIsAddFormOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [realtimeStatus, setRealtimeStatus] = useState<RealtimeStatus>('connecting');
  const [onlineCount, setOnlineCount] = useState<number>(1);

  const [filters, setFilters] = useState<FilterState>({
    query: '',
    event: '',
    category: '',
    attendance: 'all',
    sortBy: 'submitted_desc'
  });

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2500);
  }, []);

  // Initialize on mount
  useEffect(() => {
    // Theme
    const savedTheme = storage.get<'light' | 'dark'>('gf_theme', 'light');
    setTheme(savedTheme);
    document.documentElement.setAttribute('data-theme', savedTheme);

    // Check session via unified API Route /api/auth/me
    fetch('/api/auth/me')
      .then(res => res.ok ? res.json() : null)
      .then(d => {
        if (d?.ok && d.user) {
          setUser(d.user);
          storage.set('gf_user', d.user);
        }
      })
      .catch(() => { });

    // Load initial forms & responses from /api/responses
    fetch('/api/responses')
      .then(res => res.ok ? res.json() : null)
      .then(d => {
        if (d?.responses && d.responses.length > 0) {
          setResponses(d.responses);
        }
        if (d?.forms && d.forms.length > 0) {
          setForms(d.forms.map((f: { id: string; name: string; category: string; sheetId?: string; sheet_id?: string; url?: string }) => ({
            id: f.id,
            name: f.name,
            category: f.category,
            sheet_id: f.sheetId || f.sheet_id || '',
            url: f.url
          })));
        }
        // Background live sync to pull latest registrations from Google Sheets
        fetch('/api/responses?sync=1')
          .then(sr => sr.ok ? sr.json() : null)
          .then(sd => {
            if (sd?.responses && sd.responses.length > 0) {
              setResponses(sd.responses);
            }
          })
          .catch(() => {});
      })
      .catch(() => { });

    // Auto-poll live responses every 45s and on window focus
    const pollLive = () => {
      fetch('/api/responses?sync=1')
        .then(res => res.ok ? res.json() : null)
        .then(d => {
          if (d?.responses && d.responses.length > 0) {
            setResponses(d.responses);
          }
        })
        .catch(() => {});
    };

    const intervalId = setInterval(pollLive, 45000);
    window.addEventListener('focus', pollLive);

    // Custom forms fallback
    const customForms = storage.get<FormItem[]>('gf_custom_forms', []);
    if (customForms.length > 0) {
      setForms(prev => [...prev, ...customForms]);
    }

    // Attendance map
    const attendanceMap = storage.get<Record<string, { checked_in: boolean; checked_in_at: string }>>('gf_attendance', {});
    setResponses(prev => prev.map(r => {
      if (attendanceMap[r.id]) {
        return {
          ...r,
          checked_in: attendanceMap[r.id].checked_in,
          checked_in_at: attendanceMap[r.id].checked_in_at
        };
      }
      return r;
    }));

    // Session restore fallback from storage or Supabase
    const savedUser = storage.get<User | null>('gf_user', null);
    if (savedUser) {
      setUser(savedUser);
    } else if (supabase) {
      supabase.auth.getSession().then(({ data }) => {
        if (data?.session?.user) {
          const authUser: User = {
            email: data.session.user.email || 'organizer@event.com',
            id: data.session.user.id,
            role: 'Organizer'
          };
          setUser(authUser);
          storage.set('gf_user', authUser);
        }
      }).catch(() => { });
    }

    setMounted(true);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener('focus', pollLive);
    };
  }, []);

  // Supabase Realtime multi-device synchronization
  useEffect(() => {
    if (!mounted) return;

    const unsubscribeRealtime = initRealtimeDesk(
      {
        onCheckInUpdate: (payload) => {
          setResponses(prev =>
            prev.map(r => {
              if (r.id === payload.id) {
                return {
                  ...r,
                  checked_in: payload.checked_in,
                  checked_in_at: payload.checked_in_at
                };
              }
              return r;
            })
          );

          // Update local attendance storage
          const attendanceMap = storage.get<Record<string, { checked_in: boolean; checked_in_at: string }>>('gf_attendance', {});
          attendanceMap[payload.id] = {
            checked_in: payload.checked_in,
            checked_in_at: payload.checked_in_at
          };
          storage.set('gf_attendance', attendanceMap);

          // Update attendee details modal if open
          setSelectedAttendee(prev => {
            if (prev && prev.id === payload.id) {
              return {
                ...prev,
                checked_in: payload.checked_in,
                checked_in_at: payload.checked_in_at
              };
            }
            return prev;
          });

          showToast(
            payload.checked_in
              ? `⚡ Realtime: ${payload.attendeeName || 'Attendee'} checked in by ${payload.volunteer || 'desk'}`
              : `↩ Realtime: Check-in reverted by ${payload.volunteer || 'desk'}`
          );
        },

        onSheetsSync: (payload) => {
          // Another desk device or volunteer refreshed Google Sheets
          fetch('/api/responses?sync=1')
            .then(res => (res.ok ? res.json() : null))
            .then(d => {
              if (d?.responses && d.responses.length > 0) {
                setResponses(d.responses);
                showToast(`⚡ Realtime: Sync triggered by ${payload.initiator || 'desk volunteer'}`);
              }
            })
            .catch(() => {});
        },

        onStatusChange: (status) => {
          setRealtimeStatus(status);
        },

        onPresenceChange: (count) => {
          setOnlineCount(count);
        }
      },
      user ? (user.name || user.email) : undefined
    );

    return () => {
      unsubscribeRealtime();
    };
  }, [mounted, user, showToast]);

  const handleLogin = (newUser: User) => {
    setUser(newUser);
    storage.set('gf_user', newUser);
    showToast(`Signed in as ${newUser.email}`);
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch { }
    if (supabase) {
      try { await supabase.auth.signOut(); } catch { }
    }
    setUser(null);
    storage.remove('gf_user');
    showToast('Signed out');
  };

  const handleToggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    storage.set('gf_theme', next);
    document.documentElement.setAttribute('data-theme', next);
  };

  // Check-In toggle with instant Realtime broadcast
  const handleToggleCheckIn = useCallback((id: string) => {
    let updatedAttendee: ResponseItem | undefined;
    let nextCheckInState = false;
    let checkInTimeStr = '';

    setResponses(prev => {
      const updated = prev.map(r => {
        if (r.id === id) {
          nextCheckInState = !r.checked_in;
          checkInTimeStr = nextCheckInState
            ? new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            : '';
          const resObj = {
            ...r,
            checked_in: nextCheckInState,
            checked_in_at: checkInTimeStr
          };
          updatedAttendee = resObj;
          return resObj;
        }
        return r;
      });

      // Update storage
      const attendanceMap = storage.get<Record<string, { checked_in: boolean; checked_in_at: string }>>('gf_attendance', {});
      if (updatedAttendee) {
        attendanceMap[id] = {
          checked_in: nextCheckInState,
          checked_in_at: checkInTimeStr
        };
        storage.set('gf_attendance', attendanceMap);
      }

      return updated;
    });

    // Broadcast instantaneously to all other desk devices over Supabase Realtime WebSocket
    broadcastCheckIn({
      id,
      checked_in: nextCheckInState,
      checked_in_at: checkInTimeStr,
      volunteer: user?.name || user?.email?.split('@')[0] || 'Desk Volunteer',
      attendeeName: (updatedAttendee as ResponseItem | undefined)?.attendeeName || 'Attendee',
      timestamp: Date.now()
    });

    // Sync with backend /api/attendance
    fetch('/api/attendance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ responseId: id })
    }).catch(() => {});

    // Update selected attendee if open in modal
    setSelectedAttendee(prev => {
      if (prev && prev.id === id) {
        return {
          ...prev,
          checked_in: nextCheckInState,
          checked_in_at: checkInTimeStr
        };
      }
      return prev;
    });
  }, [user]);

  // Add new form
  const handleAddForm = (newForm: FormItem) => {
    const updated = [...forms, newForm];
    setForms(updated);
    const customForms = storage.get<FormItem[]>('gf_custom_forms', []);
    storage.set('gf_custom_forms', [...customForms, newForm]);

    // Persist to unified serverStore via /api/forms
    fetch('/api/forms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: newForm.name,
        category: newForm.category,
        sheetId: newForm.sheet_id,
        url: newForm.url
      })
    }).catch(() => { });

    showToast(`Connected ${newForm.name}`);
  };

  // Sync Google Sheets with broadcast
  const handleSync = async () => {
    setIsSyncing(true);
    try {
      const res = await fetch('/api/responses?sync=1');
      if (res.ok) {
        const d = await res.json();
        if (d.responses && d.responses.length > 0) {
          setResponses(d.responses);
        }
        showToast(d.isLive ? `Live sync complete · ${d.count} registrations` : `Sync complete · ${d.count} registrations`);

        // Broadcast to other devices that sheets were refreshed
        broadcastSheetsSync({
          timestamp: Date.now(),
          updatedCount: d.count,
          initiator: user?.name || user?.email?.split('@')[0] || 'Desk'
        });
      } else {
        showToast('Sync complete');
      }
    } catch {
      showToast('Sync complete');
    } finally {
      setIsSyncing(false);
    }
  };

  // Select event from Overview tabs/cards
  const handleSelectEventFromOverview = useCallback((eventName: string, navigateToDesk = false) => {
    const matchedCat = forms.find(f => f.name.toLowerCase().trim() === eventName.toLowerCase().trim())?.category || '';
    setFilters(prev => ({
      ...prev,
      event: eventName,
      category: matchedCat || prev.category
    }));
    if (navigateToDesk) {
      setActiveTab('desk');
    }
  }, [forms]);

  if (!mounted) {
    return null; // Avoid hydration mismatch
  }

  if (!user) {
    return <AuthScreen onLogin={handleLogin} />;
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex' }}>
      {/* Toast Notification */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          background: 'var(--text-primary)',
          color: 'var(--bg-surface)',
          padding: '10px 16px',
          borderRadius: '8px',
          fontSize: '12.5px',
          fontWeight: 600,
          boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          zIndex: 200,
          animation: 'slideUp 0.2s ease-out'
        }}>
          <Check size={14} color="#10b981" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Modern Left Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        forms={forms}
        selectedEvent={filters.event}
        onSelectEvent={(eventName) => {
          handleSelectEventFromOverview(eventName, true);
        }}
        totalRegistrations={responses.length}
        user={user}
        onLogout={handleLogout}
        onSync={handleSync}
        isSyncing={isSyncing}
        onOpenAddForm={() => setIsAddFormOpen(true)}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
        realtimeStatus={realtimeStatus}
        onlineCount={onlineCount}
      />

      {/* Main Content Pane */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        minWidth: 0,
        height: '100vh',
        overflowY: 'auto'
      }}>
        {/* Top Minimal Header */}
        <Header
          activeTab={activeTab}
          filters={filters}
          setFilters={setFilters}
          forms={forms}
          onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)}
          totalRegistrations={responses.length}
          realtimeStatus={realtimeStatus}
          onlineCount={onlineCount}
        />

        {/* Dynamic View Area */}
        <main style={{ flex: 1, minWidth: 0 }}>
          {activeTab === 'overview' && (
            <EventsOverview
              forms={forms}
              responses={responses}
              selectedEvent={filters.event}
              onSelectEvent={handleSelectEventFromOverview}
              onToggleCheckIn={handleToggleCheckIn}
              onSelectAttendee={(item) => setSelectedAttendee(item)}
            />
          )}
          {activeTab === 'desk' && (
            <DeskView
              responses={responses}
              forms={forms}
              filters={filters}
              onToggleCheckIn={handleToggleCheckIn}
              onSelectAttendee={(item) => setSelectedAttendee(item)}
            />
          )}
          {activeTab === 'ai_table' && (
            <AITableAnalyzer
              responses={responses}
              forms={forms}
            />
          )}
        </main>
      </div>

      {/* Attendee Details Modal */}
      <AttendeeModal
        attendee={selectedAttendee}
        onClose={() => setSelectedAttendee(null)}
        onToggleCheckIn={handleToggleCheckIn}
      />

      {/* Add Form Modal */}
      <AddFormModal
        isOpen={isAddFormOpen}
        onClose={() => setIsAddFormOpen(false)}
        onAddForm={handleAddForm}
      />
    </div>
  );
}

