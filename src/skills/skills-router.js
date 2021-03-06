'use strict';

const express = require('express');
const { requireAuth } = require('../middleware/jwt-auth');
const SkillsService = require('./skills-service');

const skillsRouter = express.Router();

skillsRouter.use(requireAuth);

skillsRouter.route('/').get(async (req, res, next) => {
  try {
    const skills = await SkillsService.getAllSkills(req.app.get('db'));
    res.status(200).json(skills);
  } catch (error) {
    console.log('THIS IS A TEST', error);
    next(error);
  }
});

module.exports = skillsRouter;
