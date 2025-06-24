import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Brain, 
  Database, 
  Eye, 
  Cpu, 
  BarChart3, 
  Layers,
  ArrowRight,
  Code
} from "lucide-react";

export function ContentPreview() {
  const categories = [
    {
      icon: Brain,
      title: "Machine Learning Fundamentals",
      count: "2,500+ terms",
      topics: ["Supervised Learning", "Unsupervised Learning", "Reinforcement Learning", "Feature Engineering"],
      color: "bg-blue-100 text-blue-700 border-blue-200"
    },
    {
      icon: Layers,
      title: "Deep Learning & Neural Networks",
      count: "1,800+ terms", 
      topics: ["CNNs", "RNNs", "Transformers", "GANs", "Attention Mechanisms"],
      color: "bg-purple-100 text-purple-700 border-purple-200"
    },
    {
      icon: Database,
      title: "Data Science & Analytics",
      count: "2,200+ terms",
      topics: ["Statistics", "Data Preprocessing", "Feature Selection", "Model Evaluation"],
      color: "bg-green-100 text-green-700 border-green-200"
    },
    {
      icon: Eye,
      title: "Computer Vision",
      count: "1,500+ terms",
      topics: ["Image Processing", "Object Detection", "Semantic Segmentation", "OCR"],
      color: "bg-orange-100 text-orange-700 border-orange-200"
    },
    {
      icon: Cpu,
      title: "Natural Language Processing",
      count: "1,400+ terms",
      topics: ["Text Processing", "Language Models", "Sentiment Analysis", "NER"],
      color: "bg-pink-100 text-pink-700 border-pink-200"
    },
    {
      icon: BarChart3,
      title: "AI Ethics & Applications",
      count: "900+ terms",
      topics: ["Bias & Fairness", "Explainable AI", "Privacy", "Responsible AI"],
      color: "bg-red-100 text-red-700 border-red-200"
    }
  ];

  const exampleTerm = {
    title: "Gradient Descent",
    category: "Machine Learning",
    definition: "An iterative optimization algorithm used to minimize the cost function in machine learning models by adjusting parameters in the direction of steepest descent.",
    codeExample: `import numpy as np

def gradient_descent(X, y, learning_rate=0.01, iterations=1000):
    m, n = X.shape
    theta = np.zeros(n)
    
    for i in range(iterations):
        h = X.dot(theta)
        cost = (1/(2*m)) * np.sum((h-y)**2)
        gradient = (1/m) * X.T.dot(h-y)
        theta = theta - learning_rate * gradient
    
    return theta`
  };

  return (
    <section id="preview" className="py-20 px-4 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
            Comprehensive Coverage Across All AI/ML Domains
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            From basic concepts to cutting-edge research, we've got you covered.
          </p>
        </div>

        {/* Categories Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {categories.map((category, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow duration-300">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3 mb-2">
                  <div className={`p-2 rounded-lg ${category.color}`}>
                    <category.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{category.title}</CardTitle>
                    <Badge variant="secondary" className="text-xs">{category.count}</Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2">
                  {category.topics.map((topic, topicIndex) => (
                    <div key={topicIndex} className="flex items-center gap-2 text-sm text-gray-600">
                      <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
                      <span>{topic}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Example Term Preview */}
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              See What's Inside - Example Term
            </h3>
            <p className="text-gray-600">
              Every term includes detailed explanations, code examples, and real-world applications.
            </p>
          </div>

          <Card className="border-2 border-purple-200 shadow-xl">
            <CardHeader className="bg-purple-50 border-b border-purple-200">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl text-purple-900">{exampleTerm.title}</CardTitle>
                  <Badge className="mt-2 bg-purple-100 text-purple-700">{exampleTerm.category}</Badge>
                </div>
                <Code className="w-8 h-8 text-purple-600" />
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-6">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Definition</h4>
                  <p className="text-gray-700">{exampleTerm.definition}</p>
                </div>
                
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Code Example</h4>
                  <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                    <pre className="text-sm text-gray-300">
                      <code>{exampleTerm.codeExample}</code>
                    </pre>
                  </div>
                </div>
                
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-900 mb-2">Real-World Applications</h4>
                  <div className="grid md:grid-cols-2 gap-2 text-sm text-blue-800">
                    <div>• Training neural networks</div>
                    <div>• Linear regression optimization</div>
                    <div>• Cost function minimization</div>
                    <div>• Parameter tuning in ML models</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="text-center mt-8">
            <Button 
              size="lg"
              className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-4"
              onClick={() => window.open('https://gumroad.com/l/aimlglossarypro', '_blank')}
            >
              Get Access to All 10,000+ Terms
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}