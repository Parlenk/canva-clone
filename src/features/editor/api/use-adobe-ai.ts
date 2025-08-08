import { useMutation, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';

import { client } from '@/lib/hono';

interface AdobeAIUploadResponse {
  success: boolean;
  data: {
    filename: string;
    metadata: {
      version: string;
      creator: string;
      title?: string;
      boundingBox: {
        left: number;
        bottom: number;
        right: number;
        top: number;
      };
      pageSize: {
        width: number;
        height: number;
      };
      artboards: Array<{
        name: string;
        bounds: { x: number; y: number; width: number; height: number };
      }>;
    };
    canvasData: {
      version: string;
      width: number;
      height: number;
      objects: any[];
      background: string;
      metadata: any;
    };
    objects: any[];
  };
}

interface ConversionOptions {
  targetFormat?: 'fabric' | 'svg' | 'json';
  preserveArtboards?: boolean;
  scaleFactor?: number;
}

export const useUploadAdobeAI = () => {
  return useMutation({
    mutationFn: async (file: File): Promise<AdobeAIUploadResponse> => {
      // Validate file before upload
      if (!file.name.toLowerCase().endsWith('.ai')) {
        throw new Error('Please select a valid Adobe Illustrator (.ai) file');
      }

      if (file.size > 50 * 1024 * 1024) {
        throw new Error('File size too large. Maximum size is 50MB');
      }

      const response = await client.api['adobe-ai'].upload.$post({
        form: {
          aiFile: file,
        },
      });

      if (!response.ok) {
        try {
          const errorData = await response.json() as any;
          throw new Error(errorData.error || `Upload failed: ${response.statusText}`);
        } catch (parseError) {
          throw new Error(`Upload failed: ${response.statusText}`);
        }
      }

      try {
        return await response.json();
      } catch (parseError) {
        throw new Error('Failed to parse server response');
      }
    },
    onSuccess: (data) => {
      toast.success(`Successfully imported ${data.data.filename}`);
      console.log('✅ Adobe AI file imported:', {
        filename: data.data.filename,
        objectCount: data.data.objects.length,
        canvasSize: `${data.data.canvasData.width}x${data.data.canvasData.height}`,
      });
    },
    onError: (error) => {
      const errorMessage = error instanceof Error ? error.message : 'Failed to import Adobe AI file';
      toast.error(errorMessage);
      console.error('❌ Adobe AI import failed:', error);
    },
  });
};

export const useConvertAdobeAI = () => {
  return useMutation({
    mutationFn: async (params: {
      file: File;
      options?: ConversionOptions;
    }): Promise<AdobeAIUploadResponse> => {
      const { file, options = {} } = params;

      // Convert file to base64
      const fileData = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          const base64 = result.split(',')[1];
          resolve(base64);
        };
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(file);
      });

      const response = await client.api['adobe-ai']['convert-server'].$post({
        json: {
          fileData,
          filename: file.name,
          conversionOptions: {
            targetFormat: options.targetFormat || 'fabric',
            preserveArtboards: options.preserveArtboards ?? true,
            scaleFactor: options.scaleFactor || 1,
          },
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error((errorData as any).error || 'Conversion failed');
      }

      return response.json();
    },
    onSuccess: (data) => {
      toast.success('Adobe AI file converted successfully');
      console.log('✅ Adobe AI file converted:', data);
    },
    onError: (error) => {
      const errorMessage = error instanceof Error ? error.message : 'Conversion failed';
      toast.error(errorMessage);
      console.error('❌ Adobe AI conversion failed:', error);
    },
  });
};

export const useAdobeAISupportedFeatures = () => {
  return useQuery({
    queryKey: ['adobe-ai-features'],
    queryFn: async () => {
      const response = await client.api['adobe-ai']['supported-features'].$get();
      
      if (!response.ok) {
        throw new Error('Failed to fetch supported features');
      }

      return response.json();
    },
    staleTime: 1000 * 60 * 60, // 1 hour
    gcTime: 1000 * 60 * 60 * 24, // 24 hours
  });
};

// Utility function to validate AI file on client side
export const validateAdobeAIFile = async (file: File): Promise<{
  isValid: boolean;
  error?: string;
  warnings?: string[];
}> => {
  const warnings: string[] = [];

  // Check file extension
  if (!file.name.toLowerCase().endsWith('.ai')) {
    return {
      isValid: false,
      error: 'File must have .ai extension',
    };
  }

  // Check file size
  if (file.size > 50 * 1024 * 1024) {
    return {
      isValid: false,
      error: 'File size exceeds 50MB limit',
    };
  }

  // Check if file is too small (likely not a real AI file)
  if (file.size < 1024) {
    return {
      isValid: false,
      error: 'File too small to be a valid Adobe AI file',
    };
  }

  // Try to read first few bytes to check file format
  try {
    const headerBuffer = await new Promise<ArrayBuffer>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as ArrayBuffer);
      reader.onerror = () => reject(reader.error);
      reader.readAsArrayBuffer(file.slice(0, 200));
    });

    const headerText = new TextDecoder().decode(headerBuffer);
    
    // Check for various AI file format signatures
    const validSignatures = [
      '%!PS-Adobe',  // Classic PostScript-based AI
      '%PDF-',       // PDF-based AI (newer versions)
      'Adobe',       // General Adobe signature
    ];
    
    const hasValidSignature = validSignatures.some(sig => headerText.includes(sig));
    
    if (!hasValidSignature) {
      // Still allow the file but with a warning
      warnings.push('File format could not be verified. Import may fail for non-AI files.');
    }

    // Check for version information
    if (headerText.includes('Adobe Illustrator')) {
      const versionMatch = headerText.match(/Adobe Illustrator\(R\) (\d+\.\d+)/);
      if (versionMatch) {
        const version = parseFloat(versionMatch[1]);
        if (version < 10) {
          warnings.push('This file is from an older version of Illustrator. Some features may not be supported.');
        }
        if (version > 28) {
          warnings.push('This file is from a newer version of Illustrator. Some features may not be fully supported.');
        }
      }
    }

    // Large file warning
    if (file.size > 10 * 1024 * 1024) {
      warnings.push('Large file detected. Processing may take some time.');
    }

  } catch (error) {
    warnings.push('Could not fully validate file structure. Proceeding with caution.');
  }

  return {
    isValid: true,
    warnings: warnings.length > 0 ? warnings : undefined,
  };
};

// Helper function to extract preview data from AI file
export const extractAIPreview = async (file: File): Promise<{
  metadata: any;
  thumbnail?: string;
} | null> => {
  try {
    // This is a simplified preview extraction
    // In a real implementation, you might want to extract embedded thumbnails
    const headerBuffer = await new Promise<ArrayBuffer>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as ArrayBuffer);
      reader.onerror = () => reject(reader.error);
      reader.readAsArrayBuffer(file.slice(0, 10000)); // Read first 10KB
    });

    const headerText = new TextDecoder().decode(headerBuffer);
    
    const metadata: any = {
      filename: file.name,
      fileSize: file.size,
      creator: 'Adobe Illustrator',
    };

    // Extract version
    const versionMatch = headerText.match(/Adobe Illustrator\(R\) (\d+\.\d+)/);
    if (versionMatch) {
      metadata.version = versionMatch[1];
    }

    // Extract title
    const titleMatch = headerText.match(/%%Title: (.+)/);
    if (titleMatch) {
      metadata.title = titleMatch[1].trim();
    }

    // Extract bounding box for dimensions
    const bboxMatch = headerText.match(/%%BoundingBox: (-?\d+(?:\.\d+)?) (-?\d+(?:\.\d+)?) (-?\d+(?:\.\d+)?) (-?\d+(?:\.\d+)?)/);
    if (bboxMatch) {
      const left = parseFloat(bboxMatch[1]);
      const bottom = parseFloat(bboxMatch[2]);
      const right = parseFloat(bboxMatch[3]);
      const top = parseFloat(bboxMatch[4]);
      
      metadata.dimensions = {
        width: right - left,
        height: top - bottom,
      };
    }

    return { metadata };

  } catch (error) {
    console.error('Failed to extract AI preview:', error);
    return null;
  }
};