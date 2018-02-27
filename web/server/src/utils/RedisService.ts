import * as redis from "redis";
import { promisify } from 'util';

const client = (function InitRedis() {
    const redisClient = redis.createClient({ prefix: 'annealMap:' });
    return redisClient;
})();

const getAsync = promisify(client.get).bind(client);
export const getLRANGE = promisify(client.LRANGE).bind(client);

export function getClient() {
    return client;
}

export async function getValue(key: string) {
    if (key !== undefined) {
        try {
            const result = await getAsync(key);
            return result;

        } catch (e) {
            console.log('Error while getting key : ' + e);
            // throw new Error(e);
        }
    }
}

// TODO: Replace with actual uuid generator
export const generateUID = (): string => {
    return 'ta-uuid-' + Math.random() * 10e7;
}

/**
 * Creates new entry in redis store
 */
export const createNewEntry = (): string => {
    const uid = generateUID();
    const initialState = {
        status: "Created"
    }

    client.set(uid, JSON.stringify(initialState), (e: Error, _res: any) => {
        if (e) throw new Error("Redis entry could not be created.")
    });

    return uid;

}

/**
 * 
 * @param key 
 * @param value 
 * 
 * @return {Promise<number>} Number is the number of rows inserted???
 */
export const findAndUpdate = (key: string, value: { [key: string]: any }) => {
    return new Promise<number>((resolve, reject) => {
        client.LPUSH(key, JSON.stringify(value), (error, reply) => {
            if (error !== null) {
                return reject(error);
            }
            resolve(reply);
        });
    });
}

/**
 * Creates new entry in redis store
 */
export const createNewCollationEntry = (uid: string, value: any): string => {


    client.set(uid, value, (e: Error, _res: any) => {
        if (e) throw new Error("Redis entry could not be created.")
    });

    return uid;

}