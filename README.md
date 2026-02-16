# Flappy Bird (GitHub Pages Ready)

This is a pure static Flappy Bird game built with HTML, CSS, and JavaScript.

## Run locally

Open `index.html` directly in a browser, or serve with a tiny local server:

```powershell
python -m http.server 8080
```

Then visit `http://localhost:8080`.

## Deploy on GitHub Pages

This repo includes `.github/workflows/deploy-pages.yml` for automatic deploys.

1. Push this project to a GitHub repository.
2. Go to **Settings -> Pages**.
3. Under **Build and deployment**, choose **Source: GitHub Actions**.
4. Push to `main` (or run the workflow manually from the Actions tab).
5. GitHub will publish the site at:
   - `https://<your-username>.github.io/<repo-name>/`

## Controls

- Press `Space` or `ArrowUp` to flap.
- Tap/click on mobile or desktop.
- Score increases for every pipe passed.
- Best score is saved in browser local storage.
