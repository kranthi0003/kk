const EUROPE = /\b(?:europe|united kingdom|ireland|germany|france|netherlands|belgium|luxembourg|switzerland|austria|spain|portugal|italy|denmark|sweden|norway|finland|iceland|poland|czechia|czech republic|slovakia|hungary|romania|bulgaria|greece|croatia|slovenia|estonia|latvia|lithuania|malta|cyprus|albania|andorra|bosnia|montenegro|north macedonia|serbia|moldova|ukraine|belarus|liechtenstein|monaco|san marino|kosovo|london|berlin|amsterdam|paris|dublin|stockholm|madrid|barcelona|lisbon|warsaw|prague|zurich|zürich)\b/i

export function trackingRegion(company, location) {
  if (/\bsingapore\b/i.test(location || '')) return 'Singapore'
  if (company === 'GitHub' && EUROPE.test(location || '')) return 'Europe'
  // "Remote" and "EMEA" alone do not establish eligibility in Europe.
  return ''
}
