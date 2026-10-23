module.exports = async (req, res) => {
  try {
    // Normalize Vercel serverless rewritten URL
    if (req.headers && req.headers['x-matched-path']) {
      req.url = req.headers['x-matched-path'];
    } else if (req.headers && req.headers['x-vercel-matched-path']) {
      req.url = req.headers['x-vercel-matched-path'];
    } else {
      const parsed = new URL(req.url, 'http://localhost');
      if (parsed.searchParams.has('0')) {
        const sub = parsed.searchParams.get('0').replace(/^\/+/, '');
        parsed.searchParams.delete('0');
        const qs = parsed.searchParams.toString();
        req.url = '/api/' + sub + (qs ? '?' + qs : '');
      }
    }

    const serverHandler = require('../server.js');
    return await serverHandler(req, res);
  } catch (err) {
    console.error('[API INVOCATION ERROR]', err);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({
      error: err.message,
      stack: err.stack,
      name: err.name,
      code: err.code
    }));
  }
};
