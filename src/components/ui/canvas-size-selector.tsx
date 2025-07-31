import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface CanvasSizeSelectorProps {
  onSizeSelect: (width: number, height: number) => void;
  className?: string;
}

const PRESET_SIZES = [
  { name: 'Square (400×400)', width: 400, height: 400, icon: '■' },
  { name: 'Instagram Post (1080×1080)', width: 1080, height: 1080, icon: '■' },
  { name: 'Instagram Story (1080×1920)', width: 1080, height: 1920, icon: '📱' },
  { name: 'Facebook Post (1200×630)', width: 1200, height: 630, icon: '📄' },
  { name: 'Twitter Post (1200×675)', width: 1200, height: 675, icon: '🐦' },
  { name: 'YouTube Thumbnail (1280×720)', width: 1280, height: 720, icon: '📺' },
  { name: 'Business Card (350×200)', width: 350, height: 200, icon: '💼' },
  { name: 'A4 Portrait (210×297)', width: 595, height: 842, icon: '📋' },
  { name: 'A4 Landscape (297×210)', width: 842, height: 595, icon: '📋' },
];

export const CanvasSizeSelector = ({ onSizeSelect, className }: CanvasSizeSelectorProps) => {
  const [customWidth, setCustomWidth] = useState('800');
  const [customHeight, setCustomHeight] = useState('600');
  const [showCustom, setShowCustom] = useState(false);

  const handlePresetSelect = (width: number, height: number) => {
    onSizeSelect(width, height);
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const width = parseInt(customWidth, 10);
    const height = parseInt(customHeight, 10);
    
    if (isNaN(width) || isNaN(height) || width < 100 || height < 100 || width > 5000 || height > 5000) {
      alert('Please enter valid dimensions between 100-5000 pixels');
      return;
    }
    
    onSizeSelect(width, height);
  };

  return (
    <div className={cn('fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4', className)}>
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Create Your Canvas</CardTitle>
          <CardDescription>
            Choose a preset size or enter custom dimensions to get started
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Preset Sizes Grid */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Popular Presets</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {PRESET_SIZES.map((preset) => (
                <Button
                  key={preset.name}
                  variant="outline"
                  className="h-auto p-4 text-left justify-start hover:bg-blue-50 hover:border-blue-300"
                  onClick={() => handlePresetSelect(preset.width, preset.height)}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{preset.icon}</span>
                    <div>
                      <div className="font-medium">{preset.name}</div>
                      <div className="text-sm text-gray-500">
                        {preset.width} × {preset.height} px
                      </div>
                    </div>
                  </div>
                </Button>
              ))}
            </div>
          </div>

          {/* Custom Size Toggle */}
          <div className="border-t pt-4">
            <Button
              variant="ghost"
              onClick={() => setShowCustom(!showCustom)}
              className="w-full justify-center"
            >
              {showCustom ? '📐 Hide Custom Size' : '📐 Custom Size'}
            </Button>
          </div>

          {/* Custom Size Form */}
          {showCustom && (
            <form onSubmit={handleCustomSubmit} className="space-y-4 border rounded-lg p-4 bg-gray-50">
              <h3 className="text-lg font-semibold">Custom Dimensions</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="width">Width (px)</Label>
                  <Input
                    id="width"
                    type="number"
                    min={100}
                    max={5000}
                    value={customWidth}
                    onChange={(e) => setCustomWidth(e.target.value)}
                    placeholder="800"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="height">Height (px)</Label>
                  <Input
                    id="height"
                    type="number"
                    min={100}
                    max={5000}
                    value={customHeight}
                    onChange={(e) => setCustomHeight(e.target.value)}
                    placeholder="600"
                  />
                </div>
              </div>
              
              <div className="text-sm text-gray-600">
                Dimensions must be between 100-5000 pixels
              </div>
              
              <Button type="submit" className="w-full">
                Create Canvas ({customWidth} × {customHeight})
              </Button>
            </form>
          )}

          {/* Quick Actions */}
          <div className="flex gap-2 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => handlePresetSelect(400, 400)}
              className="flex-1"
            >
              Quick Start (400×400)
            </Button>
            <Button
              variant="outline"
              onClick={() => handlePresetSelect(800, 600)}
              className="flex-1"
            >
              Standard (800×600)
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};