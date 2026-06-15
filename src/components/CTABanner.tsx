interface CTABannerProps {
  language: 'en' | 'mm';
}

const translations = {
  en: {
    heading: 'Plan Your Next Adventure',
    description: 'Create a personalized itinerary and make your Myanmar journey unforgettable',
    buttonText: 'Start Planning Now',
  },
  mm: {
    heading: 'သင့်နောက်ထပ် သူရဲကောင်းခရီးစဉ်ကို စီစဉ်ပါ',
    description: 'သင့်ကိုယ်ပိုင် ခရီးစဉ်ဖွဲ့ပြီး မြန်မာခရီးစဉ်ကို အမှတ်တရဖြစ်စေပါ',
    buttonText: 'ယခုစတင်စီစဉ်ပါ',
  },
};

export default function CTABanner({ language }: CTABannerProps) {
  const t = translations[language];

  return (
    <section className="py-20 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#1E88E5] to-[#1565C0]" />
      <div className="absolute inset-0 opacity-10">
        <img
          src="https://picsum.photos/seed/myanmar-landscape-pattern/1920/400"
          alt=""
          className="w-full h-full object-cover"
        />
      </div>

      {/* Content */}
      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
          {t.heading}
        </h2>
        <p className="text-lg text-white/80 mb-8 max-w-2xl mx-auto">
          {t.description}
        </p>
        <a
          href="#planner"
          className="inline-flex items-center gap-2 bg-[#FFA726] hover:bg-[#FF9800] text-white px-8 py-4 rounded-xl font-semibold transition-colors shadow-lg hover:shadow-xl"
        >
          {t.buttonText}
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </a>
      </div>
    </section>
  );
}
