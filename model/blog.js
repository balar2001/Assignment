const mongoose = require('mongoose');


const BlogPostSchema = new mongoose.Schema({
    title: {
      type: String,
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    authorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    publishDate: {
      type: Date,
      default: Date.now,
    },
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
    category: {
      type: String,
    },
    featuredImage: {
      type: String,
    },
  });


const postModel = mongoose.model('Post', BlogPostSchema);

module.exports = postModel;
