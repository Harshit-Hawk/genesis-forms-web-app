'use client';

import React, { useState, useMemo } from 'react';
import { FormItem, ResponseItem } from '@/types';
import { VENUE_ALLOCATIONS } from '@/lib/data';
import {
  LayoutDashboard,
  Users,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  MapPin,
  TrendingUp,
  ShieldCheck,
  Search,
  ExternalLink,
  MessageCircle,
  Radio
} from 'lucide-react';

interface EventsOverviewProps {
  forms: FormItem[];
  responses: ResponseItem[];
  selectedEvent: string;
  onSelectEvent: (eventName: string, navigateToDesk?: boolean) => void;
  onToggleCheckIn: (id: string) => void;
  onSelectAttendee: (item: ResponseItem) => void;
}

export const EventsOverview: React.FC<EventsOverviewProps> = ({
  forms,
  responses,
  selectedEvent,
  onSelectEvent,
  onToggleCheckIn,
  onSelectAttendee
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Compute live event statistics
  const eventStatsMap = useMemo(() => {
    const map = new Map<string, {
      total: number;
      checkedIn: number;
      teams: number;
      pending: number;
      percentage: number;
      responses: ResponseItem[];
    }>();

    forms.forEach(f => {
      map.set(f.name.toLowerCase().trim(), {
        total: 0,
        checkedIn: 0,
        teams: 0,
        pending: 0,
        percentage: 0,
        responses: []
      });
    });

    responses.forEach(r => {
      const fn = (r.form || r.formName || '').toLowerCase().trim();
      let stat = map.get(fn);
      if (!stat) {
        stat = { total: 0, checkedIn: 0, teams: 0, pending: 0, percentage: 0, responses: [] };
        map.set(fn, stat);
      }
      stat.total += 1;
      const isChecked = !!(r.checked_in ?? r.checkedIn);
      if (isChecked) {
        stat.checkedIn += 1;
      } else {
        stat.pending += 1;
      }
      if (r.teamName || r.team_name) {
        stat.teams += 1;
      }
      stat.responses.push(r);
    });

    map.forEach(stat => {
      stat.percentage = stat.total > 0 ? Math.round((stat.checkedIn / stat.total) * 100) : 0;
    });

    return map;
  }, [forms, responses]);

  // Overall festival stats
  const totalRegistrations = responses.length;
  const totalCheckedIn = responses.filter(r => r.checked_in ?? r.checkedIn).length;
  const totalTeams = responses.filter(r => r.teamName || r.team_name).length;
  const overallRate = totalRegistrations > 0 ? Math.round((totalCheckedIn / totalRegistrations) * 100) : 0;

  // Categories list
  const categories = useMemo(() => {
    const set = new Set<string>();
    forms.forEach(f => {
      if (f.category) set.add(f.category);
    });
    return Array.from(set);
  }, [forms]);

  // Active event helper
  const activeEventName = selectedEvent || (forms[0]?.name || '');
  const activeForm = forms.find(f => f.name.toLowerCase().trim() === activeEventName.toLowerCase().trim()) || forms[0];

  // Filtered forms for the card grid
  const filteredForms = useMemo(() => {
    return forms.filter(f => {
      if (selectedCategory !== 'all' && f.category.toLowerCase() !== selectedCategory.toLowerCase()) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        return f.name.toLowerCase().includes(q) || f.category.toLowerCase().includes(q);
      }
      return true;
    });
  }, [forms, selectedCategory, searchQuery]);

  return (
    <div className="responsive-page-container">
      
      {/* Top Festival KPI Row */}
      <div className="kpi-grid">
        {/* KPI 1 */}
        <div style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border)',
          borderRadius: '10px',
          padding: '16px 18px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
            <span style={{ fontSize: '11.5px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Total Live Registrations
            </span>
            <Users size={16} color="var(--accent)" />
          </div>
          <div style={{ fontSize: '26px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '8px' }}>
            {totalRegistrations}
          </div>
          <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span className="pulse-dot"></span>
            <span>Live across {forms.length} Google Form sheets</span>
          </div>
        </div>

        {/* KPI 2 */}
        <div style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border)',
          borderRadius: '10px',
          padding: '16px 18px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
            <span style={{ fontSize: '11.5px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Verified Attendees
            </span>
            <ShieldCheck size={16} color="var(--success)" />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '8px' }}>
            <span style={{ fontSize: '26px', fontWeight: 700, color: 'var(--success)' }}>
              {totalCheckedIn}
            </span>
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)' }}>
              ({overallRate}%)
            </span>
          </div>
          <div style={{
            width: '100%',
            height: '4px',
            background: 'var(--bg-subtle)',
            borderRadius: '2px',
            marginTop: '8px',
            overflow: 'hidden'
          }}>
            <div style={{
              width: `${overallRate}%`,
              height: '100%',
              background: 'var(--success)',
              borderRadius: '2px'
            }}></div>
          </div>
        </div>

        {/* KPI 3 */}
        <div style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border)',
          borderRadius: '10px',
          padding: '16px 18px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
            <span style={{ fontSize: '11.5px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Registered Teams & Squads
            </span>
            <Users size={16} color="#8b5cf6" />
          </div>
          <div style={{ fontSize: '26px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '8px' }}>
            {totalTeams}
          </div>
          <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Esports, Hackathons & Team events
          </div>
        </div>

        {/* KPI 4 */}
        <div style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border)',
          borderRadius: '10px',
          padding: '16px 18px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
            <span style={{ fontSize: '11.5px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Active Festival Venues
            </span>
            <MapPin size={16} color="var(--warning)" />
          </div>
          <div style={{ fontSize: '26px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '8px' }}>
            17
          </div>
          <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Arenas, Labs, Studios & Auditoriums
          </div>
        </div>
      </div>

      {/* EVENT TABS STRIP (Horizontal quick-selector with live badges) */}
      <div style={{ marginBottom: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Radio size={15} color="var(--accent)" />
            <h3 style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
              Live Event Tabs ({forms.length})
            </h3>
          </div>
          <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
            Click any event to open its check-in desk
          </span>
        </div>

        <div
          className="touch-scroll"
          style={{
            display: 'flex',
            gap: '8px',
            overflowX: 'auto',
            paddingBottom: '8px'
          }}
        >
          {forms.map(f => {
            const stat = eventStatsMap.get(f.name.toLowerCase().trim()) || { total: 0, checkedIn: 0, teams: 0, pending: 0, percentage: 0, responses: [] };
            const isActive = activeForm?.name.toLowerCase().trim() === f.name.toLowerCase().trim();

            return (
              <button
                key={f.id}
                type="button"
                onClick={() => onSelectEvent(f.name, true)}
                title={`Open ${f.name} Check-In Desk (${stat.total} registered)`}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '7px 13px',
                  borderRadius: '8px',
                  border: isActive ? '1.5px solid var(--accent)' : '1px solid var(--border)',
                  background: isActive ? 'var(--accent-light)' : 'var(--bg-surface)',
                  color: isActive ? 'var(--accent)' : 'var(--text-primary)',
                  fontSize: '12px',
                  fontWeight: isActive ? 600 : 500,
                  whiteSpace: 'nowrap',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  boxShadow: isActive ? '0 1px 3px rgba(0, 98, 255, 0.12)' : 'none',
                  flexShrink: 0
                }}
              >
                <span>{f.name}</span>
                <span style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  padding: '1px 6px',
                  borderRadius: '10px',
                  background: isActive ? 'var(--accent)' : 'var(--bg-subtle)',
                  color: isActive ? '#ffffff' : 'var(--text-secondary)',
                  border: isActive ? 'none' : '1px solid var(--border)'
                }}>
                  {stat.total}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ALL EVENTS GRID & CATEGORY FILTER */}
      <div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          marginBottom: '16px'
        }}>
          <div>
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
              All Events Directory ({filteredForms.length})
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
              Live registration and check-in status for each competition
            </p>
          </div>

          {/* Search Input */}
          <div style={{ position: 'relative', minWidth: '220px' }}>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter events..."
              style={{
                width: '100%',
                padding: '6px 12px 6px 28px',
                fontSize: '12px',
                borderRadius: '6px',
                border: '1px solid var(--border)',
                background: 'var(--bg-surface)',
                color: 'var(--text-primary)',
                outline: 'none'
              }}
            />
            <Search size={13} style={{ position: 'absolute', left: '8px', top: '8px', color: 'var(--text-dim)' }} />
          </div>
        </div>

        {/* Category Pills (Touch Scrollable on Mobile) */}
        <div
          className="touch-scroll"
          style={{
            display: 'flex',
            gap: '6px',
            overflowX: 'auto',
            paddingBottom: '8px',
            marginBottom: '16px'
          }}
        >
          <button
            type="button"
            onClick={() => setSelectedCategory('all')}
            style={{
              padding: '5px 12px',
              borderRadius: '6px',
              fontSize: '11.5px',
              fontWeight: 600,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              flexShrink: 0,
              border: selectedCategory === 'all' ? '1px solid var(--accent)' : '1px solid var(--border)',
              background: selectedCategory === 'all' ? 'var(--accent)' : 'var(--bg-surface)',
              color: selectedCategory === 'all' ? '#ffffff' : 'var(--text-secondary)'
            }}
          >
            All Categories ({forms.length})
          </button>
          {categories.map(cat => {
            const count = forms.filter(f => f.category === cat).length;
            const isSel = selectedCategory.toLowerCase() === cat.toLowerCase();
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                style={{
                  padding: '5px 12px',
                  borderRadius: '6px',
                  fontSize: '11.5px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                  border: isSel ? '1px solid var(--accent)' : '1px solid var(--border)',
                  background: isSel ? 'var(--accent)' : 'var(--bg-surface)',
                  color: isSel ? '#ffffff' : 'var(--text-secondary)'
                }}
              >
                {cat} ({count})
              </button>
            );
          })}
        </div>

        {/* Card Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
          gap: '14px'
        }}>
          {filteredForms.map(form => {
            const stat = eventStatsMap.get(form.name.toLowerCase().trim()) || { total: 0, checkedIn: 0, teams: 0, pending: 0, percentage: 0, responses: [] };
            const alloc = VENUE_ALLOCATIONS[form.name] || { venue: 'Auditorium Hall', capacity: 50 };
            const isCurrentlyActive = activeForm?.name.toLowerCase().trim() === form.name.toLowerCase().trim();

            return (
              <div
                key={form.id}
                onClick={() => onSelectEvent(form.name, false)}
                style={{
                  background: 'var(--bg-surface)',
                  border: isCurrentlyActive ? '1.5px solid var(--accent)' : '1px solid var(--border)',
                  borderRadius: '10px',
                  padding: '16px 18px',
                  cursor: 'pointer',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                  transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                  position: 'relative'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.06)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.03)';
                }}
              >
                {/* Header row in card */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span className={`badge-${form.category?.toLowerCase() || 'general'}`} style={{
                    padding: '2px 7px',
                    borderRadius: '4px',
                    fontSize: '10.5px',
                    fontWeight: 600
                  }}>
                    {form.category}
                  </span>

                  <span style={{
                    fontSize: '11px',
                    color: 'var(--text-muted)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    <MapPin size={11} />
                    <span style={{ maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {alloc.venue}
                    </span>
                  </span>
                </div>

                {/* Event Name */}
                <h4 style={{
                  fontSize: '15px',
                  fontWeight: 700,
                  color: isCurrentlyActive ? 'var(--accent)' : 'var(--text-primary)',
                  marginBottom: '12px'
                }}>
                  {form.name}
                </h4>

                {/* Live Count Row */}
                <div style={{
                  display: 'flex',
                  alignItems: 'baseline',
                  justifyContent: 'space-between',
                  padding: '10px 12px',
                  background: 'var(--bg-subtle)',
                  borderRadius: '7px',
                  marginBottom: '12px'
                }}>
                  <div>
                    <span style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {stat.total}
                    </span>
                    <span style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginLeft: '6px' }}>
                      Registrations
                    </span>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--success)' }}>
                      {stat.checkedIn}
                    </span>
                    <span style={{ fontSize: '11px', color: 'var(--text-dim)', marginLeft: '3px' }}>
                      in ({stat.percentage}%)
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                <div style={{
                  width: '100%',
                  height: '4px',
                  background: 'var(--bg-subtle)',
                  borderRadius: '2px',
                  marginBottom: '14px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    width: `${stat.percentage}%`,
                    height: '100%',
                    background: 'var(--success)',
                    borderRadius: '2px'
                  }}></div>
                </div>

                {/* Bottom Actions Row */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  {stat.teams > 0 ? (
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '3px',
                      fontSize: '11px',
                      color: '#8b5cf6',
                      fontWeight: 600
                    }}>
                      <Users size={11} />
                      <span>{stat.teams} Teams</span>
                    </span>
                  ) : (
                    <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>Individual entries</span>
                  )}

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectEvent(form.name, true);
                    }}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '4px 9px',
                      borderRadius: '5px',
                      border: '1px solid var(--border)',
                      background: 'var(--bg-surface)',
                      color: 'var(--text-secondary)',
                      fontSize: '11.5px',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    <span>Desk</span>
                    <ArrowUpRight size={12} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};

