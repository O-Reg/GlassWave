// Update the fixed desktop-preview installation without touching its portable data.
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');
const asar = require('@electron/asar');

const repo = path.resolve(__dirname, '..');
const preview = path.resolve(repo, '..', '..', 'outputs', 'GlassWave-1.2.1-preview');
const archive = path.join(preview, 'resources', 'app.asar');
const next = `${archive}.next`;
if (!fs.existsSync(archive)) throw new Error(`Preview installation is missing: ${archive}`);
const scratch = fs.mkdtempSync(path.join(os.tmpdir(), 'glasswave-preview-sync-'));

if (!scratch.startsWith(path.resolve(os.tmpdir()) + path.sep) ||
    !path.basename(scratch).startsWith('glasswave-preview-sync-')) {
  throw new Error('Unexpected temporary directory');
}

const hash = data => crypto.createHash('sha256').update(data).digest('hex');

(async () => {
  try {
    asar.extractAll(archive, scratch);
    fs.rmSync(path.join(scratch, 'src'), { recursive: true, force: true });
    fs.cpSync(path.join(repo, 'src'), path.join(scratch, 'src'), { recursive: true });
    fs.copyFileSync(path.join(repo, 'package.json'), path.join(scratch, 'package.json'));
    await asar.createPackage(scratch, next);

    for (const file of ['package.json', 'src/renderer/index.html', 'src/renderer/js/ui.js']) {
      const relative = file.split('/').join(path.sep);
      if (hash(asar.extractFile(next, relative)) !== hash(fs.readFileSync(path.join(repo, relative)))) {
        throw new Error(`Preview package verification failed: ${file}`);
      }
    }
    fs.copyFileSync(next, archive);
    console.log(`Updated ${preview}`);
  } finally {
    if (fs.existsSync(next)) fs.unlinkSync(next);
    fs.rmSync(scratch, { recursive: true, force: true });
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
