# AI Resize Training System

## 🧠 Complete Self-Learning AI System

Your AI resize feature now has a **full machine learning pipeline** that continuously improves based on user feedback and interactions.

## 🎯 System Components

### 1. **Data Collection & Feedback**
- **Automatic Session Tracking**: Every AI resize creates a training session
- **User Feedback System**: Star ratings, thumbs up/down, text feedback
- **Performance Metrics**: Processing time, manual corrections tracking
- **Canvas Analysis**: Extracts meaningful features for training

### 2. **A/B Testing Framework**
- **Multiple Prompt Variants**: Tests different AI prompts simultaneously
- **Smart Traffic Distribution**: Automatically adjusts based on performance
- **Statistical Significance**: Calculates confidence levels for results
- **Auto-Optimization**: Shifts traffic to better-performing variants

### 3. **Training Pipeline**
- **Feature Extraction**: Converts canvas data into ML features
- **Quality Scoring**: Transforms user feedback into training scores
- **Pattern Analysis**: Identifies what works vs. what doesn't
- **Automated Retraining**: Periodically improves the system

### 4. **Analytics & Monitoring**
- **Real-time Dashboard**: View performance metrics and trends
- **Performance Comparison**: Compare different AI prompt variants
- **Training Analytics**: Track feedback rates and quality scores
- **Automated Scheduling**: Background tasks for optimization

## 🚀 How It Works

### User Interaction Flow:
1. **User clicks "TRUE AI Resize"**
2. **A/B Testing assigns a prompt variant** (sticky per user)
3. **AI processes with selected prompt**
4. **Session data is automatically captured**
5. **User provides feedback** (rating + helpful/not helpful)
6. **System records metrics for training**

### Learning Loop:
1. **Collect user feedback** → Quality scores
2. **Analyze patterns** → Identify successful scenarios
3. **Generate improved prompts** → Better AI instructions
4. **A/B test new variants** → Compare performance
5. **Auto-optimize weights** → Send more traffic to winners

## 📊 Using the Analytics Dashboard

### View Analytics:
```tsx
import { TrainingAnalytics } from '@/features/editor/components/training-analytics';

// Add to your admin panel or dashboard
<TrainingAnalytics />
```

### Key Metrics:
- **Total Sessions**: All AI resize attempts
- **Feedback Rate**: % of users who provide ratings
- **Average Rating**: Overall quality score (1-5 stars)
- **Success Rate**: % of ratings ≥ 4 stars
- **Variant Performance**: A/B test results comparison

## 🔧 API Endpoints

### Manual Retraining:
```bash
POST /api/ai/retrain-model
{
  "days": 30,          # Look back X days
  "minRating": 1,      # Minimum rating to include
  "adminKey": "secret" # Admin authentication
}
```

### Analytics Data:
```bash
GET /api/ai/training-analytics
# Returns comprehensive analytics data
```

### Session Tracking:
```bash
POST /api/ai/resize-session    # Create training session
PATCH /api/ai/resize-session/:id # Update with corrections
POST /api/ai/resize-feedback   # Submit user feedback
```

## 🤖 A/B Testing System

### Current Variants:
- **Original Prompt**: Basic resize instructions
- **Enhanced Prompt v1**: Advanced design principles + golden ratio

### Adding New Variants:
```typescript
import { ABTestingService } from '@/features/editor/services/ab-testing';

ABTestingService.addVariant({
  id: 'advanced-v2',
  name: 'Advanced Prompt v2',
  prompt: `Your improved prompt here with {currentWidth} placeholders...`,
  active: true,
  weight: 25, // 25% of traffic
});
```

### Performance Tracking:
```typescript
// Get performance comparison
const comparison = ABTestingService.getPerformanceComparison();

// Auto-optimize weights based on performance
ABTestingService.autoOptimizeWeights();

// Check statistical significance
const { significant, confidence } = ABTestingService.calculateSignificance('original', 'enhanced');
```

## 📈 Automated Scheduling

### Background Tasks:
- **Daily**: A/B test weight optimization
- **Weekly**: Performance analysis and reporting
- **Monthly**: Full model retraining (disabled by default)

### Manual Control:
```typescript
import { trainingScheduler } from '@/lib/scheduler';

// Start/stop scheduler
trainingScheduler.startScheduler();
trainingScheduler.stopScheduler();

// Enable specific tasks
trainingScheduler.enableTask('model-retraining');

// Run task immediately
trainingScheduler.runTaskNow('performance-analysis');

// Get status
const status = trainingScheduler.getTaskStatus();
```

## 🔒 Security & Admin Access

### Admin Key Setup:
```bash
# Add to your .env.local
ADMIN_SECRET_KEY=your-secure-admin-key-here
```

### Admin-Only Features:
- Model retraining
- A/B test management
- Bulk data analysis
- System performance tuning

## 🎛️ Configuration

### Environment Variables:
```bash
# Required for training system
DATABASE_URL=your-postgres-url
OPENAI_API_KEY=your-openai-key

# Optional for admin features
ADMIN_SECRET_KEY=your-admin-key

# Scheduler settings (optional)
NODE_ENV=production  # Auto-starts scheduler
```

### Database Migration:
```bash
# Generate migration for training tables
npm run db:generate

# Apply migrations
npm run db:migrate
```

## 📋 Training Data Schema

### Resize Sessions:
```sql
- id: Session identifier
- userId: User who performed resize  
- projectId: Associated project
- originalCanvas: Canvas state before resize
- targetDimensions: Desired new size
- aiResult: AI-generated result
- userRating: 1-5 star rating
- feedbackText: Optional user comments
- manualCorrections: User edits after AI
- processingTime: Performance metric
- createdAt: Timestamp
```

### Training Data:
```sql
- id: Training example identifier
- sessionId: Link to resize session
- inputFeatures: ML features (JSON)
- expectedOutput: Ideal result
- qualityScore: 0-1 training score
- validated: Ready for training
- createdAt: Timestamp
```

## 🎯 Success Metrics

### Quality Indicators:
- **High Rating Sessions**: ≥4 stars (target: >70%)
- **Feedback Rate**: User engagement (target: >50%)
- **Processing Time**: Speed optimization (target: <10s)
- **A/B Test Significance**: Statistical confidence (target: >95%)

### Performance Tracking:
- **Daily Active Sessions**: Growth in usage
- **Variant Performance**: A/B test winners
- **Manual Corrections**: Reduction over time
- **User Satisfaction**: Trend analysis

## 🚀 Next Steps for Advanced Training

### 1. **External ML Integration**:
```typescript
// Connect to TensorFlow.js or PyTorch
import * as tf from '@tensorflow/tfjs-node';

// Train custom model with collected data
const model = tf.sequential({...});
```

### 2. **Real-time Learning**:
- Online learning algorithms
- Continuous model updates
- Immediate feedback incorporation

### 3. **Advanced Features**:
- Multi-objective optimization
- Contextual bandit algorithms
- Bayesian optimization
- Ensemble methods

## 🎉 System Benefits

✅ **Continuous Improvement**: AI gets better with every user interaction  
✅ **Data-Driven Decisions**: A/B testing ensures optimal performance  
✅ **Automated Operations**: Self-managing system requires minimal maintenance  
✅ **User-Centric**: Optimizes based on real user preferences  
✅ **Scalable Architecture**: Handles growing user base efficiently  
✅ **Performance Monitoring**: Comprehensive analytics and alerting  

## 🔍 Monitoring Commands

```bash
# View current A/B test performance
console.log(ABTestingService.getPerformanceComparison());

# Check scheduler status
console.log(trainingScheduler.getTaskStatus());

# Manual retraining trigger
fetch('/api/ai/retrain-model', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ adminKey: 'your-key' })
});
```

Your AI resize system is now **fully self-learning** and will continuously improve based on user feedback! 🎉