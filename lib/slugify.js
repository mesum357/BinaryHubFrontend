function slugify(text) {
  return String(text || '')
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function uniqueSlug(base, suffix = '') {
  const s = slugify(base) + (suffix ? `-${suffix}` : '');
  return s || `item-${Date.now()}`;
}

module.exports = { slugify, uniqueSlug };
