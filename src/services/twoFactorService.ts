import api from '../store/api';

export const twoFactorService = {
  /**
   * Get TOTP setup information including QR code
   */
  getSetupInfo: async () => {
    const response = await api.get('/2fa/setup/');
    return response.data;
  },
  
  /**
   * Verify a TOTP token
   */
  verifyToken: async (userId: string, token: string) => {
    const response = await api.post('/2fa/verify/', {
      user_id: userId,
      token: token
    });
    return response.data;
  },
  
  /**
   * Get the current 2FA status
   */
  getStatus: async () => {
    const response = await api.get('/2fa/status/');
    return response.data;
  },
  
  /**
   * Disable 2FA
   */
  disable: async () => {
    const response = await api.post('/2fa/disable/');
    return response.data;
  }
};