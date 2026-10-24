const serverHandler = require('../server.js');

module.exports = async (req, res) => {
  try {
    const parsed = new URL(req.url, 'http://localhost');
    const qs = parsed.search;
    req.url = '/api/content' + (qs || '');
    return await serverHandler(req, res);
  } catch (err) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ success: false, error: err.message }));
  }
};
