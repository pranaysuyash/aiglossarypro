import { BookOpen, CheckCircle, Clock, Target } from 'lucide-react';
import { Link } from 'wouter';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

interface LearningPath {
  title: string;
  description: string;
  duration: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  topics: string[];
  featured?: boolean;
}

const learningPaths: LearningPath[] = [
  {
    title: 'AI Fundamentals: From Zero to Hero',
    description:
      'Perfect for beginners starting their AI journey. Learn core concepts step by step.',
    duration: '20 hours',
    level: 'beginner',
    topics: ['What is AI?', 'Machine Learning Basics', 'Neural Networks', 'Ethics in AI'],
    featured: true,
  },
  {
    title: 'Deep Learning Mastery',
    description: 'Build neural networks from scratch and implement state-of-the-art architectures.',
    duration: '40 hours',
    level: 'advanced',
    topics: ['CNNs', 'RNNs', 'Transformers', 'Model Deployment'],
  },
  {
    title: 'Natural Language Processing Journey',
    description: 'From text processing to advanced language models. Build chatbots and more.',
    duration: '30 hours',
    level: 'intermediate',
    topics: ['Tokenization', 'Word Embeddings', 'BERT', 'GPT'],
  },
];

export function LearningPathsSection() {
  const getLevelColor = (level: string) => {
    switch (level) {
      case 'beginner':
        return 'bg-green-100 text-green-800';
      case 'intermediate':
        return 'bg-yellow-100 text-yellow-800';
      case 'advanced':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <section className="py-16 sm:py-20 lg:py-24 bg-gradient-to-b from-white to-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <Target className="w-8 h-8 text-blue-600 mr-2" />
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
              Structured Learning Paths
            </h2>
          </div>
          <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto">
            Follow curated learning journeys designed by experts. Master AI/ML concepts with a clear
            roadmap.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {learningPaths.map((path, index) => (
            <Card
              key={index}
              className={`h-full hover:shadow-lg transition-shadow ${
                path.featured ? 'border-blue-500 relative' : ''
              }`}
            >
              {path.featured && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-blue-600 text-white">Most Popular</Badge>
                </div>
              )}
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between mb-2">
                  <CardTitle className="text-lg">{path.title}</CardTitle>
                  <BookOpen className="w-5 h-5 text-gray-400" />
                </div>
                <p className="text-sm text-gray-600">{path.description}</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4 text-sm">
                  <Badge className={getLevelColor(path.level)} variant="secondary">
                    {path.level}
                  </Badge>
                  <div className="flex items-center text-gray-500">
                    <Clock className="w-4 h-4 mr-1" />
                    {path.duration}
                  </div>
                </div>

                <div>
                  <p className="text-xs text-gray-500 mb-2">Topics covered:</p>
                  <div className="space-y-1">
                    {path.topics.map((topic, idx) => (
                      <div key={idx} className="flex items-center text-sm">
                        <CheckCircle className="w-3 h-3 text-green-500 mr-2 flex-shrink-0" />
                        <span className="text-gray-700">{topic}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center">
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link to="/learning-paths">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
                <BookOpen className="w-5 h-5 mr-2" />
                Explore All Learning Paths
              </Button>
            </Link>
            <p className="text-sm text-gray-600">
              8 comprehensive paths • 200+ hours of structured content
            </p>
          </div>
        </div>

        {/* Benefits of Learning Paths */}
        <div className="mt-16 grid md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Target className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="font-semibold mb-2">Structured Progress</h3>
            <p className="text-sm text-gray-600">
              Follow a clear roadmap from basics to advanced concepts
            </p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="font-semibold mb-2">Track Your Learning</h3>
            <p className="text-sm text-gray-600">
              Monitor progress and earn certificates of completion
            </p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="font-semibold mb-2">Expert-Curated</h3>
            <p className="text-sm text-gray-600">
              Paths designed by AI/ML professionals for optimal learning
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
