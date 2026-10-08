import { DealerCategory } from '../../models/vehicle';

/**
 * Identificadores de concesionarios clasificados en la sección de Vehículos Especiales.
 */
export const SPECIAL_DEALER_IDS = ['pegasus', 'arena_war'] as const;

/**
 * Catálogo oficial de concesionarios de GTA V / GTA Online.
 * Incluye los concesionarios generales (incluyendo Pedal and Metal Cycles) y los 2 vehículos especiales:
 * 1. Pegasus
 * 2. Arena War
 */
export const CONCESIONARIOS_GTA5: DealerCategory[] = [
  {
    id: 'legendarymotorsport',
    name: 'Legendary Motorsport',
    icon: 'fa-star',
    logoUrl: 'assets/data-images/vehicle_shops/LegendaryMotorsport-GTAV-Logo.png',
    color: '#ffb833',
    gameMode: 'both',
    description: 'Superdeportivos, exóticos de competición y vehículos de hiperlujo.'
  },
  {
    id: 'superautos',
    name: 'Southern San Andreas',
    icon: 'fa-car',
    logoUrl: 'assets/data-images/vehicle_shops/SSASA-Logo_2.png',
    color: '#3498db',
    gameMode: 'both',
    description: 'Muscle cars, compactos, sedanes, SUVs, todoterrenos y motos.'
  },
  {
    id: 'bennys',
    name: "Benny's Original MW",
    icon: 'fa-wrench',
    logoUrl: 'assets/data-images/vehicle_shops/BennysOriginalMotorWorks-GTAO-Logo.png',
    color: '#e67e22',
    gameMode: 'online',
    description: 'Taller de personalización radical, lowriders y conversiones tuners.'
  },
  {
    id: 'elitas',
    name: 'Elitas Travel',
    icon: 'fa-plane',
    logoUrl: '',
    color: '#8e44ad',
    gameMode: 'both',
    description: 'Aeronaves privadas, jets de negocios y helicópteros ejecutivos.'
  },
  {
    id: 'docktease',
    name: 'DockTease',
    icon: 'fa-ship',
    logoUrl: '',
    color: '#2980b9',
    gameMode: 'both',
    description: 'Embarcaciones náuticas, yates, lanchas rápidas y motos de agua.'
  },
  {
    id: 'warstock',
    name: 'Warstock C&C',
    icon: 'fa-bomb',
    logoUrl: '',
    color: '#c0392b',
    gameMode: 'both',
    description: 'Vehículos blindados, armamento militar pesado y maquinaria táctica.'
  },
  {
    id: 'pedal_and_metal',
    name: 'Pedal and Metal Cycles',
    icon: 'fa-bicycle',
    logoUrl: '',
    color: '#27ae60',
    gameMode: 'both',
    description: 'Bicicletas, ciclomotores y vehículos de pedal de Los Santos.'
  },
  // --- VEHÍCULOS ESPECIALES ---
  {
    id: 'pegasus',
    name: 'Pegasus',
    icon: 'fa-horse',
    logoUrl: '',
    color: '#1abc9c',
    gameMode: 'both',
    description: 'Vehículos almacenados en Pegasus: solicítelos por teléfono desde cualquier lugar.'
  },
  {
    id: 'arena_war',
    name: 'Arena War',
    icon: 'fa-skull-crossbones',
    logoUrl: '',
    color: '#e74c3c',
    gameMode: 'online',
    description: 'Vehículos modificados de combate para la Arena de Los Santos.'
  }
];
