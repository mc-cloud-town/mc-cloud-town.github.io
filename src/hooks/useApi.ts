import { useEffect, useState } from 'react';
import axios, { AxiosError } from 'axios';

/**
 * useApi hook to fetch data from an API.
 * @param url {string} The URL of the API.
 * @returns {Object{ data: T | null, loading: boolean, error: { message: string } | null }} The data, loading state, and error state.
 */
const useApi = <T,>(url: string): {
  data: T | null;
  loading: boolean;
  error: { message: string } | null;
} => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<{ message: string } | null>(null);

  useEffect(() => {
    setLoading(true);
    axios.get<T>(url)
      .then((response) => {
        setData(response.data);
        setError(null);
      })
      .catch((err: AxiosError) => {
        setError({ message: err.message || 'Wow! Something went wrong!' });
      })
      .finally(() => {
        setLoading(false);
      });
  }, [url]);

  return { data, loading, error };
};

export default useApi;

