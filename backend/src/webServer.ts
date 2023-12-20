import { createHTTPServer } from '@trpc/server/adapters/standalone';
import { appRouter } from './router';
import cors from 'cors';
import { dbClass } from './db';

export const db = new dbClass();

async function start() {
    console.log("Starting server...");

    const server = createHTTPServer({
        middleware: cors({
            origin: ['https://chat.akash.network'],
            optionsSuccessStatus: 200, // some legacy browsers (IE11, various SmartTVs) choke on 204
        }),
        router: appRouter
    });

    server.listen(3001);
}

start();