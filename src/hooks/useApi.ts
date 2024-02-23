import { useEffect, useState } from 'react';
import axios, { AxiosResponse } from 'axios';

export const UseApi = <T>(url: string) => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<{message: string} | null>(null);

  const getData = async () => {
    setLoading(true);
    try {
      const response:AxiosResponse<T> = await axios.get(url);
      setData(response.data);
    } catch (error) {
      setError({ message: (error as { message?: string }).message || 'wow Something went wrong'});
    }
    setLoading(false);
  };

  useEffect(() => {
    getData();
  },[]);

  return { data, loading, error };
};
