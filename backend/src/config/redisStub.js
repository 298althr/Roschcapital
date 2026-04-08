import fs from 'fs';
import path from 'path';

const REDIS_DATA_PATH = path.join(process.cwd(), 'backend/data/redis_store.json');

class RedisStub {
  constructor() {
    this.store = new Map();
    this._load();
    this.status = 'ready';
    console.log('⚡ Redis Stub Initialized');
  }

  _load() {
    try {
      if (fs.existsSync(REDIS_DATA_PATH)) {
        const data = JSON.parse(fs.readFileSync(REDIS_DATA_PATH, 'utf8'));
        Object.entries(data).forEach(([key, val]) => {
          if (val.expiresAt > Date.now()) {
            this.store.set(key, val);
          }
        });
      }
    } catch (e) {
      console.error('Redis stub load error:', e);
    }
  }

  _save() {
    try {
      const data = {};
      this.store.forEach((val, key) => {
        if (val.expiresAt > Date.now()) {
          data[key] = val;
        }
      });
      fs.writeFileSync(REDIS_DATA_PATH, JSON.stringify(data, null, 2));
    } catch (e) {
      console.error('Redis stub save error:', e);
    }
  }

  async get(key) {
    const val = this.store.get(key);
    if (!val) return null;
    if (val.expiresAt < Date.now()) {
      this.store.delete(key);
      this._save();
      return null;
    }
    return val.value;
  }

  async set(key, value) {
    this.store.set(key, { value, expiresAt: Date.now() + 10 * 365 * 24 * 60 * 60 * 1000 }); // "Permanent"
    this._save();
    return 'OK';
  }

  async setex(key, seconds, value) {
    this.store.set(key, { value, expiresAt: Date.now() + (seconds * 1000) });
    this._save();
    return 'OK';
  }

  async del(key) {
    this.store.delete(key);
    this._save();
    return 1;
  }

  async exists(key) {
    const val = await this.get(key);
    return val ? 1 : 0;
  }

  on(event, callback) {
    if (event === 'connect' || event === 'ready') {
      setTimeout(callback, 0);
    }
  }

  disconnect() {
    console.log('⚡ Redis Stub Disconnected');
  }
}

const redis = new RedisStub();
export default redis;
