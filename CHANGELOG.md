# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [v2.0.1] 2025-04-07
### Add
* Add `onDisconnected` callback.
### Updated
* Call `super` on lifecycle events.

## [v2.0.0] 2025-04-07
### Updated
* Update `tydet-core` to `2.0.0`.
* Handle the new events for `restart` and `eject` service methods.

## [v1.1.0] 2025-03-25
### Added
* Rename the callback methods onSuccessResponse, onFailedResponse, on404Interceptor and onErrorInterceptor
* Add an error handler endpoint
* Add configuration options for the CORS library
* Add configuration options for the Helmet library

## [v1.0.1] 2024-10-04
* Update 'typescript', 'supertest', 'express', 'body-parser', 'cors', 'helmet' and 'tydet-core' repositories.

## [v1.0.0] 2024-02-20
### Added
- Express Service.
- Add middleware to include the Express Service and Context in the request parameter.
- Normalize and manage successful and failed responses.
- Add Callbacks for responses and service configurations.