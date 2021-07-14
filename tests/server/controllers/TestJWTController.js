/*
 * File Name : TestJWTController.js
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

const redis = require('../../../server/external/redis/RedisClient')
const JWTController = require('../../../server/controllers/JWTController')

const expect = require('chai').expect

const sinon = require('sinon')
const httpMocks = require('node-mocks-http')

const jose = require('node-jose')

// JWT Controller Test Cases
describe('Test JWTController', () => {
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

        it('should send an error if key store is invalid or empty', (done) => {
            const req = httpMocks.createRequest({})
            const res = httpMocks.createResponse()

            res.json = sinon.spy()

            JWTController.publicKeyStore(req, res, (err) => {
                expect(res.json.called).to.be.false
                expect(err).not.to.be.undefined

                done()
            })
        })
    })

    describe('Test Get with key store', () => {
        before(async () => {
            const keyStore = jose.JWK.createKeyStore()
            await keyStore.generate('RSA', 2048, { alg: 'RS256', use: 'sig' })

            // Inject JWKS in env
            process.env.JWKS = JSON.stringify(keyStore.toJSON(true))
        })

        it('should return the KS without private key', (done) => {
            const req = httpMocks.createRequest({})
            const res = httpMocks.createResponse()

            const next = sinon.spy()
            res.json = sinon.stub()
            res.json.callsFake((ks) => {
                expect(res.json.calledOnce).to.be.true
                expect(next.called).to.be.false
                expect(ks.keys[0]).to.have.all.keys(['kty', 'kid', 'use', 'alg', 'e', 'n'])

                done()
            })

            JWTController.publicKeyStore(req, res, next)
        })
    })

    describe('Test Get of the deny list', () => {
        before(() => {
            const req = httpMocks.createRequest({
                body: {
                    jtis: [process.env.JTI2],
                },
            })
            const res = httpMocks.createResponse()
            const next = sinon.spy()

            JWTController.deny(req, res, next)
        })

        it('should send success if JTI is not on the deny list', (done) => {
            const req = httpMocks.createRequest({
                params: {
                    jti: process.env.JTI1,
                },
            })
            const res = httpMocks.createResponse()

            const next = sinon.stub()
            next.callsFake((error) => {
                expect(error).to.be.not.null

                done()
            })

            JWTController.checkJti(req, res, next)
        })

        it('should send an error if JTI is on the deny list', (done) => {
            const req = httpMocks.createRequest({
                params: {
                    jti: process.env.JTI2,
                },
            })
            const res = httpMocks.createResponse()

            const next = sinon.spy()

            JWTController.checkJti(req, res, (err) => {
                expect(next.called).to.be.false
                expect(err).not.to.be.undefined

                done()
            })
        })
    })

    describe('Test Create without key store', () => {
        before((done) => {
            process.env.JWKS = undefined
            done()
        })

        it('should send an error if key store is invalid or empty', (done) => {
            const req = httpMocks.createRequest({})
            const res = httpMocks.createResponse()

            res.json = sinon.spy()

            JWTController.token(req, res, (err) => {
                expect(res.json.called).to.be.false
                expect(err).not.to.be.undefined

                done()
            })
        })
    })

    describe('Test Create with key store', () => {
        before(async () => {
            const keyStore = jose.JWK.createKeyStore()
            await keyStore.generate('RSA', 2048, { alg: 'RS256', use: 'sig' })

            // Inject JWKS in env
            process.env.JWKS = JSON.stringify(keyStore.toJSON(true))
        })

        it('should send an error if scope is not provided', (done) => {
            const req = httpMocks.createRequest({
                body: {
                    aud: process.env.AUD,
                },
            })
            const res = httpMocks.createResponse()

            res.json = sinon.spy()

            JWTController.token(req, res, (err) => {
                expect(res.json.called).to.be.false
                expect(err.message).to.be.equal('Invalid values')

                done()
            })
        })

        it('should not send an error if aud is not provided', (done) => {
            const req = httpMocks.createRequest({
                body: {
                    scope: process.env.SCOPE,
                },
            })
            const res = httpMocks.createResponse()

            res.json = sinon.spy()

            const next = sinon.spy()
            res.json = sinon.stub()
            res.json.callsFake((result) => {
                expect(res.json.calledOnce).to.be.true
                expect(next.called).to.be.false
                expect(result).to.have.all.keys(['token', 'jti', 'refresh_token'])

                done()
            })

            JWTController.token(req, res, next)
        })

        it('should correctly sign a new token', (done) => {
            const req = httpMocks.createRequest({
                body: {
                    scope: process.env.SCOPE,
                    aud: process.env.AUD,
                },
            })
            const res = httpMocks.createResponse()

            const next = sinon.spy()
            res.json = sinon.stub()
            res.json.callsFake((result) => {
                expect(res.json.calledOnce).to.be.true
                expect(next.called).to.be.false
                expect(result).to.have.all.keys(['token', 'jti', 'refresh_token'])
                expect(
                    JSON.parse(Buffer.from(result.token.split('.')[1], 'base64').toString())
                ).to.have.property('aud', process.env.AUD)

                done()
            })

            JWTController.token(req, res, next)
        })
    })

    describe('Test Create of the deny list', () => {
        it('should send add multiple JTIs on the deny list', () => {
            const req = httpMocks.createRequest({
                body: {
                    jtis: [process.env.JTI1, process.env.JTI2, process.env.JTI3],
                },
            })
            const res = httpMocks.createResponse()
            const next = sinon.spy()

            JWTController.deny(req, res, next)
        })

        it('should send an error for JTI1', (done) => {
            const req = httpMocks.createRequest({
                params: {
                    jti: process.env.JTI1,
                },
            })
            const res = httpMocks.createResponse()

            res.json = sinon.spy()

            JWTController.checkJti(req, res, (err) => {
                expect(res.json.called).to.be.false
                expect(err).not.to.be.undefined

                done()
            })
        })

        it('should send an error for JTI2', (done) => {
            const req = httpMocks.createRequest({
                params: {
                    jti: process.env.JTI2,
                },
            })
            const res = httpMocks.createResponse()

            res.json = sinon.spy()

            JWTController.checkJti(req, res, (err) => {
                expect(res.json.called).to.be.false
                expect(err).not.to.be.undefined

                done()
            })
        })

        it('should send an error for JTI3', (done) => {
            const req = httpMocks.createRequest({
                headers: {
                    'x-auth-jti': process.env.JTI3,
                },
            })
            const res = httpMocks.createResponse()

            res.json = sinon.spy()

            JWTController.checkJti(req, res, (err) => {
                expect(res.json.called).to.be.false
                expect(err).not.to.be.undefined

                done()
            })
        })
    })
})
