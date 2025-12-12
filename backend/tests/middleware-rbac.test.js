/**
 * RBAC Middleware Tests
 * 
 * Tests SUPER, ADMIN_USER, APP_USER access rules
 */

import { expect } from 'chai';
import { requireAdmin } from '../src/middlewares/requireAdmin.js';
import { requireRole } from '../src/middlewares/role.js';

describe('RBAC Middleware Tests', () => {
  describe('requireAdmin Middleware', () => {
    it('should allow SUPER admin', () => {
      const req = {
        user: {
          id: 'test-id',
          role_code: 'SUPER',
          account_type: 'ADMIN_USER',
        },
      };
      const res = {
        status: (code) => ({
          json: (data) => {
            throw new Error(`Should not be called: ${code} ${JSON.stringify(data)}`);
          },
        }),
      };
      let nextCalled = false;
      const next = () => {
        nextCalled = true;
      };

      requireAdmin(req, res, next);
      expect(nextCalled).to.be.true;
    });

    it('should allow ADMIN_APP', () => {
      const req = {
        user: {
          id: 'test-id',
          role_code: 'ADMIN_APP',
          account_type: 'APP_USER', // Even with APP_USER account_type
        },
      };
      const res = {
        status: (code) => ({
          json: (data) => {
            throw new Error(`Should not be called: ${code} ${JSON.stringify(data)}`);
          },
        }),
      };
      let nextCalled = false;
      const next = () => {
        nextCalled = true;
      };

      requireAdmin(req, res, next);
      expect(nextCalled).to.be.true;
    });

    it('should block APP_USER', () => {
      const req = {
        user: {
          id: 'test-id',
          role_code: 'CONTRACTOR',
          account_type: 'APP_USER',
        },
      };
      let statusCode = null;
      let responseData = null;
      const res = {
        status: (code) => {
          statusCode = code;
          return {
            json: (data) => {
              responseData = data;
            },
          };
        },
      };
      const next = () => {
        throw new Error('Should not call next');
      };

      requireAdmin(req, res, next);
      expect(statusCode).to.equal(403);
      expect(responseData.success).to.be.false;
    });

    it('should allow ADMIN_USER with valid role', () => {
      const req = {
        user: {
          id: 'test-id',
          role_code: 'ADMIN',
          account_type: 'ADMIN_USER',
        },
      };
      let nextCalled = false;
      const next = () => {
        nextCalled = true;
      };
      const res = {
        status: (code) => ({
          json: (data) => {
            throw new Error(`Should not be called: ${code}`);
          },
        }),
      };

      requireAdmin(req, res, next);
      expect(nextCalled).to.be.true;
    });
  });

  describe('requireRole Middleware', () => {
    it('should allow SUPER admin to bypass role checks', async () => {
      const req = {
        user: {
          id: 'test-id',
          role_code: 'SUPER',
          account_type: 'ADMIN_USER',
        },
      };
      let nextCalled = false;
      const next = () => {
        nextCalled = true;
      };
      const res = {
        status: (code) => ({
          json: (data) => {
            throw new Error(`Should not be called: ${code}`);
          },
        }),
      };

      const middleware = requireRole(['ADMIN']);
      await middleware(req, res, next);
      expect(nextCalled).to.be.true;
    });

    it('should block APP_USER from admin routes', async () => {
      const req = {
        user: {
          id: 'test-id',
          role_code: 'CONTRACTOR',
          account_type: 'APP_USER',
        },
      };
      let statusCode = null;
      const res = {
        status: (code) => {
          statusCode = code;
          return {
            json: (data) => {},
          };
        },
      };
      const next = () => {
        throw new Error('Should not call next');
      };

      const middleware = requireRole(['ADMIN']);
      await middleware(req, res, next);
      expect(statusCode).to.equal(403);
    });
  });
});




