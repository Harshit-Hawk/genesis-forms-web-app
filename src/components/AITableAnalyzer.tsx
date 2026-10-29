'use client';

import React, { useState, useMemo } from 'react';
import { AIAnalysis, FormItem, ResponseItem } from '@/types';
import { VENUE_ALLOCATIONS } from '@/lib/data';
import {
  Bot,
  Download,
  Copy,
  Check,
  Building,
  TrendingUp,
  Award
} from 'lucide-react';

interface AITableAnalyzerProps {
  responses: ResponseItem[];
  forms: FormItem[];
}

export const AITableAnalyzer: React.FC<AITableAnalyzerProps> = ({ responses, forms }) => {
  const [selectedPill, setSelectedPill] = useState<string | null>(null);
  const [copiedMd, setCopiedMd] = useState(false);

  // Compute event counts and analytical metrics
  const analysisData: AIAnalysis[] = useMemo(() => {
    const totalResponses = responses.length;
    const countMap = new Map<string, number>();

    responses.forEach(r => {
      const fn = (r.form || r.formName || '').trim().toLowerCase();
      countMap.set(fn, (countMap.get(fn) || 0) + 1);
    });

    const list: AIAnalysis[] = forms.map(f => {
      const total = countMap.get(f.name.trim().toLowerCase()) || 0;
      const alloc = VENUE_ALLOCATIONS[f.name] || { venue: 'Auditorium Hall B', capacity: 50 };
      const share = totalResponses > 0 ? Math.round((total / totalResponses) * 100) : 0;

      let demand: AIAnalysis['demand'] = 'Moderate';
      if (total >= 18) demand = 'High Demand';
      else if (total >= 10) demand = 'Optimal';
      else demand = 'Moderate';

      // Turnout projection formula: 85% expected show-up rate
      const projectedTurnout = Math.round(total * 0.88);

      return {
        rank: 0,
        event: f.name,
        category: f.category,
        total,
        capacity: alloc.capacity,
        share,
        demand,
        projectedTurnout,
        venue: alloc.venue
      };
    });

    // Sort descending by registration count
    list.sort((a, b) => b.total - a.total);
    list.forEach((item, idx) => {
      item.rank = idx + 1;
    });

    return list;
  }, [responses, forms]);

  // Apply Prompt Pill Filters
  const filteredData = useMemo(() => {
    if (!selectedPill) return analysisData;
    if (selectedPill === 'high_capacity') {
      return analysisData.filter(d => d.total >= 15);
    }
    if (selectedPill === 'esports_vs_tech') {
      return analysisData.filter(d => d.category === 'Esports' || d.category === 'Technical');
    }
    if (selectedPill === 'venue_allocation') {
      return analysisData.filter(d => d.demand === 'High Demand');
    }
    if (selectedPill === 'low_traction') {
      return analysisData.filter(d => d.total < 12);
    }
    return analysisData;
  }, [analysisData, selectedPill]);

  // Top event
  const topEvent = analysisData[0];
  const totalTurnout = useMemo(() => {
    return analysisData.reduce((acc, curr) => acc + curr.projectedTurnout, 0);
  }, [analysisData]);

  // CSV Export
  const handleExportCSV = () => {
    const headers = ['Rank', 'Event Name', 'Category', 'Registrations', 'Share %', 'Demand Status', 'Projected Turnout', 'Venue Allocation'];
    const rows = filteredData.map(d => [
      d.rank,
      `"${d.event}"`,
      d.category,
      d.total,
      `${d.share}%`,
      d.demand,
      d.projectedTurnout,
      `"${d.venue}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `genesis_forms_ai_analysis_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Copy Markdown Table
  const handleCopyMarkdown = () => {
    let md = `| Rank | Event Name | Category | Registrations | Share | Demand Status | Projected Turnout | Venue Allocation |\n`;
    md += `| :--- | :--- | :--- | :---: | :---: | :--- | :---: | :--- |\n`;
    filteredData.forEach(d => {
      md += `| #${d.rank} | **${d.event}** | ${d.category} | ${d.total} | ${d.share}% | ${d.demand} | ${d.projectedTurnout} attendees | ${d.venue} |\n`;
    });

    navigator.clipboard.writeText(md).catch(() => {});
    setCopiedMd(true);
    setTimeout(() => setCopiedMd(false), 2000);
  };

  return (
    <div className="responsive-page-container">
      {/* Header Banner */}
      <div style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border)',
        borderRadius: '12px',
        padding: '20px 22px',
        marginBottom: '20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.03)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '10px',
            background: 'var(--accent-light)',
            color: 'var(--accent)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Bot size={22} />
          </div>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
              AI Registration Intelligence Table
            </h2>
            <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', marginTop: '2px' }}>
              Real-time cross-form volume synthesis, demand modeling, and venue capacity allocation.
            </p>
          </div>
        </div>

        {/* Export Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            type="button"
            onClick={handleCopyMarkdown}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 12px',
              borderRadius: '6px',
              border: '1px solid var(--border)',
              background: 'var(--bg-surface)',
              color: 'var(--text-secondary)',
              fontSize: '12px',
              fontWeight: 500,
              cursor: 'pointer'
            }}
          >
            {copiedMd ? <Check size={13} color="var(--success)" /> : <Copy size={13} />}
            <span>{copiedMd ? 'Copied Markdown' : 'Copy Table'}</span>
          </button>
          <button
            type="button"
            onClick={handleExportCSV}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 12px',
              borderRadius: '6px',
              border: 'none',
              background: 'var(--accent)',
              color: '#ffffff',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            <Download size={13} />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* KPI Highlights */}
      <div className="kpi-grid">
        {/* Top Event */}
        <div style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border)',
          borderRadius: '10px',
          padding: '16px 18px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, textTransform: 'uppercase' }}>Highest Traction Event</span>
            <Award size={16} color="var(--accent)" />
          </div>
          <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '8px' }}>
            {topEvent ? topEvent.event : '—'}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
            {topEvent ? `${topEvent.total} registrations (${topEvent.share}% share)` : ''}
          </div>
        </div>

        {/* Turnout Forecast */}
        <div style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border)',
          borderRadius: '10px',
          padding: '16px 18px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, textTransform: 'uppercase' }}>Projected Turnout</span>
            <TrendingUp size={16} color="var(--success)" />
          </div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--success)', marginTop: '8px' }}>
            {totalTurnout} Attendees
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Estimated 88% show-up conversion
          </div>
        </div>

        {/* Venue Alert */}
        <div style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border)',
          borderRadius: '10px',
          padding: '16px 18px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, textTransform: 'uppercase' }}>Capacity Reallocations</span>
            <Building size={16} color="var(--warning)" />
          </div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--warning)', marginTop: '8px' }}>
            {analysisData.filter(d => d.demand === 'High Demand').length} High-Demand
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Recommended main-stage venue assignments
          </div>
        </div>
      </div>

      {/* Interactive Prompt Pills (Touch Scrollable on Mobile) */}
      <div
        className="touch-scroll"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '18px',
          overflowX: 'auto',
          paddingBottom: '6px'
        }}
      >
        <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginRight: '4px', whiteSpace: 'nowrap', flexShrink: 0 }}>
          AI Insights:
        </span>
        <button
          type="button"
          onClick={() => setSelectedPill(selectedPill === 'high_capacity' ? null : 'high_capacity')}
          style={{
            padding: '5px 12px',
            borderRadius: '20px',
            fontSize: '11.5px',
            fontWeight: 500,
            cursor: 'pointer',
            border: selectedPill === 'high_capacity' ? '1px solid var(--accent)' : '1px solid var(--border)',
            background: selectedPill === 'high_capacity' ? 'var(--accent-light)' : 'var(--bg-surface)',
            color: selectedPill === 'high_capacity' ? 'var(--accent)' : 'var(--text-secondary)'
          }}
        >
          High-Capacity Events
        </button>
        <button
          type="button"
          onClick={() => setSelectedPill(selectedPill === 'esports_vs_tech' ? null : 'esports_vs_tech')}
          style={{
            padding: '5px 12px',
            borderRadius: '20px',
            fontSize: '11.5px',
            fontWeight: 500,
            cursor: 'pointer',
            border: selectedPill === 'esports_vs_tech' ? '1px solid var(--accent)' : '1px solid var(--border)',
            background: selectedPill === 'esports_vs_tech' ? 'var(--accent-light)' : 'var(--bg-surface)',
            color: selectedPill === 'esports_vs_tech' ? 'var(--accent)' : 'var(--text-secondary)'
          }}
        >
          Esports vs Technical
        </button>
        <button
          type="button"
          onClick={() => setSelectedPill(selectedPill === 'venue_allocation' ? null : 'venue_allocation')}
          style={{
            padding: '5px 12px',
            borderRadius: '20px',
            fontSize: '11.5px',
            fontWeight: 500,
            cursor: 'pointer',
            border: selectedPill === 'venue_allocation' ? '1px solid var(--accent)' : '1px solid var(--border)',
            background: selectedPill === 'venue_allocation' ? 'var(--accent-light)' : 'var(--bg-surface)',
            color: selectedPill === 'venue_allocation' ? 'var(--accent)' : 'var(--text-secondary)'
          }}
        >
          Venue Allocation
        </button>
        <button
          type="button"
          onClick={() => setSelectedPill(selectedPill === 'low_traction' ? null : 'low_traction')}
          style={{
            padding: '5px 12px',
            borderRadius: '20px',
            fontSize: '11.5px',
            fontWeight: 500,
            cursor: 'pointer',
            border: selectedPill === 'low_traction' ? '1px solid var(--accent)' : '1px solid var(--border)',
            background: selectedPill === 'low_traction' ? 'var(--accent-light)' : 'var(--bg-surface)',
            color: selectedPill === 'low_traction' ? 'var(--accent)' : 'var(--text-secondary)'
          }}
        >
          Low Traction Events
        </button>
        {selectedPill && (
          <button
            type="button"
            onClick={() => setSelectedPill(null)}
            style={{
              padding: '5px 10px',
              borderRadius: '20px',
              fontSize: '11px',
              fontWeight: 500,
              cursor: 'pointer',
              border: 'none',
              background: 'transparent',
              color: 'var(--text-dim)'
            }}
          >
            Clear Filter
          </button>
        )}
      </div>

      {/* Analytical Table */}
      <div style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border)',
        borderRadius: '10px',
        overflow: 'hidden',
        boxShadow: '0 1px 4px rgba(0, 0, 0, 0.04)'
      }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12.5px' }}>
            <thead>
              <tr style={{ background: 'var(--bg-subtle)', borderBottom: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                <th style={{ padding: '11px 16px', fontWeight: 600, width: '45px' }}>Rank</th>
                <th style={{ padding: '11px 16px', fontWeight: 600 }}>Event & Category</th>
                <th style={{ padding: '11px 16px', fontWeight: 600, textAlign: 'center' }}>Registrations</th>
                <th style={{ padding: '11px 16px', fontWeight: 600, width: '150px' }}>Volume Share</th>
                <th style={{ padding: '11px 16px', fontWeight: 600 }}>Demand Status</th>
                <th style={{ padding: '11px 16px', fontWeight: 600 }}>Projected Turnout</th>
                <th style={{ padding: '11px 16px', fontWeight: 600 }}>Venue Allocation</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map(item => {
                const catClass = `badge-${item.category.toLowerCase()}`;
                const demandColor = item.demand === 'High Demand' ? 'var(--accent)' : item.demand === 'Optimal' ? 'var(--success)' : 'var(--warning)';
                const demandBg = item.demand === 'High Demand' ? 'var(--accent-light)' : item.demand === 'Optimal' ? 'var(--success-bg)' : 'var(--warning-bg)';

                return (
                  <tr
                    key={item.event}
                    style={{
                      borderBottom: '1px solid var(--border)',
                      transition: 'background-color 0.15s ease'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-hover)'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    {/* Rank */}
                    <td style={{ padding: '12px 16px', fontWeight: 700, color: item.rank <= 3 ? 'var(--accent)' : 'var(--text-dim)', fontFamily: 'monospace' }}>
                      #{item.rank}
                    </td>

                    {/* Event & Category */}
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{item.event}</div>
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
                        {item.category}
                      </span>
                    </td>

                    {/* Registrations */}
                    <td style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 700, fontSize: '13.5px', color: 'var(--text-primary)' }}>
                      {item.total}
                    </td>

                    {/* Volume Share meter */}
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                        <span>{item.share}%</span>
                        <span>Cap: {item.capacity}</span>
                      </div>
                      <div style={{ width: '100%', height: '5px', background: 'var(--bg-subtle)', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{
                          width: `${Math.min(100, Math.round((item.total / item.capacity) * 100))}%`,
                          height: '100%',
                          background: item.total >= item.capacity ? 'var(--danger)' : 'var(--accent)',
                          borderRadius: '3px'
                        }}></div>
                      </div>
                    </td>

                    {/* Demand Status */}
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '3px 8px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: 600,
                        background: demandBg,
                        color: demandColor
                      }}>
                        <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: demandColor }}></span>
                        {item.demand}
                      </span>
                    </td>

                    {/* Projected Turnout */}
                    <td style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                      ~{item.projectedTurnout} Attendees
                    </td>

                    {/* Venue Allocation */}
                    <td style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 500 }}>
                        <Building size={13} color="var(--text-dim)" />
                        <span>{item.venue}</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

