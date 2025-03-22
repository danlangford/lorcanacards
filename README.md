# Lorcana Cards

This project contains two scripts for managing and searching Lorcana card images.

## Scripts

### 1. `downloadall.js`

This script downloads all Lorcana card images listed in the `allCards.json` file. It performs the following tasks:

- Checks if the `work` directory exists and creates it if it doesn't.
- Downloads the `allCards.json` file if it doesn't exist or if it was not written today.
- Creates an `images` directory inside the `work` directory if it doesn't exist.
- Downloads each card image listed in the `allCards.json` file and saves it in the `images` directory.
- Displays a progress bar to show the download progress.
- Checks for gaps in the filename sequence and logs any missing files.

### 2. `search.js`

This script allows you to search for Lorcana cards by name and updates a display image with the matched card. It performs the following tasks:

- Loads the `allCards.json` file from the `work` directory.
- Creates a `display` directory inside the `work` directory if it doesn't exist.
- Prompts the user to enter a card name to search for.
- Uses fuzzy matching to find the best matches for the entered card name.
- Updates the display image with the matched card's image.
- Clears the display image if no card name is entered.
- Continues to prompt the user for card names until the script is terminated.

## Usage

1. Install the dependencies:

```sh
npm install
```

2. Run the `downloadall.js` script to download the card images:

```sh
npm run downloadall
```

3. Run the `search.js` script to search for cards and update the display image:

```sh
npm run search
```

## Disclaimer

While the logic, approach, and patterns are my own, I did use GitHub Copilot for authoring portions of the code.
