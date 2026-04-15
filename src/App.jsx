import React, { useState, useEffect, useMemo } from 'react';
import Papa from 'papaparse';
import { Menu, X } from 'lucide-react';
import Sidebar from './components/Sidebar';
import MainContent from './components/MainContent';

export default function App() {
  const [genesData, setGenesData] = useState({});
  const [lowRegionsData, setLowRegionsData] = useState({});
  const [dataLoaded, setDataLoaded] = useState(false);
  const [loadStatus, setLoadStatus] = useState('No data loaded');
  
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Search parameters
  const [searchResults, setSearchResults] = useState([]);
  const [notFound, setNotFound] = useState([]);
  const [hasSearched, setHasSearched] = useState(false);
  
  // Filters
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('name');
  const [colSort, setColSort] = useState({ col: null, dir: 1 });

  // Load from public directory Option A on mount
  useEffect(() => {
    const fetchDefaultData = async () => {
      setLoadStatus('Fetching default data...');
      try {
        const [geneRes, lowRes] = await Promise.all([
          fetch('/gene_level_v2.csv').catch(() => null),
          fetch('/low_regions_v2.csv').catch(() => null)
        ]);
        
        let geneText = null, lowText = null;
        if (geneRes && geneRes.ok) geneText = await geneRes.text();
        if (lowRes && lowRes.ok) lowText = await lowRes.text();
        
        if (geneText || lowText) {
          parseFiles(geneText, lowText);
        } else {
          setLoadStatus('No default data. Drop CSV files below.');
        }
      } catch (err) {
        console.error(err);
        setLoadStatus('Failed to load default data. Drop CSV files below.');
      }
    };
    fetchDefaultData();
  }, []);

  const parseFiles = (geneRaw, lowRaw) => {
    setLoadStatus('Loading...');
    let tempGenes = {};
    let tempLow = {};
    
    // Parse Gene Data
    if (geneRaw) {
      const res = Papa.parse(geneRaw, { header: true, skipEmptyLines: true });
      res.data.forEach(r => {
        if (r.Entity_type && r.Entity_type !== 'Gene symbol') return;
        if (!r.Gene) return;
        tempGenes[r.Gene.toUpperCase()] = {
          g: r.Gene,
          nr: +r.N_regions || 0,
          tb: +r.Total_bases || 0,
          mc: parseFloat(r.Mean_coverage) || 0,
          med: parseFloat(r.Median_coverage) || 0,
          min: parseFloat(r.Min_region_coverage) || 0,
          la: +r.Low_regions_any || 0,
          rl: +r.Recurrent_low_regions || 0,
          pge: parseFloat(r.Est_pct_bases_ge20) || 0,
          plo: parseFloat(r.Est_pct_bases_low20) || 0,
          st: r.Default_status || 'OK'
        };
      });
    }

    // Parse Low Regions Data
    if (lowRaw) {
      const res = Papa.parse(lowRaw, { header: true, skipEmptyLines: true });
      res.data.forEach(r => {
        if (!r.Gene) return;
        if ((+r.Region_len || 0) <= 4) return;
        const key = r.Gene.toUpperCase();
        if (!tempLow[key]) tempLow[key] = [];
        tempLow[key].push({
          chr: r.Chrom, s: +r.Start, e: +r.End,
          len: +r.Region_len || 0,
          cov: parseFloat(r.Mean_coverage) || 0,
          nb: +r.Samples_below_20X || 0,
          pct: parseFloat(r.Pct_samples_below_20X) || 0,
          status: r.Region_status || ''
        });
      });
    }

    // Recompute Recurrent
    if (Object.keys(tempLow).length > 0) {
      Object.keys(tempGenes).forEach(key => {
        const g = tempGenes[key];
        const lowRegs = tempLow[key] || [];
        const recCount = lowRegs.filter(r => r.status && r.status.includes('Recurrent')).length;
        g.rl = recCount;
        if (recCount >= 10 || g.mc < 20) g.st = 'FAIL';
        else if (recCount >= 2 || g.mc < 50) g.st = 'WARNING';
        else g.st = 'OK';
      });
    }

    if (Object.keys(tempGenes).length > 0 || Object.keys(tempLow).length > 0) {
      setGenesData(tempGenes);
      setLowRegionsData(tempLow);
      setDataLoaded(true);
      const gCount = Object.keys(tempGenes).length;
      const lCount = Object.keys(tempLow).length;
      setLoadStatus(`${gCount.toLocaleString()} genes · ${lCount.toLocaleString()} w/ low regions`);
    } else {
      setLoadStatus('Data format error or empty data.');
    }
  };

  const clearSearch = () => {
    setSearchResults([]);
    setNotFound([]);
    setHasSearched(false);
  };

  const handleSearchClick = (queryArray) => {
    if (!dataLoaded) {
      alert('Load the CSV files first.');
      return;
    }
    const found = [];
    const nFound = [];
    queryArray.forEach(g => genesData[g] ? found.push(genesData[g]) : nFound.push(g));
    
    setSearchResults(found);
    setNotFound(nFound);
    setHasSearched(true);
    setColSort({ col: null, dir: 1 });
    // Close sidebar on mobile after search
    if (window.innerWidth < 768) setSidebarOpen(false);
  };

  // Filtered and sorted data
  const filteredData = useMemo(() => {
    let d = statusFilter === 'ALL' ? [...searchResults] : searchResults.filter(g => g.st === statusFilter);
    if (sortBy === 'name') d.sort((a,b) => a.g.localeCompare(b.g));
    else if (sortBy === 'cov_asc') d.sort((a,b) => a.mc - b.mc);
    else if (sortBy === 'cov_desc') d.sort((a,b) => b.mc - a.mc);
    else if (sortBy === 'fail_first') { const o={FAIL:0,WARNING:1,OK:2}; d.sort((a,b)=>(o[a.st]||2)-(o[b.st]||2)); }
    else if (sortBy === 'recurrent_desc') d.sort((a,b) => b.rl - a.rl);
    else if (sortBy === 'pge_asc') d.sort((a,b) => a.pge - b.pge);
    
    if (colSort.col) {
      d.sort((a,b) => {
        const va = a[colSort.col], vb = b[colSort.col];
        return colSort.dir * (typeof va === 'string' ? va.localeCompare(vb) : va - vb);
      });
    }
    return d;
  }, [searchResults, statusFilter, sortBy, colSort]);

  return (
    <>
      <div className="topbar">
        <div className="topbar-left">
          <button className="mobile-menu-btn" onClick={() => setSidebarOpen(true)}>
            <Menu size={20} />
          </button>
          <span className="topbar-logo">HÉRITAS</span>
          <div className="topbar-sep"></div>
          <span className="topbar-title">Exome 2.5 Coverage Explorer</span>
        </div>
        <div className="topbar-right">
          <div className="chip"><span className="chip-dot"></span>DRAGEN · Illumina Exome 2.5</div>
          <div className="chip">— {dataLoaded ? '17 QC-pass ' : ''}samples</div>
        </div>
      </div>
      
      <div className="layout">
        {/* Mobile Overlay */}
        <div 
          className={`sidebar-overlay ${sidebarOpen ? 'open' : ''}`} 
          onClick={() => setSidebarOpen(false)} 
        />
        
        <Sidebar 
          isOpen={sidebarOpen}
          setIsOpen={setSidebarOpen}
          dataLoaded={dataLoaded}
          loadStatus={loadStatus}
          parseFiles={parseFiles}
          onSearch={handleSearchClick}
          onClear={clearSearch}
          genesData={genesData}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          sortBy={sortBy}
          setSortBy={setSortBy}
        />
        
        <MainContent 
          dataLoaded={dataLoaded}
          hasSearched={hasSearched}
          notFound={notFound}
          filteredData={filteredData}
          allLowRegions={lowRegionsData}
          colSort={colSort}
          setColSort={setColSort}
        />
      </div>
    </>
  );
}
