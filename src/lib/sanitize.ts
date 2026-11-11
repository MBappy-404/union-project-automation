/**
 * Sanitizes input to protect against MongoDB NoSQL Operator Injection.
 * Recursively drops any object keys starting with '$' or containing '.'
 * while preserving all legitimate string values (Bangla, English, currencies, symbols),
 * numbers, booleans, and arrays.
 */
export function sanitizeMongoInput<T>(input: T): T {
  if (input === null || typeof input !== "object") {
    return input;
  }

  if (Array.isArray(input)) {
    return input.map((item) => sanitizeMongoInput(item)) as unknown as T;
  }

  const sanitized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(input)) {
    // Strip keys starting with '$' (Mongo operators) or containing '.' (nested field pollution)
    if (key.startsWith("$") || key.includes(".")) {
      continue;
    }
    sanitized[key] = sanitizeMongoInput(value);
  }

  return sanitized as T;
}

