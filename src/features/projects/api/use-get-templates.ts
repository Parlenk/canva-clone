import { useQuery } from '@tanstack/react-query';
import { InferRequestType, InferResponseType } from 'hono';

import { client } from '@/lib/hono';

type RequestType = InferRequestType<typeof client.api.projects.templates.$get>['query'];
export type ResponseType = InferResponseType<typeof client.api.projects.templates.$get, 200>['data'][number];

export const useGetTemplates = (apiQuery: RequestType) => {
  const query = useQuery({
    queryKey: [
      'templates',
      {
        page: apiQuery.page,
        limit: apiQuery.limit,
      },
    ],
    queryFn: async () => {
      const response = await client.api.projects.templates.$get({
        query: apiQuery,
      });

      if (!response.ok) {
        // Return empty array instead of error for unauthorized access
        return { data: [] };
      }

      const result = await response.json();
      return result;
    },
  });

  return query;
};
