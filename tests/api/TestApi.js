/*
 * File Name : TestApi.js
 * Creation Date : 05-05-2021
 * Written by : Jean Diaconu <jdiaconu@cisco.com>
 * Copyright (C) Cisco System Inc - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
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

        it('should add JTI1 and JTI2 on the deny list', (done) => {
            request(server)
                .delete('/api/v1/token')
                .send({ jtis: [process.env.JTI1, process.env.JTI2] })
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
