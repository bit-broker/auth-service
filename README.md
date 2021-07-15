<p align="center">
  <img alt="Bit-Broker" src="https://avatars.githubusercontent.com/u/80974981?s=200&u=7e396d371614d3a9ce7fc1f7fe4515e255374760&v=4" />
</p>

# Bit-Broker Auth Service

![Github Actions](https://github.com/bit-broker/auth-service/actions/workflows/docker-image.yml/badge.svg)

This repository contains the Auth Service used by Bit-Broker.

The Auth Service implements an HTTP REST API and custom scripts for JWT related operations.

## Deployment

It can be deployed using the following helm chart:

[Auth Service Helm Chart](https://github.com/bit-broker/k8s/tree/main/helm/charts/auth-service)

## Documentation

### Scripts

#### Generate new Json Web Key Store

  ```sh
   npm run --silent create-jwks
  ```

#### Check a Json Web Key Store

  ```sh
   npm run --silent check-jwks $JWKS
  ```

#### Rotate an existing Json Web Key Store

  ```sh
   npm run --silent rotate-jwks $JWKS
  ```

### REST API

#### Get the Public Key
----
  Returns the public key to be used for token validation.

* **URL**

  /api/v1/.well-known/jwks.json

* **Method:**

  `GET`

* **Success Response:**

  * **Code:** 200 <br />

* **Error Response:**

  * **Code:** 404 <br />

* **Sample Call:**

  ```curl
  curl --location --request PUT '/api/v1/.well-known/jwks.json'
  ```

#### Sign a Token
----
  Signs a new token with the private key.

* **URL**

  /api/v1/token

* **Method:**

  `POST`

* **Body**

  **Required:**

  ```json
  {
    "aud": "Audience identifier",
    "scope": "Required scope",
    "exp"(Optional): "Unix Time",
  }
  ```

  If "exp" is included in the request a non-refreshable token with the specified
  validity will be provided.
  If "exp" is empty, a refresh token will also be included in the answer.
* **Success Response:**

  * **Code:** 200 <br />

* **Error Response:**

  * **Code:** 404 <br />

* **Sample Call:**

  ```curl
  curl --location --request POST 'http://localhost:8080/api/v1/token' \
  --header 'Content-Type: application/json' \
  --data-raw '{
    "aud": "1",
    "scope": "contribute",
    "exp": "1626358",
  }'
  ```

#### Refresh a token
----
  Signs a new token with the private key and the refresh token.

* **URL**

  /api/v1/token/refresh

* **Method:**

  `POST`

* **Body**

  **Required:**

  ```json
  {
    "refresh_token": "The refresh token",
  }
  ```

* **Success Response:**

  * **Code:** 200 <br />

* **Error Response:**

  * **Code:** 404 <br />

* **Sample Call:**

  ```curl
  curl --location --request POST 'http://localhost:8080/api/v1/token/refresh_token' \
  --header 'Content-Type: application/json' \
  --data-raw '{
    "refresh_token": "The refresh token"
  }'
  ```

#### Add a token to the deny list
----
  Adds a token on the deny list using the JTI.

* **URL**

  /api/v1/token

* **Method:**

  `DELETE`

* **Body**

  **Required:**

  ```json
  {
    "jtis": ["Array of JTIs"],
  }
  ```

* **Success Response:**

  * **Code:** 200 <br />

* **Error Response:**

  * **Code:** 404 <br />

* **Sample Call:**

  ```curl
  curl --location --request DELETE 'http://localhost:8080/api/v1/token' \
  --header 'Content-Type: application/json' \
  --data-raw '{
    "jtis": ["8024280e-2a2c-495a-92dc-93c5b73d17d4"]
  }'
  ```

#### Check if a token is on the deny list
----
  Check if a token is on the deny list.

* **URL**

  /api/v1/token/check/:jti

* **Method:**

  `GET`

*  **URL Params**

   **Required:**

   `jti=[UUID]`

* **Success Response:**

  * **Code:** 200 <br />
  * **Code:** 403 <br />

* **Error Response:**

  * **Code:** 404 <br />

* **Sample Call:**

  ```curl
  curl --location 'http://localhost:8080/api/v1/token/check/08be038e-6435-4a38-92ed-d430120acdb7'
  ```
