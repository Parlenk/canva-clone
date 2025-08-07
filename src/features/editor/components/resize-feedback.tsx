import { useState } from 'react';
import { Star, ThumbsUp, ThumbsDown, Send } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

interface ResizeFeedbackProps {
  sessionId: string;
  onSubmitFeedback: (feedback: {
    rating: number;
    feedbackText: string;
    helpful: boolean;
  }) => Promise<void>;
  className?: string;
}

export const ResizeFeedback = ({ sessionId, onSubmitFeedback, className }: ResizeFeedbackProps) => {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [feedbackText, setFeedbackText] = useState('');
  const [helpful, setHelpful] = useState<boolean | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Validate sessionId
  if (!sessionId || sessionId.trim() === '') {
    return (
      <div className={cn('p-4 bg-red-50 border border-red-200 rounded-lg', className)}>
        <div className="text-red-700 text-sm">
          Error: Invalid session ID. Cannot submit feedback.
        </div>
      </div>
    );
  }

  const handleSubmit = async () => {
    if (rating === 0 && helpful === null) return;
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      // Validate feedback text length
      const trimmedText = feedbackText.trim();
      if (trimmedText.length > 1000) {
        throw new Error('Feedback text is too long (max 1000 characters)');
      }

      await onSubmitFeedback({
        rating,
        feedbackText: trimmedText,
        helpful: helpful ?? true,
      });
      setSubmitted(true);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to submit feedback';
      console.error('Failed to submit feedback:', error);
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className={cn('p-4 bg-green-50 border border-green-200 rounded-lg', className)}>
        <div className="flex items-center gap-2 text-green-700">
          <ThumbsUp className="h-4 w-4" />
          <span className="text-sm font-medium">Thanks for your feedback!</span>
        </div>
        <p className="text-xs text-green-600 mt-1">
          Your input helps improve our AI resize system.
        </p>
      </div>
    );
  }

  return (
    <div className={cn('p-4 bg-gray-50 border border-gray-200 rounded-lg space-y-4', className)}>
      <div>
        <h4 className="text-sm font-medium text-gray-900 mb-2">
          How was the AI resize result?
        </h4>
        
        {/* Quick thumbs up/down */}
        <div className="flex items-center gap-2 mb-3">
          <Button
            variant={helpful === true ? 'default' : 'outline'}
            size="sm"
            onClick={() => setHelpful(true)}
            className="flex items-center gap-1"
          >
            <ThumbsUp className="h-3 w-3" />
            Helpful
          </Button>
          <Button
            variant={helpful === false ? 'default' : 'outline'}
            size="sm"
            onClick={() => setHelpful(false)}
            className="flex items-center gap-1"
          >
            <ThumbsDown className="h-3 w-3" />
            Not helpful
          </Button>
        </div>

        {/* Star rating */}
        <div className="flex items-center gap-1 mb-3">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoveredRating(star)}
              onMouseLeave={() => setHoveredRating(0)}
              className="p-0.5 hover:scale-110 transition-transform"
            >
              <Star
                className={cn(
                  'h-4 w-4 transition-colors',
                  (hoveredRating || rating) >= star
                    ? 'fill-yellow-400 text-yellow-400'
                    : 'text-gray-300'
                )}
              />
            </button>
          ))}
          {rating > 0 && (
            <span className="text-xs text-gray-600 ml-2">
              {rating} star{rating !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>

      {/* Optional text feedback */}
      <div>
        <Textarea
          placeholder="Tell us more about your experience (optional)"
          value={feedbackText}
          onChange={(e) => {
            const text = e.target.value;
            if (text.length <= 1000) {
              setFeedbackText(text);
              setError(null); // Clear error when user types valid text
            }
          }}
          className="text-sm"
          rows={2}
          maxLength={1000}
        />
        <div className="text-xs text-gray-500 mt-1">
          {feedbackText.length}/1000 characters
        </div>
      </div>

      {error && (
        <div className="p-2 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
          {error}
        </div>
      )}

      <Button
        onClick={handleSubmit}
        disabled={isSubmitting || (rating === 0 && helpful === null)}
        size="sm"
        className="w-full"
      >
        {isSubmitting ? (
          'Submitting...'
        ) : (
          <>
            <Send className="h-3 w-3 mr-1" />
            Submit Feedback
          </>
        )}
      </Button>
    </div>
  );
};