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

Run tests and keep your code quality high:
```
npm run test
npm run lint   # Just shows you the warnings/errors.
npm run fix    # Will try it's best to fix all warnings/errors.
```

Start the server and watch your browser:
```
npm run web
npm run server
```

## Contributing

Pre-commit hooks have been added to keep code clean and passing unit tests. You
can forcibly ignore these by adding the `--no-verify` flag like so:

```
git commit -a -m "Your message" --no-verify
```

## TODO

- Add Webpack dev server (auto run/update the server when file is edited).
- SASS/Stylus style rendering (necessary?)
- Embed Roboto font
