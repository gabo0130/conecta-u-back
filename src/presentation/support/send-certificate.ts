import type { Response } from 'express';
import type { CertificateFile } from '../../domain/repositories/experience-certificate.repository.interface';

/**
 * Envía el certificado en línea (para verlo en el navegador). `nosniff` y la CSP evitan que
 * un archivo manipulado se ejecute como HTML; el nombre va codificado (RFC 5987).
 */
export function sendCertificate(res: Response, file: CertificateFile): void {
  res.set({
    'Content-Type': file.mimeType,
    'Content-Length': String(file.content.length),
    'Content-Disposition': `inline; filename="certificado"; filename*=UTF-8''${encodeURIComponent(file.fileName)}`,
    'X-Content-Type-Options': 'nosniff',
    'Content-Security-Policy': "default-src 'none'; sandbox",
    'Cache-Control': 'private, no-store',
  });
  res.send(file.content);
}
