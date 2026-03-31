import { useEffect, useState } from 'react';
import axios from 'axios';

/**
 * useApi hook to fetch data from an API.
 * @template T The expected data type.
 * @param url {string} The URL of the API.
 * @returns {Object} The data, loading state, and error state.
 */
const useApi = <T>(
  url: string,
): {
  data: T | null;
  loading: boolean;
  error: { message: string } | null;
} => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<{ message: string } | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    let isActive = true;

    setData(null);
    setLoading(true);
    setError(null);

    axios
      .get<T>(url, { signal: controller.signal })
      .then((response) => {
        if (isActive) {
          setData(response.data);
          setError(null);
        }
      })
      .catch((err: unknown) => {
        if (!isActive) {
          return;
        }

        if (axios.isAxiosError(err) && err.code === 'ERR_CANCELED') {
          return;
        }

        setError({
          message: axios.isAxiosError(err) ? err.message : 'Unknown error',
        });
      })
      .finally(() => {
        if (isActive) {
          setLoading(false);
        }
      });

    return () => {
      isActive = false;
      controller.abort();
    };
  }, [url]);

  return { data, loading, error };
};

export default useApi;
