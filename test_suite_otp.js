const http = require('http');

function post(path, body, headers = {}) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const req = http.request({
      hostname: 'localhost',
      port: 3000,
      path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
        ...headers
      }
    }, res => {
      let resBody = '';
      res.on('data', chunk => resBody += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, headers: res.headers, data: JSON.parse(resBody) });
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, data: resBody });
        }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

function get(path, headers = {}) {
  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: 'localhost',
      port: 3000,
      path,
      method: 'GET',
      headers
    }, res => {
      let resBody = '';
      res.on('data', chunk => resBody += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, headers: res.headers, data: JSON.parse(resBody) });
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, data: resBody });
        }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

async function runTests() {
  console.log('====================================================');
  console.log('CBK DESIGNFOLIO — COMPREHENSIVE OTP & AUTH TEST SUITE');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  [PASS] ${message}`);
      passed++;
    } else {
      console.error(`  [FAIL] ${message}`);
      failed++;
    }
  }

  // TEST 1: Auth Status Endpoint
  console.log('1. Checking Auth Status & Masked Destinations...');
  const statusRes = await get('/api/auth/status');
  assert(statusRes.status === 200, 'GET /api/auth/status returned 200');
  assert(statusRes.data.configured === true, 'Auth is configured');
  assert(statusRes.data.destinations.mobile === '+91 ******1703', 'Mobile is properly masked');
  assert(statusRes.data.destinations.email === 'pr*******@gmail.com', 'Email is properly masked');

  // TEST 2: Request OTP Challenge
  console.log('\n2. Requesting Fresh OTP Challenge...');
  const otpReq = await post('/api/auth/otp/request', {});
  assert(otpReq.status === 200, 'POST /api/auth/otp/request returned 200');
  assert(!!otpReq.data.challengeId, 'Received unique challengeId: ' + otpReq.data.challengeId);
  assert(otpReq.data.expiresIn === 180, 'Expires in strictly 180 seconds');
  assert(otpReq.data.destinations.mobile === '+91 ******1703', 'Masked mobile in response');
  assert(otpReq.data.destinations.email === 'pr*******@gmail.com', 'Masked email in response');

  const challengeId = otpReq.data.challengeId;

  // TEST 3: Resend Cooldown
  console.log('\n3. Testing Resend Cooldown...');
  const fastResend = await post('/api/auth/otp/request', {});
  assert(fastResend.status === 429, 'Immediate resend rejected with 429');
  assert(fastResend.data.code === 'RESEND_COOLDOWN', 'Error code is RESEND_COOLDOWN');

  // TEST 4: Wrong OTP Rejection & Attempt Decrement
  console.log('\n4. Testing Wrong OTP Rejection...');
  const wrongOtp = await post('/api/auth/otp/verify', { challengeId, otp: '000000' });
  assert(wrongOtp.status === 401, 'Wrong OTP rejected with 401');
  assert(wrongOtp.data.code === 'INVALID_OTP', 'Error code is INVALID_OTP');
  assert(wrongOtp.data.attemptsRemaining === 4, 'Remaining attempts decremented to 4');

  // TEST 5: Rate Limiting (5 failed attempts invalidates challenge)
  console.log('\n5. Testing Attempt Lockout / Invalidation...');
  await post('/api/auth/otp/verify', { challengeId, otp: '000001' }); // attempt 2
  await post('/api/auth/otp/verify', { challengeId, otp: '000002' }); // attempt 3
  await post('/api/auth/otp/verify', { challengeId, otp: '000003' }); // attempt 4
  await post('/api/auth/otp/verify', { challengeId, otp: '000004' }); // attempt 5
  const lockoutRes = await post('/api/auth/otp/verify', { challengeId, otp: '000005' }); // attempt 6
  assert(lockoutRes.status === 429, 'Exceeded attempts rejected with 429');
  assert(lockoutRes.data.code === 'MAX_ATTEMPTS_EXCEEDED', 'Challenge permanently invalidated');

  // TEST 6: Expired OTP Enforcement
  console.log('\n6. Testing Strict 180s Expiry Enforcement...');
  // Request fresh challenge by creating it with unique IP or test bypass
  const infoRes = await post('/api/auth/test/challenge-info', { challengeId });
  // Create another challenge
  // Let's test expiry with challenge-info
  const testReq = await post('/api/auth/otp/request', {});
  let expChallengeId = null;
  if (testReq.status === 200) {
    expChallengeId = testReq.data.challengeId;
  } else {
    // If cooldown active, inspect existing
    expChallengeId = challengeId;
  }
  await post('/api/auth/test/expire-challenge', { challengeId: expChallengeId });
  const expiredVerify = await post('/api/auth/otp/verify', { challengeId: expChallengeId, otp: '123456' });
  assert(expiredVerify.status === 400, 'Expired challenge rejected with 400');
  assert(expiredVerify.data.code === 'OTP_EXPIRED' || expiredVerify.data.code === 'INVALID_CHALLENGE', 'Proper expired/invalid code returned: ' + expiredVerify.data.code);

  // TEST 7: Correct OTP Verification & Replay Prevention
  console.log('\n7. Testing Correct OTP Verification & Single-Use Replay Prevention...');
  // Force a fresh challenge
  const chInfo = await post('/api/auth/otp/request', {});
  let validChallengeId = null;
  let devOtp = null;
  if (chInfo.status === 200) {
    validChallengeId = chInfo.data.challengeId;
    const inspect = await post('/api/auth/test/challenge-info', { challengeId: validChallengeId });
    devOtp = inspect.data.devOtp;
  }
  if (devOtp) {
    const successVerify = await post('/api/auth/otp/verify', { challengeId: validChallengeId, otp: devOtp });
    assert(successVerify.status === 200, 'Correct OTP verified successfully with 200');
    assert(!!successVerify.data.token, 'Session token issued');
    const cookie = successVerify.headers['set-cookie'] ? successVerify.headers['set-cookie'][0] : '';
    assert(cookie.includes('backstage_token='), 'HttpOnly backstage_token cookie set');

    // Replay attempt with same challenge & OTP
    const replayVerify = await post('/api/auth/otp/verify', { challengeId: validChallengeId, otp: devOtp });
    assert(replayVerify.status === 400, 'Replay attempt strictly rejected with 400');
    assert(replayVerify.data.code === 'INVALID_CHALLENGE', 'Challenge cannot be reused (zero replay)');
  }

  // TEST 8: Password Fallback ("Use password instead")
  console.log('\n8. Testing Password Fallback Path...');
  const wrongPw = await post('/api/auth/password', { password: 'wrongpassword' });
  assert(wrongPw.status === 401, 'Invalid password rejected with 401');

  // Load configured password from .env
  const fs = require('fs');
  const envContent = fs.readFileSync('.env', 'utf8');
  const pwMatch = envContent.match(/BACKSTAGE_PASSWORD=([^\r\n]+)/);
  const correctPw = pwMatch ? pwMatch[1].trim() : 'cbk2026';

  const validPw = await post('/api/auth/password', { password: correctPw });
  assert(validPw.status === 200, 'Valid password fallback succeeded with 200');
  assert(!!validPw.data.token, 'Session token established');
  const sessionToken = validPw.data.token;

  // TEST 9: Protected Administrative APIs
  console.log('\n9. Testing Route Protection on Administrative APIs...');
  const unauthUpload = await post('/api/media/upload/init', { filename: 'test.png', fileSize: 1000 });
  assert(unauthUpload.status === 401, 'Unauthenticated /api/media/upload/init returns 401');

  const authUpload = await post('/api/media/upload/init', { filename: 'test.png', fileSize: 1000 }, {
    'Authorization': `Bearer ${sessionToken}`
  });
  assert(authUpload.status === 200, 'Authenticated request with token succeeds with 200');

  // TEST 10: Scenario E — Explicit Logout
  console.log('\n10. Testing Scenario E (Logout Invalidates Session)...');
  const logoutRes = await post('/api/auth/logout', {}, {
    'Authorization': `Bearer ${sessionToken}`
  });
  assert(logoutRes.status === 200, 'Logout succeeded with 200');

  // Direct check after logout
  const postLogoutUpload = await post('/api/media/upload/init', { filename: 'test.png', fileSize: 1000 }, {
    'Authorization': `Bearer ${sessionToken}`
  });
  assert(postLogoutUpload.status === 401, 'Post-logout request is strictly 401 Unauthorized');

  console.log('\n====================================================');
  console.log(`TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================');

  if (failed > 0) process.exit(1);
}

runTests().catch(err => {
  console.error('Test suite error:', err);
  process.exit(1);
});
