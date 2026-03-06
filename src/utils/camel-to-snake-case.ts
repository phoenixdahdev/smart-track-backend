const keyCache = new Map<string, string>();

function toSnakeKey(key: string): string {
  const cached = keyCache.get(key);
  if (cached !== undefined) return cached;
  const snake = key.replace(/([a-z])([A-Z])/g, '$1_$2').toLowerCase();
  keyCache.set(key, snake);
  return snake;
}

function isConvertible(obj: unknown): obj is Record<string, unknown> {
  if (obj === null || typeof obj !== 'object') return false;
  if (obj instanceof Date || obj instanceof RegExp || obj instanceof Buffer)
    return false;
  return true;
}

function camelToSnake<T>(obj: T, privateFields?: Set<string>): T {
  if (Array.isArray(obj)) {
    return (obj as unknown[]).map((item) =>
      camelToSnake(item, privateFields),
    ) as unknown as T;
  } else if (isConvertible(obj)) {
    const result: Record<string, unknown> = {};
    for (const key of Object.keys(obj)) {
      if (privateFields && privateFields.has(key)) continue;
      result[toSnakeKey(key)] = camelToSnake(
        (obj as Record<string, unknown>)[key],
        privateFields,
      );
    }
    return result as unknown as T;
  }
  return obj;
}

export default camelToSnake;
