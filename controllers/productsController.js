const { escape } = require('mysql');
const { db, dbQuery } = require('../config/database')

module.exports = {

    getData: async(req, res)=>{
        try {
            let filterQuery =[];
            for (let prop in req.query) {
                if(prop != '_sort' && prop != '_order'){
                    if(prop == 'minimum' || prop == 'maximum'){
                        if(req.query[prop]) {
                            filterQuery.push(`price ${prop == 'minimum' ? '>' : '<'} ${db.escape(req.query[prop])}`)
                        } 
                    } else {
                        filterQuery.push(`${prop == "name" ? `products.${prop}` : prop}=${db.escape(req.query[prop])}`)
                    }
                }
            }

            let { _sort, _order, status, minimum, maximum } = req.query

            let getSql = `SELECT
                products.*,
                brand AS brand_name,
                category.category AS category
                FROM products
                INNER JOIN brand
                ON products.idbrand = brand.idbrand
                INNER JOIN category
                ON products.idcategory = category.idcategory
                WHERE products.status = ${status ? `${db.escape(status)}` : `"active"`}
                ${ filterQuery.length > 0 ? `AND ${filterQuery.join(" AND ")}`:""}
                ${ _sort&&_order ? `ORDER BY ${_sort} ${_order}` : ""}
                `
            let resultsProducts = await dbQuery(getSql);
            let resultsImages = await dbQuery(`SELECT * FROM images;`)
            let resultsStocks = await dbQuery(`SELECT * FROM stocks;`)

            resultsProducts.forEach((value, index)=> {
                value.images = [];
                value.stocks = [];

                resultsImages.forEach(val => {
                    if(value.idproduct == val.idproduct) {
                        delete val.idproduct;
                        value.images.push(val)
                    }
                })
                resultsStocks.forEach(val => {
                    if(value.idproduct == val.idproduct) {
                        delete val.idproduct;
                        value.stocks.push(val)
                    }
                })
            })

            res.status(200).send({
                success: true,
                message: "Get Product success ✔",
                dataProducts: resultsProducts,
                error: ""
            });

        } catch (error) {
            console.log(error)
            res.status(500).send({
                success: false,
                message: "Failed ❌",
                error: error
            })
        }
    },
    getBrand : async (req, res)=>{
        try {
            let brand = await dbQuery(`SELECT * FROM commerce.brand;`)
            res.status(200).send({
                success:true,
                message:"get brand success",
                error:'',
                brandList : brand
            })
        } catch (error) {
            res.status(500).send({
                success: false,
                message: "Failed ❌",
                error: error
            })
        }
    },
    getCategory : async(req, res)=>{
        try {
            let category = await dbQuery(`SELECT * FROM commerce.category;`)
            res.status(200).send({
                success:true,
                message:"get brand success",
                error:'',
                categoryList : category
            })
        } catch (error) {
            res.status(500).send({
                success: false,
                message: "Failed ❌",
                error: error
            })
        }
    },   
    addProducts: async (req, res) => {
        try {
            if(req.dataUser.role == "admin"){
                console.log(req.body);
                let { idbrand, idcategory, name, description, price } = req.body;
                // console.log(`INSERT INTO products VALUES 
                //                                      (null, 
                //                                      ${db.escape(idbrand)}, 
                //                                      ${db.escape(idcategory)}, 
                //                                      ${db.escape(name)},
                //                                      ${db.escape(description)},
                //                                      ${db.escape(price)},
                //                                      'Active';`)
                let insertProducts = await dbQuery(`INSERT INTO products VALUES 
                                                    (null, 
                                                    ${db.escape(idbrand)}, 
                                                    ${db.escape(idcategory)}, 
                                                    ${db.escape(name)},
                                                    ${db.escape(description)},
                                                    ${db.escape(price)},
                                                    'Active');`)
                if (insertProducts.insertId){
                    let { images, stocks } = req.body;
                    // cara 1
                    // for(let i=0; i<images.length; i++){
                    //     await dbQuery(`INSERT INTO images VALUES (null, ${insertProducts.insertId},${db.escape(images[i])});`)
                    // }
                    // cara 2
                    // images.forEach(val=>{
                    //     await dbQuery(`INSERT INTO images VALUES (null, ${insertProducts.insertId}, ${db.escape(val)});`)
                    // })
                    // cara 3
                    // await dbQuery(`INSERT INTO images VALUES ${images.map(val=> `(null, ${insertProducts.insertId},${db.escape(images.val)})`)};`)
                    let arrImages = [];
                    images.map(val => {
                        arrImages.push(`(null, ${insertProducts.insertId}, '${val}')`)
                    })
                    let insertImages = await dbQuery(`INSERT INTO images VALUES ${arrImages.join()}`)
                    // res.status(200).send(insertImages)
                    
                    let arrStock = [];
                    stocks.map(val => {
                        arrStock.push(`(null, ${insertProducts.insertId}, '${val.type}',${val.qty})`)
                    })
                    let insertStocks = dbQuery(`INSERT INTO stocks VALUES ${arrStock.join()}`)
                    // res.status(200).send(insertStocks)
                }
                res.status(200).send(insertProducts)
            } else {
                res.status(400).send({
                    success:false,
                    message:"you cant access this API"
                })
            }
            
        } catch (error) {
            console.log(error)
            res.status(500).send({
                success: false,
                message: "Failed ❌",
                error: error
            })
        }
    },
    deleteProducts: async(req, res) => {
        try {
            if(req.dataUser.role == "admin"){
                let deleteProducts = await dbQuery(`UPDATE commerce.products SET status = "deactive" WHERE idproduct = ${req.params.id}`)
                res.status(200).send({
                success:true,
                message:"Delete products success",
                error:'',
                deleteProducts : deleteProducts
            })
            } else {
                res.status(400).send({
                    success:false,
                    message:"you cant access this API"
                })
            }
        } catch (error) {
            console.log(error)
            res.status(500).send({
                success: false,
                message: "Failed ❌",
                error: error
            })
        }
    },
    editProducts: async(req, res) => {
        try {
            if(req.dataUser.role == "admin"){
                let editProducts = await dbQuery(`UPDATE commerce.products SET 
                name = "${req.body.name}", 
                description = "${req.body.description}", 
                price = ${req.body.price}, 
                idbrand = ${req.body.idbrand}, 
                idcategory = ${req.body.idcategory}
                WHERE idproduct = ${req.params.id};`)
                req.body.images.forEach(value => {
                    dbQuery(`UPDATE commerce.images SET url="${value.url}" WHERE idimage=${value.idimage};`)
                });
                req.body.stocks.forEach(value => {
                    dbQuery(`UPDATE commerce.stocks SET type="${value.type}", qty=${value.qty} WHERE idstock=${db.escape(value.idstock)};`)
                });

                res.deliver = new Response(200, true, "Update Product Success ✅");
            } else {
                res.status(400).send({
                    success:false,
                    message:"you cant access this API"
                })
            }
        } catch (error) {
            console.log(error)
            res.status(500).send({
                success: false,
                message: "Failed ❌",
                error: error
            })
        }
    }
}


// getData: (req, res) => {
//     console.log("Middleware Products")
//     let getSql =""
//     if(req.query.id){
//         getSql = `SELECT
//         products.idproduct,
//         products.name,
//         products.description,
//         brand.name AS brand_name,
//         products.price,
//         category.category AS category
//         FROM products
//         INNER JOIN brand
//         ON products.idbrand = brand.idbrand
//         INNER JOIN category
//         ON products.idcategory = category.idcategory
//         WHERE products.idproduct = ${req.query.id};`
//     } else {
//         getSql = `SELECT
//         products.idproduct,
//         products.name,
//         products.description,
//         brand.name AS brand_name,
//         products.price,
//         category.category AS category
//         FROM products
//         INNER JOIN brand
//         ON products.idbrand = brand.idbrand
//         INNER JOIN category
//         ON products.idcategory = category.idcategory`
//     }
//         db.query(getSql, (err, results) => {
//             if (err) {
//             console.log(err)
//             res.status(500).send({
//                 success: false,
//                 message: "Failed ❌",
//                 error: ""
//             })
//         };
    

//         // get images dari products dari table images idimage, idproduct.url
//         let getImage = `SELECT * FROM images;`
//         db.query(getImage, (errImg, resultsImg) => {
//             if (errImg) {
//                 console.log(err)
//                 res.status(500).send({
//                     success: false,
//                     message: "Failed ❌",
//                     error: errImg
//                 })
//             };
//             // cocokkan idproduct dari table products dengan table images
//             results.forEach((value, index) => {
//                 value.images = []
//                 // kemudian idproduct yang sesuai akan menjadi properti baru dari results products
//                 resultsImg.forEach((val, idx) => {
//                     if (value.idproduct == val.idproduct) {
//                         delete val.idproduct;
//                         value.images.push(val)
//                     }
//                 })
//             })
//             let getStock = `SELECT * FROM stocks;`
//             db.query(getStock, (errStock, resultsStock) => {
//                 if (errStock) {
//                     console.log(err)
//                     res.status(500).send({
//                         success: false,
//                         message: "Failed ❌",
//                         error: errImg
//                     })
//                 };
//                 results.forEach((value, index) => {
//                     value.stock = []
//                     resultsStock.forEach((val, idx) => {
//                         if (value.idproduct == val.idproduct) {
//                             delete val.idproduct;
//                             value.stock.push(val)
//                         }
//                     })
//                 })
//                 res.status(200).send({
//                     success: true,
//                     message: "Get Product success ✔",
//                     dataProducts: results,
//                     error: ""
//                 });
//             })
//         })
//     })
// },