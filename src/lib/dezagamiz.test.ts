import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateFuelVolume,
  calculatePersonalCardCashback,
  canAccessApp,
  DRIVER_VIEW_ORDER,
  detectCardNetwork,
  detectClosestCity,
  DEZAGAMIZ_CARD_BIN,
  filterStationsByCity,
  formatDezagamizCardGroups,
  formatUzbekPhone,
  formatUzs,
  generateDezagamizCardNumber,
  getNextOrderStage,
  getNextThemeMode,
  maskCardNumber,
  normalizeThemeMode,
  passesLuhn,
  THEME_SWITCH_DURATION_MS,
  UZBEKISTAN_CITY_CENTERS,
  validateCardExpiry,
  validateCardNumber,
  validatePersonalCardTopUp,
  validateUzbekPhone,
  validateUzbekPlate,
  verifyCreatorCode,
} from './dezagamiz';
import {
  computeMelodyDurationSeconds,
  exportMelodyWavBytes,
  formatAudioTime,
  MELODY_SCALE_NOTES,
  midiToFreqHz,
  PRESET_MELODIES,
  sanitizeMelodyNotes,
} from './melodyEngine';
import type { DriverUser } from '../types/dezagamiz';

test('Uzbekistan phone formatting and validation', () => {
  assert.equal(formatUzbekPhone('901234567'), '+998 90 123 45 67');
  assert.equal(validateUzbekPhone('+998 90 123 45 67'), true);
  assert.equal(validateUzbekPhone('+998 90 123'), false);
  assert.equal(validateUzbekPhone('+7 900 123 45 67'), false);
});

test('Uzbekistan license plate validation', () => {
  assert.equal(validateUzbekPlate('01 A 777 AA'), true);
  assert.equal(validateUzbekPlate('10 555 SBA'), true);
  assert.equal(validateUzbekPlate('00 A 123 AA'), false);
  assert.equal(validateUzbekPlate('INVALID'), false);
});

test('Card network detection and Luhn validation for Uzcard, Humo, Visa, Mastercard', () => {
  assert.equal(detectCardNetwork('8600 0609 1234 5676'), 'Uzcard');
  assert.equal(detectCardNetwork('9860 0102 3456 7898'), 'Humo');
  assert.equal(detectCardNetwork('4111 1111 1111 1111'), 'Visa');
  assert.equal(detectCardNetwork('5500 0000 0000 0004'), 'Mastercard');

  assert.equal(validateCardNumber('8600 0609 1234 5676').valid, true);
  assert.equal(validateCardNumber('9860 0102 3456 7898').valid, true);
  // Bad Luhn checksum rejected
  assert.equal(validateCardNumber('8600 0609 1234 5670').valid, false);
  // Unsupported prefix rejected
  assert.equal(validateCardNumber('6011 0000 0000 0004').valid, false);
});

test('Card expiry and masking', () => {
  const ref = new Date('2026-11-14T00:00:00Z');
  assert.equal(validateCardExpiry('11/26', ref), true);
  assert.equal(validateCardExpiry('05/29', ref), true);
  assert.equal(validateCardExpiry('10/26', ref), false);
  assert.equal(validateCardExpiry('13/28', ref), false);
  assert.equal(maskCardNumber('8600060912345676'), '8600 •••• •••• 5676');
});

import { UZBEKISTAN_STATIONS } from '../data/stations';

test('Fuel volume and UZS formatting math', () => {
  // 115,000 UZS at 5,750 UZS/m3 = 20 m3
  assert.equal(calculateFuelVolume(115000, 5750), 20);
  assert.equal(calculateFuelVolume(100000, 5750), 17.39);
  assert.equal(calculateFuelVolume(0, 5750), 0);
  assert.equal(formatUzs(100000), '100 000 сум');
});

test('Order stage progression', () => {
  assert.equal(getNextOrderStage('paid'), 'attendant_approaching');
  assert.equal(getNextOrderStage('attendant_approaching'), 'fueling');
  assert.equal(getNextOrderStage('fueling'), 'completed');
  assert.equal(getNextOrderStage('completed'), 'completed');
});

test('Entry gate enforces both registration and at least one linked card', () => {
  const baseUser: DriverUser = {
    id: 'usr-1',
    fullName: 'Азизбек Каримов',
    phone: '+998 90 123 45 67',
    carModel: 'Chevrolet Cobalt',
    plateNumber: '01 A 777 AA',
    preferredFuel: 'metan',
    isRegistered: true,
    cards: [],
    createdAt: '2026-11-14T00:00:00Z',
  };

  assert.equal(canAccessApp(null), false);
  assert.equal(canAccessApp(baseUser), false);

  const verifiedUser: DriverUser = {
    ...baseUser,
    cards: [
      {
        id: 'card-1',
        network: 'Uzcard',
        maskedNumber: '8600 •••• •••• 5676',
        last4: '5676',
        expiry: '08/29',
        holderName: 'AZIZBEK KARIMOV',
        isDefault: true,
        addedAt: '2026-11-14T00:00:00Z',
      },
    ],
  };

  assert.equal(canAccessApp(verifiedUser), true);
  assert.equal(canAccessApp({ ...verifiedUser, isRegistered: false }), false);
});

test('Creator access code verification strictly requires MorzhowichKittisiwich88', () => {
  assert.equal(verifyCreatorCode('MorzhowichKittisiwich88'), true);
  assert.equal(verifyCreatorCode(' MorzhowichKittisiwich88 '), true);
  assert.equal(verifyCreatorCode('Morzhowich88'), false);
  assert.equal(verifyCreatorCode('morzhowichkittisiwich88'), false);
  assert.equal(verifyCreatorCode('Morzhowich'), false);
  assert.equal(verifyCreatorCode(''), false);
});

import {
  buildGoogleMapsDirectionsUrl,
  classifyNearbyPlaceCategory,
  computeBayDisplayCode,
  computeGuestExpiresAt,
  findNearestStationForFuel,
  formatCoordinates,
  formatDistanceShort,
  formatGuestRemaining,
  formatRouteDuration,
  getDriverVehicles,
  getGuestRemainingMs,
  getIndexedSlideDirection,
  getPageSlideDirection,
  getVehicleFuelProfile,
  GATE_MODE_ORDER,
  GUEST_DURATION_MS,
  GUEST_MAX_DAYS,
  haversineDistanceKm,
  isGuestExpired,
  rankStationsByProximity,
  shouldRefreshOrigin,
  stationSupportsFuel,
} from './dezagamiz';
import {
  formatLocalizedCurrency,
  formatLocalizedDistance,
  localizePresetTrackText,
  SUPPORTED_LANGUAGES,
  translateAttendantName,
  translateCarModel,
  translateCityName,
  translatePersonName,
  translateShiftBadge,
  translateStationAddress,
  translateStationName,
  TRANSLATIONS,
} from './i18n';

test('Uzbekistan station fuel prices reflect accurate market ranges', () => {
  for (const station of UZBEKISTAN_STATIONS) {
    if (station.prices.metan !== undefined) {
      assert.ok(station.prices.metan >= 5500 && station.prices.metan <= 6200);
    }
    if (station.prices.propan !== undefined) {
      assert.ok(station.prices.propan >= 8200 && station.prices.propan <= 10500);
    }
    if (station.prices.ai92 !== undefined) {
      assert.ok(station.prices.ai92 >= 11500 && station.prices.ai92 <= 15500);
    }
    if (station.prices.ai95 !== undefined) {
      assert.ok(station.prices.ai95 >= 16800 && station.prices.ai95 <= 20000);
    }
  }
});

test('Guest mode is strictly capped at 3 days (72 hours) and expires at or after 3 days', () => {
  assert.equal(GUEST_MAX_DAYS, 3);
  assert.equal(GUEST_DURATION_MS, 3 * 24 * 60 * 60 * 1000);

  const startMs = Date.parse('2026-11-15T00:00:00Z');
  const expiresIso = computeGuestExpiresAt(startMs);
  assert.equal(expiresIso, '2026-11-18T00:00:00.000Z');

  // Active within 3 days
  assert.equal(isGuestExpired(expiresIso, startMs + 1000), false);
  assert.equal(
    isGuestExpired(expiresIso, startMs + GUEST_DURATION_MS - 1000),
    false,
  );
  // Strictly expired at 3 days and beyond 3 days
  assert.equal(isGuestExpired(expiresIso, startMs + GUEST_DURATION_MS), true);
  assert.equal(
    isGuestExpired(expiresIso, startMs + GUEST_DURATION_MS + 60000),
    true,
  );

  // Remaining time never exceeds 3 days even if expiry were tampered forward
  const futureTampered = new Date(startMs + 10 * 24 * 60 * 60 * 1000).toISOString();
  assert.equal(getGuestRemainingMs(futureTampered, startMs), GUEST_DURATION_MS);

  assert.match(formatGuestRemaining(expiresIso, 'ru', startMs + 60 * 60 * 1000), /2 дн\. 23 ч\./);
  assert.match(formatGuestRemaining(expiresIso, 'uz', startMs + 60 * 60 * 1000), /2 kun 23 soat/);
  assert.match(formatGuestRemaining(expiresIso, 'en', startMs + 60 * 60 * 1000), /2 d 23 h/);
});

test('Multi-language translations cover ru, uz, en, kk, tr completely', () => {
  assert.equal(SUPPORTED_LANGUAGES.length, 5);
  for (const lang of SUPPORTED_LANGUAGES) {
    const bundle = TRANSLATIONS[lang.code];
    assert.ok(bundle, `Missing bundle for ${lang.code}`);
    assert.ok(bundle.heroTitle.length > 5);
    assert.ok(bundle.guestStartButton.length > 3);
    assert.ok(bundle.payFromCarBtn.length > 3);
    assert.ok(bundle.enterAppBtn.length > 3);
    assert.ok(bundle.loadingReadySubtitle.length > 5);
  }
});

test('Haversine distance and fuel-filtered nearest station selection work accurately', () => {
  const origin = { lat: 41.22, lng: 69.21 };
  assert.equal(haversineDistanceKm(origin, origin), 0);

  // Synthetic test stations with distinct fuel support and coordinates
  const sampleStations = UZBEKISTAN_STATIONS.slice(0, 3).map((s, idx) => {
    const coords = [
      { lat: 41.285, lng: 69.205 }, // Chilonzor (~7.2 km from origin)
      { lat: 41.365, lng: 69.285 }, // Yunusobod (~17.3 km from origin)
      { lat: 41.225, lng: 69.215 }, // Sergeli (~0.7 km from origin, NO ai95)
    ][idx];
    return { ...s, ...coords };
  });

  // Sergeli supports propan & metan, not ai95
  assert.equal(stationSupportsFuel(sampleStations[2], 'propan', true), true);
  assert.equal(stationSupportsFuel(sampleStations[2], 'ai95', false), false);

  // Nearest propane station from origin should be Sergeli
  const nearestPropan = findNearestStationForFuel(origin, sampleStations, 'propan');
  assert.ok(nearestPropan);
  assert.equal(nearestPropan.id, 'st-tashkent-sergeli');
  assert.ok((nearestPropan.straightDistanceKm ?? 99) < 2);

  // Nearest AI-95 station from same origin skips Sergeli and selects Chilonzor
  const nearestAi95 = findNearestStationForFuel(origin, sampleStations, 'ai95');
  assert.ok(nearestAi95);
  assert.equal(nearestAi95.id, 'st-tashkent-chilonzor');

  // Ranking lists matching stations sorted nearest-first before non-matching stations
  const rankedAi95 = rankStationsByProximity(origin, sampleStations, 'ai95');
  assert.equal(rankedAi95[0].id, 'st-tashkent-chilonzor');
  assert.equal(rankedAi95[1].id, 'st-tashkent-yunusobod');
  assert.equal(rankedAi95[2].id, 'st-tashkent-sergeli');
  assert.equal(rankedAi95[2].supportsSelectedFuel, false);

  assert.equal(formatCoordinates(41.2858312, 69.2036149), '41.285831, 69.203615');
  assert.equal(formatCoordinates(undefined, 69.2), '—');
  assert.equal(formatRouteDuration(14 * 60000, 'ru'), '14 мин');
  assert.equal(formatRouteDuration(75 * 60000, 'uz'), '1 soat 15 daq');
  const mapsUrl = buildGoogleMapsDirectionsUrl(origin, { lat: 41.285, lng: 69.205 });
  assert.match(mapsUrl, /https:\/\/www\.google\.com\/maps\/dir\/\?/);
  assert.match(mapsUrl, /destination=41\.285%2C69\.205/);
});

test('getDriverVehicles returns legacy primary car or multi-car garage with active default', () => {
  const legacyUser: DriverUser = {
    id: 'usr-legacy',
    fullName: 'Отабек Мирзаев',
    phone: '+998 90 555 11 22',
    carModel: 'Chevrolet Onix',
    plateNumber: '01 C 404 AB',
    preferredFuel: 'ai92',
    isRegistered: true,
    cards: [],
    createdAt: '2026-11-14T00:00:00Z',
  };

  const fallbackVehicles = getDriverVehicles(legacyUser);
  assert.equal(fallbackVehicles.length, 1);
  assert.equal(fallbackVehicles[0].carModel, 'Chevrolet Onix');
  assert.equal(fallbackVehicles[0].isDefault, true);

  const garageUser: DriverUser = {
    ...legacyUser,
    vehicles: [
      {
        id: 'v-1',
        carModel: 'Chevrolet Onix',
        plateNumber: '01 C 404 AB',
        preferredFuel: 'ai92',
        isDefault: false,
        addedAt: '2026-11-14T00:00:00Z',
      },
      {
        id: 'v-2',
        carModel: 'BYD Song Plus',
        plateNumber: '01 B 909 AA',
        preferredFuel: 'propan',
        isDefault: true,
        addedAt: '2026-11-15T00:00:00Z',
      },
    ],
  };

  const multi = getDriverVehicles(garageUser);
  assert.equal(multi.length, 2);
  assert.equal(multi.find((v) => v.isDefault)?.id, 'v-2');

  const noDefaultUser: DriverUser = {
    ...legacyUser,
    vehicles: multi.map((v) => ({ ...v, isDefault: false })),
  };
  assert.equal(getDriverVehicles(noDefaultUser)[0].isDefault, true);
});

test('Nearby places categorization, short distance formatting, and GPS refresh threshold', () => {
  assert.equal(formatDistanceShort(0.35, 'ru'), '350 м');
  assert.equal(formatDistanceShort(0.002, 'ru'), '10 м');
  assert.equal(formatDistanceShort(1.84, 'ru'), '1.8 км');
  assert.equal(formatDistanceShort(1.84, 'en'), '1.8 km');
  assert.equal(formatDistanceShort(null, 'ru'), '—');

  assert.equal(classifyNearbyPlaceCategory('gas_station', []), 'gas_station');
  assert.equal(classifyNearbyPlaceCategory('restaurant', ['food']), 'cafe');
  assert.equal(classifyNearbyPlaceCategory('coffee_shop', []), 'cafe');
  assert.equal(classifyNearbyPlaceCategory('supermarket', []), 'store');
  assert.equal(classifyNearbyPlaceCategory('pharmacy', []), 'store');
  assert.equal(classifyNearbyPlaceCategory('car_wash', []), 'service');
  assert.equal(classifyNearbyPlaceCategory('car_repair', []), 'service');
  assert.equal(classifyNearbyPlaceCategory('park', ['tourist_attraction']), 'other');

  const basePoint = { lat: 41.2995, lng: 69.2401 };
  // ~20m shift should NOT trigger a 60m refresh
  const smallShift = { lat: 41.29965, lng: 69.2402 };
  // ~150m shift SHOULD trigger a 60m refresh, NOT a 250m refresh
  const mediumShift = { lat: 41.30085, lng: 69.2401 };
  // ~400m shift SHOULD trigger a 250m refresh
  const largeShift = { lat: 41.3032, lng: 69.2401 };

  assert.equal(shouldRefreshOrigin(null, basePoint, 60), true);
  assert.equal(shouldRefreshOrigin(basePoint, smallShift, 60), false);
  assert.equal(shouldRefreshOrigin(basePoint, mediumShift, 60), true);
  assert.equal(shouldRefreshOrigin(basePoint, mediumShift, 250), false);
  assert.equal(shouldRefreshOrigin(basePoint, largeShift, 250), true);
});

test('Personal dezagamiz card number generation, cashback tiers, and top-up validation', () => {
  const deterministic = generateDezagamizCardNumber('12345678901');
  assert.equal(deterministic.length, 16);
  assert.ok(deterministic.startsWith(DEZAGAMIZ_CARD_BIN));
  assert.equal(passesLuhn(deterministic), true);
  assert.equal(
    formatDezagamizCardGroups(deterministic),
    `${deterministic.slice(0, 4)} ${deterministic.slice(4, 8)} ${deterministic.slice(8, 12)} ${deterministic.slice(12, 16)}`,
  );

  // Random generation also always passes Luhn
  for (let i = 0; i < 5; i++) {
    const pan = generateDezagamizCardNumber();
    assert.ok(pan.startsWith('7788'));
    assert.equal(passesLuhn(pan), true);
  }

  // Cashback: Standard 3%, Prime 5%
  assert.equal(calculatePersonalCardCashback(100000, 'standard'), 3000);
  assert.equal(calculatePersonalCardCashback(100000, 'prime'), 5000);
  assert.equal(calculatePersonalCardCashback(0, 'prime'), 0);

  // Top-up bounds: 10 000 .. 5 000 000 UZS
  assert.equal(validatePersonalCardTopUp(5000).valid, false);
  assert.equal(validatePersonalCardTopUp(10000).valid, true);
  assert.equal(validatePersonalCardTopUp(250000).valid, true);
  assert.equal(validatePersonalCardTopUp(5000001).valid, false);
});

test('Theme mode normalization, toggle transitions, and multilingual theme labels', () => {
  assert.equal(normalizeThemeMode(null), 'light');
  assert.equal(normalizeThemeMode('light'), 'light');
  assert.equal(normalizeThemeMode('dark'), 'dark');
  assert.equal(normalizeThemeMode('unexpected'), 'light');

  assert.equal(getNextThemeMode('light'), 'dark');
  assert.equal(getNextThemeMode('dark'), 'light');
  assert.ok(THEME_SWITCH_DURATION_MS >= 200 && THEME_SWITCH_DURATION_MS <= 600);

  for (const lang of SUPPORTED_LANGUAGES) {
    const bundle = TRANSLATIONS[lang.code];
    assert.ok(bundle.themeLight.length > 1);
    assert.ok(bundle.themeDark.length > 1);
    assert.ok(bundle.themeSwitchAria.length > 5);
  }
});

test('Directional page slide transitions return forward left-bound or backward right-bound motion', () => {
  assert.equal(getPageSlideDirection('fuel', 'stations', false), 'forward');
  assert.equal(getPageSlideDirection('fuel', 'profile', false), 'forward');
  assert.equal(getPageSlideDirection('stations', 'creator', false), 'forward');
  assert.equal(getPageSlideDirection('profile', 'fuel', false), 'backward');
  assert.equal(getPageSlideDirection('history', 'stations', false), 'backward');
  assert.equal(getPageSlideDirection('creator', 'stations', true), 'forward');
  assert.equal(getPageSlideDirection('stations', 'creator', true), 'backward');

  assert.equal(getIndexedSlideDirection(GATE_MODE_ORDER, 'register', 'guest'), 'forward');
  assert.equal(getIndexedSlideDirection(GATE_MODE_ORDER, 'creator', 'login'), 'backward');
});

test('City center coordinates, closest city detection, and city filtering work accurately', () => {
  assert.equal(detectClosestCity({ lat: 41.31, lng: 69.28 }), 'Ташкент');
  assert.equal(detectClosestCity({ lat: 39.65, lng: 66.96 }), 'Самарканд');
  assert.equal(detectClosestCity({ lat: 39.77, lng: 64.43 }), 'Бухара');
  assert.equal(detectClosestCity({ lat: 40.38, lng: 71.78 }), 'Фергана');

  assert.ok(UZBEKISTAN_CITY_CENTERS['Самарканд'].lat > 39);
  assert.equal(filterStationsByCity(UZBEKISTAN_STATIONS, 'all').length, UZBEKISTAN_STATIONS.length);
  const samarkandOnly = filterStationsByCity(UZBEKISTAN_STATIONS, 'Самарканд');
  assert.ok(samarkandOnly.length >= 1);
  assert.ok(samarkandOnly.every((s) => s.city === 'Самарканд'));

  // Even before Google Places resolves exact street coords, Bukhara GPS ranks Bukhara station #1
  const bukharaNearest = findNearestStationForFuel(
    { lat: 39.7747, lng: 64.4286 },
    UZBEKISTAN_STATIONS,
    'all',
  );
  assert.equal(bukharaNearest?.id, 'st-bukhara-center');
});

import {
  accuracyMetersToPixels,
  buildGoogleMapsStreetViewUrl,
  clampPitchDegrees,
  computeBearingDegrees,
  computeFitBoundsViewport,
  computePegmanTiltDegrees,
  decodeEncodedPolyline,
  findNearestSnapStation,
  formatLocationAge,
  formatSpeedKmh,
  getCompassDirectionLabel,
  latLngToWorldPoint,
  normalizeHeadingDegrees,
  pixelOffsetToLatLng,
  worldPointToLatLng,
} from './dezagamiz';

test('Web Mercator projection round-trips coordinates and fits viewport bounds', () => {
  const tashkent = { lat: 41.3111, lng: 69.2797 };
  const world = latLngToWorldPoint(tashkent.lat, tashkent.lng, 12);
  const back = worldPointToLatLng(world.x, world.y, 12);
  assert.ok(Math.abs(back.lat - tashkent.lat) < 1e-6);
  assert.ok(Math.abs(back.lng - tashkent.lng) < 1e-6);

  const fitNearby = computeFitBoundsViewport(
    [
      { lat: 41.3111, lng: 69.2797 },
      { lat: 41.285, lng: 69.205 },
    ],
    640,
    400,
  );
  assert.ok(fitNearby.zoom >= 11 && fitNearby.zoom <= 14);
  assert.ok(fitNearby.lat > 41.28 && fitNearby.lat < 41.32);

  const fitCountry = computeFitBoundsViewport(
    [
      { lat: 41.3111, lng: 69.2797 },
      { lat: 39.7747, lng: 64.4286 },
    ],
    640,
    400,
  );
  assert.ok(fitCountry.zoom < fitNearby.zoom);
});

test('decodeEncodedPolyline decodes standard Google polyline strings accurately', () => {
  const decoded = decodeEncodedPolyline('_p~iF~ps|U_ulLnnqC_mqNvxq`@');
  assert.equal(decoded.length, 3);
  assert.ok(Math.abs(decoded[0].lat - 38.5) < 1e-4);
  assert.ok(Math.abs(decoded[0].lng - -120.2) < 1e-4);
  assert.ok(Math.abs(decoded[1].lat - 40.7) < 1e-4);
  assert.ok(Math.abs(decoded[1].lng - -120.95) < 1e-4);
  assert.ok(Math.abs(decoded[2].lat - 43.252) < 1e-4);
  assert.ok(Math.abs(decoded[2].lng - -126.453) < 1e-4);
  assert.deepEqual(decodeEncodedPolyline(''), []);
});

test('360° panorama heading, pitch, bearing, compass labels, and Street View URLs work accurately', () => {
  assert.equal(normalizeHeadingDegrees(365), 5);
  assert.equal(normalizeHeadingDegrees(-45), 315);
  assert.equal(normalizeHeadingDegrees(720), 0);
  assert.equal(normalizeHeadingDegrees(Number.NaN), 0);

  assert.equal(clampPitchDegrees(100), 65);
  assert.equal(clampPitchDegrees(-80), -45);
  assert.equal(clampPitchDegrees(12.34), 12.3);

  // Bearing north (~0°), east (~90°), south (~180°), west (~270°)
  const tashkent = { lat: 41.3111, lng: 69.2797 };
  assert.ok(computeBearingDegrees(tashkent, { lat: 41.4, lng: 69.2797 }) < 5);
  const east = computeBearingDegrees(tashkent, { lat: 41.3111, lng: 69.4 });
  assert.ok(east > 85 && east < 95);
  const south = computeBearingDegrees(tashkent, { lat: 41.2, lng: 69.2797 });
  assert.ok(south > 175 && south < 185);
  const west = computeBearingDegrees(tashkent, { lat: 41.3111, lng: 69.15 });
  assert.ok(west > 265 && west < 275);

  assert.equal(getCompassDirectionLabel(0, 'ru'), 'С');
  assert.equal(getCompassDirectionLabel(90, 'ru'), 'В');
  assert.equal(getCompassDirectionLabel(225, 'en'), 'SW');
  assert.equal(getCompassDirectionLabel(180, 'uz'), 'J');

  const svUrl = buildGoogleMapsStreetViewUrl(tashkent, 405);
  assert.match(svUrl, /https:\/\/www\.google\.com\/maps\/@\?/);
  assert.match(svUrl, /map_action=pano/);
  assert.match(svUrl, /viewpoint=41\.3111%2C69\.2797/);
  assert.match(svUrl, /heading=45/);

  for (const lang of SUPPORTED_LANGUAGES) {
    const bundle = TRANSLATIONS[lang.code];
    assert.ok(bundle.mapLayerRoadmap.length > 1);
    assert.ok(bundle.mapLayerSatellite.length > 1);
    assert.ok(bundle.mapSatelliteLabels.length > 1);
    assert.ok(bundle.mapView360Btn.length > 2);
    assert.ok(bundle.mapExit360Btn.length > 2);
    assert.ok(bundle.streetViewOpenExternal.length > 3);
    assert.ok(bundle.streetViewDragHint.length > 3);
    assert.ok(bundle.streetViewSatelliteOrbitLabel.length > 3);
    assert.ok(bundle.streetViewStreetModeLabel.length > 3);
    assert.ok(bundle.streetViewUnavailableHint.length > 5);
    assert.ok(bundle.streetViewLoading.length > 3);
    assert.ok(bundle.pegmanAriaLabel.length > 5);
    assert.ok(bundle.pegmanDragTooltip.length > 5);
    assert.ok(bundle.pegmanDropAction.length > 5);
    assert.ok(bundle.pegmanDroppedPointLabel.length > 5);
  }
});

test('Pegman pixel-to-coordinate drop projection, swing tilt, and station snap work accurately', () => {
  const center = { lat: 41.3111, lng: 69.2797 };
  const exactCenter = pixelOffsetToLatLng(center.lat, center.lng, 12, 0, 0);
  assert.ok(Math.abs(exactCenter.lat - center.lat) < 1e-6);
  assert.ok(Math.abs(exactCenter.lng - center.lng) < 1e-6);

  const eastPoint = pixelOffsetToLatLng(center.lat, center.lng, 12, 120, 0);
  assert.ok(eastPoint.lng > center.lng);
  const northPoint = pixelOffsetToLatLng(center.lat, center.lng, 12, 0, -120);
  assert.ok(northPoint.lat > center.lat);

  assert.equal(computePegmanTiltDegrees(0), 0);
  assert.equal(computePegmanTiltDegrees(100), 24);
  assert.equal(computePegmanTiltDegrees(-100), -24);
  assert.equal(computePegmanTiltDegrees(Number.NaN), 0);

  const mockStations = [
    { id: 's1', name: 'Center Station', lat: 41.3111, lng: 69.2797 },
    { id: 's2', name: 'Far Station', lat: 41.201, lng: 69.15 },
  ];
  // Viewport 600x400 centered on s1 -> s1 pin center sits at (300, 186)
  const snapped = findNearestSnapStation(310, 190, 41.3111, 69.2797, 12, 600, 400, mockStations, 44);
  assert.equal(snapped?.id, 's1');

  const miss = findNearestSnapStation(50, 50, 41.3111, 69.2797, 12, 600, 400, mockStations, 44);
  assert.equal(miss, null);
});

test('Real-time GPS telemetry helpers (age, speed, accuracy circle scaling) and translations work accurately', () => {
  const baseNow = 1_760_000_000_000;
  assert.equal(formatLocationAge(undefined, baseNow, 'ru'), '—');
  assert.equal(formatLocationAge(baseNow - 2000, baseNow, 'ru'), 'только что');
  assert.equal(formatLocationAge(baseNow - 2000, baseNow, 'en'), 'just now');
  assert.equal(formatLocationAge(baseNow - 18_000, baseNow, 'ru'), '18 с назад');
  assert.equal(formatLocationAge(baseNow - 125_000, baseNow, 'uz'), '2 daq oldin');
  assert.equal(formatLocationAge(baseNow - 7_200_000, baseNow, 'tr'), '2 sa önce');

  assert.equal(formatSpeedKmh(null, 'ru'), null);
  assert.equal(formatSpeedKmh(-1, 'ru'), null);
  assert.equal(formatSpeedKmh(10, 'ru'), '36 км/ч');
  assert.equal(formatSpeedKmh(10, 'uz'), '36 km/soat');
  assert.equal(formatSpeedKmh(10, 'en'), '36 km/h');

  assert.equal(accuracyMetersToPixels(undefined, 41.3, 14), 0);
  assert.equal(accuracyMetersToPixels(0, 41.3, 14), 0);
  const px14 = accuracyMetersToPixels(100, 41.3111, 14);
  const px15 = accuracyMetersToPixels(100, 41.3111, 15);
  assert.ok(px14 > 5 && px14 < 30);
  assert.ok(Math.abs(px15 - px14 * 2) < 0.5);
  assert.equal(accuracyMetersToPixels(500000, 41.3111, 17), 400);

  for (const lang of SUPPORTED_LANGUAGES) {
    const bundle = TRANSLATIONS[lang.code];
    assert.ok(bundle.gpsSignalTimeout.length > 5);
    assert.ok(bundle.gpsSignalUnavailable.length > 5);
    assert.ok(bundle.mapFollowDriverBtn.length > 2);
    assert.ok(bundle.mapFollowingDriver.length > 2);
    assert.ok(bundle.liveTelemetryUpdated.length > 2);
  }
});

test('Personal melody engine math, sanitization, WAV export, and presets work properly', () => {
  assert.ok(PRESET_MELODIES.length >= 3);
  assert.equal(MELODY_SCALE_NOTES.length, 6);
  assert.ok(Math.abs(midiToFreqHz(69) - 440) < 0.01);
  assert.ok(Math.abs(midiToFreqHz(60) - 261.63) < 0.05);

  const sanitized = sanitizeMelodyNotes([
    { freqHz: 440, offsetBeats: 0, durationBeats: 1, velocity: 0.8 },
    { freqHz: 10, offsetBeats: -2, durationBeats: 0.01, velocity: 4 },
    { freqHz: Number.NaN, offsetBeats: 1, durationBeats: 1 },
  ]);
  assert.equal(sanitized.length, 2);
  assert.equal(sanitized[0].offsetBeats, 0);
  assert.ok(sanitized[1].freqHz >= 65);
  assert.ok(sanitized[1].durationBeats >= 0.125);
  assert.ok(sanitized[1].velocity! <= 1);

  const dur = computeMelodyDurationSeconds(sanitized, 120);
  assert.ok(dur > 0.5 && dur <= 30);

  assert.equal(formatAudioTime(0), '0:00');
  assert.equal(formatAudioTime(65), '1:05');

  const wavBytes = exportMelodyWavBytes(PRESET_MELODIES[0]);
  assert.ok(wavBytes.byteLength > 100);
  // Check RIFF / WAVE header signatures
  assert.equal(wavBytes[0], 82); // R
  assert.equal(wavBytes[1], 73); // I
  assert.equal(wavBytes[2], 70); // F
  assert.equal(wavBytes[3], 70); // F
  assert.equal(wavBytes[8], 87); // W
  assert.equal(wavBytes[9], 65); // A
  assert.equal(wavBytes[10], 86); // V
  assert.equal(wavBytes[11], 69); // E
});

test('Driver navigation includes assistant, theme transition duration is tuned, and assistant/music translations exist across all languages', () => {
  assert.ok(DRIVER_VIEW_ORDER.includes('assistant'));
  assert.ok(THEME_SWITCH_DURATION_MS >= 450 && THEME_SWITCH_DURATION_MS <= 700);

  for (const lang of SUPPORTED_LANGUAGES) {
    const bundle = TRANSLATIONS[lang.code];
    assert.ok(bundle.navAssistant.length > 2);
    assert.ok(bundle.assistantTitle.length > 4);
    assert.ok(bundle.assistantSendBtn.length > 2);
    assert.ok(bundle.musicStudioTitle.length > 4);
    assert.ok(bundle.musicComposeBtn.length > 4);
    assert.ok(bundle.musicUploadBtn.length > 4);
    assert.ok(bundle.musicSaveCustomBtn.length > 4);
  }
});

test('Complete 5-language localization parity, city/district names, units, and preset tracks work across ru/uz/en/kk/tr', () => {
  const baseKeys = Object.keys(TRANSLATIONS.ru).sort();
  assert.ok(baseKeys.length > 300);

  for (const lang of SUPPORTED_LANGUAGES) {
    const bundle = TRANSLATIONS[lang.code];
    const keys = Object.keys(bundle).sort();
    assert.deepEqual(
      keys,
      baseKeys,
      `Language "${lang.code}" must match exact key set of RU`,
    );
    for (const key of keys) {
      const val = bundle[key as keyof typeof bundle];
      assert.equal(typeof val, 'string', `${lang.code}.${key} must be a string`);
      assert.ok(val.trim().length > 0, `${lang.code}.${key} must not be empty`);
    }
  }

  const expectedPlaces = [
    'Ташкент',
    'Самарканд',
    'Бухара',
    'Фергана',
    'Ташкент · Центр',
    'Чиланзар',
    'Юнусабад',
    'Сергели',
  ];
  for (const place of expectedPlaces) {
    assert.equal(translateCityName(place, 'ru'), place);
    assert.notEqual(translateCityName(place, 'en'), place);
    assert.notEqual(translateCityName(place, 'uz'), place);
  }

  assert.match(formatLocalizedCurrency(12500, 'ru'), /сум/);
  assert.match(formatLocalizedCurrency(12500, 'uz'), /so'm/);
  assert.match(formatLocalizedCurrency(12500, 'en'), /UZS/);
  assert.match(formatLocalizedCurrency(12500, 'kk'), /сум/);
  assert.match(formatLocalizedCurrency(12500, 'tr'), /som/);

  assert.match(formatLocalizedDistance(3.4, 'ru'), /км/);
  assert.match(formatLocalizedDistance(3.4, 'uz'), /km/);
  assert.match(formatLocalizedDistance(3.4, 'en'), /km/);
  assert.match(formatLocalizedDistance(3.4, 'kk'), /км/);
  assert.match(formatLocalizedDistance(3.4, 'tr'), /km/);

  const firstPreset = PRESET_MELODIES[0];
  const enTrack = localizePresetTrackText(firstPreset, 'en');
  const uzTrack = localizePresetTrackText(firstPreset, 'uz');
  const ruTrack = localizePresetTrackText(firstPreset, 'ru');
  assert.notEqual(enTrack.title, ruTrack.title);
  assert.notEqual(uzTrack.title, ruTrack.title);
});

test('All station names, addresses, attendants, shift badges, person names, and guest car tags translate across all 5 languages', () => {
  for (const station of UZBEKISTAN_STATIONS) {
    const ruName = translateStationName(station.id, 'ru', station.name);
    const uzName = translateStationName(station.id, 'uz', station.name);
    const enName = translateStationName(station.id, 'en', station.name);
    const kkName = translateStationName(station.id, 'kk', station.name);
    const trName = translateStationName(station.id, 'tr', station.name);
    assert.equal(ruName, station.name);
    assert.notEqual(uzName, ruName);
    assert.notEqual(enName, ruName);
    assert.ok(kkName.length > 5 && trName.length > 5);

    const ruAddr = translateStationAddress(station.id, 'ru', station.address);
    const enAddr = translateStationAddress(station.id, 'en', station.address);
    const uzAddr = translateStationAddress(station.id, 'uz', station.address);
    const kkAddr = translateStationAddress(station.id, 'kk', station.address);
    const trAddr = translateStationAddress(station.id, 'tr', station.address);
    assert.equal(ruAddr, station.address);
    assert.notEqual(enAddr, ruAddr);
    assert.notEqual(uzAddr, ruAddr);
    assert.ok(kkAddr.length > 5 && trAddr.length > 5);

    for (const att of station.attendants) {
      assert.equal(translateAttendantName(att.id, 'ru', att.name), att.name);
      assert.notEqual(translateAttendantName(att.id, 'en', att.name), att.name);
      assert.notEqual(translateAttendantName(att.id, 'uz', att.name), att.name);
      assert.ok(translateAttendantName(att.id, 'tr', att.name).length > 3);

      assert.equal(translateShiftBadge(att.id, 'ru', att.shiftBadge), att.shiftBadge);
      assert.notEqual(translateShiftBadge(att.id, 'en', att.shiftBadge), att.shiftBadge);
      assert.notEqual(translateShiftBadge(att.id, 'uz', att.shiftBadge), att.shiftBadge);
      assert.notEqual(translateShiftBadge(att.id, 'tr', att.shiftBadge), att.shiftBadge);
    }
  }

  assert.equal(translatePersonName('Гость dezagamiz', 'ru'), 'Гость dezagamiz');
  assert.equal(translatePersonName('Гость dezagamiz', 'en'), 'dezagamiz Guest');
  assert.equal(translatePersonName('Гость dezagamiz', 'uz'), 'dezagamiz mehmoni');
  assert.equal(translatePersonName('Гость dezagamiz', 'kk'), 'dezagamiz қонағы');
  assert.equal(translatePersonName('Гость dezagamiz', 'tr'), 'dezagamiz Misafiri');

  assert.equal(translatePersonName('Азизбек Каримов', 'en'), 'Azizbek Karimov');
  assert.equal(translatePersonName('Азизбек Каримов', 'kk'), 'Әзізбек Кәрімов');
  // Transliteration fallback for arbitrary Cyrillic driver name in Latin UI languages
  assert.equal(translatePersonName('Отабек Мирзаев', 'en'), 'Otabek Mirzaev');

  assert.equal(translateCarModel('Chevrolet Cobalt (Гость)', 'ru'), 'Chevrolet Cobalt (Гость)');
  assert.equal(translateCarModel('Chevrolet Cobalt (Гость)', 'en'), 'Chevrolet Cobalt (Guest)');
  assert.equal(translateCarModel('Chevrolet Cobalt (Гость)', 'uz'), 'Chevrolet Cobalt (Mehmon)');
  assert.equal(translateCarModel('Chevrolet Cobalt (Гость)', 'kk'), 'Chevrolet Cobalt (Қонақ)');
  assert.equal(translateCarModel('Chevrolet Cobalt (Гость)', 'tr'), 'Chevrolet Cobalt (Misafir)');
});

import {
  calculateFamilyFuelSavings,
  calculateSimpleStationRevenue,
  getShowcaseContent,
} from './showcaseData';

test('Showcase presentation content, calculators, view order, and 4th upgraded melody preset work across all 5 languages', () => {
  assert.ok(DRIVER_VIEW_ORDER.includes('showcase'));
  assert.equal(PRESET_MELODIES.length, 4);
  assert.ok((PRESET_MELODIES[0].notes?.length ?? 0) >= 24);

  const silkDrive = PRESET_MELODIES[3];
  assert.equal(silkDrive.id, 'preset-silk-road-drive');
  for (const lang of SUPPORTED_LANGUAGES) {
    const loc = localizePresetTrackText(silkDrive, lang.code);
    assert.ok(loc.title.length > 4);
    assert.ok(loc.subtitle.length > 6);
  }

  const family = calculateFamilyFuelSavings({
    monthlyKm: 1500,
    consumptionLPer100Km: 10,
  });
  assert.ok(family.monthlyPetrolCostUzs > family.monthlyMetanCostUzs);
  assert.ok(family.monthlySavingsUzs > 0);
  assert.equal(family.yearlySavingsUzs, family.monthlySavingsUzs * 12);
  assert.ok(family.totalYearlyBenefitUzs > family.yearlySavingsUzs);
  assert.ok(family.yearlyCo2SavedKg > 0);
  assert.ok(family.yearlyQueueMinutesSaved > 0);

  const zeroKm = calculateFamilyFuelSavings({
    monthlyKm: -100,
    consumptionLPer100Km: 10,
  });
  assert.equal(zeroKm.monthlyKm, 0);
  assert.equal(zeroKm.monthlySavingsUzs, 0);

  const revenue = calculateSimpleStationRevenue({
    partnerStations: 5,
    carsPerStationPerDay: 40,
  });
  assert.equal(revenue.monthlyOrders, 6000);
  assert.ok(revenue.subscriptionIncomeUzs > 0);
  assert.ok(revenue.partnerFeeIncomeUzs > 0);
  assert.ok(revenue.sponsorMapIncomeUzs > 0);
  assert.equal(revenue.yearlyTotalUzs, revenue.monthlyTotalUzs * 12);

  for (const lang of SUPPORTED_LANGUAGES) {
    const content = getShowcaseContent(lang.code);
    assert.equal(content.slides.length, 5);
    assert.equal(content.qaItems.length, 8);
    assert.equal(content.checklist.length, 5);
    assert.equal(content.monetizationPaths.length, 4);
  }
});

test('Vehicle fuel compatibility profiles bind car models and flag hybrids/EVs without GBO', () => {
  const bydSong = getVehicleFuelProfile('BYD Song Plus');
  assert.equal(bydSong.powertrain, 'hybrid_petrol');
  assert.equal(bydSong.supportsGas, false);
  assert.deepEqual(bydSong.supportedFuels, ['ai92', 'ai95']);
  assert.equal(bydSong.recommendedFuel, 'ai95');

  const lacetti = getVehicleFuelProfile('Chevrolet Lacetti');
  assert.equal(lacetti.powertrain, 'ice_gbo_ready');
  assert.equal(lacetti.supportsGas, true);
  assert.deepEqual(lacetti.supportedFuels, ['metan', 'propan', 'ai92']);

  const cobalt = getVehicleFuelProfile('Chevrolet Cobalt');
  assert.equal(cobalt.supportsGas, true);
  assert.deepEqual(cobalt.supportedFuels, ['metan', 'propan', 'ai92']);

  const tesla = getVehicleFuelProfile('Tesla Model 3');
  assert.equal(tesla.powertrain, 'ev_only');
  assert.equal(tesla.supportsGas, false);
  assert.deepEqual(tesla.supportedFuels, []);

  const zeekr = getVehicleFuelProfile('Zeekr 001');
  assert.equal(zeekr.powertrain, 'ev_only');
  assert.equal(zeekr.supportsGas, false);

  const customGbo = getVehicleFuelProfile('BYD Song Plus (ГБО)');
  assert.equal(customGbo.supportsGas, true);
});

test('Pump bay display confirmation codes are deterministic 4-digit codes per station and bay', () => {
  const code1 = computeBayDisplayCode('st-tashkent-chilonzor', 1);
  const code1Repeat = computeBayDisplayCode('st-tashkent-chilonzor', 1);
  const code2 = computeBayDisplayCode('st-tashkent-chilonzor', 2);
  const otherStation = computeBayDisplayCode('st-samarkand-registan', 1);

  assert.match(code1, /^\d{4}$/);
  assert.equal(code1, code1Repeat);
  assert.notEqual(code1, code2);
  assert.notEqual(code1, otherStation);
});

import {
  getEffectiveQueueLevel,
  isFuelEnabledOnStation,
  rankStationsBestNearby,
} from './dezagamiz';

test('Best Nearby station ranking respects operational status, disabled fuels, queue load, and car compatibility', () => {
  const sample = UZBEKISTAN_STATIONS.slice(0, 3).map((st, idx) => ({
    ...st,
    operationalStatus: idx === 0 ? ('maintenance' as const) : ('open' as const),
    queueLevel: idx === 1 ? ('low' as const) : ('high' as const),
    disabledFuels: idx === 2 ? (['metan'] as ('metan')[]) : [],
  }));

  assert.equal(isFuelEnabledOnStation(sample[2], 'metan'), false);
  assert.equal(isFuelEnabledOnStation(sample[1], 'metan'), true);
  assert.equal(getEffectiveQueueLevel(sample[1]), 'low');

  const ranked = rankStationsBestNearby(
    { lat: 41.2995, lng: 69.2401 },
    sample,
    'metan',
    'Chevrolet Cobalt',
  );

  // Station 1 is open with low queue & methane enabled -> should outrank Station 0 (maintenance) and Station 2 (methane disabled)
  assert.equal(ranked[0].id, sample[1].id);
  assert.equal(ranked[0].vehicleCompatible, true);
  assert.equal(ranked[ranked.length - 1].operationalStatus, 'maintenance');
  assert.equal(ranked[ranked.length - 1].freeBaysForFuel, 0);
});




