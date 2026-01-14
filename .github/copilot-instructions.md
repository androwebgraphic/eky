# Copilot Instructions for AI Coding Agents

This codebase is a full-stack web application with a React client and a Node.js/Express/MongoDB server. Follow these guidelines to be immediately productive:

## Architecture Overview
- **Client**: Located in `client/`, built with React (TypeScript and JavaScript). Uses Create React App. Main entry: `src/index.js`. Components and pages are in `src/components/` and `src/components/pages/`.
- **Server**: Located in `server/`, built with Express and MongoDB. Main entry: `server.js`. Models in `models/`, routes in `routes/`, controllers in `controllers/`.
- **Uploads**: Images and videos are stored in `server/uploads/dogs/<dogId>/`. The server generates multiple image sizes and a 64px thumbnail (`thumb-64.jpg`).
- **Localization**: Client supports multiple languages. Locale files are in `src/locales/` and screenshot diffs in `screenshots/`.

## Developer Workflows
- **Client**:
  - Start: `npm start` or `yarn start` in `client/`.
  - Build: `npm run build` or `yarn build`.
  - Test: `npm test` or `yarn test`.
- **Server**:
  - Start: `node server.js` in `server/`.
  - Test uploads: Run `server/scripts/test_upload_thumbnail.sh /path/to/image.jpg` (requires `jq`).

## Project-Specific Patterns
- **Image Handling**: Server auto-generates JPEG variants (320, 640, 1024px) and a 64px thumbnail for each upload. Thumbnail URL is stored in the Dog document.
- **Component Structure**: Prefer TypeScript files (`.tsx`) for new components. Legacy components may use `.js`.
- **Localization**: Use `src/i18n.js` and locale files for translations. Screenshots for locale validation are in `screenshots/`.
- **Styling**: Styles are managed in `src/sass/` and `src/styles/`. Use SCSS for new styles.

## Integration Points
- **API Communication**: Client communicates with server via REST endpoints defined in `server/routes/`.
- **Database**: MongoDB models are in `server/models/`.
- **Scripts**: Utility scripts for translation, screenshots, and diagnostics are in `client/scripts/` and `server/scripts/`.

## Conventions
- Use TypeScript for new client code.
- Organize React components by feature in `src/components/pages/`.
- Store uploads in `server/uploads/dogs/<dogId>/`.
- Use provided scripts for translation and screenshot workflows.

## Key Files & Directories
- `client/src/components/` – React components
- `client/src/locales/` – Localization files
- `client/src/sass/` – SCSS styles
- `server/models/` – MongoDB models
- `server/routes/` – Express routes
- `server/uploads/` – Uploaded media
- `screenshots/` – Locale screenshot validation

---

If any section is unclear or missing, please provide feedback for further refinement.