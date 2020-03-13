# Luchadores

Luchadores is an arena-style combat game with a cast of silly and weird animals that participate in exaggerated "wrestling" matches.

You can check out the [Design Document](https://docs.google.com/document/d/1MlaYaygWPhbE7BNI9D7iT2IaouNDpXv2TJxrf_YoSdo/)!

## Setup

This is a Node v12 (LTS, as of writing) project. If you use Node Version Manager (NVM):

```
nvm install --lts
```

Then install the packages:

```
npm install
```

We use Webpack to build everything:

```
# For development:
npm run watch

# For production:
npm run build
```

Start the server and watch your browser.
```
npm run web
npm run server
```

## TODO

- Add Webpack dev server (auto run/update the server when file is edited).
- ~~Jest unit testing~~
- SASS/Stylus style rendering (necessary?)
- Embed Roboto font
- Add ESLint rules (necessary with TSLint?)
- Setup CI (hook up test, coverage, quality... Auto DevOps might do this)
