const express = require('express');
const router = express.Router();
const { 
    getUsers, 
    getUserById, 
    createUser, 
    updateUser, 
    deleteUser
} = require('../controllers/userController');

const { handleAvatarUpload, uploadAvatar } = require('../controllers/uploadController');

const { authenticate, authorize } = require('../middlewares/authMiddleware');
router.use(authenticate);

router.get('/', getUsers); 
router.get('/:userId', getUserById);
router.post('/avatar', handleAvatarUpload, uploadAvatar);

router.post('/', authorize(['ADMIN']), createUser);
router.patch('/:userId', authorize(['ADMIN']), updateUser);
router.delete('/:userId', authorize(['ADMIN']), deleteUser);

module.exports = router;