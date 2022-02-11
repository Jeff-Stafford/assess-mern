import axios from 'axios';
import { ACCU_LYNX_CONFIG } from '../config/constants';

const accuLynxClient = axios.create({
  baseURL: ACCU_LYNX_CONFIG.API_PATH,
  headers: {
    Accept: 'application/json'
  }
});

export default accuLynxClient;
