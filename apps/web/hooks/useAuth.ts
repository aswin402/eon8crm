import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { useAppStore } from '@/store/useAppStore';
import { LoginFormValues, RegisterFormValues, User } from '@/types/schema';
import { logger } from '@/lib/logger';

export const useAuth = () => {
  const queryClient = useQueryClient();
  const { setUser, user } = useAppStore();

  const meQuery = useQuery({
    queryKey: ['auth-me'],
    queryFn: async () => {
      try {
        const { data } = await apiClient.get<{ success: boolean; data: User }>('/api/auth/me');
        if (data.success) {
          setUser(data.data);
          return data.data;
        }
        return null;
      } catch (error) {
        logger.debug('No active session found');
        setUser(null);
        return null;
      }
    },
    retry: false,
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginFormValues) => {
      const { data } = await apiClient.post<{ success: boolean; data: User; token: string }>('/api/auth/login', credentials);
      if (typeof window !== 'undefined' && data.token) {
        localStorage.setItem('auth-token', data.token);
      }
      return data;
    },
    onSuccess: (data) => {
      setUser(data.data);
      queryClient.invalidateQueries({ queryKey: ['auth-me'] });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (userData: RegisterFormValues) => {
      const { data } = await apiClient.post<{ success: boolean; data: User; token: string }>('/api/auth/register', userData);
      if (typeof window !== 'undefined' && data.token) {
        localStorage.setItem('auth-token', data.token);
      }
      return data;
    },
    onSuccess: (data) => {
      setUser(data.data);
      queryClient.invalidateQueries({ queryKey: ['auth-me'] });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiClient.post('/api/auth/me');
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth-token');
      }
    },
    onSuccess: () => {
      setUser(null);
      queryClient.setQueryData(['auth-me'], null);
      queryClient.invalidateQueries({ queryKey: ['auth-me'] });
    },
  });

  return {
    user,
    isLoading: meQuery.isLoading,
    login: loginMutation.mutateAsync,
    isLoggingIn: loginMutation.isPending,
    register: registerMutation.mutateAsync,
    isRegistering: registerMutation.isPending,
    logout: logoutMutation.mutateAsync,
    isLoggingOut: logoutMutation.isPending,
  };
};
