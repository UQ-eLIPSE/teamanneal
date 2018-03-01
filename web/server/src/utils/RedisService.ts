import * as redis from "redis";
import { promisify } from 'util';
import * as uuidv4 from "uuid/v4";

const client = (function InitRedis() {
    const redisClient = redis.createClient({ prefix: 'annealStateStatusList:' });
    return redisClient;
})();

const getAsync = promisify(client.get).bind(client);
export const getLRANGE = promisify(client.LRANGE).bind(client);

/**
 * Returns instance of the redis client
 */

export function getClient() {
    return client;
}

/**
 * Retrieves a key's value from redis
 * @param key redis key
 */
export async function getValue(key: string) {
    if (key !== undefined) {
        try {
            const result = await getAsync(key);
            return result;

        } catch (e) {
            console.error('Error while getting key : ' + e);
            throw new Error(e);
        }
    }
}

/**
 * Generates unique ID for anneal jobs
 */
export const generateUUIDv4 = (): string => {
    return uuidv4();
}

/**
 * Pushes the anneal status state / results to a redis list
 * @param key 
 * @param value 
 * 
 * @return {Promise<number>} Number is the number of rows inserted???
 */
export const pushAnnealState = (key: string, value: { [key: string]: any }) => {
    return new Promise<number>((resolve, reject) => {
        client.LPUSH(key, JSON.stringify(value), (error, reply) => {
            if (error !== null) {
                return reject(error);
            }
            resolve(reply);
        });
    });
}

export async function getExpectedNumberOfAnnealResults(key: string) {
    return await getValue(key + '-expectedNumberOfResults');
}

/**
 * Expires the keys associated to an anneal job
 * @param annealID ID of the anneal job
 */
export function expireAnnealData(annealID: string) {
    client.expire(annealID, 60);
    client.expire(annealID + '-expectedNumberOfResults', 60);
}