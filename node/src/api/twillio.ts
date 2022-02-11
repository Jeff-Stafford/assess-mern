import axios from 'axios';
import { TWILIO_CONFIG } from '../config/constants';

const twilioClient = axios.create({
  baseURL: `${TWILIO_CONFIG.HOST}/api/v1`,
  headers: {
    'X-Tone-Twilio': TWILIO_CONFIG.X_TWILIO_CUSTOM_HEADER
  }
});

export default twilioClient;
