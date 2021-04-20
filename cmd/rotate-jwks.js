/* eslint-disable no-console */

const jose = require('node-jose')

// Get old key store
if (!process.argv[2]) {
    console.log('Old KS needs to be provided')
    process.exit(1)
}

jose.JWK.asKeyStore(Buffer.from(process.argv[2], 'base64').toString())
    .then((keyStore) => {
        // Don't rotate if 2 keys exist
        const json = keyStore.toJSON(true)
        if (json.keys.length > 1) {
            console.log(Buffer.from(JSON.stringify(json)).toString('base64'))
            process.exit(1)
        }

        return keyStore.generate('RSA', 2048, { alg: 'RS256', use: 'sig' }).then((_result) => {
            // Ouput new keys
            console.log(
                Buffer.from(JSON.stringify(keyStore.toJSON(true).keys.reverse())).toString('base64')
            )
        })
    })
    .catch((_error) => {
        console.log(_error)
        process.exit(1)
    })
