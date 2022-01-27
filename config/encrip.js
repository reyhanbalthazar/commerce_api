const jwt = require("jsonwebtoken");
const Crypto = require('crypto');
// const { decode } = require("punycode");

module.exports = {
    hashPassword: (pass) => {
        return Crypto.createHmac("sha256", process.env.CRYPTO_KEY).update(pass).digest("hex");
    },
    createToken: (payload) => {
        return jwt.sign(payload, process.env.TOKEN_KEY, {
            expiresIn: "12h"
        })
    },
    readToken: (req, res, next) => {
        jwt.verify(req.token, process.env.TOKEN_KEY, (err, decode) => {
            if (err) {
                res.status(401).send({
                    message: "User Not Authorization ❌",
                    success: false,
                    error: err
                })
            }

            // hasil penerjemahan token
            req.dataUser = decode

            next()
        })
    }
}

// Encode : Menerjemahkan data asli menjadi data acak baru
// Decode : Menerjemahkan data acak menjadi data aslinya