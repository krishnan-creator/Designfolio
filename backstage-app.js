
// Beyond The Frame Reordering & Addition Handlers
function moveBTFEntry(secId, idx, dir) {
  const sec = findSectionOrChild(secId);
  if (!sec || !sec.content || !Array.isArray(sec.content.entries)) return;
  const targetIdx = idx + dir;
  if (targetIdx < 0 || targetIdx >= sec.content.entries.length) return;
  const temp = sec.content.entries[idx];
  sec.content.entries[idx] = sec.content.entries[targetIdx];
  sec.content.entries[targetIdx] = temp;
  markUnsaved();
  renderPropertiesPanel(sec);
  notifyPreview();
}
window.moveBTFEntry = moveBTFEntry;

function removeBTFEntry(secId, idx) {
  const sec = findSectionOrChild(secId);
  if (!sec || !sec.content || !Array.isArray(sec.content.entries)) return;
  sec.content.entries.splice(idx, 1);
  markUnsaved();
  renderPropertiesPanel(sec);
  notifyPreview();
}
window.removeBTFEntry = removeBTFEntry;

function addBTFEntry(secId) {
  const sec = findSectionOrChild(secId);
  if (!sec) return;
  if (!sec.content) sec.content = {};
  if (!Array.isArray(sec.content.entries)) sec.content.entries = [];
  const nextNum = String(sec.content.entries.length + 1).padStart(2, '0');
  sec.content.entries.push({
    id: `btf-${Date.now()}`,
    slotNumber: nextNum,
    title: 'NEW CINEMATIC ENTRY',
    category: `${nextNum} // CREATIVE EXPLORATION`,
    desc: 'Description of the cinematic visual exploration.',
    image: '',
    position: 'center center',
    visible: true
  });
  markUnsaved();
  renderPropertiesPanel(sec);
  notifyPreview();
}
window.addBTFEntry = addBTFEntry;


// -------------------------------------------------------------
// UNIVERSAL VISIBILITY CONTROLS HELPER
// -------------------------------------------------------------
function renderVisibilityButton(secId, pathStr, isVisible, label = '', onClickFn = null) {
  const handler = onClickFn ? onClickFn : `toggleVisibilityByPath('${secId}', '${pathStr}')`;
  const visibleState = (isVisible !== false);
  const textLabel = label ? label : (visibleState ? 'Visible' : 'Hidden');
  const eyeIcon = visibleState
    ? '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle>'
    : '<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line>';

  return `
    <button type="button" class="vis-toggle-btn ${visibleState ? 'is-visible' : 'is-hidden'}" onclick="${handler}" aria-label="${visibleState ? 'Visible on public portfolio — click to hide' : 'Hidden from public portfolio — click to show'}" title="${visibleState ? 'Visible on public portfolio' : 'Hidden from public portfolio'}">
      <svg class="eye-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        ${eyeIcon}
      </svg>
      <span>${textLabel}</span>
    </button>
  `;
}
window.renderVisibilityButton = renderVisibilityButton;

async function toggleVisibilityByPath(secId, pathStr) {
  const sec = findSectionOrChild(secId);
  if (!sec) return;
  const parts = pathStr.split('.');
  let curr = sec;
  for (let i = 0; i < parts.length - 1; i++) {
    if (!curr[parts[i]]) curr[parts[i]] = {};
    curr = curr[parts[i]];
  }
  const lastKey = parts[parts.length - 1];
  const nextVal = (curr[lastKey] === false) ? true : false;
  curr[lastKey] = nextVal;
  markUnsaved();
  renderSectionTree();
  renderPropertiesPanel(sec);
  notifyPreview();

  // Atomically persist to server so reload/public site immediately reflects change
  try {
    const headers = { 'Content-Type': 'application/json' };
    if (authToken) headers['Authorization'] = `Bearer ${authToken}`;
    const res = await fetch('/api/content/entry/visibility', {
      method: 'POST',
      headers,
      body: JSON.stringify({ sectionId: secId, pathStr, visible: nextVal })
    });
    const json = await res.json();
    if (json.success && json.data) {
      publishedData = JSON.parse(JSON.stringify(json.data));
      hasUnsavedChanges = false;
      updateStatusIndicator();
      showToast(`${nextVal ? 'Visible' : 'Hidden'} state saved & published`);
    }
  } catch (err) {
    console.warn('[Backstage] Background visibility sync failed, preserved in draft:', err.message);
  }
}

// Universal Permanent Deletion Engine
function confirmDeleteEntry(sectionId, collectionKey, entryId, displayName) {
  const modal = document.getElementById('confirm-modal');
  const title = document.getElementById('confirm-modal-title');
  const desc = document.getElementById('confirm-modal-desc');
  const actionBtn = document.getElementById('confirm-modal-action-btn');

  if (!modal || !title || !desc || !actionBtn) return;

  const itemTitle = displayName || entryId;
  title.textContent = 'PERMANENTLY DELETE ENTRY?';
  desc.innerHTML = `Are you sure you want to permanently delete <strong>${escapeHtml(itemTitle)}</strong> [ID: ${escapeHtml(entryId)}]?<br><br><span style="color: #ff3038; font-weight: 700;">WARNING:</span> This operation is permanent and will immediately remove the record from both Backstage and the public portfolio.`;

  actionBtn.textContent = 'PERMANENTLY DELETE';
  actionBtn.className = 'confirm-action-btn danger';
  actionBtn.disabled = false;

  actionBtn.onclick = async () => {
    actionBtn.disabled = true;
    actionBtn.textContent = 'DELETING...';

    try {
      const headers = { 'Content-Type': 'application/json' };
      if (authToken) headers['Authorization'] = `Bearer ${authToken}`;
      const res = await fetch('/api/content/entry/delete', {
        method: 'POST',
        headers,
        body: JSON.stringify({ sectionId, collectionKey, entryId })
      });
      const json = await res.json();
      if (json.success && json.data) {
        currentDraft = json.data;
        publishedData = JSON.parse(JSON.stringify(json.data));
        hasUnsavedChanges = false;
        updateStatusIndicator();
        closeConfirmModal();
        showToast(`Permanently deleted "${itemTitle}"`);
        const sec = findSectionOrChild(sectionId);
        renderSectionTree();
        if (sec) renderPropertiesPanel(sec);
        notifyPreview();
      } else {
        showToast(`Delete failed: ${json.error || 'Server rejected request'}`, true);
        actionBtn.disabled = false;
        actionBtn.textContent = 'PERMANENTLY DELETE';
      }
    } catch (err) {
      showToast(`Delete failed: ${err.message}`, true);
      actionBtn.disabled = false;
      actionBtn.textContent = 'PERMANENTLY DELETE';
    }
  };

  modal.classList.add('active');
}
window.confirmDeleteEntry = confirmDeleteEntry;

window.toggleVisibilityByPath = toggleVisibilityByPath;

/**
 * CBK DESIGNFOLIO — BACKSTAGE CMS CORE ENGINE
 * Full-featured visual content management system with authentication,
 * section hierarchy, nested The Core -> Hobbies relationships,
 * contextual properties, live preview synchronization, and atomic publishing.
 */

let currentDraft = null;
let publishedData = null;
let selectedSectionId = 'sec-hero';
let hasUnsavedChanges = false;
let authToken = null;
let activeMediaCallback = null;
let syncTimeout = null;

// -------------------------------------------------------------
// 1. INITIALIZATION & SECURE OTP AUTHENTICATION
// -------------------------------------------------------------
let currentChallenge = null;
let otpCountdownInterval = null;
let resendCooldownInterval = null;
let heartbeatInterval = null;
let currentTotpSetupId = null;

async function checkAuthStatus() {
  try {
    const res = await fetch('/api/auth/status');
    if (!res.ok) {
      const errText = await res.text();
      try {
        return JSON.parse(errText);
      } catch (e) {
        return { serverReachable: false, configured: false, authenticated: false, error: `HTTP ${res.status}` };
      }
    }
    return await res.json();
  } catch (e) {
    try {
      const res = await fetch('/api/auth/check');
      if (res.ok) return await res.json();
    } catch (err) {}
    return { serverReachable: false, configured: false, authenticated: false, error: e.message, methods: {} };
  }
}

function startOtpCountdown(serverExpiresAt) {
  if (otpCountdownInterval) clearInterval(otpCountdownInterval);
  const countdownEl = document.getElementById('auth-countdown');

  function update() {
    const remainingMs = serverExpiresAt - Date.now();
    if (remainingMs <= 0) {
      clearInterval(otpCountdownInterval);
      if (countdownEl) {
        countdownEl.textContent = '00:00 (EXPIRED)';
        countdownEl.style.color = '#FF5A5F';
      }
      const errorEl = document.getElementById('auth-otp-error');
      if (errorEl && !errorEl.textContent) {
        errorEl.textContent = 'Verification code has expired. Please click "RESEND CODE".';
        errorEl.style.display = 'block';
      }
      return;
    }

    const totalSeconds = Math.floor(remainingMs / 1000);
    const mins = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
    const secs = String(totalSeconds % 60).padStart(2, '0');
    if (countdownEl) {
      countdownEl.textContent = `${mins}:${secs}`;
      countdownEl.style.color = totalSeconds <= 30 ? '#FF5A5F' : 'var(--crimson)';
    }
  }

  update();
  otpCountdownInterval = setInterval(update, 1000);
}

function startResendCooldown(seconds) {
  if (resendCooldownInterval) clearInterval(resendCooldownInterval);
  const resendBtn = document.getElementById('auth-resend-btn');
  if (!resendBtn) return;

  let remaining = seconds;
  resendBtn.disabled = true;
  resendBtn.textContent = `RESEND CODE (${remaining}s)`;

  resendCooldownInterval = setInterval(() => {
    remaining--;
    if (remaining <= 0) {
      clearInterval(resendCooldownInterval);
      resendBtn.disabled = false;
      resendBtn.textContent = 'RESEND CODE';
    } else {
      resendBtn.textContent = `RESEND CODE (${remaining}s)`;
    }
  }, 1000);
}

function switchAuthTab(tabName, e) {
  if (e) e.preventDefault();
  const activeTab = (tabName === 'password') ? 'password' : 'otp';

  // Update tab buttons
  const tabOtp = document.getElementById('tab-btn-otp');
  const tabPw = document.getElementById('tab-btn-password');

  if (tabOtp) tabOtp.classList.toggle('active', activeTab === 'otp');
  if (tabPw) tabPw.classList.toggle('active', activeTab === 'password');

  // Update views
  const viewOtp = document.getElementById('auth-view-otp');
  const viewPw = document.getElementById('auth-view-password');

  if (viewOtp) viewOtp.style.display = activeTab === 'otp' ? 'block' : 'none';
  if (viewPw) viewPw.style.display = activeTab === 'password' ? 'block' : 'none';

  // Clear errors
  const errOtp = document.getElementById('auth-otp-error');
  const errPw = document.getElementById('auth-password-error');
  if (errOtp) errOtp.style.display = 'none';
  if (errPw) errPw.style.display = 'none';

  // Auto-focus relevant input
  setTimeout(() => {
    if (activeTab === 'otp') {
      const el = document.getElementById('auth-otp');
      if (el && el.offsetParent) el.focus();
    } else if (activeTab === 'password') {
      const el = document.getElementById('auth-fallback-password');
      if (el) el.focus();
    }
  }, 60);
}

async function requestOtpChallenge() {
  const errorEl = document.getElementById('auth-otp-error');
  const noticeEl = document.getElementById('auth-gateway-notice');
  const emailEl = document.getElementById('auth-dest-email');
  const statusEl = document.getElementById('auth-dest-status');
  const challengeForm = document.getElementById('auth-otp-challenge-form-wrapper');
  const requestTrigger = document.getElementById('auth-otp-request-wrapper');

  if (errorEl) errorEl.style.display = 'none';

  try {
    const res = await fetch('/api/auth/otp/request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    const data = await res.json();

    if (data.code === 'GMAIL_UNCONFIGURED') {
      if (noticeEl) {
        noticeEl.innerHTML = `<strong>GATEWAY NOTICE:</strong> ${data.error}`;
        noticeEl.style.display = 'block';
      }
      if (statusEl) statusEl.textContent = 'GATEWAY UNCONFIGURED';
      if (challengeForm) challengeForm.style.display = 'none';
      if (requestTrigger) requestTrigger.style.display = 'none';
      return;
    }

    if (data.success) {
      currentChallenge = data;
      if (emailEl && data.destinations) emailEl.textContent = data.destinations.email;
      if (statusEl) statusEl.textContent = 'CHALLENGE ACTIVE';

      if (noticeEl) noticeEl.style.display = 'none';
      if (challengeForm) challengeForm.style.display = 'block';
      if (requestTrigger) requestTrigger.style.display = 'none';

      startOtpCountdown(data.serverExpiresAt);
      startResendCooldown(data.resendCooldown || 30);

      const otpInput = document.getElementById('auth-otp');
      if (otpInput) setTimeout(() => otpInput.focus(), 60);
    } else {
      if (errorEl) {
        errorEl.textContent = data.error || 'Failed to issue verification challenge.';
        errorEl.style.display = 'block';
      }
      if (data.retryAfterSeconds) {
        startResendCooldown(data.retryAfterSeconds);
      } else if (data.cooldownRemaining) {
        startResendCooldown(data.cooldownRemaining);
      }
    }
  } catch (err) {
    if (errorEl) {
      errorEl.textContent = 'Network error requesting challenge: ' + err.message;
      errorEl.style.display = 'block';
    }
  }
}

async function handleOtpSubmit(e) {
  e.preventDefault();
  const otpInput = document.getElementById('auth-otp');
  const errorEl = document.getElementById('auth-otp-error');
  const submitBtn = document.getElementById('auth-otp-btn');

  if (!currentChallenge || !currentChallenge.challengeId) {
    if (errorEl) {
      errorEl.textContent = 'No active challenge. Requesting a fresh code...';
      errorEl.style.display = 'block';
    }
    await requestOtpChallenge();
    return;
  }

  const otp = otpInput ? otpInput.value.trim() : '';
  if (!otp || otp.length !== 6) {
    if (errorEl) {
      errorEl.textContent = 'Please enter all 6 digits of the verification code.';
      errorEl.style.display = 'block';
    }
    return;
  }

  if (errorEl) errorEl.style.display = 'none';
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = 'VERIFYING...';
  }

  try {
    const res = await fetch('/api/auth/otp/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ challengeId: currentChallenge.challengeId, otp })
    });
    const json = await res.json();

    if (json.success) {
      authToken = json.token;
      if (otpCountdownInterval) clearInterval(otpCountdownInterval);
      if (resendCooldownInterval) clearInterval(resendCooldownInterval);
      document.getElementById('auth-overlay').style.display = 'none';
      startSessionHeartbeat();
      showToast('Verified & entered Backstage via Gmail OTP');
      await loadContent();
    } else {
      if (errorEl) {
        errorEl.textContent = json.error || 'Verification failed. Please try again.';
        errorEl.style.display = 'block';
      }
      if (json.code === 'OTP_EXPIRED' || json.code === 'MAX_ATTEMPTS_EXCEEDED') {
        const resendBtn = document.getElementById('auth-resend-btn');
        if (resendBtn) resendBtn.disabled = false;
      }
    }
  } catch (err) {
    if (errorEl) {
      errorEl.textContent = 'Connection error: ' + err.message;
      errorEl.style.display = 'block';
    }
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = 'VERIFY & ENTER';
    }
  }
}

async function handleResendOtp() {
  await requestOtpChallenge();
}

async function handleTotpSubmit(e) {
  e.preventDefault();
  const tokenInput = document.getElementById('auth-totp-token');
  const errorEl = document.getElementById('auth-totp-error');
  const submitBtn = document.getElementById('auth-totp-btn');

  const token = tokenInput ? tokenInput.value.trim() : '';
  if (!token || token.length !== 6) {
    if (errorEl) {
      errorEl.textContent = 'Please enter the 6-digit code from your authenticator app.';
      errorEl.style.display = 'block';
    }
    return;
  }

  if (errorEl) errorEl.style.display = 'none';
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = 'VERIFYING...';
  }

  try {
    const res = await fetch('/api/auth/totp/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token })
    });
    const json = await res.json();

    if (json.success) {
      authToken = json.token;
      document.getElementById('auth-overlay').style.display = 'none';
      startSessionHeartbeat();
      showToast('Authenticated via Authenticator app');
      await loadContent();
    } else {
      if (errorEl) {
        errorEl.textContent = json.error || 'Invalid code.';
        errorEl.style.display = 'block';
      }
    }
  } catch (err) {
    if (errorEl) {
      errorEl.textContent = 'Connection error: ' + err.message;
      errorEl.style.display = 'block';
    }
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = 'VERIFY CODE & ENTER';
    }
  }
}

async function startTotpSetup(e) {
  if (e && e.preventDefault) e.preventDefault();
  const errorEl = document.getElementById('auth-totp-error');
  try {
    const res = await fetch('/api/auth/totp/setup-init', { method: 'POST' });
    const json = await res.json();

    if (json.success) {
      currentTotpSetupId = json.setupId;
      const qrEl = document.getElementById('totp-setup-qr');
      const keyEl = document.getElementById('totp-setup-key');
      if (qrEl) qrEl.src = json.qrDataUrl;
      if (keyEl) keyEl.textContent = json.secret;

      document.getElementById('auth-view-totp').style.display = 'none';
      document.getElementById('auth-view-totp-setup').style.display = 'block';

      const codeInput = document.getElementById('auth-totp-setup-code');
      if (codeInput) setTimeout(() => codeInput.focus(), 60);
    } else {
      if (errorEl) {
        errorEl.textContent = json.error || 'Failed to initialize authenticator setup.';
        errorEl.style.display = 'block';
      }
    }
  } catch (err) {
    if (errorEl) {
      errorEl.textContent = 'Network error: ' + err.message;
      errorEl.style.display = 'block';
    }
  }
}

function cancelTotpSetup(e) {
  if (e) e.preventDefault();
  document.getElementById('auth-view-totp-setup').style.display = 'none';
  document.getElementById('auth-view-totp').style.display = 'block';
}

async function handleTotpSetupSubmit(e) {
  e.preventDefault();
  const tokenInput = document.getElementById('auth-totp-setup-code');
  const errorEl = document.getElementById('auth-totp-setup-error');
  const submitBtn = document.getElementById('auth-totp-setup-btn');

  const token = tokenInput ? tokenInput.value.trim() : '';
  if (!token || token.length !== 6) {
    if (errorEl) {
      errorEl.textContent = 'Please enter the 6-digit code shown in your app.';
      errorEl.style.display = 'block';
    }
    return;
  }

  if (errorEl) errorEl.style.display = 'none';
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = 'ACTIVATING...';
  }

  try {
    const res = await fetch('/api/auth/totp/setup-verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ setupId: currentTotpSetupId, token })
    });
    const json = await res.json();

    if (json.success) {
      authToken = json.token;
      document.getElementById('auth-overlay').style.display = 'none';
      startSessionHeartbeat();
      showToast('Authenticator app activated & authenticated');
      await loadContent();
    } else {
      if (errorEl) {
        errorEl.textContent = json.error || 'Activation failed.';
        errorEl.style.display = 'block';
      }
    }
  } catch (err) {
    if (errorEl) {
      errorEl.textContent = 'Connection error: ' + err.message;
      errorEl.style.display = 'block';
    }
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = 'ACTIVATE AUTHENTICATOR';
    }
  }
}

// -------------------------------------------------------------
// AUTHENTICATOR // 2FA MANAGEMENT (AUTHENTICATED BACKSTAGE CMS)
// -------------------------------------------------------------
let currentCmsTotpSetupId = null;

async function openSecurityModal() {
  const modal = document.getElementById('security-modal');
  if (!modal) return;
  modal.classList.add('active');

  const enrollmentView = document.getElementById('cms-totp-enrollment-view');
  if (enrollmentView) enrollmentView.style.display = 'none';

  const badge = document.getElementById('cms-totp-status-badge');
  const desc = document.getElementById('cms-totp-status-desc');
  const enrolledView = document.getElementById('cms-totp-enrolled-view');
  const notEnrolledView = document.getElementById('cms-totp-not-enrolled-view');

  try {
    const res = await fetch('/api/auth/status');
    const status = await res.json();
    const isEnrolled = !!(status.methods && status.methods.totp && status.methods.totp.enrolled);

    if (isEnrolled) {
      if (badge) {
        badge.textContent = 'ACTIVE / ENROLLED';
        badge.style.background = 'rgba(34, 197, 94, 0.15)';
        badge.style.color = '#4ade80';
      }
      if (desc) desc.textContent = 'Standard RFC 6238 time-based authenticator is linked and protecting Backstage sign-in.';
      if (enrolledView) enrolledView.style.display = 'block';
      if (notEnrolledView) notEnrolledView.style.display = 'none';
    } else {
      if (badge) {
        badge.textContent = 'NOT CONFIGURED';
        badge.style.background = 'rgba(255, 48, 56, 0.15)';
        badge.style.color = 'var(--crimson)';
      }
      if (desc) desc.textContent = 'No authenticator app currently enrolled. Set up Google Authenticator to enable instant login.';
      if (enrolledView) enrolledView.style.display = 'none';
      if (notEnrolledView) notEnrolledView.style.display = 'block';
    }
  } catch (err) {
    console.warn('[Security] Failed to fetch auth status:', err.message);
  }
}

function closeSecurityModal() {
  const modal = document.getElementById('security-modal');
  if (modal) modal.classList.remove('active');
  currentCmsTotpSetupId = null;
}

async function startCmsTotpEnrollment() {
  const enrolledView = document.getElementById('cms-totp-enrolled-view');
  const notEnrolledView = document.getElementById('cms-totp-not-enrolled-view');
  const enrollmentView = document.getElementById('cms-totp-enrollment-view');
  const qrImg = document.getElementById('cms-totp-qr-img');
  const manualKey = document.getElementById('cms-totp-manual-key');
  const codeInput = document.getElementById('cms-totp-code-input');
  const errorEl = document.getElementById('cms-totp-error');

  if (errorEl) errorEl.style.display = 'none';
  if (codeInput) codeInput.value = '';

  try {
    const res = await fetch('/api/auth/totp/setup-init', { method: 'POST' });
    const json = await res.json();

    if (json.success) {
      currentCmsTotpSetupId = json.setupId;
      if (qrImg) qrImg.src = json.qrDataUrl;
      if (manualKey) manualKey.textContent = json.secret;

      if (enrolledView) enrolledView.style.display = 'none';
      if (notEnrolledView) notEnrolledView.style.display = 'none';
      if (enrollmentView) enrollmentView.style.display = 'block';

      if (codeInput) setTimeout(() => codeInput.focus(), 60);
    } else {
      showToast(json.error || 'Failed to initialize TOTP setup', true);
    }
  } catch (err) {
    showToast('Network error initializing setup: ' + err.message, true);
  }
}

function cancelCmsTotpEnrollment() {
  openSecurityModal();
}

async function handleCmsTotpActivation(e) {
  e.preventDefault();
  const codeInput = document.getElementById('cms-totp-code-input');
  const errorEl = document.getElementById('cms-totp-error');
  const submitBtn = document.getElementById('cms-totp-submit-btn');

  const token = codeInput ? codeInput.value.trim() : '';
  if (!token || token.length !== 6) {
    if (errorEl) {
      errorEl.textContent = 'Please enter the 6-digit rotating code from Google Authenticator.';
      errorEl.style.display = 'block';
    }
    return;
  }

  if (errorEl) errorEl.style.display = 'none';
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = 'ACTIVATING...';
  }

  try {
    const res = await fetch('/api/auth/totp/setup-verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ setupId: currentCmsTotpSetupId, token })
    });
    const json = await res.json();

    if (json.success) {
      showToast('Authenticator app successfully activated & linked!');
      currentCmsTotpSetupId = null;
      openSecurityModal();
    } else {
      if (errorEl) {
        errorEl.textContent = json.error || 'Invalid code. Please check your authenticator app and try again.';
        errorEl.style.display = 'block';
      }
    }
  } catch (err) {
    if (errorEl) {
      errorEl.textContent = 'Connection error: ' + err.message;
      errorEl.style.display = 'block';
    }
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = 'ACTIVATE & SAVE DEVICE';
    }
  }
}

async function unlinkCmsTotp() {
  if (!confirm('Are you sure you want to unlink your Authenticator app? You can always re-enroll a new device anytime.')) {
    return;
  }
  try {
    const res = await fetch('/api/auth/totp/reset', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {})
      }
    });
    const json = await res.json();
    if (json.success) {
      showToast('Authenticator unlinked successfully');
      openSecurityModal();
    } else {
      showToast(json.error || 'Failed to unlink device', true);
    }
  } catch (err) {
    showToast('Network error: ' + err.message, true);
  }
}

async function handlePasswordSubmit(e) {
  e.preventDefault();
  const passwordInput = document.getElementById('auth-fallback-password');
  const errorEl = document.getElementById('auth-password-error');
  const submitBtn = document.getElementById('auth-password-btn');

  const password = passwordInput ? passwordInput.value : '';
  if (!password) {
    if (errorEl) {
      errorEl.textContent = 'Please enter your administrative passphrase.';
      errorEl.style.display = 'block';
    }
    return;
  }

  if (errorEl) errorEl.style.display = 'none';
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = 'AUTHENTICATING...';
  }

  try {
    const res = await fetch('/api/auth/password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password })
    });
    const json = await res.json();

    if (json.success) {
      authToken = json.token;
      if (otpCountdownInterval) clearInterval(otpCountdownInterval);
      if (resendCooldownInterval) clearInterval(resendCooldownInterval);
      document.getElementById('auth-overlay').style.display = 'none';
      startSessionHeartbeat();
      showToast('Authenticated via administrative passphrase');
      await loadContent();
    } else {
      if (errorEl) {
        errorEl.textContent = json.error || 'Access denied. Incorrect passphrase.';
        errorEl.style.display = 'block';
      }
    }
  } catch (err) {
    if (errorEl) {
      errorEl.textContent = 'Connection error: ' + err.message;
      errorEl.style.display = 'block';
    }
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = 'VERIFY PASSPHRASE & ENTER';
    }
  }
}

async function handleSetupSubmit(e) {
  e.preventDefault();
  const pwInput = document.getElementById('auth-setup-password');
  const confirmInput = document.getElementById('auth-setup-confirm');
  const errorEl = document.getElementById('auth-setup-error');
  const submitBtn = document.getElementById('auth-setup-btn');

  const password = pwInput ? pwInput.value : '';
  const confirmPassword = confirmInput ? confirmInput.value : '';

  if (password.length < 6) {
    if (errorEl) {
      errorEl.textContent = 'Passphrase must be at least 6 characters long.';
      errorEl.style.display = 'block';
    }
    return;
  }

  if (password !== confirmPassword) {
    if (errorEl) {
      errorEl.textContent = 'Passphrases do not match. Please re-enter.';
      errorEl.style.display = 'block';
    }
    return;
  }

  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = 'INITIALIZING...';
  }

  try {
    const res = await fetch('/api/auth/setup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password, confirmPassword })
    });
    const json = await res.json();

    if (json.success) {
      authToken = json.token;
      document.getElementById('auth-overlay').style.display = 'none';
      startSessionHeartbeat();
      showToast('Administrator credentials established');
      await loadContent();
    } else {
      if (errorEl) {
        errorEl.textContent = json.error || 'Setup failed.';
        errorEl.style.display = 'block';
      }
    }
  } catch (err) {
    if (errorEl) {
      errorEl.textContent = 'Connection error: ' + err.message;
      errorEl.style.display = 'block';
    }
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = 'INITIALIZE CREDENTIALS';
    }
  }
}

async function handleLogoutClick() {
  try {
    await fetch('/api/auth/logout', { method: 'POST' });
  } catch (e) {}

  authToken = null;
  currentChallenge = null;
  if (otpCountdownInterval) clearInterval(otpCountdownInterval);
  if (resendCooldownInterval) clearInterval(resendCooldownInterval);
  if (heartbeatInterval) clearInterval(heartbeatInterval);

  showToast('Logged out of Backstage');
  const overlay = document.getElementById('auth-overlay');
  if (overlay) overlay.style.display = 'flex';

  const status = await checkAuthStatus();
  applyAuthStatusToUI(status);
}

function startSessionHeartbeat() {
  if (heartbeatInterval) clearInterval(heartbeatInterval);
  heartbeatInterval = setInterval(async () => {
    try {
      const res = await fetch('/api/auth/heartbeat', { method: 'POST' });
      if (res.status === 401) {
        // Session expired or grace period exceeded
        clearInterval(heartbeatInterval);
        authToken = null;
        const overlay = document.getElementById('auth-overlay');
        if (overlay) overlay.style.display = 'flex';
        showToast('Session expired. Fresh authentication required.', true);
        const status = await checkAuthStatus();
        applyAuthStatusToUI(status);
      }
    } catch (e) {}
  }, 30000); // Heartbeat every 30 seconds
}

function sendLeaveNotice() {
  if (navigator.sendBeacon) {
    navigator.sendBeacon('/api/auth/leave');
  } else {
    fetch('/api/auth/leave', { method: 'POST', keepalive: true }).catch(() => {});
  }
}

function applyAuthStatusToUI(status) {
  const enrolledSection = document.getElementById('totp-enrolled-section');
  const notEnrolledSection = document.getElementById('totp-not-enrolled-section');
  const gatewayNotice = document.getElementById('auth-gateway-notice');
  const challengeForm = document.getElementById('auth-otp-challenge-form-wrapper');
  const requestTrigger = document.getElementById('auth-otp-request-wrapper');
  const statusEl = document.getElementById('auth-dest-status');

  if (status && status.serverReachable === false) {
    if (gatewayNotice) {
      gatewayNotice.innerHTML = `<strong>SERVER NOTICE:</strong> Unable to connect to Backstage authentication server (${status.error || 'Network error'}). Please verify server connectivity.`;
      gatewayNotice.style.display = 'block';
    }
    if (challengeForm) challengeForm.style.display = 'none';
    if (requestTrigger) requestTrigger.style.display = 'none';
    if (statusEl) statusEl.textContent = 'SERVER DISCONNECTED';
    switchAuthTab('password');
    return;
  }

  const gmailConfigured = !!(status.methods && status.methods.gmail && status.methods.gmail.configured);

  // Configure Gmail OTP view state
  if (!gmailConfigured) {
    if (gatewayNotice) {
      gatewayNotice.innerHTML = `<strong>GATEWAY NOTICE:</strong> Gmail delivery credentials (GMAIL_USER &amp; GMAIL_APP_PASSWORD) are not configured in the server environment. Please authenticate using your administrative passphrase.`;
      gatewayNotice.style.display = 'block';
    }
    if (challengeForm) challengeForm.style.display = 'none';
    if (requestTrigger) requestTrigger.style.display = 'none';
    if (statusEl) statusEl.textContent = 'GATEWAY UNCONFIGURED';
    switchAuthTab('password');
  } else {
    if (gatewayNotice) gatewayNotice.style.display = 'none';
    if (challengeForm) challengeForm.style.display = 'none';
    if (requestTrigger) requestTrigger.style.display = 'block';
    if (statusEl) statusEl.textContent = 'GATEWAY READY';
    switchAuthTab('otp');
    requestOtpChallenge();
  }
}

async function initBackstage() {
  window.addEventListener('beforeunload', sendLeaveNotice);

  const status = await checkAuthStatus();
  const overlay = document.getElementById('auth-overlay');

  if (status.authenticated) {
    if (overlay) overlay.style.display = 'none';
    startSessionHeartbeat();
    await loadContent();
  } else {
    if (overlay) overlay.style.display = 'flex';
    applyAuthStatusToUI(status);
  }

  setupViewportControls();
}

window.switchAuthTab = switchAuthTab;
window.requestOtpChallenge = requestOtpChallenge;
window.handleOtpSubmit = handleOtpSubmit;
window.handleResendOtp = handleResendOtp;
window.handleTotpSubmit = handleTotpSubmit;
window.startTotpSetup = startTotpSetup;
window.cancelTotpSetup = cancelTotpSetup;
window.handleTotpSetupSubmit = handleTotpSetupSubmit;
window.handlePasswordSubmit = handlePasswordSubmit;
window.handleSetupSubmit = handleSetupSubmit;
window.handleLogoutClick = handleLogoutClick;
window.openSecurityModal = openSecurityModal;
window.closeSecurityModal = closeSecurityModal;
window.startCmsTotpEnrollment = startCmsTotpEnrollment;
window.cancelCmsTotpEnrollment = cancelCmsTotpEnrollment;
window.handleCmsTotpActivation = handleCmsTotpActivation;
window.unlinkCmsTotp = unlinkCmsTotp;

// -------------------------------------------------------------
// 2. CONTENT LOADING & DRAFT MANAGEMENT
// -------------------------------------------------------------
async function loadContent() {
  try {
    const headers = {};
    if (authToken) headers['Authorization'] = `Bearer ${authToken}`;
    const res = await fetch('/api/content?draft=true', { headers });
    const json = await res.json();
    if (json.success && json.data) {
      currentDraft = json.data;
      const vo = currentDraft.sections?.find(s => s.id === 'sec-visual-orbit');
      if (vo) ensureOrbitImages(vo);
      const btf = currentDraft.sections?.find(s => s.id === 'sec-beyond-frame');
      if (btf) ensureBeyondFrameEntries(btf);
      const core = currentDraft.sections?.find(s => s.id === 'sec-core');
      const hobbies = core?.children?.find(ch => ch.type === 'hobbies' || ch.id === 'sub-hobbies') || currentDraft.sections?.find(s => s.type === 'hobbies' || s.id === 'sub-hobbies');
      if (hobbies) ensureHobbiesSlots(hobbies);
      publishedData = JSON.parse(JSON.stringify(currentDraft));
      hasUnsavedChanges = !!json.hasUnsavedChanges;
      updateStatusIndicator();
      renderSectionTree();
      selectSection(selectedSectionId);
    }
  } catch (err) {
    showToast('Failed to load content model', true);
  }
}

function markUnsaved() {
  hasUnsavedChanges = true;
  updateStatusIndicator();

  // Debounced auto-save of draft to server
  if (syncTimeout) clearTimeout(syncTimeout);
  syncTimeout = setTimeout(async () => {
    try {
      const headers = { 'Content-Type': 'application/json' };
      if (authToken) headers['Authorization'] = `Bearer ${authToken}`;
      await fetch('/api/content/draft', {
        method: 'POST',
        headers,
        body: JSON.stringify(currentDraft)
      });
      // Notify live preview iframe
      notifyPreview();
    } catch (e) {}
  }, 350);
}

function updateStatusIndicator() {
  const dot = document.getElementById('status-dot');
  const text = document.getElementById('status-text');
  if (hasUnsavedChanges) {
    dot.className = 'status-dot unsaved';
    text.textContent = 'UNSAVED DRAFT';
  } else {
    dot.className = 'status-dot';
    text.textContent = 'PUBLISHED';
  }
}

function notifyPreview() {
  const iframe = document.getElementById('preview-iframe');
  if (iframe && iframe.contentWindow) {
    iframe.contentWindow.postMessage({
      type: 'BACKSTAGE_PREVIEW_UPDATE',
      content: currentDraft
    }, '*');
  }
}

// -------------------------------------------------------------
// 3. SECTION TREE & STRUCTURE (LEFT SIDEBAR)
// -------------------------------------------------------------
function renderSectionTree() {
  const treeContainer = document.getElementById('section-tree');
  if (!treeContainer || !currentDraft || !Array.isArray(currentDraft.sections)) return;

  let html = '';
  currentDraft.sections.forEach((sec, idx) => {
    const isActive = (selectedSectionId === sec.id);
    const isHidden = (sec.visible === false);

    html += `
      <div class="tree-item ${isActive ? 'active' : ''}" data-id="${sec.id}" onclick="selectSection('${sec.id}')">
        <div class="tree-item-left">
          <span class="tree-drag-handle" title="Reorder">⋮⋮</span>
          <span class="tree-item-title">${escapeHtml(sec.name || sec.id)}</span>
          <span class="tree-item-type">${sec.type}</span>
        </div>
        <div class="tree-item-actions">
          <button type="button" class="tree-action-btn" onclick="moveSection(event, ${idx}, -1)" title="Move Up">↑</button>
          <button type="button" class="tree-action-btn" onclick="moveSection(event, ${idx}, 1)" title="Move Down">↓</button>
          <button type="button" class="tree-action-btn" onclick="toggleSectionVisibility(event, '${sec.id}')" title="Toggle Visibility">
            ${isHidden ? '👁️‍🗨️' : '👁️'}
          </button>
          <button type="button" class="tree-action-btn" onclick="duplicateSection(event, '${sec.id}')" title="Duplicate">⎘</button>
          <button type="button" class="tree-action-btn delete" onclick="confirmDeleteSection(event, '${sec.id}')" title="Delete">✕</button>
        </div>
      </div>
    `;

    // STRICT REQUIREMENT: HOBBIES AS NESTED CHILD OF THE CORE
    if (sec.type === 'the-core' && Array.isArray(sec.children) && sec.children.length > 0) {
      html += `<div class="tree-nested-container">`;
      sec.children.forEach(child => {
        const isChildActive = (selectedSectionId === child.id);
        const isChildHidden = (child.visible === false);
        html += `
          <div class="tree-item nested ${isChildActive ? 'active' : ''}" onclick="selectSection('${child.id}')">
            <div class="tree-item-left">
              <span style="font-size: 10px; color: var(--crimson);">↳</span>
              <span class="tree-item-title">${escapeHtml(child.name)}</span>
              <span class="tree-item-type">${child.type}</span>
            </div>
            <div class="tree-item-actions">
              <button type="button" class="tree-action-btn" onclick="toggleChildVisibility(event, '${sec.id}', '${child.id}')" title="Toggle Visibility">
                ${isChildHidden ? '👁️‍🗨️' : '👁️'}
              </button>
            </div>
          </div>
        `;
      });
      html += `</div>`;
    }
  });

  treeContainer.innerHTML = html;
}

function selectSection(id) {
  selectedSectionId = id;
  renderSectionTree();

  const sec = findSectionOrChild(id);
  const badge = document.getElementById('props-badge');
  const title = document.getElementById('props-title');
  const subnavInfo = document.getElementById('workspace-selected-info');

  if (sec) {
    if (sec.type === 'visual-orbit' || sec.id === 'sec-visual-orbit') {
      if (badge) badge.textContent = 'VISUAL ORBIT';
      if (title) title.textContent = 'VISUAL ORBIT';
      if (subnavInfo) subnavInfo.textContent = 'SELECTED: 06 // VISUAL ORBIT';
    } else if (sec.type === 'hobbies' || sec.id === 'sub-hobbies') {
      if (badge) badge.textContent = 'OFF THE CLOCK';
      if (title) title.textContent = 'OFF THE CLOCK (PERSONAL ARCHIVE)';
      if (subnavInfo) subnavInfo.textContent = 'SELECTED: OFF THE CLOCK (PERSONAL ARCHIVE)';
    } else {
      if (badge) badge.textContent = `${sec.type.toUpperCase()} CONFIGURATION`;
      if (title) title.textContent = sec.name || sec.title || 'Section Editor';
      if (subnavInfo) subnavInfo.textContent = `SELECTED: ${sec.name || sec.id}`;
    }
  }

  renderPropertiesPanel(sec);
  renderCenterForm(sec);
}

function findSectionOrChild(id) {
  if (!currentDraft || !currentDraft.sections) return null;
  for (const s of currentDraft.sections) {
    if (s.id === id) return s;
    if (s.children) {
      for (const ch of s.children) {
        if (ch.id === id) return ch;
      }
    }
  }
  return null;
}

function moveSection(e, idx, dir) {
  e.stopPropagation();
  const newIdx = idx + dir;
  if (newIdx < 0 || newIdx >= currentDraft.sections.length) return;
  const item = currentDraft.sections.splice(idx, 1)[0];
  currentDraft.sections.splice(newIdx, 0, item);
  // Re-index orders
  currentDraft.sections.forEach((s, i) => s.order = i + 1);
  markUnsaved();
  renderSectionTree();
}

function toggleSectionVisibility(e, id) {
  e.stopPropagation();
  const sec = findSectionOrChild(id);
  if (sec) {
    sec.visible = (sec.visible === false) ? true : false;
    markUnsaved();
    renderSectionTree();
    notifyPreview();
  }
}

function toggleChildVisibility(e, parentId, childId) {
  e.stopPropagation();
  const parent = findSectionOrChild(parentId);
  if (parent && parent.children) {
    const child = parent.children.find(ch => ch.id === childId);
    if (child) {
      child.visible = (child.visible === false) ? true : false;
      markUnsaved();
      renderSectionTree();
      notifyPreview();
    }
  }
}

function duplicateSection(e, id) {
  e.stopPropagation();
  const idx = currentDraft.sections.findIndex(s => s.id === id);
  if (idx === -1) return;
  const original = currentDraft.sections[idx];
  const clone = JSON.parse(JSON.stringify(original));
  clone.id = `${original.id}_copy_${Date.now()}`;
  clone.name = `${original.name} (Copy)`;
  currentDraft.sections.splice(idx + 1, 0, clone);
  currentDraft.sections.forEach((s, i) => s.order = i + 1);
  markUnsaved();
  renderSectionTree();
  selectSection(clone.id);
  showToast(`Duplicated ${original.name}`);
}

function confirmDeleteSection(e, id) {
  e.stopPropagation();
  const sec = findSectionOrChild(id);
  if (!sec) return;

  const modal = document.getElementById('confirm-modal');
  const title = document.getElementById('confirm-modal-title');
  const desc = document.getElementById('confirm-modal-desc');
  const actionBtn = document.getElementById('confirm-modal-action-btn');

  title.textContent = 'DELETE SECTION?';
  desc.innerHTML = `Are you sure you want to delete <strong>${escapeHtml(sec.name || sec.id)}</strong>? If this section contains child content, all nested items will also be removed.`;

  actionBtn.textContent = 'DELETE PERMANENTLY';
  actionBtn.onclick = () => {
    currentDraft.sections = currentDraft.sections.filter(s => s.id !== id);
    currentDraft.sections.forEach((s, i) => s.order = i + 1);
    closeConfirmModal();
    markUnsaved();
    if (selectedSectionId === id) {
      selectedSectionId = currentDraft.sections[0]?.id || '';
    }
    renderSectionTree();
    selectSection(selectedSectionId);
    showToast('Section deleted');
  };

  modal.classList.add('active');
}

function filterSections(e) {
  const query = e.target.value.toLowerCase().trim();
  const items = document.querySelectorAll('.tree-item');
  items.forEach(item => {
    const text = item.textContent.toLowerCase();
    item.style.display = text.includes(query) ? '' : 'none';
  });
}

// -------------------------------------------------------------
// 4. CONTEXTUAL PROPERTIES PANEL (RIGHT COLUMN)
// -------------------------------------------------------------
function renderPropertiesPanel(section) {
  const container = document.getElementById('props-container');
  if (!container || !section) return;

  let html = `
    <div class="form-group">
      <label class="form-label">SECTION NAME (CMS DISPLAY)</label>
      <input type="text" class="form-input" value="${escapeHtml(section.name || '')}" oninput="updateField('${section.id}', 'name', this.value)">
    </div>
    <div class="form-group" style="display: flex; justify-content: space-between; align-items: center; background: var(--bg-surface); padding: 10px 14px; border-radius: 6px; border: 1px solid var(--border-base); margin-bottom: 16px;">
      <div>
        <label class="form-label" style="margin: 0; font-size: 11px;">SECTION VISIBILITY</label>
        <span class="field-hint" style="font-size: 10px; opacity: 0.7;">Controls section rendering on public portfolio</span>
      </div>
      ${renderVisibilityButton(section.id, 'visible', section.visible !== false)}
    </div>
  `;

  // Render contextual type-specific fields
  switch (section.type) {
    case 'hero':
      html += renderHeroProps(section);
      break;
    case 'ticker':
      html += renderTickerProps(section);
      break;
    case 'metrics':
      html += renderMetricsProps(section);
      break;
    case 'beyond-the-frame':
      html += renderBeyondFrameProps(section);
      break;
    case 'selected-works':
      html += renderSelectedWorksProps(section);
      break;
    case 'visual-orbit':
      html += renderVisualOrbitProps(section);
      break;
    case 'my-expertise':
      html += renderExpertiseProps(section);
      break;
    case 'the-core':
      html += renderCoreProps(section);
      break;
    case 'hobbies':
      html += renderHobbiesProps(section);
      break;
    case 'cta':
      html += renderCTAProps(section);
      break;
    case 'card-grid':
    case 'archive':
      html += renderCardGridProps(section);
      break;
    case 'text-media':
      html += renderTextMediaProps(section);
      break;
    case 'editorial':
      html += renderEditorialProps(section);
      break;
    case 'video-showcase':
      html += renderVideoShowcaseProps(section);
      break;
    default:
      html += renderGenericProps(section);
      break;
  }

  container.innerHTML = html;
}

function renderCenterForm(section) {
  const container = document.getElementById('center-form-container');
  if (!container || !section) return;
  // Re-render matching form view in center tab
  container.innerHTML = document.getElementById('props-container')?.innerHTML || '';
}

// Helper: updates top-level property
function updateField(secId, key, val) {
  const sec = findSectionOrChild(secId);
  if (!sec) return;
  sec[key] = val;
  markUnsaved();
  renderSectionTree();
}

// Helper: updates nested content property
function updateContentField(secId, pathStr, val) {
  const sec = findSectionOrChild(secId);
  if (!sec || !sec.content) return;
  const parts = pathStr.split('.');
  let curr = sec.content;
  for (let i = 0; i < parts.length - 1; i++) {
    if (!curr[parts[i]]) curr[parts[i]] = {};
    curr = curr[parts[i]];
  }
  curr[parts[parts.length - 1]] = val;
  markUnsaved();
}

// --- Specific Type Renderers ---

function renderHeroProps(sec) {
  const c = sec.content || {};
  return `
    <div class="form-group">
      <label class="form-label">HEADLINE / ARTIST NAME</label>
      <input type="text" class="form-input" value="${escapeHtml(c.headline || '')}" oninput="updateContentField('${sec.id}', 'headline', this.value)">
    </div>
    <div class="form-group">
      <label class="form-label">TAGLINE / QUOTE</label>
      <input type="text" class="form-input" value="${escapeHtml(c.quote || '')}" oninput="updateContentField('${sec.id}', 'quote', this.value)">
    </div>
    <div class="form-group">
      <label class="form-label">QUOTE BRACKET / PREFIX</label>
      <input type="text" class="form-input" value="${escapeHtml(c.quoteBracket || '//')}" oninput="updateContentField('${sec.id}', 'quoteBracket', this.value)">
    </div>
    <div class="collection-title" style="display: flex; justify-content: space-between; align-items: center; margin-top: 14px; margin-bottom: 8px;">
      <span>HERO STICKY NOTE & STAMP</span>
      ${renderVisibilityButton(sec.id, 'content.stickyNote.visible', c.stickyNote?.visible !== false, 'Sticky Note')}
    </div>
    <div class="form-group">
      <label class="form-label">STICKY NOTE BADGE TEXT</label>
      <input type="text" class="form-input" value="${escapeHtml(c.stickyNote?.badge || '')}" oninput="updateContentField('${sec.id}', 'stickyNote.badge', this.value)">
    </div>
    <div class="form-group">
      <label class="form-label">STICKY NOTE ARTWORK IMAGE</label>
      ${renderMediaField(sec.id, 'stickyNote.image', c.stickyNote?.image || 'Gen ai.png')}
    </div>
    <div class="form-group">
      <label class="form-label">STICKY NOTE PAPER TEXTURE</label>
      ${renderMediaField(sec.id, 'stickyNote.paperImage', c.stickyNote?.paperImage || 'sticky-note-clean.png')}
    </div>
    <div class="form-group">
      <label class="form-label">PUSH PIN ASSET</label>
      ${renderMediaField(sec.id, 'stickyNote.pinImage', c.stickyNote?.pinImage || 'push-pin-clean.png')}
    </div>
    <div class="collection-title" style="display: flex; justify-content: space-between; align-items: center; margin-top: 14px; margin-bottom: 8px;">
      <span>CALL TO ACTION & NAVIGATION</span>
      ${renderVisibilityButton(sec.id, 'content.resumeButton.visible', c.resumeButton?.visible !== false, 'Resume Btn')}
    </div>
    <div class="form-group">
      <label class="form-label">RESUME BUTTON LABEL</label>
      <input type="text" class="form-input" value="${escapeHtml(c.resumeButtonLabel || '')}" oninput="updateContentField('${sec.id}', 'resumeButtonLabel', this.value)">
    </div>
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
      <span class="form-label" style="margin: 0;">SCROLL DOWN WIDGET</span>
      ${renderVisibilityButton(sec.id, 'content.scrollDownWidget.visible', c.scrollDownWidget?.visible !== false, 'Scroll Widget')}
    </div>
    <div class="form-row-2">
      <div class="form-group">
        <label class="form-label">SCROLL DOWN LABEL</label>
        <input type="text" class="form-input" value="${escapeHtml(c.scrollDownLabel || 'SCROLL DOWN')}" oninput="updateContentField('${sec.id}', 'scrollDownLabel', this.value)">
      </div>
      <div class="form-group">
        <label class="form-label">SCROLL DOWN SUBLABEL</label>
        <input type="text" class="form-input" value="${escapeHtml(c.scrollDownSub || 'EXPLORE ARCHIVE')}" oninput="updateContentField('${sec.id}', 'scrollDownSub', this.value)">
      </div>
    </div>
    <div class="collection-title" style="display: flex; justify-content: space-between; align-items: center; margin-top: 14px; margin-bottom: 8px;">
      <span>HERO SKILLS TICKER</span>
      ${renderVisibilityButton(sec.id, 'content.ticker.visible', c.ticker?.visible !== false, 'Skills Ticker')}
    </div>
    <div class="form-group">
      <label class="form-label">Hero Ticker Text</label>
      <textarea class="form-textarea" rows="3" placeholder="Enter dot-separated creative disciplines..." oninput="updateHeroTickerFromCMS(this.value)">${escapeHtml(c.tickerText || 'GENERATIVE AI · CREATIVE DIRECTION · PIPELINE INTEGRATION · GRAPHIC DESIGN · AI MOTION DESIGN · VISUAL DEVELOPMENT')}</textarea>
      <span class="field-hint" style="font-size: 11px; opacity: 0.65; display: block; margin-top: 4px;">Dot-separated list of creative disciplines displayed in the continuous Hero ticker.</span>
    </div>

    <div class="collection-title" style="margin-top: 18px; margin-bottom: 8px;">
      HERO EXR SNAP AUDIO (FRAMES 100–124)
    </div>
    <div class="form-group">
      <label class="form-label">ENABLE SNAP AUDIO TRIGGER</label>
      <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; color: var(--text-primary); font-size: 11px;">
        <input type="checkbox" ${c.audio?.enabled !== false ? 'checked' : ''} onchange="updateContentField('${sec.id}', 'audio.enabled', this.checked)">
        <span>Active (Audible exclusively when cursor is within Hero section)</span>
      </label>
    </div>
    <div class="form-group">
      <label class="form-label">HERO SNAP AUDIO ASSET (.MPEG / .MP3 / .WAV)</label>
      ${renderMediaField(sec.id, 'audio.src', c.audio?.src || 'snap.mpeg')}
    </div>
    <div class="form-row-2">
      <div class="form-group">
        <label class="form-label">START FRAME (INCLUSIVE)</label>
        <input type="number" class="form-input" min="1" max="291" value="${c.audio?.startFrame || 100}" oninput="updateContentField('${sec.id}', 'audio.startFrame', parseInt(this.value, 10) || 100)">
      </div>
      <div class="form-group">
        <label class="form-label">END FRAME (INCLUSIVE)</label>
        <input type="number" class="form-input" min="1" max="291" value="${c.audio?.endFrame || 124}" oninput="updateContentField('${sec.id}', 'audio.endFrame', parseInt(this.value, 10) || 124)">
      </div>
    </div>
  `;
}

function renderTickerProps(sec) {
  const c = sec.content || {};
  const items = c.items || [];
  return `
    <div class="form-group">
      <label class="form-label">Hero Ticker Text</label>
      <textarea class="form-textarea" rows="3" placeholder="Enter dot-separated creative disciplines..." oninput="updateHeroTickerFromCMS(this.value)">${escapeHtml(c.tickerText || (items.length ? items.join(' · ') : 'GENERATIVE AI · CREATIVE DIRECTION · PIPELINE INTEGRATION · GRAPHIC DESIGN · AI MOTION DESIGN · VISUAL DEVELOPMENT'))}</textarea>
      <span class="field-hint" style="font-size: 11px; opacity: 0.65; display: block; margin-top: 4px;">Edit the full ticker text. Changes appear immediately in the continuous Hero rail.</span>
    </div>

    <div class="form-group">
      <label class="form-label">SPEED (SECONDS PER LOOP)</label>
      <input type="number" class="form-input" value="${sec.config?.speed || 36}" oninput="updateConfigField('${sec.id}', 'speed', Number(this.value))">
    </div>
    <div class="form-group">
      <label class="form-label">SEPARATOR</label>
      <input type="text" class="form-input" value="${escapeHtml(sec.config?.separator || '·')}" oninput="updateConfigField('${sec.id}', 'separator', this.value)">
    </div>
    
    <div class="collection-header">
      <span class="collection-title">TICKER ITEMS (${items.length})</span>
      <button type="button" class="btn-add-item" onclick="addTickerItem('${sec.id}')">+ ADD ITEM</button>
    </div>
    ${items.map((item, idx) => `
      <div class="collection-card">
        <div class="collection-card-header">
          <span class="collection-card-num">#${idx + 1}</span>
          <button type="button" class="btn-card-del" onclick="removeTickerItem('${sec.id}', ${idx})">✕</button>
        </div>
        <input type="text" class="form-input" value="${escapeHtml(item)}" oninput="updateTickerItem('${sec.id}', ${idx}, this.value)">
      </div>
    `).join('')}
  `;
}

function addTickerItem(secId) {
  const sec = findSectionOrChild(secId);
  if (!sec || !sec.content) return;
  sec.content.items.push('NEW SKILL ITEM');
  markUnsaved();
  renderPropertiesPanel(sec);
}

function removeTickerItem(secId, idx) {
  const sec = findSectionOrChild(secId);
  if (!sec || !sec.content) return;
  sec.content.items.splice(idx, 1);
  markUnsaved();
  renderPropertiesPanel(sec);
}

function updateTickerItem(secId, idx, val) {
  const sec = findSectionOrChild(secId);
  if (!sec || !sec.content) return;
  sec.content.items[idx] = val;
  markUnsaved();
}

function updateHeroTickerFromCMS(val) {
  const secHero = findSectionOrChild('sec-hero');
  if (secHero) {
    if (!secHero.content) secHero.content = {};
    secHero.content.tickerText = val;
  }
  const secTicker = findSectionOrChild('sec-ticker');
  if (secTicker) {
    if (!secTicker.content) secTicker.content = {};
    secTicker.content.tickerText = val;
    const sep = val.includes('·') ? '·' : (val.includes('•') ? '•' : '·');
    secTicker.content.items = val.split(sep).map(s => s.trim()).filter(Boolean);
  }
  markUnsaved();
  notifyPreview();
}
window.updateHeroTickerFromCMS = updateHeroTickerFromCMS;

function updateBTFTickerFromCMS(val) {
  const secBTF = findSectionOrChild('sec-beyond-frame');
  if (secBTF) {
    if (!secBTF.content) secBTF.content = {};
    secBTF.content.tickerText = val;
    secBTF.content.wordmark = val;
  }
  markUnsaved();
  notifyPreview();
}
window.updateBTFTickerFromCMS = updateBTFTickerFromCMS;

function updateConfigField(secId, key, val) {
  const sec = findSectionOrChild(secId);
  if (!sec) return;
  if (!sec.config) sec.config = {};
  sec.config[key] = val;
  markUnsaved();
}

function renderMetricsProps(sec) {
  const c = sec.content || {};
  const items = c.items || [];
  return `
    <div class="form-group">
      <label class="form-label">META LABEL</label>
      <input type="text" class="form-input" value="${escapeHtml(c.metaLabel || '')}" oninput="updateContentField('${sec.id}', 'metaLabel', this.value)">
    </div>
    <div class="form-group">
      <label class="form-label">SECTION TITLE</label>
      <input type="text" class="form-input" value="${escapeHtml(c.title || '')}" oninput="updateContentField('${sec.id}', 'title', this.value)">
    </div>
    <div class="form-group">
      <label class="form-label">SUBTITLE</label>
      <textarea class="form-textarea" oninput="updateContentField('${sec.id}', 'subtitle', this.value)">${escapeHtml(c.subtitle || '')}</textarea>
    </div>

    <div class="collection-header">
      <span class="collection-title">METRIC CARDS (${items.length})</span>
      <button type="button" class="btn-add-item" onclick="addMetricItem('${sec.id}')">+ ADD METRIC</button>
    </div>
    ${items.map((m, idx) => `
      <div class="collection-card">
        <div class="collection-card-header" style="display: flex; justify-content: space-between; align-items: center;">
          <span class="collection-card-num">CARD 0${idx + 1} // ${escapeHtml(m.label || '')}</span>
          <div style="display: flex; align-items: center; gap: 8px;">
            ${renderVisibilityButton(sec.id, `content.items.${idx}.visible`, m.visible !== false)}
            <button type="button" class="btn-card-del" onclick="confirmDeleteEntry('${sec.id}', 'items', '${m.id}', '${escapeHtml(m.label)}')" title="Delete Metric Permanently">✕</button>
          </div>
        </div>
        <div class="form-row-2">
          <div class="form-group">
            <label class="form-label">VALUE</label>
            <input type="text" class="form-input" value="${escapeHtml(m.value || '')}" oninput="updateMetricField('${sec.id}', ${idx}, 'value', this.value)">
          </div>
          <div class="form-group">
            <label class="form-label">SUFFIX (+, etc)</label>
            <input type="text" class="form-input" value="${escapeHtml(m.suffix || '')}" oninput="updateMetricField('${sec.id}', ${idx}, 'suffix', this.value)">
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">LABEL</label>
          <input type="text" class="form-input" value="${escapeHtml(m.label || '')}" oninput="updateMetricField('${sec.id}', ${idx}, 'label', this.value)">
        </div>
        <div class="form-group">
          <label class="form-label">CATEGORY</label>
          <input type="text" class="form-input" value="${escapeHtml(m.category || '')}" oninput="updateMetricField('${sec.id}', ${idx}, 'category', this.value)">
        </div>
        <div class="form-group">
          <label class="form-label">HOVER EXPAND DESCRIPTION</label>
          <textarea class="form-textarea" oninput="updateMetricField('${sec.id}', ${idx}, 'description', this.value)">${escapeHtml(m.description || '')}</textarea>
        </div>
      </div>
    `).join('')}
  `;
}

function addMetricItem(secId) {
  const sec = findSectionOrChild(secId);
  if (!sec || !sec.content) return;
  sec.content.items.push({
    id: `metric-${Date.now()}`,
    category: 'PRODUCTION',
    value: '100',
    suffix: '+',
    label: 'NEW METRIC',
    description: 'Description of the metric achievement.',
    featured: false,
    visible: true
  });
  markUnsaved();
  renderPropertiesPanel(sec);
}

function removeMetricItem(secId, idx) {
  const sec = findSectionOrChild(secId);
  if (!sec || !sec.content) return;
  sec.content.items.splice(idx, 1);
  markUnsaved();
  renderPropertiesPanel(sec);
}

function updateMetricField(secId, idx, key, val) {
  const sec = findSectionOrChild(secId);
  if (!sec || !sec.content) return;
  sec.content.items[idx][key] = val;
  markUnsaved();
}

// BEYOND THE FRAME EXACTLY 9 UNIQUE IMAGE SLOTS MANAGEMENT
// -------------------------------------------------------------
const DEFAULT_BTF_ENTRIES = [
  {
    id: 'btf-01',
    slotNumber: '01',
    title: 'RAMAYANA',
    category: '01 // GENERATIVE AI × VFX',
    desc: 'At DNEG, I built 2D/3D AI workflows for realistic face replacement and lip-sync',
    image: '1_Ram.png',
    position: 'center 40%',
    visible: true
  },
  {
    id: 'btf-02',
    slotNumber: '02',
    title: 'VEER BHADRA',
    category: '02 // AI FILMMAKING',
    desc: 'Shaped the film from character design and scripting to direction and final sequences.',
    image: 'VB.png',
    position: 'center 48%',
    visible: true
  },
  {
    id: 'btf-03',
    slotNumber: '03',
    title: 'FIRMWARE UPDATE',
    category: '03 // GENERATIVE AI PRODUCTION',
    desc: 'Transformed the director’s vision into AI-generated characters, worlds, and cinematic sequences.',
    image: 'Firmware.png',
    position: 'center 26%',
    visible: true
  },
  {
    id: 'btf-04',
    slotNumber: '04',
    title: 'ASHRA Cinematic Universe',
    category: '04 // SOLO CREATIVE IP',
    desc: 'Created everything from concept and world-building to music, branding, and final film.',
    image: 'Ashra.png',
    position: 'center center',
    visible: true
  },
  {
    id: 'btf-05',
    slotNumber: '05',
    title: 'HORNS & SKULL',
    category: '05 //  Re Imagined COMIC & SHOTS',
    desc: 'Building a Marvel-inspired universe reimagined in Indian Version.',
    image: 'horns.png',
    position: 'center 36%',
    visible: true
  },
  {
    id: 'btf-06',
    slotNumber: '06',
    title: 'DUNE LOOK-DEV',
    category: '06 // STUDIO PIPELINE & VFX',
    desc: 'Visual exploration for cinematic environments, lighting and atmospheric composition.',
    image: 'dune-dneg.jpg',
    position: 'center 48%',
    visible: true
  },
  {
    id: 'btf-07',
    slotNumber: '07',
    title: 'ENVIRONMENT DESIGN',
    category: '07 // PLANETARY WORLD BUILDING',
    desc: 'Atmosphere, planetary scale and environment composition for feature film narratives.',
    image: 'media_1791962972986.png',
    position: 'center center',
    visible: true
  },
  {
    id: 'btf-08',
    slotNumber: '08',
    title: 'AI FILMMAKING',
    category: '08 // GENERATIVE FLOWS',
    desc: 'Generative image-to-video creative workflows and multi-shot synthetic film pipelines.',
    image: 'media_1791977571390.png',
    position: 'center 38%',
    visible: true
  },
  {
    id: 'btf-09',
    slotNumber: '09',
    title: 'MYTHIC WORLDS',
    category: '09 // CONCEPT & LORE',
    desc: 'Original mythological world development and synthetic epic atmosphere.',
    image: 'Ramayana.png',
    position: 'center 40%',
    visible: true
  }
];

function ensureBeyondFrameEntries(sec) {
  if (!sec.content) sec.content = {};
  if (!Array.isArray(sec.content.entries)) {
    sec.content.entries = JSON.parse(JSON.stringify(DEFAULT_BTF_ENTRIES));
    return;
  }
  // Ensure every entry has stable ID, slot number, and visible flag without overriding deletions
  sec.content.entries.forEach((e, idx) => {
    if (!e.id) e.id = `btf-${String(idx + 1).padStart(2, '0')}`;
    if (!e.slotNumber) e.slotNumber = String(idx + 1).padStart(2, '0');
    if (e.visible === undefined) e.visible = true;
  });
}
window.ensureBeyondFrameEntries = ensureBeyondFrameEntries;

function renderBeyondFrameProps(sec) {
  ensureBeyondFrameEntries(sec);
  const c = sec.content || {};
  const entries = c.entries || [];
  const populatedCount = entries.filter(e => e.image && e.image.trim()).length;

  return `
    <div class="form-group">
      <label class="form-label">META LABEL</label>
      <input type="text" class="form-input" value="${escapeHtml(c.metaLabel || '')}" oninput="updateContentField('${sec.id}', 'metaLabel', this.value)">
    </div>
    <div class="form-group">
      <label class="form-label">SECTION TITLE</label>
      <input type="text" class="form-input" value="${escapeHtml(c.title || '')}" oninput="updateContentField('${sec.id}', 'title', this.value)">
    </div>
    <div class="form-group">
      <label class="form-label">Beyond the Frame Ticker Text</label>
      <textarea class="form-textarea" rows="2" placeholder="e.g. BEYOND THE FRAME" oninput="updateBTFTickerFromCMS(this.value)">${escapeHtml(c.tickerText || c.wordmark || 'BEYOND THE FRAME')}</textarea>
      <span class="field-hint" style="font-size: 11px; opacity: 0.65; display: block; margin-top: 4px;">Marquee phrase rendered continuously across the large animated wordmark track.</span>
    </div>
    <div class="form-group">
      <label class="form-label">DESCRIPTION</label>
      <textarea class="form-textarea" oninput="updateContentField('${sec.id}', 'description', this.value)">${escapeHtml(c.description || '')}</textarea>
    </div>

    <div class="collection-header" style="margin-top: 18px; margin-bottom: 12px; display: flex; justify-content: space-between; align-items: center;">
      <div>
        <span class="collection-title">CINEMATIC STACK ENTRIES (${entries.length})</span>
        <span class="field-hint" style="font-size: 11px; opacity: 0.65; display: block; margin-top: 2px;">
          ${populatedCount} of ${entries.length} slots populated. Independent visibility, reordering, and deliberate additions.
        </span>
      </div>
      <button type="button" class="btn-add-item" onclick="addBTFEntry('${sec.id}')">+ ADD ENTRY</button>
    </div>

    ${entries.map((entry, idx) => {
      const num = entry.slotNumber || String(idx + 1).padStart(2, '0');
      const hasImage = Boolean(entry.image && entry.image.trim());
      return `
        <div class="collection-card" data-slot-id="${entry.id}">
          <div class="collection-card-header" style="display: flex; justify-content: space-between; align-items: center;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <span class="collection-card-num" style="color: #ff3038; font-weight: 700;">SLOT ${num}</span>
              <span style="font-size: 12px; opacity: 0.85; font-family: 'JetBrains Mono', monospace;">[ID: ${entry.id}]</span>
              <span style="font-size: 13px; font-weight: 600;">// ${escapeHtml(entry.title || 'Untitled Slot')}</span>
            </div>
            <div style="display: flex; align-items: center; gap: 6px;">
              <span class="orbit-status-tag ${hasImage ? 'populated' : 'empty'}" style="font-size: 10px; padding: 2px 8px; border-radius: 4px;">
                ${hasImage ? 'POPULATED' : 'EMPTY'}
              </span>
              <button type="button" class="tree-action-btn" onclick="moveBTFEntry('${sec.id}', ${idx}, -1)" title="Move Up">↑</button>
              <button type="button" class="tree-action-btn" onclick="moveBTFEntry('${sec.id}', ${idx}, 1)" title="Move Down">↓</button>
              ${renderVisibilityButton(sec.id, `content.entries.${idx}.visible`, entry.visible !== false)}
              <button type="button" class="btn-card-del" onclick="confirmDeleteEntry('${sec.id}', 'entries', '${entry.id}', '${escapeHtml(entry.title)}')" title="Delete Entry Permanently">✕</button>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">TITLE</label>
            <input type="text" class="form-input" value="${escapeHtml(entry.title)}" oninput="updateBTFEntry('${sec.id}', ${idx}, 'title', this.value)">
          </div>
          <div class="form-group">
            <label class="form-label">CATEGORY BADGE</label>
            <input type="text" class="form-input" value="${escapeHtml(entry.category)}" oninput="updateBTFEntry('${sec.id}', ${idx}, 'category', this.value)">
          </div>
          <div class="form-group">
            <label class="form-label">DESCRIPTION</label>
            <textarea class="form-textarea" oninput="updateBTFEntry('${sec.id}', ${idx}, 'desc', this.value)">${escapeHtml(entry.desc)}</textarea>
          </div>
          <div class="form-group">
            <label class="form-label">CINEMATIC BANNER IMAGE (4:1 BANNER // 1584×396)</label>
            ${renderMediaField(sec.id, `entries.${idx}.image`, entry.image)}
          </div>
          <div class="form-group">
            <label class="form-label">FOCAL POSITION</label>
            <input type="text" class="form-input" value="${escapeHtml(entry.position || 'center center')}" oninput="updateBTFEntry('${sec.id}', ${idx}, 'position', this.value)">
          </div>
        </div>
      `;
    }).join('')}
  `;
}

function updateBTFEntry(secId, idx, key, val) {
  const sec = findSectionOrChild(secId);
  if (!sec || !sec.content) return;
  ensureBeyondFrameEntries(sec);
  if (sec.content.entries[idx]) {
    sec.content.entries[idx][key] = val;
    markUnsaved();
  }
}
window.updateBTFEntry = updateBTFEntry;

function renderSelectedWorksProps(sec) {
  const c = sec.content || {};
  const lands = c.landscapeProjects || [];
  const reels = c.portraitReels || [];
  return `
    <div class="form-group">
      <label class="form-label">SECTION TITLE</label>
      <input type="text" class="form-input" value="${escapeHtml(c.title || '')}" oninput="updateContentField('${sec.id}', 'title', this.value)">
    </div>
    <div class="form-group">
      <label class="form-label">SUBTITLE</label>
      <textarea class="form-textarea" oninput="updateContentField('${sec.id}', 'subtitle', this.value)">${escapeHtml(c.subtitle || '')}</textarea>
    </div>

    <div class="collection-header">
      <span class="collection-title">LANDSCAPE PROJECTS (${lands.length})</span>
      <button type="button" class="btn-add-item" onclick="addLandscapeProject('${sec.id}')">+ ADD PROJECT</button>
    </div>
    ${lands.map((p, idx) => `
      <div class="collection-card">
        <div class="collection-card-header" style="display: flex; justify-content: space-between; align-items: center;">
          <span class="collection-card-num">#${idx + 1} ${escapeHtml(p.title)}</span>
          <div style="display: flex; align-items: center; gap: 8px;">
            ${renderVisibilityButton(sec.id, `content.landscapeProjects.${idx}.visible`, p.visible !== false)}
            <button type="button" class="btn-card-del" onclick="confirmDeleteEntry('${sec.id}', 'landscapeProjects', '${p.id}', '${escapeHtml(p.title)}')" title="Delete Project Permanently">✕</button>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">TITLE</label>
          <input type="text" class="form-input" value="${escapeHtml(p.title)}" oninput="updateLandscapeProject('${sec.id}', ${idx}, 'title', this.value)">
        </div>
        <div class="form-group">
          <label class="form-label">SUMMARY</label>
          <input type="text" class="form-input" value="${escapeHtml(p.summary || '')}" oninput="updateLandscapeProject('${sec.id}', ${idx}, 'summary', this.value)">
        </div>
        <div class="form-group">
          <label class="form-label">FULL DESCRIPTION</label>
          <textarea class="form-textarea" oninput="updateLandscapeProject('${sec.id}', ${idx}, 'description', this.value)">${escapeHtml(p.description || '')}</textarea>
        </div>
        <div class="form-row-2">
          <div class="form-group">
            <label class="form-label">CATEGORY</label>
            <input type="text" class="form-input" value="${escapeHtml(p.category || '')}" oninput="updateLandscapeProject('${sec.id}', ${idx}, 'category', this.value)">
          </div>
          <div class="form-group">
            <label class="form-label">YEAR</label>
            <input type="text" class="form-input" value="${escapeHtml(p.year || '')}" oninput="updateLandscapeProject('${sec.id}', ${idx}, 'year', this.value)">
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">BADGE TEXT</label>
          <input type="text" class="form-input" value="${escapeHtml(p.badge || '')}" oninput="updateLandscapeProject('${sec.id}', ${idx}, 'badge', this.value)">
        </div>
        <div class="form-group">
          <label class="form-label">COVER MEDIA (VIDEO / IMAGE)</label>
          ${renderMediaField(sec.id, `landscapeProjects.${idx}.image`, p.image)}
        </div>
        <div class="form-group">
          <label class="form-label">RESTING PREVIEW POSTER</label>
          ${renderMediaField(sec.id, `landscapeProjects.${idx}.poster`, p.poster || '')}
        </div>
      </div>
    `).join('')}

    <div class="collection-header">
      <span class="collection-title">PORTRAIT REELS (${reels.length})</span>
    </div>
    ${reels.map((r, idx) => `
      <div class="collection-card">
        <div class="collection-card-header" style="display: flex; justify-content: space-between; align-items: center;">
          <span class="collection-card-num">REEL 0${idx + 1} // ${escapeHtml(r.title)}</span>
          ${renderVisibilityButton(sec.id, `content.portraitReels.${idx}.visible`, r.visible !== false)}
        </div>
        <div class="form-group">
          <label class="form-label">TITLE</label>
          <input type="text" class="form-input" value="${escapeHtml(r.title)}" oninput="updateReelProject('${sec.id}', ${idx}, 'title', this.value)">
        </div>
        <div class="form-row-2">
          <div class="form-group">
            <label class="form-label">CATEGORY</label>
            <input type="text" class="form-input" value="${escapeHtml(r.category || '')}" oninput="updateReelProject('${sec.id}', ${idx}, 'category', this.value)">
          </div>
          <div class="form-group">
            <label class="form-label">YEAR</label>
            <input type="text" class="form-input" value="${escapeHtml(r.year || '')}" oninput="updateReelProject('${sec.id}', ${idx}, 'year', this.value)">
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">BADGE TEXT</label>
          <input type="text" class="form-input" value="${escapeHtml(r.badge || '')}" oninput="updateReelProject('${sec.id}', ${idx}, 'badge', this.value)">
        </div>
        <div class="form-group">
          <label class="form-label">COVER MEDIA (9:16)</label>
          ${renderMediaField(sec.id, `portraitReels.${idx}.image`, r.image)}
        </div>
        <div class="form-group">
          <label class="form-label">RESTING PREVIEW POSTER</label>
          ${renderMediaField(sec.id, `portraitReels.${idx}.poster`, r.poster || '')}
        </div>
      </div>
    `).join('')}
  `;
}

function addLandscapeProject(secId) {
  const sec = findSectionOrChild(secId);
  if (!sec || !sec.content) return;
  sec.content.landscapeProjects.push({
    id: `proj-${Date.now()}`,
    title: 'NEW CINEMATIC WORK',
    subtitle: 'Feature Look-Dev // Diffusion Pipeline',
    summary: 'Cinematic worldbuilding and synthetic asset synthesis.',
    description: 'Detailed description of the production pipeline, tools, and visual direction.',
    image: 'Ramayana.png',
    badge: '[◈] FEATURE CINEMA // 2026',
    tags: ['DNEG', '·', 'VFX PIPELINE'],
    visible: true
  });
  markUnsaved();
  renderPropertiesPanel(sec);
}

function removeLandscapeProject(secId, idx) {
  const sec = findSectionOrChild(secId);
  if (!sec || !sec.content) return;
  sec.content.landscapeProjects.splice(idx, 1);
  markUnsaved();
  renderPropertiesPanel(sec);
}

function updateLandscapeProject(secId, idx, key, val) {
  const sec = findSectionOrChild(secId);
  if (!sec || !sec.content) return;
  sec.content.landscapeProjects[idx][key] = val;
  markUnsaved();
}

function updateReelProject(secId, idx, key, val) {
  const sec = findSectionOrChild(secId);
  if (!sec || !sec.content) return;
  sec.content.portraitReels[idx][key] = val;
  markUnsaved();
}

// -------------------------------------------------------------
// VISUAL ORBIT 48 UNIQUE IMAGE SLOTS MANAGEMENT
// -------------------------------------------------------------
function ensureOrbitImages(sec) {
  if (!sec.content) sec.content = {};
  const currentSlots = Array.isArray(sec.content.slots) && sec.content.slots.length > 0
    ? sec.content.slots
    : (Array.isArray(sec.content.images) ? sec.content.images : (Array.isArray(sec.content.tiles) ? sec.content.tiles : []));

  const totalSlotsCount = 48;

  sec.content.slots = Array.from({ length: totalSlotsCount }, (_, idx) => {
    const num = String(idx + 1).padStart(2, '0');
    const stableId = `orbit-${num}`;
    const raw = currentSlots[idx] || currentSlots.find?.(s => s && (s.id === stableId || s.slot === num)) || null;

    if (raw && typeof raw === 'object') {
      const img = (raw.image || raw.src || '').trim();
      return {
        id: raw.id || stableId,
        slot: raw.slot || num,
        image: img,
        src: img,
        alt: raw.alt || (img ? `Visual Orbit Asset ${num}` : `Visual Orbit Slot ${num}`),
        title: raw.title || (img ? `Asset ${num}` : `Slot ${num}`),
        visible: (raw.visible !== undefined) ? (raw.visible !== false) : true
      };
    }
    return {
      id: stableId,
      slot: num,
      image: '',
      src: '',
      alt: `Visual Orbit Slot ${num}`,
      title: `Slot ${num}`,
      visible: true
    };
  });

  // Keep images & tiles synced for backwards compatibility
  sec.content.images = sec.content.slots;
  sec.content.tiles = sec.content.slots.filter(s => s.image);
}

function getOrbitSlotStatus(sec, idx) {
  const currentSlot = sec.content?.slots?.[idx] || sec.content?.images?.[idx];
  if (!currentSlot || !currentSlot.image) return 'EMPTY';

  if (publishedData && Array.isArray(publishedData.sections)) {
    const pubSec = publishedData.sections.find(s => s.id === sec.id);
    const pubSlot = pubSec?.content?.slots?.[idx] || pubSec?.content?.images?.[idx];
    if (pubSlot) {
      const pubSrc = pubSlot.image || pubSlot.src || '';
      const pubAlt = pubSlot.alt || '';
      if (currentSlot.image !== pubSrc || (currentSlot.alt || '') !== pubAlt) {
        return 'DRAFT EDITED';
      }
      return 'PUBLISHED';
    } else {
      return 'DRAFT NEW';
    }
  }
  return 'PUBLISHED';
}

function renderVisualOrbitProps(sec) {
  ensureOrbitImages(sec);
  const c = sec.content || {};
  const slots = c.slots || [];
  const populatedCount = slots.filter(s => s.image).length;
  const emptyCount = slots.length - populatedCount;

  return `
    <div class="orbit-panel-header">
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <div>
          <h4 class="orbit-panel-title">VISUAL ORBIT — 48 UNIQUE SLOTS</h4>
          <p class="orbit-panel-subtitle">Manage 48 unique slots. Populated slots display images on the 3D dome; empty slots remain ready for upload.</p>
        </div>
      </div>
      <div style="display: flex; gap: 8px; flex-wrap: wrap; margin-top: 10px;">
        <div class="orbit-sphere-meta">
          <span>[◈]</span>
          <span>${slots.length} INDIVIDUALLY ADDRESSABLE ORBITAL SLOTS</span>
        </div>
        <div class="orbit-sphere-meta" style="background: rgba(74, 222, 128, 0.08); border-color: rgba(74, 222, 128, 0.3); color: #4ade80;">
          <span>✓</span>
          <span>${populatedCount} POPULATED · ${emptyCount} EMPTY</span>
        </div>
      </div>
    </div>

    <div class="collection-title" style="margin-top: 14px; margin-bottom: 8px;">
      ${slots.length} INDIVIDUAL ORBITAL SLOTS (orbit-01 — orbit-${String(slots.length).padStart(2, '0')})
    </div>

    <div class="orbit-slots-grid">
      ${slots.map((slot, idx) => {
        const status = getOrbitSlotStatus(sec, idx);
        const hasImage = !!slot.image;
        const statusClass = status.toLowerCase().replace(/\s+/g, '-');
        const num = slot.slot || String(idx + 1).padStart(2, '0');
        return `
          <div class="orbit-slot-card ${hasImage ? 'populated' : 'empty'}" data-slot="${idx}">
            <div class="orbit-slot-header">
              <div class="orbit-slot-title-group">
                <span class="orbit-slot-badge">SLOT ${num}</span>
                <span class="orbit-slot-filename" title="${escapeHtml(slot.image || '(EMPTY SLOT)')}">
                  ${escapeHtml(slot.image ? slot.image : '(EMPTY SLOT)')}
                </span>
              </div>
              <span class="orbit-status-tag ${statusClass}">${status}</span>
            </div>

            <div class="orbit-preview-container ${hasImage ? '' : 'is-empty'}" onclick="${hasImage ? '' : `openMediaModalForOrbitSlot('${sec.id}', ${idx})`}">
              ${hasImage ? `
                <img src="${escapeHtml(slot.image)}" alt="${escapeHtml(slot.alt || '')}" class="orbit-preview-img" onerror="this.style.opacity=0.3; this.title='Image failed to load';" />
              ` : `
                <div class="orbit-empty-placeholder" title="Click to assign image to Slot ${num}">
                  <span class="empty-badge">${num}</span>
                  <span class="empty-status-text">EMPTY SLOT</span>
                  <span class="empty-subtext">Click to assign image</span>
                </div>
              `}
            </div>

            <div class="orbit-slot-actions">
              <button type="button" class="btn-orbit-action" onclick="openMediaModalForOrbitSlot('${sec.id}', ${idx})" title="Choose asset from library for Slot ${num}">
                <span>📁</span> MEDIA
              </button>
              <button type="button" class="btn-orbit-action" onclick="triggerDirectUploadForOrbit('${sec.id}', ${idx})" title="Upload image directly to Slot ${num}">
                <span>↑</span> UPLOAD
              </button>
              ${renderVisibilityButton(sec.id, `content.slots.${idx}.visible`, slot.visible !== false)}
              ${hasImage ? `
                <button type="button" class="btn-orbit-action danger" onclick="clearOrbitSlot('${sec.id}', ${idx})" title="Clear Slot ${num}">
                  <span>✕</span> CLEAR
                </button>
              ` : ''}
            </div>
            <input type="file" id="orbit-file-input-${idx}" accept="image/png,image/jpeg,image/webp,image/svg+xml" style="display: none;" onchange="handleOrbitDirectUpload(event, '${sec.id}', ${idx})">

            <div class="form-group" style="margin-top: 8px; margin-bottom: 0;">
              <label class="form-label" style="font-size: 9px;">ALT TEXT (ACCESSIBILITY)</label>
              <input type="text" class="form-input" value="${escapeHtml(slot.alt || '')}"
                     placeholder="Alt text for Slot ${num}"
                     oninput="updateOrbitSlotAlt('${sec.id}', ${idx}, this.value)">
            </div>
          </div>
        `;
      }).join('')}
    </div>

    <div class="collection-title" style="margin-top: 24px; margin-bottom: 12px; padding-top: 12px; border-top: 1px solid var(--border-subtle);">
      SPATIAL ORBIT SECTION METADATA & CONFIGURATION
    </div>

    <div class="form-group">
      <label class="form-label">SECTION METADATA LABEL</label>
      <input type="text" class="form-input" value="${escapeHtml(c.metaLabel || '')}" oninput="updateContentField('${sec.id}', 'metaLabel', this.value)">
    </div>
    <div class="form-group">
      <label class="form-label">SECTION HEADING</label>
      <input type="text" class="form-input" value="${escapeHtml(c.title || '')}" oninput="updateContentField('${sec.id}', 'title', this.value)">
    </div>
    <div class="form-group">
      <label class="form-label">SUBTITLE / DESCRIPTION</label>
      <textarea class="form-textarea" oninput="updateContentField('${sec.id}', 'subtitle', this.value)">${escapeHtml(c.subtitle || '')}</textarea>
    </div>
    <div class="form-group">
      <label class="form-label">INTERACTION HINT TEXT</label>
      <input type="text" class="form-input" value="${escapeHtml(c.hint || 'DRAG TO ROTATE ORBIT · CLICK TILE TO ENLARGE')}" oninput="updateContentField('${sec.id}', 'hint', this.value)">
    </div>
    <div class="form-group">
      <label class="form-label">ROTATION SENSITIVITY / DAMPENING</label>
      <input type="number" step="0.05" class="form-input" value="${sec.config?.dragDampening || 0.85}" oninput="updateConfigField('${sec.id}', 'dragDampening', Number(this.value))">
    </div>
    <div class="form-group">
      <label class="form-label">DISCIPLINES (COMMA-SEPARATED)</label>
      <input type="text" class="form-input" value="${escapeHtml((c.disciplines || []).join(', '))}" oninput="updateContentField('${sec.id}', 'disciplines', this.value.split(',').map(s=>s.trim()))">
    </div>
  `;
}

function triggerDirectUploadForOrbit(secId, idx) {
  const input = document.getElementById(`orbit-file-input-${idx}`);
  if (input) {
    input.value = '';
    input.click();
  }
}

async function handleOrbitDirectUpload(e, secId, idx) {
  const file = e.target.files?.[0];
  if (!file) return;

  const allowedImageTypes = new Set(['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/svg+xml']);
  const ext = '.' + file.name.split('.').pop().toLowerCase();
  const allowedExts = new Set(['.png', '.jpg', '.jpeg', '.webp', '.svg']);

  if (!allowedImageTypes.has(file.type) && !allowedExts.has(ext)) {
    showToast(`Disallowed file type "${file.name}". Visual Orbit only accepts images (PNG, JPEG, WebP, SVG).`, true);
    return;
  }

  try {
    showToast(`Uploading ${file.name}...`);
    const json = await uploadMediaWithProgress({ file });
    if (json.success && json.filename) {
      const sec = findSectionOrChild(secId);
      if (sec) {
        ensureOrbitImages(sec);
        const num = String(idx + 1).padStart(2, '0');
        sec.content.slots[idx].image = json.filename;
        sec.content.slots[idx].src = json.filename;
        if (!sec.content.slots[idx].alt) {
          sec.content.slots[idx].alt = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
        }
        sec.content.images = sec.content.slots;
        sec.content.tiles = sec.content.slots.filter(s => s.image);

        markUnsaved();
        renderPropertiesPanel(sec);
        renderCenterForm(sec);
        notifyPreview();
        showToast(`Assigned ${json.filename} to SLOT ${num}`);
      }
    } else {
      showToast(json.error || 'Upload failed', true);
    }
  } catch (err) {
    showToast('Upload error: ' + err.message, true);
  }
}

function openMediaModalForOrbitSlot(secId, idx) {
  activeMediaCallback = (filename) => {
    const ext = '.' + filename.split('.').pop().toLowerCase();
    const allowedExts = new Set(['.png', '.jpg', '.jpeg', '.webp', '.svg']);
    if (!allowedExts.has(ext)) {
      showToast(`"${filename}" is not an image. Visual Orbit requires an image asset.`, true);
      return;
    }
    const sec = findSectionOrChild(secId);
    if (sec) {
      ensureOrbitImages(sec);
      const num = String(idx + 1).padStart(2, '0');
      sec.content.slots[idx].image = filename;
      sec.content.slots[idx].src = filename;
      if (!sec.content.slots[idx].alt) {
        sec.content.slots[idx].alt = filename.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
      }
      sec.content.images = sec.content.slots;
      sec.content.tiles = sec.content.slots.filter(s => s.image);

      markUnsaved();
      renderPropertiesPanel(sec);
      renderCenterForm(sec);
      notifyPreview();
      showToast(`Applied ${filename} to SLOT ${num}`);
    }
  };
  openMediaModal();
}

function clearOrbitSlot(secId, idx) {
  const sec = findSectionOrChild(secId);
  if (!sec) return;
  ensureOrbitImages(sec);
  const num = String(idx + 1).padStart(2, '0');

  const modal = document.getElementById('confirm-modal');
  const title = document.getElementById('confirm-modal-title');
  const desc = document.getElementById('confirm-modal-desc');
  const actionBtn = document.getElementById('confirm-modal-action-btn');

  title.textContent = `CLEAR SLOT ${num}?`;
  desc.innerHTML = `Are you sure you want to remove the image from <strong>SLOT ${num}</strong>? This position will become an empty numbered placeholder tile.`;

  actionBtn.textContent = 'CLEAR SLOT';
  actionBtn.onclick = () => {
    sec.content.slots[idx].image = '';
    sec.content.slots[idx].src = '';
    sec.content.images = sec.content.slots;
    sec.content.tiles = sec.content.slots.filter(s => s.image);

    closeConfirmModal();
    markUnsaved();
    renderPropertiesPanel(sec);
    renderCenterForm(sec);
    notifyPreview();
    showToast(`SLOT ${num} asset cleared`);
  };

  modal.classList.add('active');
}

function updateOrbitSlotAlt(secId, idx, val) {
  const sec = findSectionOrChild(secId);
  if (!sec) return;
  ensureOrbitImages(sec);
  sec.content.slots[idx].alt = val;
  sec.content.images = sec.content.slots;

  markUnsaved();
  notifyPreview();

  const newStatus = getOrbitSlotStatus(sec, idx);
  const statusClass = newStatus.toLowerCase().replace(/\s+/g, '-');
  document.querySelectorAll(`.orbit-slot-card[data-slot="${idx}"] .orbit-status-tag`).forEach(tag => {
    tag.className = `orbit-status-tag ${statusClass}`;
    tag.textContent = newStatus;
  });
}

// Backward-compatibility aliases
const openMediaModalForOrbitImage = openMediaModalForOrbitSlot;
const clearOrbitImageSlot = clearOrbitSlot;
const updateOrbitImageAlt = updateOrbitSlotAlt;

function addOrbitSlot(secId) {
  const sec = findSectionOrChild(secId);
  if (!sec || !sec.content) return;
  ensureOrbitImages(sec);
  if (sec.content.slots.length >= 48) {
    showToast('Maximum 48 orbital slots reached.', true);
    return;
  }
  const nextNum = String(sec.content.slots.length + 1).padStart(2, '0');
  sec.content.slots.push({
    id: `orbit-${nextNum}`,
    slot: nextNum,
    image: '',
    src: '',
    alt: `Visual Orbit Asset ${nextNum}`,
    title: `Asset ${nextNum}`
  });
  sec.content.images = sec.content.slots;
  sec.content.tiles = sec.content.slots.filter(s => s.image);
  markUnsaved();
  renderPropertiesPanel(sec);
  showToast(`Added orbital slot orbit-${nextNum} (${sec.content.slots.length}/48 total)`);
}
window.addOrbitSlot = addOrbitSlot;

function renderExpertiseProps(sec) {
  const c = sec.content || {};
  const comps = c.companies || [];
  return `
    <div class="form-group">
      <label class="form-label">METADATA LABEL</label>
      <input type="text" class="form-input" value="${escapeHtml(c.metaLabel || '')}" oninput="updateContentField('${sec.id}', 'metaLabel', this.value)">
    </div>
    <div class="form-group">
      <label class="form-label">SECTION HEADING</label>
      <input type="text" class="form-input" value="${escapeHtml(c.title || '')}" oninput="updateContentField('${sec.id}', 'title', this.value)">
    </div>
    <div class="form-group">
      <label class="form-label">SUBTITLE / OVERVIEW</label>
      <textarea class="form-textarea" oninput="updateContentField('${sec.id}', 'subtitle', this.value)">${escapeHtml(c.subtitle || '')}</textarea>
    </div>

    <div class="collection-header">
      <span class="collection-title">CAREER TIMELINE COMPANIES (${comps.length})</span>
      <button type="button" class="btn-add-item" onclick="addCompany('${sec.id}')">+ ADD COMPANY</button>
    </div>
    ${comps.map((comp, idx) => `
      <div class="collection-card">
        <div class="collection-card-header" style="display: flex; justify-content: space-between; align-items: center;">
          <span class="collection-card-num">COMPANY 0${idx + 1} // ${escapeHtml(comp.name)}</span>
          <div style="display: flex; align-items: center; gap: 8px;">
            ${renderVisibilityButton(sec.id, `content.companies.${idx}.visible`, comp.visible !== false)}
            <button type="button" class="btn-card-del" onclick="confirmDeleteEntry('${sec.id}', 'companies', '${comp.id}', '${escapeHtml(comp.name)}')" title="Delete Company Permanently">✕</button>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">COMPANY NAME</label>
          <input type="text" class="form-input" value="${escapeHtml(comp.name)}" oninput="updateCompanyField('${sec.id}', ${idx}, 'name', this.value)">
        </div>
        <div class="form-group">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
            <label class="form-label" style="margin: 0;">COMPANY LOGO (PNG / SVG / WEBP)</label>
            ${renderVisibilityButton(sec.id, `content.companies.${idx}.showLogo`, comp.showLogo !== false, 'Logo')}
          </div>
          ${renderMediaField(sec.id, `companies.${idx}.logo`, comp.logo || '')}
        </div>
        <div class="form-group">
          <label class="form-label">ROLE TITLE</label>
          <input type="text" class="form-input" value="${escapeHtml(comp.role)}" oninput="updateCompanyField('${sec.id}', ${idx}, 'role', this.value)">
        </div>
        <div class="form-row-2">
          <div class="form-group">
            <label class="form-label">EMPLOYMENT DATES</label>
            <input type="text" class="form-input" value="${escapeHtml(comp.dates)}" oninput="updateCompanyField('${sec.id}', ${idx}, 'dates', this.value)">
          </div>
          <div class="form-group">
            <label class="form-label">LOCATION & WORK MODE</label>
            <input type="text" class="form-input" value="${escapeHtml(comp.location)}" oninput="updateCompanyField('${sec.id}', ${idx}, 'location', this.value)">
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">INTRO STATEMENT</label>
          <input type="text" class="form-input" value="${escapeHtml(comp.intro || '')}" oninput="updateCompanyField('${sec.id}', ${idx}, 'intro', this.value)">
        </div>
        <div class="form-group">
          <label class="form-label">RESPONSIBILITY BULLETS (ONE PER LINE)</label>
          <textarea class="form-textarea" style="min-height: 80px;" oninput="updateCompanyBullets('${sec.id}', ${idx}, this.value)">${escapeHtml((comp.bullets || []).join('\n'))}</textarea>
        </div>
        <div class="form-group">
          <label class="form-label">SKILLS (COMMA-SEPARATED)</label>
          <input type="text" class="form-input" value="${escapeHtml((comp.skills || []).join(', '))}" oninput="updateCompanyField('${sec.id}', ${idx}, 'skills', this.value.split(',').map(s=>s.trim()).filter(Boolean))">
        </div>
        <div class="form-group">
          <label class="form-label">TOOLS & PIPELINES (COMMA-SEPARATED)</label>
          <input type="text" class="form-input" value="${escapeHtml((comp.tools || []).join(', '))}" oninput="updateCompanyField('${sec.id}', ${idx}, 'tools', this.value.split(',').map(s=>s.trim()).filter(Boolean))">
        </div>

        <div style="margin-top: 10px; padding-top: 10px; border-top: 1px solid var(--border-subtle);">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
            <span style="font-family: 'JetBrains Mono', monospace; font-size: 10px; font-weight: 700; color: var(--text-secondary);">MEDIA SPOTLIGHT SLOTS (${(comp.mediaSlots || []).length})</span>
            <button type="button" class="btn-orbit-action" style="padding: 2px 6px; font-size: 9px;" onclick="addCompanyMediaSlot('${sec.id}', ${idx})">+ ADD MEDIA</button>
          </div>
          ${(comp.mediaSlots || []).map((m, mIdx) => `
            <div style="background: rgba(0,0,0,0.25); border: 1px solid var(--border-subtle); border-radius: 4px; padding: 8px; margin-bottom: 8px;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                <span style="font-family: 'JetBrains Mono', monospace; font-size: 9px; font-weight: 700; color: var(--crimson);">SPOTLIGHT 0${mIdx + 1}</span>
                <button type="button" class="btn-card-del" onclick="removeCompanyMediaSlot('${sec.id}', ${idx}, ${mIdx})">✕</button>
              </div>
              <div class="form-group" style="margin-bottom: 6px;">
                <label class="form-label" style="font-size: 8.5px;">SPOTLIGHT IMAGE</label>
                ${renderMediaField(sec.id, `companies.${idx}.mediaSlots.${mIdx}.image`, m.image)}
              </div>
              <div class="form-row-2">
                <div class="form-group" style="margin-bottom: 0;">
                  <label class="form-label" style="font-size: 8.5px;">TITLE</label>
                  <input type="text" class="form-input" style="font-size: 11px; padding: 4px 6px;" value="${escapeHtml(m.title || '')}" oninput="updateCompanyMediaSlot('${sec.id}', ${idx}, ${mIdx}, 'title', this.value)">
                </div>
                <div class="form-group" style="margin-bottom: 0;">
                  <label class="form-label" style="font-size: 8.5px;">META / BADGE</label>
                  <input type="text" class="form-input" style="font-size: 11px; padding: 4px 6px;" value="${escapeHtml(m.meta || '')}" oninput="updateCompanyMediaSlot('${sec.id}', ${idx}, ${mIdx}, 'meta', this.value)">
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `).join('')}
  `;
}

function addCompany(secId) {
  const sec = findSectionOrChild(secId);
  if (!sec || !sec.content) return;
  sec.content.companies.push({
    id: `exp-${Date.now()}`,
    name: 'NEW STUDIO',
    role: 'Creative Director',
    dates: '2026 – PRESENT',
    location: 'Remote',
    intro: 'Visual direction and pipeline integration:',
    bullets: ['Directed cinematic visual production and workflow engineering.'],
    skills: ['AI Direction', 'Look-Dev'],
    tools: ['ComfyUI', 'Photoshop'],
    mediaSlots: [],
    visible: true
  });
  markUnsaved();
  renderPropertiesPanel(sec);
}

function removeCompany(secId, idx) {
  const sec = findSectionOrChild(secId);
  if (!sec || !sec.content) return;
  sec.content.companies.splice(idx, 1);
  markUnsaved();
  renderPropertiesPanel(sec);
}

function updateCompanyField(secId, idx, key, val) {
  const sec = findSectionOrChild(secId);
  if (!sec || !sec.content) return;
  sec.content.companies[idx][key] = val;
  markUnsaved();
}

function updateCompanyBullets(secId, idx, text) {
  const sec = findSectionOrChild(secId);
  if (!sec || !sec.content) return;
  sec.content.companies[idx].bullets = text.split('\n').map(s => s.trim()).filter(Boolean);
  markUnsaved();
}

function addCompanyMediaSlot(secId, compIdx) {
  const sec = findSectionOrChild(secId);
  if (!sec || !sec.content) return;
  if (!Array.isArray(sec.content.companies[compIdx].mediaSlots)) {
    sec.content.companies[compIdx].mediaSlots = [];
  }
  sec.content.companies[compIdx].mediaSlots.push({
    image: 'Ramayana.png',
    title: 'FEATURE LOOK-DEV',
    meta: 'Cinematic Pipeline',
    badge: '[◈] 01 / FEATURE FILM'
  });
  markUnsaved();
  renderPropertiesPanel(sec);
}

function removeCompanyMediaSlot(secId, compIdx, slotIdx) {
  const sec = findSectionOrChild(secId);
  if (!sec || !sec.content) return;
  sec.content.companies[compIdx].mediaSlots.splice(slotIdx, 1);
  markUnsaved();
  renderPropertiesPanel(sec);
}

function updateCompanyMediaSlot(secId, compIdx, slotIdx, key, val) {
  const sec = findSectionOrChild(secId);
  if (!sec || !sec.content) return;
  sec.content.companies[compIdx].mediaSlots[slotIdx][key] = val;
  markUnsaved();
}

function renderCoreProps(sec) {
  const c = sec.content || {};
  const ftools = c.foundations || [];
  const cskills = c.creativeSkills || [];
  const stages = c.careerStages || [];

  return `
    <div class="form-group">
      <label class="form-label">META LABEL</label>
      <input type="text" class="form-input" value="${escapeHtml(c.metaLabel || '')}" oninput="updateContentField('${sec.id}', 'metaLabel', this.value)">
    </div>
    <div class="form-group">
      <label class="form-label">SECTION TITLE</label>
      <input type="text" class="form-input" value="${escapeHtml(c.title || '')}" oninput="updateContentField('${sec.id}', 'title', this.value)">
    </div>
    <div class="form-group">
      <label class="form-label">SUBTITLE</label>
      <textarea class="form-textarea" oninput="updateContentField('${sec.id}', 'subtitle', this.value)">${escapeHtml(c.subtitle || '')}</textarea>
    </div>

    <div class="collection-header" style="display: flex; justify-content: space-between; align-items: center;">
      <span class="collection-title">3D HANGING ID CARD ASSETS</span>
      ${renderVisibilityButton(sec.id, 'content.lanyardProfile.visible', c.lanyardProfile?.visible !== false, 'ID Card')}
    </div>
    <div class="form-group">
      <label class="form-label">ID FRONT IMAGE</label>
      ${renderMediaField(sec.id, 'idCard.frontImage', c.idCard?.frontImage || 'ID Front(6).png')}
    </div>
    <div class="form-group">
      <label class="form-label">ID BACK IMAGE</label>
      ${renderMediaField(sec.id, 'idCard.backImage', c.idCard?.backImage || 'ID Back(1).png')}
    </div>
    <div class="form-group">
      <label class="form-label">LANYARD STRAP / TAG IMAGE</label>
      ${renderMediaField(sec.id, 'idCard.strapImage', c.idCard?.strapImage || 'ID tag(1).png')}
    </div>
    <div class="form-group">
      <label class="form-label">DRAG INSTRUCTION PILL TEXT</label>
      <input type="text" class="form-input" value="${escapeHtml(c.idCard?.dragInstructionText || 'TAP & DRAG THE ID')}" oninput="updateContentField('${sec.id}', 'idCard.dragInstructionText', this.value)">
    </div>

    <div class="collection-header">
      <span class="collection-title">01 / FOUNDATIONS TOOLS (${ftools.length})</span>
      <button type="button" class="btn-add-item" onclick="addFoundationTool('${sec.id}')">+ ADD TOOL</button>
    </div>
    ${ftools.map((tool, idx) => `
      <div class="collection-card">
        <div class="collection-card-header" style="display: flex; justify-content: space-between; align-items: center;">
          <span class="collection-card-num">TOOL 0${idx + 1} // ${escapeHtml(tool.name)}</span>
          <div style="display: flex; align-items: center; gap: 8px;">
            ${renderVisibilityButton(sec.id, `content.foundations.${idx}.visible`, tool.visible !== false)}
            <button type="button" class="btn-card-del" onclick="confirmDeleteEntry('${sec.id}', 'foundations', '${tool.id}', '${escapeHtml(tool.name)}')" title="Delete Tool Permanently">✕</button>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">TOOL NAME</label>
          <input type="text" class="form-input" value="${escapeHtml(tool.name)}" oninput="updateFoundationTool('${sec.id}', ${idx}, 'name', this.value)">
        </div>
        <div class="form-group">
          <label class="form-label">DESCRIPTION</label>
          <input type="text" class="form-input" value="${escapeHtml(tool.desc)}" oninput="updateFoundationTool('${sec.id}', ${idx}, 'desc', this.value)">
        </div>
        <div class="form-group">
          <label class="form-label">LOGO IMAGE</label>
          ${renderMediaField(sec.id, `foundations.${idx}.logo`, tool.logo)}
        </div>
      </div>
    `).join('')}

    <div class="collection-header" style="margin-top: 24px;">
      <span class="collection-title">02 / CREATIVE SKILLS GROUPS (${cskills.length})</span>
    </div>
    ${cskills.map((cs, idx) => `
      <div class="collection-card">
        <div class="collection-card-header">
          <span class="collection-card-num">SKILL GROUP 0${idx + 1} // ${escapeHtml(cs.title)}</span>
        </div>
        <div class="form-row-2">
          <div class="form-group">
            <label class="form-label">CATEGORY TITLE</label>
            <input type="text" class="form-input" value="${escapeHtml(cs.title)}" oninput="updateCreativeSkillGroup('${sec.id}', ${idx}, 'title', this.value)">
          </div>
          <div class="form-group">
            <label class="form-label">COUNT BADGE</label>
            <input type="text" class="form-input" value="${escapeHtml(cs.count || '04')}" oninput="updateCreativeSkillGroup('${sec.id}', ${idx}, 'count', this.value)">
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">CAPABILITIES (COMMA-SEPARATED)</label>
          <input type="text" class="form-input" value="${escapeHtml((cs.capabilities || []).join(', '))}" oninput="updateCreativeSkillGroup('${sec.id}', ${idx}, 'capabilities', this.value.split(',').map(s=>s.trim()).filter(Boolean))">
        </div>
      </div>
    `).join('')}

    <div class="collection-header" style="margin-top: 24px;">
      <span class="collection-title">03 / CAREER JOURNEY STAGES (${stages.length})</span>
    </div>
    ${stages.map((stage, idx) => `
      <div class="collection-card">
        <div class="collection-card-header">
          <span class="collection-card-num">STEP ${escapeHtml(stage.step || ('0' + (idx + 1)))} // ${escapeHtml(stage.label)}</span>
        </div>
        <div class="form-row-2">
          <div class="form-group">
            <label class="form-label">STAGE LABEL</label>
            <input type="text" class="form-input" value="${escapeHtml(stage.label)}" oninput="updateCareerStage('${sec.id}', ${idx}, 'label', this.value)">
          </div>
          <div class="form-group">
            <label class="form-label">SUBTITLE</label>
            <input type="text" class="form-input" value="${escapeHtml(stage.sub || '')}" oninput="updateCareerStage('${sec.id}', ${idx}, 'sub', this.value)">
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">DESCRIPTION</label>
          <textarea class="form-textarea" oninput="updateCareerStage('${sec.id}', ${idx}, 'desc', this.value)">${escapeHtml(stage.desc || '')}</textarea>
        </div>
      </div>
    `).join('')}
  `;
}

function addFoundationTool(secId) {
  const sec = findSectionOrChild(secId);
  if (!sec || !sec.content) return;
  if (!Array.isArray(sec.content.foundations)) sec.content.foundations = [];
  sec.content.foundations.push({
    id: `f-${Date.now()}`,
    name: 'New Tool',
    desc: 'Pipeline Integration',
    logo: 'logo-comfyui.png'
  });
  markUnsaved();
  renderPropertiesPanel(sec);
}

function removeFoundationTool(secId, idx) {
  const sec = findSectionOrChild(secId);
  if (!sec || !sec.content) return;
  sec.content.foundations.splice(idx, 1);
  markUnsaved();
  renderPropertiesPanel(sec);
}

function updateFoundationTool(secId, idx, key, val) {
  const sec = findSectionOrChild(secId);
  if (!sec || !sec.content) return;
  sec.content.foundations[idx][key] = val;
  markUnsaved();
}

function updateCreativeSkillGroup(secId, idx, key, val) {
  const sec = findSectionOrChild(secId);
  if (!sec || !sec.content || !sec.content.creativeSkills) return;
  sec.content.creativeSkills[idx][key] = val;
  markUnsaved();
}

function updateCareerStage(secId, idx, key, val) {
  const sec = findSectionOrChild(secId);
  if (!sec || !sec.content || !sec.content.careerStages) return;
  sec.content.careerStages[idx][key] = val;
  markUnsaved();
}

// STRICT REQUIREMENT: HOBBIES SUBSECTION PROPERTIES
// -------------------------------------------------------------
// HOBBIES 12 UNIQUE SLOTS MANAGEMENT (ElasticReel)
// -------------------------------------------------------------
function ensureHobbiesSlots(sec) {
  if (!sec.content) sec.content = {};
  const currentSlots = Array.isArray(sec.content.slots) && sec.content.slots.length === 12
    ? sec.content.slots
    : (Array.isArray(sec.content.items) ? sec.content.items : (Array.isArray(sec.content.cards) ? sec.content.cards : []));

  sec.content.slots = Array.from({ length: 12 }, (_, idx) => {
    const num = String(idx + 1).padStart(2, '0');
    const stableId = `hobby-${num}`;
    const raw = currentSlots[idx] || currentSlots.find?.(s => s && (s.id === stableId || s.slot === num || s.slotNumber === num)) || null;

    let image = '';
    let alt = '';
    let title = `Hobby ${num}`;
    let subtitle = '';

    if (typeof raw === 'string') {
      image = raw.trim();
      alt = image ? `Hobby ${num}` : '';
    } else if (raw && typeof raw === 'object') {
      image = (raw.image || raw.src || '').trim();
      alt = raw.alt || '';
      title = raw.title || `Hobby ${num}`;
      subtitle = raw.subtitle || '';
    }

    return {
      id: stableId,
      slot: num,
      slotNumber: num,
      image: image,
      src: image,
      alt: alt,
      title: title,
      subtitle: subtitle,
      visible: (raw && raw.visible !== undefined) ? (raw.visible !== false) : true
    };
  });

  sec.content.items = sec.content.slots;
}

function getHobbySlotStatus(sec, idx) {
  const currentSlot = sec.content?.slots?.[idx];
  if (!currentSlot || !currentSlot.image) return 'EMPTY';

  const origSec = publishedData?.sections?.find(s => s.id === 'sec-core')?.children?.find(ch => ch.type === 'hobbies');
  const origSlot = origSec?.content?.slots?.[idx] || origSec?.content?.items?.[idx];

  if (!origSlot || !origSlot.image) return 'DRAFT-NEW';
  if (origSlot.image !== currentSlot.image || origSlot.alt !== currentSlot.alt || origSlot.title !== currentSlot.title || origSlot.subtitle !== currentSlot.subtitle || origSlot.visible !== currentSlot.visible) {
    return 'DRAFT-EDITED';
  }
  return 'PUBLISHED';
}

function renderHobbiesProps(sec) {
  ensureHobbiesSlots(sec);
  const c = sec.content || {};
  const slots = c.slots || [];
  const populatedCount = slots.filter(s => s.image).length;
  const emptyCount = 12 - populatedCount;
  const visibleCount = slots.filter(s => s.visible !== false).length;
  const hiddenCount = 12 - visibleCount;

  return `
    <div style="background: rgba(255, 48, 56, 0.08); border: 1px solid rgba(255, 48, 56, 0.25); border-radius: 6px; padding: 10px; margin-bottom: 16px;">
      <div style="font-family: 'JetBrains Mono', monospace; font-size: 10px; font-weight: 700; color: var(--crimson);">
        ↳ NESTED CHILD OF THE CORE
      </div>
      <div style="font-size: 11px; color: var(--text-secondary); margin-top: 2px;">
        Follows directly beneath The Core profile card with compact, intentional spacing.
      </div>
    </div>

    <div class="form-group">
      <label class="form-label">SECTION TITLE</label>
      <input type="text" class="form-input" value="${escapeHtml(c.title || 'OFF THE CLOCK')}" oninput="updateContentField('${sec.id}', 'title', this.value)">
    </div>
    <div class="form-group">
      <label class="form-label">TAGLINE</label>
      <input type="text" class="form-input" value="${escapeHtml(c.subtitle || 'Beyond the work. Into the worlds that shape me.')}" oninput="updateContentField('${sec.id}', 'subtitle', this.value)">
    </div>
    <div class="form-group">
      <label class="form-label">META LABEL</label>
      <input type="text" class="form-input" value="${escapeHtml(c.metaLabel || 'OFF THE CLOCK // 06 · PERSONAL ARCHIVE')}" oninput="updateContentField('${sec.id}', 'metaLabel', this.value)">
    </div>

    <div class="orbit-panel-header">
      <h4 class="orbit-panel-title">OFF THE CLOCK — 12 UNIQUE SLOTS (ELASTIC REEL)</h4>
      <p class="orbit-panel-subtitle">Manage 12 independently addressable image slots. Toggle individual panel visibility on the public portfolio without deleting records.</p>
      <div style="display: flex; gap: 8px; flex-wrap: wrap; margin-top: 10px;">
        <div class="orbit-sphere-meta">
          <span>[◈]</span>
          <span>12 CONFIGURED ARCHIVE SLOTS (hobby-01 — hobby-12)</span>
        </div>
        <div class="orbit-sphere-meta" style="background: rgba(74, 222, 128, 0.08); border-color: rgba(74, 222, 128, 0.3); color: #4ade80;">
          <span>👁</span>
          <span>${visibleCount} VISIBLE ON PORTFOLIO · ${hiddenCount} HIDDEN</span>
        </div>
        <div class="orbit-sphere-meta" style="background: rgba(255, 255, 255, 0.05); border-color: rgba(255, 255, 255, 0.15);">
          <span>✓</span>
          <span>${populatedCount} POPULATED · ${emptyCount} EMPTY</span>
        </div>
      </div>
    </div>

    <div class="collection-title" style="margin-top: 14px; margin-bottom: 8px;">
      12 INDIVIDUAL ARCHIVE SLOTS (hobby-01 — hobby-12)
    </div>

    <div class="orbit-slots-grid">
      ${slots.map((slot, idx) => {
        const status = getHobbySlotStatus(sec, idx);
        const hasImage = !!slot.image;
        const isVisible = slot.visible !== false;
        const statusClass = status.toLowerCase().replace(/\s+/g, '-');
        const num = slot.slot || String(idx + 1).padStart(2, '0');
        return `
          <div class="orbit-slot-card ${hasImage ? 'populated' : 'empty'} ${isVisible ? 'is-visible' : 'is-hidden'}" data-hobby-slot="${idx}" data-slot-id="${slot.id}" style="${isVisible ? '' : 'opacity: 0.85; border-style: dashed;'}">
            <div class="orbit-slot-header" style="display: flex; justify-content: space-between; align-items: center;">
              <div class="orbit-slot-title-group" style="display: flex; align-items: center; gap: 6px;">
                <span class="orbit-slot-badge">SLOT ${num}</span>
                <span style="font-size: 11px; opacity: 0.8; font-family: 'JetBrains Mono', monospace;">[${slot.id}]</span>
                <span class="orbit-slot-filename" title="${escapeHtml(slot.image || '(EMPTY SLOT)')}">
                  ${escapeHtml(slot.image ? slot.image : '(EMPTY SLOT)')}
                </span>
              </div>
              <span class="orbit-status-tag ${statusClass}">${status}</span>
            </div>

            <!-- Prominent Individual Visibility Toggle Control (Phase 2) -->
            <div class="hobby-visibility-control" style="margin: 8px 0 10px 0;">
              <button type="button"
                      class="btn-hobby-visibility ${isVisible ? 'is-visible' : 'is-hidden'}"
                      onclick="toggleHobbySlotVisibility('${sec.id}', ${idx})"
                      title="${isVisible ? 'Click to hide this panel on portfolio' : 'Click to display this panel on portfolio'}"
                      aria-label="${isVisible ? `Hide Slot ${num} on portfolio` : `Show Slot ${num} on portfolio`}"
                      style="width: 100%; display: flex; align-items: center; justify-content: space-between; padding: 7px 10px; border-radius: 6px; font-family: 'JetBrains Mono', monospace; font-size: 11px; font-weight: 600; cursor: pointer; transition: all 0.2s ease; ${isVisible ? 'background: rgba(34, 197, 94, 0.12); border: 1px solid rgba(34, 197, 94, 0.45); color: #4ade80;' : 'background: rgba(239, 68, 68, 0.12); border: 1px solid rgba(239, 68, 68, 0.4); color: #f87171;'};">
                <span style="display: flex; align-items: center; gap: 6px;">
                  <span style="font-size: 13px;">${isVisible ? '👁' : '👁‍🗨'}</span>
                  <span>${isVisible ? 'VISIBLE ON PORTFOLIO' : 'HIDDEN ON PORTFOLIO'}</span>
                </span>
                <span style="font-size: 10px; opacity: 0.85; text-decoration: underline;">
                  ${isVisible ? 'CLICK TO HIDE' : 'CLICK TO SHOW'}
                </span>
              </button>
            </div>

            <div class="orbit-preview-container ${hasImage ? '' : 'is-empty'}" onclick="${hasImage ? '' : `openMediaModalForHobbySlot('${sec.id}', ${idx})`}">
              ${hasImage ? `
                <img src="${escapeHtml(slot.image)}" alt="${escapeHtml(slot.alt || '')}" class="orbit-preview-img" onerror="this.style.opacity=0.3; this.title='Image failed to load';" />
              ` : `
                <div class="orbit-empty-placeholder" title="Click to assign image to Slot ${num}">
                  <span class="empty-badge">${num}</span>
                  <span class="empty-status-text">EMPTY SLOT</span>
                  <span class="empty-subtext">Click to assign image</span>
                </div>
              `}
            </div>

            <div class="orbit-slot-actions">
              <button type="button" class="btn-orbit-action" onclick="openMediaModalForHobbySlot('${sec.id}', ${idx})" title="Choose asset from library for Slot ${num}">
                <span>📁</span> MEDIA
              </button>
              <button type="button" class="btn-orbit-action" onclick="triggerDirectUploadForHobby('${sec.id}', ${idx})" title="Upload image directly to Slot ${num}">
                <span>↑</span> UPLOAD
              </button>
              ${hasImage ? `
                <button type="button" class="btn-orbit-action danger" onclick="clearHobbySlot('${sec.id}', ${idx})" title="Clear Slot ${num}">
                  <span>✕</span> CLEAR
                </button>
              ` : ''}
            </div>
            <input type="file" id="hobby-file-input-${idx}" accept="image/png,image/jpeg,image/webp,image/svg+xml" style="display: none;" onchange="handleHobbyDirectUpload(event, '${sec.id}', ${idx})">

            <div class="form-group" style="margin-top: 8px; margin-bottom: 4px;">
              <label class="form-label" style="font-size: 9px;">TITLE</label>
              <input type="text" class="form-input" value="${escapeHtml(slot.title || `Hobby ${num}`)}"
                     placeholder="Title for Slot ${num}"
                     oninput="updateHobbySlotField('${sec.id}', ${idx}, 'title', this.value)">
            </div>
            <div class="form-group" style="margin-bottom: 4px;">
              <label class="form-label" style="font-size: 9px;">SUBTITLE / CAPTION</label>
              <input type="text" class="form-input" value="${escapeHtml(slot.subtitle || '')}"
                     placeholder="Subtitle for Slot ${num}"
                     oninput="updateHobbySlotField('${sec.id}', ${idx}, 'subtitle', this.value)">
            </div>
            <div class="form-group" style="margin-bottom: 0;">
              <label class="form-label" style="font-size: 9px;">ALT TEXT (ACCESSIBILITY)</label>
              <input type="text" class="form-input" value="${escapeHtml(slot.alt || '')}"
                     placeholder="Alt text for Slot ${num}"
                     oninput="updateHobbySlotField('${sec.id}', ${idx}, 'alt', this.value)">
            </div>
          </div>
        `;
      }).join('')}
    </div>

    <div class="collection-title" style="margin-top: 24px; margin-bottom: 12px; padding-top: 12px; border-top: 1px solid var(--border-subtle);">
      HOBBIES SECTION METADATA
    </div>

    <div class="form-group">
      <label class="form-label">METADATA EYEBROW</label>
      <input type="text" class="form-input" value="${escapeHtml(c.metaLabel || '')}" oninput="updateContentField('${sec.id}', 'metaLabel', this.value)">
    </div>
    <div class="form-group">
      <label class="form-label">HEADING</label>
      <input type="text" class="form-input" value="${escapeHtml(c.title || '')}" oninput="updateContentField('${sec.id}', 'title', this.value)">
    </div>
    <div class="form-group">
      <label class="form-label">SUBTITLE (EDITORIAL SUB-TAG)</label>
      <input type="text" class="form-input" value="${escapeHtml(c.subtitle || '[ A little art. A lot of adventure ]')}" oninput="updateContentField('${sec.id}', 'subtitle', this.value)">
    </div>
  `;
}

function openMediaModalForHobbySlot(secId, idx) {
  activeMediaCallback = (filename) => {
    const ext = '.' + filename.split('.').pop().toLowerCase();
    const allowedExts = new Set(['.png', '.jpg', '.jpeg', '.webp', '.svg']);
    if (!allowedExts.has(ext)) {
      showToast(`"${filename}" is not an image. Hobbies requires an image asset.`, true);
      return;
    }
    const sec = findSectionOrChild(secId);
    if (sec) {
      ensureHobbiesSlots(sec);
      const num = String(idx + 1).padStart(2, '0');
      sec.content.slots[idx].image = filename;
      sec.content.slots[idx].src = filename;
      if (!sec.content.slots[idx].alt) {
        sec.content.slots[idx].alt = filename.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
      }
      sec.content.items = sec.content.slots;

      markUnsaved();
      renderPropertiesPanel(sec);
      renderCenterForm(sec);
      notifyPreview();
      showToast(`Applied ${filename} to Hobbies SLOT ${num}`);
    }
  };
  openMediaModal();
}

function triggerDirectUploadForHobby(secId, idx) {
  const input = document.getElementById(`hobby-file-input-${idx}`);
  if (input) input.click();
}

async function handleHobbyDirectUpload(event, secId, idx) {
  const file = event.target.files?.[0];
  if (!file) return;

  const num = String(idx + 1).padStart(2, '0');
  const allowed = ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'];
  if (!allowed.includes(file.type)) {
    showToast('Invalid file format. Please upload a PNG, JPEG, WebP, or SVG image.', true);
    return;
  }

  try {
    showToast(`Uploading ${file.name}...`);
    const data = await uploadMediaWithProgress({ file });
    if (data.success && data.filename) {
      const sec = findSectionOrChild(secId);
      if (sec) {
        ensureHobbiesSlots(sec);
        sec.content.slots[idx].image = data.filename;
        sec.content.slots[idx].src = data.filename;
        if (!sec.content.slots[idx].alt) {
          sec.content.slots[idx].alt = data.filename.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
        }
        sec.content.items = sec.content.slots;

        markUnsaved();
        renderPropertiesPanel(sec);
        renderCenterForm(sec);
        notifyPreview();
        showToast(`Directly uploaded and assigned ${data.filename} to Hobbies SLOT ${num}!`);
      }
    } else {
      showToast('Upload failed: ' + (data.error || 'Unknown error'), true);
    }
  } catch (err) {
    showToast('Upload error: ' + err.message, true);
  }
}

function clearHobbySlot(secId, idx) {
  const sec = findSectionOrChild(secId);
  if (!sec) return;
  ensureHobbiesSlots(sec);
  const num = String(idx + 1).padStart(2, '0');

  const modal = document.getElementById('confirm-modal');
  const title = document.getElementById('confirm-modal-title');
  const desc = document.getElementById('confirm-modal-desc');
  const actionBtn = document.getElementById('confirm-modal-action-btn');

  title.textContent = `CLEAR HOBBY SLOT ${num}?`;
  desc.innerHTML = `Are you sure you want to remove the image from <strong>Hobbies SLOT ${num}</strong>? This position will become an empty placeholder slat.`;

  actionBtn.textContent = 'CLEAR SLOT';
  actionBtn.onclick = () => {
    sec.content.slots[idx].image = '';
    sec.content.slots[idx].src = '';
    sec.content.items = sec.content.slots;

    closeConfirmModal();
    markUnsaved();
    renderPropertiesPanel(sec);
    renderCenterForm(sec);
    notifyPreview();
    showToast(`Hobbies SLOT ${num} asset cleared`);
  };

  modal.classList.add('active');
}

function updateHobbySlotField(secId, idx, field, val) {
  const sec = findSectionOrChild(secId);
  if (!sec) return;
  ensureHobbiesSlots(sec);
  sec.content.slots[idx][field] = val;
  sec.content.items = sec.content.slots;

  markUnsaved();
  notifyPreview();

  const newStatus = getHobbySlotStatus(sec, idx);
  const statusClass = newStatus.toLowerCase().replace(/\s+/g, '-');
  document.querySelectorAll(`.orbit-slot-card[data-hobby-slot="${idx}"] .orbit-status-tag`).forEach(tag => {
    tag.className = `orbit-status-tag ${statusClass}`;
    tag.textContent = newStatus;
  });
}

function toggleHobbySlotVisibility(secId, idx) {
  const sec = findSectionOrChild(secId);
  if (!sec) return;
  ensureHobbiesSlots(sec);

  const currentVisible = sec.content.slots[idx].visible !== false;
  if (currentVisible) {
    const visibleCount = sec.content.slots.filter(s => s.visible !== false).length;
    if (visibleCount <= 1) {
      showToast('At least one archive panel must remain visible. To hide the entire section, use the section visibility toggle.', true);
      return;
    }
  }

  sec.content.slots[idx].visible = !currentVisible;
  sec.content.items = sec.content.slots;

  markUnsaved();
  renderPropertiesPanel(sec);
  renderCenterForm(sec);
  notifyPreview();

  const num = String(idx + 1).padStart(2, '0');
  const newStatus = sec.content.slots[idx].visible ? 'VISIBLE' : 'HIDDEN';
  showToast(`Hobbies Slot ${num} is now ${newStatus} on portfolio`);
}
window.toggleHobbySlotVisibility = toggleHobbySlotVisibility;

function renderCTAProps(sec) {
  const c = sec.content || {};
  return `
    <div class="form-group">
      <label class="form-label">EYEBROW</label>
      <input type="text" class="form-input" value="${escapeHtml(c.eyebrow || '')}" oninput="updateContentField('${sec.id}', 'eyebrow', this.value)">
    </div>
    <div class="form-group">
      <label class="form-label">HEADLINE LINE 1</label>
      <input type="text" class="form-input" value="${escapeHtml(c.headlineLine1 || '')}" oninput="updateContentField('${sec.id}', 'headlineLine1', this.value)">
    </div>
    <div class="form-group">
      <label class="form-label">HEADLINE LINE 2</label>
      <input type="text" class="form-input" value="${escapeHtml(c.headlineLine2 || '')}" oninput="updateContentField('${sec.id}', 'headlineLine2', this.value)">
    </div>
    <div class="form-group">
      <label class="form-label">SUPPORTING STATEMENT</label>
      <textarea class="form-textarea" oninput="updateContentField('${sec.id}', 'statement', this.value)">${escapeHtml(c.statement || '')}</textarea>
    </div>

    <div class="collection-header">
      <span class="collection-title">CONTACT ACTIONS</span>
    </div>
    <div class="collection-card">
      <div class="collection-card-header" style="display: flex; justify-content: space-between; align-items: center;">
        <span class="collection-card-num">PRIMARY EMAIL ACTION (LET'S CONNECT)</span>
        ${renderVisibilityButton(sec.id, 'content.primaryButton.visible', c.primaryButton?.visible !== false, 'Email Btn')}
      </div>
      <div class="form-group">
        <label class="form-label">BUTTON LABEL</label>
        <input type="text" class="form-input" value="${escapeHtml(c.primaryButton?.label || "LET'S CONNECT")}" oninput="updateContentField('${sec.id}', 'primaryButton.label', this.value)">
      </div>
      <div class="form-group">
        <label class="form-label">DESTINATION URL (GMAIL COMPOSE)</label>
        <input type="text" class="form-input" value="${escapeHtml(c.primaryButton?.url || '')}" oninput="updateContentField('${sec.id}', 'primaryButton.url', this.value)">
        <div class="form-hint">Prefills meet2krishnan@gmail.com with subject Let's Build Something Together.</div>
      </div>
    </div>

    <div class="collection-card">
      <div class="collection-card-header" style="display: flex; justify-content: space-between; align-items: center;">
        <span class="collection-card-num">WHATSAPP ACTION</span>
        ${renderVisibilityButton(sec.id, 'content.whatsappButton.visible', c.whatsappButton?.visible !== false, 'WhatsApp Btn')}
      </div>
      <div class="form-group">
        <label class="form-label">BUTTON LABEL</label>
        <input type="text" class="form-input" value="${escapeHtml(c.whatsappButton?.label || 'WHATSAPP')}" oninput="updateContentField('${sec.id}', 'whatsappButton.label', this.value)">
      </div>
      <div class="form-group">
        <label class="form-label">WHATSAPP URL</label>
        <input type="text" class="form-input" value="${escapeHtml(c.whatsappButton?.url || '')}" oninput="updateContentField('${sec.id}', 'whatsappButton.url', this.value)">
      </div>
    </div>

    <div class="collection-card">
      <div class="collection-card-header" style="display: flex; justify-content: space-between; align-items: center;">
        <span class="collection-card-num">LINKEDIN ACTION</span>
        ${renderVisibilityButton(sec.id, 'content.linkedinButton.visible', c.linkedinButton?.visible !== false, 'LinkedIn Btn')}
      </div>
      <div class="form-group">
        <label class="form-label">BUTTON LABEL</label>
        <input type="text" class="form-input" value="${escapeHtml(c.linkedinButton?.label || 'LINKEDIN')}" oninput="updateContentField('${sec.id}', 'linkedinButton.label', this.value)">
      </div>
      <div class="form-group">
        <label class="form-label">LINKEDIN URL</label>
        <input type="text" class="form-input" value="${escapeHtml(c.linkedinButton?.url || '')}" oninput="updateContentField('${sec.id}', 'linkedinButton.url', this.value)">
      </div>
    </div>
  `;
}

function renderCardGridProps(sec) {
  const c = sec.content || {};
  const items = c.items || [];
  return `
    <div class="form-group">
      <label class="form-label">METADATA BADGE</label>
      <input type="text" class="form-input" value="${escapeHtml(c.metaLabel || '')}" oninput="updateContentField('${sec.id}', 'metaLabel', this.value)">
    </div>
    <div class="form-group">
      <label class="form-label">SECTION HEADING</label>
      <input type="text" class="form-input" value="${escapeHtml(c.title || '')}" oninput="updateContentField('${sec.id}', 'title', this.value)">
    </div>
    <div class="form-group">
      <label class="form-label">SUBTITLE</label>
      <textarea class="form-textarea" oninput="updateContentField('${sec.id}', 'subtitle', this.value)">${escapeHtml(c.subtitle || '')}</textarea>
    </div>
    <div class="collection-header">
      <span class="collection-title">SHOWCASE CARDS (${items.length})</span>
      <button type="button" class="btn-add-item" onclick="addCardGridItem('${sec.id}')">+ ADD CARD</button>
    </div>
    ${items.map((item, idx) => `
      <div class="collection-card">
        <div class="collection-card-header">
          <span class="collection-card-num">CARD 0${idx + 1} // ${escapeHtml(item.title || '')}</span>
          <button type="button" class="btn-card-del" onclick="removeCardGridItem('${sec.id}', ${idx})">✕</button>
        </div>
        <div class="form-group">
          <label class="form-label">TITLE</label>
          <input type="text" class="form-input" value="${escapeHtml(item.title || '')}" oninput="updateCardGridItem('${sec.id}', ${idx}, 'title', this.value)">
        </div>
        <div class="form-group">
          <label class="form-label">BADGE</label>
          <input type="text" class="form-input" value="${escapeHtml(item.badge || '')}" oninput="updateCardGridItem('${sec.id}', ${idx}, 'badge', this.value)">
        </div>
        <div class="form-group">
          <label class="form-label">DESCRIPTION</label>
          <textarea class="form-textarea" oninput="updateCardGridItem('${sec.id}', ${idx}, 'description', this.value)">${escapeHtml(item.description || item.desc || '')}</textarea>
        </div>
        <div class="form-group">
          <label class="form-label">IMAGE ASSET</label>
          ${renderMediaField(sec.id, `items.${idx}.image`, item.image || '')}
        </div>
      </div>
    `).join('')}
  `;
}

function addCardGridItem(secId) {
  const sec = findSectionOrChild(secId);
  if (!sec || !sec.content) return;
  if (!Array.isArray(sec.content.items)) sec.content.items = [];
  sec.content.items.push({
    id: `item-${Date.now()}`,
    title: 'New Showcase Card',
    badge: '[◈] 2026',
    description: 'Visual development & cinematic shot look-dev.',
    image: 'dune-dneg.jpg'
  });
  markUnsaved();
  renderPropertiesPanel(sec);
  notifyPreview();
}

function removeCardGridItem(secId, idx) {
  const sec = findSectionOrChild(secId);
  if (!sec || !sec.content || !sec.content.items) return;
  sec.content.items.splice(idx, 1);
  markUnsaved();
  renderPropertiesPanel(sec);
  notifyPreview();
}

function updateCardGridItem(secId, idx, key, val) {
  const sec = findSectionOrChild(secId);
  if (!sec || !sec.content || !sec.content.items) return;
  sec.content.items[idx][key] = val;
  markUnsaved();
  notifyPreview();
}

function renderTextMediaProps(sec) {
  const c = sec.content || {};
  return `
    <div class="form-group">
      <label class="form-label">HEADLINE</label>
      <input type="text" class="form-input" value="${escapeHtml(c.headline || c.title || '')}" oninput="updateContentField('${sec.id}', 'headline', this.value); updateContentField('${sec.id}', 'title', this.value);">
    </div>
    <div class="form-group">
      <label class="form-label">PARAGRAPH CONTENT</label>
      <textarea class="form-textarea" style="height: 120px;" oninput="updateContentField('${sec.id}', 'paragraphs.0', this.value)">${escapeHtml((c.paragraphs && c.paragraphs[0]) || c.description || '')}</textarea>
    </div>
    <div class="form-group">
      <label class="form-label">FEATURED MEDIA IMAGE</label>
      ${renderMediaField(sec.id, 'mediaImage', c.mediaImage || '')}
    </div>
    <div class="form-group">
      <label class="form-label">MEDIA CAPTION</label>
      <input type="text" class="form-input" value="${escapeHtml(c.mediaCaption || '')}" oninput="updateContentField('${sec.id}', 'mediaCaption', this.value)">
    </div>
  `;
}

function renderEditorialProps(sec) {
  const c = sec.content || {};
  return `
    <div class="form-group">
      <label class="form-label">EDITORIAL HEADLINE</label>
      <input type="text" class="form-input" value="${escapeHtml(c.headline || c.title || '')}" oninput="updateContentField('${sec.id}', 'headline', this.value)">
    </div>
    <div class="form-group">
      <label class="form-label">PULL QUOTE</label>
      <textarea class="form-textarea" oninput="updateContentField('${sec.id}', 'pullQuote', this.value)">${escapeHtml(c.pullQuote || '')}</textarea>
    </div>
    <div class="form-group">
      <label class="form-label">BODY TEXT</label>
      <textarea class="form-textarea" style="height: 140px;" oninput="updateContentField('${sec.id}', 'bodyText', this.value)">${escapeHtml(c.bodyText || '')}</textarea>
    </div>
  `;
}

function renderVideoShowcaseProps(sec) {
  const c = sec.content || {};
  return `
    <div class="form-group">
      <label class="form-label">VIDEO TITLE</label>
      <input type="text" class="form-input" value="${escapeHtml(c.videoTitle || c.title || '')}" oninput="updateContentField('${sec.id}', 'videoTitle', this.value)">
    </div>
    <div class="form-group">
      <label class="form-label">VIDEO FILE PATH / URL</label>
      <input type="text" class="form-input" value="${escapeHtml(c.videoUrl || '')}" oninput="updateContentField('${sec.id}', 'videoUrl', this.value)">
    </div>
    <div class="form-group">
      <label class="form-label">POSTER IMAGE</label>
      ${renderMediaField(sec.id, 'poster', c.poster || '')}
    </div>
  `;
}

function renderGenericProps(sec) {
  return `
    <div class="form-group">
      <label class="form-label">RAW JSON CONTENT</label>
      <textarea class="form-textarea" style="height: 240px; font-family: monospace; font-size: 11px;" onchange="try { sec.content = JSON.parse(this.value); markUnsaved(); } catch(e){ alert('Invalid JSON'); }">${escapeHtml(JSON.stringify(sec.content || {}, null, 2))}</textarea>
    </div>
  `;
}

// -------------------------------------------------------------
// 5. MEDIA FIELD & MEDIA LIBRARY MODAL (10 GB LARGE VIDEO ARCHITECTURE)
// -------------------------------------------------------------
const MAX_VIDEO_BYTES = 10000000000; // Exactly 10 GB (10,000,000,000 bytes)
const MAX_IMAGE_BYTES = 50 * 1024 * 1024; // 50 MB for images
const MAX_AUDIO_BYTES = 100 * 1024 * 1024; // 100 MB for audio
const ALLOWED_VIDEO_EXTS = new Set(['.mp4', '.webm']);
const ALLOWED_IMAGE_EXTS = new Set(['.png', '.jpg', '.jpeg', '.webp', '.svg', '.pdf']);
const ALLOWED_AUDIO_EXTS = new Set(['.mp3', '.mpeg', '.wav', '.ogg', '.m4a']);

const activeUploadControllers = new Map(); // key -> { controller, sessionId }

function formatBytes(bytes, decimals = 1) {
  if (!bytes || bytes <= 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

async function uploadMediaWithProgress({ file, onProgress, onStatusChange, abortSignal, onSessionCreated }) {
  if (!file) throw new Error('No file selected.');

  const ext = '.' + file.name.split('.').pop().toLowerCase();
  const isVideo = ALLOWED_VIDEO_EXTS.has(ext);
  const isImage = ALLOWED_IMAGE_EXTS.has(ext);
  const isAudio = ALLOWED_AUDIO_EXTS.has(ext);

  if (!isVideo && !isImage && !isAudio) {
    throw new Error(`Unsupported file type "${ext}". Permitted formats: MP4, WebM (video); PNG, JPG, WEBP, SVG, PDF (image); MPEG, MP3, WAV, OGG (audio).`);
  }

  if (file.size <= 0) {
    throw new Error('Invalid file: File is empty (0 bytes).');
  }

  if (isVideo && file.size > MAX_VIDEO_BYTES) {
    throw new Error(`File size (${formatBytes(file.size)}) exceeds maximum permitted video limit of 10 GB (10,000,000,000 bytes).`);
  }

  if (isImage && file.size > MAX_IMAGE_BYTES) {
    throw new Error(`Image size (${formatBytes(file.size)}) exceeds maximum permitted image limit of 50 MB.`);
  }

  if (isAudio && file.size > MAX_AUDIO_BYTES) {
    throw new Error(`Audio size (${formatBytes(file.size)}) exceeds maximum permitted audio limit of 100 MB.`);
  }

  if (onStatusChange) onStatusChange('Initializing upload session...');

  const headers = { 'Content-Type': 'application/json' };
  if (authToken) headers['Authorization'] = `Bearer ${authToken}`;

  // 1. Initialize upload session
  const initRes = await fetch('/api/media/upload/init', {
    method: 'POST',
    headers,
    signal: abortSignal,
    body: JSON.stringify({
      filename: file.name,
      fileSize: file.size,
      fileType: file.type || (isVideo ? 'video/mp4' : 'application/octet-stream')
    })
  });

  const initData = await initRes.json();
  if (!initRes.ok || !initData.success) {
    throw new Error(initData.error || 'Failed to initialize upload session.');
  }

  // Direct Vercel Blob client upload for 10 GB media support
  if (initData.mode === 'blob') {
    if (onStatusChange) onStatusChange('Connecting to persistent object storage...');
    try {
      const { upload } = await import('https://esm.sh/@vercel/blob@2.8.2/client');
      const blob = await upload(file.name, file, {
        access: 'public',
        handleUploadUrl: initData.handleUploadUrl || '/api/media/upload/blob',
        clientPayload: JSON.stringify({ isVideo, fileSize: file.size }),
        headers: authToken ? { 'Authorization': `Bearer ${authToken}` } : {},
        onUploadProgress: (progress) => {
          if (onProgress) {
            onProgress({
              loaded: progress.loaded,
              total: progress.total,
              percentage: progress.percentage,
              status: `Uploading directly to storage... ${formatBytes(progress.loaded)} / ${formatBytes(progress.total)} (${progress.percentage}%)`
            });
          }
        }
      });

      if (onProgress) {
        onProgress({
          loaded: file.size,
          total: file.size,
          percentage: 100,
          status: 'Direct upload verified!'
        });
      }
      if (onStatusChange) onStatusChange('Upload completed successfully!');

      return {
        success: true,
        url: blob.url,
        filename: blob.pathname,
        size: file.size,
        mimeType: file.type || (isVideo ? 'video/mp4' : 'application/octet-stream')
      };
    } catch (blobErr) {
      throw new Error('Direct storage upload failed: ' + blobErr.message);
    }
  }

  const { sessionId } = initData;
  if (onSessionCreated) onSessionCreated(sessionId);

  const chunkSize = initData.chunkSize || (5 * 1024 * 1024); // 5 MB chunks
  const totalChunks = Math.ceil(file.size / chunkSize);
  let transferredBytes = 0;

  if (onStatusChange) onStatusChange('Uploading chunks to persistent storage...');

  // 2. Transfer chunks sequentially with retry
  for (let chunkIdx = 0; chunkIdx < totalChunks; chunkIdx++) {
    if (abortSignal && abortSignal.aborted) {
      throw new DOMException('Upload aborted by user', 'AbortError');
    }

    const start = chunkIdx * chunkSize;
    const end = Math.min(start + chunkSize, file.size);
    const chunkBlob = file.slice(start, end);

    // Bounded retry policy (up to 3 attempts with exponential backoff)
    let attempts = 0;
    let chunkUploaded = false;
    let lastErr = null;

    while (attempts < 3 && !chunkUploaded) {
      if (abortSignal && abortSignal.aborted) {
        throw new DOMException('Upload aborted by user', 'AbortError');
      }

      attempts++;
      try {
        const chunkHeaders = {
          'x-session-id': sessionId,
          'x-chunk-index': String(chunkIdx),
          'x-chunk-offset': String(start),
          'x-chunk-size': String(chunkBlob.size),
          'Content-Type': 'application/octet-stream'
        };
        if (authToken) chunkHeaders['Authorization'] = `Bearer ${authToken}`;

        const chunkRes = await fetch('/api/media/upload/chunk', {
          method: 'POST',
          headers: chunkHeaders,
          body: chunkBlob,
          signal: abortSignal
        });

        const chunkJson = await chunkRes.json();
        if (!chunkRes.ok || !chunkJson.success) {
          throw new Error(chunkJson.error || `Server rejected chunk ${chunkIdx + 1}`);
        }

        chunkUploaded = true;
        transferredBytes = end;

        const pct = Math.min(99, Math.floor((transferredBytes / file.size) * 100));
        if (onProgress) {
          onProgress({
            loaded: transferredBytes,
            total: file.size,
            percentage: pct,
            chunkIdx: chunkIdx + 1,
            totalChunks,
            status: `Uploading... ${formatBytes(transferredBytes)} / ${formatBytes(file.size)} (${pct}%)`
          });
        }
      } catch (err) {
        if (err.name === 'AbortError') throw err;
        lastErr = err;
        if (attempts < 3) {
          if (onStatusChange) onStatusChange(`Network blip on chunk ${chunkIdx + 1}/${totalChunks}. Retrying (attempt ${attempts + 1}/3)...`);
          await new Promise(r => setTimeout(r, attempts * 750));
        }
      }
    }

    if (!chunkUploaded) {
      throw new Error(`Failed to upload chunk ${chunkIdx + 1}/${totalChunks} after 3 attempts: ${lastErr?.message || 'Network error'}`);
    }
  }

  // 3. Finalize and verify video on server
  if (onStatusChange) onStatusChange('Finalizing and verifying video on storage...');
  if (onProgress) {
    onProgress({
      loaded: file.size,
      total: file.size,
      percentage: 99,
      status: 'Finalizing and verifying asset...'
    });
  }

  const completeRes = await fetch('/api/media/upload/complete', {
    method: 'POST',
    headers,
    signal: abortSignal,
    body: JSON.stringify({ sessionId })
  });

  const completeJson = await completeRes.json();
  if (!completeRes.ok || !completeJson.success) {
    throw new Error(completeJson.error || 'Failed to finalize asset verification on server.');
  }

  if (onProgress) {
    onProgress({
      loaded: file.size,
      total: file.size,
      percentage: 100,
      status: 'Upload completed and verified!'
    });
  }
  if (onStatusChange) onStatusChange('Upload completed successfully!');

  return completeJson;
}

function renderMediaField(secId, pathStr, currentVal) {
  const safeId = `${secId}-${pathStr.replace(/[^a-zA-Z0-9_-]/g, '_')}`;
  const hasValue = Boolean(currentVal && String(currentVal).trim());
  const isVideo = hasValue && (currentVal.endsWith('.mp4') || currentVal.endsWith('.webm'));
  const isAudio = hasValue && (currentVal.endsWith('.mp3') || currentVal.endsWith('.mpeg') || currentVal.endsWith('.wav') || currentVal.endsWith('.ogg') || currentVal.endsWith('.m4a'));

  return `
    <div class="media-picker-container" id="container-${safeId}">
      <div class="media-picker-field" id="field-wrap-${safeId}">
        <div class="media-thumb-wrap">
          ${isVideo ? `
            <video src="${escapeHtml(currentVal)}" class="media-thumb-preview" muted preload="metadata" playsinline onerror="this.style.opacity=0" onloadeddata="this.style.opacity=1"></video>
            <span class="media-video-badge">VIDEO</span>
          ` : (isAudio ? `
            <div class="media-thumb-preview" style="display:flex;align-items:center;justify-content:center;background:#18181c;color:#ff3038;font-size:18px;">
              <span>♪</span>
            </div>
            <span class="media-video-badge" style="background:#ff3038;color:#fff;">AUDIO</span>
          ` : `
            <img src="${escapeHtml(currentVal || '')}" alt="" class="media-thumb-preview" onerror="this.style.opacity=0" onload="this.style.opacity=1">
          `)}
        </div>
        <div class="media-field-info">
          <div class="media-field-name" title="${escapeHtml(currentVal || 'No media selected')}">${escapeHtml(currentVal || 'No media selected')}</div>
          <div class="media-field-meta">${hasValue ? (isVideo ? 'Format: Cinema Video' : (isAudio ? 'Format: Audio Asset' : 'Format: Standard Image')) : 'No asset attached'}</div>
          ${isAudio ? `<audio src="${escapeHtml(currentVal)}" controls preload="none" style="width:100%;height:26px;margin-top:4px;"></audio>` : ''}
        </div>
        <div class="media-field-actions" style="display: flex; gap: 4px; align-items: center;">
          <button type="button" class="media-btn-pick" onclick="openMediaModalForField('${secId}', '${pathStr}')">CHOOSE ASSET</button>
          <button type="button" class="btn-orbit-action" onclick="triggerDirectUploadForField('${safeId}')" title="Upload new asset directly">
            <span>↑</span> UPLOAD
          </button>
          ${hasValue ? `
            <button type="button" class="btn-orbit-action danger" onclick="clearMediaField('${secId}', '${pathStr}')" title="Clear media asset">
              <span>✕</span> CLEAR
            </button>
          ` : ''}
        </div>
        <input type="file" id="media-direct-input-${safeId}" style="display: none;" accept="image/png,image/jpeg,image/webp,image/svg+xml,video/mp4,video/webm,application/pdf,audio/mpeg,audio/mp3,audio/wav,audio/ogg" onchange="handleDirectUploadForField(event, '${secId}', '${pathStr}', '${safeId}')">
      </div>
      <div class="media-field-helper">
        <span>◈</span> <strong>10 GB MAX</strong> for Cinema Video · 100MB Audio · 50MB for Images
      </div>
      <div class="media-upload-progress-box" id="progress-box-${safeId}" style="display: none;"></div>
    </div>
  `;
}

function triggerDirectUploadForField(safeId) {
  const input = document.getElementById(`media-direct-input-${safeId}`);
  if (input) {
    input.value = '';
    input.click();
  }
}

async function handleDirectUploadForField(e, secId, pathStr, safeId) {
  const file = e.target.files?.[0];
  if (!file) return;

  const progressBox = document.getElementById(`progress-box-${safeId}`);

  // Immediate Client-Side Validation
  const ext = '.' + file.name.split('.').pop().toLowerCase();
  const isVideo = ALLOWED_VIDEO_EXTS.has(ext);
  const isImage = ALLOWED_IMAGE_EXTS.has(ext);
  const isAudio = ALLOWED_AUDIO_EXTS.has(ext);

  if (!isVideo && !isImage && !isAudio) {
    showToast(`Unsupported format "${ext}". Supported: MP4, WebM (video); PNG, JPG, WebP, SVG, PDF (image); MPEG, MP3, WAV, OGG (audio).`, true);
    return;
  }
  if (file.size <= 0) {
    showToast('Invalid file: File is empty (0 bytes).', true);
    return;
  }
  if (isVideo && file.size > MAX_VIDEO_BYTES) {
    showToast(`File size (${formatBytes(file.size)}) exceeds maximum permitted video limit of 10 GB (10,000,000,000 bytes).`, true);
    return;
  }
  if (isImage && file.size > MAX_IMAGE_BYTES) {
    showToast(`Image size (${formatBytes(file.size)}) exceeds maximum permitted image limit of 50 MB.`, true);
    return;
  }

  // Display initial upload UI state
  if (progressBox) {
    progressBox.style.display = 'flex';
    progressBox.innerHTML = `
      <div class="media-upload-header-row">
        <span class="media-upload-status-title" id="status-title-${safeId}">INITIALIZING UPLOAD...</span>
        <button type="button" class="media-upload-cancel-btn" onclick="cancelUploadForField('${safeId}')">CANCEL</button>
      </div>
      <div class="media-progress-track">
        <div class="media-progress-fill" id="progress-fill-${safeId}" style="width: 0%;"></div>
      </div>
      <div class="media-upload-detail-row">
        <span id="detail-file-${safeId}">${escapeHtml(file.name)} (${formatBytes(file.size)})</span>
        <span id="detail-stats-${safeId}">0% · 0 / ${formatBytes(file.size)}</span>
      </div>
    `;
  }

  const controller = new AbortController();
  activeUploadControllers.set(safeId, { controller, sessionId: null });

  try {
    showToast(`Starting upload of ${file.name}...`);
    const json = await uploadMediaWithProgress({
      file,
      abortSignal: controller.signal,
      onSessionCreated: (sessId) => {
        const item = activeUploadControllers.get(safeId);
        if (item) item.sessionId = sessId;
      },
      onStatusChange: (statusText) => {
        const titleEl = document.getElementById(`status-title-${safeId}`);
        if (titleEl) titleEl.textContent = statusText.toUpperCase();
      },
      onProgress: (prog) => {
        const fillEl = document.getElementById(`progress-fill-${safeId}`);
        if (fillEl) fillEl.style.width = `${prog.percentage}%`;
        const statsEl = document.getElementById(`detail-stats-${safeId}`);
        if (statsEl) {
          statsEl.textContent = `${prog.percentage}% · ${formatBytes(prog.loaded)} / ${formatBytes(prog.total)}`;
        }
      }
    });

    if (json.success && json.filename) {
      updateContentField(secId, pathStr, json.filename);
      const sec = findSectionOrChild(secId);
      if (sec) {
        renderPropertiesPanel(sec);
        renderCenterForm(sec);
      }
      notifyPreview();
      showToast(`Uploaded and attached: ${json.filename}`);
    } else {
      showToast(json.error || 'Upload failed', true);
    }
  } catch (err) {
    if (err.name === 'AbortError') {
      showToast('Upload cancelled.', true);
    } else {
      showToast('Upload failed: ' + err.message, true);
      if (progressBox) {
        progressBox.innerHTML = `
          <div class="media-upload-header-row">
            <span class="media-upload-status-title" style="color:#ff6b6b;">UPLOAD FAILED</span>
            <button type="button" class="media-upload-cancel-btn" onclick="document.getElementById('progress-box-${safeId}').style.display='none'">DISMISS</button>
          </div>
          <div style="font-size: 9.5px; color: #ff6b6b; margin-top: 4px;">${escapeHtml(err.message)}</div>
        `;
        return;
      }
    }
  } finally {
    activeUploadControllers.delete(safeId);
    if (progressBox) progressBox.style.display = 'none';
  }
}

async function cancelUploadForField(safeId) {
  const item = activeUploadControllers.get(safeId);
  if (item) {
    item.controller.abort();
    if (item.sessionId) {
      try {
        const headers = { 'Content-Type': 'application/json' };
        if (authToken) headers['Authorization'] = `Bearer ${authToken}`;
        await fetch('/api/media/upload/abort', {
          method: 'POST',
          headers,
          body: JSON.stringify({ sessionId: item.sessionId })
        });
      } catch (e) {}
    }
    activeUploadControllers.delete(safeId);
  }
  const progressBox = document.getElementById(`progress-box-${safeId}`);
  if (progressBox) progressBox.style.display = 'none';
  showToast('Upload cancelled.');
}

function clearMediaField(secId, pathStr) {
  updateContentField(secId, pathStr, '');
  const sec = findSectionOrChild(secId);
  if (sec) {
    renderPropertiesPanel(sec);
    renderCenterForm(sec);
  }
  notifyPreview();
  showToast('Cleared media asset');
}

function openMediaModalForField(secId, pathStr) {
  activeMediaCallback = (filename) => {
    updateContentField(secId, pathStr, filename);
    const sec = findSectionOrChild(secId);
    if (sec) {
      renderPropertiesPanel(sec);
      renderCenterForm(sec);
    }
    notifyPreview();
  };
  openMediaModal();
}

async function openMediaModal() {
  const modal = document.getElementById('media-modal');
  modal.classList.add('active');
  setupMediaDropzone();
  await refreshMediaGrid();
}

function closeMediaModal() {
  document.getElementById('media-modal').classList.remove('active');
  activeMediaCallback = null;
}

let dropzoneInitialized = false;
function setupMediaDropzone() {
  if (dropzoneInitialized) return;
  const dropzone = document.getElementById('media-dropzone');
  if (!dropzone) return;
  dropzoneInitialized = true;

  ['dragenter', 'dragover'].forEach(eventName => {
    dropzone.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropzone.style.borderColor = 'var(--crimson)';
      dropzone.style.background = 'rgba(230, 41, 41, 0.08)';
    }, false);
  });

  ['dragleave', 'drop'].forEach(eventName => {
    dropzone.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropzone.style.borderColor = '';
      dropzone.style.background = '';
    }, false);
  });

  dropzone.addEventListener('drop', (e) => {
    const dt = e.dataTransfer;
    const files = dt.files;
    if (files && files.length > 0) {
      handleFileUpload({ target: { files } });
    }
  }, false);
}

async function refreshMediaGrid() {
  const grid = document.getElementById('media-library-grid');
  grid.innerHTML = '<div style="color: var(--text-muted); font-family: monospace; font-size: 11px;">Loading media assets...</div>';

  try {
    const res = await fetch('/api/media/list');
    const json = await res.json();
    if (json.success && Array.isArray(json.media)) {
      grid.innerHTML = json.media.map(m => {
        const isVid = m.isVideo || m.filename.endsWith('.mp4') || m.filename.endsWith('.webm');
        return `
          <div class="media-card-item" onclick="selectMediaAsset('${escapeHtml(m.filename)}')">
            <div style="position: relative; width: 100%; height: 60px; background: #000; border-radius: 4px; overflow: hidden;">
              ${isVid ? `
                <video src="${escapeHtml(m.url)}" class="media-card-thumb" muted preload="metadata" playsinline style="width: 100%; height: 100%; object-fit: cover;"></video>
                <span class="media-video-badge" style="position: absolute; top: 3px; right: 3px;">VIDEO</span>
              ` : `
                <img src="${escapeHtml(m.url)}" alt="${escapeHtml(m.filename)}" class="media-card-thumb" loading="lazy" onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%22100%22 height=%2260%22><rect width=%22100%22 height=%2260%22 fill=%22%23222%22/><text x=%2250%%22 y=%2250%%22 fill=%22%23777%22 font-size=%2210%22 dominant-baseline=%22middle%22 text-anchor=%22middle%22>MEDIA</text></svg>'">
              `}
            </div>
            <div class="media-card-name" title="${escapeHtml(m.filename)}">${escapeHtml(m.filename)}</div>
          </div>
        `;
      }).join('');
    }
  } catch (e) {
    grid.innerHTML = '<div style="color: var(--crimson);">Failed to load media assets</div>';
  }
}

function selectMediaAsset(filename) {
  if (activeMediaCallback) {
    activeMediaCallback(filename);
    closeMediaModal();
    showToast(`Applied media: ${filename}`);
  }
}

async function handleFileUpload(e) {
  const file = e.target.files?.[0];
  if (!file) return;

  const progressWrap = document.getElementById('modal-upload-progress-container');

  // Immediate Client-Side Validation
  const ext = '.' + file.name.split('.').pop().toLowerCase();
  const isVideo = ALLOWED_VIDEO_EXTS.has(ext);
  const isImage = ALLOWED_IMAGE_EXTS.has(ext);
  const isAudio = ALLOWED_AUDIO_EXTS.has(ext);

  if (!isVideo && !isImage && !isAudio) {
    showToast(`Unsupported format "${ext}". Supported: MP4, WebM (video); PNG, JPG, WebP, SVG, PDF (image); MPEG, MP3, WAV, OGG (audio).`, true);
    return;
  }
  if (file.size <= 0) {
    showToast('Invalid file: File is empty (0 bytes).', true);
    return;
  }
  if (isVideo && file.size > MAX_VIDEO_BYTES) {
    showToast(`File size (${formatBytes(file.size)}) exceeds maximum permitted video limit of 10 GB (10,000,000,000 bytes).`, true);
    return;
  }
  if (isImage && file.size > MAX_IMAGE_BYTES) {
    showToast(`Image size (${formatBytes(file.size)}) exceeds maximum permitted image limit of 50 MB.`, true);
    return;
  }

  window._isModalUploading = true;
  if (progressWrap) {
    progressWrap.style.display = 'block';
    progressWrap.innerHTML = `
      <div class="media-upload-progress-box">
        <div class="media-upload-header-row">
          <span class="media-upload-status-title" id="modal-status-title">INITIALIZING UPLOAD...</span>
          <button type="button" class="media-upload-cancel-btn" onclick="cancelModalUpload()">CANCEL</button>
        </div>
        <div class="media-progress-track">
          <div class="media-progress-fill" id="modal-progress-fill" style="width: 0%;"></div>
        </div>
        <div class="media-upload-detail-row">
          <span>${escapeHtml(file.name)} (${formatBytes(file.size)})</span>
          <span id="modal-detail-stats">0% · 0 / ${formatBytes(file.size)}</span>
        </div>
      </div>
    `;
  }

  const controller = new AbortController();
  activeUploadControllers.set('modal', { controller, sessionId: null });

  try {
    showToast(`Uploading ${file.name}...`);
    const json = await uploadMediaWithProgress({
      file,
      abortSignal: controller.signal,
      onSessionCreated: (sessId) => {
        const item = activeUploadControllers.get('modal');
        if (item) item.sessionId = sessId;
      },
      onStatusChange: (statusText) => {
        const titleEl = document.getElementById('modal-status-title');
        if (titleEl) titleEl.textContent = statusText.toUpperCase();
      },
      onProgress: (prog) => {
        const fillEl = document.getElementById('modal-progress-fill');
        if (fillEl) fillEl.style.width = `${prog.percentage}%`;
        const statsEl = document.getElementById('modal-detail-stats');
        if (statsEl) {
          statsEl.textContent = `${prog.percentage}% · ${formatBytes(prog.loaded)} / ${formatBytes(prog.total)}`;
        }
      }
    });

    if (json.success && json.filename) {
      showToast(`Uploaded ${json.filename}`);
      await refreshMediaGrid();
      if (activeMediaCallback) {
        selectMediaAsset(json.filename);
      }
    } else {
      showToast(json.error || 'Upload failed', true);
    }
  } catch (err) {
    if (err.name === 'AbortError') {
      showToast('Upload cancelled.', true);
    } else {
      showToast('Upload failed: ' + err.message, true);
    }
  } finally {
    window._isModalUploading = false;
    activeUploadControllers.delete('modal');
    if (progressWrap) progressWrap.style.display = 'none';
    const input = document.getElementById('media-file-input');
    if (input) input.value = '';
  }
}

async function cancelModalUpload() {
  const item = activeUploadControllers.get('modal');
  if (item) {
    item.controller.abort();
    if (item.sessionId) {
      try {
        const headers = { 'Content-Type': 'application/json' };
        if (authToken) headers['Authorization'] = `Bearer ${authToken}`;
        await fetch('/api/media/upload/abort', {
          method: 'POST',
          headers,
          body: JSON.stringify({ sessionId: item.sessionId })
        });
      } catch (e) {}
    }
    activeUploadControllers.delete('modal');
  }
  window._isModalUploading = false;
  const progressWrap = document.getElementById('modal-upload-progress-container');
  if (progressWrap) progressWrap.style.display = 'none';
  showToast('Upload cancelled.');
}

// -------------------------------------------------------------
// 6. GLOBAL SETTINGS MODAL
// -------------------------------------------------------------
function openSettingsModal() {
  const modal = document.getElementById('settings-modal');
  const body = document.getElementById('settings-modal-body');
  const s = currentDraft.settings || {};

  body.innerHTML = `
    <div class="form-group">
      <label class="form-label">PORTFOLIO PAGE TITLE (SEO)</label>
      <input type="text" class="form-input" id="setting-title" value="${escapeHtml(s.siteTitle || '')}">
    </div>
    <div class="form-group">
      <label class="form-label">HEADER BRAND WORDMARK</label>
      <input type="text" class="form-input" id="setting-wordmark" value="${escapeHtml(s.wordmark || 'DESIGNFOLIO')}">
    </div>
    <div class="form-group">
      <label class="form-label">RESUME PDF URL</label>
      <input type="text" class="form-input" id="setting-resume" value="${escapeHtml(s.resumeUrl || 'C-Bala-Krishnan-Resume.pdf')}">
    </div>
    <div class="form-group">
      <label class="form-label">LINKEDIN URL</label>
      <input type="text" class="form-input" id="setting-linkedin" value="${escapeHtml(s.social?.linkedin || '')}">
    </div>
    <div class="form-group">
      <label class="form-label">WHATSAPP URL</label>
      <input type="text" class="form-input" id="setting-whatsapp" value="${escapeHtml(s.social?.whatsapp || '')}">
    </div>
    <div class="form-group">
      <label class="form-label">SEO META DESCRIPTION</label>
      <textarea class="form-textarea" id="setting-seo-desc">${escapeHtml(s.seo?.description || '')}</textarea>
    </div>
  `;

  modal.classList.add('active');
}

function closeSettingsModal() {
  document.getElementById('settings-modal').classList.remove('active');
}

function saveGlobalSettings() {
  if (!currentDraft.settings) currentDraft.settings = {};
  currentDraft.settings.siteTitle = document.getElementById('setting-title').value;
  currentDraft.settings.wordmark = document.getElementById('setting-wordmark').value;
  currentDraft.settings.resumeUrl = document.getElementById('setting-resume').value;
  if (!currentDraft.settings.social) currentDraft.settings.social = {};
  currentDraft.settings.social.linkedin = document.getElementById('setting-linkedin').value;
  currentDraft.settings.social.whatsapp = document.getElementById('setting-whatsapp').value;
  if (!currentDraft.settings.seo) currentDraft.settings.seo = {};
  currentDraft.settings.seo.description = document.getElementById('setting-seo-desc').value;

  closeSettingsModal();
  markUnsaved();
  showToast('Global settings updated');
}

// -------------------------------------------------------------
// 7. ADD NEW SECTION TEMPLATES
// -------------------------------------------------------------
function openAddSectionModal() {
  document.getElementById('new-section-name').value = '';
  document.getElementById('add-section-modal').classList.add('active');
}

function closeAddSectionModal() {
  document.getElementById('add-section-modal').classList.remove('active');
}

function confirmAddSection() {
  const name = document.getElementById('new-section-name').value.trim() || 'New Section';
  const template = document.getElementById('new-section-template').value;
  const newId = `sec-custom-${Date.now()}`;

  let initialContent = {
    metaLabel: `[◈] // ${name.toUpperCase()}`,
    title: name,
    subtitle: 'Section description and visual notes.'
  };

  if (template === 'card-grid' || template === 'archive') {
    initialContent.items = [
      { id: `item-1`, title: 'Project 01', description: 'Visual development & cinematic shot look-dev.', badge: '[◈] 2026', image: 'dune-dneg.jpg' },
      { id: `item-2`, title: 'Project 02', description: 'Synthetic character design & narrative world.', badge: '[◈] 2026', image: 'VeerBhadra.png' }
    ];
  } else if (template === 'metrics') {
    initialContent.items = [
      { id: `metric-1`, category: 'PRODUCTION', value: '100', suffix: '+', label: 'CINEMATIC SHOTS', description: 'High-fidelity cinematic shots produced.' },
      { id: `metric-2`, category: 'PIPELINE', value: '25', suffix: '+', label: 'WORKFLOWS', description: 'Custom ComfyUI and diffusion graph systems.' }
    ];
  } else if (template === 'ticker') {
    initialContent.items = ['VISUAL DEVELOPMENT', 'CREATIVE AI', 'CINEMATIC LOOK-DEV', 'PIPELINE ARCHITECTURE'];
    initialContent.separator = '·';
  } else if (template === 'text-media') {
    initialContent.headline = name;
    initialContent.paragraphs = ['Behind every visual breakthrough is a disciplined synthesis of aesthetic intention and computational pipeline.'];
    initialContent.mediaImage = 'dune-dneg.jpg';
    initialContent.mediaCaption = 'Atmospheric volumetric environment exploration.';
  } else if (template === 'video-showcase') {
    initialContent.videoTitle = 'Cinematic Reel 2026';
    initialContent.videoUrl = 'vid.mp4';
    initialContent.poster = 'landscape-01.jpg';
    initialContent.badge = '[◈] 4K FEATURE REEL';
  } else if (template === 'editorial') {
    initialContent.headline = name;
    initialContent.pullQuote = 'The convergence of generative intelligence and studio craft defines the future of cinema.';
    initialContent.bodyText = 'By unifying diffusion pipelines directly with high-performance studio VFX tools, production timelines collapse while creative possibilities expand exponentially.';
  } else if (template === 'timeline') {
    initialContent.entries = [
      { id: 't-1', year: '2026', title: 'Studio VFX Pipeline Lead', company: 'DNEG', description: 'Lead generative AI workflows across major feature film projects.' }
    ];
  } else {
    initialContent.items = [
      { id: `item-1`, title: 'Featured Item 01', description: 'Visual production showcase.' }
    ];
  }

  const newSec = {
    id: newId,
    type: template,
    name: name,
    order: currentDraft.sections.length + 1,
    visible: true,
    config: {},
    content: initialContent
  };

  currentDraft.sections.push(newSec);
  closeAddSectionModal();
  markUnsaved();
  renderSectionTree();
  selectSection(newId);
  notifyPreview();
  showToast(`Created section "${name}"`);
}

// -------------------------------------------------------------
// 8. SAVE & DISCARD TRANSACTION ENGINE
// -------------------------------------------------------------
async function handleSaveClick() {
  const dot = document.getElementById('status-dot');
  const text = document.getElementById('status-text');

  dot.className = 'status-dot saving';
  text.textContent = 'PUBLISHING...';

  try {
    const headers = { 'Content-Type': 'application/json' };
    if (authToken) headers['Authorization'] = `Bearer ${authToken}`;
    const res = await fetch('/api/content/save', {
      method: 'POST',
      headers,
      body: JSON.stringify(currentDraft)
    });

    const json = await res.json();
    if (json.success) {
      hasUnsavedChanges = false;
      publishedData = JSON.parse(JSON.stringify(currentDraft));
      updateStatusIndicator();
      showToast(`Published Version ${json.version} Successfully! Returning to site...`);

      // Allow toast to show briefly before navigating to public site
      setTimeout(() => {
        window.location.href = '/?saved=true';
      }, 1000);
    } else {
      showToast(`Save failed: ${json.error}`, true);
      updateStatusIndicator();
    }
  } catch (err) {
    showToast('Save failed: Network error', true);
    updateStatusIndicator();
  }
}

function handleDiscardClick() {
  if (!hasUnsavedChanges) {
    window.location.href = '/';
    return;
  }

  const modal = document.getElementById('confirm-modal');
  const title = document.getElementById('confirm-modal-title');
  const desc = document.getElementById('confirm-modal-desc');
  const actionBtn = document.getElementById('confirm-modal-action-btn');

  title.textContent = 'DISCARD UNSAVED CHANGES?';
  desc.innerHTML = `You have unsaved changes in your current editing session. Discarding will abandon all draft edits and restore the published portfolio version.`;

  actionBtn.textContent = 'DISCARD & EXIT';
  actionBtn.onclick = async () => {
    try {
      const headers = {};
      if (authToken) headers['Authorization'] = `Bearer ${authToken}`;
      await fetch('/api/content/discard', { method: 'POST', headers });
    } catch (e) {}
    window.location.href = '/';
  };

  modal.classList.add('active');
}

function closeConfirmModal() {
  document.getElementById('confirm-modal').classList.remove('active');
}

// -------------------------------------------------------------
// 9. RESPONSIVE VIEWPORT & WORKSPACE TABS
// -------------------------------------------------------------
function setupViewportControls() {
  const buttons = document.querySelectorAll('.vp-btn');
  const container = document.getElementById('preview-frame-container');

  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      buttons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const width = btn.dataset.width;
      container.style.width = width;
    });
  });
}

function switchWorkspaceTab(tab) {
  const btnPrev = document.getElementById('tab-btn-preview');
  const btnForm = document.getElementById('tab-btn-form');
  const viewPrev = document.getElementById('preview-tab-view');
  const viewForm = document.getElementById('form-tab-view');

  if (tab === 'preview') {
    btnPrev.classList.add('active');
    btnForm.classList.remove('active');
    viewPrev.style.display = 'flex';
    viewForm.style.display = 'none';
    notifyPreview();
  } else {
    btnForm.classList.add('active');
    btnPrev.classList.remove('active');
    viewPrev.style.display = 'none';
    viewForm.style.display = 'block';
  }
}

// -------------------------------------------------------------
// 10. UTILITIES
// -------------------------------------------------------------
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function showToast(msg, isError = false) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.className = isError ? 'show error' : 'show';
  setTimeout(() => {
    toast.className = '';
  }, 3200);
}

// Global bootstrap & window helpers for automation and testing
window.selectSection = selectSection;
window.findSectionOrChild = findSectionOrChild;
window.renderPropertiesPanel = renderPropertiesPanel;
window.renderCenterForm = renderCenterForm;
window.ensureOrbitImages = ensureOrbitImages;
window.ensureHobbiesSlots = ensureHobbiesSlots;
window.markUnsaved = markUnsaved;
window.handleSaveClick = handleSaveClick;
window.triggerDirectUploadForField = triggerDirectUploadForField;
window.handleDirectUploadForField = handleDirectUploadForField;
window.clearMediaField = clearMediaField;
window.openMediaModalForField = openMediaModalForField;
window.selectMediaAsset = selectMediaAsset;
window.renderMediaField = renderMediaField;

Object.defineProperty(window, 'currentDraft', {
  get: () => currentDraft,
  set: (val) => { currentDraft = val; }
});
Object.defineProperty(window, 'authToken', {
  get: () => authToken,
  set: (val) => { authToken = val; }
});

document.addEventListener('DOMContentLoaded', initBackstage);
