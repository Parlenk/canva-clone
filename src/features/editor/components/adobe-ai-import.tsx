import { useCallback, useState, useRef } from 'react';
import { Upload, FileText, AlertCircle, CheckCircle, Settings, Eye, FolderOpen } from 'lucide-react';
import { useDropzone } from 'react-dropzone';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { AdobeAIParser } from '@/features/editor/services/adobe-ai-parser';

// Simple validation function
const validateFile = async (file: File): Promise<{ isValid: boolean; error?: string; warnings?: string[] }> => {
  const warnings: string[] = [];

  if (!file.name.toLowerCase().endsWith('.ai')) {
    return { isValid: false, error: 'File must have .ai extension' };
  }

  if (file.size > 50 * 1024 * 1024) {
    return { isValid: false, error: 'File size exceeds 50MB limit' };
  }

  if (file.size < 1024) {
    return { isValid: false, error: 'File too small to be a valid Adobe AI file' };
  }

  // Try to validate file format
  try {
    const isValid = await AdobeAIParser.isAdobeAIFile(file);
    if (!isValid) {
      warnings.push('File format could not be verified, but we\'ll try to import it anyway.');
    }
  } catch (error) {
    warnings.push('Could not validate file structure.');
  }

  if (file.size > 10 * 1024 * 1024) {
    warnings.push('Large file detected. Processing may take some time.');
  }

  return { isValid: true, warnings: warnings.length > 0 ? warnings : undefined };
};

// Simple preview extraction
const extractPreview = async (file: File): Promise<{ metadata: any } | null> => {
  try {
    const headerBuffer = await new Promise<ArrayBuffer>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as ArrayBuffer);
      reader.onerror = () => reject(reader.error);
      reader.readAsArrayBuffer(file.slice(0, 5000));
    });

    const headerText = new TextDecoder().decode(headerBuffer);
    const metadata: any = { filename: file.name, fileSize: file.size };

    const versionMatch = headerText.match(/Adobe Illustrator\(R\) (\d+\.\d+)/);
    if (versionMatch) metadata.version = versionMatch[1];

    const titleMatch = headerText.match(/%%Title: (.+)/);
    if (titleMatch) metadata.title = titleMatch[1].trim();

    const bboxMatch = headerText.match(/%%BoundingBox: (-?\d+(?:\.\d+)?) (-?\d+(?:\.\d+)?) (-?\d+(?:\.\d+)?) (-?\d+(?:\.\d+)?)/);
    if (bboxMatch) {
      const left = parseFloat(bboxMatch[1]);
      const bottom = parseFloat(bboxMatch[2]);
      const right = parseFloat(bboxMatch[3]);
      const top = parseFloat(bboxMatch[4]);
      metadata.dimensions = { width: right - left, height: top - bottom };
    }

    return { metadata };
  } catch (error) {
    return null;
  }
};

interface AdobeAIImportProps {
  onImportSuccess: (canvasData: any) => void;
  onClose?: () => void;
  className?: string;
}

export const AdobeAIImport = ({ onImportSuccess, onClose, className }: AdobeAIImportProps) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileValidation, setFileValidation] = useState<{ isValid: boolean; error?: string; warnings?: string[] } | null>(null);
  const [filePreview, setFilePreview] = useState<{ metadata: any; thumbnail?: string } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    console.log('🎯 onDrop called with files:', acceptedFiles);
    const file = acceptedFiles[0];
    if (!file) {
      console.log('❌ No file provided to onDrop');
      return;
    }

    console.log('📁 Adobe AI file selected:', {
      name: file.name,
      size: file.size,
      type: file.type,
      lastModified: new Date(file.lastModified).toISOString()
    });

    // Check if this is actually a screenshot instead of an AI file
    if (file.name.toLowerCase().includes('screenshot') || file.type.startsWith('image/')) {
      console.error('❌ Detected screenshot file instead of AI file!');
      setFileValidation({
        isValid: false,
        error: 'This appears to be a screenshot file, not an Adobe AI file. Please select a .ai file instead.'
      });
      return;
    }

    setSelectedFile(file);

    try {
      // Basic validation
      const validation = await validateFile(file);
      setFileValidation(validation);

      if (validation.isValid) {
        // Quick preview extraction
        const preview = await extractPreview(file);
        setFilePreview(preview);
      }
    } catch (error) {
      console.error('File validation failed:', error);
      setFileValidation({
        isValid: false,
        error: 'Failed to validate file'
      });
    }
  }, []);

  const handleFileInputChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    // Process the file using the same onDrop logic
    await onDrop([file]);
  }, [onDrop]);

  const openFileDialog = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: {
      'application/postscript': ['.ai'],
      'application/illustrator': ['.ai'],
      'application/pdf': ['.ai'], // AI files are often PDF-based
      'application/octet-stream': ['.ai'], // Fallback for AI files
    },
    maxFiles: 1,
    maxSize: 50 * 1024 * 1024, // 50MB
    onDropRejected: (fileRejections) => {
      console.log('❌ Files rejected:', fileRejections);
      fileRejections.forEach(rejection => {
        console.log('❌ Rejected file:', rejection.file.name, 'Errors:', rejection.errors);
      });
    }
  });

  const handleImport = async () => {
    if (!selectedFile || !fileValidation?.isValid) {
      console.warn('Cannot import: no file selected or validation failed');
      return;
    }

    setIsProcessing(true);

    try {
      console.log('🚀 Starting Adobe AI import process...');
      
      // Use client-side parsing directly
      const parsed = await AdobeAIParser.parseAIFile(selectedFile);
      console.log('✅ AI file parsed successfully:', parsed);
      
      const fabricObjects = AdobeAIParser.convertToFabricObjects(parsed);
      console.log('🔍 CONVERTED FABRIC OBJECTS:', fabricObjects);
      
      const canvasData = {
        version: '1.0',
        width: parsed.metadata.pageSize.width,
        height: parsed.metadata.pageSize.height,
        objects: fabricObjects,
        background: '#ffffff',
        metadata: parsed.metadata
      };
      
      console.log('🎨 Canvas data ready:', canvasData);
      console.log('🚀 CALLING onImportSuccess with canvasData...');
      onImportSuccess(canvasData);
      onClose?.();

    } catch (error) {
      console.error('❌ Adobe AI import failed:', error);
      
      // Provide fallback canvas with error info
      const fallbackData = {
        version: '1.0',
        width: 800,
        height: 600,
        objects: [{
          type: 'text',
          text: `Adobe AI File: ${selectedFile.name}\n\nFile could not be fully parsed.\nThis canvas is ready for your content.`,
          left: 100,
          top: 250,
          fontSize: 16,
          fontFamily: 'Arial',
          fill: '#333333',
          textAlign: 'left',
        }],
        background: '#f9f9f9',
        metadata: { 
          filename: selectedFile.name, 
          source: 'Adobe AI',
          error: error instanceof Error ? error.message : 'Import failed'
        }
      };
      
      onImportSuccess(fallbackData);
      onClose?.();
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Import Adobe Illustrator File</h2>
        <p className="text-gray-600">
          Upload your .ai file to convert it to an editable canvas
        </p>
      </div>

      {/* File Upload Area */}
      <Card className="p-6">
        <div
          {...getRootProps()}
          className={cn(
            'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors',
            isDragActive && !isDragReject && 'border-blue-400 bg-blue-50',
            isDragReject && 'border-red-400 bg-red-50',
            !selectedFile && 'border-gray-300 hover:border-gray-400',
            selectedFile && fileValidation?.isValid && 'border-green-400 bg-green-50',
            selectedFile && !fileValidation?.isValid && 'border-red-400 bg-red-50'
          )}
        >
          <input {...getInputProps()} />
          
          {!selectedFile ? (
            <>
              <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <div className="space-y-4">
                <p className="text-lg font-medium">
                  {isDragActive ? 'Drop your AI file here' : 'Choose or drag your AI file'}
                </p>
                <p className="text-sm text-gray-500">
                  Supports Adobe Illustrator (.ai) files up to 50MB
                </p>
                <Button
                  type="button"
                  variant="outline"
                  onClick={openFileDialog}
                  className="mx-auto flex items-center space-x-2"
                >
                  <FolderOpen className="h-4 w-4" />
                  <span>Browse Files</span>
                </Button>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".ai"
                onChange={handleFileInputChange}
                className="hidden"
              />
            </>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-center space-x-3">
                <FileText className="h-8 w-8 text-blue-500" />
                <div className="text-left">
                  <p className="font-medium">{selectedFile.name}</p>
                  <p className="text-sm text-gray-500">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>

              {/* Validation Status */}
              {fileValidation && (
                <div className="space-y-2">
                  {fileValidation.isValid ? (
                    <div className="flex items-center justify-center space-x-2 text-green-600">
                      <CheckCircle className="h-5 w-5" />
                      <span className="text-sm font-medium">File validated successfully</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center space-x-2 text-red-600">
                      <AlertCircle className="h-5 w-5" />
                      <span className="text-sm font-medium">{fileValidation.error}</span>
                    </div>
                  )}

                  {fileValidation.warnings && fileValidation.warnings.length > 0 && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
                      <div className="flex items-start space-x-2">
                        <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5" />
                        <div className="text-sm">
                          <p className="font-medium text-yellow-800 mb-1">Warnings:</p>
                          <ul className="text-yellow-700 space-y-1">
                            {fileValidation.warnings.map((warning, index) => (
                              <li key={index}>• {warning}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* File Preview */}
              {filePreview && (
                <div className="bg-gray-50 border rounded p-3 text-left">
                  <div className="flex items-center space-x-2 mb-2">
                    <Eye className="h-4 w-4 text-gray-600" />
                    <span className="font-medium text-sm">File Preview</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                    {filePreview.metadata.version && (
                      <div>
                        <span className="font-medium">Version:</span> {filePreview.metadata.version}
                      </div>
                    )}
                    {filePreview.metadata.title && (
                      <div>
                        <span className="font-medium">Title:</span> {filePreview.metadata.title}
                      </div>
                    )}
                    {filePreview.metadata.dimensions && (
                      <div>
                        <span className="font-medium">Size:</span>{' '}
                        {Math.round(filePreview.metadata.dimensions.width)} ×{' '}
                        {Math.round(filePreview.metadata.dimensions.height)} pt
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </Card>

      {/* Simple Info */}
      {selectedFile && fileValidation?.isValid && (
        <Card className="p-4">
          <div className="text-sm space-y-2 text-gray-600">
            <p className="font-medium mb-2">Import Information</p>
            <div>
              <span className="font-medium text-green-600">What's supported:</span>
              <ul className="list-disc list-inside ml-4 mt-1">
                <li>Basic shapes and paths</li>
                <li>Text content</li>
                <li>Canvas dimensions</li>
                <li>Basic colors</li>
              </ul>
            </div>
            
            <div>
              <span className="font-medium text-yellow-600">Note:</span>
              <p className="ml-4 mt-1">
                Complex effects, gradients, and embedded images will be simplified or converted to placeholders.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={onClose}
          disabled={isProcessing}
        >
          Cancel
        </Button>
        
        <div className="space-x-2">
          {selectedFile && (
            <Button
              variant="outline"
              onClick={() => {
                setSelectedFile(null);
                setFileValidation(null);
                setFilePreview(null);
              }}
              disabled={isProcessing}
            >
              Choose Different File
            </Button>
          )}
          
          <Button
            onClick={handleImport}
            disabled={!selectedFile || !fileValidation?.isValid || isProcessing}
            className="min-w-[120px]"
          >
            {isProcessing ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                <span>Importing...</span>
              </div>
            ) : (
              'Import to Canvas'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};