import { z } from "zod";

export const CreateUserSchema = z.object({
  email: z.string().email().optional(),
  name: z.string().min(1).optional(),
});

export const UpdateUserSchema = z.object({
  email: z.string().email().optional(),
  name: z.string().min(1).optional(),
});

export const UserQuerySchema = z.object({
  email: z.string().email().optional(),
  take: z.coerce.number().min(1).max(100).optional(),
  skip: z.coerce.number().min(0).optional(),
});