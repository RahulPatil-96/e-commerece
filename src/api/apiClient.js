const API_BASE = '/api';

const TOKEN_KEY = 'arihant_access_token';
const REQUEST_TIMEOUT = 10000; // 10 seconds
const MAX_RETRIES = 2;

/** @typedef {Error & { status?: number, data?: unknown }} RequestError */
/** @typedef {RequestInit & { headers?: HeadersInit | Record<string, string> }} RequestOptions */
/** @typedef {Record<string, unknown>} JsonObject */

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (/** @type {string | null} */ token) => token ? localStorage.setItem(TOKEN_KEY, token) : localStorage.removeItem(TOKEN_KEY);

async function fetchWithTimeout(
  /** @type {string} */ url,
  /** @type {RequestOptions} */ options,
  /** @type {number} */ timeoutMs = REQUEST_TIMEOUT
) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}

async function request(
  /** @type {string} */ endpoint,
  /** @type {RequestOptions} */ options = {}
) {
  const token = getToken();
  /** @type {Record<string, string>} */
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...((options.headers && typeof options.headers === 'object' && !Array.isArray(options.headers))
      ? Object.fromEntries(Object.entries(options.headers).filter((entry) => typeof entry[1] === 'string'))
      : {}),
  };

  /** @type {RequestError | undefined} */ let lastError;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await fetchWithTimeout(`${API_BASE}${endpoint}`, {
        ...options,
        headers,
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        /** @type {RequestError} */
        const error = new Error(data.message || `Request failed with status ${response.status}`);
        error.status = response.status;
        error.data = data;
        throw error;
      }

      return data;
    } catch (error) {
      /** @type {RequestError} */
      const requestError = error instanceof Error ? error : new Error('Request failed');
      lastError = requestError;
      // Don't retry on 4xx errors (client errors)
      if (requestError.status && requestError.status >= 400 && requestError.status < 500) {
        throw requestError;
      }
      // Don't retry on last attempt
      if (attempt === MAX_RETRIES) {
        throw requestError;
      }
      // Wait before retry (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 500));
    }
  }

  throw lastError;
}

export const apiClient = {
  auth: {
    loginViaEmailPassword: async (/** @type {string} */ email, /** @type {string} */ password) => {
      const data = await request('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      if (data?.access_token) {
        setToken(data.access_token);
      }
      return data;
    },

    register: async (/** @type {{ email: string, password: string }} */ { email, password }) => {
      const data = await request('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      if (data?.access_token) {
        setToken(data.access_token);
      }
      return data;
    },

    verifyOtp: async (/** @type {{ email: string, otpCode: string }} */ { email, otpCode }) => {
      const data = await request('/auth/verify-otp', {
        method: 'POST',
        body: JSON.stringify({ email, otpCode }),
      });
      if (data?.access_token) {
        setToken(data.access_token);
      }
      return data;
    },

    resendOtp: async (/** @type {string} */ email) => {
      return request('/auth/resend-otp', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });
    },

    resetPasswordRequest: async (/** @type {string} */ email) => {
      return request('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });
    },

    resetPassword: async (/** @type {{ resetToken: string | null, newPassword: string }} */ { resetToken, newPassword }) => {
      return request('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ resetToken, newPassword }),
      });
    },

    me: async () => {
      return request('/auth/me');
    },

    logout: async () => {
      try {
        await request('/auth/logout', { method: 'POST' });
      } catch {
        // Ignore logout errors
      } finally {
        setToken(null);
      }
    },

    loginWithProvider: (/** @type {string} */ provider, /** @type {string} */ redirectUrl = '/') => {
      // Mock OAuth fallback
      window.location.href = redirectUrl;
    },

    setToken,
    getToken,
  },

  payments: {
    config: async () => {
      return request('/payments/config');
    },

    createOrder: async (/** @type {JsonObject} */ payload) => {
      return request('/payments/create-payment-intent', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    },
  },

  entities: {
    Category: {
      list: async () => {
        return request('/categories');
      },

      create: async (/** @type {JsonObject} */ data) => {
        return request('/categories', {
          method: 'POST',
          body: JSON.stringify(data),
        });
      },

      update: async (/** @type {string | number} */ id, /** @type {JsonObject} */ data) => {
        return request(`/categories/${id}`, {
          method: 'PUT',
          body: JSON.stringify(data),
        });
      },

      delete: async (/** @type {string | number} */ id) => {
        return request(`/categories/${id}`, {
          method: 'DELETE',
        });
      },
    },

    Product: {
      list: async (sort = '-created_date', limit = 200) => {
        const queryParams = new URLSearchParams();
        if (sort) queryParams.set('sort', sort);
        if (limit) queryParams.set('limit', limit.toString());
        const data = await request(`/products?${queryParams.toString()}`);
        // The API returns { products: [...], pagination: {...} }, unwrap for consumers
        return Array.isArray(data) ? data : (data?.products || []);
      },

      filter: async (params = {}, sort = '-created_date', limit = 200) => {
        const queryParams = new URLSearchParams();
        Object.entries(params).forEach(([k, v]) => {
          if (v !== undefined && v !== null && v !== '') queryParams.set(k, v);
        });
        if (sort) queryParams.set('sort', sort);
        if (limit) queryParams.set('limit', limit.toString());
        const data = await request(`/products?${queryParams.toString()}`);
        // The API returns { products: [...], pagination: {...} }, unwrap for consumers
        return Array.isArray(data) ? data : (data?.products || []);
      },

      get: async (/** @type {string | number} */ id) => {
        return request(`/products/${id}`);
      },

      create: async (/** @type {JsonObject} */ data) => {
        return request('/products', {
          method: 'POST',
          body: JSON.stringify(data),
        });
      },

      update: async (/** @type {string | number} */ id, /** @type {JsonObject} */ data) => {
        return request(`/products/${id}`, {
          method: 'PUT',
          body: JSON.stringify(data),
        });
      },

      delete: async (/** @type {string | number} */ id) => {
        return request(`/products/${id}`, {
          method: 'DELETE',
        });
      },
    },

    Order: {
      list: async (sort = '-created_date', limit = 200) => {
        return request('/orders');
      },

      create: async (/** @type {JsonObject} */ data) => {
        return request('/orders', {
          method: 'POST',
          body: JSON.stringify(data),
        });
      },

      update: async (/** @type {string | number} */ id, /** @type {JsonObject} */ data) => {
        return request(`/orders/${id}`, {
          method: 'PUT',
          body: JSON.stringify(data),
        });
      },
    },

    B2BInquiry: {
      list: async (sort = '-created_date', limit = 200) => {
        return request('/inquiries');
      },

      filter: async (params = {}) => {
        const queryParams = new URLSearchParams(params);
        return request(`/inquiries?${queryParams.toString()}`);
      },

      create: async (/** @type {JsonObject} */ data) => {
        return request('/inquiries', {
          method: 'POST',
          body: JSON.stringify(data),
        });
      },

      update: async (/** @type {string | number} */ id, /** @type {JsonObject} */ data) => {
        return request(`/inquiries/${id}`, {
          method: 'PUT',
          body: JSON.stringify(data),
        });
      },
    },

    User: {
      list: async () => {
        return request('/users');
      },

      get: async (/** @type {string | number} */ id) => {
        return request(`/users/${id}`);
      },

      updateRole: async (/** @type {string | number} */ id, /** @type {string} */ role) => {
        return request(`/users/${id}/role`, {
          method: 'PUT',
          body: JSON.stringify({ role }),
        });
      },

      delete: async (/** @type {string | number} */ id) => {
        return request(`/users/${id}`, {
          method: 'DELETE',
        });
      },
    },

    CustomizationRule: {
      get: async () => {
        return request('/customization-rules');
      },

      update: async (/** @type {JsonObject} */ data) => {
        return request('/customization-rules', {
          method: 'PUT',
          body: JSON.stringify(data),
        });
      },
    },

    SiteContent: {
      getAll: async () => {
        return request('/site-content');
      },

      get: async (/** @type {string} */ key) => {
        return request(`/site-content/${key}`);
      },

      update: async (/** @type {string} */ key, /** @type {unknown} */ data) => {
        return request(`/site-content/${key}`, {
          method: 'PUT',
          body: JSON.stringify(data),
        });
      },
    },
  },
};

export default apiClient;
