import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(8, "Senha deve ter pelo menos 8 caracteres"),
});

export const registerSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  email: z.string().email("Email inválido"),
  password: z.string().min(8, "Senha deve ter pelo menos 8 caracteres"),
});

export const articleSchema = z.object({
  title: z.string().min(1, "Título é obrigatório").max(200, "Título muito longo"),
  content: z.string().min(50, "Conteúdo deve ter pelo menos 50 caracteres"),
  excerpt: z.string().optional(),
  isDraft: z.boolean().default(false),
  categoryIds: z.array(z.string()).optional(),
  tagIds: z.array(z.string()).optional(),
});

export const postSchema = z.object({
  content: z.string().min(10, "Conteúdo deve ter pelo menos 10 caracteres").max(5000, "Conteúdo muito longo"),
  images: z.array(z.string().url()).max(5, "Máximo de 5 imagens").optional(),
  links: z.array(z.string().url()).optional(),
});

export const commentSchema = z.object({
  content: z.string().min(5, "Comentário deve ter pelo menos 5 caracteres").max(2000, "Comentário muito longo"),
  parentId: z.string().uuid().optional(),
});
