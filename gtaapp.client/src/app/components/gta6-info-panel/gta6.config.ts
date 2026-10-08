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
      price: 2450000,
      priceFormatted: '$2,450,000',
      speed: 98,
      acceleration: 95,
      braking: 90,
      handling: 94,
      dealership: 'vice_luxury',
      images: ['assets/data-images/vehicles/cheetah.png'],
      description: 'La cúspide del diseño italiano con motor V12 twin-turbo adaptado para las autopistas costeras de Vice City.'
    },
    {
      id: 'gta6_v2',
      name: 'Pegassi Torero XO Vice',
      manufacturer: 'Pegassi',
      class: 'Súper',
      category: 'super',
      price: 2890000,
      priceFormatted: '$2,890,000',
      speed: 99,
      acceleration: 97,
      braking: 92,
      handling: 96,
      dealership: 'vice_luxury',
      images: ['assets/data-images/vehicles/torero.png'],
      description: 'Puertas de tijera, aerodinámica activa y aceleración brutal en Ocean Drive.'
    },
    {
      id: 'gta6_v3',
      name: 'Enus Deity Cabrio',
      manufacturer: 'Enus',
      class: 'Sedanes',
      category: 'sedans',
      price: 1650000,
      priceFormatted: '$1,650,000',
      speed: 88,
      acceleration: 85,
      braking: 84,
      handling: 86,
      dealership: 'vice_luxury',
      images: ['assets/data-images/vehicles/deity.png'],
      description: 'Lujo señorial británico con cristales tintados blindados y tapicería de cuero personalizada.'
    },
    {
      id: 'gta6_v4',
      name: 'Pfister Comet S2 Cabriolet',
      manufacturer: 'Pfister',
      class: 'Deportivos',
      category: 'sports',
      price: 1790000,
      priceFormatted: '$1,790,000',
      speed: 92,
      acceleration: 90,
      braking: 89,
      handling: 93,
      dealership: 'vice_luxury',
      images: ['assets/data-images/vehicles/comet.png'],
      description: 'Tracción total y techo descapotable para disfrutar de la brisa marina a 300 km/h.'
    }
  ],
  sunshine_autos: [
    {
      id: 'gta6_v5',
      name: 'Bravado Banshee 900R Vice',
      manufacturer: 'Bravado',
      class: 'Deportivos Clásicos',
      category: 'sports_classics',
      price: 565000,
      priceFormatted: '$565,000',
      speed: 90,
      acceleration: 88,
      braking: 82,
      handling: 85,
      dealership: 'sunshine_autos',
      images: ['assets/data-images/vehicles/banshee.png'],
      description: 'El legendario deportivo americano con franja central y motor V10 atmosférico.'
    },
    {
      id: 'gta6_v6',
      name: 'Vapid Dominator FX',
      manufacturer: 'Vapid',
      class: 'Muscle',
      category: 'muscle',
      price: 720000,
      priceFormatted: '$720,000',
      speed: 87,
      acceleration: 89,
      braking: 78,
      handling: 80,
      dealership: 'sunshine_autos',
      images: ['assets/data-images/vehicles/dominator.png'],
      description: 'Puro músculo ochentero con sobrealimentador visible y sonido ensordecedor.'
    },
    {
      id: 'gta6_v7',
      name: 'Albany Hermes Vice Edition',
      manufacturer: 'Albany',
      class: 'Muscle',
      category: 'muscle',
      price: 535000,
      priceFormatted: '$535,000',
      speed: 82,
      acceleration: 85,
      braking: 75,
      handling: 78,
      dealership: 'sunshine_autos',
      images: ['assets/data-images/vehicles/hermes.png'],
      description: 'Llamas pintadas en los guardabarros y suspensión rebajada al ras del suelo.'
    }
  ],
  ocean_drive_customs: [
    {
      id: 'gta6_v8',
      name: 'Voodoo Custom Lowrider',
      manufacturer: 'Declasse',
      class: 'Muscle',
      category: 'muscle',
      price: 420000,
      priceFormatted: '$420,000',
      speed: 78,
      acceleration: 80,
      braking: 70,
      handling: 75,
      dealership: 'ocean_drive_customs',
      images: ['assets/data-images/vehicles/voodoo.png'],
      description: 'Bombas hidráulicas de tres tiempos, interior de terciopelo y pintura tornasolada.'
    },
    {
      id: 'gta6_v9',
      name: 'Faction Custom Donk',
      manufacturer: 'Willard',
      class: 'Muscle',
      category: 'muscle',
      price: 495000,
      priceFormatted: '$495,000',
      speed: 80,
      acceleration: 78,
      braking: 72,
      handling: 73,
      dealership: 'ocean_drive_customs',
      images: ['assets/data-images/vehicles/faction.png'],
      description: 'Llantas doradas de 30 pulgadas y equipo de sonido de alta fidelidad en el maletero.'
    }
  ],
  everglades_marine: [
    {
      id: 'gta6_v10',
      name: 'Gator Airboat 400',
      manufacturer: 'Nagasaki',
      class: 'Barcos',
      category: 'boats',
      price: 210000,
      priceFormatted: '$210,000',
      speed: 85,
      acceleration: 90,
      braking: 60,
      handling: 88,
      dealership: 'everglades_marine',
      images: ['assets/data-images/vehicles/dinghy.png'],
      description: 'Motor de hélice gigante para deslizarse sobre aguas poco profundas y manglares de Grassrivers.'
    },
    {
      id: 'gta6_v11',
      name: 'Vapid Sandstorm 4x4',
      manufacturer: 'Vapid',
      class: 'Todoterrenos',
      category: 'offroad',
      price: 340000,
      priceFormatted: '$340,000',
      speed: 80,
      acceleration: 86,
      braking: 75,
      handling: 82,
      dealership: 'everglades_marine',
      images: ['assets/data-images/vehicles/sandking.png'],
      description: 'Ejes reforzados y snorkel para vadear ríos profundos en Leonard County.'
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
      images: ['assets/data-images/vehicles/supervolito.png'],
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
      images: ['assets/data-images/vehicles/dodo.png'],
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
      images: ['assets/data-images/vehicles/speeder.png'],
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
    title: 'Confianza y Plomo',
    giver: 'Lucia & Jason',
    protagonist: 'Jason / Lucia',
    location: 'Port Gellhorn',
    type: 'Prólogo / Cooperativa',
    description: 'Atraco a mano armada en la licorería de Port Gellhorn y huida coordinada esquivando el cerco policial.',
    goldRequirements: ['Tiempo menor a 05:30', 'Disparos a la cabeza: 8', 'Sin daños graves en el coche']
  },
  {
    id: 'gta6_m2',
    title: 'Luces de Ocean Drive',
    giver: 'Raul Calderon',
    protagonist: 'Lucia',
    location: 'Vice Beaches',
    type: 'Infiltración',
    description: 'Recuperar un alijo de diamantes en un hotel art déco durante una fiesta privada en la terraza.',
    goldRequirements: ['Sigilo absoluto', 'Noquear a 4 guardias', 'Escapar por los tejados']
  },
  {
    id: 'gta6_m3',
    title: 'Caimanes y Contrabando',
    giver: 'Hank "Big Gator"',
    protagonist: 'Jason',
    location: 'Grassrivers',
    type: 'Persecución en Hidrodeslizador',
    description: 'Interceptar un cargamento clandestino en los manglares pantanosos antes de que llegue a los guardacostas.',
    goldRequirements: ['Destruir 3 lanchas rivales', 'No encallar en el fango', 'Precisión de tiro: 75%']
  }
];

export const GTA6_STORY_MISSIONS_EN: Gta6Mission[] = [
  {
    id: 'gta6_m1',
    title: 'Trust & Lead',
    giver: 'Lucia & Jason',
    protagonist: 'Jason / Lucia',
    location: 'Port Gellhorn',
    type: 'Prologue / Co-op',
    description: 'Armed robbery at the Port Gellhorn liquor store and coordinated escape through the police perimeter.',
    goldRequirements: ['Time under 05:30', 'Headshots: 8', 'No critical vehicle damage']
  },
  {
    id: 'gta6_m2',
    title: 'Ocean Drive Neon',
    giver: 'Raul Calderon',
    protagonist: 'Lucia',
    location: 'Vice Beaches',
    type: 'Infiltration',
    description: 'Recover a diamond stash inside an art deco rooftop party in Ocean Drive.',
    goldRequirements: ['Pure stealth', 'Knock out 4 guards', 'Escape via rooftops']
  },
  {
    id: 'gta6_m3',
    title: 'Gators & Contraband',
    giver: 'Hank "Big Gator"',
    protagonist: 'Jason',
    location: 'Grassrivers',
    type: 'Airboat Chase',
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
    title: 'El Gran Golpe al Casino Malecón',
    location: 'Vice City Marina',
    payout: '$4,200,000',
    description: 'Infiltración marítima y asalto a la cámara acorazada durante la gala de medianoche.',
    approaches: ['Sigilo Subacuático', 'Asalto Frontal con Fumígenos'],
    setupCount: 4
  },
  {
    id: 'gta6_h2',
    title: 'Asalto a la Reserva Bancaria de Port Gellhorn',
    location: 'Port Gellhorn Industrial',
    payout: '$2,800,000',
    description: 'Inutilizar la subestación eléctrica del distrito y asaltar los furgones blindados en ruta.',
    approaches: ['Corte de Energía Táctico', 'Emboscada en Puente'],
    setupCount: 3
  }
];

export const GTA6_HEISTS_EN: Gta6Heist[] = [
  {
    id: 'gta6_h1',
    title: 'The Malecon Casino Heist',
    location: 'Vice City Marina',
    payout: '$4,200,000',
    description: 'Subaquatic infiltration and vault breach during the midnight yacht gala.',
    approaches: ['Subaquatic Stealth', 'Frontal Smoke Assault'],
    setupCount: 4
  },
  {
    id: 'gta6_h2',
    title: 'Port Gellhorn Reserve Raid',
    location: 'Port Gellhorn Industrial',
    payout: '$2,800,000',
    description: 'Black out the district power grid and intercept the armored convoy en route.',
    approaches: ['Tactical Blackout', 'Bridge Ambush'],
    setupCount: 3
  }
];

/**
 * Misterios y Secretos Demo de GTA VI
 */
export const GTA6_MYSTERIES_ES: Gta6Mystery[] = [
  {
    id: 'gta6_mys1',
    orderNum: 1,
    title: 'El Pecio del Galeón Fantasma',
    category: 'Pecios Submarinos',
    locationName: 'Cayos de Gellhorn',
    descriptionSnippet: 'Restos de un galeón español del siglo XVII con extrañas emisiones electromagnéticas a 40 metros de profundidad.',
    fullStory: 'Explorando las fosas marinas entre los cayos del sur, los buceadores han reportado luces fosforescentes parpadeantes en el casco de madera carcomida.',
    thumbnailUrl: 'assets/data-images/properties/SonarCollectionsDock-GTAV.png'
  },
  {
    id: 'gta6_mys2',
    orderNum: 2,
    title: 'El Monstruo de los Pantanos de Grassrivers',
    category: 'Criptozoología',
    locationName: 'Grassrivers Central',
    descriptionSnippet: 'Avistamiento nocturno de un caimán de proporciones colosales con marcas tribales en las escamas.',
    fullStory: 'Las leyendas locales de los tramperos de Leonida hablan de una criatura ancestral que habita el corazón inaccesible del pantano.',
    thumbnailUrl: 'assets/data-images/properties/Smoke-on-the-Water-Logo.png'
  }
];

export const GTA6_MYSTERIES_EN: Gta6Mystery[] = [
  {
    id: 'gta6_mys1',
    orderNum: 1,
    title: 'The Ghost Galleon Shipwreck',
    category: 'Underwater Shipwrecks',
    locationName: 'Gellhorn Keys',
    descriptionSnippet: 'Remains of a 17th-century Spanish galleon emitting electromagnetic pulses 40 meters underwater.',
    fullStory: 'Divers exploring southern deep ocean trenches have documented flickering bioluminescent signals inside the ancient sunken hull.',
    thumbnailUrl: 'assets/data-images/properties/SonarCollectionsDock-GTAV.png'
  },
  {
    id: 'gta6_mys2',
    orderNum: 2,
    title: 'The Grassrivers Swamp Beast',
    category: 'Cryptozoology',
    locationName: 'Grassrivers Central',
    descriptionSnippet: 'Nighttime sightings of a giant prehistoric alligator with mysterious markings along its armor.',
    fullStory: 'Local folklore among Leonida swamp trappers warns of an ancient apex predator deep in the unreachable mangroves.',
    thumbnailUrl: 'assets/data-images/properties/Smoke-on-the-Water-Logo.png'
  }
];

/**
 * Armamento Demo de GTA VI
 */
export const GTA6_WEAPONS_ES: Gta6Weapon[] = [
  {
    id: 'gta6_w1',
    name: 'Pistola Táctica 9mm',
    category: 'Pistolas',
    price: 1200,
    priceFormatted: '$1,200',
    damage: 42,
    fireRate: 65,
    accuracy: 78,
    range: 45,
    description: 'Arma corta reglamentaria con corredera aligerada y empuñadura ergonómica.'
  },
  {
    id: 'gta6_w2',
    name: 'Fusil de Asalto Leonida Carbine',
    category: 'Fusiles de Asalto',
    price: 14500,
    priceFormatted: '$14,500',
    damage: 68,
    fireRate: 80,
    accuracy: 82,
    range: 75,
    description: 'Plataforma táctica moderna con culata telescópica y raíles Picatinny para miras ópticas.'
  },
  {
    id: 'gta6_w3',
    name: 'Escopeta Corredera Marina',
    category: 'Escopetas',
    price: 4800,
    priceFormatted: '$4,800',
    damage: 88,
    fireRate: 35,
    accuracy: 40,
    range: 30,
    description: 'Tratamiento anticorrosión en níquel marino para operaciones en pantanos y alta mar.'
  }
];

export const GTA6_WEAPONS_EN: Gta6Weapon[] = [
  {
    id: 'gta6_w1',
    name: 'Tactical 9mm Pistol',
    category: 'Pistols',
    price: 1200,
    priceFormatted: '$1,200',
    damage: 42,
    fireRate: 65,
    accuracy: 78,
    range: 45,
    description: 'Standard-issue compact handgun with lightened slide and ergonomic polymer grip.'
  },
  {
    id: 'gta6_w2',
    name: 'Leonida Carbine Assault Rifle',
    category: 'Assault Rifles',
    price: 14500,
    priceFormatted: '$14,500',
    damage: 68,
    fireRate: 80,
    accuracy: 82,
    range: 75,
    description: 'Modern tactical platform featuring telescopic stock and Picatinny rails.'
  },
  {
    id: 'gta6_w3',
    name: 'Marine Pump Shotgun',
    category: 'Shotguns',
    price: 4800,
    priceFormatted: '$4,800',
    damage: 88,
    fireRate: 35,
    accuracy: 40,
    range: 30,
    description: 'Anti-corrosive marine nickel coating engineered for swampland and open sea ops.'
  }
];
