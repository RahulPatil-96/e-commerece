const getApiBase = () => {
  /** @type {any} */
  const meta = import.meta;
  const envUrl = meta?.env?.VITE_API_URL;
  if (!envUrl) return '/api';
  const cleanUrl = String(envUrl).trim().replace(/\/+$/, '');
  return cleanUrl.endsWith('/api') ? cleanUrl : `${cleanUrl}/api`;
};

const API_BASE = getApiBase();

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
  newsletter: {
    subscribe: async (/** @type {string} */ email) => {
      return request('/newsletter', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });
    },
  },

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

    loginWithProvider: async (/** @type {string} */ provider, /** @type {string} */ redirectUrl = '/') => {
      // Store the intended redirect URL so the OAuth callback page can return there
      try {
        localStorage.setItem('arihant_oauth_redirect', redirectUrl);
      } catch {
        // Ignore storage errors
      }

      if (provider === 'google') {
        const config = await request('/auth/oauth-config');
        if (!config?.google?.isConfigured || !config.google.authUrl) {
          /** @type {RequestError} */
          const error = new Error('Google sign-in is not configured yet. Please try again later.');
          error.status = 503;
          throw error;
        }
        // Redirect to the backend OAuth start endpoint (full page navigation)
        window.location.href = `${API_BASE}${config.google.authUrl}`;
        return;
      }

      // Unknown provider — fall back gracefully
      /** @type {RequestError} */
      const error = new Error(`Provider "${provider}" is not supported.`);
      error.status = 400;
      throw error;
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
        try {
          const res = await request('/categories');
          return Array.isArray(res) ? res : [];
        } catch (err) {
          console.warn('apiClient: Category.list failed', err);
          return [];
        }
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
        try {
          const queryParams = new URLSearchParams();
          if (sort) queryParams.set('sort', sort);
          if (limit) queryParams.set('limit', limit.toString());
          const data = await request(`/products?${queryParams.toString()}`);
          // The API returns { products: [...], pagination: {...} }, unwrap for consumers
          return Array.isArray(data) ? data : (data?.products || []);
        } catch (err) {
          console.warn('apiClient: Product.list failed', err);
          return [];
        }
      },

      filter: async (params = {}, sort = '-created_date', limit = 200) => {
        try {
          const queryParams = new URLSearchParams();
          Object.entries(params).forEach(([k, v]) => {
            if (v !== undefined && v !== null && v !== '') queryParams.set(k, v);
          });
          if (sort) queryParams.set('sort', sort);
          if (limit) queryParams.set('limit', limit.toString());
          const data = await request(`/products?${queryParams.toString()}`);
          // The API returns { products: [...], pagination: {...} }, unwrap for consumers
          return Array.isArray(data) ? data : (data?.products || []);
        } catch (err) {
          console.warn('apiClient: Product.filter failed', err);
          return [];
        }
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
        try {
          const res = await request('/orders');
          return Array.isArray(res) ? res : [];
        } catch (err) {
          console.warn('apiClient: Order.list failed', err);
          return [];
        }
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
        try {
          const res = await request('/inquiries');
          return Array.isArray(res) ? res : [];
        } catch (err) {
          console.warn('apiClient: B2BInquiry.list failed', err);
          return [];
        }
      },

      filter: async (params = {}) => {
        try {
          const queryParams = new URLSearchParams(params);
          const res = await request(`/inquiries?${queryParams.toString()}`);
          return Array.isArray(res) ? res : [];
        } catch (err) {
          console.warn('apiClient: B2BInquiry.filter failed', err);
          return [];
        }
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
        try {
          const res = await request('/users');
          return Array.isArray(res) ? res : [];
        } catch (err) {
          console.warn('apiClient: User.list failed', err);
          return [];
        }
      },

      getMe: async () => {
        return request('/users/me');
      },

      updateMe: async (/** @type {JsonObject} */ data) => {
        return request('/users/me', {
          method: 'PUT',
          body: JSON.stringify(data),
        });
      },

      changePassword: async (/** @type {JsonObject} */ data) => {
        return request('/users/me/change-password', {
          method: 'POST',
          body: JSON.stringify(data),
        });
      },

      deleteAccount: async (/** @type {JsonObject} */ data) => {
        return request('/users/me/delete-account', {
          method: 'POST',
          body: JSON.stringify(data),
        });
      },

      addresses: {
        list: async () => {
          const res = await request('/users/me/addresses');
          return Array.isArray(res) ? res : [];
        },

        create: async (/** @type {JsonObject} */ data) => {
          return request('/users/me/addresses', {
            method: 'POST',
            body: JSON.stringify(data),
          });
        },

        update: async (/** @type {string | number} */ id, /** @type {JsonObject} */ data) => {
          return request(`/users/me/addresses/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
          });
        },

        setDefault: async (/** @type {string | number} */ id) => {
          return request(`/users/me/addresses/${id}/default`, {
            method: 'PUT',
          });
        },

        delete: async (/** @type {string | number} */ id) => {
          return request(`/users/me/addresses/${id}`, {
            method: 'DELETE',
          });
        },
      },

      create: async (/** @type {JsonObject} */ data) => {
        return request('/users', {
          method: 'POST',
          body: JSON.stringify(data),
        });
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
        try {
          return await request('/site-content');
        } catch (err) {
          console.warn('apiClient: SiteContent.getAll failed', err);
          return {};
        }
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

    Coupon: {
      list: async () => {
        try {
          const res = await request('/coupons');
          return Array.isArray(res) ? res : [];
        } catch (err) {
          console.warn('apiClient: Coupon.list failed', err);
          return [];
        }
      },

      validate: async (/** @type {string} */ code, /** @type {string} */ mode = 'retail', /** @type {number | undefined} */ subtotal) => {
        const params = new URLSearchParams();
        if (mode) params.set('mode', mode);
        if (subtotal !== undefined) params.set('order_subtotal', String(subtotal));
        return request(`/coupons/validate/${encodeURIComponent(code)}?${params.toString()}`);
      },

      apply: async (/** @type {string} */ coupon_code) => {
        return request('/coupons/apply', {
          method: 'POST',
          body: JSON.stringify({ coupon_code }),
        });
      },

      create: async (/** @type {JsonObject} */ data) => {
        return request('/coupons', {
          method: 'POST',
          body: JSON.stringify(data),
        });
      },

      update: async (/** @type {string | number} */ id, /** @type {JsonObject} */ data) => {
        return request(`/coupons/${id}`, {
          method: 'PUT',
          body: JSON.stringify(data),
        });
      },

      delete: async (/** @type {string | number} */ id) => {
        return request(`/coupons/${id}`, {
          method: 'DELETE',
        });
      },
    },

    Review: {
      list: async (/** @type {string | number} */ product_id, /** @type {string} */ sort = 'recent') => {
        try {
          const res = await request(`/reviews?product_id=${product_id}&sort=${sort}`);
          return Array.isArray(res) ? res : [];
        } catch (err) {
          console.warn('apiClient: Review.list failed', err);
          return [];
        }
      },

      stats: async (/** @type {string | number} */ product_id) => {
        try {
          return await request(`/reviews/product/${product_id}/stats`);
        } catch (err) {
          console.warn('apiClient: Review.stats failed', err);
          return { totalReviews: 0, avgRating: 0, distribution: { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 } };
        }
      },

      create: async (/** @type {JsonObject} */ data) => {
        return request('/reviews', {
          method: 'POST',
          body: JSON.stringify(data),
        });
      },

      delete: async (/** @type {string | number} */ id) => {
        return request(`/reviews/${id}`, {
          method: 'DELETE',
        });
      },

      helpful: async (/** @type {string | number} */ id) => {
        return request(`/reviews/${id}/helpful`, {
          method: 'PUT',
        });
      },
    },

    Wishlist: {
      list: async () => {
        try {
          const res = await request('/users/wishlist');
          return Array.isArray(res) ? res : [];
        } catch (err) {
          console.warn('apiClient: Wishlist.list failed', err);
          return [];
        }
      },

      add: async (/** @type {string | number} */ product_id) => {
        return request(`/users/wishlist/${product_id}`, {
          method: 'POST',
        });
      },

      remove: async (/** @type {string | number} */ product_id) => {
        return request(`/users/wishlist/${product_id}`, {
          method: 'DELETE',
        });
      },

      check: async (/** @type {string | number} */ product_id) => {
        try {
          return await request(`/users/wishlist/check/${product_id}`);
        } catch (err) {
          console.warn('apiClient: Wishlist.check failed', err);
          return { in_wishlist: false };
        }
      },
    },
  },
};

export default apiClient;
