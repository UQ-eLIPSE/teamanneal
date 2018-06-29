import redis from "redis";
import { promisify } from 'util';
import uuidv4 from "uuid/v4";

/**
 * Instance of redis client
 */
const client = (function InitRedis() {
    const redisClient = redis.createClient({ prefix: "TeamAnneal:" });
    return redisClient;
})();

/**
 * Promisified binding to Redis' GET method
 */
const getAsync = promisify(client.get).bind(client);

/**
 * Promisified binding to Redis' LRANGE method
 */
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
    try {
        const result = await getAsync(key);
        return result;

    } catch (e) {
        console.error('Error while getting key : ' + e);
        throw new Error(e);
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
            // This will update expiry time every time a new anneal status is added
            // Set anneal data's expiry to 30 minutes
            expireAnnealData(key, 1800);
            if (error !== null) {
                return reject(error);
            }
            resolve(reply);
        });
    });
}

export function appendExpectedNumberOfAnnealResultsTag(key: string) {
    return key + '-expectedNumberOfResults';
}

export async function getExpectedNumberOfAnnealResults(key: string) {
    return await getValue(appendExpectedNumberOfAnnealResultsTag(key));
}

/**
 * Expires the keys associated to an anneal job.
 * @param annealID ID of the anneal job.
 * @param seconds The number of seconds after which key will expire.
 */
export function expireAnnealData(annealId: string, seconds: number) {
    client.expire(annealId, seconds);
    client.expire(appendExpectedNumberOfAnnealResultsTag(annealId), seconds);
}
