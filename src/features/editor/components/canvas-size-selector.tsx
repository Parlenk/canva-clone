import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface CanvasSizeSelectorProps {
  onCanvasCreate: (width: number, height: number) => void;
}

const PRESET_SIZES = [
  { name: 'Social Media Post', width: 1080, height: 1080, description: 'Square format for Instagram, Facebook' },
  { name: 'Instagram Story', width: 1080, height: 1920, description: 'Vertical format for Instagram Stories' },
  { name: 'Facebook Cover', width: 1200, height: 630, description: 'Facebook cover photo' },
  { name: 'Business Card', width: 600, height: 400, description: 'Standard business card' },
  { name: 'Flyer', width: 600, height: 800, description: 'Portrait flyer format' },
  { name: 'Banner', width: 1000, height: 300, description: 'Wide banner format' },
  { name: 'Custom', width: 400, height: 400, description: 'Define your own size' },
];

export const CanvasSizeSelector = ({ onCanvasCreate }: CanvasSizeSelectorProps) => {
  const [selectedPreset, setSelectedPreset] = useState(PRESET_SIZES[0]);
  const [customWidth, setCustomWidth] = useState('400');
  const [customHeight, setCustomHeight] = useState('400');

  const handleCreateCanvas = () => {
    if (selectedPreset.name === 'Custom') {
      const width = parseInt(customWidth, 10);
      const height = parseInt(customHeight, 10);
      
      if (width >= 100 && width <= 5000 && height >= 100 && height <= 5000) {
        onCanvasCreate(width, height);
      } else {
        alert('Canvas size must be between 100x100 and 5000x5000 pixels');
      }
    } else {
      onCanvasCreate(selectedPreset.width, selectedPreset.height);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Create New Design</h1>
          <p className="text-gray-600">Choose a canvas size to start designing</p>
        </div>

        {/* Preset Size Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {PRESET_SIZES.map((preset) => (
            <div
              key={preset.name}
              className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                selectedPreset.name === preset.name
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => setSelectedPreset(preset)}
            >
              <div className="flex items-center justify-center mb-3">
                <div
                  className="bg-white border border-gray-300 shadow-sm"
                  style={{
                    width: Math.min(120, (preset.width / Math.max(preset.width, preset.height)) * 80),
                    height: Math.min(80, (preset.height / Math.max(preset.width, preset.height)) * 80),
                  }}
                />
              </div>
              
              <h3 className="font-semibold text-sm text-gray-900 mb-1">{preset.name}</h3>
              <p className="text-xs text-gray-600 mb-2">{preset.description}</p>
              <p className="text-xs text-gray-500 font-mono">
                {preset.width} × {preset.height}px
              </p>
            </div>
          ))}
        </div>

        {/* Custom Size Inputs */}
        {selectedPreset.name === 'Custom' && (
          <div className="bg-gray-50 p-6 rounded-lg mb-8">
            <h3 className="font-semibold text-gray-900 mb-4">Custom Canvas Size</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="width">Width (px)</Label>
                <Input
                  id="width"
                  type="number"
                  min="100"
                  max="5000"
                  value={customWidth}
                  onChange={(e) => setCustomWidth(e.target.value)}
                  placeholder="400"
                />
              </div>
              <div>
                <Label htmlFor="height">Height (px)</Label>
                <Input
                  id="height"
                  type="number"
                  min="100"
                  max="5000"
                  value={customHeight}
                  onChange={(e) => setCustomHeight(e.target.value)}
                  placeholder="400"
                />
              </div>
            </div>
          </div>
        )}

        {/* Selected Size Info */}
        <div className="bg-blue-50 p-4 rounded-lg mb-6">
          <h3 className="font-semibold text-blue-900 mb-2">Selected Canvas Size</h3>
          <p className="text-blue-800">
            <span className="font-mono">
              {selectedPreset.name === 'Custom' 
                ? `${customWidth} × ${customHeight}px` 
                : `${selectedPreset.width} × ${selectedPreset.height}px`
              }
            </span>
            {selectedPreset.name !== 'Custom' && (
              <span className="ml-2 text-blue-600">({selectedPreset.name})</span>
            )}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 justify-end">
          <Button
            variant="outline"
            onClick={() => window.location.reload()}
          >
            Cancel
          </Button>
          <Button
            onClick={handleCreateCanvas}
            className="px-8"
          >
            Create Canvas
          </Button>
        </div>
      </div>
    </div>
  );
};