const express = require('express');
const router = express.Router();
const AuthorController = require('../controllers/authorController')
const MiddleWare = require('../middleWare/auth')
const BlogsController = require('../controllers/blogsController')


router.get('/test', function(req, res){
    res.status(200).send({status: true, message: "test api working fine"})
})

//**************************************AUTHOR API's**************************************************** */

// Create author // authorLogin
router.post('/authors', AuthorController.createAuthor)
router.get('/login', AuthorController.authorLogin)

//*****************************************BLOG API's**************************************************** */

 // Create blog // Get blogs // Update blog //Delete blog by path params // Delete blogs by query params
router.post('/blogs', MiddleWare.authentication, BlogsController.createBlog )
router.get('/blogs', MiddleWare.authentication, BlogsController.getBlogs)
router.put('/blogs/:blogId',MiddleWare.authentication, MiddleWare.authorization, BlogsController.updateBlog)
router.delete('/blogs/:blogId', MiddleWare.authentication, MiddleWare.authorization, BlogsController.deleteBlog)
router.delete('/blogs', MiddleWare.authentication, BlogsController.deleteFilteredBlog)




module.exports = router;