import type ko from './ko';

const en: typeof ko = {
  common: {
    brand: 'K-FitJudge',
    login: 'Log in',
    logout: 'Log out',
    myPage: 'My Page',
    language: 'English',
    startEvaluate: 'Get Evaluated Now',
    learnMore: 'Learn more',
  },
  nav: {
    home: 'Home',
    evaluate: 'Evaluate',
    howItWorks: 'How it works',
    pricing: 'Pricing',
  },
  home: {
    heroBadge: 'AI Fashion Judge · Style Remake',
    heroTitle: 'How does your outfit score today?',
    heroSubtitle:
      'Upload one photo to get a 100-point score with detailed feedback, plus an improved style image generated from that feedback — instantly.',
    heroCtaPrimary: 'Get Evaluated with a Photo',
    heroCtaSecondary: 'See a Sample Result',
    trustNote: 'Available in Korean & English — for every K-culture lover',
    beforeLabel: 'BEFORE',
    afterLabel: 'AFTER',
    sliderHint: 'Drag the bar to compare',
    sectionFeaturesTitle: 'What makes us different',
    sectionFeaturesSubtitle: "Not just a scoring bot — a style coach that reads context and intent.",
    features: [
      {
        icon: 'shield',
        title: 'Precise 100-Point Scoring',
        desc: 'Color harmony, top-bottom balance, fit, shoes, and accessories are each scored in detail. Overdoing it costs points.',
      },
      {
        icon: 'tag',
        title: 'TPO Context-Aware Scoring',
        desc: 'Pick a situation first — work, a date, campus, a wedding guest, streetwear — and the same outfit is scored differently for each.',
      },
      {
        icon: 'palette',
        title: 'Style Intent Respected',
        desc: 'Declare classic or experimental intent so bold, avant-garde looks are never unfairly marked down.',
      },
      {
        icon: 'sparkle',
        title: 'Personal Color & Hair Bonus',
        desc: 'We check how your personal color and hairstyle harmonize with the outfit for bonus points and comments.',
      },
      {
        icon: 'swap',
        title: 'Before/After Slider',
        desc: 'Instantly compare the regenerated style with one slider bar. Share safely with a built-in watermark.',
      },
      {
        icon: 'heart',
        title: 'Honest but Kind Tone',
        desc: 'Scores stay honest, words stay kind. Not "this is bad" — "change this and gain 8 points."',
      },
    ],
    sectionFlowTitle: 'How it works',
    flow: [
      { step: '01', title: 'Upload a Photo', desc: 'Upload one full-body photo' },
      { step: '02', title: 'Pick TPO & Intent', desc: 'Tell us the situation and your style intent' },
      { step: '03', title: 'AI Precision Scoring', desc: 'Get a 100-point score with detailed feedback' },
      { step: '04', title: 'Compare Before/After', desc: 'See the improved look on the slider' },
    ],
    sampleTitle: 'Sample Evaluation Preview',
    sampleSubtitle: "Here's how your own photo would be scored in the live service",
    ctaTitle: 'Get your style evaluated now',
    ctaSubtitle: 'Try your first evaluation instantly, no sign-up required',
  },
  footer: {
    tagline: 'AI fashion evaluation for everyone who loves K-culture',
    rights: '© 2026 K-FitJudge. All rights reserved.',
  },
};

export default en;
