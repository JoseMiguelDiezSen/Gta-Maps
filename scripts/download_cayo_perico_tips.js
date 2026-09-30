const fs = require('fs');
const path = require('path');
const https = require('https');

const JSON_FILES = [
    path.join(__dirname, '../gtaapp.client/src/assets/data/gta5/online/en/cayo_perico.json'),
    path.join(__dirname, '../gtaapp.client/src/assets/data/gta5/online/es/cayo_perico.json')
];

const OUTPUT_DIR = path.join(__dirname, '../gtaapp.client/src/assets/data-images/cayo_perico');

async function downloadImage(url, destFile) {
    if (fs.existsSync(destFile)) return 'exists';
    
    fs.mkdirSync(path.dirname(destFile), { recursive: true });

    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            if (res.statusCode === 200) {
                const file = fs.createWriteStream(destFile);
                res.pipe(file);
                file.on('finish', () => {
                    file.close();
                    resolve('downloaded');
                });
            } else if (res.statusCode === 404) {
                resolve('not_found');
            } else {
                reject(new Error(`Failed to download ${url}: ${res.statusCode}`));
            }
        }).on('error', (err) => {
            reject(err);
        });
    });
}

async function main() {
    let imagesToDownload = new Set();
    
    // Parse JSON and gather URLs
    for (const jsonFile of JSON_FILES) {
        if (!fs.existsSync(jsonFile)) continue;
        const data = JSON.parse(fs.readFileSync(jsonFile, 'utf8'));
        
        for (const loc of data) {
            if (loc.imageUrl && loc.imageUrl.includes('assets.gtamap.net')) {
                imagesToDownload.add(loc.imageUrl);
            }
        }
    }

    console.log(`Found ${imagesToDownload.size} unique images to download.`);
    
    // Download images
    let totalDownloaded = 0;
    let totalExists = 0;
    
    for (const url of imagesToDownload) {
        const filename = path.basename(url);
        const destFile = path.join(OUTPUT_DIR, filename);
        
        const result = await downloadImage(url, destFile);
        if (result === 'downloaded') totalDownloaded++;
        else if (result === 'exists') totalExists++;
    }
    
    console.log(`Downloaded: ${totalDownloaded}, Existed: ${totalExists}`);
    
    // Update JSON
    for (const jsonFile of JSON_FILES) {
        if (!fs.existsSync(jsonFile)) continue;
        let content = fs.readFileSync(jsonFile, 'utf8');
        content = content.replace(/https:\/\/assets\.gtamap\.net\/map-sources\/gtamap\/tips\//g, 'assets/data-images/cayo_perico/');
        fs.writeFileSync(jsonFile, content, 'utf8');
        console.log(`Updated ${jsonFile}`);
    }
}

main().catch(console.error);
