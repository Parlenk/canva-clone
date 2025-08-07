import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';

import { client } from '@/lib/hono';

interface SubmitFeedbackRequest {
  sessionId: string;
  rating: number;
  feedbackText: string;
  helpful: boolean;
}

interface CreateResizeSessionRequest {
  projectId?: string;
  originalCanvas: any;
  targetDimensions: { width: number; height: number };
  aiResult: any;
  processingTime: number;
}

export const useSubmitResizeFeedback = () => {
  return useMutation({
    mutationFn: async (data: SubmitFeedbackRequest) => {
      const response = await client.api.ai['resize-feedback'].$post({
        json: data,
      });

      if (!response.ok) {
        throw new Error('Failed to submit feedback');
      }

      return response.json();
    },
    onSuccess: () => {
      toast.success('Feedback submitted successfully');
    },
    onError: (error) => {
      console.error('Failed to submit feedback:', error);
      toast.error('Failed to submit feedback');
    },
  });
};

export const useCreateResizeSession = () => {
  return useMutation({
    mutationFn: async (data: CreateResizeSessionRequest) => {
      console.log('🔧 Creating resize session with data:', data);
      console.log('🔧 Client object:', client);
      
      const response = await client.api.ai['resize-session'].$post({
        json: data,
      });

      console.log('🔧 Response:', response);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('🔧 Response error:', errorText);
        throw new Error(`Failed to create resize session: ${response.status} ${errorText}`);
      }

      return response.json();
    },
    onError: (error) => {
      console.error('Failed to create resize session:', error);
    },
  });
};

export const useUpdateResizeSession = () => {
  return useMutation({
    mutationFn: async (data: { sessionId: string; manualCorrections?: any }) => {
      const response = await client.api.ai['resize-session'][':id'].$patch({
        param: { id: data.sessionId },
        json: { manualCorrections: data.manualCorrections },
      });

      if (!response.ok) {
        throw new Error('Failed to update resize session');
      }

      return response.json();
    },
    onError: (error) => {
      console.error('Failed to update resize session:', error);
    },
  });
};