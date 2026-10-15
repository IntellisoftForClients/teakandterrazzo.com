function getSiteUrl(req) {
  const fromEnv = String(process.env.SITE_URL || '').trim().replace(/\/$/, '');
  if (fromEnv) return fromEnv;
  const proto = String(req.get('x-forwarded-proto') || req.protocol || 'http').split(',')[0].trim();
  const host = String(req.get('x-forwarded-host') || req.get('host') || 'localhost').split(',')[0].trim();
  return `${proto}://${host}`;
}

function absoluteUrl(siteUrl, pathOrUrl) {
  if (!pathOrUrl) return siteUrl;
  const value = String(pathOrUrl);
  if (/^https?:\/\//i.test(value)) return value;
  return `${siteUrl}${value.startsWith('/') ? value : `/${value}`}`;
}

function clip(text, max = 160) {
  const cleaned = String(text || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!cleaned) return '';
  if (cleaned.length <= max) return cleaned;
  return `${cleaned.slice(0, max - 1).trimEnd()}…`;
}

function defaultOgImage(settings) {
  return '/assets/images/hero-living-room-modern.jpg';
}

function buildLocalBusinessJsonLd(settings, siteUrl) {
  const brand = settings.brandName || 'Teak & Terrazzo';
  return {
    '@context': 'https://schema.org',
    '@type': 'InteriorDesigner',
    '@id': `${siteUrl}/#organization`,
    name: brand,
    description: clip(
      settings.aboutText ||
        `${brand} is a boutique interior design and turnkey studio in Hyderabad.`,
      300
    ),
    url: siteUrl,
    email: settings.email || undefined,
    telephone: settings.phone || undefined,
    image: absoluteUrl(siteUrl, '/assets/images/teak-terrazzo-logo.jpg'),
    logo: absoluteUrl(siteUrl, '/assets/images/teak-terrazzo-icon.png'),
    address: settings.address
      ? {
          '@type': 'PostalAddress',
          streetAddress: settings.address,
          addressLocality: 'Hyderabad',
          addressRegion: 'Telangana',
          addressCountry: 'IN',
        }
      : undefined,
    areaServed: {
      '@type': 'City',
      name: 'Hyderabad',
    },
    sameAs: [settings.instagram, settings.facebook, settings.twitter, settings.linkedin].filter(
      (url) => url && url !== '#'
    ),
  };
}

function buildWebSiteJsonLd(settings, siteUrl) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${siteUrl}/#website`,
    name: settings.brandName || 'Teak & Terrazzo',
    url: siteUrl,
    publisher: { '@id': `${siteUrl}/#organization` },
  };
}

function buildBreadcrumbJsonLd(siteUrl, items) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: absoluteUrl(siteUrl, item.path),
    })),
  };
}

function xmlEscape(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

module.exports = {
  getSiteUrl,
  absoluteUrl,
  clip,
  defaultOgImage,
  buildLocalBusinessJsonLd,
  buildWebSiteJsonLd,
  buildBreadcrumbJsonLd,
  xmlEscape,
};
