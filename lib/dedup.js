export function normalizeCompanyName(name) {
  if (!name) return '';
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function levenshtein(a, b) {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const matrix = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      const cost = b[i - 1] === a[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }

  return matrix[b.length][a.length];
}

export function similarity(a, b) {
  const na = normalizeCompanyName(a);
  const nb = normalizeCompanyName(b);
  if (!na || !nb) return 0;
  if (na === nb) return 1;
  const maxLen = Math.max(na.length, nb.length);
  if (maxLen === 0) return 1;
  return 1 - levenshtein(na, nb) / maxLen;
}

function fieldMatches(a, b) {
  if (!a || !b) return false;
  return a.toLowerCase().trim() === b.toLowerCase().trim();
}

export function classifyMatch(importRow, existingSupplier) {
  const sim = similarity(importRow.company_name, existingSupplier.company_name);

  if (sim >= 0.95) return 'strong';

  if (sim >= 0.75) {
    const hasSecondaryMatch =
      fieldMatches(importRow.country, existingSupplier.country) ||
      fieldMatches(importRow.email, existingSupplier.email) ||
      fieldMatches(importRow.website, existingSupplier.website) ||
      fieldMatches(importRow.phone, existingSupplier.phone);

    if (hasSecondaryMatch) return 'strong';
    return 'ambiguous';
  }

  return 'none';
}

export async function findMatchesInDB(supabase, importRows) {
  const { data: existingSuppliers, error } = await supabase
    .from('suppliers')
    .select('*');

  if (error) throw new Error(`Erreur Supabase: ${error.message}`);

  const results = [];
  const seenNormalized = new Map();

  for (const row of importRows) {
    const normName = normalizeCompanyName(row.company_name);
    if (!normName) continue;

    if (seenNormalized.has(normName)) {
      results.push({
        row,
        matchType: 'batch_duplicate',
        batchIndex: seenNormalized.get(normName),
      });
      continue;
    }

    let bestMatch = null;
    let bestType = 'none';

    for (const existing of (existingSuppliers || [])) {
      const matchType = classifyMatch(row, existing);
      if (matchType === 'strong') {
        bestMatch = existing;
        bestType = 'strong';
        break;
      }
      if (matchType === 'ambiguous' && bestType !== 'ambiguous') {
        bestMatch = existing;
        bestType = 'ambiguous';
      }
    }

    const result = { row, matchType: bestType, existingSupplier: bestMatch };
    seenNormalized.set(normName, results.length);
    results.push(result);
  }

  return results;
}
