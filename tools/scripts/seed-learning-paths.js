#!/usr/bin/env node
/**
 * Seed Learning Paths Script
 * Populates the database with curated learning paths for AI/ML education
 */
import { eq, sql } from 'drizzle-orm';
import { db } from '../server/db';
import { enhancedTerms, learningPathSteps, learningPaths, } from '../shared/enhancedSchema';
const LEARNING_PATH_TEMPLATES = [
    {
        name: 'AI Fundamentals: From Zero to Hero',
        description: "A comprehensive introduction to Artificial Intelligence for absolute beginners. Learn the core concepts, terminology, and applications of AI in today's world.",
        difficulty_level: 'beginner',
        category: 'Artificial Intelligence',
        estimated_duration_hours: 20,
        tags: ['beginner-friendly', 'comprehensive', 'fundamentals', 'no-code'],
        learning_outcomes: [
            'Understand what AI is and how it works',
            'Differentiate between AI, ML, and Deep Learning',
            'Identify real-world AI applications',
            'Grasp ethical considerations in AI',
        ],
        steps: [
            {
                termName: 'Artificial Intelligence',
                description: 'Introduction to AI: Definition, history, and impact',
                duration_minutes: 45,
            },
            {
                termName: 'Machine Learning',
                description: 'Understanding how machines learn from data',
                duration_minutes: 60,
            },
            {
                termName: 'Supervised Learning',
                description: 'Learning with labeled examples',
                duration_minutes: 90,
            },
            {
                termName: 'Unsupervised Learning',
                description: 'Finding patterns in unlabeled data',
                duration_minutes: 90,
            },
            {
                termName: 'Neural Networks',
                description: 'The building blocks of deep learning',
                duration_minutes: 120,
            },
            {
                termName: 'Deep Learning',
                description: 'Advanced neural network architectures',
                duration_minutes: 120,
            },
            {
                termName: 'Natural Language Processing',
                description: 'How AI understands human language',
                duration_minutes: 90,
            },
            {
                termName: 'Computer Vision',
                description: 'Teaching machines to see and understand images',
                duration_minutes: 90,
            },
            {
                termName: 'Ethics in AI',
                description: 'Responsible AI development and deployment',
                duration_minutes: 60,
            },
        ],
    },
    {
        name: 'Deep Learning Mastery',
        description: 'Master the art of deep learning with hands-on projects. Build neural networks from scratch and implement state-of-the-art architectures.',
        difficulty_level: 'advanced',
        category: 'Deep Learning',
        estimated_duration_hours: 40,
        tags: ['hands-on', 'practical', 'coding', 'projects'],
        prerequisites: ['Python programming', 'Linear algebra basics', 'Calculus fundamentals'],
        learning_outcomes: [
            'Build neural networks from scratch',
            'Implement CNNs for image classification',
            'Create RNNs for sequence modeling',
            'Deploy deep learning models to production',
        ],
        steps: [
            {
                termName: 'Backpropagation',
                description: 'The mathematics behind neural network training',
                duration_minutes: 180,
            },
            {
                termName: 'Gradient Descent',
                description: 'Optimization algorithms for neural networks',
                duration_minutes: 120,
            },
            {
                termName: 'Convolutional Neural Networks',
                description: 'Building CNNs for computer vision',
                duration_minutes: 240,
            },
            {
                termName: 'Recurrent Neural Networks',
                description: 'RNNs for sequential data processing',
                duration_minutes: 240,
            },
            {
                termName: 'LSTM',
                description: 'Long Short-Term Memory networks',
                duration_minutes: 180,
            },
            {
                termName: 'Transformer Architecture',
                description: 'The foundation of modern NLP',
                duration_minutes: 300,
            },
            {
                termName: 'Attention Mechanism',
                description: 'Understanding self-attention and multi-head attention',
                duration_minutes: 180,
            },
            {
                termName: 'Transfer Learning',
                description: 'Leveraging pre-trained models',
                duration_minutes: 120,
            },
            {
                termName: 'Model Deployment',
                description: 'Putting models into production',
                duration_minutes: 180,
            },
        ],
    },
    {
        name: 'Natural Language Processing Journey',
        description: 'Explore the fascinating world of NLP from basic text processing to advanced language models. Build chatbots, sentiment analyzers, and more.',
        difficulty_level: 'intermediate',
        category: 'Natural Language Processing',
        estimated_duration_hours: 30,
        tags: ['nlp', 'text-processing', 'language-models', 'practical'],
        prerequisites: ['Python basics', 'Machine Learning fundamentals'],
        learning_outcomes: [
            'Process and analyze text data',
            'Build sentiment analysis systems',
            'Create chatbots and conversational AI',
            'Fine-tune language models',
        ],
        steps: [
            {
                termName: 'Tokenization',
                description: 'Breaking text into meaningful units',
                duration_minutes: 60,
            },
            {
                termName: 'Word Embeddings',
                description: 'Representing words as vectors',
                duration_minutes: 120,
            },
            {
                termName: 'Named Entity Recognition',
                description: 'Identifying entities in text',
                duration_minutes: 90,
            },
            {
                termName: 'Sentiment Analysis',
                description: 'Determining emotional tone of text',
                duration_minutes: 120,
            },
            {
                termName: 'Text Classification',
                description: 'Categorizing documents automatically',
                duration_minutes: 120,
            },
            {
                termName: 'Sequence to Sequence Models',
                description: 'Building translation and summarization systems',
                duration_minutes: 180,
            },
            {
                termName: 'BERT',
                description: 'Bidirectional Encoder Representations from Transformers',
                duration_minutes: 180,
            },
            {
                termName: 'GPT',
                description: 'Generative Pre-trained Transformers',
                duration_minutes: 180,
            },
            {
                termName: 'Fine-tuning',
                description: 'Adapting pre-trained models to specific tasks',
                duration_minutes: 120,
            },
        ],
    },
    {
        name: 'Computer Vision Bootcamp',
        description: 'From pixels to perception - learn how to build computer vision systems that can see and understand the visual world.',
        difficulty_level: 'intermediate',
        category: 'Computer Vision',
        estimated_duration_hours: 35,
        tags: ['computer-vision', 'image-processing', 'deep-learning', 'opencv'],
        prerequisites: ['Python programming', 'Basic machine learning'],
        learning_outcomes: [
            'Process and manipulate images',
            'Build object detection systems',
            'Implement face recognition',
            'Create image segmentation models',
        ],
        steps: [
            {
                termName: 'Image Processing',
                description: 'Fundamentals of digital image manipulation',
                duration_minutes: 120,
            },
            {
                termName: 'Convolutional Neural Networks',
                description: 'CNNs for image classification',
                duration_minutes: 180,
            },
            {
                termName: 'Object Detection',
                description: 'Detecting and localizing objects in images',
                duration_minutes: 240,
            },
            {
                termName: 'Image Segmentation',
                description: 'Pixel-level classification',
                duration_minutes: 180,
            },
            {
                termName: 'Face Recognition',
                description: 'Building facial recognition systems',
                duration_minutes: 150,
            },
            {
                termName: 'Data Augmentation',
                description: 'Enhancing training data for better models',
                duration_minutes: 90,
            },
            {
                termName: 'Transfer Learning',
                description: 'Using pre-trained vision models',
                duration_minutes: 120,
            },
            {
                termName: 'YOLO',
                description: 'Real-time object detection',
                duration_minutes: 180,
            },
            {
                termName: 'Edge Detection',
                description: 'Finding boundaries and features',
                duration_minutes: 90,
            },
        ],
    },
    {
        name: 'Reinforcement Learning: From Theory to Practice',
        description: 'Master the art of teaching machines to make decisions through trial and error. Build game-playing agents and autonomous systems.',
        difficulty_level: 'advanced',
        category: 'Reinforcement Learning',
        estimated_duration_hours: 45,
        tags: ['rl', 'decision-making', 'autonomous-systems', 'games'],
        prerequisites: [
            'Strong Python skills',
            'Probability and statistics',
            'Machine learning basics',
        ],
        learning_outcomes: [
            'Understand RL fundamentals and algorithms',
            'Implement Q-learning and policy gradient methods',
            'Build game-playing agents',
            'Apply RL to real-world problems',
        ],
        steps: [
            {
                termName: 'Reinforcement Learning',
                description: 'Introduction to RL concepts and framework',
                duration_minutes: 120,
            },
            {
                termName: 'Markov Decision Process',
                description: 'Mathematical foundation of RL',
                duration_minutes: 180,
            },
            {
                termName: 'Q-Learning',
                description: 'Value-based learning algorithms',
                duration_minutes: 240,
            },
            {
                termName: 'Deep Q-Networks',
                description: 'Combining deep learning with Q-learning',
                duration_minutes: 240,
            },
            {
                termName: 'Policy Gradient Methods',
                description: 'Direct policy optimization',
                duration_minutes: 240,
            },
            {
                termName: 'Actor-Critic',
                description: 'Combining value and policy methods',
                duration_minutes: 180,
            },
            {
                termName: 'Proximal Policy Optimization',
                description: 'State-of-the-art RL algorithm',
                duration_minutes: 240,
            },
            {
                termName: 'Multi-Agent Reinforcement Learning',
                description: 'RL with multiple agents',
                duration_minutes: 180,
            },
            {
                termName: 'Reward Engineering',
                description: 'Designing effective reward functions',
                duration_minutes: 120,
            },
        ],
    },
    {
        name: 'Machine Learning for Data Scientists',
        description: 'A practical guide to machine learning focused on real-world data science applications. Learn to build, evaluate, and deploy ML models.',
        difficulty_level: 'intermediate',
        category: 'Machine Learning',
        estimated_duration_hours: 25,
        tags: ['data-science', 'practical', 'sklearn', 'modeling'],
        prerequisites: ['Python', 'Statistics basics', 'Data manipulation with pandas'],
        learning_outcomes: [
            'Build end-to-end ML pipelines',
            'Evaluate and optimize models',
            'Handle real-world data challenges',
            'Deploy models to production',
        ],
        steps: [
            {
                termName: 'Feature Engineering',
                description: 'Creating meaningful features from raw data',
                duration_minutes: 150,
            },
            {
                termName: 'Cross-validation',
                description: 'Proper model evaluation techniques',
                duration_minutes: 90,
            },
            {
                termName: 'Overfitting',
                description: 'Understanding and preventing overfitting',
                duration_minutes: 90,
            },
            {
                termName: 'Regularization',
                description: 'L1, L2, and elastic net regularization',
                duration_minutes: 120,
            },
            {
                termName: 'Ensemble Methods',
                description: 'Combining multiple models for better performance',
                duration_minutes: 180,
            },
            {
                termName: 'Random Forest',
                description: 'Building and tuning random forest models',
                duration_minutes: 120,
            },
            {
                termName: 'Gradient Boosting',
                description: 'XGBoost and other boosting algorithms',
                duration_minutes: 150,
            },
            {
                termName: 'Model Selection',
                description: 'Choosing the right algorithm for your problem',
                duration_minutes: 90,
            },
            {
                termName: 'Model Deployment',
                description: 'Putting models into production',
                duration_minutes: 120,
            },
        ],
    },
    {
        name: 'AI Ethics and Responsible AI',
        description: 'Explore the critical ethical considerations in AI development. Learn to build fair, transparent, and accountable AI systems.',
        difficulty_level: 'beginner',
        category: 'Ethics & Bias',
        estimated_duration_hours: 15,
        tags: ['ethics', 'fairness', 'bias', 'responsible-ai'],
        learning_outcomes: [
            'Identify ethical challenges in AI',
            'Detect and mitigate bias in models',
            'Implement fairness metrics',
            'Build transparent AI systems',
        ],
        steps: [
            {
                termName: 'Ethics in AI',
                description: 'Overview of AI ethics and why it matters',
                duration_minutes: 90,
            },
            {
                termName: 'Bias in Machine Learning',
                description: 'Understanding different types of bias',
                duration_minutes: 120,
            },
            {
                termName: 'Fairness',
                description: 'Defining and measuring fairness in AI',
                duration_minutes: 120,
            },
            {
                termName: 'Explainability',
                description: 'Making AI decisions interpretable',
                duration_minutes: 150,
            },
            {
                termName: 'Privacy in Machine Learning',
                description: 'Protecting user data in AI systems',
                duration_minutes: 120,
            },
            {
                termName: 'Differential Privacy',
                description: 'Mathematical privacy guarantees',
                duration_minutes: 120,
            },
            {
                termName: 'AI Governance',
                description: 'Frameworks for responsible AI deployment',
                duration_minutes: 90,
            },
            {
                termName: 'Adversarial Machine Learning',
                description: 'Security considerations in AI',
                duration_minutes: 90,
            },
        ],
    },
    {
        name: 'Generative AI Revolution',
        description: 'Dive into the world of generative AI. Learn to work with and build systems that can create text, images, and more.',
        difficulty_level: 'intermediate',
        category: 'Generative AI',
        estimated_duration_hours: 28,
        tags: ['generative-ai', 'llms', 'diffusion', 'creative-ai'],
        prerequisites: ['Deep learning basics', 'Python programming'],
        learning_outcomes: [
            'Understand generative model architectures',
            'Work with large language models',
            'Build image generation systems',
            'Fine-tune generative models',
        ],
        steps: [
            {
                termName: 'Generative Adversarial Networks',
                description: 'Understanding GANs and their applications',
                duration_minutes: 180,
            },
            {
                termName: 'Variational Autoencoders',
                description: 'Probabilistic generative models',
                duration_minutes: 150,
            },
            {
                termName: 'Transformer Architecture',
                description: 'Foundation of modern language models',
                duration_minutes: 180,
            },
            {
                termName: 'GPT',
                description: 'Generative Pre-trained Transformers in depth',
                duration_minutes: 180,
            },
            {
                termName: 'Prompt Engineering',
                description: 'Crafting effective prompts for LLMs',
                duration_minutes: 120,
            },
            {
                termName: 'Diffusion Models',
                description: 'State-of-the-art image generation',
                duration_minutes: 180,
            },
            {
                termName: 'Fine-tuning',
                description: 'Adapting generative models to specific tasks',
                duration_minutes: 150,
            },
            {
                termName: 'Stable Diffusion',
                description: 'Open-source image generation',
                duration_minutes: 120,
            },
            {
                termName: 'Multimodal Models',
                description: 'Models that understand text and images',
                duration_minutes: 120,
            },
        ],
    },
];
async function seedLearningPaths() {
    console.log('🚀 Starting Learning Paths Seed Script');
    console.log('=====================================');
    try {
        // Get all categories for validation
        const allCategories = await db.query.categories.findMany();
        const categoryMap = new Map(allCategories.map(c => [c.name, c.id]));
        // Track created paths
        let createdPaths = 0;
        let createdSteps = 0;
        let skippedPaths = 0;
        for (const template of LEARNING_PATH_TEMPLATES) {
            console.log(`\n📚 Processing: ${template.name}`);
            // Check if path already exists
            const existingPath = await db.query.learningPaths.findFirst({
                where: eq(learningPaths.name, template.name),
            });
            if (existingPath) {
                console.log('   ⚠️  Path already exists, skipping...');
                skippedPaths++;
                continue;
            }
            // Get category ID
            const categoryId = categoryMap.get(template.category);
            if (!categoryId) {
                console.log(`   ❌ Category "${template.category}" not found, skipping...`);
                continue;
            }
            // Create the learning path
            const [newPath] = await db
                .insert(learningPaths)
                .values({
                name: template.name,
                description: template.description,
                difficulty_level: template.difficulty_level,
                category_id: categoryId,
                estimated_duration: template.estimated_duration_hours,
                is_published: true,
                is_featured: template.difficulty_level === 'beginner', // Feature beginner paths
                tags: template.tags,
                prerequisites: template.prerequisites || [],
                learning_outcomes: template.learning_outcomes,
                metadata: {
                    version: '1.0',
                    last_reviewed: new Date().toISOString(),
                    author: 'AI Glossary Pro Team',
                },
                created_by: 'system',
                view_count: 0,
                enrollment_count: 0,
                completion_count: 0,
                average_rating: null,
                total_ratings: 0,
            })
                .returning();
            console.log(`   ✅ Created learning path: ${newPath.id}`);
            createdPaths++;
            // Add steps
            let stepOrder = 1;
            for (const stepTemplate of template.steps) {
                // Find the term
                const term = await db.query.enhancedTerms.findFirst({
                    where: eq(enhancedTerms.name, stepTemplate.termName),
                });
                if (!term) {
                    console.log(`   ⚠️  Term "${stepTemplate.termName}" not found, skipping step...`);
                    continue;
                }
                // Create the step
                await db.insert(learningPathSteps).values({
                    path_id: newPath.id,
                    term_id: term.id,
                    order_index: stepOrder++,
                    title: stepTemplate.termName,
                    description: stepTemplate.description,
                    estimated_duration: stepTemplate.duration_minutes,
                    content_type: 'term',
                    resources: stepTemplate.resources || [],
                    is_optional: false,
                    metadata: {
                        difficulty: term.difficultyLevel || template.difficulty_level,
                        hasInteractiveElements: term.hasInteractiveElements || false,
                        hasImplementation: term.hasImplementation || false,
                    },
                });
                createdSteps++;
                console.log(`   ➕ Added step ${stepOrder - 1}: ${stepTemplate.termName}`);
            }
            // Update total duration based on actual steps
            const totalMinutes = template.steps.reduce((sum, step) => sum + step.duration_minutes, 0);
            await db
                .update(learningPaths)
                .set({
                estimated_duration: Math.ceil(totalMinutes / 60),
                metadata: sql `jsonb_set(metadata, '{total_steps}', '${stepOrder - 1}'::jsonb)`,
            })
                .where(eq(learningPaths.id, newPath.id));
        }
        // Summary
        console.log('\n📊 Seed Summary');
        console.log('===============');
        console.log(`✅ Created ${createdPaths} learning paths`);
        console.log(`✅ Created ${createdSteps} learning steps`);
        console.log(`⚠️  Skipped ${skippedPaths} existing paths`);
        console.log(`📚 Total paths in database: ${createdPaths + skippedPaths}`);
        // Create some sample user progress for testing
        console.log('\n🧪 Creating sample progress data...');
        // Get a sample learning path
        const samplePath = await db.query.learningPaths.findFirst({
            where: eq(learningPaths.name, 'AI Fundamentals: From Zero to Hero'),
        });
        if (samplePath) {
            // Get the steps
            const steps = await db.query.learningPathSteps.findMany({
                where: eq(learningPathSteps.path_id, samplePath.id),
                orderBy: learningPathSteps.order_index,
            });
            if (steps.length > 2) {
                // Create sample progress
                const [progress] = await db
                    .insert(userLearningProgress)
                    .values({
                    user_id: 'sample-user-123',
                    path_id: samplePath.id,
                    status: 'in_progress',
                    progress_percentage: 33,
                    current_step_id: steps[2].id,
                    completed_steps: 2,
                    total_time_spent: 180, // 3 hours
                    last_accessed_at: new Date(),
                    started_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
                    notes: ['Great introduction to AI!', 'Machine learning section was very helpful'],
                })
                    .returning();
                // Mark first two steps as completed
                for (let i = 0; i < 2; i++) {
                    await db.insert(stepCompletions).values({
                        progress_id: progress.id,
                        step_id: steps[i].id,
                        completed_at: new Date(Date.now() - (7 - i) * 24 * 60 * 60 * 1000),
                        time_spent: steps[i].estimated_duration || 60,
                        quiz_score: Math.floor(Math.random() * 20) + 80, // 80-100
                        notes: `Completed step ${i + 1}`,
                    });
                }
                console.log('✅ Created sample user progress');
            }
        }
        console.log('\n✨ Learning paths seed completed successfully!');
        process.exit(0);
    }
    catch (error) {
        console.error('\n❌ Error seeding learning paths:', error);
        process.exit(1);
    }
}
// Run the seed script
seedLearningPaths().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});
