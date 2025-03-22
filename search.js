const fs = require('fs');
const path = require('path');
const fuzzball = require('fuzzball');
const readline = require('readline');

// Configurations
const WORK_FOLDER = 'work';
const CARD_IMAGE_FOLDER = path.join(WORK_FOLDER, 'images');
const DISPLAY_FOLDER = path.join(WORK_FOLDER, 'display');
const KNOWN_FILENAME = path.join(DISPLAY_FOLDER, 'card.jpg');
const MIN_MATCH_SCORE = 70; // Ignore bad matches below this score
const FUZZBALL_LIMIT = 10; // Number of top matches to consider

// Create display directory if it doesn't exist
if (!fs.existsSync(DISPLAY_FOLDER)) {
    fs.mkdirSync(DISPLAY_FOLDER);
}

// Load the JSON file
const jsonFilePath = path.join(WORK_FOLDER, 'allCards.json');
const jsonData = JSON.parse(fs.readFileSync(jsonFilePath, 'utf-8'));
const cards = jsonData.cards;

// unique List of card names for searching
const cardNames = [...new Set(cards.map(card => card.simpleName))];

function updateCardImage(card) {
    // Copies the matched card image to the known filename
    const imagePath = path.join(CARD_IMAGE_FOLDER, `${card.id}.jpg`);

    if (fs.existsSync(imagePath)) {
        const tempFilename = KNOWN_FILENAME + '.temp';
        fs.copyFileSync(imagePath, tempFilename); // Copy first to avoid corruption
        fs.renameSync(tempFilename, KNOWN_FILENAME); // Atomic rename to avoid flicker

        console.log(`\nUpdated display file: ${card.id} - ${card.fullName}`);
    } else {
        console.log('\nCard image not found.');
    }
}

function clearCardImage() {
    // Writes a minimal blank JPEG file instead of deleting it
    fs.writeFileSync(KNOWN_FILENAME, Buffer.from([0xff, 0xd8, 0xff, 0xd9])); // Minimal valid JPEG structure
    console.log('Cleared card display with a blank JPEG.');
}

function reviewMatches(matches) {
    if (matches.length > 0) {
        // Sort results with the same score by name length
        matches.sort((a, b) => {
            if (a[1] === b[1]) {
                return a[0].length - b[0].length;
            }
            return b[1] - a[1];
        });

        // Show results
        console.log('\nTop Matches:');
        matches.forEach(([name, score]) => {
            console.log(`- ${name} (${score}%)`);
        });

        // Auto-select top match
        bestCard = cards.find(card => card.simpleName === matches[0][0]);

        // if bestcard has field 'enchantedId' then use the card with that id
        if (bestCard.enchantedId) {
            bestCard = cards.find(card => card.id === bestCard.enchantedId);
        }

        console.log(`\nBest match selected: ${bestCard.id} - ${bestCard.fullName}\nText: ${bestCard.fullText}`);
        updateCardImage(bestCard);
        return true;
    } else {
        console.log('\n NO GOOD MATCH FOUND. TRY AGAIN.\n ');
        return false;
    }
}

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function promptUser() {
    rl.question('\nCard search: ', query => {
        query = query.trim();

        if (query === '') {
            clearCardImage();
            promptUser();
            return;
        }

        // Find the top matches considering whole word order
        let matches = fuzzball.extract(query, cardNames, { scorer: fuzzball.token_set_ratio, limit: FUZZBALL_LIMIT });

        // Filter out bad matches
        matches = matches.filter(match => match[1] >= MIN_MATCH_SCORE);

        if (!reviewMatches(matches)) {
            // Find the top matches in a more fuzzy approach
            matches = fuzzball.extract(query, cardNames, { scorer: fuzzball.partial_token_sort_ratio, limit: FUZZBALL_LIMIT });

            // Filter out bad matches
            matches = matches.filter(match => match[1] >= MIN_MATCH_SCORE);

            reviewMatches(matches);
        }

        promptUser();
    });
}

clearCardImage();
promptUser();
