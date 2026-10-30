import rakshak from '../assets/rakshak.jpg'
import codebook from '../assets/codebook.jpg'
import hyperdroid from '../assets/hyperdroid.jpg'
import archishEnterprises from '../assets/archish-enterprises.jpg'
import norabot from '../assets/norabot.jpg'
import decaptcha from '../assets/decaptcha.jpg'

export const featured = [
  {
    title: 'Rakshak',
    blurb:
      'Disaster-management app with real-time incident updates and a fast volunteer dispatch system, so an organisation can get volunteers to an affected area within seconds of a report.',
    tech: ['Java', 'Android'],
    github: 'https://github.com/Archish27/Rakshak',
    external: 'https://play.google.com/store/apps/details?id=com.markdevelopers.rakshak&hl=en/',
    externalLabel: 'Play Store',
    image: rakshak,
  },
  {
    title: 'CodeBook',
    blurb:
      'Android learning platform for programming languages: annotated snippets with their output, topic theory written by experts, and quizzes with points to compete on.',
    tech: ['Java', 'Android', 'SQLite'],
    github: 'https://github.com/Archish27/Codebook-Chef-of-Languages',
    image: codebook,
  },
  {
    title: 'Hyperdroid',
    blurb:
      'Virtual smartphones over IP. A Linux host runs a fleet of VMs, each bound to one user at a time, so heavy computation moves off the phone and into the cloud. Firebase holds user and VM state.',
    tech: ['Java', 'Android', 'Firebase', 'Virtualization'],
    github: 'https://github.com/Archish27/Hyperdroid-Virtual-Smartphone-over-IP',
    image: hyperdroid,
  },
  {
    title: 'Archish Enterprises',
    blurb:
      'Site for a Mumbai packaging manufacturer: corrugated and cardboard boxes, BOPP tapes, bubble wrap, courier bags and stretch film.',
    tech: ['Gatsby', 'React', 'CSS'],
    github: 'https://github.com/archishenterprises/archishenterprises.github.io',
    external: 'http://archishenterprises.github.io/',
    externalLabel: 'Live site',
    image: archishEnterprises,
  },
  {
    title: 'Nora',
    blurb:
      'A Rasa-powered chatbot that answers the common questions about COVID-19, built to absorb the volume of queries from customers, partners and staff.',
    tech: ['Python', 'Rasa', 'React'],
    github: 'https://github.com/Archish27/nora-covid-19-bot',
    external: 'http://norabot.netlify.app/',
    externalLabel: 'Live site',
    image: norabot,
  },
  {
    title: 'deCaptcha',
    blurb:
      'A privacy-first captcha powered by people: a decentralised network of solvers and validators that keeps spam off your pages and reliably labels datasets along the way.',
    tech: ['Next.js', 'Web3'],
    github: 'https://github.com/decaptcha',
    external: 'https://www.decaptcha.world',
    externalLabel: 'Live site',
    image: decaptcha,
  },
]

export const archive = [
  {
    title: 'Nodejs Koans',
    year: 2020,
    note: 'Learn JavaScript and Node.js by making failing tests pass.',
    tech: 'Node.js, JavaScript',
    github: 'https://github.com/Archish27/nodejs-koans',
  },
  {
    title: 'Health Expert',
    year: 2018,
    note: 'Predicts likely conditions from symptoms with classic machine learning.',
    tech: 'Python, Flask, ML',
    github: 'https://github.com/Archish27/HealthExpert',
  },
]
