import { CheckCircle, Quote, Star, TrendingUp } from 'lucide-react';
import type React from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

interface SuccessStory {
  id: string;
  name: string;
  role: string;
  avatar: string;
  rating: number;
  testimonial: string;
  result: string;
  journey: 'free-to-lifetime' | 'immediate-lifetime' | 'long-term-free';
  date: string;
}

const successStories: SuccessStory[] = [
  {
    id: '1',
    name: 'Sarah Chen',
    role: 'Data Science Student',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
    rating: 5,
    testimonial:
      'Started with the free tier to learn basic ML terms. Within a week, I upgraded to lifetime access. The comprehensive explanations helped me ace my interviews!',
    result: 'Landed a role at a FAANG company',
    journey: 'free-to-lifetime',
    date: '2024-11',
  },
  {
    id: '2',
    name: 'Marcus Johnson',
    role: 'Senior Developer',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Marcus',
    rating: 5,
    testimonial:
      'As an experienced developer transitioning to ML, I needed quick, accurate definitions. The lifetime access pays for itself compared to monthly subscriptions.',
    result: 'Successfully transitioned to ML Engineer',
    journey: 'immediate-lifetime',
    date: '2024-10',
  },
  {
    id: '3',
    name: 'Priya Patel',
    role: 'AI Researcher',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Priya',
    rating: 5,
    testimonial:
      'Used the free tier for 3 months while writing my thesis. The 50 daily terms were perfect for my research pace. Eventually upgraded for the export features.',
    result: 'Published 2 research papers',
    journey: 'free-to-lifetime',
    date: '2024-09',
  },
  {
    id: '4',
    name: 'Alex Rodriguez',
    role: 'Product Manager',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex',
    rating: 5,
    testimonial:
      'The free tier helped me understand AI terminology for product discussions. Now with lifetime access, I reference it daily for feature planning.',
    result: 'Leading AI product initiatives',
    journey: 'free-to-lifetime',
    date: '2024-12',
  },
];

const journeyBadges = {
  'free-to-lifetime': {
    label: 'Free → Lifetime',
    color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  },
  'immediate-lifetime': {
    label: 'Direct Lifetime',
    color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  },
  'long-term-free': {
    label: 'Long-term Free User',
    color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  },
};

interface SuccessStoryCardProps {
  story: SuccessStory;
}

const SuccessStoryCard: React.FC<SuccessStoryCardProps> = ({ story }) => {
  return (
    <Card className="h-full hover:shadow-xl transition-shadow duration-300">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <img src={story.avatar} alt={story.name} className="w-12 h-12 rounded-full" />
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white">{story.name}</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">{story.role}</p>
            </div>
          </div>
          <Badge className={journeyBadges[story.journey].color}>
            {journeyBadges[story.journey].label}
          </Badge>
        </div>

        <div className="flex items-center gap-1 mb-3">
          {[...Array(story.rating)].map((_, i) => (
            <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
          ))}
        </div>

        <div className="relative mb-4">
          <Quote className="absolute -top-2 -left-2 w-8 h-8 text-gray-200 dark:text-gray-700" />
          <p className="text-gray-700 dark:text-gray-300 italic pl-6">{story.testimonial}</p>
        </div>

        <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
          <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
          <p className="text-sm font-medium text-green-800 dark:text-green-300">{story.result}</p>
        </div>
      </CardContent>
    </Card>
  );
};

export const SuccessStoriesSection: React.FC = () => {
  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Success Stories from Our Community
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            See how learners progressed from our free tier to lifetime access and achieved their
            AI/ML goals
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {successStories.map(story => (
            <SuccessStoryCard key={story.id} story={story} />
          ))}
        </div>

        <div className="mt-12 text-center">
          <div className="inline-flex items-center gap-2 p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
            <TrendingUp className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <p className="text-indigo-800 dark:text-indigo-300 font-medium">
              Join 10,000+ learners who started with our free tier
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export const MiniSuccessStories: React.FC = () => {
  const miniStories = successStories.slice(0, 2);

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">What Our Users Say</h3>
      {miniStories.map(story => (
        <div key={story.id} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
          <div className="flex items-center gap-3 mb-2">
            <img src={story.avatar} alt={story.name} className="w-8 h-8 rounded-full" />
            <div className="flex-1">
              <p className="font-medium text-gray-900 dark:text-white text-sm">{story.name}</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">{story.role}</p>
            </div>
            <Badge className={`text-xs ${journeyBadges[story.journey].color}`}>
              {journeyBadges[story.journey].label}
            </Badge>
          </div>
          <p className="text-sm text-gray-700 dark:text-gray-300 italic mb-2">
            "{story.testimonial.substring(0, 100)}..."
          </p>
          <p className="text-xs font-medium text-green-700 dark:text-green-400">✓ {story.result}</p>
        </div>
      ))}
    </div>
  );
};
