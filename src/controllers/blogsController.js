const BlogModel = require("../models/blogsModel");
const jwt = require("jsonwebtoken");
const AuthorModel = require("../models/authorModel");
const { default: mongoose } = require("mongoose");

//**************************************VALIDATION FUNCTIONS************************************************* */

const isValid = function (value) {
  if (typeof value === "undefined" || value === null) return false;
  if (typeof value === "string" && value.trim().length > 0) return true;
  return false;
};

const isValidRequest = function (object) {
  return Object.keys(object).length > 0;
};

const isValidObjectId = function (objectId) {
  return mongoose.Types.ObjectId.isValid(objectId);
};

const isValidTagsAndSubcategory = function (value) {
  if (typeof value === "undefined" || value === null) return false;
  if (typeof value === "string" && value.trim().length > 0) return true;
  if (typeof value == "object" && Array.isArray(value) == true) return true;
  return false;
};

//******************************************CREATE BLOG********************************************* */

const createBlog = async function (req, res) {
  try {
    const requestBody = req.body;
    const queryParams = req.query;
    const decodedToken = req.decodedToken;

    //query params must be empty
    if (isValidRequest(queryParams)) {
      return res
        .status(400)
        .send({ status: false, message: "invalid request" });
    }
    // request body must not be empty
    if (!isValidRequest(requestBody)) {
      return res
        .status(400)
        .send({ status: false, message: "Blog details are required" });
    }

    //using destructuring
    const { title, body, authorId, category, tags, subcategory, isPublished } =
      requestBody;

    // checking keys inside requestBody
    if (Object.keys(requestBody).length > 7) {
      return res.status(400).send({
        status: false,
        message: "invalid data entry inside request body",
      });
    }

    if (!isValid(title)) {
      return res
        .status(400)
        .send({ status: false, message: " Blog title is required" });
    }

    if (!isValid(body)) {
      return res
        .status(400)
        .send({ status: false, message: " Blog body is required" });
    }

    if (!isValid(authorId)) {
      return res
        .status(400)
        .send({ status: false, message: " authorId is required" });
    }

    if (!isValidObjectId(authorId)) {
      return res
        .status(400)
        .send({ status: false, message: " Enter a valid authorId " });
    }

    const authorByAuthorId = await AuthorModel.findById(authorId);

    if (!authorByAuthorId) {
      return res.status(404).send({
        status: false,
        message: `No author found by ${authorId} `,
      });
    }

    // is author authorized to create this blog
    if (authorId != decodedToken.authorId) {
      return res
        .status(403)
        .send({ status: false, message: "Unauthorized access" });
    }

    if (!isValid(category)) {
      return res
        .status(400)
        .send({ status: false, message: " Blog category is required" });
    }

    // tags and subcategory could be an array or string
    if (requestBody.hasOwnProperty("tags")) {
      if (!isValidTagsAndSubcategory(tags)) {
        return res.status(400).send({
          status: false,
          message: " Blog tags must be in valid format",
        });
      }
    }

    if (requestBody.hasOwnProperty("subcategory")) {
      if (!isValidTagsAndSubcategory(subcategory)) {
        return res.status(400).send({
          status: false,
          message: " Blog subcategory must be in valid format",
        });
      }
    }

    if (requestBody.hasOwnProperty("isPublished")) {
      if (typeof isPublished != "boolean") {
        return res
          .status(400)
          .send({ status: false, message: " isPublished should be boolean" });
      }
    }

    const blogData = {
      title: title.trim(),
      body: body.trim(),
      authorId: authorId,
      category: category.trim(),
      tags: tags,
      subcategory: subcategory,
      isDeleted: false,
      deletedAt: null,
    };

    // if blog is to be published after creation then publishedAt to be updated
    if (isPublished == true) {
      blogData.isPublished = isPublished;
      blogData.publishedAt = Date.now();
    } else {
      blogData.isPublished = false;
      blogData.publishedAt = null;
    }

    const blog = await BlogModel.create(blogData);

    res.status(201).send({
      status: true,
      message: "new blog created successfully",
      data: blog,
    });
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
};

//***************************************ALL BLOGS & FILTERED BLOGS****************************************** */

const getBlogs = async function (req, res) {
  try {
    const requestBody = req.body;
    const queryParams = req.query;

    // conditions to find all not deleted blogs
    const filterCondition = {
      isDeleted: false,
      isPublished: true,
      deletedAt: null,
    };

    if (isValidRequest(requestBody)) {
      return res.status(400).send({
        status: false,
        message: "Data is not required in request body",
      });
    }

    // if queryParams are present then each key to be validate then only to be added to filterCondition object. on that note filtered blogs to be returned
    if (isValidRequest(queryParams)) {
      const { authorId, category, tags, subcategory } = queryParams;

      if (queryParams.hasOwnProperty("authorId")) {
        if (!isValidObjectId(authorId)) {
          return res
            .status(400)
            .send({ status: false, message: " Enter a valid authorId " });
        }
        const authorByAuthorId = await AuthorModel.findById(authorId);

        if (!authorByAuthorId) {
          return res
            .status(404)
            .send({ status: false, message: "no author found" });
        }

        filterCondition["authorId"] = authorId;
      }

      if (queryParams.hasOwnProperty("category")) {
        if (!isValid(category)) {
          return res.status(400).send({
            status: false,
            message: " Blog category should be in valid format",
          });
        }
        filterCondition["category"] = category.trim();
      }
      // If tags and subcategory are an array then validating each element
      if (queryParams.hasOwnProperty("tags")) {
        if (Array.isArray(tags)) {
          for (let i = 0; i < tags.length; i++) {
            if (!isValid(tags[i])) {
              return res.status(400).send({
                status: false,
                message: " Blog tags must be in valid format",
              });
            }
            filterCondition["tags"] = tags[i].trim();
          }
        } else {
          if (!isValid(tags)) {
            return res.status(400).send({
              status: false,
              message: " Blog tags must be in valid format",
            });
          }
          filterCondition["tags"] = tags.trim();
        }
      }

      if (queryParams.hasOwnProperty("subcategory")) {
        if (Array.isArray(subcategory)) {
          for (let i = 0; i < subcategory.length; i++) {
            if (!isValid(subcategory[i])) {
              return res.status(400).send({
                status: false,
                message: " Blog subcategory must be in valid format",
              });
            }
            filterCondition["subcategory"] = subcategory[i].trim();
          }
        } else {
          if (!isValid(subcategory)) {
            return res.status(400).send({
              status: false,
              message: " Blog subcategory must be in valid format",
            });
          }
          filterCondition["subcategory"] = subcategory.trim();
        }
      }

      const filteredBlogs = await BlogModel.find(filterCondition);

      if (filteredBlogs.length == 0) {
        return res
          .status(404)
          .send({ status: false, message: "no blogs found" });
      }

      res.status(200).send({
        status: true,
        message: "filtered blogs list",
        blogsCount: filteredBlogs.length,
        blogList: filteredBlogs,
      });

      //if no queryParams are provided then finding all not deleted blogs
    } else {
      const allBlogs = await BlogModel.find(filterCondition);

      if (allBlogs.length == 0) {
        return res
          .status(404)
          .send({ status: false, message: "no blogs found" });
      }

      res.status(200).send({
        status: true,
        message: "blogs list",
        blogsCount: allBlogs.length,
        blogList: allBlogs,
      });
    }
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
};

//**********************************************UPDATING A BLOG************************************************ */

const updateBlog = async function (req, res) {
  try {
    const blogId = req.params["blogId"];
    const requestBody = req.body;
    const queryParams = req.query;

    if (isValidRequest(queryParams)) {
      return res
        .status(400)
        .send({ status: false, message: "invalid request" });
    }

    if (!isValidRequest(requestBody)) {
      return res.status(400).send({
        status: false,
        message: "Blog details are required for update",
      });
    }

    if (!isValidObjectId(blogId)) {
      return res
        .status(400)
        .send({ status: false, message: `Enter a valid blogID` });
    }

    const blogByBlogId = await BlogModel.findOne({
      _id: blogId,
      isDeleted: false,
      deletedAt: null,
    });

    if (!blogByBlogId) {
      return res
        .status(404)
        .send({ status: false, message: `no blog found by ${blogId}` });
    }
    // using destructuring then validating selected keys by client
    const { title, body, tags, subcategory } = requestBody;

    // update object has been created with two properties. if updating key is a to be replaced && type is string then will be added to $set and if it is to be added && type is an array then will be added to $addToSet

    const update = {
      $set: { isPublished: true, publishedAt: Date.now() },
      $addToSet: {},
    };

    if (requestBody.hasOwnProperty("title")) {
      if (!isValid(title)) {
        return res.status(400).send({
          status: false,
          message: " Blog title should be in valid format",
        });
      }
      update.$set["title"] = title.trim();
    }

    if (requestBody.hasOwnProperty("body")) {
      if (!isValid(body)) {
        return res.status(400).send({
          status: false,
          message: " Blog body should be in valid format",
        });
      }
      update.$set["body"] = body.trim();
    }

    if (requestBody.hasOwnProperty("tags")) {
      if (Array.isArray(tags)) {
        for (let i = 0; i < tags.length; i++) {
          if (!isValid(tags[i])) {
            return res.status(400).send({
              status: false,
              message: " Blog tags must be in valid format",
            });
          }
        }
        update.$addToSet["tags"] = { $each: tags };
      } else {
        if (!isValid(tags)) {
          return res.status(400).send({
            status: false,
            message: " Blog tags must be in valid format",
          });
        }
        update.$addToSet["tags"] = tags.trim();
      }
    }

    if (requestBody.hasOwnProperty("subcategory")) {
      if (Array.isArray(subcategory)) {
        for (let i = 0; i < subcategory.length; i++) {
          if (!isValid(subcategory[i])) {
            return res.status(400).send({
              status: false,
              message: " Blog subcategory must be in valid format",
            });
          }
        }
        update.$addToSet["subcategory"] = { $each: subcategory };
      } else {
        if (!isValid(subcategory)) {
          return res.status(400).send({
            status: false,
            message: " Blog subcategory must be in valid format",
          });
        }
        update.$addToSet["subcategory"] = subcategory.trim();
      }
    }

    const updatedBlog = await BlogModel.findOneAndUpdate(
      { _id: blogId, isDeleted: false, deletedAt: null },
      update,
      { new: true }
    );

    res.status(200).send({
      status: true,
      message: "Blog updated successfully",
      data: updatedBlog,
    });
  } catch (error) {
    res.status(500).send({ status: false, message: error.message });
  }
};

//***************************************DELETING AN INDIVIDUAL BLOG**************************************** */

const deleteBlog = async function (req, res) {
  try {
    const requestBody = req.body;
    const queryParams = req.query;
    const blogId = req.params.blogId;

    if (isValidRequest(queryParams)) {
      return res
        .status(400)
        .send({ status: false, message: "invalid request" });
    }

    if (isValidRequest(requestBody)) {
      return res.status(400).send({
        status: false,
        message: "data is not required inside request body",
      });
    }

    if (!isValidObjectId(blogId)) {
      return res
        .status(400)
        .send({ status: false, message: `${id} is not a valid blogID` });
    }

    const blogByBlogId = await BlogModel.findOne({
      _id: blogId,
      isDeleted: false,
      deletedAt: null,
    });

    if (!blogByBlogId) {
      return res
        .status(404)
        .send({ status: false, message: `no blog found by ${blogId}` });
    }

    const markDirtyBlog = await BlogModel.findByIdAndUpdate(
      { _id: blogId },
      { $set: { isDeleted: true, deletedAt: Date.now() } },
      { new: true }
    );

    res
      .status(200)
      .send({ status: true, message: "Blog successfully deleted" });
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
};

//**********************************DELETING MULTIPLE BLOGS OF SAME AUTHOR***************************************** */

const deleteFilteredBlog = async function (req, res) {
  try {
    const requestBody = req.body;
    const queryParams = req.query;
    const authorIdFromToken = req.decodedToken.authorId;

    if (isValidRequest(requestBody)) {
      return res.status(400).send({
        status: false,
        message: "data is not required inside request body",
      });
    }

    const filterCondition = {
      isDeleted: false,
      deletedAt: null,
      isPublished: false,
      publishedAt: null,
    };
    // first we will find all the filtered blogs then these filteredBlogs will be filtered as per authorization then authorizedBlogs will be deleted
    if (isValidRequest(queryParams)) {
      const { title, authorId, subcategory, tags } = queryParams;

      if (Object.keys(queryParams).length > 4) {
        return res.status(400).send({
          status: false,
          message: "invalid entry inside query params",
        });
      }

      if (queryParams.hasOwnProperty("title")) {
        if (!isValid(title)) {
          return res.status(400).send({
            status: false,
            message: " Blog title should be in valid format",
          });
        }
        filterCondition["title"] = title.trim();
      }

      if (queryParams.hasOwnProperty("authorId")) {
        if (!isValid(authorId)) {
          return res.status(400).send({
            status: false,
            message: " Blog authorId should be in valid format",
          });
        }

        if (!isValidObjectId(authorId)) {
          return res
            .status(400)
            .send({ status: false, message: " Blog authorId is invalid" });
        }

        const authorByAuthorId = await AuthorModel.findById(authorId);

        if (!authorByAuthorId) {
          return res.status(404).send({
            status: false,
            message: ` no author found by ${authorId}`,
          });
        }

        filterCondition["authorId"] = authorId;
      }

      if (queryParams.hasOwnProperty("subcategory")) {
        if (!isValid(subcategory)) {
          return res.status(400).send({
            status: false,
            message: " Blog subcategory must be in valid format",
          });
        }
        filterCondition["subcategory"] = subcategory;
      }

      if (queryParams.hasOwnProperty("tags")) {
        if (!isValid(tags)) {
          return res.status(400).send({
            status: false,
            message: " Blog tags must be in valid format",
          });
        }
        filterCondition["tags"] = tags;
      }

      const filteredBlogs = await BlogModel.find(filterCondition);

      if (Array.isArray(filteredBlogs) && filteredBlogs.length > 0) {
        const blogsToBeDeleted = filteredBlogs.filter((ele) => {
          if (ele.authorId == authorIdFromToken) {
            return ele._id;
          }
        });

        const markDirtyBlogs = await BlogModel.updateMany(
          { _id: { $in: blogsToBeDeleted } },
          { $set: { isDeleted: true, deletedAt: Date.now() } }
        );

        res
          .status(200)
          .send({ status: true, message: "blogs deleted successfully" });
      } else {
        return res
          .status(404)
          .send({ status: false, message: "no blogs found" });
      }
    } else {
      return res.status(400).send({
        status: false,
        message: "data is required for deleting blogs ",
      });
    }
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
};

//**************************************EXPORTING ALL BLOG'S HANDLERS****************************************** */

module.exports = {
  createBlog,
  getBlogs,
  updateBlog,
  deleteBlog,
  deleteFilteredBlog,
};
