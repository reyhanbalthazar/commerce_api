const router = require('express').Router()
const { readToken } = require('../config/encrip');
const { usersController } = require('../controllers')

router.get("/", usersController.getData);
router.post("/regis", usersController.register);
router.post("/login", usersController.login);
router.get("/keep", readToken, usersController.keepLogin);
router.get("/verify", readToken, usersController.verification);

module.exports = router