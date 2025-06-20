import { db } from "./db";
import { terms, categories, subcategories, termSubcategories } from "@shared/schema";
import { eq } from "drizzle-orm";

async function quickSeed() {
  console.log("🌱 Starting quick seed...");

  // Sample terms data
  const sampleTerms = [
    {
      name: "Neural Network",
      shortDefinition: "A computing system inspired by biological neural networks",
      definition: "A neural network is a computing system that is inspired by the way biological neural networks in the human brain process information. It consists of interconnected nodes (neurons) that work together to solve problems through machine learning.",
      keyCharacteristics: ["Interconnected nodes", "Pattern recognition", "Learning capability", "Non-linear processing"],
      categoryName: "Deep Learning"
    },
    {
      name: "Machine Learning",
      shortDefinition: "A subset of AI that enables computers to learn without explicit programming",
      definition: "Machine learning is a subset of artificial intelligence that provides systems the ability to automatically learn and improve from experience without being explicitly programmed. It focuses on the development of computer programs that can access data and use it to learn for themselves.",
      keyCharacteristics: ["Automated learning", "Pattern recognition", "Data-driven", "Predictive modeling"],
      categoryName: "Machine Learning"
    },
    {
      name: "Deep Learning",
      shortDefinition: "A subset of ML using neural networks with multiple layers",
      definition: "Deep learning is a subset of machine learning that uses neural networks with multiple layers (deep neural networks) to model and understand complex patterns in data. It's particularly effective for tasks like image recognition, natural language processing, and speech recognition.",
      keyCharacteristics: ["Multiple layers", "Feature extraction", "Hierarchical learning", "Large datasets"],
      categoryName: "Deep Learning"
    },
    {
      name: "Convolutional Neural Network",
      shortDefinition: "A deep learning algorithm particularly effective for image processing",
      definition: "A Convolutional Neural Network (CNN) is a type of deep learning algorithm that is particularly effective for image processing and computer vision tasks. It uses convolutional layers to detect features in input data through the application of filters.",
      keyCharacteristics: ["Convolutional layers", "Feature maps", "Pooling", "Local connectivity"],
      categoryName: "Deep Learning"
    },
    {
      name: "Natural Language Processing",
      shortDefinition: "AI field focused on interaction between computers and human language",
      definition: "Natural Language Processing (NLP) is a field of artificial intelligence that focuses on the interaction between computers and humans through natural language. It involves the development of algorithms and models that can understand, interpret, and generate human language.",
      keyCharacteristics: ["Text processing", "Language understanding", "Semantic analysis", "Context awareness"],
      categoryName: "Artificial Intelligence"
    },
    {
      name: "Supervised Learning",
      shortDefinition: "ML approach using labeled training data",
      definition: "Supervised learning is a machine learning approach where the algorithm learns from labeled training data to make predictions or classifications on new, unseen data. The model is trained using input-output pairs to learn the mapping function.",
      keyCharacteristics: ["Labeled data", "Training phase", "Prediction accuracy", "Performance metrics"],
      categoryName: "Machine Learning"
    },
    {
      name: "Unsupervised Learning",
      shortDefinition: "ML approach that finds patterns in data without labeled examples",
      definition: "Unsupervised learning is a machine learning approach that finds patterns and structures in data without the use of labeled examples. It discovers hidden patterns in data where you don't know the desired output.",
      keyCharacteristics: ["No labeled data", "Pattern discovery", "Clustering", "Dimensionality reduction"],
      categoryName: "Machine Learning"
    },
    {
      name: "Reinforcement Learning",
      shortDefinition: "ML approach where agents learn through interaction with environment",
      definition: "Reinforcement learning is a machine learning approach where an agent learns to make decisions by performing actions in an environment to maximize cumulative reward. The agent learns through trial and error, receiving feedback in the form of rewards or penalties.",
      keyCharacteristics: ["Agent-environment interaction", "Reward-based learning", "Sequential decisions", "Exploration vs exploitation"],
      categoryName: "Machine Learning"
    },
    {
      name: "Artificial Intelligence",
      shortDefinition: "Computer systems able to perform tasks requiring human intelligence",
      definition: "Artificial Intelligence (AI) refers to computer systems that are able to perform tasks that typically require human intelligence, such as visual perception, speech recognition, decision-making, and language translation.",
      keyCharacteristics: ["Problem solving", "Learning", "Reasoning", "Perception"],
      categoryName: "Artificial Intelligence"
    },
    {
      name: "Random Forest",
      shortDefinition: "Ensemble learning method using multiple decision trees",
      definition: "Random Forest is an ensemble learning method that operates by constructing multiple decision trees during training and outputting the class that is the mode of the classes (classification) or mean prediction (regression) of the individual trees.",
      keyCharacteristics: ["Ensemble method", "Multiple decision trees", "Bootstrap sampling", "Feature randomness"],
      categoryName: "Machine Learning"
    }
  ];

  try {
    // Get existing categories
    const existingCategories = await db.select().from(categories);
    const categoryMap = new Map(existingCategories.map(cat => [cat.name, cat.id]));

    for (const termData of sampleTerms) {
      // Find the category ID
      const categoryId = categoryMap.get(termData.categoryName);
      if (!categoryId) {
        console.warn(`Category "${termData.categoryName}" not found, skipping term "${termData.name}"`);
        continue;
      }

      // Check if term already exists
      const existingTerm = await db.select()
        .from(terms)
        .where(eq(terms.name, termData.name))
        .limit(1);

      if (existingTerm.length > 0) {
        console.log(`Term "${termData.name}" already exists, skipping...`);
        continue;
      }

      // Insert the term
      const [insertedTerm] = await db.insert(terms).values({
        name: termData.name,
        shortDefinition: termData.shortDefinition,
        definition: termData.definition,
        keyCharacteristics: termData.keyCharacteristics,
        categoryId: categoryId,
        viewCount: Math.floor(Math.random() * 100), // Random view count for testing
        createdAt: new Date(),
        updatedAt: new Date()
      }).returning();

      console.log(`✅ Added term: ${termData.name}`);
    }

    console.log("🎉 Quick seed completed successfully!");
    
    // Show summary
    const termCount = await db.select().from(terms);
    const categoryCount = await db.select().from(categories);
    
    console.log(`📊 Database summary:`);
    console.log(`   - Total terms: ${termCount.length}`);
    console.log(`   - Total categories: ${categoryCount.length}`);

  } catch (error) {
    console.error("❌ Error during seeding:", error);
    throw error;
  }
}

// Run the seed if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  quickSeed()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export { quickSeed };