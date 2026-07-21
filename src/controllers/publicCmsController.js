import PublicContent from '../models/publicContent.js';

// Default seeding fallback
const defaultPublicContent = {
  publicHero: {
    title: 'FOR THE PUBLIC',
    description: 'Information and resources for students, parents, and the general public'
  },
  whatAegaDoes: {
    title: 'WHAT AEGA DOES?',
    description: 'The Agents & Educators Global Alliance (AEGA) is a pioneering independent association and regulatory alliance designed to professionalize the international student recruitment sector. It serves as a "strategic and operational backbone" for both student agents and educational Sponsors (universities) by bridging the gaps left by traditional organizations.',
    points: [
      'Agent certification and verification',
      'Continuous compliance monitoring',
      'Student protection mechanisms',
      'Complaint investigation and resolution'
    ],
    title2: 'MAKING A COMPLAINT',
    description2: "If you have concerns about an education agent's conduct, we take all complaints seriously and investigate thoroughly.",
    image: '/peter-speech.png'
  },
  clientReviews: [
    { image: '/Liverpool_School_of_Tropical_Medicine.png', clientName: 'Academic Registrar and Director of Compliance and Admissions', description: 'Drawing on deep sector experience and an open, honest communication style, Pete quickly identified core business challenges and delivered clear, tailored recommendations across policy, people, and structure. His pragmatic approach, strong governance insight, and ability to align internal and external stakeholders helped strengthen oversight and drive more effective, joined-up compliance.' },
    { image: '/Durham_University.png', clientName: 'Chief Financial Officer/Executive Board member', description: 'Pete took the time to understand our business and people, ensuring we developed a truly joined-up, end-to-end approach to UKVI compliance. By engaging widely across teams, he identified what needed to change and helped us implement clear, tailored improvements that strengthened our processes, systems, and overall readiness.' }
  ]
};

export const getPublicContent = async (req, res) => {
  try {
    let content = await PublicContent.findOne();
    if (!content) {
      content = new PublicContent(defaultPublicContent);
      await content.save();
    }
    return res.status(200).json({ success: true, data: content });
  } catch (error) {
    console.error('Error fetching public content:', error);
    return res.status(500).json({ success: false, message: 'Server error loading content' });
  }
};

export const updatePublicContent = async (req, res) => {
  try {
    let content = await PublicContent.findOne();
    if (!content) {
      content = new PublicContent(defaultPublicContent);
    }

    const fields = ['publicHero', 'whatAegaDoes', 'clientReviews'];
    fields.forEach((field) => {
      if (req.body[field] !== undefined) {
        content[field] = req.body[field];
      }
    });

    await content.save();
    return res.status(200).json({ success: true, data: content });
  } catch (error) {
    console.error('Error updating public content:', error);
    return res.status(500).json({ success: false, message: 'Server error updating content' });
  }
};
