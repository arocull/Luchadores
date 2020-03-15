# Luchadores

Luchadores is an arena-style combat game with a cast of silly and weird animals that participate in exaggerated "wrestling" matches.

You can check out the [Design Document](https://docs.google.com/document/d/1MlaYaygWPhbE7BNI9D7iT2IaouNDpXv2TJxrf_YoSdo/)!

## Setup

This is a Node v12 (LTS, as of writing) project. If you use Node Version Manager (NVM):

```
nvm install --lts
```

Then install the packages. It should automatically trigger a build afterward:

```
npm install
```

We use Webpack to build everything:

```
npm run watch           # Generally the fastest, also auto-starts the server.
npm run build           # Builds everything once.
npm run build           # Builds everything once.
npm run clean           # Clears the dist folder.
npm run rebuild-prod    # Cleans and builds everything once with production settings.
npm run rebuild-prod    # Cleans and builds everything once with production settings.
```

Run tests and keep your code quality high:
```
npm run test
npm run lint            # Just shows you the warnings/errors.
npm run fix             # Will try it's best to fix all warnings/errors.
```

Start the server and watch your browser:
```
npm run web             # Opens index.html in your browser. Does not connect to a server.
npm run join            # Opens a link to the server in your browser. DOES connect to the locally hosted server.
npm run server          # Runs the server without building.
npm run start           # Builds and runs the server.
```

## Contributing

Pre-commit hooks have been added to keep code clean and passing unit tests. You
can forcibly ignore these by adding the `--no-verify` flag like so:

```
git commit -a -m "Your message" --no-verify
```
