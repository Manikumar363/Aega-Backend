import MembersContent from '../models/membersContent.js';

// Default seeding fallback
const defaultMembersContent = {
  membersHero: {
    title: 'FOR MEMBERS',
    description: 'Access comprehensive training, compliance resources, and professional development tools to elevate your practice and build credibility.'
  },
  professionalGuidelines: {
    image: '/benefits.png',
    title: 'PROFESSIONAL GUIDELINES',
    description: 'Our comprehensive guidelines ensure you operate to the highest standards, maintain regulatory compliance, and protect student welfare.',
    bulletPoints: [
      'UKVI Compliance Standards',
      'Ethical Practice Framework',
      'Student Protection Protocols',
      'Financial Conduct Guidelines',
      'Marketing & Advertising Standards',
      'Data Protection & Privacy'
    ]
  },
  rangeOfServices: {
    title: 'RANGE OF SERVICES',
    description: 'Everything you need to succeed as an education agent',
    services: [
      {
        numbering: '01.',
        title: 'TRAINING OVERVIEW',
        description: 'Comprehensive CPD programs designed for professional growth',
        points: ['Accredited courses', 'Expert-led training', 'Flexible learning', 'Certification pathways']
      },
      {
        numbering: '02.',
        title: 'REGULATION & COMPLIANCE',
        description: 'Stay current with UKVI and global regulatory requirements',
        points: ['UKVI updates', 'Compliance frameworks', 'Audit preparation', 'Risk management']
      },
      {
        numbering: '03.',
        title: 'CAREER GROWTH',
        description: 'Advance your career with professional development opportunities',
        points: ['Skill enhancement', 'Industry recognition', 'Networking events', 'Leadership training']
      },
      {
        numbering: '04.',
        title: 'EDUCATION TECH',
        description: 'Access cutting-edge tools and platforms for modern agents',
        points: ['Digital resources', 'CRM integration', 'Analytics tools', 'Student management']
      }
    ]
  },
  membershipBenefits: {
    title: 'MEMBERSHIP BENEFITS',
    description: 'Build your reputation and grow your business',
    image: '/aboutPage/peter-meeting.png',
    benefits: [
      { title: 'Professional Certification Founded', description: 'Recognized credentials that build trust' },
      { title: 'Compliance Tracking', description: 'Real-time monitoring and support' },
      { title: 'Business Tools', description: 'Resources to streamline operations' },
      { title: 'CPD Library', description: 'Unlimited access to training courses' },
      { title: 'Insurance Support', description: 'Guidance on professional indemnity' },
      { title: 'Best Practices', description: 'Learn from industry leaders' }
    ]
  },
  operationalFramework: {
    image: '/benefits.png',
    title: 'OPERATIONAL FRAMEWORKS & SYSTEMS INTEGRATION',
    points: [
      { title: 'Whole Business Health Checks', description: 'A comprehensive 360-degree assessment to identify process breaks, operational gaps, and recommended enhancements for sustainable growth.' },
      { title: 'Lean Working & Systems Integration', description: 'Guidance on integrating technology-driven features—including tailor-made CRMs and workflow automation—to reduce manual error and increase oversight.' },
      { title: 'Organizational Restructuring', description: 'Workshop support for mapping the student journey with a new organizational shape that clarifies roles, responsibilities, and leadership dynamics.' }
    ]
  },
  preCasReady: {
    title: 'THE PRE-CAS & STUDENT READINESS PROTOCOL',
    image: '/peter-journey.png',
    points: [
      { title: 'Pre-CAS Interviews:', description: 'Members must conduct detailed interviews that evaluate a student’s intent, linguistic readiness, and financial stability.' },
      { title: 'Feedback & Clarifications:', description: 'Every interview requires a standardized feedback loop to provide further guidance to the student or to help the Sponsor make informed CAS decisions.' },
      { title: 'Student Due Diligence:', description: 'A standardized due diligence overview to verify academic credentials and personal documentation, mirroring the rigour of legal frameworks.' }
    ]
  },
  clientReviews: [
    { image: "/King's_College_London.png", clientName: 'Academic Registrar and Director of Compliance and Admissions', description: 'Drawing on deep sector experience and an open, honest communication style, Pete quickly identified core business challenges and delivered clear, tailored recommendations across policy, people, and structure. His pragmatic approach, strong governance insight, and ability to align internal and external stakeholders helped strengthen oversight and drive more effective, joined-up compliance.' },
    { image: '/KingstonUniLogo.png', clientName: 'Chief Financial Officer/Executive Board member', description: 'Pete took the time to understand our business and people, ensuring we developed a truly joined-up, end-to-end approach to UKVI compliance. By engaging widely across teams, he identified what needed to change and helped us implement clear, tailored improvements that strengthened our processes, systems, and overall readiness.' }
  ]
};

export const getMembersContent = async (req, res) => {
  try {
    let content = await MembersContent.findOne();
    if (!content) {
      content = new MembersContent(defaultMembersContent);
      await content.save();
    }
    return res.status(200).json({ success: true, data: content });
  } catch (error) {
    console.error('Error fetching members content:', error);
    return res.status(500).json({ success: false, message: 'Server error loading content' });
  }
};

export const updateMembersContent = async (req, res) => {
  try {
    let content = await MembersContent.findOne();
    if (!content) {
      content = new MembersContent(defaultMembersContent);
    }

    const fields = [
      'membersHero',
      'professionalGuidelines',
      'rangeOfServices',
      'membershipBenefits',
      'operationalFramework',
      'preCasReady',
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
    console.error('Error updating members content:', error);
    return res.status(500).json({ success: false, message: 'Server error updating content' });
  }
};
