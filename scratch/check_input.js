const fs = require('fs');
const readline = require('readline');

async function check() {
  const fileStream = fs.createReadStream('C:/Users/meet2/.gemini/antigravity-ide/brain/756d34ff-427e-4d54-a73d-74ad8325ba5f/.system_generated/logs/transcript_full.jsonl');
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  let lastUser = null;
  for await (const line of rl) {
    if (!line.trim()) continue;
    try {
      const parsed = JSON.parse(line);
      if (parsed.type === 'USER_INPUT') {
        lastUser = parsed;
      }
    } catch (e) {}
  }
  if (lastUser) {
    console.log('Keys:', Object.keys(lastUser));
    for (const key of Object.keys(lastUser)) {
      if (key !== 'content') {
        console.log(key, ':', JSON.stringify(lastUser[key]).slice(0, 500));
      }
    }
  }
}
check();
