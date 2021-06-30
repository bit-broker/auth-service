/* eslint-disable no-console */

const jose = require('node-jose')

// Check params
if (!process.argv[2]) {
    console.log('Scope needs to be provided')
    process.exit(1)
}

if (!process.argv[3]) {
    console.log('JTI needs to be provided')
    process.exit(1)
}

jose.JWK.asKeyStore(process.env.JWKS.toString().toString())
    .then(async (keyStore) => {
        const [key] = keyStore.all({ use: 'sig' })

        // Construct the payload
        const opt = { compact: true, jwk: key, fields: { typ: 'jwt' } }
        const payload = JSON.stringify({
            iss: process.env.ISSUER,
            jti: process.argv[3],
            scp: process.argv[2],
        })

        // Sign the payload
        const token = await jose.JWS.createSign(opt, key).update(payload).final()
        console.log(token)
    })
    .catch((_error) => {
        console.log(_error)
        process.exit(1)
    })
