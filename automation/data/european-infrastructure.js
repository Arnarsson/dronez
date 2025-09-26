// Comprehensive European Infrastructure Database
// Covers all 44+ European countries with airports, harbors, military bases, and critical infrastructure

export const europeanInfrastructure = {
  // ========== AIRPORTS ==========
  airports: {
    // === SOUTHERN EUROPE ===
    // Greece
    'athens': { icao: 'LGAV', iata: 'ATH', name: 'Athens International Airport', country: 'Greece', lat: 37.9364, lon: 23.9445 },
    'thessaloniki': { icao: 'LGTS', iata: 'SKG', name: 'Thessaloniki Airport', country: 'Greece', lat: 40.5197, lon: 22.9709 },
    'heraklion': { icao: 'LGIR', iata: 'HER', name: 'Heraklion Airport', country: 'Greece', lat: 35.3397, lon: 25.1803 },
    'rhodes': { icao: 'LGRP', iata: 'RHO', name: 'Rhodes Airport', country: 'Greece', lat: 36.4054, lon: 28.0862 },

    // Portugal
    'lisbon': { icao: 'LPPT', iata: 'LIS', name: 'Lisbon Airport', country: 'Portugal', lat: 38.7813, lon: -9.1359 },
    'porto': { icao: 'LPPR', iata: 'OPO', name: 'Porto Airport', country: 'Portugal', lat: 41.2481, lon: -8.6814 },
    'faro': { icao: 'LPFR', iata: 'FAO', name: 'Faro Airport', country: 'Portugal', lat: 37.0144, lon: -7.9658 },
    'madeira': { icao: 'LPMA', iata: 'FNC', name: 'Madeira Airport', country: 'Portugal', lat: 32.6979, lon: -16.7745 },

    // Spain (additional)
    'barcelona': { icao: 'LEBL', iata: 'BCN', name: 'Barcelona Airport', country: 'Spain', lat: 41.2971, lon: 2.0785 },
    'malaga': { icao: 'LEMG', iata: 'AGP', name: 'Málaga Airport', country: 'Spain', lat: 36.6749, lon: -4.4991 },
    'palma': { icao: 'LEPA', iata: 'PMI', name: 'Palma de Mallorca Airport', country: 'Spain', lat: 39.5517, lon: 2.7388 },
    'valencia': { icao: 'LEVC', iata: 'VLC', name: 'Valencia Airport', country: 'Spain', lat: 39.4893, lon: -0.4816 },
    'seville': { icao: 'LEZL', iata: 'SVQ', name: 'Seville Airport', country: 'Spain', lat: 37.4180, lon: -5.8931 },
    'bilbao': { icao: 'LEBB', iata: 'BIO', name: 'Bilbao Airport', country: 'Spain', lat: 43.3011, lon: -2.9106 },

    // Italy (additional)
    'milan malpensa': { icao: 'LIMC', iata: 'MXP', name: 'Milan Malpensa Airport', country: 'Italy', lat: 45.6306, lon: 8.7281 },
    'venice': { icao: 'LIPZ', iata: 'VCE', name: 'Venice Marco Polo Airport', country: 'Italy', lat: 45.5053, lon: 12.3519 },
    'naples': { icao: 'LIRN', iata: 'NAP', name: 'Naples Airport', country: 'Italy', lat: 40.8869, lon: 14.2908 },
    'bologna': { icao: 'LIPE', iata: 'BLQ', name: 'Bologna Airport', country: 'Italy', lat: 44.5354, lon: 11.2887 },
    'turin': { icao: 'LIMF', iata: 'TRN', name: 'Turin Airport', country: 'Italy', lat: 45.2008, lon: 7.6496 },
    'catania': { icao: 'LICC', iata: 'CTA', name: 'Catania Airport', country: 'Italy', lat: 37.4667, lon: 15.0664 },

    // Malta
    'malta': { icao: 'LMML', iata: 'MLA', name: 'Malta International Airport', country: 'Malta', lat: 35.8575, lon: 14.4775 },

    // Cyprus
    'larnaca': { icao: 'LCLK', iata: 'LCA', name: 'Larnaca Airport', country: 'Cyprus', lat: 34.8751, lon: 33.6249 },
    'paphos': { icao: 'LCPH', iata: 'PFO', name: 'Paphos Airport', country: 'Cyprus', lat: 34.7180, lon: 32.4857 },

    // Slovenia
    'ljubljana': { icao: 'LJLJ', iata: 'LJU', name: 'Ljubljana Airport', country: 'Slovenia', lat: 46.2237, lon: 14.4576 },

    // Albania
    'tirana': { icao: 'LATI', iata: 'TIA', name: 'Tirana Airport', country: 'Albania', lat: 41.4147, lon: 19.7206 },

    // === EASTERN EUROPE ===
    // Slovakia
    'bratislava': { icao: 'LZIB', iata: 'BTS', name: 'Bratislava Airport', country: 'Slovakia', lat: 48.1702, lon: 17.2127 },
    'kosice': { icao: 'LZKZ', iata: 'KSC', name: 'Košice Airport', country: 'Slovakia', lat: 48.6631, lon: 21.2411 },

    // Serbia
    'belgrade': { icao: 'LYBE', iata: 'BEG', name: 'Belgrade Airport', country: 'Serbia', lat: 44.8184, lon: 20.3091 },
    'nis': { icao: 'LYNI', iata: 'INI', name: 'Niš Airport', country: 'Serbia', lat: 43.3373, lon: 21.8537 },

    // North Macedonia
    'skopje': { icao: 'LWSK', iata: 'SKP', name: 'Skopje Airport', country: 'North Macedonia', lat: 41.9616, lon: 21.6214 },
    'ohrid': { icao: 'LWOH', iata: 'OHD', name: 'Ohrid Airport', country: 'North Macedonia', lat: 41.1800, lon: 20.7423 },

    // Bosnia and Herzegovina
    'sarajevo': { icao: 'LQSA', iata: 'SJJ', name: 'Sarajevo Airport', country: 'Bosnia and Herzegovina', lat: 43.8246, lon: 18.3315 },
    'banja luka': { icao: 'LQBK', iata: 'BNX', name: 'Banja Luka Airport', country: 'Bosnia and Herzegovina', lat: 44.9414, lon: 17.2975 },

    // Montenegro
    'podgorica': { icao: 'LYPG', iata: 'TGD', name: 'Podgorica Airport', country: 'Montenegro', lat: 42.3594, lon: 19.2519 },
    'tivat': { icao: 'LYTV', iata: 'TIV', name: 'Tivat Airport', country: 'Montenegro', lat: 42.4047, lon: 18.7233 },

    // Moldova
    'chisinau': { icao: 'LUKK', iata: 'KIV', name: 'Chișinău Airport', country: 'Moldova', lat: 46.9277, lon: 28.9308 },

    // Ukraine
    'kyiv boryspil': { icao: 'UKBB', iata: 'KBP', name: 'Kyiv Boryspil Airport', country: 'Ukraine', lat: 50.3450, lon: 30.8947 },
    'kyiv zhuliany': { icao: 'UKKK', iata: 'IEV', name: 'Kyiv Zhuliany Airport', country: 'Ukraine', lat: 50.4019, lon: 30.4519 },
    'lviv': { icao: 'UKLL', iata: 'LWO', name: 'Lviv Airport', country: 'Ukraine', lat: 49.8125, lon: 23.9561 },
    'odesa': { icao: 'UKOO', iata: 'ODS', name: 'Odesa Airport', country: 'Ukraine', lat: 46.4268, lon: 30.6765 },
    'kharkiv': { icao: 'UKHH', iata: 'HRK', name: 'Kharkiv Airport', country: 'Ukraine', lat: 49.9248, lon: 36.2900 },
    'dnipro': { icao: 'UKDD', iata: 'DNK', name: 'Dnipro Airport', country: 'Ukraine', lat: 48.3572, lon: 35.1006 },

    // Belarus
    'minsk': { icao: 'UMMS', iata: 'MSQ', name: 'Minsk National Airport', country: 'Belarus', lat: 53.8825, lon: 28.0307 },
    'gomel': { icao: 'UMGG', iata: 'GME', name: 'Gomel Airport', country: 'Belarus', lat: 52.5270, lon: 31.0167 },

    // === WESTERN EUROPE (Additional) ===
    // Ireland
    'dublin': { icao: 'EIDW', iata: 'DUB', name: 'Dublin Airport', country: 'Ireland', lat: 53.4213, lon: -6.2701 },
    'cork': { icao: 'EICK', iata: 'ORK', name: 'Cork Airport', country: 'Ireland', lat: 51.8413, lon: -8.4911 },
    'shannon': { icao: 'EINN', iata: 'SNN', name: 'Shannon Airport', country: 'Ireland', lat: 52.7019, lon: -8.9248 },

    // Luxembourg
    'luxembourg': { icao: 'ELLX', iata: 'LUX', name: 'Luxembourg Airport', country: 'Luxembourg', lat: 49.6233, lon: 6.2044 },

    // Iceland
    'keflavik': { icao: 'BIKF', iata: 'KEF', name: 'Keflavík Airport', country: 'Iceland', lat: 63.9850, lon: -22.6056 },
    'reykjavik': { icao: 'BIRK', iata: 'RKV', name: 'Reykjavík Airport', country: 'Iceland', lat: 64.1300, lon: -21.9406 },

    // === UK (Additional) ===
    'manchester': { icao: 'EGCC', iata: 'MAN', name: 'Manchester Airport', country: 'United Kingdom', lat: 53.3537, lon: -2.2750 },
    'gatwick': { icao: 'EGKK', iata: 'LGW', name: 'London Gatwick Airport', country: 'United Kingdom', lat: 51.1481, lon: -0.1903 },
    'edinburgh': { icao: 'EGPH', iata: 'EDI', name: 'Edinburgh Airport', country: 'United Kingdom', lat: 55.9500, lon: -3.3725 },
    'birmingham': { icao: 'EGBB', iata: 'BHX', name: 'Birmingham Airport', country: 'United Kingdom', lat: 52.4539, lon: -1.7480 },
    'glasgow': { icao: 'EGPF', iata: 'GLA', name: 'Glasgow Airport', country: 'United Kingdom', lat: 55.8719, lon: -4.4331 },
    'belfast': { icao: 'EGAA', iata: 'BFS', name: 'Belfast International Airport', country: 'United Kingdom', lat: 54.6575, lon: -6.2158 },

    // === FRANCE (Additional) ===
    'nice': { icao: 'LFMN', iata: 'NCE', name: 'Nice Côte d\'Azur Airport', country: 'France', lat: 43.6584, lon: 7.2159 },
    'lyon': { icao: 'LFLL', iata: 'LYS', name: 'Lyon Airport', country: 'France', lat: 45.7256, lon: 5.0811 },
    'marseille': { icao: 'LFML', iata: 'MRS', name: 'Marseille Airport', country: 'France', lat: 43.4393, lon: 5.2214 },
    'toulouse': { icao: 'LFBO', iata: 'TLS', name: 'Toulouse Airport', country: 'France', lat: 43.6294, lon: 1.3638 },
    'bordeaux': { icao: 'LFBD', iata: 'BOD', name: 'Bordeaux Airport', country: 'France', lat: 44.8283, lon: -0.7156 },
    'nantes': { icao: 'LFRS', iata: 'NTE', name: 'Nantes Airport', country: 'France', lat: 47.1532, lon: -1.6107 },

    // === GERMANY (Additional) ===
    'berlin': { icao: 'EDDB', iata: 'BER', name: 'Berlin Brandenburg Airport', country: 'Germany', lat: 52.3667, lon: 13.5033 },
    'hamburg': { icao: 'EDDH', iata: 'HAM', name: 'Hamburg Airport', country: 'Germany', lat: 53.6304, lon: 9.9882 },
    'cologne': { icao: 'EDDK', iata: 'CGN', name: 'Cologne Bonn Airport', country: 'Germany', lat: 50.8659, lon: 7.1427 },
    'dusseldorf': { icao: 'EDDL', iata: 'DUS', name: 'Düsseldorf Airport', country: 'Germany', lat: 51.2895, lon: 6.7668 },
    'stuttgart': { icao: 'EDDS', iata: 'STR', name: 'Stuttgart Airport', country: 'Germany', lat: 48.6899, lon: 9.2219 },

    // === BALTIC STATES (Additional) ===
    'tartu': { icao: 'EETU', iata: 'TAY', name: 'Tartu Airport', country: 'Estonia', lat: 58.3075, lon: 26.6903 },
    'kaunas': { icao: 'EYKA', iata: 'KUN', name: 'Kaunas Airport', country: 'Lithuania', lat: 54.9639, lon: 24.0848 },
    'liepaja': { icao: 'EVLA', iata: 'LPX', name: 'Liepāja Airport', country: 'Latvia', lat: 56.5175, lon: 21.0969 },

    // === TURKEY (European part) ===
    'istanbul': { icao: 'LTFM', iata: 'IST', name: 'Istanbul Airport', country: 'Turkey', lat: 41.2753, lon: 28.7519 },
    'istanbul sabiha': { icao: 'LTFJ', iata: 'SAW', name: 'Istanbul Sabiha Gökçen Airport', country: 'Turkey', lat: 40.8986, lon: 29.3092 }
  },

  // ========== HARBORS & PORTS ==========
  harbors: {
    // === MEDITERRANEAN PORTS ===
    'piraeus': { lat: 37.9475, lon: 23.6364, name: 'Port of Piraeus', country: 'Greece' },
    'thessaloniki port': { lat: 40.6328, lon: 22.9347, name: 'Port of Thessaloniki', country: 'Greece' },
    'lisbon port': { lat: 38.7063, lon: -9.1469, name: 'Port of Lisbon', country: 'Portugal' },
    'sines': { lat: 37.9567, lon: -8.8694, name: 'Port of Sines', country: 'Portugal' },
    'barcelona port': { lat: 41.3486, lon: 2.1744, name: 'Port of Barcelona', country: 'Spain' },
    'valencia port': { lat: 39.4458, lon: -0.3317, name: 'Port of Valencia', country: 'Spain' },
    'algeciras': { lat: 36.1408, lon: -5.4378, name: 'Port of Algeciras', country: 'Spain' },
    'marseille port': { lat: 43.3103, lon: 5.3669, name: 'Port of Marseille', country: 'France' },
    'genoa': { lat: 44.4056, lon: 8.9463, name: 'Port of Genoa', country: 'Italy' },
    'trieste': { lat: 45.6495, lon: 13.7768, name: 'Port of Trieste', country: 'Italy' },
    'venice port': { lat: 45.4408, lon: 12.3155, name: 'Port of Venice', country: 'Italy' },
    'naples port': { lat: 40.8418, lon: 14.2681, name: 'Port of Naples', country: 'Italy' },
    'valletta': { lat: 35.8989, lon: 14.5146, name: 'Port of Valletta', country: 'Malta' },
    'limassol': { lat: 34.6786, lon: 33.0413, name: 'Port of Limassol', country: 'Cyprus' },
    'koper': { lat: 45.5483, lon: 13.7302, name: 'Port of Koper', country: 'Slovenia' },
    'rijeka': { lat: 45.3271, lon: 14.4422, name: 'Port of Rijeka', country: 'Croatia' },
    'split': { lat: 43.5081, lon: 16.4402, name: 'Port of Split', country: 'Croatia' },
    'durres': { lat: 41.3166, lon: 19.4550, name: 'Port of Durrës', country: 'Albania' },
    'bar': { lat: 42.0939, lon: 19.0941, name: 'Port of Bar', country: 'Montenegro' },

    // === ATLANTIC PORTS ===
    'porto port': { lat: 41.1431, lon: -8.6683, name: 'Port of Leixões (Porto)', country: 'Portugal' },
    'bilbao port': { lat: 43.3453, lon: -3.0208, name: 'Port of Bilbao', country: 'Spain' },
    'gijon': { lat: 43.5453, lon: -5.6982, name: 'Port of Gijón', country: 'Spain' },
    'le havre': { lat: 49.4858, lon: 0.1032, name: 'Port of Le Havre', country: 'France' },
    'saint nazaire': { lat: 47.2734, lon: -2.2014, name: 'Port of Saint-Nazaire', country: 'France' },
    'bordeaux port': { lat: 44.8578, lon: -0.5505, name: 'Port of Bordeaux', country: 'France' },

    // === NORTH SEA & BALTIC PORTS ===
    'antwerp': { lat: 51.2213, lon: 4.3997, name: 'Port of Antwerp-Bruges', country: 'Belgium' },
    'zeebrugge': { lat: 51.3314, lon: 3.2047, name: 'Port of Zeebrugge', country: 'Belgium' },
    'dover': { lat: 51.1279, lon: 1.3340, name: 'Port of Dover', country: 'United Kingdom' },
    'southampton': { lat: 50.8976, lon: -1.3968, name: 'Port of Southampton', country: 'United Kingdom' },
    'felixstowe': { lat: 51.9567, lon: 1.3511, name: 'Port of Felixstowe', country: 'United Kingdom' },
    'liverpool': { lat: 53.4084, lon: -2.9916, name: 'Port of Liverpool', country: 'United Kingdom' },
    'dublin port': { lat: 53.3498, lon: -6.2142, name: 'Dublin Port', country: 'Ireland' },
    'cork port': { lat: 51.8969, lon: -8.3947, name: 'Port of Cork', country: 'Ireland' },
    'reykjavik port': { lat: 64.1466, lon: -21.9426, name: 'Port of Reykjavík', country: 'Iceland' },

    // === POLISH PORTS ===
    'gdansk': { lat: 54.3520, lon: 18.6466, name: 'Port of Gdańsk', country: 'Poland' },
    'gdynia': { lat: 54.5189, lon: 18.5305, name: 'Port of Gdynia', country: 'Poland' },
    'szczecin': { lat: 53.4285, lon: 14.5528, name: 'Port of Szczecin', country: 'Poland' },

    // === BLACK SEA PORTS ===
    'constanta': { lat: 44.1598, lon: 28.6348, name: 'Port of Constanța', country: 'Romania' },
    'varna': { lat: 43.1951, lon: 27.9187, name: 'Port of Varna', country: 'Bulgaria' },
    'burgas': { lat: 42.4918, lon: 27.4826, name: 'Port of Burgas', country: 'Bulgaria' },
    'odesa port': { lat: 46.4825, lon: 30.7233, name: 'Port of Odesa', country: 'Ukraine' },
    'mariupol': { lat: 47.0958, lon: 37.5433, name: 'Port of Mariupol', country: 'Ukraine' },
    'batumi': { lat: 41.6488, lon: 41.6432, name: 'Port of Batumi', country: 'Georgia' },
    'poti': { lat: 42.1420, lon: 41.6737, name: 'Port of Poti', country: 'Georgia' }
  },

  // ========== MILITARY BASES ==========
  militaryBases: {
    // NATO Air Bases
    'ramstein': { lat: 49.4369, lon: 7.6003, name: 'Ramstein Air Base', country: 'Germany', type: 'USAF/NATO' },
    'spangdahlem': { lat: 49.9727, lon: 6.6925, name: 'Spangdahlem Air Base', country: 'Germany', type: 'USAF/NATO' },
    'aviano': { lat: 46.0319, lon: 12.5965, name: 'Aviano Air Base', country: 'Italy', type: 'USAF/NATO' },
    'lakenheath': { lat: 52.4093, lon: 0.5610, name: 'RAF Lakenheath', country: 'United Kingdom', type: 'USAF' },
    'mildenhall': { lat: 52.3619, lon: 0.4864, name: 'RAF Mildenhall', country: 'United Kingdom', type: 'USAF' },
    'incirlik': { lat: 37.0024, lon: 35.4259, name: 'Incirlik Air Base', country: 'Turkey', type: 'USAF/NATO' },
    'lajes': { lat: 38.7618, lon: -27.0908, name: 'Lajes Air Base', country: 'Portugal', type: 'USAF/NATO' },
    'sigonella': { lat: 37.4017, lon: 14.9224, name: 'Naval Air Station Sigonella', country: 'Italy', type: 'US Navy' },
    'rota': { lat: 36.6652, lon: -6.3490, name: 'Naval Station Rota', country: 'Spain', type: 'US Navy' },
    'souda bay': { lat: 35.5317, lon: 24.1491, name: 'Souda Bay Naval Base', country: 'Greece', type: 'US/NATO' },

    // Major European Military Airbases
    'beauvechain': { lat: 50.7589, lon: 4.7683, name: 'Beauvechain Air Base', country: 'Belgium', type: 'Belgian AF' },
    'eindhoven ab': { lat: 51.4501, lon: 5.3745, name: 'Eindhoven Air Base', country: 'Netherlands', type: 'Dutch AF' },
    'orleans': { lat: 47.9878, lon: 1.7607, name: 'Orléans-Bricy Air Base', country: 'France', type: 'French AF' },
    'payerne': { lat: 46.8433, lon: 6.9154, name: 'Payerne Air Base', country: 'Switzerland', type: 'Swiss AF' },
    'nordholz': { lat: 53.7677, lon: 8.6585, name: 'Nordholz Naval Air Base', country: 'Germany', type: 'German Navy' },
    'rygge': { lat: 59.3788, lon: 10.7854, name: 'Rygge Air Base', country: 'Norway', type: 'Norwegian AF' },
    'kallinge': { lat: 56.2667, lon: 15.2833, name: 'Kallinge Air Base', country: 'Sweden', type: 'Swedish AF' },
    'amari': { lat: 59.2603, lon: 24.2085, name: 'Ämari Air Base', country: 'Estonia', type: 'Estonian AF/NATO' },
    'siauliai': { lat: 55.8939, lon: 23.3950, name: 'Šiauliai Air Base', country: 'Lithuania', type: 'Lithuanian AF/NATO' },
    'krzesiny': { lat: 52.3316, lon: 16.9644, name: 'Krzesiny Air Base', country: 'Poland', type: 'Polish AF' }
  },

  // ========== ENERGY INFRASTRUCTURE ==========
  energyInfrastructure: {
    // Nuclear Power Plants
    'flamanville': { lat: 49.5366, lon: -1.8819, name: 'Flamanville Nuclear Plant', country: 'France', type: 'nuclear' },
    'gravelines': { lat: 51.0150, lon: 2.1342, name: 'Gravelines Nuclear Plant', country: 'France', type: 'nuclear' },
    'cattenom': { lat: 49.4160, lon: 6.2180, name: 'Cattenom Nuclear Plant', country: 'France', type: 'nuclear' },
    'tihange': { lat: 50.5344, lon: 5.2733, name: 'Tihange Nuclear Plant', country: 'Belgium', type: 'nuclear' },
    'doel': { lat: 51.3253, lon: 4.2592, name: 'Doel Nuclear Plant', country: 'Belgium', type: 'nuclear' },
    'borsele': { lat: 51.4331, lon: 3.7169, name: 'Borssele Nuclear Plant', country: 'Netherlands', type: 'nuclear' },
    'ringhals': { lat: 57.2589, lon: 12.1117, name: 'Ringhals Nuclear Plant', country: 'Sweden', type: 'nuclear' },
    'forsmark': { lat: 60.4028, lon: 18.1668, name: 'Forsmark Nuclear Plant', country: 'Sweden', type: 'nuclear' },
    'olkiluoto': { lat: 61.2344, lon: 21.4423, name: 'Olkiluoto Nuclear Plant', country: 'Finland', type: 'nuclear' },
    'temelin': { lat: 49.1821, lon: 14.3749, name: 'Temelín Nuclear Plant', country: 'Czech Republic', type: 'nuclear' },
    'paks': { lat: 46.5728, lon: 18.8567, name: 'Paks Nuclear Plant', country: 'Hungary', type: 'nuclear' },
    'kozloduy': { lat: 43.7472, lon: 23.7787, name: 'Kozloduy Nuclear Plant', country: 'Bulgaria', type: 'nuclear' },
    'cernavoda': { lat: 44.3200, lon: 28.0550, name: 'Cernavodă Nuclear Plant', country: 'Romania', type: 'nuclear' },
    'krsko': { lat: 45.9389, lon: 15.5142, name: 'Krško Nuclear Plant', country: 'Slovenia', type: 'nuclear' },
    'zaporizhzhia': { lat: 47.5119, lon: 34.5853, name: 'Zaporizhzhia Nuclear Plant', country: 'Ukraine', type: 'nuclear' },

    // LNG Terminals
    'zeebrugge lng': { lat: 51.3330, lon: 3.1830, name: 'Zeebrugge LNG Terminal', country: 'Belgium', type: 'lng' },
    'gate terminal': { lat: 51.9420, lon: 4.2420, name: 'Gate LNG Terminal Rotterdam', country: 'Netherlands', type: 'lng' },
    'dunkerque lng': { lat: 51.0200, lon: 2.2100, name: 'Dunkerque LNG Terminal', country: 'France', type: 'lng' },
    'montoir lng': { lat: 47.3100, lon: -2.1600, name: 'Montoir LNG Terminal', country: 'France', type: 'lng' },
    'barcelona lng': { lat: 41.3400, lon: 2.1500, name: 'Barcelona LNG Terminal', country: 'Spain', type: 'lng' },
    'sines lng': { lat: 37.9567, lon: -8.8694, name: 'Sines LNG Terminal', country: 'Portugal', type: 'lng' },
    'revithoussa': { lat: 37.9500, lon: 23.5500, name: 'Revithoussa LNG Terminal', country: 'Greece', type: 'lng' },
    'isle of grain': { lat: 51.4500, lon: 0.7200, name: 'Isle of Grain LNG Terminal', country: 'United Kingdom', type: 'lng' },
    'klaipeda lng': { lat: 55.6592, lon: 21.1356, name: 'Klaipėda LNG Terminal', country: 'Lithuania', type: 'lng' },
    'swinoujscie lng': { lat: 53.9167, lon: 14.2478, name: 'Świnoujście LNG Terminal', country: 'Poland', type: 'lng' }
  }
};

// Export additional helper functions
export function getAssetByICAO(icao) {
  return Object.values(europeanInfrastructure.airports).find(airport => airport.icao === icao);
}

export function getAssetByIATA(iata) {
  return Object.values(europeanInfrastructure.airports).find(airport => airport.iata === iata);
}

export function getAssetsByCountry(country) {
  const assets = {
    airports: [],
    harbors: [],
    militaryBases: [],
    energyInfrastructure: []
  };

  for (const [key, value] of Object.entries(europeanInfrastructure.airports)) {
    if (value.country === country) assets.airports.push(value);
  }

  for (const [key, value] of Object.entries(europeanInfrastructure.harbors)) {
    if (value.country === country) assets.harbors.push(value);
  }

  for (const [key, value] of Object.entries(europeanInfrastructure.militaryBases)) {
    if (value.country === country) assets.militaryBases.push(value);
  }

  for (const [key, value] of Object.entries(europeanInfrastructure.energyInfrastructure)) {
    if (value.country === country) assets.energyInfrastructure.push(value);
  }

  return assets;
}