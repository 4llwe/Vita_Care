import { presignS3, publicS3Url, loadS3Config, S3Config } from './sigv4';

const cfg: S3Config = {
  endpoint: 'https://s3.ap-southeast-1.amazonaws.com',
  bucket: 'vitacare-evidence',
  region: 'ap-southeast-1',
  accessKey: 'AKIAEXAMPLE',
  secretKey: 'secretExampleKey',
};
const fixedNow = new Date('2026-06-27T06:00:00.000Z');

describe('presignS3', () => {
  it('menghasilkan URL PUT dengan komponen SigV4 wajib', () => {
    const url = presignS3(cfg, { method: 'PUT', key: 'documents/abc.pdf', now: fixedNow });
    expect(url).toContain('/vitacare-evidence/documents/abc.pdf?');
    expect(url).toContain('X-Amz-Algorithm=AWS4-HMAC-SHA256');
    expect(url).toContain('X-Amz-Credential=');
    expect(url).toContain('X-Amz-Date=20260627T060000Z');
    expect(url).toContain('X-Amz-Signature=');
  });

  it('bersifat deterministik untuk input + waktu yang sama', () => {
    const a = presignS3(cfg, { method: 'GET', key: 'k/x.png', now: fixedNow });
    const b = presignS3(cfg, { method: 'GET', key: 'k/x.png', now: fixedNow });
    expect(a).toBe(b);
  });

  it('publicS3Url memakai path-style', () => {
    expect(publicS3Url(cfg, 'a/b.pdf')).toBe('https://s3.ap-southeast-1.amazonaws.com/vitacare-evidence/a/b.pdf');
  });

  it('loadS3Config mengembalikan null bila env tidak lengkap', () => {
    expect(loadS3Config({} as NodeJS.ProcessEnv)).toBeNull();
  });
});
