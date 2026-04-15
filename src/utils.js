export const covColor = c => c < 20 ? '#ef4444' : c < 50 ? '#f59e0b' : c < 80 ? '#63b3ed' : '#22c55e';
export const statusColor = s => s === 'FAIL' ? '#ef4444' : s === 'WARNING' ? '#f59e0b' : '#22c55e';

export function parseGeneList(raw) {
  return [...new Set(
    raw.split(/[\n,;\t]+/).map(s => s.trim().toUpperCase()).filter(Boolean)
  )];
}

export const PRESETS = {
  'BRCA panel':     'BRCA1,BRCA2,PALB2,BRIP1,RAD51C,RAD51D,CHEK2,ATM,NBN,BARD1',
  'Lynch / MMR':    'MLH1,MSH2,MSH6,PMS2,EPCAM',
  'Li-Fraumeni':    'TP53,CHEK2,ATM,BRCA1,BRCA2',
  'APC / colon':    'APC,MUTYH,MLH1,MSH2,MSH6,PMS2,EPCAM,SMAD4,BMPR1A,STK11',
  'PTEN / hamartoma': 'PTEN,STK11,SMAD4,BMPR1A',
  'Cardiac panel':  'MYH7,MYBPC3,TNNT2,TNNI3,TPM1,MYL2,MYL3,SCN5A,KCNQ1,KCNH2',
};
