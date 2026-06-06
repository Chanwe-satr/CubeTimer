# Cube Timer

A static Rubik's Cube timer app prepared for Vercel deployment.

## Project Structure

- `public/` is the Vercel deployment output directory.
- `public/index.html` is the production entry page.
- `public/styles.css` contains the production styles.
- `public/app.js` contains the production timer and cube logic.
- `public/cubetimer.txt` keeps a deployed copy of the original single-file source.
- `cubetimer/` keeps the organized source files and the untouched original backup.
- `vercel.json` tells Vercel to deploy the `public/` directory.

## Local Preview

Run a static server from the project root:

```bash
python -m http.server 4173 --directory public
```

Then open `http://127.0.0.1:4173`.

## Deploy

Import this GitHub repository in Vercel. Vercel will use `public/` as the output directory.
