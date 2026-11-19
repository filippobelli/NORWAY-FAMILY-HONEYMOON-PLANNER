import { writeFileSync } from 'node:fs';
import { buildInternational, INTERNATIONAL_CODES } from '../../scripts/build-international';
import { seedBundle } from '../../scripts/seed-catalog';
import { createEmptyTrip } from '../../src/domain/defaults';

const bundles = Object.fromEntries(INTERNATIONAL_CODES.map((c) => [`${c}-1`, seedBundle(buildInternational(c))]));
writeFileSync(process.argv[2]!, JSON.stringify({ bundles, empty: createEmptyTrip() }));
