/* eslint-disable no-console */

const jose = require('node-jose')

// Get old key store
if (!process.argv[2]) {
    console.log('Old KS needs to be provided')
    process.exit(1)
}

jose.JWK.asKeyStore(Buffer.from(process.argv[2], 'base64').toString())
    .then((keyStore) => {
        // Remove last key if needed
        const json = keyStore.toJSON(true)
        if (json.keys.length > 1) {
            json.keys.pop()
        }

        // Ouput new keys
        console.log(Buffer.from(JSON.stringify(json)).toString('base64'))
    })
    .catch((_error) => {
        console.log('Invalid KS provided')
        process.exit(1)
    })
