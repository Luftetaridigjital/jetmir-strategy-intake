# Jetmir Sefa — Strategic Intake

Production intake and end-to-end process overview prepared by **Arlind Berisha × Zoom Growth**.

## Product decision

This pre-contract intake is privacy-first:

- drafts autosave in the current tab's session storage for up to 24 hours;
- closing the tab ends the storage session, while an active tab also has an enforced expiry timer;
- browser storage is cleared only after the submission provider confirms acceptance;
- answers are transmitted only after the respondent presses the final submit button;
- FormSubmit processes the payload for delivery to `mail@arlindberisha.info`;
- pages fail closed inside an iframe to prevent clickjacking on hosts without response-header controls;
- `.txt` and `.json` files remain available as respondent-controlled backup copies;
- clinical or identifying client data is prohibited and a warning detects likely entries;
- downloaded or shared copies remain under the respondent's control and must be deleted separately;
- no CRM/database ingestion is enabled; that remains behind a separate data-governance gate.

## Local verification

```bash
npm test
npm run check
npm run test:e2e
```

The E2E test requires macOS Google Chrome at the standard application path.

## Deployment

GitHub Pages deploys only `index.html`, `process.html`, and `assets/` after unit/static verification passes.

## Ownership

- Arlind Berisha: Business Coach & Strategic Architect
- Ideal: operational project owner
- Zoom Growth: implementation
- Jetmir Sefa: method, voice, credentials, delivery, approvals
