'use strict';
const express = require('express');
const { requireAuth } = require('../middleware/jwt-auth');
const UserSkillsService = require('./user-skills-service');

const userSkillsRouter = express.Router();
const jsonBodyParser = express.json();

userSkillsRouter.use(requireAuth);

userSkillsRouter
  .route('/')
  .get(async (req, res, next) => {
    try {
      const allUsersAndSkills = await UserSkillsService.getAllUsersAndSkills(
        req.app.get('db')
      );
      res.status(200).json(allUsersAndSkills);
    } catch (error) {
      next(error);
    }
  })
  .post(jsonBodyParser, async (req, res, next) => {
    try {
      const { skill_id, skill_desc, user_skill_type, skill_img_url } = req.body;
      const id = req.user.id;
      if (!skill_id) {
        return res.status(400).json({
          error: `Missing skill_id in request body`,
        });
      }
      const linkUserSkill = {
        fk_user_id: id,
        fk_skill_id: skill_id,
        user_skill_type,
        primary_img_url: skill_img_url,
        primary_description: skill_desc,
      };
      const userSkill = await UserSkillsService.postLinkUserSkills(
        req.app.get('db'),
        linkUserSkill
      );
      res.status(201).json(userSkill);
    } catch (error) {
      next(error);
    }
  });
userSkillsRouter.route('/:user_skill_id').delete(async (req, res, next) => {
  try {
    const id = req.params.user_skill_id;
    await UserSkillsService.deleteUserSkillDetailsById(req.app.get('db'), id);
    res.status(200).send('Skill deleted');
  } catch (error) {
    next(error);
  }
});

userSkillsRouter.route('/:user_id').get(async (req, res, next) => {
  try {
    const id = req.params.user_id;
    const userSkills = await UserSkillsService.getLinkUserSkills(
      req.app.get('db'),
      id
    );
    if (userSkills.length === 0) {
      return res
        .status(404)
        .json({ error: `Requested user profile id '${id}' does not exist` });
    }
    res.status(200).json(userSkills);
  } catch (error) {
    next(error);
  }
});

userSkillsRouter
  .route('/details/:user_skill_id') //:user_skill_id is link_user_skill.id
  .get(async (req, res, next) => {
    try {
      const skillDetails = await UserSkillsService.getUserSkillDetailsById(
        req.app.get('db'),
        req.params.user_skill_id
      );
      res.status(200).json(skillDetails);
    } catch (error) {
      next(error);
    }
  });

userSkillsRouter
  .route('/skills/:skill_id') //:skill_id is skill.id ? q = query, t = type, z = zip
  .get(async (req, res, next) => {
    let userSkills = [];
    try {
      userSkills = await UserSkillsService.getUserSkillsBySkill(
        req.app.get('db'),
        req.params.skill_id
      );
      const searchText = req.query.q;
      const skillType = req.query.t;
      const zip = req.query.z;

      if (searchText) {
        const searchFiltered = userSkills.filter((userSkill) => {
          const desc = userSkill.primary_description;
          if (desc) {
            return desc.includes(searchText);
          }
          return false;
        });
        userSkills = searchFiltered;
      }
      if (skillType) {
        const typeFiltered = userSkills.filter((userSkill) => {
          return userSkill.user_skill_type === skillType.toUpperCase();
        });
        userSkills = typeFiltered;
      }

      if (zip) {
        const zipFiltered = userSkills.filter((userSkill) => {
          //need to pull profileZip from user profile

          return userSkill.zip === zip;
        });
        userSkills = zipFiltered;
      }

      res.status(200).json(userSkills);
    } catch (error) {
      next(error);
    }
  });

module.exports = userSkillsRouter;
