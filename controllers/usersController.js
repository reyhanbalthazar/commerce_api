const { db, dbQuery } = require('../config/database');
const Crypto = require('crypto'); // untuk enkripsi/hashing password
const { hashPassword, createToken } = require('../config/encrip');
const { transporter } = require('../config/nodemailer');

module.exports = {
    //next gunanya utk sambung ke fungsi selanjutnya yaitu middleware (kalau ada)
    getData: (req, res, next) => {
        db.query(
            `Select username, email, role, status from users;`,
            (err, results) => {
                if (err) {
                    console.log(err)
                    res.status(400).send(err)
                };
                res.status(200).send(results);
            })
    },
    register: async (req, res) => {
        try {
            let { username, password, email } = req.body
            // let hashPassword = Crypto.createHmac("sha256", "budi").update(password).digest("hex");
            // console.table({
            //     before: password,
            //     after: hashPassword
            // })
            let insertSQL = `Insert into users (username, email, password) values
            (${db.escape(username)}, ${db.escape(email)}, ${db.escape(hashPassword(password))})`
            let getSQL = `SELECT * FROM users WHERE email=${db.escape(email)};`

            let checkEmail = await dbQuery(getSQL);
            if (checkEmail.length > 0) {
                res.status(400).send({
                    success: true,
                    message: "Email Exist ⚠",
                    error: ""
                });
            } else {
                let insertUser = await dbQuery(insertSQL);
                if (insertUser.insertId) {
                    // get data user berdasarkan insertId untuk dijadikan token
                    let getUser = await dbQuery(`SELECT * FROM users WHERE iduser=${insertUser.insertId};`)
                    let { iduser, username, email, role, status } = getUser[0];
                    let token = createToken({ iduser, username, email, role, status })
                    // mengirimkan email yang berisi token untuk login
                    await transporter.sendMail({
                        from: "Admin Commerce",
                        to: "reyhanbshp@gmail.com",
                        subject: "Confirm Registration",
                        html: `<div>
                        <h3>Klik Link dibawah ini untuk verifikasi akun anda</h3>
                        <a href='http://localhost:3000/verification/${token}'>Click, Here</a>
                        </div>`
                    })
                    res.status(200).send({
                        success: true,
                        message: "Register Succes ✅",
                        error: ""
                    })
                }
            }

        } catch (error) {
            console.log(error)
            res.status(500).send({
                success: true,
                message: "Failed ❌",
                error: errGet
            });
        }
    },
    login: (req, res, next) => {
        let { password, email } = req.body
        // let hashPassword = Crypto.createHmac("sha256", "budi").update(password).digest("hex");
        let loginScript = `SELECT * FROM users WHERE email=${db.escape(email)} AND password =${db.escape(hashPassword(password))};`

        db.query(loginScript, (err, results) => {
            if (err) {
                console.log(err)
                res.status(500).send({
                    success: true,
                    message: "Failed ❌",
                    error: err
                })
            };

            if (results.length > 0) {
                let { iduser, username, email, role, status } = results[0]
                let token = createToken({ iduser, username, email, role, status })
                res.status(200).send({
                    success: true,
                    message: "Login Success ✅",
                    dataLogin: { username, email, role, status, token },
                    error: ""
                })
            } else {
                res.status(401).send({
                    success: false,
                    message: "Login Failed ❌",
                    dataLogin: {},
                    error: ""
                })
            }
        })
    },
    keepLogin: (req, res) => {
        let { iduser } = req.dataUser
        console.log(req.dataUser)
        let keepLoginScript = `Select * from users WHERE iduser=${db.escape(iduser)};`
        db.query(keepLoginScript, (err, results) => {
            if (err) {
                res.status(500).send({
                    success: false,
                    message: "Failed :x:",
                    error: err
                })
            };
            if (results.length > 0) {
                let { iduser, username, email, password, role, status } = results[0];
                let token = createToken({ iduser, username, email, role, status })
                res.status(200).send({
                    success: true,
                    message: "Login Success :white_check_mark:",
                    dataLogin: { username, email, role, status, token },
                    err: ''
                })
            } else {
                res.status(401).send({
                    success: false,
                    message: "Login Failed :x:",
                    dataLogin: {},
                    err: ''
                })
            }
        })
    },
    verification: async (req, res) => {
        try {
            console.log("req.dataUser.iduser", req.dataUser.iduser)
            if (req.dataUser.iduser) {
                // 1. update status user, yang diawalnya Active menjadi Verify
                await dbQuery(`UPDATE commerce.users SET status='Verify' WHERE iduser=${db.escape(req.dataUser.iduser)};`);
                let login = await dbQuery(`SELECT * FROM users WHERE iduser=${db.escape(req.dataUser.iduser)};`);
                if (login.length > 0) {
                    let { iduser, username, email, password, role, status } = login[0];
                    let token = createToken({ iduser, username, email, role, status });
                    res.status(200).send({
                        success: true,
                        message: "Login Success ✅",
                        dataVerify: { username, email, role, status, token },
                        error: ""
                    })
                }
            } else {
                res.status(401).send({
                    success: false,
                    message: "Verify Failed :x:",
                    dataVerify: {},
                    err: ''
                })
            }
        } catch (error) {
            console.log(error)
            res.status(500).send({
                success: true,
                message: "Failed ❌",
                error: errGet
            });
        }
    }
}