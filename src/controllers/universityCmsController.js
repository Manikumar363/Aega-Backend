import UniversityContent from '../models/universityContent.js';

// Default seeding fallback
const defaultUniversityContent = {
  universityHero: {
    title: 'FOR UNIVERSITIES &\nSPONSORS',
    description: 'Partner with AEGA to access verified agents, reduce recruitment risk, and ensure compliance across your international recruitment network'
  },
  professionalGuidelines: {
    title: 'PROFESSIONAL GUIDELINES',
    image: '/peter-explaining.png',
    description: 'Our comprehensive guidelines ensure you operate to the highest standards, maintain regulatory compliance, and protect student welfare.',
    points: [
      'UKVI Compliance Standards',
      'Ethical Practice Framework',
      'Student Protection Protocols',
      'Financial Conduct Guidelines',
      'Marketing & Advertising Standards',
      'Data Protection & Privacy'
    ]
  },
  servicesForPartners: {
    title: 'SERVICES FOR UNIVERSITY PARTNERS',
    description: 'As a university partner, you gain access to comprehensive agent management tools, compliance reporting, and governance support.',
    points: [
      { numbering: '01.', title: 'Access to Verified Agent Database' },
      { numbering: '02.', title: 'Real-Time Compliance Dashboards' },
      { numbering: '03.', title: 'Agent Performance Reporting' },
      { numbering: '04.', title: 'Risk Management Frameworks' },
      { numbering: '05.', title: 'Training and Onboarding Support' },
      { numbering: '06.', title: 'Incident and Complaint Management' },
      { numbering: '07.', title: 'Regulatory Update Notifications' },
      { numbering: '08.', title: 'Partnership Development Resources' }
    ]
  },
  learningPath: {
    title: 'AEGA LEARNING PATH',
    description: 'Comprehensive support at every stage of your agent development journey',
    image: '/peter-founders.png',
    points: [
      { numbering: '01.', title: 'Onboarding', description: "A structured introduction to AEGA's standards, systems, and expectations to get you started on the right foot." },
      { numbering: '02.', title: 'Mandatory Training', description: 'Complete required modules covering ethics, compliance frameworks, and best practices in international student recruitment.' },
      { numbering: '03.', title: 'CPD Tracking', description: 'Log and monitor your Continuing Professional Development hours to maintain your accreditation and demonstrate growth.' },
      { numbering: '04.', title: 'Compliance Scoring', description: "Receive a real-time compliance score reflecting your adherence to AEGA's regulatory and ethical standards." },
      { numbering: '05.', title: 'Insurance Support', description: 'Access guidance and resources on professional indemnity insurance to protect your agency and clients.' },
      { numbering: '06.', title: 'Certification', description: 'Earn AEGA-recognised certifications that validate your expertise and build trust with universities and students.' },
      { numbering: '07.', title: 'Ongoing Monitoring', description: 'Continuous oversight and feedback to ensure sustained compliance, quality practice, and professional development.' }
    ]
  },
  ourImpact: {
    description: 'AT AEGA, WE BELIEVE THAT INTERNATIONAL STUDENT RECRUITMENT IS NOT MERELY A TRANSACTION—IT IS A LIFE-CHANGING JOURNEY THAT DEMANDS THE HIGHEST STANDARDS OF PROTECTION AND ETHICS. OUR IMPACT IS MEASURED BY THE STABILITY WE BRING TO INSTITUTIONS AND THE FUTURES WE SECURE FOR STUDENTS WORLDWIDE.',
    image: '/landingPage/why-aega.png',
    points: [
      { title: 'ESTABLISH A GLOBAL STANDARD', description: 'We aim to become the world\'s leading alliance, making AEGA membership the trusted benchmark for recruitment integrity and sponsor compliance.' },
      { title: 'TRANSFORM THE INDUSTRY', description: 'We envision a future where every recruitment agent and educational sponsor operates with the tools and insights necessary for excellence.' },
      { title: 'EMPOWER THROUGH CONFIDENCE', description: 'We strive to equip our partners to facilitate smooth, compliant, and enriching educational experiences for students worldwide.' }
    ]
  },
  clientReviews: [
    { image: '/Liverpool_School_of_Tropical_Medicine.png', clientName: 'Academic Registrar and Director of Compliance and Admissions', description: 'Drawing on deep sector experience and an open, honest communication style, Pete quickly identified core business challenges and delivered clear, tailored recommendations across policy, people, and structure. His pragmatic approach, strong governance insight, and ability to align internal and external stakeholders helped strengthen oversight and drive more effective, joined-up compliance.' },
    { image: '/Durham_University.png', clientName: 'Chief Financial Officer/Executive Board member', description: 'Pete took the time to understand our business and people, ensuring we developed a truly joined-up, end-to-end approach to UKVI compliance. By engaging widely across teams, he identified what needed to change and helped us implement clear, tailored improvements that strengthened our processes, systems, and overall readiness.' }
  ]
};

export const getUniversityContent = async (req, res) => {
  try {
    let content = await UniversityContent.findOne();
    if (!content) {
      content = new UniversityContent(defaultUniversityContent);
      await content.save();
    }
    return res.status(200).json({ success: true, data: content });
  } catch (error) {
    console.error('Error fetching university content:', error);
    return res.status(500).json({ success: false, message: 'Server error loading content' });
  }
};

export const updateUniversityContent = async (req, res) => {
  try {
    let content = await UniversityContent.findOne();
    if (!content) {
      content = new UniversityContent(defaultUniversityContent);
    }

    const fields = [
      'universityHero',
      'professionalGuidelines',
      'servicesForPartners',
      'learningPath',
      'ourImpact',
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
    console.error('Error updating university content:', error);
    return res.status(500).json({ success: false, message: 'Server error updating content' });
  }
};
