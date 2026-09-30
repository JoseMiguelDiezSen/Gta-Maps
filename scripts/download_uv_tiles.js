const fs = require('fs');
const path = require('path');
const https = require('https');

const MIN_ZOOM = 0;
const MAX_ZOOM = 7;
const BASE_URL = 'https://tiles.mapgenie.io/games/gta5/los-santos/uv/';
const OUTPUT_DIR = path.join(__dirname, '../gtaapp.client/src/assets/tiles/uv');

const CONCURRENCY = 3;

async function downloadTile(z, x, y) {
    const url = `${BASE_URL}${z}/${x}/${y}.jpg`;
    const destDir = path.join(OUTPUT_DIR, z.toString(), x.toString());
    const destFile = path.join(destDir, `${y}.jpg`);

    if (fs.existsSync(destFile)) {
        return 'exists';
    }

    return new Promise((resolve, reject) => {
        const req = https.get(url, { 
            headers: { 'User-Agent': 'Mozilla/5.0' },
            timeout: 5000 
        }, (res) => {
            if (res.statusCode === 200) {
                fs.mkdirSync(destDir, { recursive: true });
                const file = fs.createWriteStream(destFile);
                res.pipe(file);
                file.on('finish', () => {
                    file.close();
                    resolve('downloaded');
                });
            } else if (res.statusCode === 404 || res.statusCode === 403) {
                resolve('not_found');
            } else {
                resolve('error'); // Resolving as error to not break Promise.all
            }
        });
        
        req.on('timeout', () => {
            req.destroy();
            resolve('error');
        });

        req.on('error', (err) => {
            resolve('error');
        });
    });
}

async function main() {
    console.log(`Targeting output directory: ${OUTPUT_DIR}`);
    
    let totalDownloaded = 0;
    let totalExists = 0;
    let totalNotFound = 0;

    for (let z = MIN_ZOOM; z <= MAX_ZOOM; z++) {
        const numTiles = Math.pow(2, z);
        console.log(`  Zoom ${z} (up to ${numTiles * numTiles} tiles)...`);
        
        let activePromises = [];
        let tasks = [];
        
        for (let x = 0; x < numTiles; x++) {
            for (let y = 0; y < numTiles; y++) {
                tasks.push({ z, x, y });
            }
        }

        for (let i = 0; i < tasks.length; i++) {
            const t = tasks[i];
            const p = downloadTile(t.z, t.x, t.y).then(result => {
                if (result === 'downloaded') totalDownloaded++;
                if (result === 'exists') totalExists++;
                if (result === 'not_found') totalNotFound++;
            });
            
            activePromises.push(p);
            
            if (activePromises.length >= CONCURRENCY) {
                await Promise.all(activePromises);
                activePromises = [];
            }
        }
        
        if (activePromises.length > 0) {
            await Promise.all(activePromises);
        }
    }
    
    console.log(`\nFinished!`);
    console.log(`Downloaded: ${totalDownloaded}`);
    console.log(`Already existed: ${totalExists}`);
    console.log(`Not found (404/403): ${totalNotFound}`);
}

main().catch(console.error);
