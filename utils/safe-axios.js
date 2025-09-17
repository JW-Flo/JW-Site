// Minimal safe Axios wrapper for Node.js usage in this repo.
// - Enforces size limits for data: URLs before axios decodes them
// - Sets conservative maxContentLength/maxBodyLength defaults
// NOTE: axios >=1.12.0 contains upstream fixes; this is an extra hardening.

const axios = require('axios');

const DEFAULT_LIMIT = 10 * 1024 * 1024; // 10MB

function getLimits(cfg = {}) {
  const maxContentLength = typeof cfg.maxContentLength === 'number' ? cfg.maxContentLength : DEFAULT_LIMIT;
  const maxBodyLength = typeof cfg.maxBodyLength === 'number' ? cfg.maxBodyLength : DEFAULT_LIMIT;
  const floor = Math.min(maxContentLength, maxBodyLength);
  return { maxContentLength, maxBodyLength, floor };
}

function isDataUrl(url) {
  return typeof url === 'string' && url.startsWith('data:');
}

function estimateBase64Bytes(b64) {
  // Rough estimate: 3/4 of base64 length, minus padding
  const len = b64.length;
  let padding = 0;
  if (b64.endsWith('==')) padding = 2; else if (b64.endsWith('=')) padding = 1;
  return Math.floor((len * 3) / 4) - padding;
}

function createSafeAxios(defaults = {}) {
  const limits = getLimits(defaults);
  const instance = axios.create({
    maxContentLength: limits.maxContentLength,
    maxBodyLength: limits.maxBodyLength,
    ...defaults,
  });

  instance.interceptors.request.use((config) => {
    try {
      const url = config.url || '';
      if (isDataUrl(url)) {
        const commaIdx = url.indexOf(',');
        const meta = url.slice(0, commaIdx);
        const payload = url.slice(commaIdx + 1);
        const isBase64 = /;base64/i.test(meta);
        const mime = meta.slice('data:'.length).split(';')[0] || 'text/plain;charset=US-ASCII';
        const estBytes = isBase64 ? estimateBase64Bytes(payload) : payload.length;
        const { floor } = getLimits(config);
        if (estBytes > floor) {
          throw new Error(`data: URI payload too large (${estBytes} bytes > limit ${floor})`);
        }

        const streamDataAdapter = () => {
          const { Readable } = require('stream');
          const headers = { 'content-type': mime };
          const stream = new Readable({ read() {} });
          let pushed = 0;
          const pushChunk = (buf) => {
            pushed += buf.length;
            if (pushed > floor) {
              stream.destroy(new Error(`data: stream exceeded limit ${floor}`));
              return false;
            }
            stream.push(buf);
            return true;
          };
          if (isBase64) {
            const CHUNK = 8192;
            for (let i = 0; i < payload.length; i += CHUNK) {
              const buf = Buffer.from(payload.slice(i, i + CHUNK), 'base64');
              if (!pushChunk(buf)) break;
            }
          } else {
            const CHUNK = 16384;
            for (let i = 0; i < payload.length; i += CHUNK) {
              const buf = Buffer.from(payload.slice(i, i + CHUNK), 'utf8');
              if (!pushChunk(buf)) break;
            }
          }
          stream.push(null);
          headers['content-length'] = String(pushed);
          return {
            data: stream, status: 200, statusText: 'OK', headers, config, request: null,
          };
        };

        const bufferDataAdapter = () => {
          const headers = { 'content-type': mime };
          const chunks = [];
          let total = 0;
          const addChunk = (buf) => {
            total += buf.length;
            if (total > floor) throw new Error(`data: payload exceeded limit ${floor}`);
            chunks.push(buf);
          };
          if (isBase64) {
            const CHUNK = 8192;
            for (let i = 0; i < payload.length; i += CHUNK) addChunk(Buffer.from(payload.slice(i, i + CHUNK), 'base64'));
          } else {
            const CHUNK = 16384;
            for (let i = 0; i < payload.length; i += CHUNK) addChunk(Buffer.from(payload.slice(i, i + CHUNK), 'utf8'));
          }
          const data = Buffer.concat(chunks, total);
          headers['content-length'] = String(total);
          return { data, status: 200, statusText: 'OK', headers, config, request: null };
        };

        // Use a custom adapter that decodes in chunks and optionally streams
        config.adapter = async () => (config.responseType === 'stream' ? streamDataAdapter() : bufferDataAdapter());
      }
    } catch (e) {
      return Promise.reject(e);
    }
    return config;
  });

  return instance;
}

// Default shared instance
const safeAxios = createSafeAxios();

module.exports = {
  axios: safeAxios,
  createSafeAxios,
};
