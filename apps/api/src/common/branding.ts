/** Identitas & kop surat resmi Vita Care Lombok (dipakai pada PDF & laporan). */
export const VITA_BRAND = {
  name: 'Vita Care Lombok',
  tagline: 'Layanan Kesehatan Home Care Profesional',
  address: 'Jl. Kecubung No. 20, Gomong, Selaparang, Kota Mataram, NTB',
  coverage: 'Mataram · Lombok Barat · Lombok Tengah',
  phone: '+62 822-2742-0800',
  email: 'vitacare87@gmail.com',
  instagram: '@vita_care87',
  colors: {
    green: '#0B7A5B',
    greenDark: '#075F47',
    blue: '#1F6FB2',
    blueDark: '#0E4C8A',
    slate: '#334155',
    muted: '#64748B',
    line: '#E2E8F0',
  },
} as const;

export function rupiah(n: number): string {
  return 'Rp ' + Math.round(n).toLocaleString('id-ID');
}

export function tanggalIndo(d: Date = new Date()): string {
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
}
