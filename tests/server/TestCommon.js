/*
 * File Name : TestCommon.js
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

const expect = require('chai').expect

const jose = require('node-jose')

// Global Test Cases
describe('Test Common', () => {
    let keyStore = null

    before((done) => {
        keyStore = jose.JWK.createKeyStore()
        keyStore.generate('RSA', 2048, { alg: 'RS256', use: 'sig' }).then((_result) => {
            done()
        })
    })

    describe('Test Node-jose toJSON function', () => {
        before((done) => {
            expect(keyStore.toJSON(true)).to.have.all.keys(['keys'])
            expect(keyStore.toJSON(true).keys).to.have.a.lengthOf(1)

            done()
        })

        it('should include private key when argument is true', () => {
            expect(keyStore.toJSON(true).keys[0]).to.have.all.keys([
                'kty',
                'kid',
                'use',
                'alg',
                'e',
                'n',
                'd',
                'p',
                'q',
                'dp',
                'dq',
                'qi',
            ])
        })

        it('should not include private key when no argument is provided', () => {
            expect(keyStore.toJSON().keys[0]).to.have.all.keys([
                'kty',
                'kid',
                'use',
                'alg',
                'e',
                'n',
            ])
        })
    })
})
