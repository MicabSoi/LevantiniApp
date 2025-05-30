interface CacheEntry<T> {
  data: T;
  timestamp: number;
  hits: number;
}

class TranslationCache<T> {
  private cache = new Map<string, CacheEntry<T>>();
  private maxSize: number;
  private maxAge: number; // in milliseconds

  constructor(maxSize = 100, maxAge = 1000 * 60 * 30) { // 30 minutes default
    this.maxSize = maxSize;
    this.maxAge = maxAge;
  }

  set(key: string, value: T): void {
    // Clean expired entries before adding new ones
    this.cleanExpired();

    // If cache is full, remove least recently used items
    if (this.cache.size >= this.maxSize) {
      this.evictLRU();
    }

    this.cache.set(key, {
      data: value,
      timestamp: Date.now(),
      hits: 0
    });
  }

  get(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    // Check if entry has expired
    if (Date.now() - entry.timestamp > this.maxAge) {
      this.cache.delete(key);
      return null;
    }

    // Increment hit counter for LRU tracking
    entry.hits++;
    entry.timestamp = Date.now(); // Update access time
    
    return entry.data;
  }

  has(key: string): boolean {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return false;
    }

    // Check if entry has expired
    if (Date.now() - entry.timestamp > this.maxAge) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    this.cleanExpired();
    return this.cache.size;
  }

  private cleanExpired(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.maxAge) {
        this.cache.delete(key);
      }
    }
  }

  private evictLRU(): void {
    let oldestKey = '';
    let oldestTime = Date.now();
    let lowestHits = Infinity;

    for (const [key, entry] of this.cache.entries()) {
      // Prefer entries with fewer hits, then older timestamps
      if (entry.hits < lowestHits || (entry.hits === lowestHits && entry.timestamp < oldestTime)) {
        oldestKey = key;
        oldestTime = entry.timestamp;
        lowestHits = entry.hits;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }

  // Get cache statistics
  getStats() {
    this.cleanExpired();
    const entries = Array.from(this.cache.values());
    
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      totalHits: entries.reduce((sum, entry) => sum + entry.hits, 0),
      averageAge: entries.length > 0 
        ? (Date.now() - entries.reduce((sum, entry) => sum + entry.timestamp, 0) / entries.length) / 1000 / 60
        : 0
    };
  }
}

export default TranslationCache; 