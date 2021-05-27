# Lead Automation Management Application
The lead automation management interface.

## Requirements
This project requires [Docker Compose](https://docs.docker.com/compose/overview/) to develop and test. The [Yarn](https://yarnpkg.com) package manager is also required, and is used instead of `npm`.

## Runnning
1. Clone repository
2. Override any applicable development environment variables (see [Environment Variables](#environment-variables) below)
3. In the project root, run `yarn start`
4. The server is now accessible on `http://localhost:8285/manage/` (or whatever port you configure)

## Interactive Terminal
You can load an interactive terminal for the app container via `yarn terminal`. This will allow you to add, remove, or upgrade project dependencies using Yarn (among other things). Note: _the application instance must be running via `yarn start` for the terminal to load._

## Environment Variables
Production environment variables are *not* under version control, per [Part 3 of the 12 Factors](https://12factor.net/config). As such, the [dotenv](https://www.npmjs.com/package/dotenv) package is used to manage your variables locally.
1. Create a `.env` file in the project root (at the same level as the `package.json` file)
2. Set (or change) values for the following variables:
```ini
EMBER_SERVE_PORT=8285
EMBER_LIVER_PORT=8286
EMBER_TESTS_PORT=8287
EMBER_GRAPH_PROXY=http://docker.for.mac.host.internal:8288
```
 **Note:** If you are not running on OSX, or you have customized the [limit-zero/leads-graph](https://github.com/limit-zerp/leads-graph) port, you will need to customize the `EMBER_GRAPH_PROXY` URL to point to the IP/Hostname and port of your graph instance:
 - AWS: `curl http://169.254.169.254/latest/meta-data/local-ipv4`
 - *nix: `ip -4 addr show docker0 | grep -Po 'inet \K[\d.]+'`

## Development
### Docker Compose
The development and testing environments are now set up using Docker Compose. Changes to environments (such as database version or new environment variables) should be made within the relevant `docker-compose.yml` file.

#### Development
To start up the development environment, execute `yarn start` from the project root. This will initialize the docker environment for this project and boot up your application and any dependant containers (such as mongo or redis.) The first execution will take some time to download and configure docker images. To stop your environment, press `CTRL+C` in your terminal. If your environment does not shut down cleanly, you can execute `yarn stop` to clean up and shutdown the environment.

You can optionally execute `yarn start &` to cause your terminal to return to the prompt immediately (logs will continue to display) to allow you to execute additional commands. To stop your environment, execute `yarn stop`.

To re-initialize your entire environment, execute `yarn stop` to shutdown. Then run `docker volume rm leadsmanage_node_modules` to remove the cached dependancies. Finally, execute `docker-compose -p leadsmanage rebuild` to force rebuilding the application from the project `Dockerfile` (Typically only needed when making changes to the `docker-compose.yml` configuration.) Executing `yarn start` again will re-initialize and start up the environment from scratch.

#### Testing
Coming soon...
