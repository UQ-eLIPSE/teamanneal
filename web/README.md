# TeamAnneal 2 (Web)

Version of TeamAnneal written in JavaScript for server and client.

## Prerequisites

* Node.js 8.9.0+
  * npm 5.0.0+ (this should be included)
* Redis 3.0+
  * You should use Redis packages for Windows from https://github.com/MicrosoftArchive/redis/releases

## Installation

From this folder:

```bash
npm install
```

## Building and running server

Ensure that you have a configuration file set (see below). Then:

```bash
npm run build
npm start
```

Currently the server runs on `http://localhost:8080`, but the port is
configurable in the configuration file.

More information about the API is below.

## Configuration

Server configuration is loaded from files under `server/config`. The name of the
file is expected to be the value of `$NODE_ENV` as set in your environment, or
it will default to look for `development`.

You should use the `example.json` file included as the template for your
configuration.

## Tests

### Jest

To run Jest automated tests:

```bash
npm run test
```

Jest configuration files are located under `test`.

### Test files

Files that can be used to test anneals can be found under `test-files`.

## Folder structure

* client
  * build (once built)
  * src
* common
* scripts
* server
  * build (once built)
  * src
* test
* test-files

Source code can be found under the `src` folder of their respective components
(`server`, `client`).

All tests are located under a `__tests__` folder that sits within the same
folder that the relevant source codes sits in.

## API

Currently there is only one endpoint: `/api/anneal`.
JSON formatted POST requests are sent to this endpoint to perform an anneal.

Sample files to test the anneal API can be found under `test-files`.
The contents of those files should be sent as HTTP POST requests to
`http://localhost:8080/api/anneal` with an `application/json` content type.
