const nativeFetch = globalThis.fetch;

if (typeof nativeFetch !== 'function') {
  throw new Error('Global fetch is not available. Please run on Node.js 18 or newer.');
}

const buildTimeoutError = (timeout) => {
  if (typeof DOMException === 'function') {
    return new DOMException(`Request timed out after ${timeout}ms`, 'AbortError');
  }

  const error = new Error(`Request timed out after ${timeout}ms`);
  error.name = 'AbortError';
  return error;
};

/**
 * Wrap the built-in fetch to support the (non-standard) `timeout` option
 * expected by legacy code that previously used node-fetch.
 */
export default function fetchWithTimeout(resource, options = {}) {
  const { timeout, signal, ...rest } = options ?? {};

  if (!timeout) {
    return nativeFetch(resource, { ...rest, signal });
  }

  const controller = new AbortController();
  const timer = setTimeout(() => {
    controller.abort(buildTimeoutError(timeout));
  }, timeout);

  if (signal) {
    if (signal.aborted) {
      controller.abort(signal.reason);
    } else {
      signal.addEventListener(
        'abort',
        () => controller.abort(signal.reason),
        { once: true }
      );
    }
  }

  const fetchPromise = nativeFetch(resource, { ...rest, signal: controller.signal });

  return fetchPromise.finally(() => clearTimeout(timer));
}

export { fetchWithTimeout as fetchWithTimeout, fetchWithTimeout as fetch };
