import { Gta6DealerCategory, Gta6Vehicle } from '../../models/gta6/vehicle';
import { Gta6Mission, Gta6Heist } from '../../models/gta6/mission';
import { Gta6Mystery } from '../../models/gta6/mystery';
import { Gta6Weapon } from '../../models/gta6/weapon';

/**
 * Concesionarios oficiales / demo de GTA VI (Leonida / Vice City) en Español.
 */
export const GTA6_DEALERS_ES: Gta6DealerCategory[] = [
  {
    id: 'vice_luxury',
    name: 'Vice Luxury Autos',
    icon: 'fa-gem',
    color: '#ff4fe0',
    gameMode: 'both',
    description: 'Superdeportivos exóticos, descapotables de alta gama e hipercoches de hiperlujo.'
  },
  {
    id: 'sunshine_autos',
    name: 'Sunshine Autos',
    icon: 'fa-car-side',
    color: '#00cec9',
    gameMode: 'both',
    description: 'El legendario concesionario de Vice City: deportivos, muscle vintage y clásicos eternos.'
  },
  {
    id: 'ocean_drive_customs',
    name: 'Ocean Drive Customs',
    icon: 'fa-wrench',
    color: '#e84393',
    gameMode: 'both',
    description: 'Taller de personalización radical, suspensiones hidráulicas y modificaciones urbanas.'
  },
  {
    id: 'everglades_marine',
    name: 'Everglades Marine & Off-Road',
    icon: 'fa-ship',
    color: '#00b894',
    gameMode: 'both',
    description: 'Hidrodeslizadores pantanosos, embarcaciones de contrabando y camionetas 4x4 elevadas.'
  },
  {
    id: 'leonida_aviation',
    name: 'Leonida Aviation & Military',
    icon: 'fa-plane',
    color: '#6c5ce7',
    gameMode: 'both',
    description: 'Jets ejecutivos privados, helicópteros VIP y transporte táctico aéreo de Leonida.'
  },
  {
    id: 'gta6_especiales',
    name: 'Vehículos Especiales de Leonida',
    icon: 'fa-wand-magic-sparkles',
    color: '#fd79a8',
    gameMode: 'both',
    description: 'Prototipos experimentales, vehículos blindados de asalto y lanchas de contrabando.'
  }
];

export const GTA6_DEALERS_EN: Gta6DealerCategory[] = [
  {
    id: 'vice_luxury',
    name: 'Vice Luxury Autos',
    icon: 'fa-gem',
    color: '#ff4fe0',
    gameMode: 'both',
    description: 'Modern exotic supercars, luxury cabriolets and hyper-luxury hypercars.'
  },
  {
    id: 'sunshine_autos',
    name: 'Sunshine Autos',
    icon: 'fa-car-side',
    color: '#00cec9',
    gameMode: 'both',
    description: 'The legendary Vice City dealership: sports cars, vintage muscle and timeless classics.'
  },
  {
    id: 'ocean_drive_customs',
    name: 'Ocean Drive Customs',
    icon: 'fa-wrench',
    color: '#e84393',
    gameMode: 'both',
    description: 'Radical custom shop, hydraulic suspensions and street modifications in Ocean Beach.'
  },
  {
    id: 'everglades_marine',
    name: 'Everglades Marine & Off-Road',
    icon: 'fa-ship',
    color: '#00b894',
    gameMode: 'both',
    description: 'Swamp airboats, high-speed contraband watercraft and lifted 4x4 off-road pickups.'
  },
  {
    id: 'leonida_aviation',
    name: 'Leonida Aviation & Military',
    icon: 'fa-plane',
    color: '#6c5ce7',
    gameMode: 'both',
    description: 'Corporate executive jets, VIP helicopters and tactical transport aircraft in Leonida.'
  },
  {
    id: 'gta6_especiales',
    name: 'Leonida Special Vehicles',
    icon: 'fa-wand-magic-sparkles',
    color: '#fd79a8',
    gameMode: 'both',
    description: 'Experimental prototypes, armored assault vehicles and contraband patrol speedboats.'
  }
];

export const GTA6_DEALERS = GTA6_DEALERS_ES;

/**
 * Catálogo Demo de Vehículos de GTA VI por Concesionario
 */
export const GTA6_VEHICLES_BY_DEALER: Record<string, any[]> = {
  vice_luxury: [
    {
      id: 'gta6_v1',
      name: 'Grotti Cheetah Classic Neo',
      manufacturer: 'Grotti',
      class: 'Súper',
      category: 'super',
      price: 1950000,
      priceFormatted: '$1,950,000',
      speed: 98,
      acceleration: 95,
      braking: 90,
      handling: 92,
      dealership: 'vice_luxury',
      images: ['assets/data-images/gta5/vehicles/cheetah.png'],
      description: 'Superdeportivo icónico con alerón activo de fibra de carbono y motor V12 biturbo refrigerado por aire.'
    },
    {
      id: 'gta6_v2',
      name: 'Pegassi Torero Vice Spyder',
      manufacturer: 'Pegassi',
      class: 'Súper',
      category: 'super',
      price: 2450000,
      priceFormatted: '$2,450,000',
      speed: 99,
      acceleration: 98,
      braking: 92,
      handling: 94,
      dealership: 'vice_luxury',
      images: ['assets/data-images/gta5/vehicles/torero.png'],
      description: 'Descapotable agresivo de diseño ochentero con puertas de tijera e interiores en cuero fucsia neón.'
    },
    {
      id: 'gta6_v3',
      name: 'Pfister Comet S3 Cabrio',
      manufacturer: 'Pfister',
      class: 'Deportivos',
      category: 'sports',
      price: 1350000,
      priceFormatted: '$1,350,000',
      speed: 94,
      acceleration: 92,
      braking: 88,
      handling: 95,
      dealership: 'vice_luxury',
      images: ['assets/data-images/gta5/vehicles/comet2.png'],
      description: 'El rey de las avenidas costeras de Ocean Beach: tracción total y escape deportivo de competición.'
    }
  ],
  sunshine_autos: [
    {
      id: 'gta6_v4',
      name: 'Vapid Dominator GT Vice Edition',
      manufacturer: 'Vapid',
      class: 'Muscle',
      category: 'muscle',
      price: 480000,
      priceFormatted: '$480,000',
      speed: 91,
      acceleration: 96,
      braking: 80,
      handling: 84,
      dealership: 'sunshine_autos',
      images: ['assets/data-images/gta5/vehicles/dominator.png'],
      description: 'Músculo americano de alta cilindrada con sobrealimentador visible en el capó y tracción trasera pura.'
    },
    {
      id: 'gta6_v5',
      name: 'Albany Buccaneer Custom Classic',
      manufacturer: 'Albany',
      class: 'Clásicos',
      category: 'sports_classics',
      price: 320000,
      priceFormatted: '$320,000',
      speed: 84,
      acceleration: 86,
      braking: 75,
      handling: 80,
      dealership: 'sunshine_autos',
      images: ['assets/data-images/gta5/vehicles/buccaneer.png'],
      description: 'Un cupé de lujo clásico con defensas cromadas pulidas a espejo e interiores tapizados en terciopelo.'
    },
    {
      id: 'gta6_v6',
      name: 'Declasse Sabre Turbo Vice Runner',
      manufacturer: 'Declasse',
      class: 'Muscle',
      category: 'muscle',
      price: 290000,
      priceFormatted: '$290,000',
      speed: 88,
      acceleration: 90,
      braking: 78,
      handling: 82,
      dealership: 'sunshine_autos',
      images: ['assets/data-images/gta5/vehicles/sabregt.png'],
      description: 'Chasis reforzado y pintura bitono clásica para carreras callejeras en el centro de Port Gellhorn.'
    }
  ],
  ocean_drive_customs: [
    {
      id: 'gta6_v7',
      name: 'Karin Sultan RS Twin Turbo',
      manufacturer: 'Karin',
      class: 'Deportivos',
      category: 'sports',
      price: 890000,
      priceFormatted: '$890,000',
      speed: 95,
      acceleration: 94,
      braking: 90,
      handling: 96,
      dealership: 'ocean_drive_customs',
      images: ['assets/data-images/gta5/vehicles/sultanrs.png'],
      description: 'Sedán de rally convertido en monstruo del asfalto con jaula antivuelco y alerón de alta carga.'
    },
    {
      id: 'gta6_v8',
      name: 'Annis Elegy Retro Custom 2.0',
      manufacturer: 'Annis',
      class: 'Deportivos',
      category: 'sports',
      price: 1120000,
      priceFormatted: '$1,120,000',
      speed: 96,
      acceleration: 93,
      braking: 91,
      handling: 97,
      dealership: 'ocean_drive_customs',
      images: ['assets/data-images/gta5/vehicles/elegy.png'],
      description: 'Leyenda del drift japonés con kit de carrocería ensanchado y suspensión rebajada.'
    }
  ],
  everglades_marine: [
    {
      id: 'gta6_v9',
      name: 'Nagasaki Gator Airboat Ultra',
      manufacturer: 'Nagasaki',
      class: 'Barcos',
      category: 'boats',
      price: 360000,
      priceFormatted: '$360,000',
      speed: 86,
      acceleration: 92,
      braking: 70,
      handling: 88,
      dealership: 'everglades_marine',
      images: ['assets/data-images/gta5/vehicles/dinghy.png'],
      description: 'Hidrodeslizador propulsado por hélice aeronáutica para deslizarse a toda velocidad sobre ciénagas y aguas bajas.'
    },
    {
      id: 'gta6_v10',
      name: 'Shitzu Tropic Thunder Yacht',
      manufacturer: 'Shitzu',
      class: 'Barcos',
      category: 'boats',
      price: 1850000,
      priceFormatted: '$1,850,000',
      speed: 92,
      acceleration: 88,
      braking: 74,
      handling: 85,
      dealership: 'everglades_marine',
      images: ['assets/data-images/gta5/vehicles/toro.png'],
      description: 'Lancha de lujo con casco de teca y motores fueraborda triples para escapadas a alta mar.'
    },
    {
      id: 'gta6_v11',
      name: 'Karin Everglade 4x4 Mud King',
      manufacturer: 'Karin',
      class: 'Todoterreno',
      category: 'offroad',
      price: 420000,
      priceFormatted: '$420,000',
      speed: 80,
      acceleration: 88,
      braking: 78,
      handling: 86,
      dealership: 'everglades_marine',
      images: ['assets/data-images/gta5/vehicles/bifta.png'],
      description: 'Camioneta con snorkel de admisión alta, suspensión de largo recorrido y neumáticos de barro profundo.'
    }
  ],
  leonida_aviation: [
    {
      id: 'gta6_v12',
      name: 'Buckingham SuperVolito Vice',
      manufacturer: 'Buckingham',
      class: 'Helicópteros',
      category: 'helicopters',
      price: 2110000,
      priceFormatted: '$2,110,000',
      speed: 92,
      acceleration: 90,
      braking: 85,
      handling: 90,
      dealership: 'leonida_aviation',
      images: ['assets/data-images/gta5/vehicles/supervolito.png'],
      description: 'Helicóptero VIP con rotor silencioso y cabina presurizada con champán a bordo.'
    },
    {
      id: 'gta6_v13',
      name: 'Mammoth Dodo Seaplane Neo',
      manufacturer: 'Mammoth',
      class: 'Aviones',
      category: 'planes',
      price: 980000,
      priceFormatted: '$980,000',
      speed: 82,
      acceleration: 78,
      braking: 70,
      handling: 80,
      dealership: 'leonida_aviation',
      images: ['assets/data-images/gta5/vehicles/dodo.png'],
      description: 'Hidroavión clásico con flotadores reforzados para aterrizar en cualquier cayo de Gellhorn.'
    }
  ],
  gta6_especiales: [
    {
      id: 'gta6_v14',
      name: 'Leonida Contraband Patrol Runner',
      manufacturer: 'Dinka',
      class: 'Barcos',
      category: 'boats',
      price: 850000,
      priceFormatted: '$850,000',
      speed: 96,
      acceleration: 94,
      braking: 75,
      handling: 91,
      dealership: 'gta6_especiales',
      images: ['assets/data-images/gta5/vehicles/speeder.png'],
      description: 'Lancha rápida con compartimentos ocultos y radar antidetención costera.'
    }
  ]
};

/**
 * Misiones Demo de Historia de GTA VI
 */
export const GTA6_STORY_MISSIONS_ES: Gta6Mission[] = [
  {
    id: 'gta6_m1',
    order: 1,
    title: 'Confianza y Plomo',
    giver: 'Lucia & Jason',
    protagonist: 'Jason / Lucia',
    location: 'Port Gellhorn',
    type: 'Prólogo / Cooperativa',
    category: 'Prólogo',
    thumbnail: 'assets/data-images/gta5/properties/Tequilala-GTAV.png',
    description: 'Atraco a mano armada en la licorería de Port Gellhorn y huida coordinada esquivando el cerco policial.',
    goldRequirements: ['Tiempo menor a 05:30', 'Disparos a la cabeza: 8', 'Sin daños graves en el coche']
  },
  {
    id: 'gta6_m2',
    order: 2,
    title: 'Luces de Ocean Drive',
    giver: 'Raul Calderon',
    protagonist: 'Lucia',
    location: 'Vice Beaches',
    type: 'Infiltración',
    category: 'Operaciones',
    thumbnail: 'assets/data-images/gta5/properties/Pitchers-GTAV.png',
    description: 'Recuperar un alijo de diamantes en un hotel art déco durante una fiesta privada en la terraza.',
    goldRequirements: ['Sigilo absoluto', 'Noquear a 4 guardias', 'Escapar por los tejados']
  },
  {
    id: 'gta6_m3',
    order: 3,
    title: 'Caimanes y Contrabando',
    giver: 'Hank "Big Gator"',
    protagonist: 'Jason',
    location: 'Grassrivers',
    type: 'Persecución en Hidrodeslizador',
    category: 'Contrabando',
    thumbnail: 'assets/data-images/gta5/properties/TheHenHouse-GTAV.png',
    description: 'Interceptar un cargamento clandestino en los manglares pantanosos antes de que llegue a los guardacostas.',
    goldRequirements: ['Destruir 3 lanchas rivales', 'No encallar en el fango', 'Precisión de tiro: 75%']
  }
];

export const GTA6_STORY_MISSIONS_EN: Gta6Mission[] = [
  {
    id: 'gta6_m1',
    order: 1,
    title: 'Trust & Lead',
    giver: 'Lucia & Jason',
    protagonist: 'Jason / Lucia',
    location: 'Port Gellhorn',
    type: 'Prologue / Co-op',
    category: 'Prologue',
    thumbnail: 'assets/data-images/gta5/properties/Tequilala-GTAV.png',
    description: 'Armed robbery at the Port Gellhorn liquor store and coordinated escape through the police perimeter.',
    goldRequirements: ['Time under 05:30', 'Headshots: 8', 'No critical vehicle damage']
  },
  {
    id: 'gta6_m2',
    order: 2,
    title: 'Ocean Drive Neon',
    giver: 'Raul Calderon',
    protagonist: 'Lucia',
    location: 'Vice Beaches',
    type: 'Infiltration',
    category: 'Operations',
    thumbnail: 'assets/data-images/gta5/properties/Pitchers-GTAV.png',
    description: 'Recover a diamond stash inside an art deco rooftop party in Ocean Drive.',
    goldRequirements: ['Pure stealth', 'Knock out 4 guards', 'Escape via rooftops']
  },
  {
    id: 'gta6_m3',
    order: 3,
    title: 'Gators & Contraband',
    giver: 'Hank "Big Gator"',
    protagonist: 'Jason',
    location: 'Grassrivers',
    type: 'Airboat Chase',
    category: 'Contraband',
    thumbnail: 'assets/data-images/gta5/properties/TheHenHouse-GTAV.png',
    description: 'Intercept a contraband shipment in the murky swamplands before coast guard patrol arrives.',
    goldRequirements: ['Destroy 3 enemy boats', 'No grounding in mud', 'Accuracy 75%']
  }
];

/**
 * Golpes Demo de GTA VI
 */
export const GTA6_HEISTS_ES: Gta6Heist[] = [
  {
    id: 'gta6_h1',
    order: 1,
    title: 'El Gran Golpe al Casino Malecón',
    location: 'Vice City Marina',
    giver: 'Raul Calderon',
    payout: '$4,200,000',
    badgeColor: '#ff4fe0',
    badgeIcon: 'fa-sack-dollar',
    categoryLabel: 'Golpe a Gran Escala',
    players: '2-4 Jugadores',
    thumbnail: 'assets/data-images/gta5/businesses/Nightclubs-GTAO-Interior.png',
    potentialTake: {
      normal: '$4,200,000',
      hard: '$4,850,000',
      description: 'Diamantes y Criptodivisas en Bóveda Subacuática'
    },
    description: 'Infiltración marítima y asalto a la cámara acorazada durante la gala de medianoche.',
    approaches: [
      { name: 'Sigilo Subacuático', description: 'Infiltración con equipo de buceo autónomo y corte de seguridad' },
      { name: 'Asalto Frontal con Fumígenos', description: 'Entrada por la puerta principal con granadas cegadoras y blindaje pesado' }
    ],
    setupCount: 4
  },
  {
    id: 'gta6_h2',
    order: 2,
    title: 'Asalto a la Reserva Bancaria de Port Gellhorn',
    location: 'Port Gellhorn Industrial',
    giver: 'Jason & Lucia',
    payout: '$2,800,000',
    badgeColor: '#00cec9',
    badgeIcon: 'fa-building-columns',
    categoryLabel: 'Asalto Blindado',
    players: '2 Jugadores',
    thumbnail: 'assets/data-images/gta5/businesses/WarehouseInterior-GTAO.png',
    potentialTake: {
      normal: '$2,800,000',
      hard: '$3,200,000',
      description: 'Lingotes de Oro y Furgón Blindado Brute'
    },
    description: 'Inutilizar la subestación eléctrica del distrito y asaltar los furgones blindados en ruta.',
    approaches: [
      { name: 'Corte de Energía Táctico', description: 'Inutilizar la subestación regional antes de romper las esclusas' },
      { name: 'Emboscada en Puente', description: 'Detonar el puente levadizo para atrapar el convoy de seguridad' }
    ],
    setupCount: 3
  }
];

export const GTA6_HEISTS_EN: Gta6Heist[] = [
  {
    id: 'gta6_h1',
    order: 1,
    title: 'The Malecon Casino Heist',
    location: 'Vice City Marina',
    giver: 'Raul Calderon',
    payout: '$4,200,000',
    badgeColor: '#ff4fe0',
    badgeIcon: 'fa-sack-dollar',
    categoryLabel: 'Grand Scale Heist',
    players: '2-4 Players',
    thumbnail: 'assets/data-images/gta5/businesses/Nightclubs-GTAO-Interior.png',
    potentialTake: {
      normal: '$4,200,000',
      hard: '$4,850,000',
      description: 'Diamonds & Cryptocurrencies in Submerged Vault'
    },
    description: 'Subaquatic infiltration and vault breach during the midnight yacht gala.',
    approaches: [
      { name: 'Subaquatic Stealth', description: 'Underwater infiltration using rebreathers and bypass tools' },
      { name: 'Frontal Smoke Assault', description: 'Main entrance breach using flashbangs and heavy armor' }
    ],
    setupCount: 4
  },
  {
    id: 'gta6_h2',
    order: 2,
    title: 'Port Gellhorn Reserve Raid',
    location: 'Port Gellhorn Industrial',
    giver: 'Jason & Lucia',
    payout: '$2,800,000',
    badgeColor: '#00cec9',
    badgeIcon: 'fa-building-columns',
    categoryLabel: 'Armored Raid',
    players: '2 Players',
    thumbnail: 'assets/data-images/gta5/businesses/WarehouseInterior-GTAO.png',
    potentialTake: {
      normal: '$2,800,000',
      hard: '$3,200,000',
      description: 'Gold Bullions and Brute Armored Convoy'
    },
    description: 'Black out the district power grid and intercept the armored convoy en route.',
    approaches: [
      { name: 'Tactical Blackout', description: 'Cut power at the regional grid before cutting security gates' },
      { name: 'Bridge Ambush', description: 'Trigger drawbridge detonation to trap the convoy' }
    ],
    setupCount: 3
  }
];

/**
 * Misterios y Secretos Demo de GTA VI
 */
export const GTA6_MYSTERIES_ES: Gta6Mystery[] = [
  {
    id: 'gta6_mys1',
    order: 1,
    orderNum: 1,
    title: 'El Pecio del Galeón Fantasma',
    category: 'paranormal',
    categoryLabel: 'Pecios Submarinos',
    locationName: 'Cayos de Gellhorn',
    location: 'Cayos de Gellhorn',
    zone: 'Aguas Profundas del Sur',
    schedule: '00:00 - 04:00 (Noche de Tormenta)',
    badgeColor: '#00cec9',
    badgeIcon: 'fa-ship',
    thumbnail: 'assets/data-images/gta5/properties/SonarCollectionsDock-GTAV.png',
    description: 'Restos de un galeón español del siglo XVII con extrañas emisiones electromagnéticas a 40 metros de profundidad.',
    descriptionSnippet: 'Restos de un galeón español del siglo XVII con extrañas emisiones electromagnéticas a 40 metros de profundidad.',
    fullStory: 'Explorando las fosas marinas entre los cayos del sur, los buceadores han reportado luces fosforescentes parpadeantes en el casco de madera carcomida.',
    lore: 'Explorando las fosas marinas entre los cayos del sur, los buceadores han reportado luces fosforescentes parpadeantes en el casco de madera carcomida.',
    mechanics: [
      'Bucear con sumergible o equipo Kraken a más de 40 metros de profundidad',
      'Sintonizar la radio en frecuencias estáticas para escuchar código Morse'
    ]
  },
  {
    id: 'gta6_mys2',
    order: 2,
    orderNum: 2,
    title: 'El Monstruo de los Pantanos de Grassrivers',
    category: 'cryptozoology',
    categoryLabel: 'Criptozoología',
    locationName: 'Grassrivers Central',
    location: 'Grassrivers Central',
    zone: 'Manglares de Leonida',
    schedule: '02:00 - 05:00 (Niebla densa)',
    badgeColor: '#2ecc71',
    badgeIcon: 'fa-dragon',
    thumbnail: 'assets/data-images/gta5/properties/Smoke-on-the-Water-Logo.png',
    description: 'Avistamiento nocturno de un caimán de proporciones colosales con marcas tribales en las escamas.',
    descriptionSnippet: 'Avistamiento nocturno de un caimán de proporciones colosales con marcas tribales en las escamas.',
    fullStory: 'Las leyendas locales de los tramperos de Leonida hablan de una criatura ancestral que habita el corazón inaccesible del pantano.',
    lore: 'Las leyendas locales de los tramperos de Leonida hablan de una criatura ancestral que habita el corazón inaccesible del pantano.',
    mechanics: [
      'Navegar en hidrodeslizador apagando los focos auxiliares',
      'Seguir los restos de carcasas flotantes en el canal central pantanoso'
    ]
  },
  {
    id: 'gta6_mys3',
    order: 3,
    orderNum: 3,
    title: 'La Señal del Satélite Perdido en Ocean Drive',
    category: 'conspiracy',
    categoryLabel: 'Conspiraciones',
    locationName: 'Ocean Drive Rooftop',
    location: 'Ocean Drive Rooftop',
    zone: 'Vice Beach',
    schedule: 'Siempre Activo',
    badgeColor: '#ff4fe0',
    badgeIcon: 'fa-satellite-dish',
    thumbnail: 'assets/data-images/gta5/properties/MazeBankWest-GTAO.png',
    description: 'Antena de telecomunicaciones en la azotea de un rascacielos que intercepta transmisiones gubernamentales cifradas.',
    descriptionSnippet: 'Antena de telecomunicaciones en la azotea que intercepta transmisiones gubernamentales cifradas.',
    fullStory: 'Documentos filtrados de la FIB sugieren un programa de vigilancia masiva sobre toda la península de Leonida.',
    lore: 'Documentos filtrados de la FIB sugieren un programa de vigilancia masiva sobre toda la península de Leonida.',
    mechanics: [
      'Hackear la terminal del ático con el smartphone de Lucia',
      'Descifrar la clave binaria transmitida en la pantalla de telemetría'
    ]
  }
];

export const GTA6_MYSTERIES_EN: Gta6Mystery[] = [
  {
    id: 'gta6_mys1',
    order: 1,
    orderNum: 1,
    title: 'The Ghost Galleon Shipwreck',
    category: 'paranormal',
    categoryLabel: 'Underwater Shipwrecks',
    locationName: 'Gellhorn Keys',
    location: 'Gellhorn Keys',
    zone: 'Southern Deep Ocean',
    schedule: '00:00 - 04:00 (Stormy Weather)',
    badgeColor: '#00cec9',
    badgeIcon: 'fa-ship',
    thumbnail: 'assets/data-images/gta5/properties/SonarCollectionsDock-GTAV.png',
    description: 'Remains of a 17th-century Spanish galleon emitting electromagnetic pulses 40 meters underwater.',
    descriptionSnippet: 'Remains of a 17th-century Spanish galleon emitting electromagnetic pulses 40 meters underwater.',
    fullStory: 'Divers exploring southern deep ocean trenches have documented flickering bioluminescent signals inside the ancient sunken hull.',
    lore: 'Divers exploring southern deep ocean trenches have documented flickering bioluminescent signals inside the ancient sunken hull.',
    mechanics: [
      'Dive with a submersible or Kraken gear at 40m depth',
      'Tune into static radio frequencies to receive Morse code'
    ]
  },
  {
    id: 'gta6_mys2',
    order: 2,
    orderNum: 2,
    title: 'The Grassrivers Swamp Beast',
    category: 'cryptozoology',
    categoryLabel: 'Cryptozoology',
    locationName: 'Grassrivers Central',
    location: 'Grassrivers Central',
    zone: 'Leonida Mangroves',
    schedule: '02:00 - 05:00 (Heavy Fog)',
    badgeColor: '#2ecc71',
    badgeIcon: 'fa-dragon',
    thumbnail: 'assets/data-images/gta5/properties/Smoke-on-the-Water-Logo.png',
    description: 'Nighttime sightings of a giant prehistoric alligator with mysterious markings along its armor.',
    descriptionSnippet: 'Nighttime sightings of a giant prehistoric alligator with mysterious markings along its armor.',
    fullStory: 'Local folklore among Leonida swamp trappers warns of an ancient apex predator deep in the unreachable mangroves.',
    lore: 'Local folklore among Leonida swamp trappers warns of an ancient apex predator deep in the unreachable mangroves.',
    mechanics: [
      'Travel by airboat with auxiliary lights turned off',
      'Follow the floating carcasses along the central channel'
    ]
  },
  {
    id: 'gta6_mys3',
    order: 3,
    orderNum: 3,
    title: 'The Lost Satellite Signal on Ocean Drive',
    category: 'conspiracy',
    categoryLabel: 'Conspiracies',
    locationName: 'Ocean Drive Rooftop',
    location: 'Ocean Drive Rooftop',
    zone: 'Vice Beach',
    schedule: 'Always Active',
    badgeColor: '#ff4fe0',
    badgeIcon: 'fa-satellite-dish',
    thumbnail: 'assets/data-images/gta5/properties/MazeBankWest-GTAO.png',
    description: 'Rooftop telecommunications antenna intercepting encrypted government transmissions.',
    descriptionSnippet: 'Rooftop antenna intercepting encrypted government transmissions.',
    fullStory: 'Leaked FIB documents suggest a mass surveillance program across the entire Leonida peninsula.',
    lore: 'Leaked FIB documents suggest a mass surveillance program across the entire Leonida peninsula.',
    mechanics: [
      'Hack the penthouse terminal with Lucia’s smartphone',
      'Decode the binary key broadcasted on the telemetry display'
    ]
  }
];

/**
 * Armamento Demo de GTA VI
 */
export const GTA6_WEAPONS_ES: Gta6Weapon[] = [
  {
    id: 'gta6_w1',
    name: 'Pistola Táctica 9mm',
    category: 'pistols',
    categoryLabel: 'Pistolas',
    manufacturer: 'Vom Feuer',
    realCounterpart: 'Glock 19X Custom',
    price: 1200,
    priceFormatted: '$1,200',
    damage: 42,
    fireRate: 65,
    accuracy: 78,
    range: 45,
    clipSize: 17,
    imageUrl: 'assets/data-images/gta5/weapons/combat_pistol.png',
    description: 'Arma corta reglamentaria con corredera aligerada, empuñadura ergonómica y riel inferior táctico.'
  },
  {
    id: 'gta6_w2',
    name: 'Fusil de Asalto Leonida Carbine',
    category: 'rifles',
    categoryLabel: 'Fusiles de Asalto',
    manufacturer: 'Shrewsbury',
    realCounterpart: 'MCX SPEAR / M4A1',
    price: 14500,
    priceFormatted: '$14,500',
    damage: 68,
    fireRate: 80,
    accuracy: 82,
    range: 75,
    clipSize: 30,
    imageUrl: 'assets/data-images/gta5/weapons/carbine_rifle.png',
    description: 'Plataforma táctica moderna con culata telescópica, guardamanos M-LOK y raíles Picatinny para miras ópticas.'
  },
  {
    id: 'gta6_w3',
    name: 'Escopeta Corredera Marina',
    category: 'shotguns',
    categoryLabel: 'Escopetas',
    manufacturer: 'Buckingham Defense',
    realCounterpart: 'Mossberg 590 Marine',
    price: 4800,
    priceFormatted: '$4,800',
    damage: 88,
    fireRate: 35,
    accuracy: 40,
    range: 30,
    clipSize: 8,
    imageUrl: 'assets/data-images/gta5/weapons/combat_shotgun.png',
    description: 'Tratamiento anticorrosión en níquel marino para operaciones tácticas en pantanos, manglares y alta mar.'
  },
  {
    id: 'gta6_w4',
    name: 'Subfusil Táctico Vice MP',
    category: 'smgs',
    categoryLabel: 'Subfusiles',
    manufacturer: 'Hawk & Little',
    realCounterpart: 'SIG MPX Copperhead',
    price: 8900,
    priceFormatted: '$8,900',
    damage: 48,
    fireRate: 92,
    accuracy: 70,
    range: 50,
    clipSize: 32,
    imageUrl: 'assets/data-images/gta5/weapons/gusenberg_sweeper.png',
    description: 'Cadencia de fuego implacable en combate a corta distancia y retroceso compensado para tiroteos urbanos.'
  },
  {
    id: 'gta6_w5',
    name: 'Rifle de Francotirador Pesado .50',
    category: 'snipers',
    categoryLabel: 'Francotiradores',
    manufacturer: 'Ammu-Nation Custom',
    realCounterpart: 'Barrett M82 .50 BMG',
    price: 32000,
    priceFormatted: '$32,000',
    damage: 98,
    fireRate: 20,
    accuracy: 99,
    range: 100,
    clipSize: 6,
    imageUrl: 'assets/data-images/gta5/weapons/heavy_sniper.png',
    description: 'Potencia balística extrema capaz de perforar blindajes pesados e inutilizar motores a larga distancia.'
  }
];

export const GTA6_WEAPONS_EN: Gta6Weapon[] = [
  {
    id: 'gta6_w1',
    name: 'Tactical 9mm Pistol',
    category: 'pistols',
    categoryLabel: 'Pistols',
    manufacturer: 'Vom Feuer',
    realCounterpart: 'Glock 19X Custom',
    price: 1200,
    priceFormatted: '$1,200',
    damage: 42,
    fireRate: 65,
    accuracy: 78,
    range: 45,
    clipSize: 17,
    imageUrl: 'assets/data-images/gta5/weapons/combat_pistol.png',
    description: 'Standard-issue compact handgun with lightened slide, ergonomic polymer grip and tactical under-rail.'
  },
  {
    id: 'gta6_w2',
    name: 'Leonida Carbine Assault Rifle',
    category: 'rifles',
    categoryLabel: 'Assault Rifles',
    manufacturer: 'Shrewsbury',
    realCounterpart: 'MCX SPEAR / M4A1',
    price: 14500,
    priceFormatted: '$14,500',
    damage: 68,
    fireRate: 80,
    accuracy: 82,
    range: 75,
    clipSize: 30,
    imageUrl: 'assets/data-images/gta5/weapons/carbine_rifle.png',
    description: 'Modern tactical platform featuring telescopic stock, M-LOK handguard and full Picatinny rail optics.'
  },
  {
    id: 'gta6_w3',
    name: 'Marine Pump Shotgun',
    category: 'shotguns',
    categoryLabel: 'Shotguns',
    manufacturer: 'Buckingham Defense',
    realCounterpart: 'Mossberg 590 Marine',
    price: 4800,
    priceFormatted: '$4,800',
    damage: 88,
    fireRate: 35,
    accuracy: 40,
    range: 30,
    clipSize: 8,
    imageUrl: 'assets/data-images/gta5/weapons/combat_shotgun.png',
    description: 'Anti-corrosive marine nickel coating engineered for swampland, mangroves and open sea operations.'
  },
  {
    id: 'gta6_w4',
    name: 'Vice Tactical MP Submachine',
    category: 'smgs',
    categoryLabel: 'SMGs',
    manufacturer: 'Hawk & Little',
    realCounterpart: 'SIG MPX Copperhead',
    price: 8900,
    priceFormatted: '$8,900',
    damage: 48,
    fireRate: 92,
    accuracy: 70,
    range: 50,
    clipSize: 32,
    imageUrl: 'assets/data-images/gta5/weapons/gusenberg_sweeper.png',
    description: 'Blistering fire rate in close-quarters skirmishes with built-in muzzle compensation.'
  },
  {
    id: 'gta6_w5',
    name: 'Heavy .50 Sniper Rifle',
    category: 'snipers',
    categoryLabel: 'Sniper Rifles',
    manufacturer: 'Ammu-Nation Custom',
    realCounterpart: 'Barrett M82 .50 BMG',
    price: 32000,
    priceFormatted: '$32,000',
    damage: 98,
    fireRate: 20,
    accuracy: 99,
    range: 100,
    clipSize: 6,
    imageUrl: 'assets/data-images/gta5/weapons/heavy_sniper.png',
    description: 'Devastating anti-material rifle designed to pierce heavy ballistic plating and disable vehicle engines.'
  }
];
