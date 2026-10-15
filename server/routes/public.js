const express = require('express');
const prisma = require('../lib/prisma');
const {
  getSiteUrl,
  absoluteUrl,
  clip,
  defaultOgImage,
  buildLocalBusinessJsonLd,
  buildWebSiteJsonLd,
  buildBreadcrumbJsonLd,
  xmlEscape,
} = require('../lib/seo');

const router = express.Router();

const DEFAULT_SERVICE_FEATURES = [
  {
    title: 'Design Around the Person',
    body: 'Lifestyle, routines, and priorities shape the plan — not a fixed style template.',
  },
  {
    title: 'Beauty with Purpose',
    body: 'Layouts, lighting, storage, materials, and furniture earn their place in everyday use.',
  },
  {
    title: 'Thoughtful Use of Space',
    body: 'Space planning improves movement, storage, natural light, and visual balance — especially in urban homes.',
  },
  {
    title: 'Design to Execution',
    body: 'Concept, drawings, materials, coordination, and site delivery stay connected from the start.',
  },
];

const DEFAULT_BLOG_SECTIONS = [
  {
    title: 'Start with a Clear Design Vision',
    body: 'Define the mood and style you want first — it guides every design decision that follows.',
  },
  {
    title: 'Choose the Right Color Palette',
    body: 'Light neutrals open a room; warmer tones add comfort. Pick colors that support the mood you want.',
  },
  {
    type: 'quote',
    text: 'Great interiors come from clarity, consistency, and careful execution.',
    cite: 'Teak & Terrazzo',
  },
  {
    title: 'Optimize Furniture Placement',
    body: 'Place furniture for movement and purpose — each zone should feel intentional.',
  },
  {
    title: 'Enhance with Lighting and Decor',
    body: 'Layer daylight with ambient and accent lighting, then finish with carefully chosen décor.',
  },
];

function parseJsonSafe(value, fallback) {
  if (!value) return fallback;
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
}

async function getSettings() {
  let settings = await prisma.siteSettings.findUnique({ where: { id: 1 } });
  if (!settings) {
    settings = await prisma.siteSettings.create({ data: { id: 1 } });
  }
  return settings;
}

function baseJsonLd(settings, siteUrl) {
  return [buildLocalBusinessJsonLd(settings, siteUrl), buildWebSiteJsonLd(settings, siteUrl)];
}

function pageSeo({ settings, siteUrl, title, description, path, image, imageAlt, type, robots, extraJsonLd }) {
  return {
    title,
    description: clip(description, 160),
    path,
    image: image || defaultOgImage(settings),
    imageAlt,
    type: type || 'website',
    robots,
    jsonLd: [...baseJsonLd(settings, siteUrl), ...(extraJsonLd || [])],
  };
}

router.get('/robots.txt', (req, res) => {
  const siteUrl = getSiteUrl(req);
  res.type('text/plain').send(
    [
      'User-agent: *',
      'Allow: /',
      'Disallow: /admin',
      'Disallow: /admin/',
      'Disallow: /api/',
      '',
      `Sitemap: ${siteUrl}/sitemap.xml`,
      '',
    ].join('\n')
  );
});

router.get('/sitemap.xml', async (req, res, next) => {
  try {
    const siteUrl = getSiteUrl(req);
    const [services, projects, blogs] = await Promise.all([
      prisma.service.findMany({
        where: { published: true },
        select: { slug: true, updatedAt: true },
        orderBy: { sortOrder: 'asc' },
      }),
      prisma.project.findMany({
        where: { published: true },
        select: { slug: true, updatedAt: true },
        orderBy: { sortOrder: 'asc' },
      }),
      prisma.blogPost.findMany({
        where: { published: true },
        select: { slug: true, updatedAt: true, publishedAt: true },
        orderBy: { publishedAt: 'desc' },
      }),
    ]);

    const staticPages = [
      { path: '/', changefreq: 'weekly', priority: '1.0' },
      { path: '/about', changefreq: 'monthly', priority: '0.8' },
      { path: '/services', changefreq: 'weekly', priority: '0.9' },
      { path: '/portfolio', changefreq: 'weekly', priority: '0.9' },
      { path: '/blog', changefreq: 'weekly', priority: '0.8' },
      { path: '/contact', changefreq: 'monthly', priority: '0.7' },
    ];

    const urls = [
      ...staticPages.map((page) => ({
        loc: absoluteUrl(siteUrl, page.path),
        changefreq: page.changefreq,
        priority: page.priority,
      })),
      ...services.map((item) => ({
        loc: absoluteUrl(siteUrl, `/services/${item.slug}`),
        lastmod: item.updatedAt.toISOString(),
        changefreq: 'monthly',
        priority: '0.7',
      })),
      ...projects.map((item) => ({
        loc: absoluteUrl(siteUrl, `/portfolio/${item.slug}`),
        lastmod: item.updatedAt.toISOString(),
        changefreq: 'monthly',
        priority: '0.7',
      })),
      ...blogs.map((item) => ({
        loc: absoluteUrl(siteUrl, `/blog/${item.slug}`),
        lastmod: (item.updatedAt || item.publishedAt).toISOString(),
        changefreq: 'monthly',
        priority: '0.6',
      })),
    ];

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map((entry) => {
    return `  <url>
    <loc>${xmlEscape(entry.loc)}</loc>${
      entry.lastmod ? `\n    <lastmod>${xmlEscape(entry.lastmod)}</lastmod>` : ''
    }
    <changefreq>${entry.changefreq}</changefreq>
    <priority>${entry.priority}</priority>
  </url>`;
  })
  .join('\n')}
</urlset>
`;

    res.type('application/xml').send(xml);
  } catch (err) {
    next(err);
  }
});

router.get('/', async (req, res, next) => {
  try {
    const siteUrl = getSiteUrl(req);
    const [settings, services, projects, blogs, testimonials, processSteps, clientLogos] = await Promise.all([
      getSettings(),
      prisma.service.findMany({ where: { published: true }, orderBy: { sortOrder: 'asc' } }),
      prisma.project.findMany({ where: { published: true }, orderBy: { sortOrder: 'asc' }, take: 3 }),
      prisma.blogPost.findMany({ where: { published: true }, orderBy: { publishedAt: 'desc' }, take: 3 }),
      prisma.testimonial.findMany({ where: { published: true }, orderBy: { sortOrder: 'asc' } }),
      prisma.processStep.findMany({ orderBy: { sortOrder: 'asc' } }),
      prisma.clientLogo.findMany({ where: { published: true }, orderBy: { sortOrder: 'asc' } }),
    ]);

    const title = `Interior Design Studio in Hyderabad | ${settings.brandName}`;
    const description = clip(
      `${settings.tagline}. ${settings.brandName} designs and executes elegant residential and commercial interiors in Hyderabad — from concept to turnkey handover.`,
      160
    );

    res.render('public/home', {
      title,
      settings,
      services,
      projects,
      blogs,
      testimonials,
      processSteps,
      clientLogos,
      pageSeo: pageSeo({
        settings,
        siteUrl,
        title,
        description,
        path: '/',
        imageAlt: `${settings.brandName} modern living room interior design in Hyderabad`,
      }),
    });
  } catch (err) {
    next(err);
  }
});

router.get('/about', async (req, res, next) => {
  try {
    const siteUrl = getSiteUrl(req);
    const settings = await getSettings();
    const title = `About ${settings.brandName} | Interior Design Studio Hyderabad`;
    const description = clip(
      settings.aboutText ||
        `${settings.brandName} is a boutique interior design and turnkey execution studio based in Hyderabad.`,
      160
    );

    res.render('public/about', {
      title,
      settings,
      pageSeo: pageSeo({
        settings,
        siteUrl,
        title,
        description,
        path: '/about',
        image: '/assets/images/teak-terrazzo-logo.jpg',
        imageAlt: `${settings.brandName} interior design studio logo`,
        extraJsonLd: [
          buildBreadcrumbJsonLd(siteUrl, [
            { name: 'Home', path: '/' },
            { name: 'About', path: '/about' },
          ]),
        ],
      }),
    });
  } catch (err) {
    next(err);
  }
});

router.get('/services', async (req, res, next) => {
  try {
    const siteUrl = getSiteUrl(req);
    const [settings, services] = await Promise.all([
      getSettings(),
      prisma.service.findMany({ where: { published: true }, orderBy: { sortOrder: 'asc' } }),
    ]);
    const title = `Interior Design Services in Hyderabad | ${settings.brandName}`;
    const description = clip(
      `Explore residential and commercial interior design, space planning, furniture design, and turnkey execution by ${settings.brandName} in Hyderabad.`,
      160
    );

    res.render('public/services', {
      title,
      settings,
      services,
      pageSeo: pageSeo({
        settings,
        siteUrl,
        title,
        description,
        path: '/services',
        extraJsonLd: [
          buildBreadcrumbJsonLd(siteUrl, [
            { name: 'Home', path: '/' },
            { name: 'Services', path: '/services' },
          ]),
        ],
      }),
    });
  } catch (err) {
    next(err);
  }
});

router.get('/services/:slug', async (req, res, next) => {
  try {
    const siteUrl = getSiteUrl(req);
    const [settings, service] = await Promise.all([
      getSettings(),
      prisma.service.findUnique({ where: { slug: req.params.slug } }),
    ]);
    if (!service || !service.published) return next();
    const features = parseJsonSafe(service.body, DEFAULT_SERVICE_FEATURES);
    const title = `${service.title} | Interior Design Hyderabad | ${settings.brandName}`;
    const description = clip(
      service.summary ||
        `${service.title} by ${settings.brandName} — boutique interior design services in Hyderabad.`,
      160
    );

    res.render('public/service-single', {
      title,
      settings,
      service,
      features,
      pageSeo: pageSeo({
        settings,
        siteUrl,
        title,
        description,
        path: `/services/${service.slug}`,
        image: service.imagePath,
        imageAlt: `${service.title} — ${settings.brandName}`,
        extraJsonLd: [
          buildBreadcrumbJsonLd(siteUrl, [
            { name: 'Home', path: '/' },
            { name: 'Services', path: '/services' },
            { name: service.title, path: `/services/${service.slug}` },
          ]),
          {
            '@context': 'https://schema.org',
            '@type': 'Service',
            name: service.title,
            description,
            provider: { '@id': `${siteUrl}/#organization` },
            areaServed: 'Hyderabad',
            url: absoluteUrl(siteUrl, `/services/${service.slug}`),
            image: absoluteUrl(siteUrl, service.imagePath),
          },
        ],
      }),
    });
  } catch (err) {
    next(err);
  }
});

router.get('/portfolio', async (req, res, next) => {
  try {
    const siteUrl = getSiteUrl(req);
    const [settings, projects] = await Promise.all([
      getSettings(),
      prisma.project.findMany({ where: { published: true }, orderBy: { sortOrder: 'asc' } }),
    ]);
    const title = `Interior Design Portfolio | ${settings.brandName} Hyderabad`;
    const description = clip(
      `Browse selected residential and commercial interior projects by ${settings.brandName} in Hyderabad — thoughtful design from concept to completion.`,
      160
    );

    res.render('public/portfolio', {
      title,
      settings,
      projects,
      pageSeo: pageSeo({
        settings,
        siteUrl,
        title,
        description,
        path: '/portfolio',
        image: projects[0] ? projects[0].imagePath : defaultOgImage(settings),
        extraJsonLd: [
          buildBreadcrumbJsonLd(siteUrl, [
            { name: 'Home', path: '/' },
            { name: 'Portfolio', path: '/portfolio' },
          ]),
        ],
      }),
    });
  } catch (err) {
    next(err);
  }
});

router.get('/portfolio/:slug', async (req, res, next) => {
  try {
    const siteUrl = getSiteUrl(req);
    const [settings, project] = await Promise.all([
      getSettings(),
      prisma.project.findUnique({ where: { slug: req.params.slug } }),
    ]);
    if (!project || !project.published) return next();
    const title = `${project.title} | Interior Project | ${settings.brandName}`;
    const description = clip(
      project.overview ||
        `${project.title} — ${project.category || 'interior'} project by ${settings.brandName}${
          project.location ? ` in ${project.location}` : ' in Hyderabad'
        }.`,
      160
    );

    res.render('public/project-single', {
      title,
      settings,
      project,
      pageSeo: pageSeo({
        settings,
        siteUrl,
        title,
        description,
        path: `/portfolio/${project.slug}`,
        image: project.imagePath,
        imageAlt: `${project.title} interior design project by ${settings.brandName}`,
        extraJsonLd: [
          buildBreadcrumbJsonLd(siteUrl, [
            { name: 'Home', path: '/' },
            { name: 'Portfolio', path: '/portfolio' },
            { name: project.title, path: `/portfolio/${project.slug}` },
          ]),
          {
            '@context': 'https://schema.org',
            '@type': 'CreativeWork',
            name: project.title,
            description,
            creator: { '@id': `${siteUrl}/#organization` },
            image: absoluteUrl(siteUrl, project.imagePath),
            url: absoluteUrl(siteUrl, `/portfolio/${project.slug}`),
          },
        ],
      }),
    });
  } catch (err) {
    next(err);
  }
});

router.get('/blog', async (req, res, next) => {
  try {
    const siteUrl = getSiteUrl(req);
    const [settings, blogs] = await Promise.all([
      getSettings(),
      prisma.blogPost.findMany({ where: { published: true }, orderBy: { publishedAt: 'desc' } }),
    ]);
    const title = `Interior Design Blog & Insights | ${settings.brandName}`;
    const description = clip(
      `Design notes, material guidance, and practical interior ideas from ${settings.brandName} — Hyderabad’s boutique interior design studio.`,
      160
    );

    res.render('public/blog', {
      title,
      settings,
      blogs,
      pageSeo: pageSeo({
        settings,
        siteUrl,
        title,
        description,
        path: '/blog',
        image: blogs[0] ? blogs[0].coverPath : defaultOgImage(settings),
        extraJsonLd: [
          buildBreadcrumbJsonLd(siteUrl, [
            { name: 'Home', path: '/' },
            { name: 'Blog', path: '/blog' },
          ]),
        ],
      }),
    });
  } catch (err) {
    next(err);
  }
});

router.get('/blog/:slug', async (req, res, next) => {
  try {
    const siteUrl = getSiteUrl(req);
    const [settings, post] = await Promise.all([
      getSettings(),
      prisma.blogPost.findUnique({ where: { slug: req.params.slug } }),
    ]);
    if (!post || !post.published) return next();
    const related = await prisma.blogPost.findMany({
      where: { published: true, NOT: { id: post.id } },
      orderBy: { publishedAt: 'desc' },
      take: 3,
    });
    const sections = parseJsonSafe(post.body, DEFAULT_BLOG_SECTIONS);
    const title = `${post.title} | ${settings.brandName}`;
    const description = clip(
      post.excerpt || `${post.title} — interior design insights from ${settings.brandName}.`,
      160
    );

    res.render('public/blog-single', {
      title,
      settings,
      post,
      sections,
      related,
      pageSeo: pageSeo({
        settings,
        siteUrl,
        title,
        description,
        path: `/blog/${post.slug}`,
        image: post.coverPath,
        imageAlt: post.title,
        type: 'article',
        extraJsonLd: [
          buildBreadcrumbJsonLd(siteUrl, [
            { name: 'Home', path: '/' },
            { name: 'Blog', path: '/blog' },
            { name: post.title, path: `/blog/${post.slug}` },
          ]),
          {
            '@context': 'https://schema.org',
            '@type': 'Article',
            headline: post.title,
            description,
            image: absoluteUrl(siteUrl, post.coverPath),
            datePublished: post.publishedAt.toISOString(),
            dateModified: post.updatedAt.toISOString(),
            author: {
              '@type': 'Person',
              name: post.authorName || settings.brandName,
            },
            publisher: { '@id': `${siteUrl}/#organization` },
            mainEntityOfPage: absoluteUrl(siteUrl, `/blog/${post.slug}`),
          },
        ],
      }),
    });
  } catch (err) {
    next(err);
  }
});

router.get('/contact', async (req, res, next) => {
  try {
    const siteUrl = getSiteUrl(req);
    const settings = await getSettings();
    const title = `Contact ${settings.brandName} | Book a Consultation in Hyderabad`;
    const description = clip(
      `Book an interior design consultation with ${settings.brandName}. Call ${settings.phone} or visit our studio in Miyapur, Hyderabad.`,
      160
    );

    res.render('public/contact', {
      title,
      settings,
      pageSeo: pageSeo({
        settings,
        siteUrl,
        title,
        description,
        path: '/contact',
        extraJsonLd: [
          buildBreadcrumbJsonLd(siteUrl, [
            { name: 'Home', path: '/' },
            { name: 'Contact', path: '/contact' },
          ]),
          {
            '@context': 'https://schema.org',
            '@type': 'ContactPage',
            name: title,
            url: absoluteUrl(siteUrl, '/contact'),
            mainEntity: { '@id': `${siteUrl}/#organization` },
          },
        ],
      }),
    });
  } catch (err) {
    next(err);
  }
});

router.get('/404', async (req, res, next) => {
  try {
    const siteUrl = getSiteUrl(req);
    const settings = await getSettings();
    const title = `Page Not Found | ${settings.brandName}`;
    res.status(404).render('public/404', {
      title,
      settings,
      pageSeo: pageSeo({
        settings,
        siteUrl,
        title,
        description: `The page you requested could not be found on ${settings.brandName}.`,
        path: '/404',
        robots: 'noindex, follow',
      }),
    });
  } catch (err) {
    next(err);
  }
});

router.use(async (req, res, next) => {
  try {
    const siteUrl = getSiteUrl(req);
    const settings = await getSettings();
    const title = `Page Not Found | ${settings.brandName}`;
    res.status(404).render('public/404', {
      title,
      settings,
      pageSeo: pageSeo({
        settings,
        siteUrl,
        title,
        description: `The page you requested could not be found on ${settings.brandName}.`,
        path: req.path,
        robots: 'noindex, follow',
      }),
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
