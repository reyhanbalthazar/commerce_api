const router = require ('express').Router()
const { readToken } = require('../config/encrip');
const { productsController } = require('../controllers');

router.get('/', productsController.getData);
router.get('/getbrand', productsController.getBrand);
router.get('/getcategory', productsController.getCategory);

router.post('/', readToken, productsController.addProducts);
router.delete('/:id', readToken, productsController.deleteProducts);
router.patch('/:id', readToken, productsController.editProducts);

module.exports = router;