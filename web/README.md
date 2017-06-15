# TeamAnneal 2 (JS)

Version of TeamAnneal written in JavaScript for server and client.


## Prerequisites
* Node.js 6.x LTS (version 6.9.0+)
  * npm 3.10.0+ (this should be included)


## Installation
From this folder:
```
npm install
```


## Building and running server
```
npm run build
npm start
```
Currently the server runs on `http://localhost:8080`. This is set in `server/src/index.ts`.

More information about the API is below.


## Tests
### Jest
To run Jest automated tests:
```
npm run test
```
Jest configuration files are located under `test`.
### Test files
Files that can be used to test anneals can be found under `test-files`.


## Folder structure

* build (created upon build)
  * client
  * common
  * server
* client
  * src
* common
* scripts
* server
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

