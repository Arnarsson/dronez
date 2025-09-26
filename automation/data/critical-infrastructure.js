// Critical European Infrastructure Database
// Transport hubs, government facilities, telecom, and strategic assets

export const criticalInfrastructure = {
  // ========== CRITICAL TRANSPORT ==========
  transportHubs: {
    // === MAJOR RAIL STATIONS ===
    'paris gare du nord': { lat: 48.8809, lon: 2.3553, name: 'Gare du Nord', country: 'France', type: 'rail_station' },
    'london st pancras': { lat: 51.5305, lon: -0.1254, name: 'St Pancras International', country: 'United Kingdom', type: 'rail_station' },
    'berlin hauptbahnhof': { lat: 52.5251, lon: 13.3694, name: 'Berlin Hauptbahnhof', country: 'Germany', type: 'rail_station' },
    'frankfurt hauptbahnhof': { lat: 50.1069, lon: 8.6629, name: 'Frankfurt Hauptbahnhof', country: 'Germany', type: 'rail_station' },
    'zurich hauptbahnhof': { lat: 47.3779, lon: 8.5402, name: 'Zürich Hauptbahnhof', country: 'Switzerland', type: 'rail_station' },
    'amsterdam centraal': { lat: 52.3791, lon: 4.9003, name: 'Amsterdam Centraal', country: 'Netherlands', type: 'rail_station' },
    'brussels central': { lat: 50.8454, lon: 4.3571, name: 'Brussels Central Station', country: 'Belgium', type: 'rail_station' },
    'milano centrale': { lat: 45.4862, lon: 9.2044, name: 'Milano Centrale', country: 'Italy', type: 'rail_station' },
    'roma termini': { lat: 41.9012, lon: 12.5022, name: 'Roma Termini', country: 'Italy', type: 'rail_station' },
    'madrid atocha': { lat: 40.4068, lon: -3.6892, name: 'Madrid Atocha', country: 'Spain', type: 'rail_station' },
    'barcelona sants': { lat: 41.3792, lon: 2.1403, name: 'Barcelona Sants', country: 'Spain', type: 'rail_station' },
    'wien hauptbahnhof': { lat: 48.1847, lon: 16.3773, name: 'Wien Hauptbahnhof', country: 'Austria', type: 'rail_station' },
    'warsaw central': { lat: 52.2287, lon: 21.0042, name: 'Warszawa Centralna', country: 'Poland', type: 'rail_station' },
    'prague hlavni': { lat: 50.0834, lon: 14.4352, name: 'Praha Hlavní Nádraží', country: 'Czech Republic', type: 'rail_station' },
    'budapest keleti': { lat: 47.5004, lon: 19.0841, name: 'Budapest Keleti', country: 'Hungary', type: 'rail_station' },

    // === MAJOR BRIDGES ===
    'oresund bridge': { lat: 55.5707, lon: 12.8494, name: 'Øresund Bridge', country: 'Denmark/Sweden', type: 'bridge' },
    'millau viaduct': { lat: 44.0797, lon: 3.0223, name: 'Millau Viaduct', country: 'France', type: 'bridge' },
    'pont de normandie': { lat: 49.4367, lon: 0.2739, name: 'Pont de Normandie', country: 'France', type: 'bridge' },
    'vasco da gama': { lat: 38.7583, lon: -9.0378, name: 'Vasco da Gama Bridge', country: 'Portugal', type: 'bridge' },
    'tower bridge': { lat: 51.5055, lon: -0.0754, name: 'Tower Bridge', country: 'United Kingdom', type: 'bridge' },
    'erasmus bridge': { lat: 51.9089, lon: 4.4867, name: 'Erasmusbrug', country: 'Netherlands', type: 'bridge' },
    'rion antirion': { lat: 38.3197, lon: 21.7731, name: 'Rio-Antirrio Bridge', country: 'Greece', type: 'bridge' },
    'storebelt': { lat: 55.3419, lon: 10.9908, name: 'Great Belt Bridge', country: 'Denmark', type: 'bridge' },
    'humber bridge': { lat: 53.7078, lon: -0.4508, name: 'Humber Bridge', country: 'United Kingdom', type: 'bridge' },
    'fatih sultan mehmet': { lat: 41.0910, lon: 29.0615, name: 'Fatih Sultan Mehmet Bridge', country: 'Turkey', type: 'bridge' },

    // === MAJOR TUNNELS ===
    'channel tunnel uk': { lat: 51.0125, lon: 1.5382, name: 'Channel Tunnel (UK)', country: 'United Kingdom', type: 'tunnel' },
    'channel tunnel fr': { lat: 50.9228, lon: 1.7807, name: 'Channel Tunnel (FR)', country: 'France', type: 'tunnel' },
    'gotthard base tunnel north': { lat: 46.9476, lon: 8.6234, name: 'Gotthard Base Tunnel (North)', country: 'Switzerland', type: 'tunnel' },
    'gotthard base tunnel south': { lat: 46.5290, lon: 8.5989, name: 'Gotthard Base Tunnel (South)', country: 'Switzerland', type: 'tunnel' },
    'mont blanc tunnel fr': { lat: 45.8181, lon: 6.8875, name: 'Mont Blanc Tunnel (FR)', country: 'France', type: 'tunnel' },
    'mont blanc tunnel it': { lat: 45.8076, lon: 6.9436, name: 'Mont Blanc Tunnel (IT)', country: 'Italy', type: 'tunnel' },
    'brenner base tunnel': { lat: 47.0019, lon: 11.5080, name: 'Brenner Base Tunnel', country: 'Austria/Italy', type: 'tunnel' },
    'fehmarnbelt tunnel': { lat: 54.5667, lon: 11.3500, name: 'Fehmarnbelt Tunnel', country: 'Denmark/Germany', type: 'tunnel' },
    'oresund tunnel': { lat: 55.5950, lon: 12.7350, name: 'Øresund Tunnel', country: 'Denmark/Sweden', type: 'tunnel' },

    // === BORDER CROSSINGS ===
    'calais': { lat: 50.9684, lon: 1.8746, name: 'Calais Border Terminal', country: 'France', type: 'border_crossing' },
    'dover': { lat: 51.1279, lon: 1.3134, name: 'Dover Border Control', country: 'United Kingdom', type: 'border_crossing' },
    'ventimiglia': { lat: 43.7915, lon: 7.6076, name: 'Ventimiglia Border', country: 'Italy/France', type: 'border_crossing' },
    'ceuta': { lat: 35.8893, lon: -5.3197, name: 'Ceuta Border', country: 'Spain', type: 'border_crossing' },
    'melilla': { lat: 35.2923, lon: -2.9381, name: 'Melilla Border', country: 'Spain', type: 'border_crossing' },
    'kapitan andreevo': { lat: 41.7208, lon: 26.3189, name: 'Kapitan Andreevo', country: 'Bulgaria/Turkey', type: 'border_crossing' },
    'terespol': { lat: 52.0731, lon: 23.6156, name: 'Terespol Border', country: 'Poland/Belarus', type: 'border_crossing' },
    'medyka': { lat: 49.8042, lon: 22.9267, name: 'Medyka Border', country: 'Poland/Ukraine', type: 'border_crossing' }
  },

  // ========== GOVERNMENT FACILITIES ==========
  governmentFacilities: {
    // === PARLIAMENTS & GOVERNMENT BUILDINGS ===
    'uk parliament': { lat: 51.4995, lon: -0.1248, name: 'Westminster Parliament', country: 'United Kingdom', type: 'parliament' },
    'french assembly': { lat: 48.8608, lon: 2.3188, name: 'Assemblée Nationale', country: 'France', type: 'parliament' },
    'bundestag': { lat: 52.5186, lon: 13.3762, name: 'Bundestag', country: 'Germany', type: 'parliament' },
    'italian parliament': { lat: 41.9010, lon: 12.4807, name: 'Italian Parliament', country: 'Italy', type: 'parliament' },
    'spanish congress': { lat: 40.4165, lon: -3.6969, name: 'Congreso de los Diputados', country: 'Spain', type: 'parliament' },
    'dutch parliament': { lat: 52.0797, lon: 4.3135, name: 'Binnenhof', country: 'Netherlands', type: 'parliament' },
    'belgian parliament': { lat: 50.8444, lon: 4.3648, name: 'Belgian Federal Parliament', country: 'Belgium', type: 'parliament' },
    'austrian parliament': { lat: 48.2082, lon: 16.3585, name: 'Austrian Parliament', country: 'Austria', type: 'parliament' },
    'swiss parliament': { lat: 46.9465, lon: 7.4441, name: 'Bundeshaus', country: 'Switzerland', type: 'parliament' },
    'swedish parliament': { lat: 59.3276, lon: 18.0674, name: 'Riksdag', country: 'Sweden', type: 'parliament' },
    'norwegian parliament': { lat: 59.9128, lon: 10.7400, name: 'Storting', country: 'Norway', type: 'parliament' },
    'finnish parliament': { lat: 60.1725, lon: 24.9332, name: 'Eduskunta', country: 'Finland', type: 'parliament' },
    'danish parliament': { lat: 55.6759, lon: 12.5795, name: 'Folketing', country: 'Denmark', type: 'parliament' },
    'polish parliament': { lat: 52.2254, lon: 21.0299, name: 'Sejm', country: 'Poland', type: 'parliament' },
    'greek parliament': { lat: 37.9778, lon: 23.7329, name: 'Hellenic Parliament', country: 'Greece', type: 'parliament' },
    'portuguese parliament': { lat: 38.7123, lon: -9.1530, name: 'Assembleia da República', country: 'Portugal', type: 'parliament' },

    // === EU INSTITUTIONS ===
    'eu commission': { lat: 50.8432, lon: 4.3817, name: 'European Commission', country: 'Belgium', type: 'eu_institution' },
    'eu parliament brussels': { lat: 50.8389, lon: 4.3756, name: 'European Parliament (Brussels)', country: 'Belgium', type: 'eu_institution' },
    'eu parliament strasbourg': { lat: 48.5973, lon: 7.7691, name: 'European Parliament (Strasbourg)', country: 'France', type: 'eu_institution' },
    'eu council': { lat: 50.8417, lon: 4.3747, name: 'European Council', country: 'Belgium', type: 'eu_institution' },
    'ecb frankfurt': { lat: 50.1099, lon: 8.6738, name: 'European Central Bank', country: 'Germany', type: 'eu_institution' },
    'eu court luxembourg': { lat: 49.6217, lon: 6.1439, name: 'European Court of Justice', country: 'Luxembourg', type: 'eu_institution' },

    // === NATO & DEFENSE HQs ===
    'nato hq': { lat: 50.8786, lon: 4.4205, name: 'NATO Headquarters', country: 'Belgium', type: 'defense_hq' },
    'shape belgium': { lat: 50.5086, lon: 3.9878, name: 'SHAPE (Supreme HQ Allied Powers Europe)', country: 'Belgium', type: 'defense_hq' },
    'pentagon liaison': { lat: 49.4371, lon: 7.6024, name: 'US European Command', country: 'Germany', type: 'defense_hq' }
  },

  // ========== TELECOM & DATA INFRASTRUCTURE ==========
  telecomInfrastructure: {
    // === MAJOR DATA CENTERS ===
    'equinix ld5': { lat: 51.5556, lon: -0.2778, name: 'Equinix LD5 London', country: 'United Kingdom', type: 'data_center' },
    'equinix am3': { lat: 52.3431, lon: 4.8269, name: 'Equinix AM3 Amsterdam', country: 'Netherlands', type: 'data_center' },
    'equinix fr2': { lat: 49.0067, lon: 2.5533, name: 'Equinix FR2 Frankfurt', country: 'Germany', type: 'data_center' },
    'interxion paris': { lat: 48.8172, lon: 2.3639, name: 'Interxion Paris', country: 'France', type: 'data_center' },
    'telecom italia': { lat: 45.4761, lon: 9.1850, name: 'Telecom Italia Milan DC', country: 'Italy', type: 'data_center' },
    'telefonica madrid': { lat: 40.4378, lon: -3.6795, name: 'Telefónica Madrid DC', country: 'Spain', type: 'data_center' },
    'switch zurich': { lat: 47.4133, lon: 8.5442, name: 'Switch Datacenters Zurich', country: 'Switzerland', type: 'data_center' },
    'digitalrealty stockholm': { lat: 59.3508, lon: 18.0736, name: 'Digital Realty Stockholm', country: 'Sweden', type: 'data_center' },
    'atman warsaw': { lat: 52.1672, lon: 20.9678, name: 'Atman Warsaw DC', country: 'Poland', type: 'data_center' },
    'lamda hellix athens': { lat: 38.0689, lon: 23.8031, name: 'Lamda Hellix Athens', country: 'Greece', type: 'data_center' },

    // === INTERNET EXCHANGE POINTS ===
    'de-cix frankfurt': { lat: 50.1188, lon: 8.6843, name: 'DE-CIX Frankfurt', country: 'Germany', type: 'internet_exchange' },
    'ams-ix': { lat: 52.3097, lon: 4.9408, name: 'AMS-IX Amsterdam', country: 'Netherlands', type: 'internet_exchange' },
    'linx london': { lat: 51.5099, lon: -0.0955, name: 'LINX London', country: 'United Kingdom', type: 'internet_exchange' },
    'france-ix paris': { lat: 48.8584, lon: 2.3417, name: 'France-IX Paris', country: 'France', type: 'internet_exchange' },
    'mix milan': { lat: 45.4785, lon: 9.2263, name: 'MIX Milan', country: 'Italy', type: 'internet_exchange' },
    'espanix madrid': { lat: 40.4637, lon: -3.5706, name: 'ESPANIX Madrid', country: 'Spain', type: 'internet_exchange' },
    'vix vienna': { lat: 48.2130, lon: 16.3798, name: 'VIX Vienna', country: 'Austria', type: 'internet_exchange' },
    'nix.cz prague': { lat: 50.0652, lon: 14.4625, name: 'NIX.CZ Prague', country: 'Czech Republic', type: 'internet_exchange' },

    // === BROADCAST TOWERS & TELECOM HUBS ===
    'fernsehturm berlin': { lat: 52.5208, lon: 13.4094, name: 'Fernsehturm Berlin', country: 'Germany', type: 'broadcast_tower' },
    'eiffel tower': { lat: 48.8584, lon: 2.2945, name: 'Eiffel Tower (Broadcast)', country: 'France', type: 'broadcast_tower' },
    'bt tower london': { lat: 51.5215, lon: -0.1389, name: 'BT Tower London', country: 'United Kingdom', type: 'broadcast_tower' },
    'torrespana madrid': { lat: 40.4242, lon: -3.6653, name: 'Torrespaña Madrid', country: 'Spain', type: 'broadcast_tower' },
    'ostankino tower': { lat: 55.8197, lon: 37.6117, name: 'Ostankino Tower', country: 'Russia', type: 'broadcast_tower' },
    'kaknastornet stockholm': { lat: 59.3350, lon: 18.1263, name: 'Kaknästornet Stockholm', country: 'Sweden', type: 'broadcast_tower' },
    'gerbrandy tower': { lat: 52.1014, lon: 5.0511, name: 'Gerbrandy Tower', country: 'Netherlands', type: 'broadcast_tower' },
    'heinrich hertz turm': { lat: 53.5629, lon: 9.9749, name: 'Heinrich-Hertz-Turm Hamburg', country: 'Germany', type: 'broadcast_tower' },

    // === SUBMARINE CABLE LANDING POINTS ===
    'cornwall landing': { lat: 50.0414, lon: -5.6786, name: 'Cornwall Cable Landing', country: 'United Kingdom', type: 'cable_landing' },
    'marseille landing': { lat: 43.2775, lon: 5.3522, name: 'Marseille Cable Landing', country: 'France', type: 'cable_landing' },
    'lisbon landing': { lat: 38.6933, lon: -9.4214, name: 'Lisbon Cable Landing', country: 'Portugal', type: 'cable_landing' },
    'gibraltar landing': { lat: 36.1408, lon: -5.3536, name: 'Gibraltar Cable Landing', country: 'Gibraltar', type: 'cable_landing' },
    'malta landing': { lat: 35.8319, lon: 14.5186, name: 'Malta Cable Landing', country: 'Malta', type: 'cable_landing' },
    'sicily landing': { lat: 37.4664, lon: 15.0708, name: 'Sicily Cable Landing', country: 'Italy', type: 'cable_landing' },
    'cyprus landing': { lat: 34.6841, lon: 33.0552, name: 'Cyprus Cable Landing', country: 'Cyprus', type: 'cable_landing' },
    'denmark landing': { lat: 57.0488, lon: 9.9217, name: 'Denmark Cable Landing', country: 'Denmark', type: 'cable_landing' }
  },

  // ========== FINANCIAL CENTERS ==========
  financialCenters: {
    'london stock exchange': { lat: 51.5151, lon: -0.0967, name: 'London Stock Exchange', country: 'United Kingdom', type: 'financial' },
    'frankfurt stock exchange': { lat: 50.1155, lon: 8.6795, name: 'Frankfurt Stock Exchange', country: 'Germany', type: 'financial' },
    'euronext paris': { lat: 48.8696, lon: 2.3154, name: 'Euronext Paris', country: 'France', type: 'financial' },
    'euronext amsterdam': { lat: 52.3676, lon: 4.9027, name: 'Euronext Amsterdam', country: 'Netherlands', type: 'financial' },
    'six swiss exchange': { lat: 47.3667, lon: 8.5333, name: 'SIX Swiss Exchange', country: 'Switzerland', type: 'financial' },
    'borsa italiana': { lat: 45.4640, lon: 9.1916, name: 'Borsa Italiana Milan', country: 'Italy', type: 'financial' },
    'madrid stock exchange': { lat: 40.4173, lon: -3.6942, name: 'Bolsa de Madrid', country: 'Spain', type: 'financial' },
    'nasdaq nordic': { lat: 59.3328, lon: 18.0626, name: 'Nasdaq Nordic Stockholm', country: 'Sweden', type: 'financial' },
    'warsaw stock exchange': { lat: 52.2309, lon: 21.0042, name: 'Warsaw Stock Exchange', country: 'Poland', type: 'financial' }
  },

  // ========== RESEARCH & SPACE FACILITIES ==========
  researchFacilities: {
    'cern': { lat: 46.2344, lon: 6.0557, name: 'CERN', country: 'Switzerland/France', type: 'research' },
    'esa esoc': { lat: 49.8728, lon: 8.6221, name: 'ESA ESOC Darmstadt', country: 'Germany', type: 'space' },
    'esa estec': { lat: 52.2194, lon: 4.4203, name: 'ESA ESTEC Noordwijk', country: 'Netherlands', type: 'space' },
    'kourou spaceport': { lat: 5.2398, lon: -52.7683, name: 'Kourou Space Centre', country: 'French Guiana', type: 'space' },
    'esrange': { lat: 67.8939, lon: 21.1069, name: 'Esrange Space Center', country: 'Sweden', type: 'space' },
    'plesetsk': { lat: 62.9253, lon: 40.5772, name: 'Plesetsk Cosmodrome', country: 'Russia', type: 'space' },
    'harwell': { lat: 51.5711, lon: -1.3150, name: 'Harwell Space Campus', country: 'United Kingdom', type: 'space' },
    'toulouse space': { lat: 43.6289, lon: 1.3747, name: 'Toulouse Space Centre', country: 'France', type: 'space' },
    'oberpfaffenhofen': { lat: 48.0842, lon: 11.2792, name: 'DLR Oberpfaffenhofen', country: 'Germany', type: 'space' }
  }
};

// Helper functions
export function getCriticalAssetsByCountry(country) {
  const assets = {
    transport: [],
    government: [],
    telecom: [],
    financial: [],
    research: []
  };

  for (const [key, value] of Object.entries(criticalInfrastructure.transportHubs)) {
    if (value.country === country || value.country?.includes(country)) assets.transport.push(value);
  }

  for (const [key, value] of Object.entries(criticalInfrastructure.governmentFacilities)) {
    if (value.country === country) assets.government.push(value);
  }

  for (const [key, value] of Object.entries(criticalInfrastructure.telecomInfrastructure)) {
    if (value.country === country) assets.telecom.push(value);
  }

  for (const [key, value] of Object.entries(criticalInfrastructure.financialCenters)) {
    if (value.country === country) assets.financial.push(value);
  }

  for (const [key, value] of Object.entries(criticalInfrastructure.researchFacilities)) {
    if (value.country === country || value.country?.includes(country)) assets.research.push(value);
  }

  return assets;
}

export function getCriticalAssetsByType(type) {
  const typeMap = {
    'transport': criticalInfrastructure.transportHubs,
    'government': criticalInfrastructure.governmentFacilities,
    'telecom': criticalInfrastructure.telecomInfrastructure,
    'financial': criticalInfrastructure.financialCenters,
    'research': criticalInfrastructure.researchFacilities
  };

  return Object.values(typeMap[type] || {});
}

// Risk assessment for critical infrastructure
export function assessCriticalityLevel(asset) {
  const criticalityScores = {
    // Transport
    'rail_station': 7,
    'bridge': 8,
    'tunnel': 9,
    'border_crossing': 8,

    // Government
    'parliament': 10,
    'eu_institution': 10,
    'defense_hq': 10,

    // Telecom
    'data_center': 9,
    'internet_exchange': 10,
    'broadcast_tower': 7,
    'cable_landing': 9,

    // Financial
    'financial': 9,

    // Research
    'research': 7,
    'space': 8
  };

  return criticalityScores[asset.type] || 5;
}