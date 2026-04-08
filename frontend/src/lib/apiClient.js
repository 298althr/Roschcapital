// Use environment variable for API URL
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1';

class ApiClient {
  constructor(baseURL) {
    this.baseURL = baseURL;
  }

  getAuthHeaders() {
    const token = localStorage.getItem('accessToken');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  async request(path, options = {}) {
    const url = `${this.baseURL}${path}`;
    
    // Don't set Content-Type for FormData - browser will set it with boundary
    const isFormData = options.body instanceof FormData;
    const headers = {
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      ...this.getAuthHeaders(),
      ...(options.headers || {}),
    };
    
    // Remove Content-Type from headers if it's FormData
    if (isFormData && headers['Content-Type'] === 'multipart/form-data') {
      delete headers['Content-Type'];
    }

    const config = {
      credentials: 'include',
      headers,
      ...options,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        // Handle token expiration (but NOT for login/verify endpoints or admin operations)
        if (response.status === 401) {
          // Don't redirect if this is a login, verification, admin, or payment operation
          const isLoginAttempt = path.includes('/auth/login') || path.includes('/auth/register');
          const isAdminOperation = path.includes('/mybanker') || path.includes('/gateways') || path.includes('/currencies');
          const isPaymentOperation = path.includes('/payments') || path.includes('/transfers') || path.includes('/kyc');
          
          // Only auto-logout for regular user operations, not admin/payment operations
          if (!isLoginAttempt && !isAdminOperation && !isPaymentOperation) {
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('user');
            window.location.href = '/login';
          }
          // For admin/payment operations, let the error bubble up without logout
        }

        const error = new Error(data?.error || 'Request failed');
        error.response = { status: response.status, data };
        throw error;
      }

      return data;
    } catch (error) {
      if (!error.response) {
        error.response = { status: 0, data: null };
      }
      throw error;
    }
  }

  get(path, options) {
    return this.request(path, { ...options, method: 'GET' });
  }

  post(path, body, options) {
    return this.request(path, {
      ...options,
      method: 'POST',
      body: body instanceof FormData ? body : JSON.stringify(body),
    });
  }

  put(path, body, options) {
    return this.request(path, {
      ...options,
      method: 'PUT',
      body: body instanceof FormData ? body : JSON.stringify(body),
    });
  }

  patch(path, body, options) {
    return this.request(path, {
      ...options,
      method: 'PATCH',
      body: JSON.stringify(body),
    });
  }

  delete(path, options) {
    return this.request(path, { ...options, method: 'DELETE' });
  }
}

export const apiClient = new ApiClient(API_BASE_URL);

// Legacy support
export async function apiRequest(path, options = {}) {
  return apiClient.request(path, options);
}

export default apiClient;
