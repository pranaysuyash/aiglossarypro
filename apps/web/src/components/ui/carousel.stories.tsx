import type { Meta, StoryObj } from '@storybook/react';
import { Card, CardContent } from './card';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from './carousel';

const meta: Meta<typeof Carousel> = {
  title: 'UI/Carousel',
  component: Carousel,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    orientation: {
      control: { type: 'select' },
      options: ['horizontal', 'vertical'],
    },
    opts: {
      control: { type: 'object' },
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <div className="w-full max-w-xs">
      <Carousel>
        <CarouselContent>
          {Array.from({ length: 5 }, (_, index) => (
            <CarouselItem key={index}>
              <div className="p-1">
                <Card>
                  <CardContent className="flex aspect-square items-center justify-center p-6">
                    <span className="text-4xl font-semibold">{index + 1}</span>
                  </CardContent>
                </Card>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious />
        <CarouselNext />
      </Carousel>
    </div>
  ),
};

export const AIGlossaryTerms: Story = {
  render: () => {
    const terms = [
      {
        title: 'Machine Learning',
        description:
          'A subset of AI that enables computers to learn from experience without explicit programming.',
        icon: '🤖',
      },
      {
        title: 'Deep Learning',
        description:
          'Neural networks with multiple layers that can model complex patterns in data.',
        icon: '🧠',
      },
      {
        title: 'Natural Language Processing',
        description: 'AI that helps computers understand and interpret human language.',
        icon: '💬',
      },
      {
        title: 'Computer Vision',
        description:
          'AI technology that enables machines to interpret and make decisions based on visual data.',
        icon: '👁️',
      },
      {
        title: 'Reinforcement Learning',
        description:
          'ML technique where agents learn through trial and error with rewards and penalties.',
        icon: '🎯',
      },
    ];

    return (
      <div className="w-full max-w-md">
        <Carousel>
          <CarouselContent>
            {terms.map((term, index) => (
              <CarouselItem key={index}>
                <div className="p-1">
                  <Card>
                    <CardContent className="p-6">
                      <div className="text-center space-y-4">
                        <div className="text-4xl">{term.icon}</div>
                        <h3 className="text-lg font-semibold">{term.title}</h3>
                        <p className="text-sm text-gray-600">{term.description}</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious />
          <CarouselNext />
        </Carousel>
      </div>
    );
  },
};

export const MultipleItems: Story = {
  render: () => (
    <div className="w-full max-w-sm">
      <Carousel
        opts={{
          align: 'start',
        }}
        className="w-full max-w-sm"
      >
        <CarouselContent className="-ml-2 md:-ml-4">
          {Array.from({ length: 8 }, (_, index) => (
            <CarouselItem key={index} className="pl-2 md:pl-4 md:basis-1/2">
              <div className="p-1">
                <Card>
                  <CardContent className="flex aspect-square items-center justify-center p-6">
                    <span className="text-2xl font-semibold">{index + 1}</span>
                  </CardContent>
                </Card>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious />
        <CarouselNext />
      </Carousel>
    </div>
  ),
};

export const ThreeItems: Story = {
  render: () => (
    <div className="w-full max-w-lg">
      <Carousel
        opts={{
          align: 'start',
        }}
        className="w-full max-w-lg"
      >
        <CarouselContent>
          {Array.from({ length: 9 }, (_, index) => (
            <CarouselItem key={index} className="md:basis-1/2 lg:basis-1/3">
              <div className="p-1">
                <Card>
                  <CardContent className="flex aspect-square items-center justify-center p-6">
                    <span className="text-3xl font-semibold">{index + 1}</span>
                  </CardContent>
                </Card>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious />
        <CarouselNext />
      </Carousel>
    </div>
  ),
};

export const VerticalOrientation: Story = {
  render: () => (
    <div className="h-80">
      <Carousel orientation="vertical" className="w-full max-w-xs mx-auto">
        <CarouselContent className="-mt-1 h-[320px]">
          {Array.from({ length: 5 }, (_, index) => (
            <CarouselItem key={index} className="pt-1 md:basis-1/3">
              <div className="p-1">
                <Card>
                  <CardContent className="flex items-center justify-center p-6">
                    <span className="text-3xl font-semibold">{index + 1}</span>
                  </CardContent>
                </Card>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious />
        <CarouselNext />
      </Carousel>
    </div>
  ),
};

export const ImageCarousel: Story = {
  render: () => {
    const images = [
      {
        src: 'https://picsum.photos/400/200?random=1',
        alt: 'AI Research Lab',
        title: 'AI Research Lab',
        description: 'State-of-the-art machine learning research facility',
      },
      {
        src: 'https://picsum.photos/400/200?random=2',
        alt: 'Neural Network Visualization',
        title: 'Neural Networks',
        description: 'Visual representation of deep learning architectures',
      },
      {
        src: 'https://picsum.photos/400/200?random=3',
        alt: 'Data Center',
        title: 'Data Processing',
        description: 'High-performance computing infrastructure for AI',
      },
      {
        src: 'https://picsum.photos/400/200?random=4',
        alt: 'Robot Assembly',
        title: 'Robotics',
        description: 'AI-powered robotic systems in manufacturing',
      },
    ];

    return (
      <div className="w-full max-w-md">
        <Carousel>
          <CarouselContent>
            {images.map((image, index) => (
              <CarouselItem key={index}>
                <div className="p-1">
                  <Card>
                    <CardContent className="p-0">
                      <div className="relative">
                        <img
                          src={image.src}
                          alt={image.alt}
                          className="w-full h-48 object-cover rounded-t-lg"
                        />
                        <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-60 text-white p-3 rounded-b-lg">
                          <h3 className="font-semibold">{image.title}</h3>
                          <p className="text-sm opacity-90">{image.description}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious />
          <CarouselNext />
        </Carousel>
      </div>
    );
  },
};

export const AutoPlay: Story = {
  render: () => {
    const featuredContent = [
      {
        title: 'Featured Article',
        subtitle: 'Understanding Transformers',
        content: 'Deep dive into the architecture that revolutionized NLP',
        badge: 'New',
      },
      {
        title: 'Weekly Spotlight',
        subtitle: 'Computer Vision Advances',
        content: 'Latest breakthroughs in image recognition and processing',
        badge: 'Trending',
      },
      {
        title: 'Expert Interview',
        subtitle: 'AI Ethics Discussion',
        content: 'Insights from leading researchers on responsible AI development',
        badge: 'Featured',
      },
    ];

    return (
      <div className="w-full max-w-lg">
        <Carousel
          opts={{
            align: 'start',
            loop: true,
          }}
        >
          <CarouselContent>
            {featuredContent.map((item, index) => (
              <CarouselItem key={index}>
                <div className="p-1">
                  <Card className="bg-gradient-to-br from-blue-50 to-indigo-100 border-blue-200">
                    <CardContent className="p-6">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-blue-600">{item.title}</span>
                          <span className="px-2 py-1 bg-blue-600 text-white text-xs rounded-full">
                            {item.badge}
                          </span>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900">{item.subtitle}</h3>
                        <p className="text-sm text-gray-600">{item.content}</p>
                        <button className="text-blue-600 text-sm font-medium hover:text-blue-700">
                          Read More →
                        </button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious />
          <CarouselNext />
        </Carousel>
      </div>
    );
  },
};

export const TestimonialCarousel: Story = {
  render: () => {
    const testimonials = [
      {
        quote:
          'This AI glossary has been invaluable for my machine learning studies. The definitions are clear and comprehensive.',
        author: 'Sarah Chen',
        role: 'ML Engineer',
        avatar: '👩‍💻',
      },
      {
        quote:
          'As a beginner in AI, I appreciate how complex concepts are explained in an accessible way.',
        author: 'Michael Rodriguez',
        role: 'CS Student',
        avatar: '👨‍🎓',
      },
      {
        quote:
          'The examples and use cases help me understand how these concepts apply in real-world scenarios.',
        author: 'Dr. Emily Watson',
        role: 'AI Researcher',
        avatar: '👩‍🔬',
      },
    ];

    return (
      <div className="w-full max-w-md">
        <Carousel>
          <CarouselContent>
            {testimonials.map((testimonial, index) => (
              <CarouselItem key={index}>
                <div className="p-1">
                  <Card>
                    <CardContent className="p-6">
                      <div className="space-y-4 text-center">
                        <div className="text-4xl">{testimonial.avatar}</div>
                        <blockquote className="text-sm text-gray-600 italic">
                          "{testimonial.quote}"
                        </blockquote>
                        <div>
                          <div className="font-semibold">{testimonial.author}</div>
                          <div className="text-sm text-gray-500">{testimonial.role}</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious />
          <CarouselNext />
        </Carousel>
      </div>
    );
  },
};

export const WithIndicators: Story = {
  render: () => {
    const [current, setCurrent] = React.useState(0);
    const slides = [
      { title: 'Slide 1', color: 'bg-red-100' },
      { title: 'Slide 2', color: 'bg-blue-100' },
      { title: 'Slide 3', color: 'bg-green-100' },
      { title: 'Slide 4', color: 'bg-yellow-100' },
    ];

    return (
      <div className="w-full max-w-xs space-y-4">
        <Carousel
          setApi={api => {
            if (!api) {return;}
            setCurrent(api.selectedScrollSnap());
            api.on('select', () => {
              setCurrent(api.selectedScrollSnap());
            });
          }}
        >
          <CarouselContent>
            {slides.map((slide, index) => (
              <CarouselItem key={index}>
                <div className="p-1">
                  <Card>
                    <CardContent
                      className={`flex aspect-square items-center justify-center p-6 ${slide.color}`}
                    >
                      <span className="text-2xl font-semibold">{slide.title}</span>
                    </CardContent>
                  </Card>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious />
          <CarouselNext />
        </Carousel>
        <div className="flex justify-center space-x-2">
          {slides.map((_, index) => (
            <button
              key={index}
              className={`w-2 h-2 rounded-full transition-colors ${
                index === current ? 'bg-blue-600' : 'bg-gray-300'
              }`}
              onClick={() => {
                // This would require API access to jump to specific slides
              }}
            />
          ))}
        </div>
      </div>
    );
  },
};

export const NoNavigation: Story = {
  render: () => (
    <div className="w-full max-w-xs">
      <Carousel>
        <CarouselContent>
          {Array.from({ length: 3 }, (_, index) => (
            <CarouselItem key={index}>
              <div className="p-1">
                <Card>
                  <CardContent className="flex aspect-square items-center justify-center p-6">
                    <span className="text-4xl font-semibold">{index + 1}</span>
                  </CardContent>
                </Card>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        {/* No navigation buttons */}
      </Carousel>
    </div>
  ),
};

export const SingleItem: Story = {
  render: () => (
    <div className="w-full max-w-xs">
      <Carousel>
        <CarouselContent>
          <CarouselItem>
            <div className="p-1">
              <Card>
                <CardContent className="flex aspect-square items-center justify-center p-6">
                  <div className="text-center">
                    <div className="text-4xl mb-2">🎯</div>
                    <div className="text-xl font-semibold">Single Slide</div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </CarouselItem>
        </CarouselContent>
        <CarouselPrevious />
        <CarouselNext />
      </Carousel>
    </div>
  ),
};
