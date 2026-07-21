import AboutContent from '../models/aboutContent.js';

// Default seeding fallback
const defaultAboutContent = {
  aboutUs: {
    title: 'ELEVATING INTEGRITY IN\nINTERNATIONAL\nRECRUITMENT',
    description: 'AEGA is the first global alliance led by UKVi and higher-education experts to professionalize international recruitment through independent guidance, operational oversight, and innovative technology to ensure ethical integrity and student success.',
    kpiValues: [
      { value: '500+', description: 'Successful consultations' },
      { value: '200+', description: 'Hours of expert-led investment' },
      { value: '100+', description: 'Publications on investment' },
      { value: '3K+', description: 'Satisfied clients' }
    ]
  },
  innerSection2: {
    image: '/aboutPage/peter-portrait.png',
    title: 'PETE YETTON',
    description: "True recruitment success is not about taking risks—it's about managing them. In a shifting regulatory world, AEGA turns uncertainty into integrity-driven growth.",
    description2: "Under Pete's leadership, AEGA has transformed international student recruitment through ethical frameworks, compliance excellence, and technology-driven transparency."
  },
  ourStory: {
    image: '/aboutPage/peter-podcast.png',
    title: 'OUR STORY',
    description: "AEGA was born from a 'little red book of ideas' in a Rome cafe, fueled by 22 years of searching for a way to transform global student recruitment. Having served in uniform and practiced law, our founder Pete Yetton saw the urgent need to move beyond surface-level marketing to deeper 'Layer 3' business compliance. We listened to agents struggling with shifting regulations and universities balancing growth with ethical responsibility. Today, we bridge that gap from our hubs in Dubai and the UK, turning those initial ideas into a global alliance that treats integrity as the foundation of every student’s future."
  },
  ourMission: {
    image: '/aboutPage/peter-map.png',
    points: [
      { title: 'ESTABLISH A GLOBAL STANDARD', description: 'We aim to become the world\'s leading alliance, making AEGA membership the trusted benchmark for recruitment integrity and sponsor compliance.' },
      { title: 'TRANSFORM THE INDUSTRY', description: 'We envision a future where every recruitment agent and educational sponsor operates with the tools and insights necessary for excellence.' },
      { title: 'EMPOWER THROUGH CONFIDENCE', description: 'We strive to equip our partners to facilitate smooth, compliant, and enriching educational experiences for students worldwide.' }
    ]
  },
  ourVision: {
    title: 'OUR VISION',
    image: '/peter-speech.png',
    description: 'A global education landscape where every student is served by certified, compliant, and ethical agents; where universities have complete confidence in their recruitment partners; and where transparency and accountability are the industry standard.'
  },
  ourJourney: {
    image: '/peter-journey.png',
    timeline: [
      { year: '2020', title: 'AEGA Founded', description: 'Launched with 50 founding members' },
      { year: '2021', title: '500 Agents', description: 'Reached 500 certified agents across 15 countries' },
      { year: '2022', title: 'Global Expansion', description: 'Expanded to 35 countries with university partnerships' },
      { year: '2023', title: '100+ Universities', description: 'Partnered with over 100 institutions worldwide' },
      { year: '2024', title: '2,500 Agents', description: 'Certified 2,500+ agents with 50,000+ CPD hours delivered' }
    ]
  },
  globalImpact: {
    description: "AEGA's influence spans 45+ countries, supporting thousands of agents, partnering with leading universities, and protecting hundreds of thousands of students worldwide.",
    kpis: [
      { value: '500+', description: 'successful partnerships' },
      { value: '200+', description: 'local or capital investment' },
      { value: '100+', description: 'publications on investment' },
      { value: '3K+', description: 'initiated clients' }
    ]
  },
  coreValues: [
    { numbering: 1, title: 'INTEGRITY FIRST', description: 'We prioritize transparency and non-negotiable ethical standards in every partner and student interaction.' },
    { numbering: 2, title: 'ACCOUNTABILITY YOU CAN TRUST', description: 'Our business approach is measurable, auditable, and strictly aligned with global regulatory expectations.' },
    { numbering: 3, title: 'COLLABORATION FOR PROGRESS', description: 'We unite agents, universities, and regulators to solve global recruitment challenges through shared standards.' },
    { numbering: 4, title: 'INTEGRITY FIRST', description: 'We prioritize transparency and non-negotiable ethical standards in every partner and student interaction.' },
    { numbering: 5, title: 'ACCOUNTABILITY YOU CAN TRUST', description: 'Our business approach is measurable, auditable, and strictly aligned with global regulatory expectations.' },
    { numbering: 6, title: 'COLLABORATION FOR PROGRESS', description: 'We unite agents, universities, and regulators to solve global recruitment challenges through shared standards.' }
  ],
  clientReviews: [
    { image: '/University_of_London.png', clientName: 'Director of UKVI Compliance', description: 'Peter Yetton’s guidance has been invaluable in strengthening our international recruitment and compliance operations. His collaborative approach helped us apply the principles of “safe growth,” improve audit readiness, enhance transparency, and build stronger agent relationships enabling us to confidently sustain recruitment even in higher-risk markets.' },
    { image: '/University_of_Stirling.png', clientName: 'Director of International Recruitment and Admissions', description: 'Pete’s guidance was instrumental in helping our team achieve confident compliance and deliver a very positive audit outcome. Through clear strategic direction, thorough process reviews, and practical support, he strengthened our operations and upskilled our wider institution enabling a capable, collaborative team and reducing reliance on single points of failure.' }
  ]
};

export const getAboutContent = async (req, res) => {
  try {
    let content = await AboutContent.findOne();
    if (!content) {
      content = new AboutContent(defaultAboutContent);
      await content.save();
    }
    return res.status(200).json({ success: true, data: content });
  } catch (error) {
    console.error('Error fetching about content:', error);
    return res.status(500).json({ success: false, message: 'Server error loading content' });
  }
};

export const updateAboutContent = async (req, res) => {
  try {
    let content = await AboutContent.findOne();
    if (!content) {
      content = new AboutContent(defaultAboutContent);
    }

    const fields = [
      'aboutUs',
      'innerSection2',
      'ourStory',
      'ourMission',
      'ourVision',
      'ourJourney',
      'globalImpact',
      'coreValues',
      'clientReviews'
    ];

    fields.forEach((field) => {
      if (req.body[field] !== undefined) {
        content[field] = req.body[field];
      }
    });

    await content.save();
    return res.status(200).json({ success: true, data: content });
  } catch (error) {
    console.error('Error updating about content:', error);
    return res.status(500).json({ success: false, message: 'Server error updating content' });
  }
};
