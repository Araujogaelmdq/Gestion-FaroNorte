import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { z } from 'zod';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from apps/api root
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const envSchema = z.object({
  PORT: z.coerce.number().default(3001),
  HOST: z.string().default('0.0.0.0'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DATABASE_URL: z.string().default('sqlite.db'),
  SESSION_SECRET: z
    .string()
    .default('faro-norte-super-secret-key-32-chars-long!')
    .transform((val) => {
      if (!val || val.length < 32) {
        return (val || '').padEnd(32, '0123456789abcdefghijklmnopqrstuv');
      }
      return val;
    }),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Error de validación en variables de entorno:', parsed.error.format());
  process.exit(1);
}

export const env = parsed.data;
