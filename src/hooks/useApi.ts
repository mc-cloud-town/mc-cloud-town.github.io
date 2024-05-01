import { useEffect, useState, useCallback } from 'react';
import axios, { AxiosError } from 'axios';

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

  const fetchData = useCallback(() => {
    let isMounted = true; // 标志组件是否挂载

    setLoading(true);
    axios
      .get<T>(url)
      .then((response) => {
        if (isMounted) {
          setData(response.data);
          setError(null);
        }
      })
      .catch((err: AxiosError) => {
        if (isMounted) {
          setError({ message: err.message });
        }
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [url]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error };
};

export default useApi;
