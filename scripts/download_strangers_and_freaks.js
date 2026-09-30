const fs = require('fs');
const path = require('path');
const https = require('https');

const JSON_FILES = [
    path.join(__dirname, '../gtaapp.client/src/assets/data/gta5/historia/en/strangers_and_freaks.json'),
    path.join(__dirname, '../gtaapp.client/src/assets/data/gta5/historia/es/strangers_and_freaks.json')
];

const OUTPUT_DIR = path.join(__dirname, '../gtaapp.client/src/assets/data-images/strangers_and_freaks');

async function downloadImage(url, destFile) {
    if (fs.existsSync(destFile)) return 'exists';
    
    fs.mkdirSync(path.dirname(destFile), { recursive: true });

    return new Promise((resolve, reject) => {
        https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
            if (res.statusCode === 200) {
                const file = fs.createWriteStream(destFile);
                res.pipe(file);
                file.on('finish', () => {
                    file.close();
                    resolve('downloaded');
                });
            } else if (res.statusCode === 301 || res.statusCode === 302) {
                https.get(res.headers.location, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res2) => {
                    if (res2.statusCode === 200) {
                        const file = fs.createWriteStream(destFile);
                        res2.pipe(file);
                        file.on('finish', () => {
                            file.close();
                            resolve('downloaded');
                        });
                    } else {
                        resolve('not_found');
                    }
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
            if (loc.thumbnail && loc.thumbnail.includes('www.gtabase.com')) {
                imagesToDownload.add(loc.thumbnail);
            }
        }
    }

    console.log(`Found ${imagesToDownload.size} unique images to download.`);
    
    // Download images
    let totalDownloaded = 0;
    let totalExists = 0;
    let totalNotFound = 0;
    
    for (const url of imagesToDownload) {
        const filename = path.basename(new URL(url).pathname);
        const destFile = path.join(OUTPUT_DIR, filename);
        
        const result = await downloadImage(url, destFile);
        if (result === 'downloaded') totalDownloaded++;
        else if (result === 'exists') totalExists++;
        else if (result === 'not_found') totalNotFound++;
    }
    
    console.log(`Downloaded: ${totalDownloaded}, Existed: ${totalExists}, Not Found: ${totalNotFound}`);
    
    // Update JSON
    for (const jsonFile of JSON_FILES) {
        if (!fs.existsSync(jsonFile)) continue;
        let content = fs.readFileSync(jsonFile, 'utf8');
        
        const data = JSON.parse(content);
        for (const loc of data) {
            if (loc.thumbnail && loc.thumbnail.includes('www.gtabase.com')) {
                const filename = path.basename(new URL(loc.thumbnail).pathname);
                loc.thumbnail = `assets/data-images/strangers_and_freaks/${filename}`;
            }
        }
        
        fs.writeFileSync(jsonFile, JSON.stringify(data, null, 2), 'utf8');
        console.log(`Updated ${jsonFile}`);
    }
}

main().catch(console.error);
