import * as redis from "redis";
import { promisify } from 'util';

const client = (function InitRedis() {
    const redisClient = redis.createClient({ prefix: 'annealMap:' });
    return redisClient;
})();

const getAsync = promisify(client.get).bind(client);


export function getClient() {
    return client;
}

export async function getValue(key: string) {
    try {
        const result = await getAsync(key);
        return result;

    } catch (e) {
        throw new Error(e);
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

export const findAndUpdate = async (key: string, value: any) => {
    try {
        const redisStoreObject = JSON.parse(await getValue(key));
        const newRedisStoreObject = Object.assign({}, redisStoreObject, value);
        client.set(key, JSON.stringify(newRedisStoreObject));
    } catch (e) {
        throw new Error(e);
    }
} 