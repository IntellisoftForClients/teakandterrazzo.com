require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_EMAIL || 'admin@teakandterrazzo.com';
  const password = process.env.ADMIN_PASSWORD || 'change-me';
  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.adminUser.upsert({
    where: { email },
    update: { passwordHash },
    create: { email, passwordHash, name: 'Site Admin' },
  });

  await prisma.siteSettings.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      brandName: 'Teak & Terrazzo',
      phone: '(+880) 72 611 3343',
      address: '123 Wonder Design Avenue, San Diego, CA',
      email: 'hello@teakandterrazzo.com',
      aboutText:
        'We create thoughtfully designed interiors that blend style, comfort, and functionality. Our team transforms everyday spaces into inspiring environments.',
    },
  });

  const serviceCount = await prisma.service.count();
  if (serviceCount === 0) {
    const services = [
      {
        title: 'Home Interior Design',
        slug: 'home-interior-design',
        summary:
          'Thoughtfully designed home interiors that blend comfort, style, and functionality to create a space that truly reflects your lifestyle.',
        imagePath: '/assets/images/service-residential-apartment.jpg',
        sortOrder: 1,
      },
      {
        title: 'Space Planning',
        slug: 'space-planning',
        summary:
          'Smart layouts that maximize space, improve flow, and ensure every area is both functional and visually balanced.',
        imagePath: '/assets/images/service-space-planning-layout.jpg',
        sortOrder: 2,
      },
      {
        title: 'Commercial Design',
        slug: 'commercial-design',
        summary:
          'Professional interior solutions designed to create functional, stylish spaces that enhance productivity and elevate your brand image.',
        imagePath: '/assets/images/service-commercial-office.jpg',
        sortOrder: 3,
      },
      {
        title: 'Furniture Design',
        slug: 'furniture-design',
        summary:
          'Bespoke furniture solutions thoughtfully designed to enhance your interior, combining style, comfort, and functionality to suit your space and lifestyle.',
        imagePath: '/assets/images/service-custom-furniture.jpg',
        sortOrder: 4,
      },
    ];
    await prisma.service.createMany({ data: services });
  }

  const projectCount = await prisma.project.count();
  if (projectCount === 0) {
    await prisma.project.createMany({
      data: [
        {
          title: 'Nyla B2601',
          slug: 'nyla-b2601',
          category: 'Residential',
          imagePath: '/assets/images/project-nyla-living.jpg',
          sortOrder: 1,
        },
        {
          title: 'Nyla B2601 — Bedroom Suite',
          slug: 'nyla-b2601-bedroom',
          category: 'Residential',
          imagePath: '/assets/images/project-nyla-bedroom.jpg',
          sortOrder: 2,
        },
        {
          title: 'Nyla B2601 — Kitchen',
          slug: 'nyla-b2601-kitchen',
          category: 'Residential',
          imagePath: '/assets/images/project-nyla-kitchen.jpg',
          sortOrder: 3,
        },
      ],
    });
  }

  const blogCount = await prisma.blogPost.count();
  if (blogCount === 0) {
    await prisma.blogPost.createMany({
      data: [
        {
          title: 'Planning Interiors for Urban Hyderabad Homes',
          slug: 'planning-interiors-urban-hyderabad-homes',
          excerpt: 'How thoughtful space planning improves light, storage, and flow in apartment and gated-community residences.',
          coverPath: '/assets/images/blog-apartment-planning.jpg',
          publishedAt: new Date('2026-03-12'),
        },
        {
          title: 'Material Choices That Age Well',
          slug: 'material-choices-that-age-well',
          excerpt: 'Selecting finishes and surfaces that remain elegant, durable, and easy to maintain over time.',
          coverPath: '/assets/images/blog-materials-textures.jpg',
          publishedAt: new Date('2026-02-20'),
        },
        {
          title: 'From Concept to Turnkey Handover',
          slug: 'from-concept-to-turnkey-handover',
          excerpt: 'What a coordinated interior process looks like — from first consultation through site execution and handover.',
          coverPath: '/assets/images/blog-layered-lighting.jpg',
          publishedAt: new Date('2026-01-18'),
        },
      ],
    });
  }

  const testimonialCount = await prisma.testimonial.count();
  if (testimonialCount === 0) {
    await prisma.testimonial.createMany({
      data: [
        {
          quote:
            'We renovated our 3BHK in Jubilee Hills with Teak & Terrazzo. They understood how we actually live — storage for kids, a quiet work corner, and a living room we enjoy hosting in. Timelines were clear and the finish quality matched what was promised.',
          authorName: 'Ananya Reddy',
          authorDate: 'Jubilee Hills, Hyderabad',
          avatarPath: '/assets/images/client-avatar-ananya.jpg',
          sortOrder: 1,
        },
        {
          quote:
            'From the first site visit to handover, the team was organised and honest about costs. Our Gachibowli apartment feels open and practical, with materials that suit Hyderabad weather. We never felt pushed into unnecessary add-ons.',
          authorName: 'Rahul Sharma',
          authorDate: 'Gachibowli, Hyderabad',
          avatarPath: '/assets/images/client-avatar-rahul.jpg',
          sortOrder: 2,
        },
        {
          quote:
            'I wanted a calm, modern home without looking like a showroom. Teak & Terrazzo nailed the lighting,wardrobe planning, and kitchen layout. Communication on WhatsApp and site was prompt — that made the whole turnkey process less stressful.',
          authorName: 'Priya Krishnan',
          authorDate: 'Banjara Hills, Hyderabad',
          avatarPath: '/assets/images/client-avatar-priya.jpg',
          sortOrder: 3,
        },
      ],
    });
  }

  const processCount = await prisma.processStep.count();
  if (processCount === 0) {
    await prisma.processStep.createMany({
      data: [
        {
          title: '1/    Consultation',
          body: 'We discuss your vision, needs, and preferences to understand the goals and direction of your interior design project.',
          imagePath: '/assets/images/process-consultation-meeting.jpg',
          sortOrder: 1,
        },
        {
          title: '2/    Planning',
          body: 'We develop detailed floor plans, layouts, and timelines that align with your budget, lifestyle, and project requirements.',
          imagePath: '/assets/images/process-site-measurement.jpg',
          sortOrder: 2,
        },
        {
          title: '3/    Design',
          body: 'Our designers craft concepts, material palettes, and 3D visualizations so you can experience the space before construction begins.',
          imagePath: '/assets/images/process-material-selection.jpg',
          sortOrder: 3,
        },
        {
          title: '4/    Execution',
          body: 'We manage installation and finishing with precision, ensuring every detail is delivered to the highest standard.',
          imagePath: '/assets/images/process-execution-handover.jpg',
          sortOrder: 4,
        },
      ],
    });
  }

  console.log('Seed complete.');
  console.log(`Admin login: ${email} / ${password}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
