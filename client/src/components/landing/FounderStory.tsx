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
                  "I have a CS degree, but I spent the last 10 years building my career outside of tech. When I decided to dive into AI/ML, I thought my technical background would help. I was wrong. The field had evolved completely. Terms like 'transformer architecture,' 'attention mechanisms,' and 'RLHF' didn't exist when I was in school."
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
                    I found myself googling constantly, jumping between research papers, blog posts, and Stack Overflow threads. Every resource assumed knowledge I didn't have or explained things in ways that felt disconnected from practical application.
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
                    So I started taking notes. Detailed notes. If I struggled to understand something, I'd research it from multiple angles until I could explain it clearly to someone re-entering tech like me.
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
                My notes grew: 100 terms... 1,000... 5,000... 10,000+. Colleagues transitioning into AI/ML started asking for copies. "Finally, explanations that don't assume I've been following every AI breakthrough for the past decade!" <span className="font-semibold text-blue-600">Now 1,000+ professionals use it daily</span> 
                to bridge the gap between academic complexity and practical understanding.
              </p>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 max-w-2xl mx-auto">
                <p className="text-blue-800 font-medium mb-2">
                  Why a Free Tier?
                </p>
                <p className="text-blue-700 text-sm leading-relaxed">
                  AI/ML Glossary Pro bridges the gap between academic complexity and practical understanding - built by someone who knows what it's like to feel behind in a rapidly moving field. That's why we offer 50 terms daily completely free. 
                  For those who need unlimited access, our premium tier provides full access to all 10,000+ terms plus advanced features - all for a one-time payment.
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
                <span>Career changer perspective</span>
              </div>
              <div className="flex items-center justify-center gap-2">
                <BookOpen className="w-4 h-4 text-blue-500" />
                <span>Re-entering tech after 10 years</span>
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