import apiClient from '@/apiClients';

interface VerificationResponse {
  success: boolean;
  message: string;
}

export const verifyEmail = async (token: string): Promise<VerificationResponse> => {
  try {
    const response = await apiClient.post('/clubauth/verify', { token });
    return {
      success: true,
      message: 'Email verificado exitosamente'
    };
  } catch (error: any) {
    console.error('Error al verificar email:', error);
    return {
      success: false,
      message: error.response?.data?.message || 'Error al verificar el email'
    };
  }
}; 