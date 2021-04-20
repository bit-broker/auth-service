/* eslint-disable no-console */

const jose = require('node-jose')

// Get old key store
if (!process.argv[2]) {
    console.log('KS needs to be provided')
    process.exit(1)
}

jose.JWK.asKeyStore(Buffer.from(process.argv[2], 'base64').toString())
    .then((_keyStore) => {
        // Exit with success
        process.exit(0)
    })
    .catch((_error) => {
        // Exit with error
        process.exit(1)
    })
