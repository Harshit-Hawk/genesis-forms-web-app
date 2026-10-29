'use client';

import React, { useState } from 'react';
import { ResponseItem } from '@/types';
import {
  X,
  CheckCircle2,
  Clock,
  MessageCircle,
  Copy,
  Check,
  ExternalLink,
  CreditCard,
  FileText,
  Users
} from 'lucide-react';
import { chime } from '@/lib/chime';

interface AttendeeModalProps {
  attendee: ResponseItem | null;
  onClose: () => void;
  onToggleCheckIn: (id: string) => void;
}

export const AttendeeModal: React.FC<AttendeeModalProps> = ({
  attendee,
  onClose,
  onToggleCheckIn
}) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!attendee) return null;

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

  const getPhone = (answers: Record<string, string>): string => {
    for (const key of Object.keys(answers)) {
      const lk = key.toLowerCase();
      if (lk.includes('phone') || lk.includes('whatsapp') || lk.includes('contact') || lk.includes('mobile')) {
        const val = answers[key]?.trim();
        if (val && /\d{8,}/.test(val)) return val.replace(/\D/g, '');
      }
    }
    return '';
  };

  const phone = getPhone(attendee.answers);
  const teamName = attendee.teamName || attendee.team_name || getTeamName(attendee.answers);
  const attendeeName = attendee.attendeeName || 'Attendee';

  const handleCopy = (val: string, keyName: string) => {
    navigator.clipboard.writeText(val).catch(() => {});
    setCopiedKey(keyName);
    setTimeout(() => setCopiedKey(null), 1800);
  };

  const handleCheckInToggle = () => {
    if (!attendee.checked_in) {
      chime.playCheckIn();
    } else {
      chime.playUndo();
    }
    onToggleCheckIn(attendee.id);
  };

  // Separate answers into links vs text
  const answerEntries = Object.entries(attendee.answers).filter(
    ([k]) => k.toLowerCase() !== 'timestamp'
  );

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
      padding: '12px',
      zIndex: 100
    }} onClick={onClose}>
      <div style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border)',
        borderRadius: '12px',
        width: '100%',
        maxWidth: '680px',
        maxHeight: '94vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.2)',
        overflow: 'hidden'
      }} onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'var(--bg-subtle)'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', color: 'var(--accent)', letterSpacing: '0.04em' }}>
                {attendee.form}
              </span>
              <span style={{ color: 'var(--text-dim)' }}>•</span>
              <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                {attendee.submitted || '10/26/2026'}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '3px', flexWrap: 'wrap' }}>
              <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
                {attendeeName}
              </h2>
              {teamName && (
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '11px',
                    fontWeight: 600,
                    background: 'rgba(0, 98, 255, 0.08)',
                    color: 'var(--accent)',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    border: '1px solid rgba(0, 98, 255, 0.2)'
                  }}
                >
                  <Users size={11} />
                  <span>Team: {teamName}</span>
                </span>
              )}
            </div>
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

        {/* Action Header Banner */}
        <div style={{
          padding: '14px 20px',
          background: 'var(--bg-surface)',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <button
            type="button"
            onClick={handleCheckInToggle}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 14px',
              borderRadius: '6px',
              border: attendee.checked_in ? '1px solid #10b981' : '1px solid var(--border)',
              background: attendee.checked_in ? 'var(--success-bg)' : 'var(--accent)',
              color: attendee.checked_in ? 'var(--success)' : '#ffffff',
              fontSize: '12.5px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            {attendee.checked_in ? (
              <>
                <CheckCircle2 size={15} />
                <span>Checked In {attendee.checked_in_at ? `(${attendee.checked_in_at})` : ''}</span>
              </>
            ) : (
              <>
                <Clock size={15} />
                <span>Mark as Checked In</span>
              </>
            )}
          </button>

          {phone && (
            <a
              href={`https://wa.me/91${phone}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 14px',
                borderRadius: '6px',
                border: '1px solid #10b981',
                background: 'var(--success-bg)',
                color: '#10b981',
                textDecoration: 'none',
                fontSize: '12px',
                fontWeight: 600
              }}
            >
              <MessageCircle size={14} />
              <span>Connect on WhatsApp (+91 {phone})</span>
            </a>
          )}
        </div>

        {/* Modal Body - Form Answers */}
        <div style={{
          padding: '18px 20px',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}>
          {answerEntries.map(([question, answer]) => {
            const isUrl = answer.startsWith('http://') || answer.startsWith('https://');
            const isPayment = question.toLowerCase().includes('payment') || question.toLowerCase().includes('utr') || question.toLowerCase().includes('transaction');

            return (
              <div
                key={question}
                style={{
                  background: 'var(--bg-subtle)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  padding: '12px 14px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                    {question}
                  </span>
                  {!isUrl && answer && (
                    <button
                      type="button"
                      onClick={() => handleCopy(answer, question)}
                      title="Copy value"
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: copiedKey === question ? 'var(--success)' : 'var(--text-dim)',
                        cursor: 'pointer',
                        padding: '2px',
                        display: 'flex',
                        alignItems: 'center'
                      }}
                    >
                      {copiedKey === question ? <Check size={12} /> : <Copy size={12} />}
                    </button>
                  )}
                </div>

                {isUrl ? (
                  <a
                    href={answer}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      color: 'var(--accent)',
                      fontSize: '13px',
                      fontWeight: 600,
                      textDecoration: 'none',
                      marginTop: '4px'
                    }}
                  >
                    {isPayment ? <CreditCard size={14} /> : <FileText size={14} />}
                    <span>Open Uploaded Document in Drive</span>
                    <ExternalLink size={12} />
                  </a>
                ) : (
                  <div style={{
                    fontSize: '13px',
                    fontWeight: 500,
                    color: 'var(--text-primary)',
                    wordBreak: 'break-word',
                    lineHeight: '1.4'
                  }}>
                    {answer || <span style={{ color: 'var(--text-dim)' }}>Not provided</span>}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Modal Footer */}
        <div style={{
          padding: '12px 20px',
          borderTop: '1px solid var(--border)',
          background: 'var(--bg-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <span style={{ fontSize: '11px', color: 'var(--text-dim)', fontFamily: 'monospace' }}>
            ID: {attendee.id}
          </span>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '6px 14px',
              borderRadius: '6px',
              border: '1px solid var(--border)',
              background: 'var(--bg-surface)',
              color: 'var(--text-secondary)',
              fontSize: '12px',
              fontWeight: 500,
              cursor: 'pointer'
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

