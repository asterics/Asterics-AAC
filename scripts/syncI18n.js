const fs = require('fs');
const path = require('path');

const langDir = path.join(__dirname, '..', 'app', 'lang');
const files = fs.readdirSync(langDir).filter(f => f.startsWith('i18n.') && f.endsWith('.json'));

console.log('Total language files found:', files.length);

const allKeys = new Set();
const langData = {};

files.forEach(f => {
    const raw = fs.readFileSync(path.join(langDir, f), 'utf-8');
    const json = JSON.parse(raw);
    langData[f] = json;
    Object.keys(json).forEach(k => allKeys.add(k));
});

console.log('Total unique translation keys across all files:', allKeys.size);

const enData = langData['i18n.en.json'] || {};
const esData = langData['i18n.es.json'] || {};

let totalFixed = 0;
files.forEach(f => {
    const json = langData[f];
    let fileFixed = 0;
    allKeys.forEach(k => {
        if (json[k] === undefined || json[k] === null) {
            json[k] = enData[k] !== undefined ? enData[k] : (esData[k] !== undefined ? esData[k] : '');
            fileFixed++;
            totalFixed++;
        }
    });
    // Sort keys alphabetically for clean consistency
    const sorted = {};
    Array.from(allKeys).sort().forEach(k => {
        sorted[k] = json[k];
    });
    fs.writeFileSync(path.join(langDir, f), JSON.stringify(sorted, null, 4) + '\n', 'utf-8');
    if (fileFixed > 0) {
        console.log(`  - ${f}: synced ${fileFixed} missing keys`);
    }
});

console.log(`Synchronization complete! Total missing keys synced: ${totalFixed}. All ${files.length} language files now have exactly ${allKeys.size} keys.`);
