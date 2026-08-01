import swaggerJSDoc from 'swagger-jsdoc';

// ============================================================================
// ⚡ ARIHANT E-COMMERCE — OPENAPI 3.0 SPECIFICATION
// ============================================================================

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Arihant Stationery API',
    version: '1.0.0',
    description: `REST API for the Arihant premium handcrafted stationery store.

## Auth
Most protected endpoints accept a JWT via the \`Authorization: Bearer <token>\` header.
Public auth endpoints live under \`/api/auth\`. Google OAuth flow:

1. \`GET /api/auth/oauth-config\` — check whether Google OAuth is configured
2. \`GET /api/auth/google\` — redirects the browser to Google's consent screen
3. \`GET /api/auth/google/callback\` — Google redirects back with a \`?access_token=\` that the frontend stores

Interactive docs are available at \`/api-docs\`.`,
    contact: {
      name: 'Arihant Support',
      email: 'hello@arihant.co',
    },
    license: {
      name: 'Proprietary',
    },
  },
  servers: [
    { url: '/api', description: 'Default API prefix (local/prod)' },
    { url: 'http://localhost:5000/api', description: 'Local development server' },
  ],
  tags: [
    { name: 'Auth', description: 'Authentication, OTP, password reset, Google OAuth' },
    { name: 'Products', description: 'Product catalog, search, filters' },
    { name: 'Categories', description: 'Product categories' },
    { name: 'Orders', description: 'Order placement, history, status updates' },
    { name: 'Reviews', description: 'Product reviews & ratings' },
    { name: 'Coupons', description: 'Discount coupon validation & management' },
    { name: 'B2B Inquiries', description: 'Wholesale/bulk purchase inquiries' },
    { name: 'Newsletter', description: 'Newsletter subscriptions' },
    { name: 'Payments', description: 'Payment gateway (Razorpay) integration' },
    { name: 'Users', description: 'User profiles, wishlist, admin user management' },
    { name: 'Site Content', description: 'CMS content for storefront sections' },
    { name: 'Customization', description: 'Product personalization rules' },
    { name: 'Reports', description: 'Admin analytics & reporting' },
    { name: 'System', description: 'Health check & API metadata' },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Paste your JWT access token.',
      },
    },
    schemas: {
      User: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          email: { type: 'string', format: 'email', example: 'user@example.com' },
          role: { type: 'string', enum: ['user', 'admin', 'b2b'], example: 'user' },
          is_verified: { type: 'boolean', example: true },
          first_name: { type: 'string', example: 'Priya' },
          last_name: { type: 'string', example: 'Sharma' },
          phone: { type: 'string', example: '9876543210' },
          avatar_url: { type: 'string', nullable: true },
          auth_provider: { type: 'string', enum: ['local', 'google'], example: 'local' },
          created_at: { type: 'string', format: 'date-time' },
        },
      },
      AuthResponse: {
        type: 'object',
        properties: {
          access_token: { type: 'string', description: 'JWT access token' },
          user: { $ref: '#/components/schemas/User' },
        },
      },
      Product: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          name: { type: 'string' },
          slug: { type: 'string' },
          description: { type: 'string' },
          long_description: { type: 'string' },
          price: { type: 'number', format: 'float' },
          wholesale_price: { type: 'number', format: 'float', nullable: true },
          category: { type: 'string' },
          audience: { type: 'string', enum: ['retail', 'wholesale', 'both'] },
          image_url: { type: 'string' },
          gallery: { type: 'array', items: { type: 'string' } },
          stock: { type: 'integer' },
          sku: { type: 'string' },
          tags: { type: 'array', items: { type: 'string' } },
          rating: { type: 'number', format: 'float' },
          featured: { type: 'boolean' },
          bulk_min_qty: { type: 'integer' },
          personalizable: { type: 'boolean' },
          customization_price: { type: 'number', format: 'float' },
          created_at: { type: 'string', format: 'date-time' },
        },
      },
      ProductList: {
        type: 'object',
        properties: {
          products: { type: 'array', items: { $ref: '#/components/schemas/Product' } },
          pagination: {
            type: 'object',
            properties: {
              page: { type: 'integer' },
              limit: { type: 'integer' },
              total: { type: 'integer' },
              totalPages: { type: 'integer' },
              hasNext: { type: 'boolean' },
              hasPrev: { type: 'boolean' },
            },
          },
        },
      },
      Category: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          name: { type: 'string' },
          slug: { type: 'string' },
          description: { type: 'string' },
          image_url: { type: 'string' },
          display_order: { type: 'integer' },
          created_at: { type: 'string', format: 'date-time' },
        },
      },
      OrderItem: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          product_id: { type: 'integer' },
          name: { type: 'string' },
          qty: { type: 'integer' },
          price: { type: 'number', format: 'float' },
          image_url: { type: 'string' },
          customization: { type: 'object', nullable: true },
        },
      },
      Order: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          user_id: { type: 'integer', nullable: true },
          customer_name: { type: 'string' },
          email: { type: 'string', format: 'email' },
          phone: { type: 'string' },
          address: { type: 'string' },
          city: { type: 'string' },
          pincode: { type: 'string' },
          state: { type: 'string' },
          items: { type: 'array', items: { $ref: '#/components/schemas/OrderItem' } },
          subtotal: { type: 'number', format: 'float' },
          shipping: { type: 'number', format: 'float' },
          total: { type: 'number', format: 'float' },
          payment_method: { type: 'string', enum: ['cod', 'card', 'upi', 'razorpay', 'stripe'] },
          payment_status: { type: 'string', enum: ['pending', 'paid', 'failed', 'refunded'] },
          order_type: { type: 'string', enum: ['retail', 'b2b', 'bulk'] },
          status: { type: 'string', enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'] },
          tracking_number: { type: 'string', nullable: true },
          created_at: { type: 'string', format: 'date-time' },
        },
      },
      Review: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          user_id: { type: 'integer' },
          product_id: { type: 'integer' },
          rating: { type: 'integer', minimum: 1, maximum: 5 },
          title: { type: 'string' },
          review_text: { type: 'string' },
          verified_purchase: { type: 'boolean' },
          helpful_count: { type: 'integer' },
          created_at: { type: 'string', format: 'date-time' },
        },
      },
      ReviewStats: {
        type: 'object',
        properties: {
          totalReviews: { type: 'integer' },
          avgRating: { type: 'number', format: 'float' },
          distribution: {
            type: 'object',
            additionalProperties: { type: 'integer' },
          },
        },
      },
      Coupon: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          code: { type: 'string' },
          description: { type: 'string' },
          discount_type: { type: 'string', enum: ['percentage', 'fixed'] },
          discount_value: { type: 'number', format: 'float' },
          min_order_value: { type: 'number', format: 'float', nullable: true },
          max_uses: { type: 'integer', nullable: true },
          current_uses: { type: 'integer' },
          valid_from: { type: 'string', format: 'date-time' },
          valid_until: { type: 'string', format: 'date-time', nullable: true },
          is_active: { type: 'boolean' },
          applicable_to: { type: 'string', enum: ['all', 'retail', 'wholesale'] },
        },
      },
      B2BInquiry: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          company_name: { type: 'string' },
          contact_name: { type: 'string' },
          email: { type: 'string', format: 'email' },
          phone: { type: 'string' },
          gst_number: { type: 'string' },
          products: { type: 'string' },
          quantity: { type: 'string' },
          message: { type: 'string' },
          status: { type: 'string', enum: ['new', 'contacted', 'quoted', 'closed'] },
          created_at: { type: 'string', format: 'date-time' },
        },
      },
      Error: {
        type: 'object',
        properties: {
          message: { type: 'string' },
        },
      },
    },
  },
  paths: {
    // ------------------------------------------------------------------ AUTH
    '/auth/register': {
      post: {
        tags: ['Auth'],
        summary: 'Register a new user',
        description: 'Creates a local account and sends a verification OTP email.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', format: 'email' },
                  password: { type: 'string', minLength: 8 },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: 'Registration pending email verification',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: { type: 'string' },
                    user: { $ref: '#/components/schemas/User' },
                  },
                },
              },
            },
          },
          400: { description: 'Email already registered or validation error', $ref: '#/components/schemas/Error' },
        },
      },
    },
    '/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Log in with email and password',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', format: 'email' },
                  password: { type: 'string', minLength: 8 },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Login success', content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthResponse' } } } },
          401: { description: 'Invalid credentials' },
          403: { description: 'Email not verified' },
        },
      },
    },
    '/auth/verify-otp': {
      post: {
        tags: ['Auth'],
        summary: 'Verify email with OTP code',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'otpCode'],
                properties: {
                  email: { type: 'string', format: 'email' },
                  otpCode: { type: 'string', minLength: 4, maxLength: 6 },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Email verified, returns JWT', content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthResponse' } } } },
          400: { description: 'Invalid or expired verification code' },
        },
      },
    },
    '/auth/resend-otp': {
      post: {
        tags: ['Auth'],
        summary: 'Resend verification OTP',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email'],
                properties: { email: { type: 'string', format: 'email' } },
              },
            },
          },
        },
        responses: {
          200: { description: 'OTP sent' },
        },
      },
    },
    '/auth/forgot-password': {
      post: {
        tags: ['Auth'],
        summary: 'Request password reset email',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email'],
                properties: { email: { type: 'string', format: 'email' } },
              },
            },
          },
        },
        responses: {
          200: { description: 'Reset link sent if account exists' },
        },
      },
    },
    '/auth/reset-password': {
      post: {
        tags: ['Auth'],
        summary: 'Reset password with token',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['resetToken', 'newPassword'],
                properties: {
                  resetToken: { type: 'string' },
                  newPassword: { type: 'string', minLength: 8 },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Password reset successfully' },
          400: { description: 'Reset token invalid or expired' },
        },
      },
    },
    '/auth/oauth-config': {
      get: {
        tags: ['Auth'],
        summary: 'Check Google OAuth configuration status',
        responses: {
          200: {
            description: 'OAuth config status',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    google: {
                      type: 'object',
                      properties: {
                        isConfigured: { type: 'boolean' },
                        authUrl: { type: 'string', nullable: true },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/auth/google': {
      get: {
        tags: ['Auth'],
        summary: 'Start Google OAuth flow (redirects to Google)',
        responses: {
          302: { description: 'Redirects to Google consent screen' },
          503: { description: 'Google OAuth not configured' },
        },
      },
    },
    '/auth/google/callback': {
      get: {
        tags: ['Auth'],
        summary: 'Google OAuth callback (internal)',
        description: 'Google redirects the browser here after consent. Redirects to the frontend `/oauth-callback` page with `?access_token=` and `?user=` query params.',
        responses: {
          302: { description: 'Redirect to frontend callback page' },
          503: { description: 'Google OAuth not configured' },
        },
      },
    },
    '/auth/me': {
      get: {
        tags: ['Auth'],
        summary: 'Get current authenticated user',
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'Current user profile', content: { 'application/json': { schema: { $ref: '#/components/schemas/User' } } } },
          401: { description: 'Not authenticated or token invalid' },
        },
      },
    },
    '/auth/logout': {
      post: {
        tags: ['Auth'],
        summary: 'Log out (stateless JWT — client discards token)',
        responses: {
          200: { description: 'Logged out' },
        },
      },
    },

    // -------------------------------------------------------------- PRODUCTS
    '/products': {
      get: {
        tags: ['Products'],
        summary: 'List products with filters, search, pagination, sorting',
        parameters: [
          { name: 'category', in: 'query', required: false, schema: { type: 'string' } },
          { name: 'audience', in: 'query', required: false, schema: { type: 'string', enum: ['retail', 'wholesale', 'both'] } },
          { name: 'search', in: 'query', required: false, schema: { type: 'string' } },
          { name: 'sort', in: 'query', required: false, schema: { type: 'string', enum: ['price-low', 'price-high', 'rating', 'created_at'] } },
          { name: 'limit', in: 'query', required: false, schema: { type: 'integer', default: 200 } },
          { name: 'page', in: 'query', required: false, schema: { type: 'integer', default: 1 } },
        ],
        responses: {
          200: { description: 'Product list with pagination', content: { 'application/json': { schema: { $ref: '#/components/schemas/ProductList' } } } },
        },
      },
      post: {
        tags: ['Products'],
        summary: 'Create a new product',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/Product' } } },
        },
        responses: {
          200: { description: 'Product created', content: { 'application/json': { schema: { $ref: '#/components/schemas/Product' } } } },
          500: { description: 'Creation failed' },
        },
      },
    },
    '/products/{id}': {
      get: {
        tags: ['Products'],
        summary: 'Get a product by numeric id or slug',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: { description: 'Product detail', content: { 'application/json': { schema: { $ref: '#/components/schemas/Product' } } } },
          404: { description: 'Product not found' },
        },
      },
      put: {
        tags: ['Products'],
        summary: 'Update a product',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/Product' } } },
        },
        responses: {
          200: { description: 'Product updated' },
          404: { description: 'Product not found' },
        },
      },
      delete: {
        tags: ['Products'],
        summary: 'Delete a product',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: { description: 'Product deleted' },
        },
      },
    },

    // ------------------------------------------------------------ CATEGORIES
    '/categories': {
      get: {
        tags: ['Categories'],
        summary: 'List all categories',
        responses: {
          200: { description: 'Category list', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Category' } } } } },
        },
      },
      post: {
        tags: ['Categories'],
        summary: 'Create category (admin)',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name'],
                properties: {
                  name: { type: 'string' },
                  description: { type: 'string' },
                  image_url: { type: 'string' },
                  display_order: { type: 'integer' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Category created' },
          400: { description: 'Validation error or duplicate name' },
        },
      },
    },
    '/categories/{id}': {
      put: {
        tags: ['Categories'],
        summary: 'Update category (admin)',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  description: { type: 'string' },
                  image_url: { type: 'string' },
                  display_order: { type: 'integer' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Category updated' },
          404: { description: 'Category not found' },
        },
      },
      delete: {
        tags: ['Categories'],
        summary: 'Delete category (admin)',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: {
          200: { description: 'Category deleted' },
        },
      },
    },

    // ---------------------------------------------------------------- ORDERS
    '/orders': {
      get: {
        tags: ['Orders'],
        summary: 'List orders (own orders, or all for admin)',
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'Order list', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Order' } } } } },
          401: { description: 'Authentication required' },
        },
      },
      post: {
        tags: ['Orders'],
        summary: 'Place a new order',
        security: [{ bearerAuth: [] }],
        description: 'Validates and deducts stock in a transaction, sends confirmation email.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['customer_name', 'email', 'items', 'total'],
                properties: {
                  customer_name: { type: 'string' },
                  email: { type: 'string', format: 'email' },
                  phone: { type: 'string' },
                  address: { type: 'string' },
                  city: { type: 'string' },
                  pincode: { type: 'string' },
                  state: { type: 'string' },
                  items: { type: 'array', items: { $ref: '#/components/schemas/OrderItem' } },
                  subtotal: { type: 'number', format: 'float' },
                  shipping: { type: 'number', format: 'float' },
                  total: { type: 'number', format: 'float' },
                  order_type: { type: 'string', enum: ['retail', 'b2b', 'bulk'] },
                  payment_method: { type: 'string', enum: ['cod', 'card', 'upi', 'razorpay', 'stripe'] },
                  payment_status: { type: 'string', enum: ['pending', 'paid', 'failed', 'refunded'] },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Order created', content: { 'application/json': { schema: { $ref: '#/components/schemas/Order' } } } },
          400: { description: 'Invalid items or insufficient stock' },
        },
      },
    },
    '/orders/{id}': {
      put: {
        tags: ['Orders'],
        summary: 'Update order status (admin) or cancel (user)',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  status: { type: 'string', enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'] },
                  tracking_number: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Order updated' },
          404: { description: 'Order not found' },
          403: { description: 'Not authorized' },
        },
      },
    },

    // --------------------------------------------------------------- REVIEWS
    '/reviews': {
      get: {
        tags: ['Reviews'],
        summary: 'List reviews for a product',
        parameters: [
          { name: 'product_id', in: 'query', required: true, schema: { type: 'integer' } },
          { name: 'sort', in: 'query', required: false, schema: { type: 'string', enum: ['recent', 'helpful'] } },
        ],
        responses: {
          200: { description: 'Review list', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Review' } } } } },
          400: { description: 'product_id required' },
        },
      },
      post: {
        tags: ['Reviews'],
        summary: 'Create a review (authenticated)',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['product_id', 'rating'],
                properties: {
                  product_id: { type: 'integer' },
                  rating: { type: 'integer', minimum: 1, maximum: 5 },
                  title: { type: 'string' },
                  review_text: { type: 'string' },
                  verified_purchase: { type: 'boolean' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Review created' },
          400: { description: 'Duplicate review or invalid rating' },
        },
      },
    },
    '/reviews/{id}': {
      put: {
        tags: ['Reviews'],
        summary: 'Update review (owner or admin)',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  rating: { type: 'integer', minimum: 1, maximum: 5 },
                  title: { type: 'string' },
                  review_text: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Review updated' },
          403: { description: 'Not authorized' },
          404: { description: 'Review not found' },
        },
      },
      delete: {
        tags: ['Reviews'],
        summary: 'Delete review (owner or admin)',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: {
          200: { description: 'Review deleted' },
          403: { description: 'Not authorized' },
        },
      },
    },
    '/reviews/{id}/helpful': {
      put: {
        tags: ['Reviews'],
        summary: 'Increment helpful count',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: {
          200: { description: 'Helpful count incremented' },
          404: { description: 'Review not found' },
        },
      },
    },
    '/reviews/product/{product_id}/stats': {
      get: {
        tags: ['Reviews'],
        summary: 'Get review statistics for a product',
        parameters: [{ name: 'product_id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: {
          200: { description: 'Review stats', content: { 'application/json': { schema: { $ref: '#/components/schemas/ReviewStats' } } } },
        },
      },
    },

    // --------------------------------------------------------------- COUPONS
    '/coupons/validate/{code}': {
      get: {
        tags: ['Coupons'],
        summary: 'Validate a coupon code',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'code', in: 'path', required: true, schema: { type: 'string' } },
          { name: 'order_subtotal', in: 'query', required: false, schema: { type: 'number' } },
          { name: 'mode', in: 'query', required: false, schema: { type: 'string', enum: ['retail', 'wholesale'] } },
        ],
        responses: {
          200: { description: 'Coupon details', content: { 'application/json': { schema: { $ref: '#/components/schemas/Coupon' } } } },
          404: { description: 'Coupon not found or expired' },
          400: { description: 'Coupon limit reached / not applicable' },
        },
      },
    },
    '/coupons/apply': {
      post: {
        tags: ['Coupons'],
        summary: 'Apply a coupon (increments usage count)',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['coupon_code'],
                properties: { coupon_code: { type: 'string' } },
              },
            },
          },
        },
        responses: {
          200: { description: 'Coupon applied' },
          400: { description: 'Could not apply coupon' },
        },
      },
    },
    '/coupons': {
      get: {
        tags: ['Coupons'],
        summary: 'List all coupons (admin)',
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'Coupon list', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Coupon' } } } } },
        },
      },
      post: {
        tags: ['Coupons'],
        summary: 'Create coupon (admin)',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['code', 'discount_type', 'discount_value'],
                properties: {
                  code: { type: 'string' },
                  description: { type: 'string' },
                  discount_type: { type: 'string', enum: ['percentage', 'fixed'] },
                  discount_value: { type: 'number', format: 'float' },
                  min_order_value: { type: 'number', format: 'float' },
                  max_uses: { type: 'integer' },
                  valid_from: { type: 'string', format: 'date-time' },
                  valid_until: { type: 'string', format: 'date-time' },
                  applicable_to: { type: 'string', enum: ['all', 'retail', 'wholesale'] },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Coupon created' },
          400: { description: 'Validation error or duplicate code' },
        },
      },
    },
    '/coupons/{id}': {
      put: {
        tags: ['Coupons'],
        summary: 'Update coupon (admin)',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  code: { type: 'string' },
                  description: { type: 'string' },
                  discount_type: { type: 'string' },
                  discount_value: { type: 'number' },
                  min_order_value: { type: 'number' },
                  max_uses: { type: 'integer' },
                  valid_from: { type: 'string' },
                  valid_until: { type: 'string' },
                  is_active: { type: 'boolean' },
                  applicable_to: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Coupon updated' },
          404: { description: 'Coupon not found' },
        },
      },
      delete: {
        tags: ['Coupons'],
        summary: 'Delete coupon (admin)',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: {
          200: { description: 'Coupon deleted' },
        },
      },
    },

    // ------------------------------------------------------- B2B INQUIRIES
    '/inquiries': {
      get: {
        tags: ['B2B Inquiries'],
        summary: 'List B2B inquiries (admin)',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'status', in: 'query', required: false, schema: { type: 'string' } }],
        responses: {
          200: { description: 'Inquiry list', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/B2BInquiry' } } } } },
        },
      },
      post: {
        tags: ['B2B Inquiries'],
        summary: 'Submit a B2B/wholesale inquiry',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['company_name', 'contact_name', 'email', 'phone'],
                properties: {
                  company_name: { type: 'string' },
                  contact_name: { type: 'string' },
                  email: { type: 'string', format: 'email' },
                  phone: { type: 'string' },
                  gst_number: { type: 'string' },
                  products: { type: 'string' },
                  quantity: { type: 'string' },
                  message: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Inquiry created' },
          400: { description: 'Validation error' },
        },
      },
    },
    '/inquiries/{id}': {
      put: {
        tags: ['B2B Inquiries'],
        summary: 'Update inquiry status (admin)',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['status'],
                properties: { status: { type: 'string', enum: ['new', 'contacted', 'quoted', 'closed'] } },
              },
            },
          },
        },
        responses: {
          200: { description: 'Inquiry updated' },
          404: { description: 'Inquiry not found' },
        },
      },
    },

    // ------------------------------------------------------------- NEWSLETTER
    '/newsletter': {
      post: {
        tags: ['Newsletter'],
        summary: 'Subscribe to newsletter',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email'],
                properties: { email: { type: 'string', format: 'email' } },
              },
            },
          },
        },
        responses: {
          200: { description: 'Subscribed' },
          400: { description: 'Invalid email' },
        },
      },
    },

    // -------------------------------------------------------------- PAYMENTS
    '/payments/config': {
      get: {
        tags: ['Payments'],
        summary: 'Get payment gateway config (Razorpay publishable key)',
        responses: {
          200: {
            description: 'Payment config',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    publishableKey: { type: 'string' },
                    isConfigured: { type: 'boolean' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/payments/create-payment-intent': {
      post: {
        tags: ['Payments'],
        summary: 'Create a Razorpay payment order',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['amount'],
                properties: {
                  amount: { type: 'number', format: 'float' },
                  currency: { type: 'string', default: 'inr' },
                  order_id: { type: 'string' },
                  metadata: { type: 'object' },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Razorpay order created',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    clientSecret: { type: 'string' },
                    paymentIntentId: { type: 'string' },
                    amount: { type: 'number' },
                    currency: { type: 'string' },
                    orderId: { type: 'string' },
                    keyId: { type: 'string' },
                  },
                },
              },
            },
          },
          503: { description: 'Payment service not configured' },
        },
      },
    },
    '/payments/webhook': {
      post: {
        tags: ['Payments'],
        summary: 'Razorpay webhook endpoint (raw body, signature verified)',
        responses: {
          200: { description: 'Webhook received' },
          400: { description: 'Signature verification failed' },
        },
      },
    },

    // ---------------------------------------------------------------- USERS
    '/users': {
      get: {
        tags: ['Users'],
        summary: 'List all users (admin)',
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'User list', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/User' } } } } },
        },
      },
      post: {
        tags: ['Users'],
        summary: 'Create a user (admin)',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', format: 'email' },
                  password: { type: 'string', minLength: 8 },
                  role: { type: 'string', enum: ['user', 'admin'] },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'User created' },
          400: { description: 'Email already exists' },
        },
      },
    },
    '/users/{id}': {
      get: {
        tags: ['Users'],
        summary: 'Get user by id (admin)',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: {
          200: { description: 'User detail' },
          404: { description: 'User not found' },
        },
      },
      delete: {
        tags: ['Users'],
        summary: 'Delete user (admin)',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: {
          200: { description: 'User deleted' },
          400: { description: 'Cannot delete own account' },
        },
      },
    },
    '/users/{id}/role': {
      put: {
        tags: ['Users'],
        summary: 'Update user role (admin)',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['role'],
                properties: { role: { type: 'string', enum: ['user', 'admin'] } },
              },
            },
          },
        },
        responses: {
          200: { description: 'Role updated' },
          404: { description: 'User not found' },
        },
      },
    },
    '/users/me': {
      get: {
        tags: ['Users'],
        summary: 'Get current user profile',
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'Profile', content: { 'application/json': { schema: { $ref: '#/components/schemas/User' } } } },
        },
      },
      put: {
        tags: ['Users'],
        summary: 'Update current user profile',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  first_name: { type: 'string' },
                  last_name: { type: 'string' },
                  phone: { type: 'string', pattern: '^\\d{10}$' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Profile updated' },
        },
      },
    },
    '/users/me/change-password': {
      post: {
        tags: ['Users'],
        summary: 'Change current user password',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['current_password', 'new_password'],
                properties: {
                  current_password: { type: 'string', minLength: 8 },
                  new_password: { type: 'string', minLength: 8 },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Password changed' },
          401: { description: 'Current password incorrect' },
        },
      },
    },
    '/users/me/delete-account': {
      post: {
        tags: ['Users'],
        summary: 'Delete current user account',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['password'],
                properties: { password: { type: 'string' } },
              },
            },
          },
        },
        responses: {
          200: { description: 'Account deleted' },
          401: { description: 'Password incorrect' },
        },
      },
    },
    '/users/wishlist': {
      get: {
        tags: ['Users'],
        summary: 'Get current user wishlist',
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'Wishlist products' },
        },
      },
    },
    '/users/wishlist/{product_id}': {
      post: {
        tags: ['Users'],
        summary: 'Add product to wishlist',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'product_id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: {
          201: { description: 'Added to wishlist' },
          404: { description: 'Product not found' },
        },
      },
      delete: {
        tags: ['Users'],
        summary: 'Remove product from wishlist',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'product_id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: {
          200: { description: 'Removed from wishlist' },
        },
      },
    },
    '/users/wishlist/check/{product_id}': {
      get: {
        tags: ['Users'],
        summary: 'Check if product is in wishlist',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'product_id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: {
          200: { description: 'Wishlist status', content: { 'application/json': { schema: { type: 'object', properties: { in_wishlist: { type: 'boolean' } } } } } },
        },
      },
    },

    // ---------------------------------------------------------- SITE CONTENT
    '/site-content': {
      get: {
        tags: ['Site Content'],
        summary: 'Get all site content (storefront CMS)',
        responses: {
          200: { description: 'Key-value map of site content' },
        },
      },
    },
    '/site-content/{key}': {
      get: {
        tags: ['Site Content'],
        summary: 'Get a specific site content key',
        parameters: [{ name: 'key', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: { description: 'Site content value' },
          404: { description: 'Key not found' },
        },
      },
      put: {
        tags: ['Site Content'],
        summary: 'Update site content key (admin)',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'key', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object' } } } },
        responses: {
          200: { description: 'Site content updated' },
        },
      },
    },

    // --------------------------------------------------------- CUSTOMIZATION
    '/customization-rules': {
      get: {
        tags: ['Customization'],
        summary: 'Get product customization rules (fonts, colors, limits)',
        responses: {
          200: { description: 'Customization rules' },
        },
      },
      put: {
        tags: ['Customization'],
        summary: 'Update customization rules (admin)',
        security: [{ bearerAuth: [] }],
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object' } } } },
        responses: {
          200: { description: 'Rules updated' },
          400: { description: 'Invalid rules' },
        },
      },
    },

    // --------------------------------------------------------------- REPORTS
    '/reports/overview': {
      get: {
        tags: ['Reports'],
        summary: 'Admin overview dashboard metrics',
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'Dashboard metrics (revenue, orders, users, products, low stock)',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    totalRevenue: { type: 'number' },
                    totalOrders: { type: 'integer' },
                    totalUsers: { type: 'integer' },
                    totalProducts: { type: 'integer' },
                    pendingOrders: { type: 'integer' },
                    lowStockProducts: { type: 'integer' },
                    recentOrders: { type: 'array', items: { $ref: '#/components/schemas/Order' } },
                    topProducts: { type: 'array', items: { type: 'object' } },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/reports/product-sales': {
      get: {
        tags: ['Reports'],
        summary: 'Top selling products (from materialized view)',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'limit', in: 'query', required: false, schema: { type: 'integer', default: 10 } }],
        responses: {
          200: { description: 'Top product sales' },
        },
      },
    },
    '/reports/daily-orders': {
      get: {
        tags: ['Reports'],
        summary: 'Daily order/revenue summary (from materialized view)',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'days', in: 'query', required: false, schema: { type: 'integer', default: 30 } }],
        responses: {
          200: { description: 'Daily order summary' },
        },
      },
    },

    // --------------------------------------------------------------- SYSTEM
    '/health': {
      get: {
        tags: ['System'],
        summary: 'Health check',
        responses: {
          200: { description: 'Server healthy', content: { 'application/json': { schema: { type: 'object', properties: { status: { type: 'string' }, timestamp: { type: 'string' } } } } } },
        },
      },
    },
  },
};

const swaggerOptions = {
  swaggerDefinition,
  apis: [],
};

export const swaggerSpec = swaggerJSDoc(swaggerOptions);
export default swaggerSpec;

