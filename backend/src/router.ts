import { initTRPC } from '@trpc/server';
import { z } from 'zod';
import { db } from './webServer';
import { TRPCClientError } from '@trpc/client';

const t = initTRPC.create();

export const appRouter = t.router({
    generate: t.procedure
        .input(
            z.object({
                model: z.string().refine((val) => val === 'mistral' || val === 'dolphin-mixtral' || val === 'mixtral' || val === 'nous-hermes2-mixtral'),
                messages: z.array(z.object({ role: z.enum(['user', 'assistant']), content: z.string().max(2000) })).max(5).min(1),
                temperature: z.string().max(4).transform((val) => parseFloat(val)).refine((val) => val >= 0 && val <= 1),
                max_tokens: z.number().min(64).max(2048).refine((val) => val % 64 === 0),
                top_p: z.string().max(4).transform((val) => parseFloat(val)).refine((val) => val >= 0 && val <= 1),
                repetition_penalty: z.string().max(4).transform((val) => parseFloat(val)).refine((val) => val >= 1 && val <= 2),
            }),
        )
        .mutation(async ({ input }) => {
            const body = JSON.stringify({
                messages: [...input.messages,],
                mode: "instruct",
                model: input.model,
                stream: false,
                options: {
                    temperature: input.temperature,
                    num_predict: input.max_tokens,
                    top_p: input.top_p,
                    repeat_penalty: input.repetition_penalty,
                },
            });

            const response = await fetch(`${process.env.LB_URL}/${input.model}/api/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: body,
            });

            if (response.status !== 200) {
                const jsonResp = await response.json();
                throw new TRPCClientError(jsonResp.error);
            }

            const jsonResp = await response.json();

            if (db) {
                try {
                    db.increaseCounter();
                } catch (err) {
                    console.error('DB Error:', err);
                }
            }
            
            return {
                message: jsonResp.message.content,
            };
        }),
});