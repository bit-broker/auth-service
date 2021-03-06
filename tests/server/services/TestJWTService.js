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
 * File Name : TestJWTController.js
 * Creation Date : 05-05-2021
 * Written by : Jean Diaconu <jdiaconu@cisco.com>
 */

'use strict'

// Fix Chai warning
/* eslint-disable no-unused-expressions */

// Environments handling
require('dotenv').config({ path: '.env.test' })

const redis = require('../../../server/external/redis/RedisClient')
const JWTService = require('../../../server/services/JWTService')

const chai = require('chai')
const expect = chai.expect
const chaiAsPromised = require('chai-as-promised')
chai.use(chaiAsPromised)

const jose = require('node-jose')

// JWT Service Test Cases
describe('Test JWTService', () => {
    before((done) => {
        // Clean redis
        redis.client.flushall((_err, _succeeded) => {
            done()
        })
    })

    describe('Test Get without key store', () => {
        before(() => {
            process.env.JWKS = undefined
        })

        it('should send an error if key store is invalid or empty', () => {
            return expect(JWTService.publicKeyStore()).to.eventually.be.rejected
        })
    })

    describe('Test Get with key store', () => {
        before(async () => {
            const keyStore = jose.JWK.createKeyStore()
            await keyStore.generate('RSA', 2048, { alg: 'RS256', use: 'sig' })

            // Inject JWKS in env
            process.env.JWKS = JSON.stringify(keyStore.toJSON(true))
        })

        it('should return the KS without private key', () => {
            return expect(JWTService.publicKeyStore()).to.eventually.be.fulfilled.and.have.property(
                'keys'
            )
        })

        it('should correctly decode a token', () => {
            return expect(
                JWTService.create({ aud: process.env.AUD }).then((token) =>
                    JWTService.decode(token)
                )
            ).to.eventually.be.fulfilled
        })
    })

    describe('Test Get of the deny list', () => {
        before(async () => {
            await JWTService.deny([process.env.JTI2])
        })

        it('should send success if JTI is not on the deny list', () => {
            return expect(JWTService.check(process.env.JTI1)).to.eventually.be.fulfilled
        })

        it('should send an error if JTI is on the deny list', () => {
            expect(JWTService.check(process.env.JTI2)).to.eventually.be.rejected
        })
    })

    describe('Test Get with key store', () => {
        before(async () => {
            const keyStore = jose.JWK.createKeyStore()
            await keyStore.generate('RSA', 2048, { alg: 'RS256', use: 'sig' })

            // Inject JWKS in env
            process.env.JWKS = JSON.stringify(keyStore.toJSON(true))
        })

        it('should return the KS without private key', () => {
            return expect(JWTService.publicKeyStore()).to.eventually.be.fulfilled.and.have.property(
                'keys'
            )
        })
    })
    describe('Test Create without key store', () => {
        before((done) => {
            process.env.JWKS = undefined
            done()
        })

        it('should send an error if key store is invalid or empty', () => {
            return expect(JWTService.create()).to.eventually.be.rejected
        })
    })

    describe('Test Create with key store', () => {
        before(async () => {
            const keyStore = jose.JWK.createKeyStore()
            await keyStore.generate('RSA', 2048, { alg: 'RS256', use: 'sig' })

            // Inject JWKS in env
            process.env.JWKS = JSON.stringify(keyStore.toJSON(true))
        })

        it('should not send an error if scope is not provided', () => {
            return expect(JWTService.create({ aud: process.env.AUD })).to.eventually.be.fulfilled
        })

        it('should not send an error if aud is not provided', () => {
            return expect(JWTService.create({ scope: process.env.SCOPE })).to.eventually.be
                .fulfilled
        })

        it('should correctly sign a new token', () => {
            return expect(JWTService.create({ aud: process.env.AUD, scope: process.env.SCOPE })).to
                .eventually.be.fulfilled
        })
    })

    describe('Test Create of the deny list', () => {
        it('should send add multiple JTIs on the deny list', () => {
            return expect(JWTService.deny([process.env.JTI1, process.env.JTI2, process.env.JTI3]))
                .to.eventually.be.fulfilled
        })

        it('should send an error for all JTIs', () => {
            return (
                expect(JWTService.check(process.env.JTI1)).to.eventually.be.rejected &&
                expect(JWTService.check(process.env.JTI2)).to.eventually.be.rejected &&
                expect(JWTService.check(process.env.JTI3)).to.eventually.be.rejected
            )
        })
    })
})
