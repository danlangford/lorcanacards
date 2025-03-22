# Lorcana Cards

Scripts for downloading and searching Lorcana card images.
Fuzzy search card titles and copy the bast match to card.jpg where OBS can reference it to show on stream.
Allows for rapid replacement of an on stream card. 

## Scripts

### 1. `downloadall.js`

- Downloads/updates `allCards.json` from LorcanaJson.org.
- Downloads each card image.
- Displays a progress bar to show the download progress.
- Checks for gaps in the filename sequence and logs any missing files.

### 2. `search.js`

- Loads the `allCards.json` file.
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
