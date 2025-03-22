const fs = require('fs');
const axios = require('axios');
const path = require('path');
const { default: pLimit } = require('p-limit');
const cliProgress = require('cli-progress');

// Create work directory if it doesn't exist
if (!fs.existsSync('work')) {
    fs.mkdirSync('work');
}

// Check if work/allCards.json exists, if not download it
const jsonFilePath = path.join('work', 'allCards.json');
const today = new Date().toISOString().split('T')[0];

function isFileWrittenToday(filePath) {
    if (fs.existsSync(filePath)) {
        const stats = fs.statSync(filePath);
        const fileDate = new Date(stats.mtime).toISOString().split('T')[0];
        return fileDate === today;
    }
    return false;
}

// Attempted to save bandwidth by requesting zipped file at the request of LorcanaJson
// but had many difficulties with compression types
// resorting to download the unzipped json, hoping that http gzip can help with the bandwidth

if (!fs.existsSync(jsonFilePath) || !isFileWrittenToday(jsonFilePath)) {
    const jsonUrl = 'https://lorcanajson.org/files/current/en/allCards.json';
    console.log(`Downloading JSON file from ${jsonUrl}`);
    axios.get(jsonUrl, {
        responseType: 'stream',
        headers: {
            'Accept-Encoding': 'gzip, deflate, br'
        }
    }).then(response => {
        console.log('Download successful, status code:', response.status);
        const writer = fs.createWriteStream(jsonFilePath);
        response.data.pipe(writer);
        writer.on('finish', () => {
            console.log('JSON file saved successfully.');
            downloadCards();
        });
        writer.on('error', (err) => {
            console.error('Error saving JSON file:', err);
        });
    }).catch(error => {
        console.error('Error downloading JSON file:', error);
    });
} else {
    console.log('JSON file already exists and is up-to-date, proceeding to download cards.');
    downloadCards();
}

function downloadCards() {
    // Load the JSON file
    const jsonData = JSON.parse(fs.readFileSync(jsonFilePath, 'utf-8'));

    // Create images directory if it doesn't exist
    const imagesDir = path.join('work', 'images');
    if (!fs.existsSync(imagesDir)) {
        fs.mkdirSync(imagesDir);
    }

    let downloadedCount = 0;
    const downloadPromises = [];
    const limit = pLimit(5); // Set the number of concurrent downloads
    const totalCards = jsonData.cards.length;

    // Create a new progress bar instance
    const progressBar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);
    progressBar.start(totalCards, 0);

    // Loop through all cards and print names
    jsonData.cards.forEach((card) => {
        console.log(card.fullName);

        // Download image if it doesn't already exist
        const imgName = `${card.id}.jpg`;
        const imgPath = path.join(imagesDir, imgName);
        if (!fs.existsSync(imgPath)) {
            const imgUrl = card.images.full;
            console.log(imgUrl);

            const downloadPromise = limit(() => axios.get(imgUrl, { responseType: 'arraybuffer' }).then(response => {
                fs.writeFileSync(imgPath, response.data);
                downloadedCount++;
                progressBar.update(downloadedCount);
            }).catch(error => {
                console.error(`Error downloading image ${imgName}:`, error);
            }));
            downloadPromises.push(downloadPromise);
        } else {
            console.log(`${imgName} already exists, skipping download.`);
            downloadedCount++;
            progressBar.update(downloadedCount);
        }
    });

    Promise.all(downloadPromises).then(() => {
        progressBar.stop();
        console.log(`${downloadedCount} images downloaded. Download process complete.`);
        findMissingImages(imagesDir, jsonData.cards);
    });
}

function findMissingImages(imagesDir, cards) {
    const files = fs.readdirSync(imagesDir)
        .filter(file => /^[0-9]+\.jpg$/.test(file))
        .map(file => parseInt(file.replace('.jpg', ''), 10))
        .sort((a, b) => a - b);

    const max = files[files.length - 1];
    const missing = [];

    for (let i = 1; i <= max; i++) {
        if (!files.includes(i)) {
            missing.push(i);
        }
    }

    if (missing.length === 0) {
        console.log('No gaps in filename sequence.');
    } else {
        console.log('gaps in filename sequence:', missing.join(', '));
        confirmMissingIds(missing, cards);
    }
}

function confirmMissingIds(missing, cards) {
    const cardIds = cards.map(card => card.id);
    const confirmedMissing = missing.filter(id => !cardIds.includes(id));
    const foundInJson = missing.filter(id => cardIds.includes(id));

    if (confirmedMissing.length === missing.length) {
        console.log('SUCCESS: All filename gaps are actually missing in the JSON data.');
    } else {
        console.error('MISSING FILES: Some missing files are still present in the JSON data:', foundInJson.join(', '));
    }
}
