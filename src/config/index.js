module.exports = {
  siteTitle: 'Archish Thakkar | Software Engineer',
  siteDescription:
    'Archish Thakkar is a software engineer based in Mumbai, India who specializes in developing (and occasionally designing) exceptional, high-quality softwares, websites and applications.',
  siteKeywords:
    'Archish Thakkar, Archish, Thakkar, archish27, software engineer, front-end engineer, web developer, javascript, jpmorgan',
  siteUrl: 'htttp://archishthakkar.in',
  siteLanguage: 'en_US',

  googleVerification: 'DCl7VAf9tcz6eD9gb67NfkNnJ1PKRNcg8qQiwpbx9Lk',

  name: 'Archish Thakkar',
  location: 'Mumbai, India',
  email: 'archishthakkar@gmail.com',
  github: 'https://github.com/archish27/',
  socialMedia: [
    {
      name: 'Github',
      url: 'https://github.com/archish27/',
    },
    {
      name: 'Linkedin',
      url: 'https://in.linkedin.com/in/archish-thakkar-182556105',
    },
    {
      name: 'Play Store',
      url:
        'https://play.google.com/store/apps/developer?id=Archish+Thakkar&hl=en',
    },
    {
      name: 'Stack Overflow',
      url: 'https://stackoverflow.com/users/3725586/archis-thakkar',
    },
    {
      name: 'Instagram',
      url: 'https://www.instagram.com/archis_thakkar/',
    },
  ],

  navLinks: [
    {
      name: 'About',
      url: '#about',
    },
    {
      name: 'Experience',
      url: '#jobs',
    },
    {
      name: 'Work',
      url: '#projects',
    },
    {
      name: 'Contact',
      url: '#contact',
    },
  ],

  googleAnalyticsID: 'UA-78946797-1',

  navHeight: 100,

  greenColor: '#0080F3',
  navyColor: '#131418',
  darkNavyColor: '#131418',

  srConfig: (delay = 200) => ({
    origin: 'bottom',
    distance: '20px',
    duration: 500,
    delay,
    rotate: { x: 0, y: 0, z: 0 },
    opacity: 0,
    scale: 1,
    easing: 'cubic-bezier(0.645, 0.045, 0.355, 1)',
    mobile: true,
    reset: false,
    useDelay: 'always',
    viewFactor: 0.25,
    viewOffset: { top: 0, right: 0, bottom: 0, left: 0 },
  }),
};
