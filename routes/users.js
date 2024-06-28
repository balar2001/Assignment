var express = require('express');
var router = express.Router();
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const userModel = require('../model/user');
const postModel = require('../model/blog');
const auth = require('../middleware/auth');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = './uploads/';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir);
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

const userRegister = async (req, res,next) => {

  try {

    const { username, email, password } = req.body;

    const user = new userModel({ 
      username, 
      email, 
      password 
    });
    const data = await user.save();
    res.status(201).json({ 
      message: 'User registered successfully' ,
      data
    });

  } catch (error) {
    
    console.error(error);
    res.status(500).send('Internal Server Error',error); 
  }

}

const userLogin = async (req, res,next) => {

  try {

    const { email, password } = req.body;
    const user = await userModel.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }
  const token = jwt.sign({ userId: user._id }, "shhhhh", { expiresIn: '1h' });

    res.json({ token });

  } catch (error) {
    
    console.error(error);
    res.status(500).send('Internal Server Error'); 
  }

}

const CreatePost = async (req, res,next) => {

  try {

    const { title, content, category } = req.body;
    const { path: featuredImage } = req.file;
    const post = new postModel({
      title,
      content,
      authorId: req.user._id,
      category,
      featuredImage,
    });
    const data = await post.save();
    res.status(201).json({
      message: "Post saved successfully",
      data
    });

  } catch (error) {

    if (req.file) {
      const { path: filePath } = req.file;
      fs.unlink(filePath, err => {
        if (err) {
          console.error("Error deleting file:", err);
        }
      });
    }
    
    console.error(error);
    res.status(500).send('Internal Server Error'); 
  }

}


const getList = async (req, res,next) => {

  try {

    const page = parseInt(req.query.page) || 1; 
    const limit = parseInt(req.query.limit) || 10;

    const filter = {};

    if (req.query.authorId) {
      filter.authorId = { $regex: new RegExp(req.query.authorId, 'i') };
    }

    if (req.query.title) {
      filter.title = { $regex: new RegExp(req.query.title, 'i') };
    }

    if (req.query.content) {
      filter.content = { $regex: new RegExp(req.query.content, 'i') };
    }

    if (req.query.category) {
      filter.category = { $regex: new RegExp(req.query.category, 'i') };
    }

    const posts = await postModel
    .find(filter)
    .populate('authorId', 'username')
    .skip((page - 1) * limit)
    .limit(limit);

    res.json(posts);

  } catch (error) {
    
    console.error(error);
    res.status(500).send('Internal Server Error'); 
  }

}

const updatePost = async (req, res, next) => {
  try {
    const { title, content, category } = req.body;
    let updateFields = { title, content, category };

    if (req.file) {
      updateFields.featuredImage = req.file.path;
    }

    const existingPost = await postModel.findOne({ _id: req.params.id, authorId: req.user._id });
    if (existingPost && existingPost.featuredImage) {
      fs.unlink(existingPost.featuredImage, err => {
        if (err) {
          console.error("Error deleting old image file:", err);
        } else {
          console.log("Old image file deleted successfully");
        }
      });
    }

    const post = await postModel.findOneAndUpdate(
      { _id: req.params.id, authorId: req.user._id },
      { ...updateFields, lastUpdated: Date.now() },
      { new: true }
    );

    if (!post) {
      return res.status(404).json({ error: 'Post not found or not authorized' });
    }

    // Send a success response with the updated post data
    res.json(post);

  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
};

const deletePost = async (req, res, next) => {
  try {
    const post = await postModel.findOne({ _id: req.params.id, authorId: req.user._id });

    if (!post) {
      return res.status(404).json({ error: 'Post not found or not authorized' });
    }

    const deletedPost = await postModel.findOneAndDelete({ _id: req.params.id, authorId: req.user._id });

    if (!deletedPost) {
      return res.status(404).json({ error: 'Post not found or not authorized' });
    }
    if (post.featuredImage) {
      fs.unlink(post.featuredImage, (err) => {
        if (err) {
          console.error("Error deleting featuredImage file:", err);
        } else {
          console.log("FeaturedImage file deleted successfully");
        }
      });
    }

    res.json({ message: 'Post deleted successfully' });

  } catch (error) {
    console.error("Error deleting post:", error);
    res.status(500).send('Internal Server Error');
  }
};


router.post("/createUser", userRegister);
router.post("/login", userLogin);
router.post("/post",auth,upload.single('featuredImage'), CreatePost);
router.get("/listOfPost",auth, getList);
router.put("/updatePost/:id",auth,upload.single('featuredImage'), updatePost);
router.delete("/deletePost/:id",auth, deletePost);


module.exports = router;
