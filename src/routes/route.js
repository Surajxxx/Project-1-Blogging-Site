const express = require('express');
const router = express.Router();
const AuthorController = require('../controllers/authorController')
const MiddleWare = require('../middleWare/auth')
const BlogsController = require('../controllers/blogsController')


router.get('/test', function(req, res){
    res.status(200).send({status: true, message: "test api working fine"})
})

//**************************************AUTHOR API's**************************************************** */

// Create author
router.post('/authors', AuthorController.createAuthor)

// login
router.get('/login', AuthorController.authorLogin)

//*****************************************BLOG API's**************************************************** */

 // Create blogs
 router.post('/blogs', MiddleWare.authentication, BlogsController.createBlog )

// Get blogs 
router.get('/blogs', MiddleWare.authentication, BlogsController.getBlogs)

//update blogs
router.put('/blogs/:blogId',MiddleWare.authentication, MiddleWare.authorization, BlogsController.updateBlog)

//Deleted blogs by params
router.delete('/blogs/:blogId', MiddleWare.authentication, MiddleWare.authorization, BlogsController.deleteBlog)
router.delete('/blogs', MiddleWare.authentication, BlogsController.deleteFilteredBlog)




module.exports = router;