import React, { useState } from 'react';
import { Scatter } from 'react-chartjs-2';
import { covColor } from '../utils';

export default function DetailPanel({ gene, lowRegions, onClose }) {
  const [activeTab, setActiveTab] = useState('low-regions');

  // Filter low regions to remove micro regions if needed. Wait, we already did it during parsing <= 4.
  const displayRegs = lowRegions.sort((a,b) => a.s - b.s); // sort by start pos

  const badgeClass = gene.st === 'FAIL' ? 'badge-fail' : gene.st === 'WARNING' ? 'badge-warn' : 'badge-ok';

  // Map Data
  const mapData = {
    datasets: [{
      label: 'Coverage',
      data: displayRegs.map(r => ({ x: r.s, y: r.cov })),
      backgroundColor: displayRegs.map(r => covColor(r.cov)),
      pointRadius: 4, pointHoverRadius: 6
    }]
  };

  const mapOptions = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { title: { display: true, text: 'Genomic Coordinate' }, grid: { display: false }, ticks: { color: '#6b7280' } },
      y: { title: { display: true, text: 'Mean Coverage' }, grid: { color: 'rgba(255,255,255,0.05)' }, min: 0 }
    }
  };

  return (
    <div className="detail-panel">
      <div className="detail-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span className="detail-gene-name">{gene.g}</span>
          <span className={`badge ${badgeClass}`}>{gene.st}</span>
        </div>
        <button className="btn btn-sm" onClick={onClose}>✕ Close</button>
      </div>

      <div className="detail-stats-row">
        <div className="detail-stat">
          <div className="detail-stat-label">Total Bases</div>
          <div className="detail-stat-val">{gene.tb.toLocaleString()}</div>
        </div>
        <div className="detail-stat">
          <div className="detail-stat-label">Mean Cov.</div>
          <div className="detail-stat-val" style={{ color: covColor(gene.mc) }}>{gene.mc.toFixed(1)}×</div>
        </div>
        <div className="detail-stat">
          <div className="detail-stat-label">Min Region Cov.</div>
          <div className="detail-stat-val" style={{ color: covColor(gene.min) }}>{gene.min.toFixed(1)}×</div>
        </div>
        <div className="detail-stat">
          <div className="detail-stat-label">Recurrent Low</div>
          <div className="detail-stat-val" style={{ color: gene.rl > 0 ? '#ef4444' : '#22c55e' }}>{gene.rl}</div>
        </div>
        <div className="detail-stat">
          <div className="detail-stat-label">% Bases ≥20X</div>
          <div className="detail-stat-val">{(gene.pge * 100).toFixed(1)}%</div>
        </div>
      </div>
      
      {gene.ps && (
        <div style={{ margin: '16px 20px', padding: '12px 16px', background: 'rgba(245,158,11,0.08)', borderRadius: 'var(--radius)', border: '1px solid rgba(245,158,11,0.2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span style={{ fontSize: '16px' }}>⚠️</span>
            <span style={{ fontSize: '14px', fontWeight: '500', color: '#f59e0b' }}>Pseudogen Detectado</span>
          </div>
          <p style={{ fontSize: '12px', color: 'var(--text2)', lineHeight: '1.4' }}>
            Este gen tiene regiones de duplicación (pseudogén) que pueden interferir con el análisis por NGS.
          </p>
          <div style={{ marginTop: '8px', display: 'flex', flexWrap: 'wrap', gap: '20px' }}>
            <div>
              <div style={{ fontSize: '10px', color: 'var(--text3)', textTransform: 'uppercase' }}>Transcript</div>
              <div style={{ fontSize: '12px', fontFamily: 'var(--mono)', color: 'var(--text)' }}>{gene.ps.tx}</div>
            </div>
            <div>
              <div style={{ fontSize: '10px', color: 'var(--text3)', textTransform: 'uppercase' }}>Exones Afectados</div>
              <div style={{ fontSize: '12px', fontFamily: 'var(--mono)', color: 'var(--text)' }}>{gene.ps.exons}</div>
            </div>
            {gene.ps.sev && (
              <div>
                <div style={{ fontSize: '10px', color: 'var(--text3)', textTransform: 'uppercase' }}>Críticos (&gt;98% Homología)</div>
                <div style={{ fontSize: '12px', fontFamily: 'var(--mono)', color: '#ef4444' }}>{gene.ps.sev}</div>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="tabs">
        <div className={`tab ${activeTab === 'low-regions' ? 'active' : ''}`} onClick={() => setActiveTab('low-regions')}>
          Low-coverage regions ({displayRegs.length})
        </div>
        <div className={`tab ${activeTab === 'map' ? 'active' : ''}`} onClick={() => setActiveTab('map')}>
           Coverage map
        </div>
      </div>

      <div className={`tab-panel ${activeTab === 'low-regions' ? 'active' : ''}`}>
        {displayRegs.length > 0 ? (
          <div className="table-wrap">
            <table className="region-table">
              <thead>
                <tr>
                  <th>Chrom</th>
                  <th>Start</th>
                  <th>End</th>
                  <th>Length</th>
                  <th>Mean cov.</th>
                  <th>Samples &lt;20X</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {displayRegs.map((r, i) => {
                  const isRec = r.status.includes('Recurrent');
                  const isFocal = r.status.includes('Focal');
                  const rowClass = isRec ? 'region-row-recurrent' : isFocal ? 'region-row-focal' : '';
                  return (
                    <tr key={i} className={rowClass}>
                      <td>{r.chr}</td>
                      <td style={{fontFamily:'var(--mono)'}}>{r.s.toLocaleString()}</td>
                      <td style={{fontFamily:'var(--mono)'}}>{r.e.toLocaleString()}</td>
                      <td>{r.len} bp</td>
                      <td style={{ color: covColor(r.cov), fontWeight: 500 }}>{r.cov.toFixed(1)}×</td>
                      <td>{r.nb} / 17 ({(r.pct * 100).toFixed(0)}%)</td>
                      <td><span style={{ fontSize: 11 }}>{r.status}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-msg">No low coverage regions (≤20×) found.</div>
        )}
      </div>

      <div className={`tab-panel ${activeTab === 'map' ? 'active' : ''}`}>
        {displayRegs.length > 0 ? (
          <div className="chart-wrap" style={{ height: 200 }}>
             <Scatter data={mapData} options={mapOptions} />
          </div>
        ) : (
           <div className="empty-msg">No data to map</div>
        )}
      </div>
    </div>
  );
}
