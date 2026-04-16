import React, { useState, useRef } from 'react';
import { PRESETS, parseGeneList } from '../utils';
import { X, Info, ChevronDown, ChevronUp } from 'lucide-react';

export default function Sidebar({
  isOpen, setIsOpen,
  dataLoaded, loadStatus, parseFiles,
  onSearch, onClear,
  genesData,
  statusFilter, setStatusFilter,
  sortBy, setSortBy
}) {
  const [singleSearch, setSingleSearch] = useState('');
  const [panelInput, setPanelInput] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const fileInputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault(); e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    else if (e.type === 'dragleave') setDragActive(false);
  };
  
  const handleDrop = async (e) => {
    e.preventDefault(); e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      loadFiles(e.dataTransfer.files);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      loadFiles(e.target.files);
    }
  };

  const loadFiles = async (files) => {
    const fileArray = Array.from(files);
    const gFile = fileArray.find(f => f.name.includes('gene_level'));
    const lFile = fileArray.find(f => f.name.includes('low_region'));
    const pFile = fileArray.find(f => f.name.includes('Pseudogenes'));
    
    if (!gFile && !lFile && !pFile) {
      alert('Please drop gene_level_v2.csv, low_regions_v2.csv and/or Pseudogenes_2026.csv');
      return;
    }

    let geneText, lowText, pseudoText;
    if (gFile) geneText = await gFile.text();
    if (lFile) lowText = await lFile.text();
    if (pFile) pseudoText = await pFile.text();
    parseFiles(geneText, lowText, pseudoText);
  };

  const handleSearch = () => {
    const s = singleSearch.trim().toUpperCase();
    const p = panelInput.trim();
    let query = [];
    if (s) query = [s];
    else if (p) query = parseGeneList(p);
    
    if (!query.length) {
      alert('Enter at least one gene name.');
      return;
    }
    onSearch(query);
  };

  const handleClear = () => {
    setSingleSearch('');
    setPanelInput('');
    onClear();
  };

  // Global metrics derived from genesData
  const genes = Object.values(genesData);
  const totalGenes = genes.length;
  const failGenes = genes.filter(g => g.st === 'FAIL').length;
  const failPct = totalGenes > 0 ? (failGenes / totalGenes * 100).toFixed(1) : 0;
  const meanAll = totalGenes > 0 ? (genes.reduce((s, g) => s + g.mc, 0) / totalGenes).toFixed(1) : 0;

  return (
    <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
      {/* Mobile close button inside sidebar header space potentially, or absolute */}
      <button 
        className="mobile-menu-btn" 
        onClick={() => setIsOpen(false)}
        style={{ position: 'absolute', top: '10px', right: '10px', zIndex: 60 }}
      >
        <X size={20} />
      </button>

      <div className="sidebar-section">
        <div className="sidebar-label">Data source</div>
        <div 
          className={`load-zone ${dragActive ? 'drag' : ''} ${dataLoaded ? 'loaded' : ''}`}
          onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}
          onClick={() => fileInputRef.current.click()}
        >
          <div className="load-zone-icon">{dataLoaded ? '✓' : '📂'}</div>
          <p><strong>{dataLoaded ? 'Data Loaded' : 'Drop CSV files here'}</strong></p>
          <p style={{ marginTop: 4 }}>gene_level_v2.csv<br />low_regions_v2.csv<br />Pseudogenes_2026.csv</p>
          <input type="file" ref={fileInputRef} multiple accept=".csv" style={{ display: 'none' }} onChange={handleFileChange} />
          <div className="load-status" style={{ color: dataLoaded ? 'var(--ok)' : 'inherit' }}>{loadStatus}</div>
        </div>
      </div>

      <div className="sidebar-section">
        <div className="sidebar-label">Gene search</div>
        <div className="input-label">Single gene</div>
        <input 
          type="text" className="search-input" placeholder="BRCA1, TP53, ATM…" 
          value={singleSearch} onChange={e => { setSingleSearch(e.target.value); setPanelInput(''); }}
          onKeyDown={e => e.key === 'Enter' && handleSearch()}
        />
        <div style={{ margin: '10px 0', textAlign: 'center', fontSize: 11, color: 'var(--text3)' }}>— or —</div>
        <div className="input-label">Panel / gene list</div>
        <textarea 
          placeholder="Paste genes one per line or comma-separated&#10;&#10;BRCA1&#10;BRCA2&#10;TP53&#10;…"
          value={panelInput} onChange={e => { setPanelInput(e.target.value); setSingleSearch(''); }}
        />
        <div className="btn-row">
          <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleSearch}>Search</button>
          <button className="btn btn-sm" onClick={handleClear}>Clear</button>
        </div>
      </div>

      <div className="sidebar-section">
        <div className="sidebar-label">Clinical presets</div>
        <div className="presets-grid">
          {Object.entries(PRESETS).map(([name, genesStr]) => (
            <button 
              key={name} className="preset-btn" title={genesStr.replace(/,/g, ', ')}
              onClick={() => {
                setPanelInput(genesStr.replace(/,/g, '\n'));
                setSingleSearch('');
              }}
            >
              {name}
            </button>
          ))}
        </div>
      </div>

      <div className="sidebar-section">
        <div className="sidebar-label">Filters</div>
        <div className="filter-group">
          <div>
            <div className="input-label">Status</div>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option value="ALL">All statuses</option>
              <option value="FAIL">FAIL only</option>
              <option value="WARNING">WARNING only</option>
              <option value="OK">OK only</option>
            </select>
          </div>
          <div>
            <div className="input-label">Sort by</div>
            <select value={sortBy} onChange={e => setSortBy(e.target.value)}>
              <option value="name">Gene name A→Z</option>
              <option value="cov_asc">Coverage ↑ (lowest first)</option>
              <option value="cov_desc">Coverage ↓ (highest first)</option>
              <option value="fail_first">FAIL → WARNING → OK</option>
              <option value="recurrent_desc">Recurrent low regions ↓</option>
              <option value="pge_asc">% bases ≥20X ↑</option>
            </select>
          </div>
        </div>
      </div>

      {dataLoaded && (
        <div className="sidebar-section" id="globalMetricsSection">
          <div className="sidebar-label">Dataset overview</div>
          <div className="global-metrics">
            <div className="gm-card">
              <div className="gm-label">Genes</div>
              <div className="gm-val">{totalGenes.toLocaleString()}</div>
              <div className="gm-sub">gene symbols</div>
            </div>
            <div className="gm-card">
              <div className="gm-label">Samples</div>
              <div className="gm-val" style={{ color: 'var(--ok)' }}>17</div>
              <div className="gm-sub">QC-pass</div>
            </div>
            <div className="gm-card">
              <div className="gm-label">FAIL</div>
              <div className="gm-val" style={{ color: 'var(--fail)' }}>{failGenes.toLocaleString()}</div>
              <div className="gm-sub">{failPct}% of total</div>
            </div>
            <div className="gm-card">
              <div className="gm-label">Mean cov.</div>
              <div className="gm-val">{meanAll}×</div>
              <div className="gm-sub">all genes</div>
            </div>
          </div>
        </div>
      )}

      <div className="sidebar-section">
        <div className="sidebar-label">Help & Guidelines</div>
        <button 
          className="btn btn-sm" 
          style={{ width: '100%', justifyContent: 'space-between', border: 'none', background: 'var(--surface2)', padding: '8px 12px' }}
          onClick={() => setShowRules(!showRules)}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Info size={14} color="var(--accent)" /> Quality Thresholds
          </span>
          {showRules ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
        
        {showRules && (
          <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ fontSize: '11px', lineHeight: '1.4' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                <span className="badge badge-fail">FAIL</span>
                <span style={{ color: 'var(--text)' }}>Strict Failure</span>
              </div>
              <p style={{ color: 'var(--text2)' }}>
                Mean Coverage <strong>{"< 10X"}</strong>, or <strong>{">= 10 Recurrent"}</strong> low regions. 
                Also if Coverage 10-20X but with low bases @ 20X or recurrent regions.
              </p>
            </div>
            
            <div style={{ fontSize: '11px', lineHeight: '1.4' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                <span className="badge badge-warn">WARNING</span>
                <span style={{ color: 'var(--text)' }}>Requires Review</span>
              </div>
              <p style={{ color: 'var(--text2)' }}>
                Coverage <strong>{"< 50X"}</strong>, or <strong>{">= 2 Recurrent"}</strong> regions. 
                <em> Note: Genes with 10-20X pass to Warning if Bases ≥20X ≥94% and 0 recurrent.</em>
              </p>
            </div>

            <div style={{ fontSize: '11px', lineHeight: '1.4' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                <span className="badge badge-ok">OK</span>
                <span style={{ color: 'var(--text)' }}>Pass</span>
              </div>
              <p style={{ color: 'var(--text2)' }}>
                Mean Coverage <strong>{">= 50X"}</strong> and <strong>{"< 2 Recurrent"}</strong> regions.
              </p>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
