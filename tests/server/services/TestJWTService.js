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
