import {
  detectCertificateMimeType,
  requiresCertificate,
  sanitizeCertificateFileName,
} from './experience-certificate';

describe('experience certificate rules', () => {
  it('requires a certificate only for work, internship and teaching experience', () => {
    expect(requiresCertificate('LABORAL')).toBe(true);
    expect(requiresCertificate('PRACTICA')).toBe(true);
    expect(requiresCertificate('DOCENCIA')).toBe(true);
    expect(requiresCertificate('PROYECTO_ACADEMICO')).toBe(false);
    expect(requiresCertificate('VOLUNTARIADO')).toBe(false);
  });

  it('detects the real type by the file signature', () => {
    expect(detectCertificateMimeType(Buffer.from('%PDF-1.7\n'))).toBe(
      'application/pdf',
    );
    expect(
      detectCertificateMimeType(
        Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0]),
      ),
    ).toBe('image/png');
    expect(
      detectCertificateMimeType(Buffer.from([0xff, 0xd8, 0xff, 0xe0])),
    ).toBe('image/jpeg');
    expect(detectCertificateMimeType(Buffer.from('<html>%PDF-'))).toBeNull();
    expect(detectCertificateMimeType(Buffer.alloc(0))).toBeNull();
  });

  it('builds a safe file name with the extension of the real type', () => {
    expect(
      sanitizeCertificateFileName(
        'C:\\fakepath\\Certificado laboral.PDF',
        'application/pdf',
      ),
    ).toBe('Certificado laboral.pdf');
    expect(
      sanitizeCertificateFileName('../../etc/"pass"wd.exe', 'image/png'),
    ).toBe('passwd.png');
    expect(sanitizeCertificateFileName(undefined, 'image/jpeg')).toBe(
      'certificado.jpg',
    );
    expect(
      sanitizeCertificateFileName('a'.repeat(300) + '.pdf', 'application/pdf'),
    ).toHaveLength(160);
  });
});
