import { useCallback, useState } from 'react';
import { Upload, FileText, AlertCircle, CheckCircle, Settings, Eye } from 'lucide-react';
import { useDropzone } from 'react-dropzone';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { AILoading } from '@/components/ui/ai-loading';
import { cn } from '@/lib/utils';
import { 
  useUploadAdobeAI, 
  useConvertAdobeAI, 
  useAdobeAISupportedFeatures,
  validateAdobeAIFile,
  extractAIPreview
} from '@/features/editor/api/use-adobe-ai';

interface AdobeAIImportProps {
  onImportSuccess: (canvasData: any) => void;
  onClose?: () => void;
  className?: string;
}

interface ImportSettings {
  targetFormat: 'fabric' | 'svg' | 'json';
  preserveArtboards: boolean;
  scaleFactor: number;
}

export const AdobeAIImport = ({ onImportSuccess, onClose, className }: AdobeAIImportProps) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileValidation, setFileValidation] = useState<{ isValid: boolean; error?: string; warnings?: string[] } | null>(null);
  const [filePreview, setFilePreview] = useState<{ metadata: any; thumbnail?: string } | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [importSettings, setImportSettings] = useState<ImportSettings>({
    targetFormat: 'fabric',
    preserveArtboards: true,
    scaleFactor: 1,
  });

  const uploadMutation = useUploadAdobeAI();
  const convertMutation = useConvertAdobeAI();
  const { data: supportedFeatures } = useAdobeAISupportedFeatures();

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    console.log('📁 Adobe AI file selected:', file.name);
    setSelectedFile(file);

    // Validate file
    const validation = await validateAdobeAIFile(file);
    setFileValidation(validation);

    if (validation.isValid) {
      // Extract preview
      const preview = await extractAIPreview(file);
      setFilePreview(preview);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: {
      'application/postscript': ['.ai'],
      'application/illustrator': ['.ai'],
    },
    maxFiles: 1,
    maxSize: 50 * 1024 * 1024, // 50MB
  });

  const handleImport = async () => {
    if (!selectedFile || !fileValidation?.isValid) return;

    try {
      let result;
      
      if (showAdvanced) {
        // Use advanced conversion with settings
        result = await convertMutation.mutateAsync({
          file: selectedFile,
          options: importSettings,
        });
      } else {
        // Use simple upload
        result = await uploadMutation.mutateAsync(selectedFile);
      }

      if (result.success && result.data.canvasData) {
        onImportSuccess(result.data.canvasData);
        onClose?.();
      }
    } catch (error) {
      console.error('Import failed:', error);
    }
  };

  const isLoading = uploadMutation.isPending || convertMutation.isPending;

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
              <div className="space-y-2">
                <p className="text-lg font-medium">
                  {isDragActive ? 'Drop your AI file here' : 'Choose or drag your AI file'}
                </p>
                <p className="text-sm text-gray-500">
                  Supports Adobe Illustrator (.ai) files up to 50MB
                </p>
              </div>
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

      {/* Advanced Settings */}
      {selectedFile && fileValidation?.isValid && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Settings className="h-5 w-5" />
              <span className="font-medium">Import Settings</span>
            </div>
            <Switch
              checked={showAdvanced}
              onCheckedChange={setShowAdvanced}
            />
          </div>

          {showAdvanced && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Target Format</Label>
                  <Select
                    value={importSettings.targetFormat}
                    onValueChange={(value: 'fabric' | 'svg' | 'json') =>
                      setImportSettings(prev => ({ ...prev, targetFormat: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fabric">Fabric.js (Recommended)</SelectItem>
                      <SelectItem value="svg">SVG</SelectItem>
                      <SelectItem value="json">JSON</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Scale Factor</Label>
                  <Select
                    value={importSettings.scaleFactor.toString()}
                    onValueChange={(value) =>
                      setImportSettings(prev => ({ ...prev, scaleFactor: parseFloat(value) }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0.5">50% (Half size)</SelectItem>
                      <SelectItem value="1">100% (Original)</SelectItem>
                      <SelectItem value="1.5">150%</SelectItem>
                      <SelectItem value="2">200% (Double size)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2 flex flex-col justify-end">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="preserve-artboards"
                      checked={importSettings.preserveArtboards}
                      onCheckedChange={(checked) =>
                        setImportSettings(prev => ({ ...prev, preserveArtboards: checked }))
                      }
                    />
                    <Label htmlFor="preserve-artboards" className="text-sm">
                      Preserve Artboards
                    </Label>
                  </div>
                </div>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Supported Features Info */}
      {supportedFeatures && (
        <Card className="p-4">
          <details className="cursor-pointer">
            <summary className="font-medium mb-2">Supported Features & Limitations</summary>
            <div className="text-sm space-y-2 text-gray-600">
              <div>
                <span className="font-medium text-green-600">Supported:</span>
                <ul className="list-disc list-inside ml-4 mt-1">
                  {supportedFeatures.supportedFeatures.basicParsing && <li>Basic path parsing</li>}
                  {supportedFeatures.supportedFeatures.textExtraction && <li>Text extraction</li>}
                  {supportedFeatures.supportedFeatures.colorExtraction && <li>Color extraction</li>}
                  {supportedFeatures.supportedFeatures.artboardSupport && <li>Artboard support</li>}
                </ul>
              </div>
              
              {supportedFeatures.limitations && supportedFeatures.limitations.length > 0 && (
                <div>
                  <span className="font-medium text-yellow-600">Limitations:</span>
                  <ul className="list-disc list-inside ml-4 mt-1">
                    {supportedFeatures.limitations.map((limitation: string, index: number) => (
                      <li key={index}>{limitation}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </details>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={onClose}
          disabled={isLoading}
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
              disabled={isLoading}
            >
              Choose Different File
            </Button>
          )}
          
          <Button
            onClick={handleImport}
            disabled={!selectedFile || !fileValidation?.isValid || isLoading}
            className="min-w-[120px]"
          >
            {isLoading ? (
              <AILoading text="Importing..." size="sm" />
            ) : (
              'Import to Canvas'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};