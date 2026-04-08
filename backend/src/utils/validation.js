import { z } from 'zod';

// User registration validation
export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

// User login validation
export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

// Password reset request
export const passwordResetRequestSchema = z.object({
  email: z.string().email('Invalid email address'),
});

// Password reset confirmation
export const passwordResetSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export const validateRequest = (schema, data) => {
  try {
    return { valid: true, data: schema.parse(data) };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { valid: false, errors: error.errors };
    }
    return { valid: false, errors: [{ message: 'Validation failed' }] };
  }
};
