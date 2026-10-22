const fs = require('fs');

let html = fs.readFileSync('index.html', 'utf8');

// 1. Remove the dangling fragment that prematurely closed the container after selected-works
const danglingFragment = `          <div class="lightbox-caption-sub" id="lightbox-sub">SUBTITLE</div>
        </div>
      </div>`;

if (html.includes(danglingFragment)) {
  html = html.replace(danglingFragment, '');
  console.log('Successfully removed dangling fragment and restored container continuity across ALL post-hero sections!');
} else {
  console.error('Could not find dangling fragment!');
}

// 2. Expose window.getHeroExrState inside the script so that test suite can directly observe internal EXR frames & states
if (!html.includes('window.getHeroExrState')) {
  html = html.replace(
    'window.releaseHeroExrPlayback = function() {',
    `window.getHeroExrState = function() {
        return { frame: currentFrameNumber, state: exrPlaybackState };
      };
      window.releaseHeroExrPlayback = function() {`
  );
  console.log('Successfully exported window.getHeroExrState!');
}

fs.writeFileSync('index.html', html);
console.log('index.html updated successfully.');
