import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Quote, User, Heart, BookOpen, Clock, Target, CheckCircle, ArrowRight } from "lucide-react";
import { Link } from "wouter";

export default function About() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="py-16 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="max-w-4xl mx-auto text-center">
          <Badge variant="outline" className="mb-4 text-blue-600 border-blue-200">
            <Heart className="w-4 h-4 mr-2" />
            About the Platform
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Built by Someone Who Gets It
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            The story of how AI/ML Glossary Pro came to be, and why it's designed specifically for 
            professionals who need to understand AI/ML concepts in a rapidly evolving field.
          </p>
        </div>
      </section>

      {/* Main Story */}
      <section className="py-16 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Founder Introduction */}
          <Card className="border-2 border-blue-200 shadow-xl mb-16">
            <CardContent className="p-8 sm:p-12">
              <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 items-center">
                <div className="flex-shrink-0">
                  <div className="w-40 h-40 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                    <User className="w-20 h-20 text-white" />
                  </div>
                </div>
                <div className="flex-1 text-center lg:text-left">
                  <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
                    Hi, I'm Pranay
                  </h2>
                  <p className="text-lg text-gray-700 mb-6 leading-relaxed">
                    I'm the founder of AI/ML Glossary Pro. I have a CS degree, but I spent the last 10 years building my career outside of tech. When I decided to dive into AI/ML, I thought my technical background would help. I was wrong.
                  </p>
                  <Quote className="w-8 h-8 text-blue-500 mb-4 mx-auto lg:mx-0" />
                  <blockquote className="text-lg text-gray-700 italic leading-relaxed">
                    "The field had evolved completely. Terms like 'transformer architecture,' 'attention mechanisms,' and 'RLHF' didn't exist when I was in school. Even basic concepts had new implementations and meanings. I found myself googling constantly, jumping between research papers, blog posts, and Stack Overflow threads."
                  </blockquote>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* The Problem */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
              The Problem I Faced (And You Probably Face Too)
            </h2>
            <div className="grid md:grid-cols-2 gap-8">
              <Card className="border border-red-200 bg-red-50">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-lg bg-red-100">
                      <Clock className="w-6 h-6 text-red-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-red-900 mb-2">Time Wasted on Scattered Information</h3>
                      <p className="text-red-700 text-sm leading-relaxed mb-4">
                        I'd spend hours jumping between research papers, blog posts, and Stack Overflow threads, 
                        trying to piece together one concept. Every resource assumed knowledge I didn't have or explained things in ways that felt disconnected from practical application.
                      </p>
                      <p className="text-red-700 text-sm leading-relaxed">
                        I once spent an entire weekend trying to understand what "transformer architecture" meant, 
                        only to realize the field had evolved completely since my CS degree. Terms that didn't exist when I was in school were now fundamental concepts.
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
                      <h3 className="font-bold text-orange-900 mb-2">Content Not Made for Real People</h3>
                      <p className="text-orange-700 text-sm leading-relaxed mb-4">
                        So I started taking notes. Detailed notes. If I struggled to understand something, I'd research it from multiple angles until I could explain it clearly to someone re-entering tech like me.
                      </p>
                      <p className="text-orange-700 text-sm leading-relaxed">
                        I needed explanations that bridged the gap between academic complexity and practical understanding - written for someone who knows what it's like to feel behind in a rapidly moving field.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* The Journey */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
              My Journey to Understanding
            </h2>
            <div className="bg-white rounded-xl border border-gray-200 p-8 sm:p-12">
              <div className="space-y-8">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                    1
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 mb-2">The Frustration Phase</h3>
                    <p className="text-gray-700 leading-relaxed">
                      After 10 years outside of tech, I kept hearing about AI/ML transforming industries. I thought my CS degree would help me understand it quickly. But the field had evolved completely - terms like "transformer architecture," "attention mechanisms," and "RLHF" didn't exist when I was in school.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                    2
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 mb-2">The Obsession Phase</h3>
                    <p className="text-gray-700 leading-relaxed">
                      So I started taking notes. Detailed notes. If I struggled to understand something, I'd research it from multiple angles until I could explain it clearly to someone re-entering tech like me. I'd spend evenings and weekends reading research papers, watching YouTube videos, and taking online courses.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                    3
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 mb-2">The Breakthrough Phase</h3>
                    <p className="text-gray-700 leading-relaxed">
                      My notes grew: 100 terms... 1,000... 5,000... 10,000+. I developed a method: always start with the basic definition, explain it in simple terms, provide real-world examples, then build up to more complex applications. I started sharing my notes with colleagues who had the same struggles.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                    4
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 mb-2">The Building Phase</h3>
                    <p className="text-gray-700 leading-relaxed">
                      Colleagues transitioning into AI/ML started asking for copies. "Finally, explanations that don't assume I've been following every AI breakthrough for the past decade!" I realized I wasn't the only one struggling - there were thousands of professionals, students, and career changers who needed AI/ML explanations that bridge the gap between academic complexity and practical understanding.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* The Solution */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
              Building What I Wished Existed
            </h2>
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-8 sm:p-12">
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-4">The Principles I Follow</h3>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                      <span className="text-gray-700"><strong>Plain English First:</strong> No jargon without explanation</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                      <span className="text-gray-700"><strong>Real-World Examples:</strong> Concepts you can actually relate to</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                      <span className="text-gray-700"><strong>Logical Progression:</strong> Build from basics to advanced</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                      <span className="text-gray-700"><strong>Practical Focus:</strong> Why does this matter? When do you use it?</span>
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-4">The Results So Far</h3>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="w-5 h-5 bg-blue-500 rounded-full mt-0.5"></div>
                      <span className="text-gray-700"><strong>1,000+ professionals</strong> using the platform daily</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-5 h-5 bg-blue-500 rounded-full mt-0.5"></div>
                      <span className="text-gray-700"><strong>10,000+ AI/ML terms</strong> explained in plain English</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-5 h-5 bg-blue-500 rounded-full mt-0.5"></div>
                      <span className="text-gray-700"><strong>2+ years</strong> of continuous development and improvement</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-5 h-5 bg-blue-500 rounded-full mt-0.5"></div>
                      <span className="text-gray-700"><strong>Free forever</strong> because knowledge should be accessible</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Why Free Forever */}
          <div className="mb-16">
            <Card className="border-2 border-green-200 bg-green-50">
              <CardContent className="p-8 sm:p-12 text-center">
                <Heart className="w-12 h-12 text-green-600 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-green-900 mb-4">
                  Why Free Forever?
                </h2>
                <p className="text-lg text-green-800 leading-relaxed mb-6">
                  I remember exactly how it felt to be lost and overwhelmed, realizing that my CS degree couldn't keep up with how fast the field was evolving. I remember the frustration of paying for courses that assumed I'd been following every AI breakthrough for the past decade.
                </p>
                <p className="text-lg text-green-800 leading-relaxed">
                  That's why the core platform is free forever. Everyone deserves access to clear, 
                  understandable explanations of AI/ML concepts - especially those re-entering tech or transitioning careers. Premium features help support continued development, but the essentials will always be free.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Call to Action */}
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">
              Ready to Start Your AI/ML Journey?
            </h2>
            <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
              Join thousands of professionals who've gone from confused to confident in AI/ML concepts. 
              Start with the free platform and see the difference clear explanations can make.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                to="/register" 
                className="inline-flex items-center px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
              >
                Start Free Today
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
              <Link 
                to="/" 
                className="inline-flex items-center px-8 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:border-gray-400 transition-colors"
              >
                Explore the Platform
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}