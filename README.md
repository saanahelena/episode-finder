# Episode — TV explorer

Search TV shows and explore their episodes using the TVmaze API.

## Features

- Search shows by name
- Browse seasons and include or exclude specials
- Find episode titles or codes such as S01E01
- Reveal episode summaries on demand
- Responsive layout

## Run locally

No build step, API key, or package installation is needed. With Python 3 installed:

```sh
python3 -m http.server 8765 --directory dist
```

Open http://localhost:8765.

## Project files

- `dist/index.html` — page structure
- `dist/style.css` — styles
- `dist/app.js` — TVmaze requests, search, and filters
- `.openai/hosting.json` — existing Sites hosting configuration

## Attribution

Data and images are provided by [TVmaze](https://www.tvmaze.com/) under [CC BY-SA](https://creativecommons.org/licenses/by-sa/4.0/). The app fetches data directly from the [TVmaze API](https://www.tvmaze.com/api). Fonts load from Google Fonts.

## Hosting

The live site is hosted separately on Sites. This repository contains its source; GitHub pushes do not automatically deploy the site.
