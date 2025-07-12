import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import VideoPlayer from './video-player';

const meta: Meta<typeof VideoPlayer> = {
  title: 'UI/VideoPlayer',
  component: VideoPlayer,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'A customizable video player component with advanced controls, subtitles support, and download functionality.',
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof VideoPlayer>;

// Sample video URLs (using placeholder videos for demo)
const SAMPLE_VIDEO = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';
const SAMPLE_POSTER = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/BigBuckBunny.jpg';

export const BasicVideo: Story = {
  args: {
    src: SAMPLE_VIDEO,
    title: 'Introduction to Machine Learning',
    description: 'A comprehensive overview of ML fundamentals and key concepts',
    poster: SAMPLE_POSTER,
    controls: true,
  },
};

export const AutoplayVideo: Story = {
  args: {
    src: SAMPLE_VIDEO,
    title: 'Algorithm Demonstration',
    description: 'Watch this algorithm in action with step-by-step explanation',
    autoplay: true,
    muted: true,
    controls: true,
  },
};

export const LoopingVideo: Story = {
  args: {
    src: SAMPLE_VIDEO,
    title: 'Continuous Process Demo',
    description: 'This video demonstrates a continuous process that loops',
    loop: true,
    controls: true,
  },
};

export const WithSubtitles: Story = {
  args: {
    src: SAMPLE_VIDEO,
    title: 'Expert Interview',
    description: 'Interview with Dr. Sarah Chen on the future of AI',
    controls: true,
    subtitles: [
      {
        src: '/subtitles/en.vtt',
        language: 'en',
        label: 'English',
      },
      {
        src: '/subtitles/es.vtt', 
        language: 'es',
        label: 'Español',
      },
    ],
  },
};

export const MinimalPlayer: Story = {
  args: {
    src: SAMPLE_VIDEO,
    title: 'Quick Demo',
    controls: false,
    autoplay: true,
    muted: true,
    loop: true,
  },
};

export const ErrorState: Story = {
  args: {
    src: 'https://invalid-video-url.mp4',
    title: 'Video Not Found',
    description: 'This demonstrates the error state when video fails to load',
    controls: true,
  },
};

export const InterviewFormat: Story = {
  args: {
    src: SAMPLE_VIDEO,
    title: 'Q&A with AI Researchers',
    description: 'Deep dive into current AI research trends and future predictions',
    poster: SAMPLE_POSTER,
    controls: true,
    subtitles: [
      {
        src: '/subtitles/en.vtt',
        language: 'en',
        label: 'English Captions',
      },
    ],
  },
};

export const TutorialVideo: Story = {
  args: {
    src: SAMPLE_VIDEO,
    title: 'Hands-on Tutorial: Building Your First Neural Network',
    description: 'Follow along as we build a neural network from scratch using Python and TensorFlow',
    poster: SAMPLE_POSTER,
    controls: true,
  },
};