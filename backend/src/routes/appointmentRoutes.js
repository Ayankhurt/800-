// Appointment Routes
import express from 'express';
import { auth } from '../middlewares/auth.js';
import {
  getAppointments,
  createAppointment,
  updateAppointment,
  deleteAppointment,
} from '../controllers/appointmentController.js';

const router = express.Router();

router.get('/', auth, getAppointments);
router.post('/', auth, createAppointment);
router.patch('/:id', auth, updateAppointment);
router.delete('/:id', auth, deleteAppointment);

export default router;

