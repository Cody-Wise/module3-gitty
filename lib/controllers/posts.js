const { Router } = require('express');
const authenticate = require('../middleware/authenticate');
const Post = require('../models/Post');

module.exports = Router()
  .post('/', authenticate, async (req, res, next) => {
    try {
      const data = await Post.insert(req.body);
      res.json(data);
    } catch (err) {
      next(err);
    }
  })

  .get('/', authenticate, async (req, res, next) => {
    try {
      const data = await Post.getAll();
      console.log('data', data);
      res.json(data);
    } catch (err) {
      next(err);
    }
  });
