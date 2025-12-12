import { supabase } from '../config/supabaseClient.js';
import { formatResponse } from '../utils/formatResponse.js';

export const getAppointments = async (req, res) => {
  try {
    const userId = req.user.id;
    const role = req.user.role;

    let query = supabase
      .from('appointments')
      .select('*');

    // Filter by user
    query = query.or(`created_by.eq.${userId},attendee_id.eq.${userId}`);

    // Admins can see all
    if (role === 'admin') {
      query = supabase.from('appointments').select('*');
    }

    const { data, error } = await query.order('start_time', { ascending: true });

    if (error) {
      if (error.code === '42P01' || error.message.includes('does not exist')) {
        return res.json(formatResponse(true, 'Appointments retrieved', []));
      }
      return res.status(400).json(formatResponse(false, error.message, null));
    }

    return res.json(formatResponse(true, 'Appointments retrieved', data || []));
  } catch (error) {
    return res.status(500).json(formatResponse(false, error.message, null));
  }
};

export const createAppointment = async (req, res) => {
  try {
    const userId = req.user.id;
    const { project_id, attendee_id, title, description, start_time, end_time, status } = req.body;

    if (!title || !start_time) {
      return res.status(400).json(formatResponse(false, 'Missing required fields: title, start_time', null));
    }

    const appointmentData = {
      created_by: userId,
      project_id: project_id || null,
      attendee_id: attendee_id || null,
      title,
      description: description || null,
      start_time,
      end_time: end_time || null,
      status: status || 'scheduled',
    };

    const { data, error } = await supabase
      .from('appointments')
      .insert(appointmentData)
      .select()
      .single();

    if (error) throw error;

    return res.status(201).json(formatResponse(true, 'Appointment created successfully', data));
  } catch (error) {
    return res.status(500).json(formatResponse(false, error.message, null));
  }
};

export const updateAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const role = req.user.role;

    const { data: appointment } = await supabase
      .from('appointments')
      .select('*')
      .eq('id', id)
      .single();

    if (!appointment) {
      return res.status(404).json(formatResponse(false, 'Appointment not found', null));
    }

    if (appointment.created_by !== userId && role !== 'admin') {
      return res.status(403).json(formatResponse(false, 'Permission denied', null));
    }

    const { project_id, attendee_id, title, description, start_time, end_time, status } = req.body;
    const updateData = {};
    if (project_id !== undefined) updateData.project_id = project_id;
    if (attendee_id !== undefined) updateData.attendee_id = attendee_id;
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (start_time !== undefined) updateData.start_time = start_time;
    if (end_time !== undefined) updateData.end_time = end_time;
    if (status !== undefined) updateData.status = status;

    const { data, error } = await supabase
      .from('appointments')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return res.json(formatResponse(true, 'Appointment updated successfully', data));
  } catch (error) {
    return res.status(500).json(formatResponse(false, error.message, null));
  }
};

export const deleteAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const role = req.user.role;

    const { data: appointment } = await supabase
      .from('appointments')
      .select('*')
      .eq('id', id)
      .single();

    if (!appointment) {
      return res.status(404).json(formatResponse(false, 'Appointment not found', null));
    }

    if (appointment.created_by !== userId && role !== 'admin') {
      return res.status(403).json(formatResponse(false, 'Permission denied', null));
    }

    const { error } = await supabase
      .from('appointments')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return res.json(formatResponse(true, 'Appointment deleted successfully', null));
  } catch (error) {
    return res.status(500).json(formatResponse(false, error.message, null));
  }
};
