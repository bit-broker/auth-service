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
 * File Name : TestApi.js
 * Creation Date : 05-05-2021
 * Written by : Jean Diaconu <jdiaconu@cisco.com>
 */

'use strict'

// Fix Chai warning
/* eslint-disable no-unused-expressions */

// Environments handling
require('dotenv').config({ path: '.env.test' })

const request = require('supertest')
const expect = require('chai').expect

const jose = require('node-jose')

// API Test Cases
describe('Test API', () => {
    let server = null
    beforeEach(function () {
        server = require('./../../server')
    })
    afterEach(function () {
        server.close()
    })

    describe('Test health check', () => {
        it('should be up', (done) => {
            request(server).get('/api/v1').expect(200, done)
        })
    })

    describe('Test Auth Service Routes', () => {
        beforeEach(function (done) {
            const keyStore = jose.JWK.createKeyStore()
            keyStore.generate('RSA', 2048, { alg: 'RS256', use: 'sig' }).then((_result) => {
                // Inject JWKS in env
                process.env.JWKS = JSON.stringify(keyStore.toJSON(true))
                done()
            })
        })

        it('should return the KS without private key', (done) => {
            request(server)
                .get('/api/v1/.well-known/jwks.json')
                .expect(200)
                .expect((res) =>
                    expect(res.body.keys[0]).to.have.all.keys([
                        'kty',
                        'kid',
                        'use',
                        'alg',
                        'e',
                        'n',
                    ])
                )
                .end(done)
        })

        it('should sign a token with exp', (done) => {
            const expInOneHour = Math.round(new Date().getTime() / 1000) + 3600
            request(server)
                .post('/api/v1/token')
                .send({ aud: process.env.AUD, scope: process.env.SCOPE, exp: expInOneHour })
                .expect(200)
                .expect(
                    (res) =>
                        expect(res.body).to.have.all.keys(['token', 'jti']) &&
                        expect(
                            JSON.parse(
                                Buffer.from(res.body.token.split('.')[1], 'base64').toString()
                            )
                        ).to.have.property('aud', process.env.AUD)
                )
                .end(done)
        })

        it('should sign a token with jti', (done) => {
            request(server)
                .post('/api/v1/token')
                .send({ aud: process.env.AUD, scope: process.env.SCOPE, jti: process.env.JTI1 })
                .expect(200)
                .expect(
                    (res) =>
                        expect(res.body).to.have.all.keys(['token', 'jti', 'refresh_token']) &&
                        expect(
                            JSON.parse(
                                Buffer.from(res.body.token.split('.')[1], 'base64').toString()
                            )
                        ).to.include({ aud: process.env.AUD, jti: process.env.JTI1 })
                )
                .end(done)
        })

        it('should sign a token without exp and return a refresh token', (done) => {
            request(server)
                .post('/api/v1/token')
                .send({ aud: process.env.AUD, scope: process.env.SCOPE })
                .expect(200)
                .expect((res) => {
                    const payload = JSON.parse(
                        Buffer.from(res.body.token.split('.')[1], 'base64').toString()
                    )
                    const currentTime = new Date().getTime() / 1000
                    const estimatedExpiryTime = Math.round(
                        currentTime + Number(process.env.JWT_DURATION)
                    )

                    return (
                        expect(res.body).to.have.all.keys(['token', 'jti', 'refresh_token']) &&
                        expect(payload).to.have.property('aud', process.env.AUD) &&
                        expect(payload)
                            .to.have.property('exp')
                            .and.to.be.within(0, estimatedExpiryTime + 1)
                    ) // Give it one second delay
                })
                .end(done)
        })

        it('should not create a new token without the refresh token', (done) => {
            request(server).post('/api/v1/token/refresh').send({}).expect(400).end(done)
        })

        it('should create a new token with the refresh token', (done) => {
            let refreshToken = ''
            request(server)
                .post('/api/v1/token')
                .send({ aud: process.env.AUD, scope: process.env.SCOPE })
                .expect(200)
                .expect((res) => {
                    refreshToken = res.body.refresh_token
                    return expect(res.body).to.have.all.keys(['token', 'jti', 'refresh_token'])
                })
                .end((_err) => {
                    request(server)
                        .post('/api/v1/token/refresh')
                        .send({ refresh_token: refreshToken })
                        .expect(200)
                        .expect((res) => {
                            const payload = JSON.parse(
                                Buffer.from(res.body.token.split('.')[1], 'base64').toString()
                            )
                            const currentTime = new Date().getTime() / 1000
                            const estimatedExpiryTime = Math.round(
                                currentTime + Number(process.env.JWT_DURATION)
                            )

                            return (
                                expect(res.body).to.have.all.keys(['token', 'jti']) &&
                                expect(payload).to.have.property('aud', process.env.AUD) &&
                                expect(payload)
                                    .to.have.property('exp')
                                    .and.to.be.within(0, estimatedExpiryTime + 1)
                            ) // Give it one second delay
                        })
                        .end(done)
                })
        })

        it('should not create a new token with the refresh token if JTI is on the deny list', (done) => {
            let refreshToken = ''
            let jti = ''
            request(server)
                .post('/api/v1/token')
                .send({ aud: process.env.AUD, scope: process.env.SCOPE })
                .expect(200)
                .expect((res) => {
                    refreshToken = res.body.refresh_token
                    jti = res.body.jti
                    return expect(res.body).to.have.all.keys(['token', 'jti', 'refresh_token'])
                })
                .end((_err) => {
                    request(server)
                        .delete('/api/v1/token')
                        .send([jti])
                        .expect(200)
                        .end((_err) => {
                            request(server)
                                .post('/api/v1/token/refresh')
                                .send({ refresh_token: refreshToken })
                                .expect(403)
                                .end(done)
                        })
                })
        })

        it('should add JTI1 and JTI2 on the deny list', (done) => {
            request(server)
                .delete('/api/v1/token')
                .send([process.env.JTI1, process.env.JTI2])
                .expect(200)
                .end(done)
        })

        it('should respond that JTI3 is not on the deny list', (done) => {
            request(server).get(`/api/v1/token/check/${process.env.JTI3}`).expect(200).end(done)
        })

        it('should respond that JTI1 is on the deny list', (done) => {
            request(server).get(`/api/v1/token/check/${process.env.JTI1}`).expect(403).end(done)
        })

        it('should respond that JTI2 is on the deny list', (done) => {
            request(server)
                .post('/api/v1/token/check')
                .set('x-auth-jti', process.env.JTI2)
                .send({})
                .expect(403)
                .end(done)
        })
    })
})
