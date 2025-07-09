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
                      <span className="text-gray-700"><strong>Sustainable & ad-free</strong> with generous free tier</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* The Sustainable Model */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
              A Model That Works for Everyone
            </h2>
            
            {/* The Realization */}
            <Card className="border-2 border-blue-200 mb-8">
              <CardContent className="p-8 sm:p-12">
                <BookOpen className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-gray-900 mb-4 text-center">
                  The "Curated Daily Learning" Approach
                </h3>
                <p className="text-lg text-gray-700 leading-relaxed mb-6">
                  After spending months on this project, I realized two things:
                </p>
                <div className="space-y-4 mb-6">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm mt-0.5">1</div>
                    <p className="text-gray-700 leading-relaxed">
                      <strong>Most people learn 20-50 concepts per day max</strong> - unlimited access often leads to overwhelming, shallow learning. I discovered this from my own journey: quality beats quantity every time.
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm mt-0.5">2</div>
                    <p className="text-gray-700 leading-relaxed">
                      <strong>Sustainable free tiers require premium support</strong> - I wanted to avoid ads or selling user data. Those models compromise the learning experience and user privacy.
                    </p>
                  </div>
                </div>
                <p className="text-lg text-gray-700 leading-relaxed">
                  So I designed a model that works for everyone:
                </p>
                <div className="grid md:grid-cols-2 gap-6 mt-6">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                    <h4 className="font-bold text-green-900 mb-3">Daily Learners (Free)</h4>
                    <p className="text-green-800 mb-3">
                      Get substantial free value with 50 terms daily - that's 1,500+ terms monthly, perfect for consistent learning.
                    </p>
                    <p className="text-sm text-green-700 italic">
                      "This isn't a limitation - it's a feature that promotes better learning habits."
                    </p>
                  </div>
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
                    <h4 className="font-bold text-purple-900 mb-3">Intensive Learners (Premium)</h4>
                    <p className="text-purple-800 mb-3">
                      One-time $179 for unlimited lifetime access - perfect for professionals who need to deep-dive into AI/ML.
                    </p>
                    <p className="text-sm text-purple-700 italic">
                      "Premium members support the free tier for everyone."
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Why This Works */}
            <Card className="border-2 border-green-200 bg-green-50">
              <CardContent className="p-8 sm:p-12">
                <Heart className="w-12 h-12 text-green-600 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-green-900 mb-4 text-center">
                  Why This Model Actually Helps You Learn Better
                </h3>
                <div className="space-y-4">
                  <p className="text-lg text-green-800 leading-relaxed">
                    I remember exactly how it felt to be lost and overwhelmed. When I started learning AI/ML, I'd bookmark hundreds of resources, thinking "more is better." But I never actually learned deeply.
                  </p>
                  <p className="text-lg text-green-800 leading-relaxed">
                    The 50 terms/day free tier isn't about restricting access - it's about promoting the kind of focused, deliberate practice that actually leads to understanding. It's the same approach I used to go from confused to confident.
                  </p>
                  <p className="text-lg text-green-800 leading-relaxed">
                    And for those times when you need to research intensively - maybe you're preparing for an interview, working on a project, or just deeply curious - the one-time premium upgrade gives you unlimited access forever. No subscriptions, no recurring fees, just pay once when you need it.
                  </p>
                  <div className="bg-white/50 rounded-lg p-6 mt-6">
                    <p className="text-green-900 font-semibold text-center">
                      "This model keeps the platform sustainable and ad-free while ensuring everyone gets real value - whether they pay or not."
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Honest Comparison */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
              An Honest Alternative to Traditional Learning
            </h2>
            <div className="bg-gray-50 rounded-xl p-8 sm:p-12">
              <p className="text-lg text-gray-700 leading-relaxed mb-6">
                I've tried it all - $50/month AI course subscriptions that recycled the same content, 
                $200 textbooks that were outdated before they shipped, "free" platforms plastered with ads 
                that made learning impossible. None of them worked for someone re-entering tech.
              </p>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="bg-white rounded-lg p-6 border border-gray-200">
                  <h4 className="font-bold text-gray-900 mb-2">Course Subscriptions</h4>
                  <p className="text-gray-600 text-sm mb-3">$30-50/month, forever</p>
                  <p className="text-gray-700">Often outdated, designed for beginners only, subscription fatigue</p>
                </div>
                <div className="bg-white rounded-lg p-6 border border-gray-200">
                  <h4 className="font-bold text-gray-900 mb-2">Traditional Textbooks</h4>
                  <p className="text-gray-600 text-sm mb-3">$100-300 per book</p>
                  <p className="text-gray-700">Outdated quickly in AI/ML, no updates, academic focus</p>
                </div>
                <div className="bg-blue-50 rounded-lg p-6 border-2 border-blue-200">
                  <h4 className="font-bold text-blue-900 mb-2">AI/ML Glossary Pro</h4>
                  <p className="text-blue-600 text-sm mb-3">Free (50/day) or $179 once</p>
                  <p className="text-blue-700">Always updated, practical focus, sustainable without ads</p>
                </div>
              </div>
              <p className="text-gray-700 mt-6 text-center italic">
                "I built what I wished existed - honest pricing, no dark patterns, just real value for learners at every stage."
              </p>
            </div>
          </div>

          {/* Call to Action */}
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">
              Ready to Start Your AI/ML Journey?
            </h2>
            <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
              Join thousands of professionals who've gone from confused to confident in AI/ML concepts. 
              Start with 50 free terms daily and see the difference focused, clear explanations can make.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                to="/register" 
                className="inline-flex items-center px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
              >
                Start Learning Free (50 terms/day)
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