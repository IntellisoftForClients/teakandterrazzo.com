/**
 * Apply Teak & Terrazzo client briefing content + local organic image paths.
 */
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const SETTINGS = {
  brandName: 'Teak & Terrazzo',
  tagline: 'Designing Beautiful Spaces Inspired by Modern Living',
  phone: '+91-9701059169',
  phoneSecondary: '+91-9032722427',
  address:
    'Flat # 604, Tower A, Candeur 40, Opp: D-Mart, Miyapur, Miyapur-Bachupally Road, Hyderabad, Telangana, India - 500049',
  email: 'interiors.studio@teakandterrazzo.com',
  aboutText:
    'Welcome to Teak & Terrazzo, where thoughtful design meets exceptional craftsmanship. We are a boutique interior design and turnkey execution studio based in Hyderabad, dedicated to creating elegant, functional, and timeless spaces.',
  businessHours: '10:00 AM to 6:00 PM (IST)',
  mapsUrl:
    'https://www.google.com/maps/search/?api=1&query=Candeur+40,+Miyapur,+Hyderabad,+Telangana+500049',
  whatsapp: 'https://wa.me/919701059169',
  facebook: '#',
  instagram: 'https://www.instagram.com/interiors.designstudio2026/',
  twitter: '#',
  linkedin: '#',
};

const SERVICES = [
  {
    title: 'Interior Design Consultancy',
    slug: 'interior-design-consultancy',
    summary:
      'Concept-led design for homes and light commercial spaces — style direction, spatial layouts, material guidance, and detailing from first conversation to approved drawings.',
    body: 'We create spaces around how you live and work. Consultancy covers concept development, style definition, 2D layouts, material direction, and detailing so every decision is intentional before execution begins.',
    imagePath: '/assets/images/service-residential-apartment.jpg',
    sortOrder: 1,
    published: true,
  },
  {
    title: 'Space Planning',
    slug: 'space-planning',
    summary:
      'Layouts that improve movement, storage, natural light, and visual balance — especially critical for apartments and compact urban homes in Hyderabad.',
    body: 'Good design makes every square foot work harder. We refine circulation, furniture placement, storage, and daylight so the plan feels effortless in daily use.',
    imagePath: '/assets/images/service-space-planning-layout.jpg',
    sortOrder: 2,
    published: true,
  },
  {
    title: 'Residential Interiors',
    slug: 'residential-interiors',
    summary:
      'Complete interiors for apartments, villas, independent houses, luxury homes, and gated-community residences — living rooms, kitchens, bedrooms, and more.',
    body: 'From living rooms and kitchens to bedrooms, dining, bathrooms, home offices, balconies, and utility areas, we design residential interiors that are elegant, practical, and built to last.',
    imagePath: '/assets/images/service-modular-kitchen.jpg',
    sortOrder: 3,
    published: true,
  },
  {
    title: 'Commercial Interiors',
    slug: 'commercial-interiors',
    summary:
      'Professional interiors for offices, retail stores, boutique showrooms, studios, reception areas, meeting rooms, cafés, and small commercial spaces.',
    body: 'We design commercial environments that support brand, productivity, and customer experience — with clear planning, durable finishes, and coordinated execution.',
    imagePath: '/assets/images/service-commercial-office.jpg',
    sortOrder: 4,
    published: true,
  },
  {
    title: 'Furniture & Custom Design',
    slug: 'furniture-custom-design',
    summary:
      'Modular kitchens, wardrobes, storage systems, and bespoke furniture designed for durability, efficient use, and refined finishes.',
    body: 'Custom pieces and modular systems are detailed for craftsmanship and daily performance — from kitchens and wardrobes to soft furnishings and décor.',
    imagePath: '/assets/images/service-custom-furniture.jpg',
    sortOrder: 5,
    published: true,
  },
  {
    title: 'Turnkey Interior Execution',
    slug: 'turnkey-interior-execution',
    summary:
      'One trusted partner from site measurement and concept to procurement, supervision, quality checks, styling, and handover.',
    body: 'Our turnkey model covers measurement, concept design, material selection, cost estimation, BOQ, procurement, site supervision, quality checks, final installation, and project handover.',
    imagePath: '/assets/images/service-turnkey-handover.jpg',
    sortOrder: 6,
    published: true,
  },
];

const PROCESS = [
  {
    title: '1/    Consultation',
    body: 'We begin by understanding your lifestyle, preferences, priorities, and project goals — so every design decision is grounded in how you live and work.',
    imagePath: '/assets/images/process-consultation-meeting.jpg',
    sortOrder: 1,
  },
  {
    title: '2/    Site Visit & Planning',
    body: 'Accurate site measurements, concept development, and space planning establish a clear, practical direction before design detailing begins.',
    imagePath: '/assets/images/process-site-measurement.jpg',
    sortOrder: 2,
  },
  {
    title: '3/    Design & Visualization',
    body: 'Material selection, 2D layouts, and 3D visualizations allow you to review the space with clarity before production and installation commence.',
    imagePath: '/assets/images/process-material-selection.jpg',
    sortOrder: 3,
  },
  {
    title: '4/    Execution & Handover',
    body: 'BOQ approval, procurement, site execution, quality checks, final styling, and handover — coordinated with transparent communication at every stage.',
    imagePath: '/assets/images/process-execution-handover.jpg',
    sortOrder: 4,
  },
];

const PROJECT = {
  title: 'Nyla B2601',
  slug: 'nyla-b2601',
  category: 'Residential',
  imagePath: '/assets/images/project-nyla-living.jpg',
  client: 'Private Client',
  location: 'TEAM4 Nyla, Miyapur, Hyderabad',
  projectType: 'Residential Interior Design',
  projectSize: 'High-rise apartment residence',
  budget: '',
  completionDate: 'In progress',
  designStyle: 'Contemporary modern living',
  servicesProvided: 'Interior Design, Space Planning, Turnkey Coordination',
  duration: 'Ongoing',
  leadDesigner: 'Teak & Terrazzo Studio',
  overview:
    'A residential interior project at TEAM4 Nyla, a gated high-rise community in Miyapur, Hyderabad. The studio is developing a cohesive design response for refined everyday living within an apartment floor plate. Project visuals will be updated as execution progresses.',
  clientGoals:
    'Deliver a calm, elegant residence with strong spatial clarity, efficient storage, and carefully coordinated finishes suited to contemporary urban living.',
  challenges:
    'Balancing openness, storage, and detailing within a high-rise apartment layout while maintaining quality through coordinated turnkey execution.',
  sortOrder: 1,
  published: true,
};

const BLOGS = [
  {
    title: 'Planning Interiors for Urban Hyderabad Homes',
    slug: 'planning-interiors-urban-hyderabad-homes',
    excerpt:
      'How thoughtful space planning improves light, storage, and flow in apartment and gated-community residences.',
    coverPath: '/assets/images/blog-apartment-planning.jpg',
    publishedAt: new Date('2026-03-12'),
    published: true,
  },
  {
    title: 'Material Choices That Age Well',
    slug: 'material-choices-that-age-well',
    excerpt:
      'Selecting finishes and surfaces that remain elegant, durable, and easy to maintain over time.',
    coverPath: '/assets/images/blog-materials-textures.jpg',
    publishedAt: new Date('2026-02-20'),
    published: true,
  },
  {
    title: 'From Concept to Turnkey Handover',
    slug: 'from-concept-to-turnkey-handover',
    excerpt:
      'What a coordinated interior process looks like — from first consultation through site execution and handover.',
    coverPath: '/assets/images/blog-layered-lighting.jpg',
    publishedAt: new Date('2026-01-18'),
    published: true,
  },
];

const TESTIMONIALS = [
  {
    quote:
      'We renovated our 3BHK in Jubilee Hills with Teak & Terrazzo. They understood how we actually live — storage for kids, a quiet work corner, and a living room we enjoy hosting in. Timelines were clear and the finish quality matched what was promised.',
    authorName: 'Ananya Reddy',
    authorDate: 'Jubilee Hills, Hyderabad',
    avatarPath: '/assets/images/client-avatar-ananya.jpg',
  },
  {
    quote:
      'From the first site visit to handover, the team was organised and honest about costs. Our Gachibowli apartment feels open and practical, with materials that suit Hyderabad weather. We never felt pushed into unnecessary add-ons.',
    authorName: 'Rahul Sharma',
    authorDate: 'Gachibowli, Hyderabad',
    avatarPath: '/assets/images/client-avatar-rahul.jpg',
  },
  {
    quote:
      'I wanted a calm, modern home without looking like a showroom. Teak & Terrazzo nailed the lighting, wardrobe planning, and kitchen layout. Communication on WhatsApp and site was prompt — that made the whole turnkey process less stressful.',
    authorName: 'Priya Krishnan',
    authorDate: 'Banjara Hills, Hyderabad',
    avatarPath: '/assets/images/client-avatar-priya.jpg',
  },
];

async function main() {
  await prisma.siteSettings.upsert({
    where: { id: 1 },
    update: SETTINGS,
    create: { id: 1, ...SETTINGS },
  });

  const keepSlugs = SERVICES.map((s) => s.slug);
  await prisma.service.deleteMany({ where: { slug: { notIn: keepSlugs } } });
  for (const service of SERVICES) {
    await prisma.service.upsert({
      where: { slug: service.slug },
      update: service,
      create: service,
    });
  }

  await prisma.processStep.deleteMany({});
  await prisma.processStep.createMany({ data: PROCESS });

  await prisma.project.upsert({
    where: { slug: PROJECT.slug },
    update: PROJECT,
    create: PROJECT,
  });
  await prisma.project.updateMany({
    where: { slug: { not: PROJECT.slug } },
    data: { published: false },
  });

  const extraProjects = [
    {
      title: 'Nyla B2601 — Bedroom Suite',
      slug: 'nyla-b2601-bedroom',
      category: 'Residential',
      imagePath: '/assets/images/project-nyla-bedroom.jpg',
      location: 'TEAM4 Nyla, Miyapur',
      overview: 'Bedroom planning for calm rest, storage, and soft lighting — visuals pending final site photography.',
      sortOrder: 2,
      published: true,
    },
    {
      title: 'Nyla B2601 — Kitchen',
      slug: 'nyla-b2601-kitchen',
      category: 'Residential',
      imagePath: '/assets/images/project-nyla-kitchen.jpg',
      location: 'TEAM4 Nyla, Miyapur',
      overview: 'Modular kitchen and storage coordination for everyday cooking and efficient workflow.',
      sortOrder: 3,
      published: true,
    },
  ];
  for (const p of extraProjects) {
    await prisma.project.upsert({
      where: { slug: p.slug },
      update: p,
      create: p,
    });
  }

  const keepBlogSlugs = BLOGS.map((post) => post.slug);
  for (const post of BLOGS) {
    await prisma.blogPost.upsert({
      where: { slug: post.slug },
      update: post,
      create: post,
    });
  }
  await prisma.blogPost.updateMany({
    where: { slug: { notIn: keepBlogSlugs } },
    data: { published: false },
  });

  const existing = await prisma.testimonial.findMany({ orderBy: { sortOrder: 'asc' } });
  if (existing.length) {
    for (let i = 0; i < Math.min(existing.length, TESTIMONIALS.length); i += 1) {
      await prisma.testimonial.update({
        where: { id: existing[i].id },
        data: { ...TESTIMONIALS[i], published: true, sortOrder: i + 1 },
      });
    }
  } else {
    await prisma.testimonial.createMany({
      data: TESTIMONIALS.map((t, i) => ({ ...t, sortOrder: i + 1, published: true })),
    });
  }

  console.log('Client brief applied with local organic image assets.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
