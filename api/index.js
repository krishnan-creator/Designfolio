module.exports = async (req, res) => {
  try {
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
