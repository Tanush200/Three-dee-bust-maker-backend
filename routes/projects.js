const express = require("express");

const {getMyProjects , getProject , createProject , updateProject , deleteProject} = require('../controllers/projectController');
const {auth} = require('../middleware/auth')

const router = express.Router();
router.use(auth);

router.route('/').get(getMyProjects).post(createProject)
router.route('/:id').get(getProject).patch(updateProject).delete(deleteProject)

module.exports = router