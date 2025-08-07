import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { TrendingUp, TrendingDown, Users, Star, Clock, RefreshCw } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { client } from '@/lib/hono';

interface AnalyticsData {
  overview: {
    totalSessions: number;
    ratedSessions: number;
    avgRating: number;
    feedbackRate: number;
  };
  recentActivity: Array<{
    id: string;
    rating: number | null;
    processingTime: number | null;
    createdAt: string;
    hasFeedback: boolean;
    hasCorrections: boolean;
  }>;
  trends: {
    dailyCount: Record<string, number>;
  };
}

interface RetrainingResults {
  success: boolean;
  timestamp: string;
  metrics: {
    totalSessions: number;
    trainingPoints: number;
    validatedPoints: number;
    avgQualityScore: number;
    highQualityCount: number;
    lowQualityCount: number;
    improvementRate: number;
  };
  patterns: {
    successful: any;
    problematic: any;
  };
  improvedPrompts: string;
  recommendations: (string | null)[];
}

export const TrainingAnalytics = () => {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [retrainingResults, setRetrainingResults] = useState<RetrainingResults | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRetraining, setIsRetraining] = useState(false);
  const [adminKey, setAdminKey] = useState('');

  const fetchAnalytics = async () => {
    setIsLoading(true);
    try {
      const response = await client.api.ai['training-analytics'].$get();
      if (response.ok) {
        const data = await response.json();
        setAnalytics(data);
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const runRetraining = async () => {
    if (!adminKey) {
      alert('Admin key required for retraining');
      return;
    }

    setIsRetraining(true);
    try {
      const response = await client.api.ai['retrain-model'].$post({
        json: {
          days: 30,
          minRating: 1,
          adminKey,
        },
      });

      if (response.ok) {
        const results = await response.json();
        if ('success' in results) {
          setRetrainingResults(results);
          await fetchAnalytics(); // Refresh analytics
        } else {
          alert(`No training data available: ${results.message}`);
        }
      } else {
        const error = await response.json();
        alert(`Retraining failed: ${(error as any).error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Retraining failed:', error);
      alert('Retraining failed - check console');
    } finally {
      setIsRetraining(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  if (isLoading) {
    return <div className="p-6">Loading analytics...</div>;
  }

  if (!analytics) {
    return <div className="p-6">Failed to load analytics</div>;
  }

  const trendData = Object.entries(analytics.trends.dailyCount).map(([date, count]) => ({
    date: new Date(date).toLocaleDateString(),
    count,
  }));

  const ratingDistribution = analytics.recentActivity
    .filter(session => session.rating !== null)
    .reduce((acc, session) => {
      const rating = session.rating!;
      acc[rating] = (acc[rating] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);

  const ratingData = [1, 2, 3, 4, 5].map(rating => ({
    rating: `${rating} star${rating !== 1 ? 's' : ''}`,
    count: ratingDistribution[rating] || 0,
  }));

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">AI Resize Training Analytics</h2>
        <Button onClick={fetchAnalytics} disabled={isLoading}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-500" />
            <span className="text-sm font-medium">Total Sessions</span>
          </div>
          <div className="text-2xl font-bold mt-2">{analytics.overview.totalSessions}</div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-500" />
            <span className="text-sm font-medium">Avg Rating</span>
          </div>
          <div className="text-2xl font-bold mt-2">{analytics.overview.avgRating}/5</div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-500" />
            <span className="text-sm font-medium">Feedback Rate</span>
          </div>
          <div className="text-2xl font-bold mt-2">{analytics.overview.feedbackRate}%</div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-purple-500" />
            <span className="text-sm font-medium">With Feedback</span>
          </div>
          <div className="text-2xl font-bold mt-2">{analytics.overview.ratedSessions}</div>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Daily Usage Trend</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="count" stroke="#8884d8" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Rating Distribution</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={ratingData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="rating" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Model Retraining Section */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Model Retraining</h3>
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <input
              type="password"
              placeholder="Admin Key"
              value={adminKey}
              onChange={(e) => setAdminKey(e.target.value)}
              className="px-3 py-2 border rounded-md"
            />
            <Button 
              onClick={runRetraining} 
              disabled={isRetraining || !adminKey}
              className="flex items-center gap-2"
            >
              {isRetraining ? (
                <>Processing...</>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4" />
                  Retrain Model
                </>
              )}
            </Button>
          </div>

          {retrainingResults && (
            <div className="mt-4 space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="font-semibold text-green-800 mb-2">
                  ✅ Retraining Completed - {retrainingResults.timestamp}
                </h4>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Training Points:</span>
                    <div className="font-semibold">{retrainingResults.metrics.trainingPoints}</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Validated:</span>
                    <div className="font-semibold">{retrainingResults.metrics.validatedPoints}</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Avg Quality:</span>
                    <div className="font-semibold">{retrainingResults.metrics.avgQualityScore}</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Improvement Rate:</span>
                    <div className="font-semibold">
                      {Math.round(retrainingResults.metrics.improvementRate * 100)}%
                    </div>
                  </div>
                </div>

                {retrainingResults.improvedPrompts && (
                  <div className="mt-4">
                    <span className="text-gray-600 text-sm">Improved Prompts:</span>
                    <div className="bg-white border rounded p-3 text-sm mt-1">
                      {retrainingResults.improvedPrompts}
                    </div>
                  </div>
                )}

                {retrainingResults.recommendations.length > 0 && (
                  <div className="mt-4">
                    <span className="text-gray-600 text-sm">Recommendations:</span>
                    <ul className="list-disc pl-5 text-sm mt-1">
                      {retrainingResults.recommendations.map((rec, index) => (
                        <li key={index}>{rec}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Recent Activity */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
        <div className="space-y-2">
          {analytics.recentActivity.slice(0, 10).map((session) => (
            <div key={session.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
              <div className="flex items-center gap-4">
                <span className="text-sm font-mono text-gray-500">
                  {session.id.slice(0, 8)}...
                </span>
                <div className="flex items-center gap-2">
                  {session.rating ? (
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm">{session.rating}</span>
                    </div>
                  ) : (
                    <span className="text-sm text-gray-400">No rating</span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                {session.hasFeedback && <span className="bg-blue-100 px-2 py-1 rounded text-xs">Feedback</span>}
                {session.hasCorrections && <span className="bg-orange-100 px-2 py-1 rounded text-xs">Corrections</span>}
                {session.processingTime && <span>{session.processingTime}ms</span>}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};