import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from "@/components/ui/accordion";

export function FAQ() {
  const faqs = [
    {
      question: "Is this a one-time payment?",
      answer: "Yes! Pay once and get lifetime access. No subscriptions, no recurring fees, no hidden costs. You pay $249 once (with PPP discounts available) and access the platform forever. Compare this to DataCamp ($300+/year) or Coursera ($400+/year) - you save thousands!"
    },
    {
      question: "How is this different from free resources like Wikipedia?",
      answer: "While free resources provide basic information, we offer structured, comprehensive coverage specifically for AI/ML with code examples, real-world applications, and organized categories. Everything is searchable and optimized for learning, not scattered across dozens of sites."
    },
    {
      question: "Do you offer refunds?", 
      answer: "Absolutely! We offer a 100% money back guarantee within 30 days of purchase, no questions asked. If you're not completely satisfied with the platform, just contact us for a full refund."
    },
    {
      question: "How often is the content updated?",
      answer: "We regularly add new terms and update existing content as the AI/ML field evolves. New research, techniques, and terminology are continuously added to keep the platform current. All updates are included in your lifetime access."
    },
    {
      question: "Can I access this on mobile devices?",
      answer: "Yes! The platform is fully responsive and optimized for mobile phones, tablets, and desktop computers. You can learn anywhere, anytime."
    },
    {
      question: "Is there a limit to how much I can access?",
      answer: "No limits! With your lifetime access, you can view all 10,000+ terms, run unlimited searches, and access all features as much as you want."
    },
    {
      question: "What programming languages are covered in code examples?",
      answer: "We primarily focus on Python (the most popular language for AI/ML), with examples using popular libraries like TensorFlow, PyTorch, scikit-learn, NumPy, and Pandas. Some examples also include R and general pseudocode."
    },
    {
      question: "Is this suitable for beginners?",
      answer: "Absolutely! Our content ranges from basic concepts that beginners can understand to advanced topics for experts. Each term includes clear explanations and we organize content by difficulty level."
    },
    {
      question: "How do I access the platform after purchase?",
      answer: "Immediately after purchase, you'll receive access credentials and a link to the platform. You can start using it right away - no waiting, no setup required."
    },
    {
      question: "What about Purchasing Power Parity pricing?",
      answer: "Yes! We automatically apply PPP discounts (35-70% off) for 20+ countries to ensure fair global pricing. For example: India gets 60% off ($99), Brazil gets 55% off ($112), Bangladesh gets 70% off ($75). The discount is applied automatically based on your location."
    },
    {
      question: "How does this compare to DataCamp or Coursera?",
      answer: "DataCamp costs $300+/year and Coursera costs $400+/year with limited AI/ML coverage. We offer 10,000+ comprehensive AI/ML terms with code examples for a one-time $249 payment. You save $300-600 every year while getting more specialized content."
    }
  ];

  return (
    <section id="faq" className="py-20 px-4 bg-white">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
            Frequently Asked Questions
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-400">
            Everything you need to know about AI/ML Glossary Pro.
          </p>
        </div>

        <Accordion type="single" collapsible className="space-y-4">
          {faqs.map((faq, index) => (
            <AccordionItem 
              key={index} 
              value={`item-${index}`}
              className="border border-gray-200 rounded-lg px-6 py-2 hover:border-purple-300 transition-colors"
            >
              <AccordionTrigger className="text-left font-semibold text-gray-900 hover:text-purple-700">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-gray-600 dark:text-gray-400 pt-2 pb-4">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        <div className="mt-12 text-center">
          <div className="bg-purple-50 border border-purple-200 rounded-xl p-8">
            <h3 className="text-xl font-bold text-purple-900 mb-4">
              Still have questions?
            </h3>
            <p className="text-purple-700 mb-6">
              We're here to help! Contact us at support@aimlglossarypro.com
            </p>
            <div className="text-sm text-purple-600">
              We typically respond within 24 hours.
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}