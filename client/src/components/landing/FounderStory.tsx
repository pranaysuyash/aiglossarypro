import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Quote, User, Heart, BookOpen, Clock, Target } from "lucide-react";

export function FounderStory() {
  return (
    <section className="py-16 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-12 sm:mb-16">
          <Badge variant="outline" className="mb-4 text-blue-600 border-blue-200">
            <Heart className="w-4 h-4 mr-2" />
            Personal Story
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
            Why I Built This Platform
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            A personal journey from confusion to clarity in the AI/ML world
          </p>
        </div>

        {/* Main Story Card */}
        <Card className="border-2 border-blue-200 shadow-xl mb-12">
          <CardContent className="p-8 sm:p-12">
            <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 items-center">
              {/* Founder Image Placeholder */}
              <div className="flex-shrink-0">
                <div className="w-32 h-32 sm:w-40 sm:h-40 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <User className="w-16 h-16 sm:w-20 sm:h-20 text-white" />
                </div>
              </div>
              
              {/* Story Content */}
              <div className="flex-1 text-center lg:text-left">
                <Quote className="w-8 h-8 text-blue-500 mb-4 mx-auto lg:mx-0" />
                <blockquote className="text-lg sm:text-xl text-gray-700 mb-6 italic leading-relaxed">
                  "I'm not a computer scientist or AI researcher. I'm a business professional who got completely lost in the AI/ML world. Every article assumed I knew what 'gradient descent' meant, every tutorial skipped explaining what a 'tensor' actually was, and every paper felt like it was written in a foreign language."
                </blockquote>
                <div className="text-right">
                  <cite className="text-base text-gray-600 not-italic">
                    — Pranay, Founder
                  </cite>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* The Problem */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <Card className="border border-red-200 bg-red-50">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-lg bg-red-100">
                  <Clock className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h3 className="font-bold text-red-900 mb-2">The Frustration</h3>
                  <p className="text-red-700 text-sm leading-relaxed">
                    Spending entire weekends just to understand what "backpropagation" meant. 
                    Technical papers written for PhDs. Wikipedia articles that sent me down rabbit holes of prerequisites I didn't have.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-orange-200 bg-orange-50">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-lg bg-orange-100">
                  <Target className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <h3 className="font-bold text-orange-900 mb-2">The Missing Piece</h3>
                  <p className="text-orange-700 text-sm leading-relaxed">
                    No single resource that explained AI/ML concepts the way I needed them explained — 
                    in plain English, with real examples, building from basics to advanced, designed for actual learning.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* The Solution Story */}
        <div className="bg-white rounded-xl border border-gray-200 p-8 sm:p-12 mb-12">
          <div className="max-w-4xl mx-auto">
            <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6 text-center">
              So I Built What I Wished Existed
            </h3>
            
            <div className="grid sm:grid-cols-2 gap-6 mb-8">
              <div className="text-center p-4">
                <BookOpen className="w-8 h-8 text-blue-600 mx-auto mb-3" />
                <h4 className="font-semibold text-gray-900 mb-2">For Real People</h4>
                <p className="text-gray-600 text-sm">
                  Written for business professionals, students, and curious minds — not just engineers
                </p>
              </div>
              
              <div className="text-center p-4">
                <Target className="w-8 h-8 text-green-600 mx-auto mb-3" />
                <h4 className="font-semibold text-gray-900 mb-2">Actually Useful</h4>
                <p className="text-gray-600 text-sm">
                  Practical examples and real-world applications you can actually use
                </p>
              </div>
            </div>
            
            <div className="text-center">
              <p className="text-lg text-gray-700 leading-relaxed mb-6">
                After 2 years of obsessive research, curating, and writing (while working my day job), 
                I created the comprehensive AI/ML reference I desperately needed. <span className="font-semibold text-blue-600">Now 1,000+ professionals use it daily</span> 
                to understand everything from basic concepts like "what is a neural network" to advanced topics like transformer architectures.
              </p>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 max-w-2xl mx-auto">
                <p className="text-blue-800 font-medium mb-2">
                  Why Free Forever?
                </p>
                <p className="text-blue-700 text-sm leading-relaxed">
                  I remember what it felt like to be lost and overwhelmed. That's why the core platform is free forever. 
                  Premium features like advanced code examples and AI-powered explanations help support 
                  continued development while keeping the essentials free for everyone who needs them.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Trust Signals */}
        <div className="text-center">
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-xl p-6 sm:p-8">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              Built by Someone Who Gets It
            </h3>
            <div className="grid sm:grid-cols-3 gap-4 text-sm text-gray-600">
              <div className="flex items-center justify-center gap-2">
                <Heart className="w-4 h-4 text-red-500" />
                <span>Non-technical background</span>
              </div>
              <div className="flex items-center justify-center gap-2">
                <BookOpen className="w-4 h-4 text-blue-500" />
                <span>Self-taught AI/ML enthusiast</span>
              </div>
              <div className="flex items-center justify-center gap-2">
                <Target className="w-4 h-4 text-green-500" />
                <span>Focused on practical learning</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}