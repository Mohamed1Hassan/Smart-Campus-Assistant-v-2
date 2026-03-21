const fs = require('fs');
const https = require('https');
const path = require('path');

const MODELS_URL = "https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/";
const TARGET_DIR = path.join(process.cwd(), "public", "models");

const modelsToDownload = [
    // SSD Mobilenet V1
    "ssd_mobilenetv1_model-weights_manifest.json",
    "ssd_mobilenetv1_model-shard1",
    "ssd_mobilenetv1_model-shard2",
    // Face Landmark 68
    "face_landmark_68_model-weights_manifest.json",
    "face_landmark_68_model-shard1",
    // Face Recognition
    "face_recognition_model-weights_manifest.json",
    "face_recognition_model-shard1",
];

if (!fs.existsSync(TARGET_DIR)) {
    fs.mkdirSync(TARGET_DIR, { recursive: true });
}

function download(url, dest) {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(dest);
        https.get(url, (response) => {
            if (response.statusCode !== 200) {
                reject(new Error(`Failed to download ${url}: HTTP ${response.statusCode}`));
                return;
            }
            response.pipe(file);
            file.on('finish', () => {
                file.close();
                console.log(`Successfully downloaded ${path.basename(dest)}`);
                resolve();
            });
        }).on('error', (err) => {
            fs.unlink(dest, () => {});
            reject(err);
        });
    });
}

async function start() {
    for (const model of modelsToDownload) {
        const url = MODELS_URL + model;
        const dest = path.join(TARGET_DIR, model);
        console.log(`Downloading ${model}...`);
        try {
            await download(url, dest);
        } catch (err) {
            console.error(`Error downloading ${model}: ${err.message}`);
        }
    }
    console.log("All downloads finished!");
}

start();
