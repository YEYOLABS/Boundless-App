import axios from 'axios';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export const BASE_URL = 'https://boundless-backend-yeyo-225250995708.europe-west1.run.app/api'; 
type FetchDataTypes = { endPoint: string; method: 'POST' | 'GET' | 'UPDATE' | 'DELETE'; data?: any; };

type StatusType = 'success' | 'error' | 'warning' | 'info';
 
const useFetch = () => {
    const { user } = useAuth();
    const [status, setStatus] = useState<{ type: StatusType; message: string } | null>(null);

    const fetchData = async ({ endPoint, method, data }: FetchDataTypes) => {
        try {
            const url = BASE_URL + endPoint;
            const headers: any = {
                'Content-Type': 'application/json',
                'Accept': 'application/zip,application/json',
            };
            if (user?.token) {
                headers.Authorization = `Bearer ${user.token}`;
            }
            let response = await axios({ method, url, data, headers });
            setStatus({ type: 'success', message: 'Request completed successfully' });
            return response.data;
        } catch (error: any) {
            console.error('Error fetching data:', error);
            const errorMessage = error.response?.data?.message || 'An error occurred';
            setStatus({ type: 'error', message: errorMessage });
            return false;
        }
    };

    const clearStatus = () => setStatus(null);

    return { fetchData, status, clearStatus };
};

export default useFetch;
