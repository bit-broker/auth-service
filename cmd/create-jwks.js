/* eslint-disable no-console */

const jose = require('node-jose')

// Create KS and print it
const keyStore = jose.JWK.createKeyStore()
keyStore.generate('RSA', 2048, { alg: 'RS256', use: 'sig' }).then((_result) => {
    console.log(Buffer.from(JSON.stringify(keyStore.toJSON(true))).toString('base64'))
})
