import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

export function FAQ() {
  const faqs = [
    {
      question: 'How does the pricing work?',
      answer:
        'Start completely free with 50 AI/ML terms daily (1,500+ monthly)! No credit card required. For unlimited access to all 10,000+ terms plus premium features like interactive quizzes and AI-powered explanations, upgrade for a one-time payment of $179 (early bird price, originally $249). Compare this to DataCamp ($300+/year) or Coursera ($400+/year) - you save thousands!',
    },
    {
      question: 'How is this different from free resources like Wikipedia?',
      answer:
        'While free resources provide basic information, we offer structured, comprehensive coverage specifically for AI/ML with code examples, real-world applications, and organized categories. Everything is searchable and optimized for learning, not scattered across dozens of sites.',
    },
    {
      question: 'Do you offer refunds?',
      answer:
        'We do not offer refunds for premium purchases. However, you can use the free tier (50 terms daily) forever to evaluate the platform before deciding to upgrade. If you have questions, contact us at support@aiglossarypro.com.',
    },
    {
      question: 'How often is the content updated?',
      answer:
        'We regularly add new terms and update existing content as the AI/ML field evolves. New research, techniques, and terminology are continuously added to keep the platform current. All updates are included in your lifetime access.',
    },
    {
      question: 'Can I access this on mobile devices?',
      answer:
        'Yes! The platform is fully responsive and optimized for mobile phones, tablets, and desktop computers. You can learn anywhere, anytime.',
    },
    {
      question: 'Is there a limit to how much I can access?',
      answer:
        'The free tier includes 50 AI/ML terms per day (1,500+ monthly), advanced search capabilities, and code examples - forever free! Upgrade to premium for unlimited access to all 10,000+ terms plus interactive quizzes, AI explanations, and advanced learning tools.',
    },
    {
      question: 'What programming languages are covered in code examples?',
      answer:
        'We primarily focus on Python (the most popular language for AI/ML), with examples using popular libraries like TensorFlow, PyTorch, scikit-learn, NumPy, and Pandas. Some examples also include R and general pseudocode.',
    },
    {
      question: 'Is this suitable for beginners?',
      answer:
        'Absolutely! Our content ranges from basic concepts that beginners can understand to advanced topics for experts. Each term includes clear explanations and we organize content by difficulty level.',
    },
    {
      question: 'How do I access the platform after purchase?',
      answer:
        "Immediately after purchase, you'll receive access credentials and a link to the platform. You can start using it right away - no waiting, no setup required.",
    },
    {
      question: 'What about Purchasing Power Parity pricing?',
      answer:
        'Yes! We automatically apply PPP discounts (35-70% off) for 20+ countries to ensure fair global pricing. For example: India gets 60% off ($99), Brazil gets 55% off ($112), Bangladesh gets 70% off ($75). The discount is applied automatically based on your location.',
    },
    {
      question: 'How does this compare to DataCamp or Coursera?',
      answer:
        'DataCamp costs $300+/year and Coursera costs $400+/year with limited AI/ML coverage. We offer 50 AI/ML terms daily for free forever, or get unlimited access to all 10,000+ terms plus premium features for just $179 one-time (early bird). You save hundreds every year while getting more specialized content.',
    },
    {
      question: "What's included in the early bird special?",
      answer:
        'The first 500 customers get unlimited access to all 10,000+ terms plus premium features for $179 instead of $249 (save $70). This includes unlimited term access, interactive quizzes, AI-powered explanations, personalized learning paths, and offline access. Early bird pricing ends when we reach 500 customers.',
    },
  ];

  return (
    <section id="faq" className="py-16 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12 sm:mb-16">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-4 sm:mb-6">
            Frequently Asked Questions
          </h2>
          <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-400 px-4 sm:px-0">
            Everything you need to know about AI/ML Glossary Pro.
          </p>
        </div>

        <Accordion type="single" collapsible className="space-y-4">
          {faqs.map((faq, index) => (
            <AccordionItem
              key={index}
              value={`item-${index}`}
              className="border border-gray-200 rounded-lg px-4 sm:px-6 py-2 hover:border-purple-300 transition-colors touch-manipulation"
            >
              <AccordionTrigger className="text-left font-semibold text-gray-900 hover:text-purple-700 text-base sm:text-lg py-4 min-h-[48px] flex items-center">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-gray-600 dark:text-gray-400 pt-2 pb-4 text-sm sm:text-base leading-relaxed">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        <div className="mt-12 text-center px-4 sm:px-0">
          <div className="bg-purple-50 border border-purple-200 rounded-xl p-6 sm:p-8">
            <h3 className="text-lg sm:text-xl font-bold text-purple-900 mb-4">
              Still have questions?
            </h3>
            <p className="text-purple-700 mb-6 text-sm sm:text-base">
              We're here to help! Contact us at{' '}
              <a
                href="mailto:support@aiglossarypro.com"
                className="underline hover:no-underline break-words"
              >
                support@aiglossarypro.com
              </a>
            </p>
            <div className="text-sm text-purple-600">We typically respond within 24 hours.</div>
          </div>
        </div>
      </div>
    </section>
  );
}
