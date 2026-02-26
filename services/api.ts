
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Global logout callback function
let logoutCallback: (() => Promise<void>) | null = null;

export function setLogoutCallback(callback: () => Promise<void>) {
  logoutCallback = callback;
}

interface ApiTestResult {
  success: boolean;
  baseUrlReachable: boolean;
  authEndpointReachable: boolean;
  responseTime?: number;
  error?: string;
  details?: string;
}

const API_BASE_URL = 'https://boundless-327131710311.europe-west1.run.app/api';
const API_TIMEOUT = 15000; // 15 seconds

// Check if running on web platform
const IS_WEB = Platform.OS === 'web';

async function getAuthToken(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem('authToken');
  } catch (error) {
    console.error('Error getting auth token:', error);
    return null;
  }
}

async function apiCall<T>(
  endpoint: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' = 'GET',
  body?: any
): Promise<ApiResponse<T>> {


  // Real API call logic (when MOCK_MODE is false)
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

  try {
    const token = await getAuthToken();

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const options: RequestInit = {
      method,
      headers,
      signal: controller.signal,
    };

    if (body && (method === 'POST' || method === 'PUT' || method === 'DELETE' || method === 'PATCH')) {
      options.body = JSON.stringify(body);
    }

    const fullUrl = `${API_BASE_URL}${endpoint}`;

    const response = await fetch(fullUrl, options);
    clearTimeout(timeoutId);

    const responseText = await response.text();


    if (!response.ok) {
      let errorMessage = `API Error: ${response.status}`;

      // Handle 400/401 errors - invalid/missing token
      if (response.status === 400 || response.status === 401) {
        console.error(`[API] Authentication error ${response.status}: Token missing or invalid`);

        // Call logout callback if available
        if (logoutCallback) {
          try {
            await logoutCallback();
            console.log('[API] User logged out due to authentication error');
          } catch (logoutError) {
            console.error('[API] Error during logout:', logoutError);
          }
        } else {
          // Fallback: clear auth data directly
          try {
            await AsyncStorage.removeItem('user');
            await AsyncStorage.removeItem('authToken');
            console.log('[API] Cleared auth data due to authentication error');
          } catch (clearError) {
            console.error('[API] Error clearing auth data:', clearError);
          }
        }

        return {
          success: false,
          error: 'Session expired. Please login again.',
        };
      }

      try {
        const errorData = JSON.parse(responseText);
        if (errorData.message) {
          errorMessage = errorData.message;
        } else if (errorData.error) {
          errorMessage = errorData.error;
        } else if (errorData.title) {
          errorMessage = errorData.title;
        }
      } catch (e) {
        if (responseText) {
          errorMessage = responseText;
        }
      }

      console.error(`[API] Error: ${errorMessage}`);
      return {
        success: false,
        error: errorMessage,
      };
    }

    let data;
    try {
      if (responseText.trim() === '') {
        data = {};
      } else {
        data = JSON.parse(responseText);
      }
    } catch (e) {
      await AsyncStorage.removeItem('user');
      await AsyncStorage.removeItem('authToken');
      return {
        success: false,
        error: 'Invalid response format from server',
      };
    }
    return {
      success: true,
      data,
    };
  } catch (error: any) {
    clearTimeout(timeoutId);

    if (error.name === 'AbortError') {
      console.error('[API] Request timeout');
      return {
        success: false,
        error: 'Request timeout. Please check your internet connection.',
      };
    }

    // Enhanced CORS error detection and messaging
    if (error.message && error.message.toLowerCase().includes('cors')) {
      return {
        success: false,
        error: IS_WEB
          ? 'CORS Error: This API cannot be accessed from web browsers. Please test on iOS or Android device/simulator where CORS does not apply.'
          : 'Network error. Please check your internet connection.',
      };
    }

    if (error.message === 'Network request failed' || error.message.includes('fetch')) {
      console.error('[API] Network error:', error.message);

      // Provide more helpful error message on web
      if (IS_WEB) {
        return {
          success: false,
          error: 'Network error. If you see CORS errors in the console, the API server needs to enable CORS headers. This app will work normally on iOS and Android.',
        };
      }

      return {
        success: false,
        error: 'Network error. Please check your internet connection.',
      };
    }

    console.error('[API] Unexpected error:', error);
    return {
      success: false,
      error: error.message || 'An unexpected error occurred',
    };
  }
}


export async function login(username: string, password: string): Promise<ApiResponse<any>> {

  const response = await apiCall<any>('/api/authenticate', 'POST', {
    username: username,
    pin: password
  });

  if (response.success && response.data) {
    let token = null;
    let driverData = null;

    // Extract token - handle different response formats
    if (response.data.accessToken) {
      token = response.data.accessToken;
    } else if (response.data.token) {
      token = response.data.token;
    } else if (response.data.access_token) {
      token = response.data.access_token;
    } else if (response.data.data?.token) {
      token = response.data.data.token;
    } else if (response.data.data?.accessToken) {
      token = response.data.data.accessToken;
    }

    // Extract driver data
    if (response.data.driver) {
      driverData = response.data.driver;
    } else if (response.data.user) {
      driverData = response.data.user;
    } else if (response.data.data?.driver) {
      driverData = response.data.data.driver;
    }

    if (token) {
      await AsyncStorage.setItem('authToken', token);
      console.log('[API] Token stored successfully');

      return {
        success: true,
        data: {
          token,
          expiresIn: response.data.expiresIn || 3600,
          driver: driverData || {
            name: username,
            id: null,
          },
        },
      };
    } else {
      console.error('[API] No token found in response');
      return {
        success: false,
        error: 'Login response did not contain an access token',
      };
    }
  }

  console.error('[API] Login failed:', response.error);
  return {
    success: false,
    error: response.error || 'Login failed. Please check your credentials.',
  };
}

export async function getDriver(): Promise<ApiResponse<any>> {
  return apiCall('/api/get-drivers', 'GET');
}

export async function getVehicle(): Promise<ApiResponse<any>> {
  return apiCall('/api/get-vehicles', 'GET');
}

export async function getVehicleById(vehicleId: string): Promise<ApiResponse<any>> {
  return apiCall(`/api/vehicles/${vehicleId}`, 'GET');
}

export async function getTours(): Promise<ApiResponse<any>> {
  return apiCall('/api/tours', 'GET');
}

export async function submitDailyCheck(checkData: any): Promise<ApiResponse<any>> {
  return apiCall('/api/submit-inspection', 'POST', checkData);
}

export async function submitPreTour(tourData: any): Promise<ApiResponse<any>> {
  return apiCall('/api/submit-inspection', 'POST', tourData);
}

export async function submitPostTour(tourData: any): Promise<ApiResponse<any>> {
  return apiCall('/api/submit-inspection', 'POST', tourData);
}

export async function addExpense(expenseData: any): Promise<ApiResponse<any>> {
  return apiCall('/api/expenses', 'POST', expenseData);
}

/**
 * Get list of expenses for a specific float
 * GET /api/expenses?floatId={floatId}
 */
export async function getExpensesByFloatId(floatId: number): Promise<ApiResponse<any>> {
  const response = await apiCall<any>(`/api/expenses?floatId=${floatId}`, 'GET');

  // Handle different response formats
  if (response.success && response.data) {
    // If data is already an array, wrap it
    if (Array.isArray(response.data)) {
      return {
        success: true,
        data: {
          expenses: response.data,
        },
      };
    }

    // If data has expenses property, use it
    if (response.data.expenses) {
      return response;
    }

    // Otherwise, assume data is the expenses array
    return {
      success: true,
      data: {
        expenses: response.data,
      },
    };
  }

  return response;
}

/**
 * Get list of expenses for the current driver (legacy - requires floatId)
 * @deprecated Use getExpensesByFloatId instead
 */
export async function getExpenses(): Promise<ApiResponse<any>> {
  return {
    success: false,
    error: 'getExpenses() requires a floatId. Use getExpensesByFloatId(floatId) instead.',
  };
}

/**
 * Delete an expense for the authenticated driver
 * DELETE /api/expenses/{id}
 */
export async function deleteExpense(expenseId: string): Promise<ApiResponse<any>> {
  console.log('[API] Deleting expense:', expenseId);
  return apiCall(`/api/expenses/${expenseId}`, 'DELETE');
}

/**
 * Get all inspection items
 * GET /api/get-inspection-items
 */
export async function getInspectionTypes(): Promise<ApiResponse<any>> {
  console.log('[API] Fetching inspection types');
  return apiCall('/api/get-inspection-items', 'GET');
}

/**
 * Get inspection items by type
 * GET /api/get-inspection-items?type={type}
 */
export async function getInspectionByType(type: string): Promise<ApiResponse<any>> {
  console.log('[API] Fetching inspection by type:', type);
  return apiCall(`/api/get-inspection-items?type=${type}`, 'GET');
}

/**
 * Submit inspection check results
 * POST /api/submit-inspection
 */
export async function submitCheck(checkData: any): Promise<ApiResponse<any>> {
  console.log('[API] Submitting inspection check:', checkData);
  return apiCall('/api/submit-inspection', 'POST', checkData);
}

export async function getIssues(): Promise<ApiResponse<any>> {
  console.log('[API] Fetching issues');
  return apiCall('/issues', 'GET');
}

export async function createIssue(issueData: any): Promise<ApiResponse<any>> {
  console.log('[API] Creating issue:', issueData);
  return apiCall('/issues', 'POST', issueData);
}

export async function updateIssueStatus(issueId: string, status: string, notes?: string): Promise<ApiResponse<any>> {
  console.log('[API] Updating issue status:', issueId, status);
  return apiCall(`/issues/${issueId}/status`, 'PATCH', { status, notes });
}

export async function getAssignedTask(): Promise<ApiResponse<any>> {
  console.log('[API] Fetching assigned task');
  return apiCall('/get-assigned-task', 'POST');
}

// Export platform check for UI display
export function isWebPlatform(): boolean {
  return IS_WEB;
}

export default {
  login,
  getDriver,
  getVehicle,
  getVehicleById,
  getTours,
  submitDailyCheck,
  submitPreTour,
  submitPostTour,
  addExpense,
  getExpenses,
  getExpensesByFloatId,
  deleteExpense,
  getInspectionTypes,
  getInspectionByType,
  submitCheck,
  getAssignedTask,
  isWebPlatform,
  getIssues,
  createIssue,
  updateIssueStatus
};
