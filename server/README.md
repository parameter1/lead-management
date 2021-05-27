# Leads (GraphQL) API
Server backend for the Lead Automation project, including the primary Graph API, as well as tracking endpoints.

## Requirements
This project requires [Docker Compose](https://docs.docker.com/compose/overview/) to develop and test.

## Running
1. Clone repository
2. Override any applicable development environment variables (see [Environment Variables](#environment-variables) below)
3. In the project root, run `docker-compose up`
4. The server is now accessible on `localhost:8288` (or whatever port you configure)

## Environment Variables
Production environment variables are *not* under version control, per [Part 3 of the 12 Factors](https://12factor.net/config). As such, the [dotenv](https://www.npmjs.com/package/dotenv) package is used to manage your variables locally.
1. Create a `.env` file in the project root (at the same level as the `package.json` file)
2. Set (or change) values for the following variables:
```ini
FUEL_API_CLIENT_ID=
FUEL_API_CLIENT_SECRET=
WUFOO_API_SUBDOMAIN=
WUFOO_API_KEY=
WUFOO_API_PASSWORD=

SERVER_APP_PORT=8288
SERVER_DB_PORT=8289
```

### Production Environment Variables
The following environment variables must be set at run-time for the production deployment of this application. The development and test environments set appropriate values for those environments within the `docker-compose.yml` configuration files.
```
NODE_ENV=production

MONGO_DSN=
NEW_RELIC_LICENSE_KEY=
FUEL_API_CLIENT_ID=
FUEL_API_CLIENT_SECRET=
WUFOO_API_SUBDOMAIN=
WUFOO_API_KEY=
WUFOO_API_PASSWORD=
SENTRY_DSN=
```

## API
### Graph
The API utilizes [GraphQL](http://graphql.org/learn/) and, as such, there is one endpoint for accessing the API: `/graph`. The GraphQL implementation is setup to handle JSON `POST` requests (or `GET` requests with the `?query=` parameter) for both queries and mutations.
#### Queries and Mutatations
```graphql
type Query {
  ping: String!
  extractedHost(id: String): ExtractedHost!
  extractUrlsFromHtml(html: String!): [String]
  generateTrackedHtml(html: String!): String!
  crawlUrl(url: String!, cache: Boolean = true): ExtractedUrl!
}
```
See the `graphql/definitions/index.js` file for complete details, or use a GraphQL compatible client (such as [Insomnia](https://insomnia.rest/)) for automatic schema detection and query autocomplete capabilities.

### Email Click Tracking
Clicks from email deployments are handled via the `/click/{urlID}` route, and must contain the `usr`, `dep`, and `job` query parameters. By default, tracked links are generated as follows:
```
/click/5a6782de040fa60001f13512/?usr=%%subscriberid%%&dep=%%_emailid%%&job=%%jobid%%
```
Where:
- `5a6782de040fa60001f13512` signifies the ID of the `ExtractedUrl` that was clicked
- `%%subscriberid%%` is an ExactTarget merge field filled with the Subscriber ID (signifies the user)
- `%%_emailid%%` is an ExactTarget merge field filled with the Email ID (signifies the email deployment)
- `%%jobid%%` is an ExactTarget merge field filled with the Send ID (signifies the email send/split, including metrics and sent date)

All four values must be successfully validated and retrieved in order for an `EventEmailClick` to be recorded.

#### URL Parameters and Merge Variables
Extracted URLs and Hosts can be instructed to inject url parameters into the destination URL. These parameters can either be discrete values (such as "email" or "foo"), or can be filled with merge variables from the ESP, (e.g. `%%jobid%%` or `%%emailaddr%%`).

If `urlParams` are specified on the `ExtractedHost` or `ExtractdUrl` models, these are evaulated when the destination URL is being converted into a tracked link. If any of the params are flagged with `isMergeVar`, the value will be included in the `mv` parameter of the tracked linked. The `mv` param is a URL encoded version of each parameter's key, along with the non-encoded merge variable (so that it will be appropiately filled by the ESP).

When a tracked link is clicked, the params from the `urlParams` property of both the `ExtractedHost` and `ExtractedUrl` models are evaluated. In addition, any merge variables of the `mv` property are filled-in, where appropriate. The process works as follows:
1. The defined `urlParams` of the host and URL models are merged. If a param of the same key is found on both the host and the URL, the value for the URL will override the host.
2. Each param from this merged set is then evaluated: if it's a discrete value, that value is used directly. If the param is flagged with `isMergeVar`, an attempt will be made to find the value from the `mv` parameter.
3. The resulting values are then injected into the destination URL's query string. If the destination URL already has a parameter within its query string, that value is left as-is and is not overriden.

### Email Link Acknowledgement
All tracked links within in a deployment will also send an acknowledgment image beacon, informing the system that links were included with the deployment. This ensures that links will be recorded for the email send and deployment, even if they are not clicked. ExactTarget has a max link length of ~900 characters, so acknowledgement beacons will be split into multiple beacons if the max length URL length is reached.

The beacon is generated as:
```
/click/ack.gif?dep=%%_emailid%%&job=%%jobid%%&urls=id1.id2.idn
```
Where:
- `%%_emailid%%` is an ExactTarget merge field filled with the Email ID (signifies the email deployment)
- `%%jobid%%` is an ExactTarget merge field filled with the Send ID (signifies the email send/split, including metrics and sent date)
- `id1.id2.idn` is an period delimited list of extracted URL _shortIDs_ that exist in the deployment

When the beacon is sent, data will only be recorded when the `dep` and `job` fields are integers, and the `urls` value is not empty. Ulimately, an `EmailUrl` document will be saved to the database for each URL within the beacon.

## Development
### Docker Compose
The development and testing environments are set up using Docker Compose. Changes to environments (such as database version or new environment variables) should be made within the relevant `docker-compose.yml` file.

#### Development
To start up the development environment, execute `docker-compose up` from the project root. This will initialize the docker environment for this project and boot up your application and any dependant containers (such as mongo). The first execution will take some time to download and configure docker images. To stop your environment, press `CTRL+C` in your terminal. If your environment does not shut down cleanly, you can execute `docker-compose down` to clean up and shutdown the environment.

To stop your environment, execute `docker-compose down`.

## Additional Resources
This application uses many popular, open source NodeJS packages. Please visit the following links if you'd like to learn more.
- [Express](https://expressjs.com/) - "Fast, unopinionated, minimalist web framework for Node.js"
- [Apollo Graph Server](https://www.apollographql.com/servers) - "Easily build a GraphQL API that connects to one or more
REST APIs, microservices, or databases."
- [Mongoose](http://mongoosejs.com/docs/guide.html) - "elegant mongodb object modeling for node.js"
- [Passport](http://www.passportjs.org/) - "Simple, unobtrusive authentication for Node.js"
- [Bluebird](http://bluebirdjs.com/docs/getting-started.html) - "A full featured promise library with unmatched performance."
