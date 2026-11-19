import { writeFileSync } from 'node:fs';
import { buildInternational, buildInternationalV2, INTERNATIONAL_CODES } from '../../scripts/build-international';
import { seedBundle } from '../../scripts/seed-catalog';
import { createEmptyTrip } from '../../src/domain/defaults';
import { ADDITIONAL_CODES, ADDITIONAL_PATCH_CODES, buildAdditionalCountry, buildAdditionalCountryV2 } from '../../scripts/build-additional-countries';

const bundles = Object.fromEntries(INTERNATIONAL_CODES.flatMap((c) => [[`${c}-1`, seedBundle(buildInternational(c))], [`${c}-2`, seedBundle(buildInternationalV2(c))]]));
for (const code of ADDITIONAL_CODES) bundles[`${code}-1`] = seedBundle(buildAdditionalCountry(code));
for (const code of ADDITIONAL_PATCH_CODES) bundles[`${code}-2`] = seedBundle(buildAdditionalCountryV2(code));
writeFileSync(process.argv[2]!, JSON.stringify({ bundles, empty: createEmptyTrip() }));
