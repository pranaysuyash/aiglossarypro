import { X, Clock, DollarSign } from "lucide-react";

export function ValueProposition() {
  return (
    <section className="py-20 px-4 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
            Forget about scattered documentation
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            Get everything you need in one comprehensive platform.
          </p>
        </div>

        {/* Pain points vs Solution */}
        <div className="grid md:grid-cols-2 gap-12 mb-16">
          {/* Pain Points */}
          <div className="space-y-6">
            <h3 className="text-2xl font-bold text-red-600 mb-6 flex items-center">
              <X className="w-6 h-6 mr-2" />
              The Problem
            </h3>
            
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-4 bg-red-50 rounded-lg border border-red-200">
                <X className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-red-900">Scattered Information</h4>
                  <p className="text-red-700 text-sm">Searching through dozens of docs, papers, and websites</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-4 bg-red-50 rounded-lg border border-red-200">
                <Clock className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-red-900">Time Wasted</h4>
                  <p className="text-red-700 text-sm">Hours spent looking for simple definitions and examples</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-4 bg-red-50 rounded-lg border border-red-200">
                <DollarSign className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-red-900">Expensive Recurring Costs</h4>
                  <p className="text-red-700 text-sm">$300-600/year for DataCamp, Coursera with incomplete AI/ML coverage</p>
                </div>
              </div>
            </div>
          </div>

          {/* Solution */}
          <div className="space-y-6">
            <h3 className="text-2xl font-bold text-green-600 mb-6 flex items-center">
              ✅ The Solution
            </h3>
            
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center mt-0.5 flex-shrink-0">
                  <span className="text-white text-xs">✓</span>
                </div>
                <div>
                  <h4 className="font-semibold text-green-900">Everything in One Place</h4>
                  <p className="text-green-700 text-sm">10,000+ terms with definitions, examples, and code</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center mt-0.5 flex-shrink-0">
                  <span className="text-white text-xs">✓</span>
                </div>
                <div>
                  <h4 className="font-semibold text-green-900">Instant Search</h4>
                  <p className="text-green-700 text-sm">Find any concept in seconds with advanced filtering</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center mt-0.5 flex-shrink-0">
                  <span className="text-white text-xs">✓</span>
                </div>
                <div>
                  <h4 className="font-semibold text-green-900">Incredible Value</h4>
                  <p className="text-green-700 text-sm">$249 lifetime vs $300-600/year subscriptions. Save $1000s</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Call out */}
        <div className="text-center bg-purple-100 border border-purple-200 rounded-xl p-8">
          <h3 className="text-2xl font-bold text-purple-900 mb-4">
            When you join AI/ML Glossary Pro you'll find:
          </h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 text-sm">
            <div className="text-purple-800">
              <div className="font-semibold">✅ 10,000+ AI/ML terms</div>
              <div>with detailed explanations</div>
            </div>
            <div className="text-purple-800">
              <div className="font-semibold">✅ Code examples</div>
              <div>for every major concept</div>
            </div>
            <div className="text-purple-800">
              <div className="font-semibold">✅ Real-world applications</div>
              <div>and use cases</div>
            </div>
            <div className="text-purple-800">
              <div className="font-semibold">✅ Lifetime updates</div>
              <div>as the field evolves</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}