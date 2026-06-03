# Code Guide

Yeh guide simple language mein batati hai ki project ke files aur main code pieces kya karte hain.

## File Structure

```text
index.html   -> Page ka structure: buttons, panels, forms, templates
styles.css   -> Page ka design: colors, layout, spacing, responsive behavior
app.js       -> App ka brain: data save, content generate, buttons handle, reports
README.md    -> User guide
.gitignore   -> GitHub par kaunsi local files ignore karni hain
```

## index.html

`index.html` browser ko batata hai ki page par kya dikhna chahiye.

Important parts:

- `intro-panel`: public visitor ko app ka purpose aur quick start buttons dikhata hai.
- `command-panel`: main prompt box aur action buttons.
- `checklist-panel`: daily execution checklist.
- `calendar-panel`: 7-day content calendar.
- `contentCardTemplate`: JavaScript is template ko copy karke new content cards banata hai.

## styles.css

`styles.css` app ko professional look deta hai.

Important concepts:

- `:root`: common colors and design variables store karta hai.
- `.workspace-grid`: dashboard ko 2-column layout banata hai.
- `@media`: small screens par layout ko mobile-friendly banata hai.
- `.panel`: repeated dashboard sections ka shared card style.

## app.js

`app.js` app ka main logic hai.

Important data:

- `DEFAULT_STATE`: app ka starting data shape.
- `state`: current app data, jo browser local storage mein save hota hai.
- `els`: page ke important HTML elements ka shortcut map.

Important functions:

- `loadState()`: browser se saved data load karta hai.
- `saveState()`: current data ko browser local storage mein save karta hai.
- `bindEvents()`: buttons ko actions se connect karta hai.
- `runCommand()`: user prompt ko workflow mein convert karta hai.
- `createContentPack()`: social media drafts generate karta hai.
- `buildWeeklyCalendar()`: 7-day content calendar banata hai.
- `render()`: screen ko latest data ke according redraw karta hai.
- `buildDailyReport()`: daily summary banata hai.
- `exportJson()` / `exportCsv()`: backup and spreadsheet export banate hain.

## Data Storage

App backend/server use nahi karta. Data browser ke `localStorage` mein save hota hai.

Iska matlab:

- Free hai
- API key nahi chahiye
- Data same browser/device mein rehta hai
- Backup ke liye `Export JSON` use karna chahiye

## Future Upgrade Ideas

- Template library
- Better analytics chart
- Niche selector
- Lead follow-up scripts
- Optional AI API mode only after earnings justify the cost
