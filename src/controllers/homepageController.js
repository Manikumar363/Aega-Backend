import HomepageContent from '../models/homepageContent.js';

export const getHomepageContent = async (req, res) => {
  try {
    let content = await HomepageContent.findOne();
    if (!content) {
      // Seed initial sample data to make it look excellent right away
      content = new HomepageContent({
        banner: {
          image: '/hero-image.jpg',
          heading: 'BUILDING GLOBAL TRUST IN EDUCATION ADVISING',
          description: 'Aega is a leading quality assurance and global compliance ecosystem that supports education advisors, agents, and institutions globally.',
          redirectionUrl: '/register'
        },
        storyOfUs: {
          image: '/story-image.jpg',
          heading: 'OUR STORY & PURPOSE',
          description: 'Aega was established by university directors, quality assurance professionals, and technology experts who saw a critical gap in international student recruiting compliance and advisor training.'
        },
        whatWeDo: [
          { heading: 'Advisor CPD Training & Certification', description: 'Comprehensive training and certification modules for education advisors.', numbering: 1 },
          { heading: 'Compliance Auditing', description: 'Robust location-wise agency performance reviews and documentation audits.', numbering: 2 }
        ],
        whyAega: {
          description: 'We believe that international student recruitment should be compliant, transparent, and built on institutional trust.',
          image: '/why-aega.jpg',
          bottomTitles: ['Compliance First', 'Global Certification', 'Institutional Trust']
        },
        ourCommitment: {
          title: 'OUR COMMITMENT TO TRANSPARENCY',
          description: 'We provide state-of-the-art compliance solutions to ensure zero visa refusals and accurate agent performance metrics.',
          image: '/commitment.jpg',
          kpis: [1000, 85, 99, 120], // e.g. Total Trained, Visa Success, Audits, Institutions
          points: [
            { title: 'Visa Quality Assurance', description: 'Verify all academic transcripts and English tests before institutional upload.', numbering: 1 }
          ]
        },
        ourImpact: {
          description: 'Creating trust across borders and validating professional standards in international education.',
          image: '/impact.jpg',
          points: [
            { title: 'Global Recognition', description: 'Recognized by major universities in the UK, Australia, and Canada.' }
          ]
        },
        testimonials: [
          { review: 'AEGA has completely transformed how we audit our sub-agents and track location-wise compliance scores.', image: '/avatar.jpg', userDetails: 'Arun Kumar, B2B Owner' }
        ]
      });
      await content.save();
    }
    return res.status(200).json({ success: true, data: content });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

export const updateHomepageContent = async (req, res) => {
  try {
    let content = await HomepageContent.findOne();
    if (!content) {
      content = new HomepageContent({});
    }

    // Merge only the keys passed in req.body
    if (req.body.banner) content.banner = { ...content.banner, ...req.body.banner };
    if (req.body.storyOfUs) content.storyOfUs = { ...content.storyOfUs, ...req.body.storyOfUs };
    if (req.body.whatWeDo) content.whatWeDo = req.body.whatWeDo;
    if (req.body.whyAega) content.whyAega = { ...content.whyAega, ...req.body.whyAega };
    if (req.body.ourCommitment) content.ourCommitment = { ...content.ourCommitment, ...req.body.ourCommitment };
    if (req.body.ourImpact) content.ourImpact = { ...content.ourImpact, ...req.body.ourImpact };
    if (req.body.testimonials) content.testimonials = req.body.testimonials;

    await content.save();
    return res.status(200).json({ success: true, data: content });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};
