import { DealerCategory } from '../../models/gta5/vehicle';

/**
 * Categorías oficiales y provisionales para la sección de Vehículos de GTA 6 (Offline y Online).
 * Estructura modular preparada para integrar posteriormente concesionarios específicos.
 */
export const CATEGORIAS_VEHICULOS_GTA6: DealerCategory[] = [
  {
    id: 'coches',
    name: 'Coches',
    icon: 'fa-car',
    color: '#38bdf8',
    gameMode: 'both',
    description: 'Deportivos, utilitarios, superdeportivos, berlinas y coupés del Estado de Leonida.'
  },
  {
    id: 'motos',
    name: 'Motos',
    icon: 'fa-motorcycle',
    color: '#f59e0b',
    gameMode: 'both',
    description: 'Motocicletas de carretera, deportivas, motocross y quads para Vice City.'
  },
  {
    id: 'barcos',
    name: 'Barcos',
    icon: 'fa-ship',
    color: '#06b6d4',
    gameMode: 'both',
    description: 'Embarcaciones a motor, hidrodeslizadores de pantano, lanchas y motos de agua.'
  },
  {
    id: 'aviones',
    name: 'Aviones',
    icon: 'fa-plane',
    color: '#a855f7',
    gameMode: 'both',
    description: 'Aeronaves ligeras, jets privados de negocios y avionetas de transporte.'
  },
  {
    id: 'helicopteros',
    name: 'Helicópteros',
    icon: 'fa-helicopter',
    color: '#ec4899',
    gameMode: 'both',
    description: 'Helicópteros civiles, transporte ejecutivo y aeronaves de rotor.'
  },
  {
    id: 'especiales',
    name: 'Militares y Especiales',
    icon: 'fa-shield-halved',
    color: '#ef4444',
    gameMode: 'both',
    description: 'Vehículos blindados, maquinaria táctica y prototipos especiales.'
  }
];
