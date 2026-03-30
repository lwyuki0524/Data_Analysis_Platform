import express from 'express';
import * as chatController from '../controllers/chatController';

const router = express.Router();

router.post('/', chatController.askChat);
router.get('/history', chatController.getChatHistory);
router.delete('/:id', chatController.deleteChatHistory);

// Chat Room Routes
router.post('/rooms', chatController.createChatRoom);
router.get('/rooms', chatController.getChatRooms);
router.delete('/rooms/:id', chatController.deleteChatRoom);
router.put('/rooms/:id', chatController.updateChatRoom);

export default router;
