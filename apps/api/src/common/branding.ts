/** Identitas resmi Vita Care Hospital At Home untuk dokumen dan komunikasi. */
export const VITA_BRAND = {
  name: 'Vita Care Hospital At Home',
  tagline: 'Perawatan Profesional, Nyaman di Rumah.',
  alternateTagline: 'Hospital-Level Care, Right at Home.',
  address: 'Jl. Kecubung No. 20, Gomong, Selaparang, Kota Mataram, Nusa Tenggara Barat, Indonesia',
  coverage: 'Mataram · Lombok · Nusa Tenggara Barat',
  phone: '+62 822-2742-0800',
  email: 'vitacare87@gmail.com',
  instagram: '@vita_care87',
  colors: { green:'#0B7A5B',greenDark:'#075F47',blue:'#1F6FB2',blueDark:'#0E4C8A',slate:'#334155',muted:'#64748B',line:'#E2E8F0' },
} as const;
export function rupiah(n:number):string{return 'Rp '+Math.round(n).toLocaleString('id-ID');}
export function tanggalIndo(d:Date=new Date()):string{return d.toLocaleDateString('id-ID',{day:'numeric',month:'long',year:'numeric'});}
