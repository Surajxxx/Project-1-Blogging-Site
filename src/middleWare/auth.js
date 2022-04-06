const jwt = require("jsonwebtoken");
const BlogModel = require("../models/blogsModel");

//***************************************AUTHENTICATION************************************************** */

const authentication = async function (req, res, next) {
  const token = req.headers["x-api-key"];
  const secretKey = "myprivatekeycontains123!@#";

  if (!token) {
    return res.status(400).send({ msg: " please provide token" });
  }

  try {
    // using ignoreExpiration to handle session expired error separately
    const decodedToken = jwt.verify(token, secretKey, {
      ignoreExpiration: true,
    });

    if (Date.now() > decodedToken.exp * 1000) {
      return res
        .status(401)
        .send({ status: false, message: "Session expired, please login" });
    }
    // adding a decodedToken as a property inside request object so that could be accessed in other handlers and middleWares of same API
    req.decodedToken = decodedToken;

    next();
  } catch {
    res
      .status(401)
      .send({ status: false, message: "authentication failed, please login " });
  }
};

//*****************************************AUTHORIZATION**************************************************** */

const authorization = async function (req, res, next) {
  try {
    const blogId = req.params["blogId"];
    const decodedToken = req.decodedToken;

    const blogByBlogId = await BlogModel.findOne({
      _id: blogId,
      isDeleted: false,
      deletedAt: null,
    });

    if (!blogByBlogId) {
      return res.status(404).send({ msg: `no blog found by ${blogId}` });
    }

    if (decodedToken.authorId != blogByBlogId.authorId) {
      return res.status(403).send({ msg: "unauthorize access" });
    }

    next();
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
};

//************************************EXPORTING BOTH MIDDLEWARE FUNCTIONS****************************** */

module.exports = { authentication, authorization };
