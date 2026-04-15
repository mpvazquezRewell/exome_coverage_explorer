import React, { useState } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, PointElement, LineElement } from 'chart.js';
import { Bar, Doughnut, Scatter } from 'react-chartjs-2';
import { covColor, statusColor } from '../utils';
import DetailPanel from './DetailPanel';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, PointElement, LineElement);

export default function MainContent({ dataLoaded, hasSearched, notFound, filteredData, allLowRegions, colSort, setColSort }) {
  const [selectedGene, setSelectedGene] = useState(null);

  if (!dataLoaded) {
    return (
      <main className="main">
        <div className="no-data-state">
          <div className="no-data-icon">🧬</div>
          <div className="no-data-title">Load coverage data to begin</div>
          <div className="no-data-sub">Drop gene_level_v2.csv and low_regions_v2.csv in the sidebar, or wait for them to auto-load.</div>
        </div>
      </main>
    );
  }

  if (!hasSearched) {
    return (
      <main className="main">
        <div className="no-data-state">
          <div className="no-data-icon">🔍</div>
          <div className="no-data-title">Search for genes</div>
          <div className="no-data-sub">Use the sidebar to search for a gene, panel, or preset to view coverage details.</div>
        </div>
      </main>
    );
  }

  const handleSort = (col) => {
    if (colSort.col === col) setColSort({ col, dir: -colSort.dir });
    else setColSort({ col, dir: -1 });
  };

  const getSortArr = (col) => colSort.col === col ? (colSort.dir === 1 ? '↑' : '↓') : '↕';

  // Summaries
  const ok = filteredData.filter(g => g.st === 'OK').length;
  const warn = filteredData.filter(g => g.st === 'WARNING').length;
  const fail = filteredData.filter(g => g.st === 'FAIL').length;
  const meanCov = filteredData.length > 0 ? (filteredData.reduce((s, g) => s + g.mc, 0) / filteredData.length).toFixed(1) : 0;
  const meanPge = filteredData.length > 0 ? ((filteredData.reduce((s, g) => s + g.pge, 0) / filteredData.length) * 100).toFixed(1) : 0;
  const totalRec = filteredData.reduce((s, g) => s + g.rl, 0);

  const pcol = +meanPge < 90 ? '#ef4444' : +meanPge < 97 ? '#f59e0b' : '#22c55e';
  const ccol = +meanCov < 50 ? '#ef4444' : +meanCov < 80 ? '#f59e0b' : '#22c55e';

  // Chart Data
  // 1. Dist Chart
  const binCounts = new Array(6).fill(0);
  filteredData.forEach(g => {
    const c = g.mc;
    if (c < 20) binCounts[0]++;
    else if (c < 50) binCounts[1]++;
    else if (c < 80) binCounts[2]++;
    else if (c < 120) binCounts[3]++;
    else if (c < 200) binCounts[4]++;
    else binCounts[5]++;
  });
  const distData = {
    labels: ['<20×', '20–50×', '50–80×', '80–120×', '120–200×', '>200×'],
    datasets: [{ data: binCounts, backgroundColor: ['#ef4444', '#f59e0b', '#fbbf24', '#63b3ed', '#22c55e', '#16a34a'], borderWidth: 0 }]
  };

  // 2. Status Chart
  const statusData = {
    labels: ['OK', 'WARNING', 'FAIL'],
    datasets: [{ data: [ok, warn, fail], backgroundColor: ['#22c55e', '#f59e0b', '#ef4444'], borderWidth: 0, hoverOffset: 4 }]
  };

  // 3. PGE Chart
  const sortedPge = [...filteredData].sort((a, b) => a.pge - b.pge);
  const pgeData = {
    labels: sortedPge.map(g => g.g),
    datasets: [{
      data: sortedPge.map(g => +(g.pge * 100).toFixed(1)),
      backgroundColor: sortedPge.map(g => g.pge < 0.90 ? '#ef4444' : g.pge < 0.97 ? '#f59e0b' : '#22c55e'),
      borderWidth: 0
    }]
  };

  // 4. Bar Chart
  const sortedBar = [...filteredData].sort((a, b) => a.mc - b.mc);
  const barData = {
    labels: sortedBar.map(g => g.g),
    datasets: [{
      data: sortedBar.map(g => g.mc),
      backgroundColor: sortedBar.map(g => statusColor(g.st)),
      borderWidth: 0,
      barPercentage: 0.9, categoryPercentage: 1
    }]
  };

  const chartOptions = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false } }
  };
  const axOptions = {
    x: { grid: { display: false }, ticks: { color: '#6b7280', font: { size: 9 } } },
    y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#6b7280', font: { size: 9 } } }
  };

  return (
    <main className="main">
      {notFound.length > 0 && (
        <div className="not-found">Not found in dataset ({notFound.length}): {notFound.join(', ')}</div>
      )}

      <div className="summary-strip">
        <div className="sc">
          <div className="sc-label">Genes queried</div>
          <div className="sc-val">{filteredData.length}</div>
          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
            <span className="badge badge-ok">{ok} OK</span>
            <span className="badge badge-warn">{warn} WARN</span>
            <span className="badge badge-fail">{fail} FAIL</span>
          </div>
        </div>
        <div className="sc">
          <div className="sc-label">Mean coverage</div>
          <div className="sc-val" style={{ color: ccol }}>{meanCov}×</div>
          <div className="sc-sub">across queried genes</div>
        </div>
        <div className="sc">
          <div className="sc-label">Mean % bases ≥20X</div>
          <div className="sc-val" style={{ color: pcol }}>{meanPge}%</div>
          <div className="sc-sub">completeness threshold</div>
        </div>
        <div className="sc">
          <div className="sc-label">Recurrent low regions</div>
          <div className="sc-val" style={{ color: totalRec > 0 ? '#ef4444' : '#22c55e' }}>{totalRec}</div>
          <div className="sc-sub">≥20% samples below 20×</div>
        </div>
      </div>

      <div className="charts-row">
        <div className="chart-card">
          <div className="chart-card-title">Coverage distribution</div>
          <div className="chart-wrap" style={{ height: 180 }}>
            <Bar data={distData} options={{...chartOptions, scales: axOptions}} />
          </div>
        </div>
        <div className="chart-card">
          <div className="chart-card-title">Gene status</div>
          <div className="legend-row">
            <span className="leg"><span className="leg-dot" style={{ background: '#22c55e' }}></span>OK ({ok})</span>
            <span className="leg"><span className="leg-dot" style={{ background: '#f59e0b' }}></span>WARN ({warn})</span>
            <span className="leg"><span className="leg-dot" style={{ background: '#ef4444' }}></span>FAIL ({fail})</span>
          </div>
          <div className="chart-wrap" style={{ height: 150 }}>
            <Doughnut data={statusData} options={{...chartOptions, cutout: '62%'}} />
          </div>
        </div>
        <div className="chart-card">
          <div className="chart-card-title">% bases ≥20X per gene</div>
          <div className="chart-wrap" style={{ height: 180 }}>
            <Bar data={pgeData} options={{
              ...chartOptions, 
              scales: { 
                x: { display: filteredData.length <= 20, grid: { display: false } }, 
                y: { min: 0, max: 100, grid:{color:'rgba(255,255,255,0.05)'}, ticks: { callback: v => v + '%' } } 
              } 
            }} />
          </div>
        </div>
        <div className="chart-card wide">
          <div className="chart-card-title">Mean coverage per gene (sorted) — colored by status</div>
          <div className="legend-row">
            <span className="leg"><span className="leg-sq" style={{ background: 'var(--ok)' }}></span>OK</span>
            <span className="leg"><span className="leg-sq" style={{ background: 'var(--warn)' }}></span>WARNING</span>
            <span className="leg"><span className="leg-sq" style={{ background: 'var(--fail)' }}></span>FAIL</span>
            <span className="leg" style={{ marginLeft: 'auto', fontSize: 10, color: 'var(--text3)' }}>Click gene in table to inspect</span>
          </div>
          <div className="chart-wrap" style={{ height: Math.max(220, filteredData.length * 5 + 60) }}>
             <Bar data={barData} options={{
               responsive: true, maintainAspectRatio: false,
               indexAxis: filteredData.length > 50 ? 'y' : 'x',
               plugins: { legend: { display: false } },
               scales: axOptions,
               onClick: (e, els) => {
                 if (els && els.length > 0) {
                   const idx = els[0].index;
                   setSelectedGene(sortedBar[idx]);
                 }
               }
             }} />
          </div>
        </div>
      </div>

      <div className="section-header">
        <div className="section-title">
          Gene results
          <span className="badge badge-neutral">{filteredData.length}</span>
        </div>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th onClick={() => handleSort('g')} className={colSort.col === 'g' ? 'sorted' : ''}>Gene <span className="sort-arr">{getSortArr('g')}</span></th>
              <th onClick={() => handleSort('nr')} className={colSort.col === 'nr' ? 'sorted' : ''}>Regions <span className="sort-arr">{getSortArr('nr')}</span></th>
              <th onClick={() => handleSort('tb')} className={colSort.col === 'tb' ? 'sorted' : ''}>Total bp <span className="sort-arr">{getSortArr('tb')}</span></th>
              <th onClick={() => handleSort('mc')} className={colSort.col === 'mc' ? 'sorted' : ''}>Mean cov. <span className="sort-arr">{getSortArr('mc')}</span></th>
              <th onClick={() => handleSort('pge')} className={colSort.col === 'pge' ? 'sorted' : ''}>% bases ≥20X <span className="sort-arr">{getSortArr('pge')}</span></th>
              <th onClick={() => handleSort('rl')} className={colSort.col === 'rl' ? 'sorted' : ''}>Recurrent low <span className="sort-arr">{getSortArr('rl')}</span></th>
              <th onClick={() => handleSort('st')} className={colSort.col === 'st' ? 'sorted' : ''}>Status <span className="sort-arr">{getSortArr('st')}</span></th>
            </tr>
          </thead>
          <tbody>
            {filteredData.map(g => (
              <tr key={g.g} onClick={() => setSelectedGene(g)} className={selectedGene?.g === g.g ? 'selected' : ''}>
                <td className="gene-col">{g.g}</td>
                <td>{g.nr}</td>
                <td>{g.tb.toLocaleString()}</td>
                <td>
                  <div className="cov-bar-wrap">
                    <div className="cov-track">
                      <div className="cov-fill" style={{ width: `${Math.min(g.mc/300*100, 100)}%`, background: covColor(g.mc) }} />
                    </div>
                    <span className="cov-val">{g.mc.toFixed(1)}×</span>
                  </div>
                </td>
                <td>
                  <div className="pct-wrap">
                    <span className="pct-bar" style={{ width: `${g.pge*60}px`, background: g.pge < 0.90 ? '#ef4444' : g.pge < 0.97 ? '#f59e0b' : '#22c55e' }} />
                    <span className="pct-val">{(g.pge * 100).toFixed(1)}%</span>
                  </div>
                </td>
                <td><span style={{ color: g.rl > 0 ? '#ef4444' : 'var(--text3)' }}>{g.rl > 0 ? `${g.rl} regions` : '—'}</span></td>
                <td>
                   <span className={`badge ${g.st === 'FAIL' ? 'badge-fail' : g.st === 'WARNING' ? 'badge-warn' : 'badge-ok'}`}>
                     {g.st}
                   </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedGene && (
        <DetailPanel 
          gene={selectedGene} 
          lowRegions={allLowRegions[selectedGene.g.toUpperCase()] || []} 
          onClose={() => setSelectedGene(null)} 
        />
      )}
    </main>
  );
}
