# IMDb Top Movies

A web application that displays a curated list of movies sourced from the Netflix catalogue, with filtering and a personal watchlist feature.

---

## Goal of the App

The goal of the app is to give users a quick, clean way to browse a list of movies, filter them by title, release year, and audience rating, and keep track of which ones they want to watch. It serves as a lightweight alternative to navigating a full streaming platform when all you want to do is discover and remember movies.

---

## User Story

**Ana** is a college student who likes to watch movies on weekends but often forgets the titles she comes across during the week. She opens the app, searches for movies by keyword, narrows the results down to movies from after 2010 targeted at a teen audience, and adds the ones that look interesting to her watchlist. Later that evening she opens the page again, sees her saved list in the sidebar, and picks one to watch. After finishing it she clicks the checkmark next to the title to remove it from the list.

---

## Task Description

Build a server-side Node.js application that:

1. Serves static assets (HTML, CSS, JavaScript, images) from a `public/` directory
2. Exposes the movie dataset (CSV) so client-side JavaScript can fetch it
3. On the client, parses the CSV using PapaParse, filters to movies only, and renders them in an HTML table
4. Provides three filter controls — a text search, a year range slider, and an audience-category radio group — that re-render the table on every change
5. Provides a watchlist panel in the sidebar where users can save movies and mark them as watched (removing them from the list)

---

## Example Usage

1. Open `http://localhost:3000` in a browser
2. The table loads with the first 17 movies from the dataset
3. Type `"dark"` in the **Search title** field — the table instantly narrows to matching titles
4. Drag the **From year** slider to `2013` — movies released before 2013 are hidden
5. Select **Teen** in the **Audience** radio group — only PG-13 / TV-14 / TV-PG movies remain
6. Click **+ Watch** on any row — the movie appears in the **My Watchlist** sidebar panel
7. Click the **✓** button next to a watchlist entry to mark it as watched and remove it

---

## Technical Details

- Load data from a CSV file using the PapaParse library.
- All logic must be implemented on the client side (HTML, CSS, JavaScript).
- Use a simple, clean design.
- Enable dynamic manipulation of DOM elements.
