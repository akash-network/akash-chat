import { initTRPC } from '@trpc/server';
import {
    CreateHTTPContextOptions,
} from '@trpc/server/adapters/standalone';
import {
    CreateWSSContextFnOptions,
} from '@trpc/server/adapters/ws';
import { z } from 'zod';

// This is how you initialize a context for the server
function createContext(
    opts: CreateHTTPContextOptions | CreateWSSContextFnOptions,
) {
    return {};
}
type Context = Awaited<ReturnType<typeof createContext>>;

const t = initTRPC.context<Context>().create();

const appRouter = t.router({
    generate: t.procedure
        .input(
            z.object({
                messages: z.array(z.object({ role: z.enum(['user', 'assistant']), content: z.string().max(250) })).max(5).min(1),
                temperature: z.string().max(4).transform((val) => parseFloat(val)).refine((val) => val >= 0 && val <= 1),
                max_tokens: z.number().min(64).max(1024).refine((val) => val % 64 === 0),
                top_p: z.string().max(4).transform((val) => parseFloat(val)).refine((val) => val >= 0 && val <= 1),
                repetition_penalty: z.string().max(4).transform((val) => parseFloat(val)).refine((val) => val >= 1 && val <= 2),
            }),
        )
        .mutation(async () => {
            return { message: 'example message' };
        }),
});

export type AppRouter = typeof appRouter;