# Luchadores

Luchadores is a top-down multiplayer web game focused on exaggerated "wrestling" with a strange cast of animal characters.
**[Play it here](https://luchadores.alanocull.com/)**.

Luchadores features a fully custom game engine, with 2D graphics and 3D (non-rotational) physics. Feel free to dig or re-use modules as found in here.

**Note: This is a public mirror. Development and management may be handled internally--if development continues.** (Project on hiatus.)

Developed by the O'Cull bros: [James O'Cull](https://github.com/jocull), [Max O'Cull](https://github.com/Maxattax97), and I (Alan O'Cull).

## Setup

This is a Node v22.9.0 project. If you use Node Version Manager (NVM):

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
npm run build-prod      # Builds everything once with production settings.
npm run clean           # Clears the dist folder.
npm run rebuild         # Cleans and builds everything once.
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

### Configuration

Luchadores servers ping a "Server Browser" while running.
If you'd like to configure this, update `config/default.json > heartbeat > servers` to ping your desired server.

## Contributing

Pre-commit hooks have been added to keep code clean and passing unit tests. You
can forcibly ignore these by adding the `--no-verify` flag like so:

```
git commit -a -m "Your message" --no-verify
```

Be sure to add changes to the [changelog](assets/changelog.txt) when making edits, or at least when making balance changes.