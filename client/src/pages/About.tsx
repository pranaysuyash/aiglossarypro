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
            professionals who need to understand AI/ML concepts without a computer science background.
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
                    I'm the founder of AI/ML Glossary Pro, and I'm not a computer scientist, AI researcher, 
                    or software engineer. I'm a business professional who got completely overwhelmed trying 
                    to understand the AI/ML world - and decided to do something about it.
                  </p>
                  <Quote className="w-8 h-8 text-blue-500 mb-4 mx-auto lg:mx-0" />
                  <blockquote className="text-lg text-gray-700 italic leading-relaxed">
                    "Every article assumed I knew what 'gradient descent' meant, every tutorial skipped explaining 
                    what a 'tensor' actually was, and every paper felt like it was written in a foreign language. 
                    I spent entire weekends just trying to understand what 'backpropagation' meant."
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
                        I'd spend hours jumping between Wikipedia, research papers, blog posts, and tutorials, 
                        trying to piece together one concept. Each source assumed different background knowledge.
                      </p>
                      <p className="text-red-700 text-sm leading-relaxed">
                        I once spent an entire weekend trying to understand what "attention mechanisms" were, 
                        only to realize I needed to understand transformers first, which required understanding 
                        sequence-to-sequence models, which needed RNNs, which needed... you get the idea.
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
                        Academic papers written for PhD researchers. Wikipedia articles that assume you already 
                        know everything. Tutorials that skip the "why" and jump straight to code.
                      </p>
                      <p className="text-orange-700 text-sm leading-relaxed">
                        I needed explanations that started from "what is this?" and built up logically, 
                        with real-world examples I could relate to. Not found anywhere.
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
                      Working in business, I kept hearing about AI/ML transforming industries. I wanted to understand 
                      it, but every resource assumed I had a computer science background. I'd start reading about 
                      "neural networks" and get lost in mathematical notation within the first paragraph.
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
                      I decided to systematically learn everything. I started keeping notes, creating my own 
                      glossary, and breaking down complex concepts into simpler terms. I'd spend evenings and 
                      weekends reading research papers, watching YouTube videos, and taking online courses.
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
                      After months of struggle, things started clicking. I developed a method: always start with 
                      the basic definition, explain it in simple terms, provide real-world examples, then build 
                      up to more complex applications. I started sharing my notes with colleagues who had the same struggles.
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
                      My colleagues loved my notes. They were finally understanding concepts they'd been confused 
                      about for years. I realized I wasn't the only one struggling - there were thousands of business 
                      professionals, students, and career changers who needed AI/ML explanations written for real people.
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
                  I remember exactly how it felt to be lost and overwhelmed, staring at a research paper 
                  that might as well have been written in another language. I remember the frustration of 
                  paying for courses that assumed knowledge I didn't have.
                </p>
                <p className="text-lg text-green-800 leading-relaxed">
                  That's why the core platform is free forever. Everyone deserves access to clear, 
                  understandable explanations of AI/ML concepts. Premium features help support continued 
                  development, but the essentials will always be free.
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