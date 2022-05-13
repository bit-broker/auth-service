/**
 * Copyright 2021 Cisco and its affiliates
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

/*
 * File Name : JWTService.js
 * Creation Date : 14-04-2021
 * Written by : Jean Diaconu <jdiaconu@cisco.com>
 */

'use strict'

const log4js = require('log4js')
const logger = log4js.getLogger('jwt.service')

const redis = require('../external/redis/RedisClient')

const jose = require('node-jose')

const _ = require('lodash')

const Utils = require('../Utils')

// JWT Service
class JWTService {
    static publicKeyStore() {
        logger.debug('Reading the JWKS')

        return new Promise((resolve, reject) => {
            // Read JWKS from env
            const data = process.env.JWKS

            jose.JWK.asKeyStore(data.toString())
                .then((keyStore) => {
                    // IMPORTANT: Without true to hide the private part
                    resolve(keyStore.toJSON())
                })
                .catch((err) => {
                    reject(err)
                })
        })
    }

    static create(payload) {
        logger.debug('Signing a token with JWKS')

        return new Promise((resolve, reject) => {
            // Read JWKS from env
            const data = process.env.JWKS

            jose.JWK.asKeyStore(data.toString())
                .then(async (keyStore) => {
                    const [key] = keyStore.all({ use: 'sig' })

                    // Construct the payload
                    const opt = { compact: true, jwk: key, fields: { typ: 'jwt' } }

                    // Sign the payload
                    const token = await jose.JWS.createSign(opt, key)
                        .update(JSON.stringify(payload))
                        .final()

                    // Return the token and the identifier
                    resolve(token)
                })
                .catch((err) => {
                    reject(err)
                })
        })
    }

    static decode(token) {
        logger.debug('Decoding a token with JWKS')

        return new Promise((resolve, reject) => {
            // Read JWKS from env
            const data = process.env.JWKS

            jose.JWK.asKeyStore(data.toString())
                .then(async (keyStore) => {
                    // Verify the token
                    const result = await jose.JWS.createVerify(keyStore).verify(token)

                    // Return the payload
                    resolve(JSON.parse(result.payload.toString()))
                })
                .catch((err) => {
                    reject(err)
                })
        })
    }

    static deny(jtis) {
        logger.debug(`Denying jtis ${JSON.stringify(jtis)}`)

        // Build promises array
        const promises = []
        for (const jti of jtis) {
            // Check valid UUIDv4
            if (Utils.isUUIDv4(jti)) {
                promises.push(
                    redis.deny(jti, {
                        date: Date.now(),
                    })
                )
            }
        }

        return Promise.allSettled(promises)
    }

    static check(jti) {
        logger.debug(`Checking jti ${JSON.stringify(jti)}`)

        return new Promise((resolve, reject) => {
            redis
                .get(jti)
                .then((values) => {
                    if (!_.isEmpty(values)) {
                        reject(new Error('Denied'))
                        return
                    }

                    resolve()
                })
                .catch((err) => {
                    reject(err)
                })
        })
    }
}

module.exports = JWTService
