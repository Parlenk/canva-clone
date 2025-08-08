import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Brain,
  Target, 
  Palette, 
  Grid3X3, 
  AlignHorizontalSpaceAround,
  Eye,
  Sparkles
} from 'lucide-react';

interface CompositionAnalysis {
  visualHierarchy: string;
  colorHarmony: string;
  spacingRhythm: string;
  alignmentGrid: string;
  focusPoints: string[];
}

interface ContentAnalysis {
  primaryElements: string[];
  supportingElements: string[];
  decorativeElements: string[];
}

interface AestheticAnalysisDisplayProps {
  aestheticScore?: number;
  layoutComplexity?: 'simple' | 'moderate' | 'complex';
  compositionAnalysis?: CompositionAnalysis;
  contentAnalysis?: ContentAnalysis;
  appliedPrinciples?: string[];
  designRationale?: string;
  isVisible: boolean;
}

export const AestheticAnalysisDisplay = ({
  aestheticScore,
  layoutComplexity,
  compositionAnalysis,
  contentAnalysis,
  appliedPrinciples,
  designRationale,
  isVisible
}: AestheticAnalysisDisplayProps) => {
  if (!isVisible) return null;

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 90) return 'Excellent';
    if (score >= 80) return 'Very Good';
    if (score >= 70) return 'Good';
    if (score >= 60) return 'Fair';
    return 'Needs Improvement';
  };

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'simple': return 'bg-green-100 text-green-800';
      case 'moderate': return 'bg-yellow-100 text-yellow-800';
      case 'complex': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card className="p-4 mt-4 space-y-4 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
      <div className="flex items-center gap-2 mb-3">
        <Brain className="h-5 w-5 text-blue-600" />
        <h3 className="font-semibold text-blue-900">AI Design Analysis</h3>
      </div>

      {/* Aesthetic Score */}
      {aestheticScore !== undefined && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-indigo-500" />
              <span className="text-sm font-medium text-gray-700">Aesthetic Score</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-lg font-bold ${getScoreColor(aestheticScore)}`}>
                {aestheticScore}/100
              </span>
              <Badge variant="secondary" className="text-xs">
                {getScoreLabel(aestheticScore)}
              </Badge>
            </div>
          </div>
          <Progress value={aestheticScore} className="h-2 bg-gray-200" />
        </div>
      )}

      {/* Layout Complexity */}
      {layoutComplexity && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Grid3X3 className="h-4 w-4 text-indigo-500" />
            <span className="text-sm font-medium text-gray-700">Layout Complexity</span>
          </div>
          <Badge className={`capitalize ${getComplexityColor(layoutComplexity)}`}>
            {layoutComplexity}
          </Badge>
        </div>
      )}

      {/* Applied Design Principles */}
      {appliedPrinciples && appliedPrinciples.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-indigo-500" />
            <span className="text-sm font-medium text-gray-700">Design Principles Applied</span>
          </div>
          <div className="flex flex-wrap gap-1">
            {appliedPrinciples.map((principle, index) => (
              <Badge key={index} variant="outline" className="text-xs capitalize">
                {principle}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Composition Analysis */}
      {compositionAnalysis && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Palette className="h-4 w-4 text-indigo-500" />
            <span className="text-sm font-medium text-gray-700">Composition Analysis</span>
          </div>
          <div className="grid grid-cols-1 gap-2 text-xs">
            {compositionAnalysis.visualHierarchy && (
              <div className="flex items-start gap-2">
                <Eye className="h-3 w-3 text-gray-500 mt-0.5 flex-shrink-0" />
                <span className="text-gray-600">{compositionAnalysis.visualHierarchy}</span>
              </div>
            )}
            {compositionAnalysis.spacingRhythm && (
              <div className="flex items-start gap-2">
                <AlignHorizontalSpaceAround className="h-3 w-3 text-gray-500 mt-0.5 flex-shrink-0" />
                <span className="text-gray-600">{compositionAnalysis.spacingRhythm}</span>
              </div>
            )}
            {compositionAnalysis.alignmentGrid && (
              <div className="flex items-start gap-2">
                <Grid3X3 className="h-3 w-3 text-gray-500 mt-0.5 flex-shrink-0" />
                <span className="text-gray-600">{compositionAnalysis.alignmentGrid}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Content Analysis */}
      {contentAnalysis && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Brain className="h-4 w-4 text-indigo-500" />
            <span className="text-sm font-medium text-gray-700">Content Analysis</span>
          </div>
          <div className="grid grid-cols-1 gap-2 text-xs">
            {contentAnalysis.primaryElements.length > 0 && (
              <div>
                <span className="font-medium text-green-700">Primary: </span>
                <span className="text-gray-600">{contentAnalysis.primaryElements.length} elements</span>
              </div>
            )}
            {contentAnalysis.supportingElements.length > 0 && (
              <div>
                <span className="font-medium text-blue-700">Supporting: </span>
                <span className="text-gray-600">{contentAnalysis.supportingElements.length} elements</span>
              </div>
            )}
            {contentAnalysis.decorativeElements.length > 0 && (
              <div>
                <span className="font-medium text-purple-700">Decorative: </span>
                <span className="text-gray-600">{contentAnalysis.decorativeElements.length} elements</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Design Rationale */}
      {designRationale && (
        <div className="space-y-2">
          <span className="text-sm font-medium text-gray-700">AI Reasoning</span>
          <p className="text-xs text-gray-600 leading-relaxed bg-white/50 p-2 rounded border-l-2 border-indigo-200">
            {designRationale}
          </p>
        </div>
      )}

      <div className="text-xs text-gray-500 italic text-center pt-2 border-t border-blue-200">
        Analysis powered by Advanced AI Vision & Layout Optimizer
      </div>
    </Card>
  );
};