const { Router } = require('express');
const jwt = require('jsonwebtoken');
const authenticate = require('../middleware/authenticate');
const GithubUser = require('../models/GithubUser');
const {
  exchangeCodeForToken,
  getGithubProfile,
} = require('../services/github');

const ONE_DAY_IN_MS = 1000 * 60 * 60 * 24;

module.exports = Router()
  .get('/login', async (req, res) => {
    res.redirect(
      `https://github.com/login/oauth/authorize?client_id=${process.env.CLIENT_ID}&scope=user&redirect_uri=${process.env.REDIRECT_URI}`
    );
  })

  .get('/callback', async (req, res, next) => {
    try {
      const { code } = req.query;
      const token = await exchangeCodeForToken(code);
      const profile = await getGithubProfile(token);
      console.log(profile);

      let user = await GithubUser.findByUsername(profile.login);
      if (!user) {
        user = await GithubUser.insert({
          username: profile.login,
          email: profile.email,
          avatar: profile.avatar_url,
        });
      }

      const payload = jwt.sign(user.toJSON(), process.env.JWT_SECRET, {
        expiresIn: '1 day',
      });

      res
        .cookie(process.env.COOKIE_NAME, payload, {
          httpOnly: true,
          maxAge: ONE_DAY_IN_MS,
        })

        .redirect('/api/v1/github/dashboard');
    } catch (err) {
      next(err);
    }
  })

  .get('/dashboard', authenticate, (req, res) => {
    res.json({
      user: req.user,
    });
  })
  .delete('/sessions', (req, res) => {
    res
      .clearCookie(process.env.COOKIE_NAME)
      .json({ sucess: true, message: 'Sign out sucessfuylly' });
  });
