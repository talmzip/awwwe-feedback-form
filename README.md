# Typeform-Style Survey

A lightweight, Typeform-inspired survey experience that runs entirely on static hosting. Built with vanilla HTML/CSS/JS, mobile-first design, and smooth fade transitions. Responses are captured via a Google Apps Script webhook and stored in a Google Sheet—no paid services required.

## Features

- Multi-step form with configurable fade-in/fade-out easing and duration.
- Question set defined in a single config (`scripts/questions.js`) for easy editing.
- Mobile-first layout, keyboard-friendly navigation, and subtle styling.
- Free response collection through Google Apps Script + Google Sheets.
- Ready to deploy on GitHub Pages or any static host.

## Project Structure

```
.
├── index.html
├── styles.css
├── scripts/
│   ├── config.js        # Animation + submission endpoint settings
│   ├── main.js          # Form flow logic
│   └── questions.js     # Question definitions
└── README.md
```

## Getting Started

1. **Clone / download** the repository into your workspace.
2. **Adjust questions** in `scripts/questions.js`. Each question supports:
   - `id`: unique key for the question.
   - `prompt`: displayed question text.
   - `helper`: optional supporting copy.
   - `multiline`: `true` for textarea, `false` for single-line input.
   - `placeholder`: placeholder text for the input.
3. **Tweak animations (optional)** in `scripts/config.js` by changing:
   - `transitionDuration` (milliseconds)
   - `transitionEase` (CSS easing curve string)

## Google Sheets Integration (Free)

1. Create a **new Google Sheet** to collect responses. Note the header row you prefer (e.g., `Timestamp`, `Name`, `Feeling`, `Additional`).
2. In the sheet, open **Extensions → Apps Script**.
3. Replace the default script with:

```javascript
const SHEET_NAME = "Sheet1"; // change if needed

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);

    const row = [
      new Date(),
      ...body.answers.map((entry) => entry.value.trim()),
    ];

    sheet.appendRow(row);

    return ContentService.createTextOutput(
      JSON.stringify({ status: "ok" })
    ).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(
      JSON.stringify({ status: "error", message: error.message })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}
```

4. Click **Deploy → Test deployments → Select type → Web app**. Set:
   - **Execute as:** Me
   - **Who has access:** Anyone
5. Click **Deploy** and copy the generated **Web app URL**.
6. In `scripts/config.js`, set `submitUrl` to this URL.

> **Note:** The URL is public. Anyone with the link could send data to your sheet, so rotate or restrict access if you share it widely.

## Local Preview

Any static web server works. For example, using `npx serve`:

```bash
npx serve .
```

Then visit the URL shown (typically `http://localhost:3000`).

## Deploy to GitHub Pages

1. Commit and push the project to a GitHub repository.
2. In the repo, open **Settings → Pages**.
3. Under **Build and deployment**, choose:
   - **Source:** Deploy from a branch
   - **Branch:** `main` (or your default)
   - **Folder:** `/ (root)`
4. Save—GitHub Pages will publish the site at `https://<username>.github.io/<repo>/`.

## Customization Ideas

- Update colors, typography, and spacing in `styles.css`.
- Add more questions or question types by extending `questions.js`.
- Adjust messaging and copy in `index.html` and status banners in `main.js`.
- Layer in analytics (e.g., Plausible) via a simple `<script>` tag.

## License

This project is distributed under the MIT License. Feel free to reuse and adapt.


