'use client';

import React, { useState } from 'react';
import { FilterState, FormItem, ResponseItem } from '@/types';
import { chime } from '@/lib/chime';
import {
  CheckCircle2,
  Clock,
  Copy,
  Check,
  MessageCircle,
  ExternalLink,
  Users,
  ShieldCheck,
  TrendingUp,
  CreditCard
} from 'lucide-react';

interface DeskViewProps {
  responses: ResponseItem[];
  forms: FormItem[];
  filters: FilterState;
  onToggleCheckIn: (id: string) => void;
  onSelectAttendee: (item: ResponseItem) => void;
}

export const DeskView: React.FC<DeskViewProps> = ({
  responses,
  forms,
  filters,
  onToggleCheckIn,
  onSelectAttendee
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Helper to extract attendee name from common Google Form fields
  const getAttendeeName = (answers: Record<string, string>): string => {
    if (!answers) return 'Attendee';
    for (const key of Object.keys(answers)) {
      const lk = key.toLowerCase();
      if (lk.includes('full name') || lk.includes('leader name') || lk.includes('team lead') || lk.includes('player name') || lk === 'name') {
        if (answers[key]?.trim()) return answers[key].trim();
      }
    }
    for (const key of Object.keys(answers)) {
      if (key.toLowerCase().includes('name') && answers[key]?.trim()) {
        return answers[key].trim();
      }
    }
    return 'Attendee';
  };

  // Helper to extract team / squad name
  const getTeamName = (answers: Record<string, string>): string => {
    if (!answers) return '';
    for (const key of Object.keys(answers)) {
      const lk = key.toLowerCase();
      if (
        (lk.includes('squad name') ||
          lk.includes('team name') ||
          lk.includes('group name') ||
          lk === 'squad' ||
          lk === 'team') &&
        !lk.includes('captain') &&
        !lk.includes('leader') &&
        !lk.includes('lead') &&
        !lk.includes('member') &&
        !lk.includes('player') &&
        !lk.includes('email') &&
        !lk.includes('phone') &&
        !lk.includes('mobile')
      ) {
        const val = answers[key]?.trim();
        if (val && val.toLowerCase() !== 'n/a' && val.toLowerCase() !== 'none' && val.toLowerCase() !== 'na') {
          return val;
        }
      }
    }
    return '';
  };

  // Helper to extract phone number
  const getPhone = (answers: Record<string, string>): string => {
    if (!answers) return '';
    for (const key of Object.keys(answers)) {
      const lk = key.toLowerCase();
      if (lk.includes('phone') || lk.includes('whatsapp') || lk.includes('contact') || lk.includes('mobile')) {
        const val = answers[key]?.trim();
        if (val && /\d{8,}/.test(val)) return val.replace(/\D/g, '');
      }
    }
    return '';
  };

  // Helper to extract UTR / Transaction ID
  const getUTR = (answers: Record<string, string>): string => {
    if (!answers) return '';
    for (const key of Object.keys(answers)) {
      const lk = key.toLowerCase();
      if (lk.includes('utr') || lk.includes('transaction') || lk.includes('reference') || lk.includes('payment id')) {
        const val = answers[key]?.trim();
        if (val) return val;
      }
    }
    return '';
  };

  const formCategoryMap = React.useMemo(() => {
    const map = new Map<string, string>();
    forms.forEach(f => {
      map.set(f.name.trim().toLowerCase(), f.category);
    });
    return map;
  }, [forms]);

  const getItemForm = (item: ResponseItem) => {
    return (item.form || item.formName || '').trim();
  };

  const getItemCheckedIn = (item: ResponseItem) => {
    return !!(item.checked_in ?? item.checkedIn);
  };

  // Filtering
  const filteredResponses = React.useMemo(() => {
    return responses.filter(r => {
      const formName = getItemForm(r);
      const isChecked = getItemCheckedIn(r);

      // Event filter
      if (filters.event && formName.toLowerCase() !== filters.event.trim().toLowerCase()) {
        return false;
      }

      // Category filter
      if (filters.category) {
        const cat = formCategoryMap.get(formName.toLowerCase()) || '';
        if (cat.toLowerCase() !== filters.category.trim().toLowerCase()) {
          return false;
        }
      }

      // Attendance filter
      if (filters.attendance === 'checked_in' && !isChecked) return false;
      if (filters.attendance === 'pending' && isChecked) return false;

      // Search query
      if (filters.query) {
        const q = filters.query.toLowerCase().trim();
        const name = (r.attendeeName || getAttendeeName(r.answers)).toLowerCase();
        const team = (r.teamName || r.team_name || getTeamName(r.answers)).toLowerCase();
        const phone = r.phone || getPhone(r.answers);
        const utr = (r.utr || getUTR(r.answers)).toLowerCase();
        const fn = formName.toLowerCase();

        const matches = name.includes(q) ||
          team.includes(q) ||
          phone.includes(q) ||
          utr.includes(q) ||
          fn.includes(q) ||
          Object.values(r.answers || {}).some(v => String(v).toLowerCase().includes(q));

        if (!matches) return false;
      }

      return true;
    });
  }, [responses, filters, formCategoryMap]);

  // Scoped responses: If an event or category is selected, scope the metrics to that selection!
  const scopedResponses = React.useMemo(() => {
    return responses.filter(r => {
      const formName = getItemForm(r);
      if (filters.event && formName.toLowerCase() !== filters.event.trim().toLowerCase()) {
        return false;
      }
      if (filters.category) {
        const cat = formCategoryMap.get(formName.toLowerCase()) || '';
        if (cat.toLowerCase() !== filters.category.trim().toLowerCase()) {
          return false;
        }
      }
      return true;
    });
  }, [responses, filters.event, filters.category, formCategoryMap]);

  // Metrics computed from scoped responses
  const totalCount = scopedResponses.length;
  const checkedInCount = scopedResponses.filter(r => getItemCheckedIn(r)).length;
  const pendingCount = totalCount - checkedInCount;
  const checkInRate = totalCount > 0 ? Math.round((checkedInCount / totalCount) * 100) : 0;
  const teamCount = scopedResponses.filter(r => r.teamName || r.team_name).length;

  const handleCopyUTR = (utr: string, id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!utr) return;
    navigator.clipboard.writeText(utr).catch(() => {});
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCheckInToggle = (id: string, currentlyChecked: boolean, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentlyChecked) {
      chime.playCheckIn();
    } else {
      chime.playUndo();
    }
    onToggleCheckIn(id);
  };

  return (
    <div className="responsive-page-container">
      {/* Metrics Row */}
      <div className="kpi-grid">
        {/* Metric 1 */}
        <div style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border)',
          borderRadius: '10px',
          padding: '16px 18px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
            <span style={{ fontSize: '11.5px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              {filters.event ? 'Event Registrations' : (filters.category ? `${filters.category} Registrations` : 'Total Registrations')}
            </span>
            <Users size={16} color="var(--accent)" />
          </div>
          <div style={{ fontSize: '26px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '8px' }}>
            {totalCount}
          </div>
          <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {filters.event ? `${filters.event} sheet` : (filters.category ? `Category: ${filters.category}` : `Across ${forms.length} linked event sheets`)}
          </div>
        </div>

        {/* Metric 2 */}
        <div style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border)',
          borderRadius: '10px',
          padding: '16px 18px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
            <span style={{ fontSize: '11.5px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Verified Check-Ins
            </span>
            <ShieldCheck size={16} color="var(--success)" />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '8px' }}>
            <span style={{ fontSize: '26px', fontWeight: 700, color: 'var(--success)' }}>
              {checkedInCount}
            </span>
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)' }}>
              ({checkInRate}%)
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
              width: `${checkInRate}%`,
              height: '100%',
              background: 'var(--success)',
              borderRadius: '2px'
            }}></div>
          </div>
        </div>

        {/* Metric 3 */}
        <div style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border)',
          borderRadius: '10px',
          padding: '16px 18px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
            <span style={{ fontSize: '11.5px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Pending Verification
            </span>
            <Clock size={16} color="var(--warning)" />
          </div>
          <div style={{ fontSize: '26px', fontWeight: 700, color: 'var(--warning)', marginTop: '8px' }}>
            {pendingCount}
          </div>
          <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '4px' }}>
            {filters.event ? `Awaiting check-in for this sheet` : 'Awaiting desk check-in / entry badge'}
          </div>
        </div>

        {/* Metric 4 */}
        <div style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border)',
          borderRadius: '10px',
          padding: '16px 18px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
            <span style={{ fontSize: '11.5px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              {filters.query || filters.attendance !== 'all' ? 'Filtered Results' : (teamCount > 0 ? 'Squads / Teams' : 'Desk Throughput')}
            </span>
            <TrendingUp size={16} color="var(--accent)" />
          </div>
          <div style={{ fontSize: '26px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '8px' }}>
            {filters.query || filters.attendance !== 'all' ? filteredResponses.length : (teamCount > 0 ? teamCount : filteredResponses.length)}
          </div>
          <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '4px' }}>
            {filters.query || filters.attendance !== 'all' ? 'Matching search & status filters' : (teamCount > 0 ? 'Registered squads for this sheet' : 'Matching active event')}
          </div>
        </div>
      </div>

      {/* Main Table Container */}
      <div style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border)',
        borderRadius: '10px',
        overflow: 'hidden',
        boxShadow: '0 1px 4px rgba(0, 0, 0, 0.04)'
      }}>
        {/* Table Header Bar */}
        <div style={{
          padding: '14px 18px',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'var(--bg-subtle)'
        }}>
          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
            {filters.event ? `${filters.event} Attendees (${filteredResponses.length})` : `Attendees & Team Leads (${filteredResponses.length})`}
          </span>
          <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
            Showing verified Google Form responses
          </span>
        </div>

        {/* Table Content */}
        {filteredResponses.length === 0 ? (
          <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <Users size={36} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
            <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>No matching registrations found</h3>
            <p style={{ fontSize: '12.5px', marginTop: '4px' }}>Try adjusting your search query, event filter, or attendance status.</p>
          </div>
        ) : (
          <>
            <div className="desk-desktop-table" style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12.5px' }}>
              <thead>
                <tr style={{ background: 'var(--bg-subtle)', borderBottom: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '10px 16px', fontWeight: 600, width: '40px' }}>#</th>
                  <th style={{ padding: '10px 16px', fontWeight: 600 }}>Attendee / Team Lead</th>
                  <th style={{ padding: '10px 16px', fontWeight: 600 }}>Event & Category</th>
                  <th style={{ padding: '10px 16px', fontWeight: 600 }}>Contact (WhatsApp)</th>
                  <th style={{ padding: '10px 16px', fontWeight: 600 }}>Payment / UTR</th>
                  <th style={{ padding: '10px 16px', fontWeight: 600, textAlign: 'center' }}>Check-In Status</th>
                  <th style={{ padding: '10px 16px', fontWeight: 600, textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredResponses.map((item, index) => {
                  const name = item.attendeeName || getAttendeeName(item.answers);
                  const team = item.teamName || item.team_name || getTeamName(item.answers);
                  const phone = item.phone || getPhone(item.answers);
                  const utr = item.utr || getUTR(item.answers);
                  const formName = getItemForm(item);
                  const isChecked = getItemCheckedIn(item);
                  const category = formCategoryMap.get(formName.toLowerCase()) || 'General';
                  const catClass = `badge-${category.toLowerCase()}`;
                  const submitted = item.submitted || item.submittedAt || '10/26/2026';

                  return (
                    <tr
                      key={item.id}
                      onClick={() => onSelectAttendee(item)}
                      style={{
                        borderBottom: '1px solid var(--border)',
                        cursor: 'pointer',
                        transition: 'background-color 0.15s ease'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-hover)'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      {/* Row Index */}
                      <td style={{ padding: '12px 16px', color: 'var(--text-dim)', fontSize: '11px', fontFamily: 'monospace' }}>
                        {index + 1}
                      </td>

                      {/* Attendee / Team Lead */}
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '7px', flexWrap: 'wrap' }}>
                          <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{name}</span>
                          {team && (
                            <span
                              title={`Team / Squad: ${team}`}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '3.5px',
                                fontSize: '10.5px',
                                fontWeight: 600,
                                background: 'rgba(0, 98, 255, 0.08)',
                                color: 'var(--accent)',
                                padding: '1.5px 7px',
                                borderRadius: '4px',
                                border: '1px solid rgba(0, 98, 255, 0.18)',
                                letterSpacing: '0.01em'
                              }}
                            >
                              <Users size={10} />
                              <span>{team}</span>
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '2px' }}>
                          {submitted}
                        </div>
                      </td>

                      {/* Event & Category */}
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{formName}</div>
                        <span
                          className={catClass}
                          style={{
                            display: 'inline-block',
                            padding: '2px 7px',
                            borderRadius: '4px',
                            fontSize: '10.5px',
                            fontWeight: 600,
                            marginTop: '3px'
                          }}
                        >
                          {category}
                        </span>
                      </td>

                      {/* Phone / WhatsApp */}
                      <td style={{ padding: '12px 16px' }}>
                        {phone ? (
                          <a
                            href={`https://wa.me/91${phone}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '5px',
                              color: '#10b981',
                              textDecoration: 'none',
                              fontWeight: 500
                            }}
                          >
                            <MessageCircle size={13} />
                            <span>{phone}</span>
                          </a>
                        ) : (
                          <span style={{ color: 'var(--text-dim)', fontSize: '11.5px' }}>—</span>
                        )}
                      </td>

                      {/* UTR */}
                      <td style={{ padding: '12px 16px' }}>
                        {utr ? (
                          <button
                            type="button"
                            onClick={(e) => handleCopyUTR(utr, item.id, e)}
                            title="Click to copy UTR"
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '5px',
                              padding: '3px 7px',
                              borderRadius: '4px',
                              border: '1px solid var(--border)',
                              background: copiedId === item.id ? 'var(--success-bg)' : 'var(--bg-subtle)',
                              color: copiedId === item.id ? 'var(--success)' : 'var(--text-secondary)',
                              fontSize: '11px',
                              fontFamily: 'monospace',
                              cursor: 'pointer'
                            }}
                          >
                            <CreditCard size={11} />
                            <span style={{ maxWidth: '110px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {utr}
                            </span>
                            {copiedId === item.id ? <Check size={11} /> : <Copy size={11} />}
                          </button>
                        ) : (
                          <span style={{ color: 'var(--text-dim)', fontSize: '11.5px' }}>Verified</span>
                        )}
                      </td>

                      {/* Check-In Button */}
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        <button
                          type="button"
                          onClick={(e) => handleCheckInToggle(item.id, isChecked, e)}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            padding: '5px 11px',
                            borderRadius: '5px',
                            border: isChecked ? '1px solid #10b981' : '1px solid var(--border)',
                            background: isChecked ? 'var(--success-bg)' : 'var(--bg-surface)',
                            color: isChecked ? 'var(--success)' : 'var(--text-secondary)',
                            fontWeight: 600,
                            fontSize: '11.5px',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          {isChecked ? (
                            <>
                              <CheckCircle2 size={13} />
                              <span>Checked In</span>
                            </>
                          ) : (
                            <>
                              <Clock size={13} color="var(--text-dim)" />
                              <span>Check In</span>
                            </>
                          )}
                        </button>
                      </td>

                      {/* View Action */}
                      <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); onSelectAttendee(item); }}
                          style={{
                            padding: '5px 9px',
                            borderRadius: '5px',
                            border: '1px solid var(--border)',
                            background: 'var(--bg-surface)',
                            color: 'var(--text-secondary)',
                            fontSize: '11.5px',
                            fontWeight: 500,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          <span>Details</span>
                          <ExternalLink size={11} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards View (Optimized for Phones & Tablets < 768px) */}
          <div className="desk-mobile-cards">
            {filteredResponses.map((item, index) => {
              const name = item.attendeeName || getAttendeeName(item.answers);
              const team = item.teamName || item.team_name || getTeamName(item.answers);
              const phone = item.phone || getPhone(item.answers);
              const utr = item.utr || getUTR(item.answers);
              const formName = getItemForm(item);
              const isChecked = getItemCheckedIn(item);
              const category = formCategoryMap.get(formName.toLowerCase()) || 'General';
              const catClass = `badge-${category.toLowerCase()}`;
              const submitted = item.submitted || item.submittedAt || '10/26/2026';

              return (
                <div
                  key={`m_${item.id}`}
                  onClick={() => onSelectAttendee(item)}
                  style={{
                    background: 'var(--bg-surface)',
                    border: isChecked ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid var(--border)',
                    borderRadius: '10px',
                    padding: '13px 14px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '9px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                    cursor: 'pointer'
                  }}
                >
                  {/* Header: #, Event & Date */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '11px', fontFamily: 'monospace', color: 'var(--text-dim)', fontWeight: 600 }}>
                        #{index + 1}
                      </span>
                      <span className={catClass} style={{
                        padding: '1.5px 6px',
                        borderRadius: '4px',
                        fontSize: '10px',
                        fontWeight: 600
                      }}>
                        {category}
                      </span>
                      <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>•</span>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{formName}</span>
                    </div>
                    <span style={{ fontSize: '10.5px', color: 'var(--text-dim)' }}>
                      {submitted.split(' ')[0]}
                    </span>
                  </div>

                  {/* Name & Team */}
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                      <h4 style={{ fontSize: '14.5px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                        {name}
                      </h4>
                      {team && (
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '3px',
                          fontSize: '10.5px',
                          fontWeight: 600,
                          background: 'rgba(0, 98, 255, 0.08)',
                          color: 'var(--accent)',
                          padding: '1px 6px',
                          borderRadius: '4px',
                          border: '1px solid rgba(0, 98, 255, 0.18)'
                        }}>
                          <Users size={10} />
                          <span>{team}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Contact & Payment */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    {phone && (
                      <a
                        href={`https://wa.me/91${phone}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '4px 8px',
                          borderRadius: '5px',
                          background: 'rgba(16, 185, 129, 0.1)',
                          border: '1px solid rgba(16, 185, 129, 0.25)',
                          color: '#10b981',
                          fontSize: '11px',
                          fontWeight: 600,
                          textDecoration: 'none'
                        }}
                      >
                        <MessageCircle size={12} />
                        <span>{phone}</span>
                      </a>
                    )}

                    {utr && (
                      <button
                        type="button"
                        onClick={(e) => handleCopyUTR(utr, item.id, e)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '4px 8px',
                          borderRadius: '5px',
                          background: copiedId === item.id ? 'var(--success-bg)' : 'var(--bg-subtle)',
                          border: '1px solid var(--border)',
                          color: copiedId === item.id ? 'var(--success)' : 'var(--text-secondary)',
                          fontSize: '11px',
                          fontFamily: 'monospace',
                          cursor: 'pointer'
                        }}
                      >
                        <CreditCard size={11} />
                        <span style={{ maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis' }}>{utr}</span>
                        {copiedId === item.id ? <Check size={11} /> : <Copy size={11} />}
                      </button>
                    )}
                  </div>

                  {/* Quick 1-Tap Action Row */}
                  <div style={{ display: 'flex', gap: '8px', marginTop: '3px' }}>
                    <button
                      type="button"
                      onClick={(e) => handleCheckInToggle(item.id, isChecked, e)}
                      style={{
                        flex: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        minHeight: '38px',
                        borderRadius: '6px',
                        border: isChecked ? '1px solid #10b981' : '1px solid var(--border)',
                        background: isChecked ? 'var(--success-bg)' : 'var(--accent)',
                        color: isChecked ? 'var(--success)' : '#ffffff',
                        fontWeight: 600,
                        fontSize: '12px',
                        cursor: 'pointer'
                      }}
                    >
                      {isChecked ? (
                        <>
                          <CheckCircle2 size={14} />
                          <span>Checked In {item.checked_in_at || item.checkedInAt ? `(${item.checked_in_at || item.checkedInAt})` : ''}</span>
                        </>
                      ) : (
                        <>
                          <Clock size={14} />
                          <span>Mark as Checked In</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); onSelectAttendee(item); }}
                      style={{
                        padding: '0 12px',
                        minHeight: '38px',
                        borderRadius: '6px',
                        border: '1px solid var(--border)',
                        background: 'var(--bg-subtle)',
                        color: 'var(--text-secondary)',
                        fontSize: '11.5px',
                        fontWeight: 500,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <span>Details</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
        )}
      </div>
    </div>
  );
};
