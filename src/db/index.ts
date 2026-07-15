import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
const { Pool } = pg;
import * as schema from './schema.ts';

// Function to create a new connection pool.
export const createPool = () => {
  return new Pool({
    host: process.env.SQL_HOST,
    user: process.env.SQL_USER,
    password: process.env.SQL_PASSWORD,
    database: process.env.SQL_DB_NAME,
    connectionTimeoutMillis: 15000,
  });
};

// Create the active pool instance.
let activePool = createPool();

// Gracefully handle expected idle database terminations or scale-to-zero client disconnects
const handlePoolError = (err: any) => {
  const errMsg = (err?.message || '').toLowerCase();
  if (
    errMsg.includes('terminated unexpectedly') ||
    errMsg.includes('closed') ||
    errMsg.includes('econnreset') ||
    errMsg.includes('connection') ||
    errMsg.includes('idle')
  ) {
    console.warn('[Database Pool Status] Idle database client connection closed (expected idle timeout or scale-to-zero):', err.message);
  } else {
    console.error('Unexpected error on active SQL pool client:', err);
  }
};

// Prevent unhandled pool-level errors from crashing the application
activePool.on('error', handlePoolError);

// Recreate the active pool on connection issues
const recreateActivePool = () => {
  try {
    activePool.end().catch(() => {});
  } catch (e) {}
  
  activePool = createPool();
  activePool.on('error', handlePoolError);
};

// Dynamic proxy that always routes database calls to the current activePool instance.
// This prevents Drizzle from holding onto a stale/ended pool reference when the pool is recreated.
const poolProxy = new Proxy({}, {
  get(target, prop, receiver) {
    if (prop === 'query') {
      return async function (this: any, text: any, params: any) {
        try {
          return await activePool.query(text, params);
        } catch (err: any) {
          const errMsg = err?.message || '';
          if (
            errMsg.includes('terminated unexpectedly') ||
            errMsg.includes('ECONNRESET') ||
            errMsg.includes('closed') ||
            errMsg.includes('timeout') ||
            errMsg.includes('Connection') ||
            errMsg.includes('after calling end')
          ) {
            console.warn('[Database Pool Recovery] Connection issue detected during query. Recreating pg Pool...', err.message || err);
            recreateActivePool();
            return await activePool.query(text, params);
          }
          throw err;
        }
      };
    }

    if (prop === 'connect') {
      return async function (this: any) {
        try {
          return await activePool.connect();
        } catch (err: any) {
          const errMsg = err?.message || '';
          if (
            errMsg.includes('terminated unexpectedly') ||
            errMsg.includes('ECONNRESET') ||
            errMsg.includes('closed') ||
            errMsg.includes('timeout') ||
            errMsg.includes('Connection') ||
            errMsg.includes('after calling end')
          ) {
            console.warn('[Database Pool Recovery] Connection issue detected during connect. Recreating pg Pool...', err.message || err);
            recreateActivePool();
            return await activePool.connect();
          }
          throw err;
        }
      };
    }

    // Forward all other properties to the current activePool
    const value = Reflect.get(activePool, prop);
    if (typeof value === 'function') {
      return value.bind(activePool);
    }
    return value;
  },
  set(target, prop, value, receiver) {
    return Reflect.set(activePool, prop, value);
  }
}) as any;

// Initialize Drizzle with the pool and schema.
export const db = drizzle(poolProxy, { schema });

