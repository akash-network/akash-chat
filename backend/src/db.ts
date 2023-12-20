import mysql from "mysql";
import dotenv from 'dotenv';
dotenv.config();

export class dbClass {
    pool = mysql.createPool({
        connectionLimit: 10,
        host: process.env.DB_HOST,
        port: parseInt(process.env.DB_PORT ?? '3306'),
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
    });

    constructor() {
        console.log('Required environment variables:', {
            DB_HOST: process.env.DB_HOST,
            DB_PORT: process.env.DB_PORT,
            DB_USER: process.env.DB_USER,
            DB_PASSWORD: process.env.DB_PASSWORD,
            DB_NAME: process.env.DB_NAME,
            LB_URL: process.env.LB_URL,
        });
    }

    increaseCounter() {
        this.pool.getConnection((err, connection) => {
            connection.query('INSERT INTO chatcounter SET ?', { count: 1 }, (err, result) => {
                if (err) {
                    console.error('Error:', err);
                }
            });
            // release the connection back to the pool
            connection.release();
        });
    }
}