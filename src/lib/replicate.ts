import Replicate from 'replicate';

let replicateInstance: Replicate | null = null;

export const getReplicate = () => {
  if (!replicateInstance) {
    const token = process.env.REPLICATE_API_TOKEN;
    if (!token) {
      throw new Error('REPLICATE_API_TOKEN environment variable is not set');
    }
    replicateInstance = new Replicate({
      auth: token,
    });
  }
  return replicateInstance;
};
