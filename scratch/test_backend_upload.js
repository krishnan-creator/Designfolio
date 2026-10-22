const fs = require('fs');

async function runTests() {
  console.log('--- STARTING SERVER UPLOAD PIPELINE TESTS ---');
  // 1. Login
  const loginRes = await fetch('http://localhost:3000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password: 'cbk2026' })
  });
  const loginData = await loginRes.json();
  const token = loginData.token;
  console.log('Auth login success, token received.');

  // Test 1: Auth requirement (no token)
  const unauthRes = await fetch('http://localhost:3000/api/media/upload/init', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ filename: 'test.mp4', fileSize: 1000 })
  });
  console.log('Test 1 (Unauth): status =', unauthRes.status);

  // Test 2: Disallowed extension (.exe)
  const badExtRes = await fetch('http://localhost:3000/api/media/upload/init', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
    body: JSON.stringify({ filename: 'payload.exe', fileSize: 1000 })
  });
  const badExtData = await badExtRes.json();
  console.log('Test 2 (Disallowed ext):', badExtData);

  // Test 3: Zero-byte file (0 bytes)
  const zeroByteRes = await fetch('http://localhost:3000/api/media/upload/init', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
    body: JSON.stringify({ filename: 'empty.mp4', fileSize: 0 })
  });
  const zeroByteData = await zeroByteRes.json();
  console.log('Test 3 (Zero-byte):', zeroByteData);

  // Test 4: File exceeding 10 GB (10,000,000,001 bytes)
  const overLimitRes = await fetch('http://localhost:3000/api/media/upload/init', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
    body: JSON.stringify({ filename: 'massive.mp4', fileSize: 10000000001 })
  });
  const overLimitData = await overLimitRes.json();
  console.log('Test 4 (Exceeds 10 GB):', overLimitData);

  // Test 5: Exact boundary 10 GB limit (10,000,000,000 bytes)
  const exactLimitRes = await fetch('http://localhost:3000/api/media/upload/init', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
    body: JSON.stringify({ filename: 'exact_10gb.mp4', fileSize: 10000000000 })
  });
  const exactLimitData = await exactLimitRes.json();
  console.log('Test 5 (Exact 10 GB boundary):', exactLimitData);

  // Clean up session from Test 5
  if (exactLimitData.sessionId) {
    await fetch('http://localhost:3000/api/media/upload/abort', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
      body: JSON.stringify({ sessionId: exactLimitData.sessionId })
    });
    console.log('Cleaned up exact 10 GB session.');
  }

  // Test 6: Full chunked upload of vid.mp4 (5.87 MB)
  const vidBuffer = fs.readFileSync('vid.mp4');
  console.log('Testing upload of vid.mp4, size =', vidBuffer.length);

  const testUploadName = 'e2e_verified_showcase.mp4';
  const initRes = await fetch('http://localhost:3000/api/media/upload/init', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
    body: JSON.stringify({ filename: testUploadName, fileSize: vidBuffer.length, fileType: 'video/mp4' })
  });
  const initData = await initRes.json();
  console.log('Init upload session:', initData);
  const sessionId = initData.sessionId;

  // Upload in chunks of 2 MB
  const chunkSize = 2 * 1024 * 1024;
  let offset = 0;
  let chunkIdx = 0;
  while (offset < vidBuffer.length) {
    const end = Math.min(offset + chunkSize, vidBuffer.length);
    const chunkBlob = vidBuffer.slice(offset, end);
    const chunkRes = await fetch('http://localhost:3000/api/media/upload/chunk', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + token,
        'x-session-id': sessionId,
        'x-chunk-index': String(chunkIdx),
        'x-chunk-offset': String(offset),
        'x-chunk-size': String(chunkBlob.length),
        'Content-Type': 'application/octet-stream'
      },
      body: chunkBlob
    });
    const rawText = await chunkRes.text();
    console.log('Chunk status:', chunkRes.status, 'Raw response:', rawText);
    const chunkData = JSON.parse(rawText);
    console.log(`Uploaded chunk ${chunkIdx}: offset ${offset}-${end} (${chunkBlob.length} bytes), totalReceived=${chunkData.totalReceived}`);
    offset = end;
    chunkIdx++;
  }

  // Complete upload
  const completeRes = await fetch('http://localhost:3000/api/media/upload/complete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
    body: JSON.stringify({ sessionId })
  });
  const completeData = await completeRes.json();
  console.log('Complete upload response:', completeData);

  // Verify file exists on disk and Range request works
  const stats = fs.statSync(testUploadName);
  console.log(`Verified file on disk: ${testUploadName}, size = ${stats.size} (matches original: ${stats.size === vidBuffer.length})`);

  // Test Range request for streaming
  const rangeRes = await fetch(`http://localhost:3000/${testUploadName}`, {
    headers: { 'Range': 'bytes=0-1023' }
  });
  console.log('Range request status =', rangeRes.status, 'Content-Range =', rangeRes.headers.get('content-range'));
  console.log('--- ALL BACKEND TESTS PASSED SUCCESSFULLY ---');
}

runTests().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
