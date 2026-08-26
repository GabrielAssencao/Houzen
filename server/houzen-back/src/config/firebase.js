const jwt = require('jsonwebtoken');

const FIREBASE_CERTS_URL = 'https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com';

let cachedCertificates = {};
let certificatesExpireAt = 0;

async function getCertificates() {
  if (Date.now() < certificatesExpireAt && Object.keys(cachedCertificates).length > 0) {
    return cachedCertificates;
  }

  const response = await fetch(FIREBASE_CERTS_URL, { signal: AbortSignal.timeout(5000) });
  if (!response.ok) throw new Error(`Falha ao obter certificados do Firebase (${response.status}).`);

  const certificates = await response.json();
  const cacheControl = response.headers.get('cache-control') || '';
  const maxAge = Number(cacheControl.match(/max-age=(\d+)/i)?.[1] || 3600);
  cachedCertificates = certificates;
  certificatesExpireAt = Date.now() + Math.max(maxAge - 60, 60) * 1000;
  return certificates;
}

async function verifyFirebaseIdToken(idToken) {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  if (!projectId) {
    const error = new Error('FIREBASE_PROJECT_ID nÃ£o configurado.');
    error.code = 'FIREBASE_NOT_CONFIGURED';
    throw error;
  }

  const decodedHeader = jwt.decode(idToken, { complete: true });
  const kid = decodedHeader?.header?.kid;
  if (decodedHeader?.header?.alg !== 'RS256' || !kid) {
    const error = new Error('CabeÃ§alho do token Firebase invÃ¡lido.');
    error.code = 'FIREBASE_INVALID_TOKEN';
    throw error;
  }

  const certificates = await getCertificates();
  if (!Object.hasOwn(certificates, kid)) {
    certificatesExpireAt = 0;
    const refreshedCertificates = await getCertificates();
    if (!Object.hasOwn(refreshedCertificates, kid)) {
      const error = new Error('Certificado do token Firebase desconhecido.');
      error.code = 'FIREBASE_INVALID_TOKEN';
      throw error;
    }
  }

  try {
    const payload = jwt.verify(idToken, cachedCertificates[kid], {
      algorithms: ['RS256'],
      audience: projectId,
      issuer: `https://securetoken.google.com/${projectId}`,
      clockTolerance: 5
    });
    const now = Math.floor(Date.now() / 1000);
    if (!payload.sub || payload.sub.length > 128 || payload.iat > now + 5 || payload.auth_time > now + 5) {
      throw new Error('Claims temporais ou subject invÃ¡lidos.');
    }
    return { ...payload, uid: payload.sub };
  } catch (cause) {
    const error = new Error('Token Firebase invÃ¡lido ou expirado.');
    error.code = 'FIREBASE_INVALID_TOKEN';
    error.cause = cause;
    throw error;
  }
}

module.exports = { verifyFirebaseIdToken };
