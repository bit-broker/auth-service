/*
 * File Name : JWTService.js
 * Creation Date : 14-04-2021
 * Written by : Jean Diaconu <jdiaconu@cisco.com>
 * Copyright (C) Cisco System Inc - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 */

'use strict'

const log4js = require('log4js')
const logger = log4js.getLogger('jwt.service')

const jose = require('node-jose')
const uuid = require('uuid')

// JWT Service
class JWTService {
    static publicKeyStore() {
        logger.info('Reading the JWKS')

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

    static token(values) {
        logger.info('Signing a token with JWKS')

        return new Promise((resolve, reject) => {
            if (!values.aud || !values.scope) {
                reject(new Error('Invalid values'))
                return
            }

            // Read JWKS from env
            const data = process.env.JWKS

            jose.JWK.asKeyStore(data.toString())
                .then(async (keyStore) => {
                    const [key] = keyStore.all({ use: 'sig' })

                    // Construct the payload
                    const jti = uuid.v1()
                    const opt = { compact: true, jwk: key, fields: { typ: 'jwt' } }
                    const payload = JSON.stringify({
                        iss: process.env.ISSUER,
                        aud: values.aud,
                        jti: jti,
                        scp: values.scope,
                    })

                    // Sign the payload
                    const token = await jose.JWS.createSign(opt, key).update(payload).final()

                    // Return the token and the identifier
                    resolve({ token, jti })
                })
                .catch((err) => {
                    reject(err)
                })
        })
    }
}

module.exports = JWTService
