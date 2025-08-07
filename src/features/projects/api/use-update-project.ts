import { useMutation, useQueryClient } from '@tanstack/react-query';
import { InferRequestType, InferResponseType } from 'hono';
import { toast } from 'sonner';

import { client } from '@/lib/hono';

type RequestType = InferRequestType<(typeof client.api.projects)[':id']['$patch']>['json'];
type ResponseType = InferResponseType<(typeof client.api.projects)[':id']['$patch'], 200>;

export const useUpdateProject = (id: string) => {
  const queryClient = useQueryClient();

  const mutation = useMutation<ResponseType, Error, RequestType>({
    mutationKey: ['project', id],
    mutationFn: async (json) => {
      console.log('🔄 Updating project:', id, json);
      
      try {
        const response = await client.api.projects[':id'].$patch({
          json,
          param: {
            id,
          },
        });

        console.log('📊 Update response status:', response.status, response.statusText);

        if (!response.ok) {
          const errorText = await response.text().catch(() => 'Failed to read error response');
          console.error('❌ Update failed:', response.status, errorText);
          throw new Error(`Update failed: ${response.status} ${response.statusText} - ${errorText}`);
        }

        const result = await response.json();
        console.log('✅ Project updated successfully:', result);
        return result;
      } catch (error) {
        console.error('❌ Project update error:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['projects'],
      });

      queryClient.invalidateQueries({
        queryKey: ['project', id],
      });
    },
    onError: (error) => {
      toast.error('Failed to update project!', {
        description: error?.message || 'An unknown error occurred',
      });
    },
  });

  return mutation;
};
