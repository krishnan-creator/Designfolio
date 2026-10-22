const fs = require('fs');
const path = require('path');

const htmlPath = path.join(__dirname, '..', 'index.html');
let html = fs.readFileSync(htmlPath, 'utf8');

const aboutStart = html.indexOf('<section class="about-me-section" id="a-bit-about-me">');
const aboutEnd = html.indexOf('</section>', aboutStart) + '</section>'.length;

const theCoreHtml = `<section class="the-core-section" id="the-core">
        <a id="a-bit-about-me" style="display:none;" aria-hidden="true"></a>
        <div class="dbl-section-header">
          <div class="dbl-meta-label">
            <span class="dbl-meta-dot"></span>
            <span>05 / THE CORE · PROFILE & CAREER SKILL MAP</span>
          </div>
          <h2 class="dbl-title-main">THE CORE</h2>
          <p class="dbl-subtitle-desc">Interactive 3D lanyard profile, technical arsenal, and the journey behind the practice.</p>
        </div>

        <div class="lanyard-profile-mount-wrap" id="lanyard-profile-mount"></div>
      </section>`;

if (aboutStart !== -1 && aboutEnd > aboutStart) {
  html = html.substring(0, aboutStart) + theCoreHtml + html.substring(aboutEnd);
  fs.writeFileSync(htmlPath, html);
  console.log('✅ Successfully replaced A BIT ABOUT ME with THE CORE in index.html');
} else {
  console.error('Failed to find bounds of about-me section');
}
