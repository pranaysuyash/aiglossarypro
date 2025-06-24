import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, Users, BookOpen, Download } from "lucide-react";

export function SocialProof() {
  const stats = [
    {
      icon: Users,
      number: "1,000+",
      label: "AI/ML Professionals",
      description: "Trust our platform for their reference needs"
    },
    {
      icon: BookOpen,
      number: "10,000+",
      label: "Terms Covered",
      description: "Comprehensive coverage across all domains"
    },
    {
      icon: Star,
      number: "4.9/5",
      label: "Average Rating", 
      description: "Based on user feedback and reviews"
    },
    {
      icon: Download,
      number: "50,000+",
      label: "Terms Accessed",
      description: "Monthly searches and downloads"
    }
  ];

  const testimonials = [
    {
      quote: "Finally, a single source for all AI/ML concepts with practical examples. This saves me hours every week.",
      author: "Dr. Sarah Chen",
      role: "ML Research Scientist",
      company: "Tech Startup"
    },
    {
      quote: "The code examples are exactly what I needed for my projects. Much better than scattered documentation.",
      author: "Michael Rodriguez",
      role: "Data Scientist",  
      company: "Fortune 500"
    },
    {
      quote: "Comprehensive coverage from basics to advanced topics. Essential reference for any AI/ML professional.",
      author: "Priya Sharma",
      role: "AI Engineer",
      company: "AI Research Lab"
    }
  ];

  const companies = [
    "Google", "Microsoft", "Amazon", "Meta", "Netflix", "Spotify", 
    "Uber", "Tesla", "OpenAI", "DeepMind", "Nvidia", "IBM"
  ];

  return (
    <section className="py-20 px-4 bg-white">
      <div className="max-w-7xl mx-auto">
        {/* Stats Section */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
            Join 1,000+ AI/ML Professionals Who Trust Our Platform
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-12">
            Used by professionals at leading tech companies worldwide.
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-purple-100 rounded-lg mb-4">
                  <stat.icon className="w-6 h-6 text-purple-600" />
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-1">{stat.number}</div>
                <div className="text-lg font-semibold text-gray-700 mb-1">{stat.label}</div>
                <div className="text-sm text-gray-500">{stat.description}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Testimonials */}
        <div className="mb-16">
          <h3 className="text-2xl font-bold text-center text-gray-900 mb-12">
            What AI/ML Professionals Are Saying
          </h3>
          
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="border-2 hover:border-purple-200 transition-colors">
                <CardContent className="p-6">
                  <div className="flex gap-1 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <blockquote className="text-gray-700 mb-4 italic">
                    "{testimonial.quote}"
                  </blockquote>
                  <div className="border-t pt-4">
                    <div className="font-semibold text-gray-900">{testimonial.author}</div>
                    <div className="text-sm text-gray-600">{testimonial.role}</div>
                    <div className="text-sm text-purple-600">{testimonial.company}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Companies */}
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-8">
            Trusted by professionals at leading companies
          </h3>
          
          <div className="flex flex-wrap justify-center gap-x-8 gap-y-4 opacity-60">
            {companies.map((company, index) => (
              <Badge key={index} variant="outline" className="text-gray-600 border-gray-300">
                {company}
              </Badge>
            ))}
          </div>
          
          <div className="mt-8 text-sm text-gray-500">
            * Based on user-reported company affiliations
          </div>
        </div>
      </div>
    </section>
  );
}