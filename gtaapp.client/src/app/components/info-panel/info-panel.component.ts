import { Component, EventEmitter, Input, Output, OnChanges, SimpleChanges, effect } from '@angular/core';
import { GtaVehicle, DealerCategory } from '../../models/vehicle';
import { GtaMission, GtaStrangerMission, StrangerSeriesGroup, GtaHeist } from '../../models/mission';
import { GtaMystery } from '../../models/mystery';
import { GtaWeapon } from '../../models/weapon';
import { VehicleService } from '../../services/vehicle.service';
import { MissionService } from '../../services/mission.service';
import { WeaponService } from '../../services/weapon.service';
import { TranslationService } from '../../i18n';

@Component({
  selector: 'app-info-panel',
  templateUrl: './info-panel.component.html',
  styleUrls: ['./info-panel.component.css'],
  standalone: false
})
export class InfoPanelComponent implements OnChanges {
  @Input() isOpen = false;
  @Input() game: 'gta5' | 'gta6' = 'gta5';
  @Input() gameMode: 'story' | 'online' = 'online';
  @Output() closeDrawer = new EventEmitter<void>();
  @Output() locateOnMap = new EventEmitter<any>();

  // Cache fields to prevent NG0103 Infinite Change Detection
  private readonly onlineDrawerTabs = [
    { id: 'vehiculos', label: 'Vehículos', icon: 'fa-car-side' },
    { id: 'armas', label: 'Armas', icon: 'fa-gun' },
    { id: 'misiones', label: 'Misiones', icon: 'fa-bullseye' },
    { id: 'golpes', label: 'Golpes', icon: 'fa-sack-dollar' },
    { id: 'misterios', label: 'Misterios', icon: 'fa-user-secret' },
  ];
  private readonly storyDrawerTabs = [
    { id: 'vehiculos', label: 'Vehículos', icon: 'fa-car-side' },
    { id: 'armas', label: 'Armas', icon: 'fa-gun' },
    { id: 'misiones', label: 'Misiones', icon: 'fa-bullseye' },
    { id: 'strangers', label: 'Extraños y Locos', icon: 'fa-mask' },
    { id: 'misterios', label: 'Misterios', icon: 'fa-user-secret' },
  ];

  private _cachedVisDealersKey = '';
  private _cachedVisDealers: DealerCategory[] = [];
  private _cachedDealCatKey = '';
  private _cachedDealCat: { id: string; name: string; count: number; icon: string }[] = [];
  private _cachedFDVKey = '';
  private _cachedFDV: GtaVehicle[] = [];
  private _cachedFSMKey = '';
  private _cachedFSM: GtaMission[] = [];
  private _cachedOCLKey = '';
  private _cachedOCL: { id: string; name: string; count: number; icon: string; color: string }[] = [];
  private _cachedOCatKey = '';
  private _cachedOCat: string[] = [];
  private _cachedFOMKey = '';
  private _cachedFOM: GtaMission[] = [];
  private _cachedSSLKey = '';
  private _cachedSSL: { id: string; name: string; count: number; icon: string; color: string }[] = [];
  private _cachedFStMKey = '';
  private _cachedFStM: GtaStrangerMission[] = [];
  private _cachedFSSGKey = '';
  private _cachedFSSG: StrangerSeriesGroup[] = [];
  private _cachedFOHKey = '';
  private _cachedFOH: GtaHeist[] = [];
  private _cachedFOMysKey = '';
  private _cachedFOMys: GtaMystery[] = [];
  private _cachedFWKey = '';
  private _cachedFW: GtaWeapon[] = [];
  private _cachedWCLKey = '';
  private _cachedWCL: { id: string; name: string; count: number; icon: string }[] = [];
  private _cachedDealerDesc: { [id: string]: string } = {};

  // Tabs del drawer según el modo de juego
  get drawerTabs(): { id: string; label: string; icon: string }[] {
    return this.gameMode === 'online' ? this.onlineDrawerTabs : this.storyDrawerTabs;
  }
  activeDrawerTab = 'vehiculos';

  // Golpes GTA Online (Heists)
  onlineHeists: GtaHeist[] = [];
  heistsLoading = false;
  heistsError = false;
  heistSearchQuery = '';
  selectedHeistCategoryFilter = 'all'; // 'all' | 'classic' | 'doomsday' | 'casino' | 'cayo_perico' | 'raid'
  selectedHeist: GtaHeist | null = null;

  // Misiones GTA Online (Contactos y Operaciones)
  onlineMissions: GtaMission[] = [];
  onlineMissionsLoading = false;
  onlineMissionsError = false;
  onlineMissionSearchQuery = '';
  selectedOnlineContactFilter = 'all'; // 'all' | 'gerald' | 'simeon' | 'lamar' | 'lester' | 'madrazo' | 'trevor' | 'agatha' | 'special'
  selectedOnlineCategoryFilter = 'all';

  // Misiones Modo Historia (Campaña Principal)
  storyMissions: GtaMission[] = [];
  missionsLoading = false;
  missionsError = false;
  missionSearchQuery = '';
  selectedCharacterFilter = 'all'; // 'all' | 'franklin' | 'michael' | 'trevor' | 'heists'
  expandedMissionId: string | null = null;

  // Extraños y Locos Modo Historia (Secundarias / Strangers & Freaks)
  strangerMissions: GtaStrangerMission[] = [];
  strangersLoading = false;
  strangersError = false;
  strangerSearchQuery = '';
  selectedStrangerCharacterFilter = 'all'; // 'all' | 'franklin' | 'michael' | 'trevor'
  selectedStrangerSeriesFilter = 'all'; // 'all' | id de serie
  strangerOnly100Filter = false;
  strangerSeriesViewMode: 'series' | 'list' = 'series';
  selectedStranger: GtaStrangerMission | null = null;
  expandedStrangerSeries: { [seriesId: string]: boolean } = {};

  // Misterios GTA Online / San Andreas
  onlineMysteries: GtaMystery[] = [];
  mysteriesLoading = false;
  mysteriesError = false;
  mysterySearchQuery = '';
  selectedMysteryCategoryFilter = 'all'; // 'all' | 'paranormal' | 'conspiracy' | 'crimes' | 'easter_egg'
  selectedMystery: GtaMystery | null = null;

  // Armas GTA V / GTA Online
  weapons: GtaWeapon[] = [];
  weaponsLoading = false;
  weaponsError = false;
  weaponSearchQuery = '';
  selectedWeaponCategory = 'all';
  selectedWeaponSort: 'none' | 'damage' | 'fireRate' | 'accuracy' | 'range' | 'price' = 'none';
  selectedWeapon: GtaWeapon | null = null;

  // Vista activa del drawer: 'tabs' | 'dealer-grid' | 'vehicle-detail' | 'mission-detail' | 'stranger-detail' | 'heist-detail' | 'mystery-detail' | 'weapon-detail'
  drawerView: 'tabs' | 'dealer-grid' | 'vehicle-detail' | 'mission-detail' | 'stranger-detail' | 'heist-detail' | 'mystery-detail' | 'weapon-detail' = 'tabs';
  selectedMission: GtaMission | null = null;

  // Concesionario actualmente abierto en la vista de grid
  activeDealerId: string | null = null;
  activeDealerName: string = '';

  // Vehículos del concesionario activo
  dealerVehicles: GtaVehicle[] = [];
  vehiclesLoading = false;
  vehiclesError = false;

  // Vehículo seleccionado en el grid
  selectedVehicle: GtaVehicle | null = null;

  // Cache de vehículos por concesionario
  private vehicleCache: { [dealerId: string]: GtaVehicle[] } = {};

  // Pestaña de categoría de vehículos activa ('all' o clase específica)
  selectedVehicleClass: string = 'all';

  // Criterio de ordenación / filtro por estadísticas de vehículo ('none' | 'acceleration' | 'speed' | 'braking' | 'handling')
  selectedVehicleSort: 'none' | 'acceleration' | 'speed' | 'braking' | 'handling' = 'none';

  // Buscador de vehículos dentro del catálogo del concesionario
  dealerVehicleSearchQuery: string = '';

  // Definición centralizada de concesionarios
  readonly dealers: DealerCategory[] = [
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
    {
      id: 'arena_war',
      name: 'Arena War',
      icon: 'fa-skull-crossbones',
      logoUrl: '',
      color: '#e74c3c',
      gameMode: 'online',
      description: 'Vehículos modificados de combate para la Arena de Los Santos.'
    },
    {
      id: 'especiales',
      name: 'Vehículos Especiales',
      icon: 'fa-wand-magic-sparkles',
      logoUrl: '',
      color: '#9b59b6',
      gameMode: 'both',
      description: 'Vehículos únicos, de misión, de evento o de acceso especial.'
    },
    {
      id: 'pegasus',
      name: 'Pegasus',
      icon: 'fa-horse',
      logoUrl: '',
      color: '#1abc9c',
      gameMode: 'online',
      description: 'Vehículos almacenados en Pegasus: solicítelos por teléfono desde cualquier lugar.'
    },
  ];

  readonly gta6DealersEn: DealerCategory[] = [
    {
      id: 'vice_luxury',
      name: 'Vice Luxury Autos',
      icon: 'fa-gem',
      logoUrl: '',
      color: '#ff4fe0',
      gameMode: 'both',
      description: 'Modern exotic supercars, luxury cabriolets and hyper-luxury hypercars.'
    },
    {
      id: 'sunshine_autos',
      name: 'Sunshine Autos',
      icon: 'fa-car-side',
      logoUrl: '',
      color: '#00cec9',
      gameMode: 'both',
      description: 'The legendary Vice City dealership: sports cars, vintage muscle and timeless classics.'
    },
    {
      id: 'ocean_drive_customs',
      name: 'Ocean Drive Customs',
      icon: 'fa-wrench',
      logoUrl: '',
      color: '#e84393',
      gameMode: 'both',
      description: 'Radical custom shop, hydraulic suspensions and street modifications in Ocean Beach.'
    },
    {
      id: 'everglades_marine',
      name: 'Everglades Marine & Off-Road',
      icon: 'fa-ship',
      logoUrl: '',
      color: '#00b894',
      gameMode: 'both',
      description: 'Swamp airboats, high-speed contraband watercraft and lifted 4x4 off-road pickups.'
    },
    {
      id: 'leonida_aviation',
      name: 'Leonida Aviation & Military',
      icon: 'fa-plane',
      logoUrl: '',
      color: '#6c5ce7',
      gameMode: 'both',
      description: 'Corporate executive jets, VIP helicopters and tactical transport aircraft in Leonida.'
    },
    {
      id: 'gta6_especiales',
      name: 'Leonida Special Vehicles',
      icon: 'fa-wand-magic-sparkles',
      logoUrl: '',
      color: '#fd79a8',
      gameMode: 'both',
      description: 'Unique event vehicles, co-op heist transports and prototype customs exclusive to Vice City.'
    }
  ];

  readonly gta6DealersEs: DealerCategory[] = [
    {
      id: 'vice_luxury',
      name: 'Vice Luxury Autos',
      icon: 'fa-gem',
      logoUrl: '',
      color: '#ff4fe0',
      gameMode: 'both',
      description: 'Superdeportivos exóticos modernos, descapotables de alta gama y bólidos de hiperlujo.'
    },
    {
      id: 'sunshine_autos',
      name: 'Sunshine Autos',
      icon: 'fa-car-side',
      logoUrl: '',
      color: '#00cec9',
      gameMode: 'both',
      description: 'El concesionario legendario de Vice City: deportivos, muscle cars y clásicos de época.'
    },
    {
      id: 'ocean_drive_customs',
      name: 'Ocean Drive Customs',
      icon: 'fa-wrench',
      logoUrl: '',
      color: '#e84393',
      gameMode: 'both',
      description: 'Taller de personalización radical, suspensiones hidráulicas y modificaciones en Ocean Beach.'
    },
    {
      id: 'everglades_marine',
      name: 'Everglades Marine & Off-Road',
      icon: 'fa-ship',
      logoUrl: '',
      color: '#00b894',
      gameMode: 'both',
      description: 'Hidrodeslizadores de pantano, lanchas rápidas de contrabando y pickups todoterreno.'
    },
    {
      id: 'leonida_aviation',
      name: 'Leonida Aviation & Military',
      icon: 'fa-plane',
      logoUrl: '',
      color: '#6c5ce7',
      gameMode: 'both',
      description: 'Aeronaves de negocios, helicópteros ejecutivos y transportes tácticos de Leonida.'
    },
    {
      id: 'gta6_especiales',
      name: 'Vehículos Especiales de Leonida',
      icon: 'fa-wand-magic-sparkles',
      logoUrl: '',
      color: '#fd79a8',
      gameMode: 'both',
      description: 'Vehículos únicos de eventos, atracos cooperativos y prototipos exclusivos de Vice City.'
    }
  ];

  readonly gta6Dealers: DealerCategory[] = this.gta6DealersEn;

  private readonly gta6VehiclesByDealer: { [dealerId: string]: GtaVehicle[] } = {
    vice_luxury: [
      { id: 'gta6_v1', name: 'Grotti Cheetah GTS', manufacturer: 'Grotti', class: 'Súper', category: 'super', price: 2450000, priceTrade: 1850000, priceFormatted: '$2,450,000', speed: 98, acceleration: 95, braking: 90, handling: 92, weaponized: false, dealership: 'vice_luxury', gameMode: 'both', imageUrl: '' },
      { id: 'gta6_v2', name: 'Pegassi Torero XO Vice', manufacturer: 'Pegassi', class: 'Súper', category: 'super', price: 2890000, priceTrade: 2150000, priceFormatted: '$2,890,000', speed: 99, acceleration: 97, braking: 88, handling: 94, weaponized: false, dealership: 'vice_luxury', gameMode: 'both', imageUrl: '' },
      { id: 'gta6_v3', name: 'Overflod Entity MT Cabrio', manufacturer: 'Overflod', class: 'Súper', category: 'super', price: 2350000, priceTrade: 1750000, priceFormatted: '$2,350,000', speed: 96, acceleration: 94, braking: 92, handling: 90, weaponized: false, dealership: 'vice_luxury', gameMode: 'both', imageUrl: '' },
      { id: 'gta6_v4', name: 'Pfister Comet S2 Cabriolet', manufacturer: 'Pfister', class: 'Deportivos', category: 'sports', price: 1790000, priceTrade: 1340000, priceFormatted: '$1,790,000', speed: 92, acceleration: 90, braking: 89, handling: 93, weaponized: false, dealership: 'vice_luxury', gameMode: 'both', imageUrl: '' }
    ],
    sunshine_autos: [
      { id: 'gta6_v5', name: 'Bravado Banshee 900R', manufacturer: 'Bravado', class: 'Deportivos Clásicos', category: 'sports_classics', price: 565000, priceTrade: 420000, priceFormatted: '$565,000', speed: 90, acceleration: 88, braking: 82, handling: 85, weaponized: false, dealership: 'sunshine_autos', gameMode: 'both', imageUrl: '' },
      { id: 'gta6_v6', name: 'Vapid Dominator FX', manufacturer: 'Vapid', class: 'Muscle', category: 'muscle', price: 720000, priceTrade: 540000, priceFormatted: '$720,000', speed: 87, acceleration: 89, braking: 78, handling: 80, weaponized: false, dealership: 'sunshine_autos', gameMode: 'both', imageUrl: '' },
      { id: 'gta6_v7', name: 'Albany Hermes Vice Edition', manufacturer: 'Albany', class: 'Muscle', category: 'muscle', price: 535000, priceTrade: 395000, priceFormatted: '$535,000', speed: 82, acceleration: 85, braking: 75, handling: 78, weaponized: false, dealership: 'sunshine_autos', gameMode: 'both', imageUrl: '' },
      { id: 'gta6_v8', name: 'Declasse Sabre Turbo Custom', manufacturer: 'Declasse', class: 'Muscle', category: 'muscle', price: 490000, priceTrade: 360000, priceFormatted: '$490,000', speed: 84, acceleration: 86, braking: 76, handling: 79, weaponized: false, dealership: 'sunshine_autos', gameMode: 'both', imageUrl: '' }
    ],
    ocean_drive_customs: [
      { id: 'gta6_v9', name: 'Voodoo Custom Lowrider', manufacturer: 'Declasse', class: 'Muscle', category: 'muscle', price: 420000, priceTrade: 315000, priceFormatted: '$420,000', speed: 78, acceleration: 80, braking: 72, handling: 82, weaponized: false, dealership: 'ocean_drive_customs', gameMode: 'both', imageUrl: '' },
      { id: 'gta6_v10', name: 'Karin Sultan RS Twin Turbo', manufacturer: 'Karin', class: 'Deportivos', category: 'sports', price: 795000, priceTrade: 595000, priceFormatted: '$795,000', speed: 91, acceleration: 93, braking: 88, handling: 91, weaponized: false, dealership: 'ocean_drive_customs', gameMode: 'both', imageUrl: '' },
      { id: 'gta6_v11', name: 'Dinka Jester RR Vice Drift', manufacturer: 'Dinka', class: 'Deportivos', category: 'sports', price: 1970000, priceTrade: 1470000, priceFormatted: '$1,970,000', speed: 93, acceleration: 91, braking: 89, handling: 95, weaponized: false, dealership: 'ocean_drive_customs', gameMode: 'both', imageUrl: '' }
    ],
    everglades_marine: [
      { id: 'gta6_v12', name: 'Swamp Airboat Everglades', manufacturer: 'Nagasaki', class: 'Barcos', category: 'boats', price: 185000, priceTrade: 135000, priceFormatted: '$185,000', speed: 75, acceleration: 85, braking: 60, handling: 88, weaponized: false, dealership: 'everglades_marine', gameMode: 'both', imageUrl: '' },
      { id: 'gta6_v13', name: 'Shitzu Tropic Speedboat', manufacturer: 'Shitzu', class: 'Barcos', category: 'boats', price: 420000, priceTrade: 310000, priceFormatted: '$420,000', speed: 88, acceleration: 82, braking: 70, handling: 84, weaponized: false, dealership: 'everglades_marine', gameMode: 'both', imageUrl: '' },
      { id: 'gta6_v14', name: 'Canis Kamacho 4x4 Everglades', manufacturer: 'Canis', class: 'Todoterrenos', category: 'offroad', price: 345000, priceTrade: 260000, priceFormatted: '$345,000', speed: 80, acceleration: 86, braking: 78, handling: 85, weaponized: false, dealership: 'everglades_marine', gameMode: 'both', imageUrl: '' }
    ],
    leonida_aviation: [
      { id: 'gta6_v15', name: 'Buckingham SuperVolito Carbon', manufacturer: 'Buckingham', class: 'Helicópteros', category: 'helicopters', price: 2110000, priceTrade: 1580000, priceFormatted: '$2,110,000', speed: 94, acceleration: 90, braking: 85, handling: 92, weaponized: false, dealership: 'leonida_aviation', gameMode: 'both', imageUrl: '' },
      { id: 'gta6_v16', name: 'Buckingham Nimbus Executive Jet', manufacturer: 'Buckingham', class: 'Aviones', category: 'planes', price: 1900000, priceTrade: 1420000, priceFormatted: '$1,900,000', speed: 97, acceleration: 88, braking: 80, handling: 86, weaponized: false, dealership: 'leonida_aviation', gameMode: 'both', imageUrl: '' }
    ],
    gta6_especiales: [
      { id: 'gta6_v17', name: 'HVY Nightshark Vice Enforcer', manufacturer: 'HVY', class: 'Militares', category: 'military', price: 1245000, priceTrade: 935000, priceFormatted: '$1,245,000', speed: 82, acceleration: 84, braking: 86, handling: 88, weaponized: true, dealership: 'gta6_especiales', gameMode: 'both', imageUrl: '' }
    ]
  };

  private readonly gta6StoryMissionsEn: GtaMission[] = [
    { id: 'gta6_m1', order: 1, title: 'Liquor Store Robbery', category: 'jason_lucia', character: 'Lucia', giver: 'Lucia Caminos', goldRequirements: ['Record Time: < 3:30', '10 Headshots', 'Clean Getaway (No Damage)'], description: 'Jason and Lucia hold up a liquor store in the outskirts of Port Gellhorn and evade the arriving state police patrol.', reward: '$12,500' },
    { id: 'gta6_m2', order: 2, title: 'Port Gellhorn Getaway', category: 'jason_lucia', character: 'Jason', giver: 'Jason Duval', goldRequirements: ['Accuracy > 75%', 'Lose 3-Star Wanted Level', 'No Medkits Used'], description: 'High-speed escape along the interstate highway dodging tactical roadblocks set up by Leonida State Police.', reward: '$18,000' },
    { id: 'gta6_m3', order: 3, title: 'Smuggling in the Keys', category: 'operations', character: 'Jason', giver: 'Captain Raúl', goldRequirements: ['Arrive at Dock on Time', 'Sink Pursuing Gunboats', 'Recover Cargo 100% Intact'], description: 'Nighttime maritime contraband run through the treacherous Leonida Keys during a tropical storm.', reward: '$35,000' },
    { id: 'gta6_m4', order: 4, title: 'Starfish Island Infiltration', category: 'vice_city', character: 'Lucia', giver: 'Lucia Caminos', goldRequirements: ['No Alarms Triggered', 'Crack Master Vault', 'Water Exfiltration'], description: 'Stealth raid on a cartel boss mansion on the ultra-luxury Starfish Island in Vice City.', reward: '$60,000' }
  ];

  private readonly gta6StoryMissionsEs: GtaMission[] = [
    { id: 'gta6_m1', order: 1, title: 'El Golpe a la Licorería', category: 'jason_lucia', character: 'Lucia', giver: 'Lucia Caminos', goldRequirements: ['Tiempo récord: < 3:30', '10 tiros a la cabeza', 'Sin daños en la huida'], description: 'Jason y Lucia asaltan una licorería en las afueras de Port Gellhorn y escapan de la patrulla policial.', reward: '$12,500' },
    { id: 'gta6_m2', order: 2, title: 'Escape de Port Gellhorn', category: 'jason_lucia', character: 'Jason', giver: 'Jason Duval', goldRequirements: ['Precisión > 75%', 'Pierde 3 estrellas de búsqueda', 'Sin usar botiquines'], description: 'Huida a alta velocidad por la autopista interestatal esquivando bloqueos de la policía estatal.', reward: '$18,000' },
    { id: 'gta6_m3', order: 3, title: 'Contrabando en los Cayos', category: 'operations', character: 'Jason', giver: 'Capitán Raúl', goldRequirements: ['Llega a tiempo al muelle', 'Destruye las lanchas perseguidoras', 'Recupera el alijo intacto'], description: 'Transporte marítimo nocturno a través de los Cayos de Leonida bajo tormenta tropical.', reward: '$35,000' },
    { id: 'gta6_m4', order: 4, title: 'Infiltración en Starfish Island', category: 'vice_city', character: 'Lucia', giver: 'Lucia Caminos', goldRequirements: ['Sin activar alarmas', 'Roba la caja fuerte principal', 'Escape por agua'], description: 'Asalto sigiloso a una mansión de un magnate en la exclusiva isla de Starfish Island en Vice City.', reward: '$60,000' }
  ];

  private readonly gta6HeistsEn: GtaHeist[] = [
    {
      id: 'gta6_h1',
      order: 1,
      title: 'Vice City Central Bank Heist',
      titleEn: 'Vice City Central Bank Heist',
      category: 'classic',
      categoryLabel: 'Classic Heists',
      giver: 'Vice Syndicate',
      players: '2-4 Players',
      minLevel: 25,
      propertyRequired: 'Vice Beach Safehouse',
      setupCost: 50000,
      setupCostFormatted: '$50,000',
      potentialTake: { normal: '$3,500,000', hard: '$4,800,000', description: 'Gold Bullion & Foreign Currency' },
      target: 'Central Bank Vault',
      location: 'Vice City Financial District',
      description: 'Infiltration through ventilation shafts and thermite assault on the financial district primary vault.',
      thumbnail: '',
      badgeColor: '#ff4fe0',
      badgeIcon: 'fa-building-columns',
      eliteChallenges: ['Complete in under 10:30', 'Zero Hostage Casualties', 'No Team Deaths'],
      setupMissions: [
        { name: 'Security Blueprints', description: 'Financial tower server room hack' },
        { name: 'Thermite Drill & C4', description: 'Heavy industrial breaching equipment theft' },
        { name: 'Getaway Speedboats', description: 'Canal speedboats preparation and tuning' }
      ]
    },
    {
      id: 'gta6_h2',
      order: 2,
      title: 'Starfish Island Mansion Raid',
      titleEn: 'Starfish Island Mansion Raid',
      category: 'casino',
      categoryLabel: 'Elite Incursions',
      giver: 'Lucia & Contacts',
      players: '1-4 Players',
      minLevel: 30,
      propertyRequired: 'Operations Yacht',
      setupCost: 65000,
      setupCostFormatted: '$65,000',
      potentialTake: { normal: '$2,200,000', hard: '$3,100,000', description: 'Master Art Collection & Raw Diamonds' },
      target: 'Cartel Underground Vault',
      location: 'Starfish Island, Vice City',
      description: 'Theft of priceless fine art, jewels and bearer bonds from a heavily guarded luxury mansion in Starfish Island.',
      thumbnail: '',
      badgeColor: '#00cec9',
      badgeIcon: 'fa-gem',
      eliteChallenges: ['Complete without triggering alarms', 'Steal all 4 rare paintings', 'Clean boat exfiltration'],
      setupMissions: [
        { name: 'Catering Disguises', description: 'Infiltration with forged credentials' },
        { name: 'Coastal Radar Jammer', description: 'Disabling coast guard radar stations' }
      ]
    },
    {
      id: 'gta6_h3',
      order: 3,
      title: 'Everglades Smuggling Raid',
      titleEn: 'Everglades Smuggling Raid',
      category: 'raid',
      categoryLabel: 'Special Operations',
      giver: 'Jason Duval',
      players: '1-4 Players',
      minLevel: 15,
      propertyRequired: 'Covert Swamp Hangar',
      setupCost: 35000,
      setupCostFormatted: '$35,000',
      potentialTake: { normal: '$1,800,000', hard: '$2,500,000', description: 'High-Purity Contraband Crates' },
      target: 'Everglades Cargo Depot',
      location: 'Everglades National Park',
      description: 'Tactical assault on a clandestine hangar in the deep Leonida swamplands utilizing armed airboats.',
      thumbnail: '',
      badgeColor: '#00b894',
      badgeIcon: 'fa-boxes-stacked',
      eliteChallenges: ['Complete in under 8:00', 'Destroy all pursuit gunships', 'Cargo damage < 5%'],
      setupMissions: [
        { name: 'Tactical Airboats', description: 'Acquiring modified swamp combat airboats' },
        { name: 'Comm Array Blackout', description: 'Sabotaging the swamp microwave repeater tower' }
      ]
    }
  ];

  private readonly gta6HeistsEs: GtaHeist[] = [
    {
      id: 'gta6_h1',
      order: 1,
      title: 'Atraco al Banco Central de Vice City',
      titleEn: 'Vice City Central Bank Heist',
      category: 'classic',
      categoryLabel: 'Golpes Clásicos',
      giver: 'Vice Syndicate',
      players: '2-4 Jugadores',
      minLevel: 25,
      propertyRequired: 'Piso Franco de Vice Beach',
      setupCost: 50000,
      setupCostFormatted: '$50,000',
      potentialTake: { normal: '$3,500,000', hard: '$4,800,000', description: 'Lingotes de oro y moneda extranjera' },
      target: 'Cámara Acorazada del Banco Central',
      location: 'Distrito Financiero de Vice City',
      description: 'Infiltración por los conductos de ventilación y asalto a la cámara acorazada del distrito financiero.',
      thumbnail: '',
      badgeColor: '#ff4fe0',
      badgeIcon: 'fa-building-columns',
      eliteChallenges: ['Completar en menos de 10:30', 'Cero bajas de rehenes', 'Nadie cae en el equipo'],
      setupMissions: [
        { name: 'Planos de Seguridad', description: 'Hackeo de servidores en la torre financiera' },
        { name: 'Taladro Térmico y C4', description: 'Robo de equipamiento industrial pesado' },
        { name: 'Vehículos de Escape', description: 'Preparación de lanchas rápidas en el canal' }
      ]
    },
    {
      id: 'gta6_h2',
      order: 2,
      title: 'Asalto a la Mansión de Starfish Island',
      titleEn: 'Starfish Island Mansion Raid',
      category: 'casino',
      categoryLabel: 'Incursiones de Élite',
      giver: 'Lucia & Contactos',
      players: '1-4 Jugadores',
      minLevel: 30,
      propertyRequired: 'Yate de Operaciones',
      setupCost: 65000,
      setupCostFormatted: '$65,000',
      potentialTake: { normal: '$2,200,000', hard: '$3,100,000', description: 'Colección de arte y diamantes en bruto' },
      target: 'Caja Fuerte Subterránea del Cartel',
      location: 'Starfish Island, Vice City',
      description: 'Robo de obras de arte, joyas y alijos de dinero en una de las mansiones más protegidas de Vice City.',
      thumbnail: '',
      badgeColor: '#00cec9',
      badgeIcon: 'fa-gem',
      eliteChallenges: ['Completar sin activar alarmas', 'Roba las 4 pinturas raras', 'Escape limpio'],
      setupMissions: [
        { name: 'Disfraces del Catering', description: 'Infiltración con acreditaciones falsas' },
        { name: 'Inhibidor de Radar', description: 'Desactivación de radares costeros' }
      ]
    },
    {
      id: 'gta6_h3',
      order: 3,
      title: 'Operación Contrabando Everglades',
      titleEn: 'Everglades Smuggling Raid',
      category: 'raid',
      categoryLabel: 'Operaciones Especiales',
      giver: 'Jason Duval',
      players: '1-4 Jugadores',
      minLevel: 15,
      propertyRequired: 'Hangar Clandestino de Pantano',
      setupCost: 35000,
      setupCostFormatted: '$35,000',
      potentialTake: { normal: '$1,800,000', hard: '$2,500,000', description: 'Cargas de contrabando de alta pureza' },
      target: 'Depósito de Carga de los Everglades',
      location: 'Parque Nacional de los Everglades',
      description: 'Asalto a un hangar clandestino en medio de los pantanos de Leonida utilizando hidrodeslizadores.',
      thumbnail: '',
      badgeColor: '#00b894',
      badgeIcon: 'fa-boxes-stacked',
      eliteChallenges: ['Completar en menos de 8:00', 'Destruye todos los helicópteros de persecución', 'Daño al alijo < 5%'],
      setupMissions: [
        { name: 'Rápido Hidrodeslizador', description: 'Adquisición de transporte táctico de pantano' },
        { name: 'Bloqueo de Comunicaciones', description: 'Sabotaje a la antena repetidora' }
      ]
    }
  ];

  private readonly gta6MysteriesEn: GtaMystery[] = [
    {
      id: 'gta6_mys1',
      order: 1,
      title: 'Leonida Bermuda Triangle',
      titleEn: 'Leonida Bermuda Triangle',
      category: 'paranormal',
      categoryLabel: 'Paranormal',
      location: 'Atlantic Ocean (Southeast of Vice City)',
      zone: 'Leonida Waters',
      position: { x: 3450, y: -4120, z: 0 },
      description: 'Magnetic anomalies, spinning compasses, and instrument blackouts when navigating southeast of the Keys.',
      lore: 'Since colonial times, sailors and seaplane pilots have reported lost time and glowing underwater phenomena around Leonida maritime coordinates.',
      thumbnail: '',
      badgeColor: '#ff4fe0',
      badgeIcon: 'fa-compass',
      badgeSymbol: '⚠️',
      gameMode: 'both'
    },
    {
      id: 'gta6_mys2',
      order: 2,
      title: 'Everglades Swamp Creature',
      titleEn: 'Everglades Swamp Creature',
      category: 'paranormal',
      categoryLabel: 'Cryptozoology',
      location: 'Everglades (Leonida)',
      zone: 'Everglades National Park',
      position: { x: -2100, y: 1540, z: 5 },
      description: 'Sightings of an imposing bipedal creature emerging from the thick night fog in the Everglades National Park.',
      lore: 'Local alligator hunters whisper stories of an elusive 8-foot beast that stalks the most inaccessible swamps and bayous.',
      thumbnail: '',
      badgeColor: '#00b894',
      badgeIcon: 'fa-paw',
      badgeSymbol: '🐊',
      gameMode: 'both'
    },
    {
      id: 'gta6_mys3',
      order: 3,
      title: 'Sunken Spanish Galleon',
      titleEn: 'Sunken Spanish Galleon',
      category: 'easter_egg',
      categoryLabel: 'Treasures & Shipwrecks',
      location: 'Coral Reef (Leonida Keys)',
      zone: 'Leonida Keys',
      position: { x: 1850, y: -5600, z: -35 },
      description: 'Submerged 17th-century galleon wreck containing gold doubloons, pirate chests, and antique naval cannons.',
      lore: 'The royal galleon "Nuestra Señora de la Victoria" sank during a 1684 hurricane carrying Spanish crown treasures.',
      thumbnail: '',
      badgeColor: '#00cec9',
      badgeIcon: 'fa-anchor',
      badgeSymbol: '⚓',
      gameMode: 'both'
    }
  ];

  private readonly gta6MysteriesEs: GtaMystery[] = [
    {
      id: 'gta6_mys1',
      order: 1,
      title: 'El Triángulo de las Bermudas de Leonida',
      titleEn: 'Leonida Bermuda Triangle',
      category: 'paranormal',
      categoryLabel: 'Paranormal',
      location: 'Océano Atlántico (Sureste de Vice City)',
      zone: 'Leonida Waters',
      position: { x: 3450, y: -4120, z: 0 },
      description: 'Anomalías magnéticas, brújulas descontroladas e instrumentos que fallan al navegar por el sureste de los Cayos.',
      lore: 'Desde tiempos coloniales, marineros y pilotos de aerotaxis afirman haber perdido la noción del tiempo y presenciado luces subacuáticas fluorescentes en las coordenadas marítimas de Leonida.',
      thumbnail: '',
      badgeColor: '#ff4fe0',
      badgeIcon: 'fa-compass',
      badgeSymbol: '⚠️',
      gameMode: 'both'
    },
    {
      id: 'gta6_mys2',
      order: 2,
      title: 'El Monstruo de los Pantanos de Leonida',
      titleEn: 'Everglades Swamp Creature',
      category: 'paranormal',
      categoryLabel: 'Criptozoología',
      location: 'Everglades (Leonida)',
      zone: 'Everglades National Park',
      position: { x: -2100, y: 1540, z: 5 },
      description: 'Avistamientos de una criatura descomunal entre la niebla nocturna del Parque Nacional de los Everglades.',
      lore: 'Mitos locales de cazadores de caimanes describen una silueta bípeda de más de 2.5 metros que habita en las ciénagas más profundas e inaccesibles.',
      thumbnail: '',
      badgeColor: '#00b894',
      badgeIcon: 'fa-paw',
      badgeSymbol: '🐊',
      gameMode: 'both'
    },
    {
      id: 'gta6_mys3',
      order: 3,
      title: 'El Galeón Español Hundido',
      titleEn: 'Sunken Spanish Galleon',
      category: 'easter_egg',
      categoryLabel: 'Tesoros y Naufragios',
      location: 'Arrecife de Coral (Leonida Keys)',
      zone: 'Leonida Keys',
      position: { x: 1850, y: -5600, z: -35 },
      description: 'Pecio sumergido de un navío del siglo XVII con lingotes de oro y cofres piratas en el lecho marino.',
      lore: 'El navío "Nuestra Señora de la Victoria" naufragó durante un huracán en 1684 cargado con tributos de la corona. Sus restos aún guardan cofres sellados bajo los arrecifes.',
      thumbnail: '',
      badgeColor: '#00cec9',
      badgeIcon: 'fa-anchor',
      badgeSymbol: '⚓',
      gameMode: 'both'
    }
  ];

  private readonly gta6WeaponsEn: GtaWeapon[] = [
    {
      id: 'gta6_w1',
      order: 1,
      name: 'Tactical 9mm Pistol',
      nameEn: 'Tactical 9mm Pistol',
      category: 'pistols',
      categoryLabel: 'Pistols',
      manufacturer: 'Hawk & Little',
      price: 1200,
      priceFormatted: '$1,200',
      rankUnlock: 1,
      damage: 4.2,
      fireRate: 5.0,
      accuracy: 6.5,
      range: 4.0,
      description: 'Standard issue sidearm with lightened slide and suppressor threading support.',
      icon: 'fa-gun',
      badgeColor: '#ff4fe0',
      gameMode: 'both'
    },
    {
      id: 'gta6_w2',
      order: 2,
      name: 'Vice Micro SMG',
      nameEn: 'Vice Micro SMG',
      category: 'smgs',
      categoryLabel: 'SMGs',
      manufacturer: 'Shrewsbury',
      price: 4800,
      priceFormatted: '$4,800',
      rankUnlock: 5,
      damage: 3.8,
      fireRate: 8.5,
      accuracy: 5.5,
      range: 4.5,
      description: 'Compact high fire rate submachine gun optimized for drive-bys and vehicle combat.',
      icon: 'fa-gun',
      badgeColor: '#00cec9',
      gameMode: 'both'
    },
    {
      id: 'gta6_w3',
      order: 3,
      name: 'Leonida Assault Carbine',
      nameEn: 'Leonida Assault Carbine',
      category: 'rifles',
      categoryLabel: 'Rifles',
      manufacturer: 'Vom Feuer',
      price: 14500,
      priceFormatted: '$14,500',
      rankUnlock: 12,
      damage: 6.2,
      fireRate: 6.5,
      accuracy: 7.5,
      range: 7.0,
      description: 'Military-grade assault rifle with collapsible stock and reflex optic for mid-to-long range combat.',
      icon: 'fa-gun',
      badgeColor: '#fd79a8',
      gameMode: 'both'
    },
    {
      id: 'gta6_w4',
      order: 4,
      name: 'Marine Pump Shotgun',
      nameEn: 'Marine Pump Shotgun',
      category: 'shotguns',
      categoryLabel: 'Shotguns',
      manufacturer: 'Buckingham Defense',
      price: 3200,
      priceFormatted: '$3,200',
      rankUnlock: 8,
      damage: 8.5,
      fireRate: 2.5,
      accuracy: 3.5,
      range: 2.5,
      description: 'Corrosion-resistant shotgun engineered for saltwater environments with massive close-range stopping power.',
      icon: 'fa-gun',
      badgeColor: '#00b894',
      gameMode: 'both'
    },
    {
      id: 'gta6_w5',
      order: 5,
      name: 'Heavy .50 Cal Sniper Rifle',
      nameEn: 'Heavy Sniper .50 Cal',
      category: 'snipers',
      categoryLabel: 'Snipers',
      manufacturer: 'Ammu-Nation Custom',
      price: 32000,
      priceFormatted: '$32,000',
      rankUnlock: 35,
      damage: 9.8,
      fireRate: 2.0,
      accuracy: 9.5,
      range: 9.8,
      description: 'Extreme-range anti-materiel rifle capable of disabling vehicle engine blocks with armor-piercing rounds.',
      icon: 'fa-crosshairs',
      badgeColor: '#a29bfe',
      gameMode: 'both'
    }
  ];

  private readonly gta6WeaponsEs: GtaWeapon[] = [
    {
      id: 'gta6_w1',
      order: 1,
      name: 'Pistola Táctica 9mm',
      nameEn: 'Tactical 9mm Pistol',
      category: 'pistols',
      categoryLabel: 'Pistolas',
      manufacturer: 'Hawk & Little',
      price: 1200,
      priceFormatted: '$1,200',
      rankUnlock: 1,
      damage: 4.2,
      fireRate: 5.0,
      accuracy: 6.5,
      range: 4.0,
      description: 'Arma de mano reglamentaria con corredera aligerada y supresor compatible.',
      icon: 'fa-gun',
      badgeColor: '#ff4fe0',
      gameMode: 'both'
    },
    {
      id: 'gta6_w2',
      order: 2,
      name: 'Micro Subfusil Vice',
      nameEn: 'Vice Micro SMG',
      category: 'smgs',
      categoryLabel: 'Subfusiles',
      manufacturer: 'Shrewsbury',
      price: 4800,
      priceFormatted: '$4,800',
      rankUnlock: 5,
      damage: 3.8,
      fireRate: 8.5,
      accuracy: 5.5,
      range: 4.5,
      description: 'Subfusil compacto de altísima cadencia ideal para tiroteos desde vehículos.',
      icon: 'fa-gun',
      badgeColor: '#00cec9',
      gameMode: 'both'
    },
    {
      id: 'gta6_w3',
      order: 3,
      name: 'Fusil de Asalto Leonida Carbine',
      nameEn: 'Leonida Assault Carbine',
      category: 'rifles',
      categoryLabel: 'Fusiles',
      manufacturer: 'Vom Feuer',
      price: 14500,
      priceFormatted: '$14,500',
      rankUnlock: 12,
      damage: 6.2,
      fireRate: 6.5,
      accuracy: 7.5,
      range: 7.0,
      description: 'Fusil militar de asalto con culata retráctil y mira réflex para combates a media y larga distancia.',
      icon: 'fa-gun',
      badgeColor: '#fd79a8',
      gameMode: 'both'
    },
    {
      id: 'gta6_w4',
      order: 4,
      name: 'Escopeta Corredera Marina',
      nameEn: 'Marine Pump Shotgun',
      category: 'shotguns',
      categoryLabel: 'Escopetas',
      manufacturer: 'Buckingham Defense',
      price: 3200,
      priceFormatted: '$3,200',
      rankUnlock: 8,
      damage: 8.5,
      fireRate: 2.5,
      accuracy: 3.5,
      range: 2.5,
      description: 'Escopeta resistente a la corrosión marina con devastadora potencia a corta distancia.',
      icon: 'fa-gun',
      badgeColor: '#00b894',
      gameMode: 'both'
    },
    {
      id: 'gta6_w5',
      order: 5,
      name: 'Fusil de Francotirador Pesado .50',
      nameEn: 'Heavy Sniper .50 Cal',
      category: 'snipers',
      categoryLabel: 'Francotirador',
      manufacturer: 'Ammu-Nation Custom',
      price: 32000,
      priceFormatted: '$32,000',
      rankUnlock: 35,
      damage: 9.8,
      fireRate: 2.0,
      accuracy: 9.5,
      range: 9.8,
      description: 'Rifle antimaterial de largo alcance capaz de inutilizar bloques de motor de vehículos.',
      icon: 'fa-crosshairs',
      badgeColor: '#a29bfe',
      gameMode: 'both'
    }
  ];

  constructor(
    private vehicleService: VehicleService,
    private missionService: MissionService,
    private weaponService: WeaponService,
    readonly translationService: TranslationService
  ) {
    effect(() => {
      const lang = this.translationService.currentLanguage();
      if (this.game === 'gta6') {
        const isEs = lang === 'es';
        const missions = isEs ? this.gta6StoryMissionsEs : this.gta6StoryMissionsEn;
        const heists = isEs ? this.gta6HeistsEs : this.gta6HeistsEn;
        const mysteries = isEs ? this.gta6MysteriesEs : this.gta6MysteriesEn;
        const weapons = isEs ? this.gta6WeaponsEs : this.gta6WeaponsEn;

        if (this.gameMode === 'story') {
          this.storyMissions = missions;
        } else {
          this.onlineMissions = missions;
          this.onlineHeists = heists;
        }
        this.onlineMysteries = mysteries;
        this.weapons = weapons;

        if (this.selectedMission) {
          this.selectedMission = missions.find(m => m.id === this.selectedMission!.id) || this.selectedMission;
        }
        if (this.selectedHeist) {
          this.selectedHeist = heists.find(h => h.id === this.selectedHeist!.id) || this.selectedHeist;
        }
        if (this.selectedMystery) {
          this.selectedMystery = mysteries.find(mys => mys.id === this.selectedMystery!.id) || this.selectedMystery;
        }
        if (this.selectedWeapon) {
          this.selectedWeapon = weapons.find(w => w.id === this.selectedWeapon!.id) || this.selectedWeapon;
        }
      } else {
        if (this.gameMode === 'story') {
          if (this.storyMissions.length > 0) this.loadStoryMissions(true, this.selectedMission?.id);
          if (this.strangerMissions.length > 0) this.loadStrangerMissions(true, this.selectedStranger?.id);
          if (this.onlineMysteries.length > 0) this.loadOnlineMysteries(true, this.selectedMystery?.id);
          if (this.weapons.length > 0) this.loadWeapons(true, this.selectedWeapon?.id);
        } else {
          if (this.onlineMissions.length > 0) this.loadOnlineMissions(true, this.selectedMission?.id);
          if (this.onlineHeists.length > 0) this.loadOnlineHeists(true, this.selectedHeist?.id);
          if (this.onlineMysteries.length > 0) this.loadOnlineMysteries(true, this.selectedMystery?.id);
          if (this.weapons.length > 0) this.loadWeapons(true, this.selectedWeapon?.id);
        }
      }
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['game'] || changes['gameMode']) {
      this.onlineMysteries = [];
      this.selectedMystery = null;
      this.weapons = [];
      this.selectedWeapon = null;
      this.storyMissions = [];
      this.onlineMissions = [];
      this.onlineHeists = [];
      this.dealerVehicles = [];
      this.activeDealerId = null;
      this.selectedVehicle = null;
      this._cachedVisDealersKey = '';

      if (this.activeDrawerTab === 'misterios') this.loadOnlineMysteries(true);
      if (this.activeDrawerTab === 'armas') this.loadWeapons(true);
      if (this.activeDrawerTab === 'misiones') {
        if (this.gameMode === 'story') this.loadStoryMissions(true);
        else this.loadOnlineMissions(true);
      }
      if (this.activeDrawerTab === 'golpes') this.loadOnlineHeists(true);
    }
    if (changes['isOpen'] && changes['isOpen'].currentValue) {
      if (this.activeDrawerTab === 'misterios' && this.onlineMysteries.length === 0) this.loadOnlineMysteries();
      if (this.activeDrawerTab === 'armas' && this.weapons.length === 0) this.loadWeapons();
      if (this.activeDrawerTab === 'misiones') {
        if (this.gameMode === 'story' && this.storyMissions.length === 0) this.loadStoryMissions();
        else if (this.gameMode === 'online' && this.onlineMissions.length === 0) this.loadOnlineMissions();
      }
      if (this.activeDrawerTab === 'golpes' && this.onlineHeists.length === 0) this.loadOnlineHeists();
    }
  }

  get visibleDealers(): DealerCategory[] {
    if (this.game === 'gta6') {
      return this.gta6Dealers;
    }
    if (this._cachedVisDealersKey !== this.gameMode) {
      this._cachedVisDealersKey = this.gameMode;
      this._cachedVisDealers = this.dealers.filter(d => d.gameMode === 'both' || d.gameMode === this.gameMode);
    }
    return this._cachedVisDealers;
  }

  get dealerCategories(): { id: string; name: string; count: number; icon: string }[] {
    const key = `${this.dealerVehicles ? this.dealerVehicles.length : 0}_${this.dealerVehicles && this.dealerVehicles[0] ? this.dealerVehicles[0].id : ''}`;
    if (this._cachedDealCatKey !== key) {
      this._cachedDealCatKey = key;
      if (!this.dealerVehicles || this.dealerVehicles.length === 0) {
        this._cachedDealCat = [];
      } else {
        const counts: { [cls: string]: number } = {};
        for (const v of this.dealerVehicles) {
          const cls = v.class || 'Otros';
          counts[cls] = (counts[cls] || 0) + 1;
        }

        const list = Object.keys(counts)
          .sort((a, b) => counts[b] - counts[a])
          .map(cls => ({
            id: cls,
            name: cls,
            count: counts[cls],
            icon: this.getCategoryTabIcon(cls)
          }));

        this._cachedDealCat = [
          { id: 'all', name: 'Todos', count: this.dealerVehicles.length, icon: 'fa-layer-group' },
          ...list
        ];
      }
    }
    return this._cachedDealCat;
  }

  get filteredDealerVehicles(): GtaVehicle[] {
    const key = `${this.dealerVehicles ? this.dealerVehicles.length : 0}_${this.selectedVehicleClass}_${this.dealerVehicleSearchQuery}_${this.selectedVehicleSort}`;
    if (this._cachedFDVKey !== key) {
      this._cachedFDVKey = key;
      let list = this.dealerVehicles;
      if (this.selectedVehicleClass !== 'all') {
        list = list.filter(v => (v.class || 'Otros') === this.selectedVehicleClass);
      }
      const q = this.dealerVehicleSearchQuery.trim().toLowerCase();
      if (q) {
        list = list.filter(v =>
          (v.name && v.name.toLowerCase().includes(q)) ||
          (v.manufacturer && v.manufacturer.toLowerCase().includes(q)) ||
          (v.class && v.class.toLowerCase().includes(q))
        );
      }
      if (this.selectedVehicleSort !== 'none') {
        const sortKey = this.selectedVehicleSort;
        list = [...list].sort((a, b) => {
          const statA = (a as any)[sortKey] ?? 0;
          const statB = (b as any)[sortKey] ?? 0;
          if (statB !== statA) {
            return statB - statA;
          }
          return (a.name || '').localeCompare(b.name || '');
        });
      }
      this._cachedFDV = list;
    }
    return this._cachedFDV;
  }

  // -------------------------------------------------------------
  // MISIONES MODO HISTORIA
  // -------------------------------------------------------------
  loadStoryMissions(force = false, keepSelectedId?: string): void {
    if (this.storyMissions.length > 0 && !force) return;
    this.missionsLoading = true;
    this.missionsError = false;
    this.missionService.getStoryMissions().subscribe({
      next: (missions) => {
        this.storyMissions = missions;
        if (keepSelectedId) {
          this.selectedMission = missions.find(m => m.id === keepSelectedId) || null;
        }
        this.missionsLoading = false;
      },
      error: (err) => {
        console.error('Error al cargar misiones de historia:', err);
        this.missionsLoading = false;
        this.missionsError = true;
      }
    });
  }

  toggleMissionExpand(id: string): void {
    this.expandedMissionId = this.expandedMissionId === id ? null : id;
  }

  setCharacterFilter(filter: string): void {
    this.selectedCharacterFilter = filter;
  }

  get filteredStoryMissions(): GtaMission[] {
    const key = `${this.storyMissions ? this.storyMissions.length : 0}_${this.selectedCharacterFilter}_${this.missionSearchQuery}`;
    if (this._cachedFSMKey !== key) {
      this._cachedFSMKey = key;
      let list = this.storyMissions;
      const filter = this.selectedCharacterFilter.toLowerCase();
      if (filter !== 'all') {
        if (filter === 'heists') {
          list = list.filter(m => m.category.toLowerCase().includes('golpe') || m.category.toLowerCase().includes('heist'));
        } else {
          list = list.filter(m => m.character.toLowerCase().includes(filter));
        }
      }
      const q = this.missionSearchQuery.trim().toLowerCase();
      if (q) {
        list = list.filter(m =>
          m.title.toLowerCase().includes(q) ||
          m.description.toLowerCase().includes(q) ||
          m.giver.toLowerCase().includes(q) ||
          m.character.toLowerCase().includes(q) ||
          m.category.toLowerCase().includes(q)
        );
      }
      this._cachedFSM = list;
    }
    return this._cachedFSM;
  }

  getCharacterMissionCount(filter: string): number {
    const f = filter.toLowerCase();
    if (f === 'all') return this.storyMissions.length;
    if (f === 'heists') {
      return this.storyMissions.filter(m => m.category.toLowerCase().includes('golpe') || m.category.toLowerCase().includes('heist')).length;
    }
    return this.storyMissions.filter(m => m.character.toLowerCase().includes(f)).length;
  }

  getCharacterBadgeClass(char: string): string {
    const c = char.toLowerCase();
    if (c.includes('michael') && c.includes('trevor') && c.includes('franklin')) return 'badge-trio';
    if (c.includes('michael') && c.includes('trevor')) return 'badge-duo-mt';
    if (c.includes('michael') && c.includes('franklin')) return 'badge-duo-mf';
    if (c.includes('lucia') && c.includes('jason')) return 'badge-duo-gta6';
    if (c.includes('lucia')) return 'badge-lucia';
    if (c.includes('jason')) return 'badge-jason';
    if (c.includes('franklin')) return 'badge-franklin';
    if (c.includes('michael')) return 'badge-michael';
    if (c.includes('trevor')) return 'badge-trevor';
    return 'badge-neutral';
  }

  setDrawerTab(tabId: string): void {
    this.activeDrawerTab = tabId;
    if (this.drawerView === 'dealer-grid' || this.drawerView === 'vehicle-detail' || this.drawerView === 'mission-detail' || this.drawerView === 'stranger-detail' || this.drawerView === 'heist-detail' || this.drawerView === 'mystery-detail' || this.drawerView === 'weapon-detail') {
      this.drawerView = 'tabs';
      this.activeDealerId = null;
      this.selectedVehicle = null;
      this.selectedMission = null;
      this.selectedStranger = null;
      this.selectedHeist = null;
      this.selectedMystery = null;
      this.selectedWeapon = null;
    }
    if (tabId === 'armas' && this.weapons.length === 0) {
      this.loadWeapons();
    }
    if (this.gameMode === 'story') {
      if (tabId === 'misiones' && this.storyMissions.length === 0) {
        this.loadStoryMissions();
      }
      if (tabId === 'strangers' && this.strangerMissions.length === 0) {
        this.loadStrangerMissions();
      }
      if (tabId === 'misterios' && this.onlineMysteries.length === 0) {
        this.loadOnlineMysteries();
      }
    } else {
      if (tabId === 'misiones' && this.onlineMissions.length === 0) {
        this.loadOnlineMissions();
      }
      if (tabId === 'golpes' && this.onlineHeists.length === 0) {
        this.loadOnlineHeists();
      }
      if (tabId === 'misterios' && this.onlineMysteries.length === 0) {
        this.loadOnlineMysteries();
      }
    }
  }

  // -------------------------------------------------------------
  // MISIONES GTA ONLINE (CONTACTOS Y OPERACIONES)
  // -------------------------------------------------------------
  loadOnlineMissions(force = false, keepSelectedId?: string): void {
    if (this.onlineMissions.length > 0 && !force) return;
    this.onlineMissionsLoading = true;
    this.onlineMissionsError = false;
    this.missionService.getOnlineMissions().subscribe({
      next: (missions) => {
        this.onlineMissions = missions;
        if (keepSelectedId) {
          this.selectedMission = missions.find(m => m.id === keepSelectedId) || null;
        }
        this.onlineMissionsLoading = false;
      },
      error: (err) => {
        console.error('Error al cargar misiones de GTA Online:', err);
        this.onlineMissionsLoading = false;
        this.onlineMissionsError = true;
      }
    });
  }

  setOnlineContactFilter(filter: string): void {
    this.selectedOnlineContactFilter = filter;
  }

  setOnlineCategoryFilter(category: string): void {
    this.selectedOnlineCategoryFilter = category;
  }

  get onlineContactsList(): { id: string; name: string; count: number; icon: string; color: string }[] {
    const key = `${this.onlineMissions ? this.onlineMissions.length : 0}`;
    if (this._cachedOCLKey !== key) {
      this._cachedOCLKey = key;
      this._cachedOCL = [
        { id: 'all', name: 'Todos', count: this.onlineMissions.length, icon: 'fa-globe', color: '#ffb833' },
        { id: 'gerald', name: 'Gerald', count: this.getOnlineContactCount('gerald'), icon: 'fa-pills', color: '#9b59b6' },
        { id: 'simeon', name: 'Simeon', count: this.getOnlineContactCount('simeon'), icon: 'fa-car', color: '#f1c40f' },
        { id: 'lamar', name: 'Lamar', count: this.getOnlineContactCount('lamar'), icon: 'fa-cannabis', color: '#2ecc71' },
        { id: 'lester', name: 'Lester', count: this.getOnlineContactCount('lester'), icon: 'fa-laptop-code', color: '#3498db' },
        { id: 'madrazo', name: 'Madrazo', count: this.getOnlineContactCount('madrazo'), icon: 'fa-crosshairs', color: '#e74c3c' },
        { id: 'trevor', name: 'Trevor / Ron', count: this.getOnlineContactCount('trevor'), icon: 'fa-skull', color: '#e67e22' },
        { id: 'agatha', name: 'Agatha Baker', count: this.getOnlineContactCount('agatha'), icon: 'fa-gem', color: '#d4af37' },
        { id: 'special', name: 'Operaciones Especiales', count: this.getOnlineContactCount('special'), icon: 'fa-shield-halved', color: '#1abc9c' }
      ];
    }
    return this._cachedOCL;
  }

  getOnlineContactCount(filter: string): number {
    const f = filter.toLowerCase();
    if (f === 'all') return this.onlineMissions.length;
    if (f === 'trevor') {
      return this.onlineMissions.filter(m => m.character.toLowerCase().includes('trevor') || m.character.toLowerCase().includes('ron')).length;
    }
    if (f === 'special') {
      return this.onlineMissions.filter(m =>
        m.character.toLowerCase().includes('brendan') ||
        m.character.toLowerCase().includes('agente 14') ||
        m.character.toLowerCase().includes('securoserv') ||
        m.character.toLowerCase().includes('franklin') ||
        m.character.toLowerCase().includes('dax') ||
        m.character.toLowerCase().includes('vincent')
      ).length;
    }
    return this.onlineMissions.filter(m => m.character.toLowerCase().includes(f)).length;
  }

  get onlineCategories(): string[] {
    const key = `${this.onlineMissions ? this.onlineMissions.length : 0}`;
    if (this._cachedOCatKey !== key) {
      this._cachedOCatKey = key;
      const set = new Set<string>();
      for (const m of this.onlineMissions) {
        if (m.category) set.add(m.category);
      }
      this._cachedOCat = Array.from(set).sort();
    }
    return this._cachedOCat;
  }

  get filteredOnlineMissions(): GtaMission[] {
    const key = `${this.onlineMissions ? this.onlineMissions.length : 0}_${this.selectedOnlineContactFilter}_${this.selectedOnlineCategoryFilter}_${this.onlineMissionSearchQuery}`;
    if (this._cachedFOMKey !== key) {
      this._cachedFOMKey = key;
      let list = this.onlineMissions;
      const cf = this.selectedOnlineContactFilter.toLowerCase();
      if (cf !== 'all') {
        if (cf === 'trevor') {
          list = list.filter(m => m.character.toLowerCase().includes('trevor') || m.character.toLowerCase().includes('ron'));
        } else if (cf === 'special') {
          list = list.filter(m =>
            m.character.toLowerCase().includes('brendan') ||
            m.character.toLowerCase().includes('agente 14') ||
            m.character.toLowerCase().includes('securoserv') ||
            m.character.toLowerCase().includes('franklin') ||
            m.character.toLowerCase().includes('dax') ||
            m.character.toLowerCase().includes('vincent')
          );
        } else {
          list = list.filter(m => m.character.toLowerCase().includes(cf));
        }
      }

      if (this.selectedOnlineCategoryFilter !== 'all') {
        list = list.filter(m => m.category === this.selectedOnlineCategoryFilter);
      }

      const q = this.onlineMissionSearchQuery.trim().toLowerCase();
      if (q) {
        list = list.filter(m =>
          m.title.toLowerCase().includes(q) ||
          m.description.toLowerCase().includes(q) ||
          m.giver.toLowerCase().includes(q) ||
          m.character.toLowerCase().includes(q) ||
          m.category.toLowerCase().includes(q)
        );
      }
      this._cachedFOM = list;
    }
    return this._cachedFOM;
  }

  getOnlineContactBadgeClass(char: string): string {
    const c = char.toLowerCase();
    if (c.includes('gerald')) return 'badge-gerald';
    if (c.includes('simeon')) return 'badge-simeon';
    if (c.includes('lamar')) return 'badge-lamar';
    if (c.includes('lester')) return 'badge-lester';
    if (c.includes('madrazo')) return 'badge-madrazo';
    if (c.includes('trevor') || c.includes('ron')) return 'badge-trevor';
    if (c.includes('agatha')) return 'badge-agatha';
    if (c.includes('brendan')) return 'badge-darcy';
    if (c.includes('franklin')) return 'badge-franklin';
    if (c.includes('dax')) return 'badge-dax';
    if (c.includes('vincent')) return 'badge-vincent';
    if (c.includes('agente') || c.includes('securoserv')) return 'badge-tactical';
    return 'badge-neutral';
  }

  openMissionDetail(mission: GtaMission): void {
    this.selectedMission = mission;
    this.drawerView = 'mission-detail';
  }

  closeMissionDetail(): void {
    this.selectedMission = null;
    this.drawerView = 'tabs';
  }

  get currentMissionsList(): GtaMission[] {
    return this.gameMode === 'story' ? this.storyMissions : this.onlineMissions;
  }

  get previousMission(): GtaMission | null {
    if (!this.selectedMission || this.currentMissionsList.length === 0) return null;
    const idx = this.currentMissionsList.findIndex(m => m.id === this.selectedMission!.id);
    return idx > 0 ? this.currentMissionsList[idx - 1] : null;
  }

  get nextMission(): GtaMission | null {
    if (!this.selectedMission || this.currentMissionsList.length === 0) return null;
    const idx = this.currentMissionsList.findIndex(m => m.id === this.selectedMission!.id);
    return (idx >= 0 && idx < this.currentMissionsList.length - 1) ? this.currentMissionsList[idx + 1] : null;
  }

  selectPreviousMission(): void {
    const prev = this.previousMission;
    if (prev) this.selectedMission = prev;
  }

  selectNextMission(): void {
    const next = this.nextMission;
    if (next) this.selectedMission = next;
  }

  getMissionAccentColor(m: GtaMission | null): string {
    if (!m) return '#ffb833';
    const c = m.character.toLowerCase();
    const cat = m.category.toLowerCase();
    if (c.includes('lucia')) return '#ff4fe0';
    if (c.includes('jason')) return '#00cec9';
    if (c.includes('gerald')) return '#9b59b6';
    if (c.includes('simeon')) return '#f1c40f';
    if (c.includes('lamar')) return '#2ecc71';
    if (c.includes('lester')) return '#3498db';
    if (c.includes('madrazo')) return '#e74c3c';
    if (c.includes('trevor') || c.includes('ron')) return '#e67e22';
    if (c.includes('agatha')) return '#d4af37';
    if (c.includes('brendan')) return '#2980b9';
    if (c.includes('franklin')) return '#27ae60';
    if (c.includes('dax')) return '#e91e63';
    if (c.includes('vincent')) return '#ff5722';
    if (cat.includes('golpe') || cat.includes('heist') || cat.includes('final')) return '#f1c40f';
    if (c.includes('franklin') && !c.includes('michael') && !c.includes('trevor')) return '#2ecc71';
    if (c.includes('michael') && !c.includes('franklin') && !c.includes('trevor')) return '#3498db';
    if (c.includes('trevor') && !c.includes('franklin') && !c.includes('michael')) return '#e67e22';
    return '#ffb833';
  }

  getMissionIcon(m: GtaMission | null): string {
    if (!m) return 'fa-crosshairs';
    const c = m.character.toLowerCase();
    const cat = m.category.toLowerCase();
    if (cat.includes('golpe') || cat.includes('heist')) return 'fa-sack-dollar';
    if (c.includes('lucia')) return 'fa-gem';
    if (c.includes('jason')) return 'fa-shield-halved';
    if (c.includes('gerald')) return 'fa-pills';
    if (c.includes('simeon')) return 'fa-car';
    if (c.includes('lamar')) return 'fa-cannabis';
    if (c.includes('lester')) return 'fa-laptop-code';
    if (c.includes('madrazo')) return 'fa-crosshairs';
    if (c.includes('trevor') || c.includes('ron')) return 'fa-skull';
    if (c.includes('agatha')) return 'fa-gem';
    if (c.includes('franklin')) return 'fa-car';
    if (c.includes('michael')) return 'fa-gun';
    if (c.includes('vincent')) return 'fa-shield-halved';
    if (c.includes('dax')) return 'fa-flask';
    if (c.includes('brendan') || c.includes('agente 14') || c.includes('securoserv')) return 'fa-user-secret';
    return 'fa-crosshairs';
  }

  // -------------------------------------------------------------
  // EXTRAÑOS Y LOCOS (STRANGERS AND FREAKS) MODO HISTORIA
  // -------------------------------------------------------------
  loadStrangerMissions(force = false, keepSelectedId?: string): void {
    if (this.strangerMissions.length > 0 && !force) return;
    this.strangersLoading = true;
    this.strangersError = false;
    this.missionService.getStoryStrangers().subscribe({
      next: (missions) => {
        this.strangerMissions = missions;
        if (keepSelectedId) {
          this.selectedStranger = missions.find(m => m.id === keepSelectedId) || null;
        }
        // Las categorías de series comienzan contraídas por defecto
        this.strangersLoading = false;
      },
      error: (err) => {
        console.error('Error al cargar misiones de extraños y locos:', err);
        this.strangersLoading = false;
        this.strangersError = true;
      }
    });
  }

  setStrangerCharacterFilter(filter: string): void {
    this.selectedStrangerCharacterFilter = filter;
  }

  setStrangerSeriesFilter(seriesId: string): void {
    this.selectedStrangerSeriesFilter = seriesId;
    if (seriesId && seriesId !== 'all') {
      this.expandedStrangerSeries[seriesId] = true;
    }
  }

  toggleStranger100Filter(): void {
    this.strangerOnly100Filter = !this.strangerOnly100Filter;
  }

  setStrangerViewMode(mode: 'series' | 'list'): void {
    this.strangerSeriesViewMode = mode;
  }

  toggleStrangerSeriesExpand(seriesId: string): void {
    this.expandedStrangerSeries[seriesId] = !this.isStrangerSeriesExpanded(seriesId);
  }

  isStrangerSeriesExpanded(seriesId: string): boolean {
    return !!this.expandedStrangerSeries[seriesId];
  }

  openStrangerDetail(mission: GtaStrangerMission): void {
    this.selectedStranger = mission;
    this.drawerView = 'stranger-detail';
  }

  closeStrangerDetail(): void {
    this.selectedStranger = null;
    this.drawerView = 'tabs';
  }

  get strangerSeriesList(): { id: string; name: string; count: number; icon: string; color: string }[] {
    const key = `${this.strangerMissions ? this.strangerMissions.length : 0}`;
    if (this._cachedSSLKey !== key) {
      this._cachedSSLKey = key;
      const map = new Map<string, { id: string; name: string; count: number; icon: string; color: string }>();
      for (const m of this.strangerMissions) {
        if (!map.has(m.series)) {
          map.set(m.series, {
            id: m.series,
            name: m.seriesName,
            count: 0,
            icon: m.seriesIcon || 'fa-user-ninja',
            color: m.seriesColor || '#ffb833'
          });
        }
        map.get(m.series)!.count++;
      }
      this._cachedSSL = Array.from(map.values()).sort((a, b) => b.count - a.count);
    }
    return this._cachedSSL;
  }

  get filteredStrangerMissions(): GtaStrangerMission[] {
    const key = `${this.strangerMissions ? this.strangerMissions.length : 0}_${this.selectedStrangerCharacterFilter}_${this.selectedStrangerSeriesFilter}_${this.strangerOnly100Filter}_${this.strangerSearchQuery}`;
    if (this._cachedFStMKey !== key) {
      this._cachedFStMKey = key;
      let list = this.strangerMissions;
      const charFilter = this.selectedStrangerCharacterFilter.toLowerCase();
      if (charFilter !== 'all') {
        if (charFilter === '100') {
          list = list.filter(m => m.requiredFor100);
        } else {
          list = list.filter(m => m.character.toLowerCase().includes(charFilter));
        }
      }
      if (this.selectedStrangerSeriesFilter !== 'all') {
        list = list.filter(m => m.series === this.selectedStrangerSeriesFilter);
      }
      if (this.strangerOnly100Filter) {
        list = list.filter(m => m.requiredFor100);
      }
      const q = this.strangerSearchQuery.trim().toLowerCase();
      if (q) {
        list = list.filter(m =>
          m.title.toLowerCase().includes(q) ||
          (m.titleEn && m.titleEn.toLowerCase().includes(q)) ||
          m.seriesName.toLowerCase().includes(q) ||
          m.giver.toLowerCase().includes(q) ||
          m.character.toLowerCase().includes(q) ||
          m.description.toLowerCase().includes(q)
        );
      }
      this._cachedFStM = list;
    }
    return this._cachedFStM;
  }

  get filteredStrangerSeriesGroups(): StrangerSeriesGroup[] {
    const missions = this.filteredStrangerMissions;
    const key = `${missions.length}_${missions[0] ? missions[0].id : ''}`;
    if (this._cachedFSSGKey !== key) {
      this._cachedFSSGKey = key;
      const map = new Map<string, StrangerSeriesGroup>();
      for (const m of missions) {
        if (!map.has(m.series)) {
          map.set(m.series, {
            id: m.series,
            name: m.seriesName,
            icon: m.seriesIcon || 'fa-user-ninja',
            color: m.seriesColor || '#ffb833',
            missions: [],
            total: m.seriesTotal
          });
        }
        map.get(m.series)!.missions.push(m);
      }
      this._cachedFSSG = Array.from(map.values());
    }
    return this._cachedFSSG;
  }

  getStrangerCharacterMissionCount(filter: string): number {
    const f = filter.toLowerCase();
    if (f === 'all') return this.strangerMissions.length;
    if (f === '100') return this.strangerMissions.filter(m => m.requiredFor100).length;
    return this.strangerMissions.filter(m => m.character.toLowerCase().includes(f)).length;
  }

  getStranger100MissionCount(): number {
    return this.strangerMissions.filter(m => m.requiredFor100).length;
  }

  get previousStranger(): GtaStrangerMission | null {
    if (!this.selectedStranger || this.strangerMissions.length === 0) return null;
    const idx = this.strangerMissions.findIndex(m => m.id === this.selectedStranger!.id);
    return idx > 0 ? this.strangerMissions[idx - 1] : null;
  }

  get nextStranger(): GtaStrangerMission | null {
    if (!this.selectedStranger || this.strangerMissions.length === 0) return null;
    const idx = this.strangerMissions.findIndex(m => m.id === this.selectedStranger!.id);
    return (idx >= 0 && idx < this.strangerMissions.length - 1) ? this.strangerMissions[idx + 1] : null;
  }

  selectPreviousStranger(): void {
    const prev = this.previousStranger;
    if (prev) this.selectedStranger = prev;
  }

  selectNextStranger(): void {
    const next = this.nextStranger;
    if (next) this.selectedStranger = next;
  }

  getStrangerAccentColor(m: GtaStrangerMission | null): string {
    if (!m) return '#ffb833';
    return m.seriesColor || '#ffb833';
  }

  openDealerGrid(dealerId: string, dealerName: string): void {
    this.activeDealerId = dealerId;
    this.activeDealerName = dealerName;
    this.selectedVehicle = null;
    this.selectedVehicleClass = 'all';
    this.selectedVehicleSort = 'none';
    this.dealerVehicleSearchQuery = '';
    this.drawerView = 'dealer-grid';
    this.loadDealerVehicles(dealerId);
  }

  closeDealerGrid(): void {
    this.drawerView = 'tabs';
    this.activeDealerId = null;
    this.selectedVehicle = null;
    this.selectedVehicleSort = 'none';
    this.dealerVehicleSearchQuery = '';
  }

  backToDealerGrid(): void {
    this.drawerView = 'dealer-grid';
    this.selectedVehicle = null;
  }

  onBreadcrumbBack(): void {
    if (this.drawerView === 'vehicle-detail') {
      this.backToDealerGrid();
    } else if (this.drawerView === 'dealer-grid') {
      this.closeDealerGrid();
    } else if (this.drawerView === 'mission-detail') {
      this.closeMissionDetail();
    } else if (this.drawerView === 'stranger-detail') {
      this.closeStrangerDetail();
    } else if (this.drawerView === 'heist-detail') {
      this.closeHeistDetail();
    } else if (this.drawerView === 'mystery-detail') {
      this.closeMysteryDetail();
    } else if (this.drawerView === 'weapon-detail') {
      this.closeWeaponDetail();
    }
  }

  selectVehicle(v: GtaVehicle): void {
    this.selectedVehicle = v;
    this.drawerView = 'vehicle-detail';
  }

  setVehicleCategory(catId: string): void {
    this.selectedVehicleClass = catId;
    if (this.selectedVehicle && catId !== 'all') {
      const curClass = this.selectedVehicle.class || 'Otros';
      if (curClass !== catId) {
        this.selectedVehicle = null;
      }
    }
  }

  setVehicleSort(sort: 'none' | 'acceleration' | 'speed' | 'braking' | 'handling'): void {
    this.selectedVehicleSort = sort;
  }

  onDealerLogoError(dealer: DealerCategory): void {
    dealer.logoFailed = true;
  }

  onVehicleImgError(v: GtaVehicle): void {
    v.imgFailed = true;
  }

  formatPrice(price: number): string {
    if (!price || price <= 0) {
      const lang = this.translationService.currentLanguage();
      if (lang === 'en') return 'Price not available';
      if (lang === 'pt') return 'Preço não disponível';
      return 'Precio no disponible';
    }
    const lang = this.translationService.currentLanguage();
    const locale = lang === 'en' ? 'en-US' : lang === 'pt' ? 'pt-BR' : 'es-ES';
    return '$' + price.toLocaleString(locale);
  }

  getCategoryTabIcon(cls: string): string {
    const c = cls.toLowerCase();
    if (c.includes('súper') || c.includes('super')) return 'fa-bolt';
    if (c.includes('deportivo') || c.includes('sport')) return 'fa-car-side';
    if (c.includes('clásico')) return 'fa-award';
    if (c.includes('muscle')) return 'fa-gauge-high';
    if (c.includes('moto') || c.includes('cycle') || c === 'motocicleta') return 'fa-motorcycle';
    if (c === 'cycle' || c.includes('biciclet') || c.includes('pedal')) return 'fa-bicycle';
    if (c.includes('suv') || c.includes('camioneta')) return 'fa-truck-pickup';
    if (c.includes('todoterreno') || c.includes('offroad')) return 'fa-mountain';
    if (c.includes('sedán') || c.includes('sedan') || c.includes('cupé') || c.includes('compacto')) return 'fa-car';
    if (c.includes('military') || c.includes('militar') || c === 'emergency') return 'fa-shield-halved';
    if (c === 'rail' || c.includes('tren') || c.includes('ferrov')) return 'fa-train';
    if (c === 'industrial' || c.includes('indust')) return 'fa-industry';
    if (c.includes('heli')) return 'fa-helicopter';
    if (c.includes('avión') || c.includes('plane')) return 'fa-plane';
    if (c.includes('embarc') || c.includes('boat')) return 'fa-ship';
    if (c.includes('furgoneta') || c.includes('van')) return 'fa-van-shuttle';
    if (c.includes('servicio') || c.includes('utilitario') || c.includes('comercial') || c.includes('indust')) return 'fa-truck';
    return 'fa-tag';
  }

  getVehicleIcon(v: GtaVehicle | null): string {
    if (!v) return 'fa-car';
    const cat = (v.category || v.class || '').toLowerCase();
    if (cat.includes('motor')) return 'fa-motorcycle';
    if (cat.includes('heli')) return 'fa-helicopter';
    if (cat.includes('plane') || cat.includes('avión')) return 'fa-plane';
    if (cat.includes('boat') || cat.includes('embarc')) return 'fa-ship';
    if (cat.includes('militar') || cat.includes('indust') || cat.includes('offroad') || cat.includes('todoterreno')) return 'fa-truck-monster';
    return 'fa-car';
  }

  /** Resolves the description for a dealer card.
   *  Uses i18n keys for the original 6 dealers and falls back
   *  to the static description property for newer ones. */
  getDealerDesc(dealer: DealerCategory): string {
    const lang = this.translationService.currentLang;
    const cacheKey = `${dealer.id}_${lang}`;
    if (this._cachedDealerDesc[cacheKey]) {
      return this._cachedDealerDesc[cacheKey];
    }
    const i18nKeyMap: { [id: string]: string } = {
      legendarymotorsport: 'transports.dealers.legendaryDesc',
      superautos: 'transports.dealers.superautosDesc',
      bennys: 'transports.dealers.bennysDesc',
      elitas: 'transports.dealers.elitasDesc',
      docktease: 'transports.dealers.dockteaseDesc',
      warstock: 'transports.dealers.warstockDesc',
      pegasus: 'transports.dealers.pegasusDesc',
      pedal_and_metal: 'transports.dealers.pedalAndMetalDesc',
      arena_war: 'transports.dealers.arenaWarDesc',
      especiales: 'transports.dealers.especialesDesc',
    };
    const key = i18nKeyMap[dealer.id];
    let result = dealer.description;
    if (key) {
      const translated = this.translationService.t(key);
      if (translated && !translated.startsWith('transports.')) {
        result = translated;
      }
    }
    this._cachedDealerDesc[cacheKey] = result;
    return result;
  }

  onClose(): void {
    this.closeDrawer.emit();
  }

  private loadDealerVehicles(dealerId: string): void {
    if (this.vehicleCache[dealerId]) {
      this.dealerVehicles = this.vehicleCache[dealerId];
      return;
    }

    this.vehiclesLoading = true;
    this.vehiclesError = false;
    this.dealerVehicles = [];

    this.vehicleService.getVehicles().subscribe({
      next: (vehicles) => {
        this.vehicleCache = {};
        for (const v of vehicles) {
          const d = v.dealership || 'superautos';
          if (!this.vehicleCache[d]) {
            this.vehicleCache[d] = [];
          }
          this.vehicleCache[d].push(v);
        }
        this.dealerVehicles = this.vehicleCache[dealerId] || [];
        this.vehiclesLoading = false;
      },
      error: (err) => {
        console.error('Error al cargar catálogo de vehículos:', err);
        this.vehiclesLoading = false;
        this.vehiclesError = true;
      }
    });
  }

  // -------------------------------------------------------------
  // GOLPES MODO ONLINE (HEISTS)
  // -------------------------------------------------------------
  loadOnlineHeists(force = false, keepSelectedId?: string): void {
    if (this.onlineHeists.length > 0 && !force) return;
    this.heistsLoading = true;
    this.heistsError = false;
    this.missionService.getOnlineHeists().subscribe({
      next: (heists) => {
        this.onlineHeists = heists;
        if (keepSelectedId) {
          this.selectedHeist = heists.find(h => h.id === keepSelectedId) || null;
        }
        this.heistsLoading = false;
      },
      error: (err) => {
        console.error('Error al cargar golpes de GTA Online:', err);
        this.heistsLoading = false;
        this.heistsError = true;
      }
    });
  }

  setHeistCategoryFilter(cat: string): void {
    this.selectedHeistCategoryFilter = cat;
  }

  get filteredOnlineHeists(): GtaHeist[] {
    const key = `${this.onlineHeists ? this.onlineHeists.length : 0}_${this.selectedHeistCategoryFilter}_${this.heistSearchQuery}`;
    if (this._cachedFOHKey !== key) {
      this._cachedFOHKey = key;
      let list = this.onlineHeists;
      const cat = this.selectedHeistCategoryFilter.toLowerCase();
      if (cat !== 'all') {
        list = list.filter(h => h.category.toLowerCase() === cat);
      }
      const q = this.heistSearchQuery.trim().toLowerCase();
      if (q) {
        list = list.filter(h =>
          h.title.toLowerCase().includes(q) ||
          (h.titleEn && h.titleEn.toLowerCase().includes(q)) ||
          h.giver.toLowerCase().includes(q) ||
          h.target.toLowerCase().includes(q) ||
          h.propertyRequired.toLowerCase().includes(q) ||
          h.description.toLowerCase().includes(q) ||
          h.categoryLabel.toLowerCase().includes(q)
        );
      }
      this._cachedFOH = list;
    }
    return this._cachedFOH;
  }

  getHeistCategoryCount(cat: string): number {
    if (cat === 'all') return this.onlineHeists.length;
    return this.onlineHeists.filter(h => h.category.toLowerCase() === cat.toLowerCase()).length;
  }

  openHeistDetail(heist: GtaHeist): void {
    this.selectedHeist = heist;
    this.drawerView = 'heist-detail';
  }

  closeHeistDetail(): void {
    this.selectedHeist = null;
    this.drawerView = 'tabs';
  }

  get previousHeist(): GtaHeist | null {
    if (!this.selectedHeist || this.onlineHeists.length === 0) return null;
    const idx = this.onlineHeists.findIndex(h => h.id === this.selectedHeist!.id);
    return idx > 0 ? this.onlineHeists[idx - 1] : null;
  }

  get nextHeist(): GtaHeist | null {
    if (!this.selectedHeist || this.onlineHeists.length === 0) return null;
    const idx = this.onlineHeists.findIndex(h => h.id === this.selectedHeist!.id);
    return (idx >= 0 && idx < this.onlineHeists.length - 1) ? this.onlineHeists[idx + 1] : null;
  }

  selectPreviousHeist(): void {
    const prev = this.previousHeist;
    if (prev) this.selectedHeist = prev;
  }

  selectNextHeist(): void {
    const next = this.nextHeist;
    if (next) this.selectedHeist = next;
  }

  getHeistAccentColor(h: GtaHeist | null): string {
    if (!h) return '#ffb833';
    return h.badgeColor || '#ffb833';
  }

  // -------------------------------------------------------------
  // MISTERIOS Y LEYENDAS URBANAS (GTA ONLINE)
  // -------------------------------------------------------------
  loadOnlineMysteries(force = false, keepSelectedId?: string): void {
    if (this.onlineMysteries.length > 0 && !force) return;
    this.mysteriesLoading = true;
    this.mysteriesError = false;

    const mysteries$ = this.gameMode === 'story'
      ? this.missionService.getStoryMysteries()
      : this.missionService.getOnlineMysteries();

    mysteries$.subscribe({
      next: (mysteries) => {
        this.onlineMysteries = mysteries;
        if (keepSelectedId) {
          this.selectedMystery = mysteries.find(m => m.id === keepSelectedId) || null;
        }
        this.mysteriesLoading = false;
      },
      error: (err) => {
        console.error(`Error al cargar misterios (${this.gameMode}):`, err);
        this.mysteriesLoading = false;
        this.mysteriesError = true;
      }
    });
  }

  setMysteryCategoryFilter(cat: string): void {
    this.selectedMysteryCategoryFilter = cat;
  }

  get filteredOnlineMysteries(): GtaMystery[] {
    const key = `${this.onlineMysteries ? this.onlineMysteries.length : 0}_${this.selectedMysteryCategoryFilter}_${this.mysterySearchQuery}`;
    if (this._cachedFOMysKey !== key) {
      this._cachedFOMysKey = key;
      let list = this.onlineMysteries;
      const cat = this.selectedMysteryCategoryFilter.toLowerCase();
      if (cat !== 'all') {
        list = list.filter(m => m.category.toLowerCase() === cat);
      }
      const q = this.mysterySearchQuery.trim().toLowerCase();
      if (q) {
        list = list.filter(m =>
          m.title.toLowerCase().includes(q) ||
          (m.titleEn && m.titleEn.toLowerCase().includes(q)) ||
          m.location.toLowerCase().includes(q) ||
          m.zone.toLowerCase().includes(q) ||
          m.description.toLowerCase().includes(q) ||
          m.lore.toLowerCase().includes(q)
        );
      }
      this._cachedFOMys = list;
    }
    return this._cachedFOMys;
  }

  getMysteryCategoryCount(cat: string): number {
    if (cat === 'all') return this.onlineMysteries.length;
    return this.onlineMysteries.filter(m => m.category.toLowerCase() === cat.toLowerCase()).length;
  }

  openMysteryDetail(mystery: GtaMystery): void {
    this.selectedMystery = mystery;
    this.drawerView = 'mystery-detail';
  }

  closeMysteryDetail(): void {
    this.selectedMystery = null;
    this.drawerView = 'tabs';
  }

  get previousMystery(): GtaMystery | null {
    if (!this.selectedMystery || this.onlineMysteries.length === 0) return null;
    const idx = this.onlineMysteries.findIndex(m => m.id === this.selectedMystery!.id);
    return idx > 0 ? this.onlineMysteries[idx - 1] : null;
  }

  get nextMystery(): GtaMystery | null {
    if (!this.selectedMystery || this.onlineMysteries.length === 0) return null;
    const idx = this.onlineMysteries.findIndex(m => m.id === this.selectedMystery!.id);
    return (idx >= 0 && idx < this.onlineMysteries.length - 1) ? this.onlineMysteries[idx + 1] : null;
  }

  selectPreviousMystery(): void {
    const prev = this.previousMystery;
    if (prev) this.selectedMystery = prev;
  }

  selectNextMystery(): void {
    const next = this.nextMystery;
    if (next) this.selectedMystery = next;
  }

  onLocateMystery(mystery: GtaMystery, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    this.locateOnMap.emit(mystery);
  }

  getMysteryAccentColor(m: GtaMystery | null): string {
    if (!m) return '#a855f7';
    return m.badgeColor || '#a855f7';
  }

  // -------------------------------------------------------------
  // ARMAS (WEAPONS CATALOG)
  // -------------------------------------------------------------
  loadWeapons(force = false, keepSelectedId?: string): void {
    if (this.weapons.length > 0 && !force) return;
    this.weaponsLoading = true;
    this.weaponsError = false;

    this.weaponService.getWeapons(this.gameMode).subscribe({
      next: (weapons) => {
        this.weapons = weapons;
        if (keepSelectedId) {
          this.selectedWeapon = weapons.find(w => w.id === keepSelectedId) || null;
        }
        this.weaponsLoading = false;
      },
      error: (err) => {
        console.error(`Error al cargar arsenal de armas (${this.gameMode}):`, err);
        this.weaponsLoading = false;
        this.weaponsError = true;
      }
    });
  }

  setWeaponCategory(cat: string): void {
    this.selectedWeaponCategory = cat;
  }

  setWeaponSort(sort: 'none' | 'damage' | 'fireRate' | 'accuracy' | 'range' | 'price'): void {
    this.selectedWeaponSort = sort;
  }

  onWeaponImgError(w: GtaWeapon): void {
    w.imgFailed = true;
  }

  selectWeapon(weapon: GtaWeapon): void {
    this.openWeaponDetail(weapon);
  }

  openWeaponDetail(weapon: GtaWeapon): void {
    this.selectedWeapon = weapon;
    this.drawerView = 'weapon-detail';
  }

  closeWeaponDetail(): void {
    this.selectedWeapon = null;
    this.drawerView = 'tabs';
  }

  get filteredWeapons(): GtaWeapon[] {
    const key = `${this.weapons ? this.weapons.length : 0}_${this.selectedWeaponCategory}_${this.weaponSearchQuery}_${this.selectedWeaponSort}`;
    if (this._cachedFWKey !== key) {
      this._cachedFWKey = key;
      let list = this.weapons;
      const cat = this.selectedWeaponCategory.toLowerCase();
      if (cat !== 'all') {
        list = list.filter(w => (w.category || '').toLowerCase() === cat);
      }
      const q = this.weaponSearchQuery.trim().toLowerCase();
      if (q) {
        list = list.filter(w =>
          (w.name && w.name.toLowerCase().includes(q)) ||
          (w.nameEn && w.nameEn.toLowerCase().includes(q)) ||
          (w.manufacturer && w.manufacturer.toLowerCase().includes(q)) ||
          (w.realCounterpart && w.realCounterpart.toLowerCase().includes(q)) ||
          (w.categoryLabel && w.categoryLabel.toLowerCase().includes(q)) ||
          (w.description && w.description.toLowerCase().includes(q))
        );
      }
      if (this.selectedWeaponSort !== 'none') {
        const sortKey = this.selectedWeaponSort;
        list = [...list].sort((a, b) => {
          const statA = (a as any)[sortKey] ?? 0;
          const statB = (b as any)[sortKey] ?? 0;
          if (statB !== statA) {
            return statB - statA;
          }
          return (a.name || '').localeCompare(b.name || '');
        });
      }
      this._cachedFW = list;
    }
    return this._cachedFW;
  }

  get weaponCategoryList(): { id: string; name: string; count: number; icon: string }[] {
    const lang = this.translationService.currentLang;
    const key = `${this.weapons ? this.weapons.length : 0}_${lang}`;
    if (this._cachedWCLKey !== key) {
      this._cachedWCLKey = key;
      const counts: { [cat: string]: number } = {};
      for (const w of this.weapons) {
        const cat = w.category || 'other';
        counts[cat] = (counts[cat] || 0) + 1;
      }
      const categories: { id: string; nameKey: string; icon: string }[] = [
        { id: 'all', nameKey: 'transports.weapons.categories.all', icon: 'fa-layer-group' },
        { id: 'pistols', nameKey: 'transports.weapons.categories.pistols', icon: 'fa-gun' },
        { id: 'smgs', nameKey: 'transports.weapons.categories.smgs', icon: 'fa-shield-halved' },
        { id: 'rifles', nameKey: 'transports.weapons.categories.rifles', icon: 'fa-crosshairs' },
        { id: 'shotguns', nameKey: 'transports.weapons.categories.shotguns', icon: 'fa-fire' },
        { id: 'snipers', nameKey: 'transports.weapons.categories.snipers', icon: 'fa-bullseye' },
        { id: 'heavy', nameKey: 'transports.weapons.categories.heavy', icon: 'fa-bomb' },
        { id: 'melee', nameKey: 'transports.weapons.categories.melee', icon: 'fa-hand-back-fist' },
        { id: 'throwables', nameKey: 'transports.weapons.categories.throwables', icon: 'fa-burst' },
      ];
      this._cachedWCL = categories.map(c => ({
        id: c.id,
        name: this.translationService.t(c.nameKey) || c.id,
        count: c.id === 'all' ? this.weapons.length : (counts[c.id] || 0),
        icon: c.icon
      })).filter(c => c.id === 'all' || c.count > 0);
    }
    return this._cachedWCL;
  }

  getWeaponCategoryCount(cat: string): number {
    if (cat === 'all') return this.weapons.length;
    return this.weapons.filter(w => (w.category || '').toLowerCase() === cat.toLowerCase()).length;
  }

  get previousWeapon(): GtaWeapon | null {
    if (!this.selectedWeapon || this.filteredWeapons.length === 0) return null;
    const idx = this.filteredWeapons.findIndex(w => w.id === this.selectedWeapon!.id);
    return idx > 0 ? this.filteredWeapons[idx - 1] : null;
  }

  get nextWeapon(): GtaWeapon | null {
    if (!this.selectedWeapon || this.filteredWeapons.length === 0) return null;
    const idx = this.filteredWeapons.findIndex(w => w.id === this.selectedWeapon!.id);
    return (idx >= 0 && idx < this.filteredWeapons.length - 1) ? this.filteredWeapons[idx + 1] : null;
  }

  selectPreviousWeapon(): void {
    const prev = this.previousWeapon;
    if (prev) this.selectedWeapon = prev;
  }

  selectNextWeapon(): void {
    const next = this.nextWeapon;
    if (next) this.selectedWeapon = next;
  }

  getWeaponAccentColor(w: GtaWeapon | null): string {
    if (!w) return '#ffb833';
    return w.badgeColor || '#ffb833';
  }

  getWeaponIcon(w: GtaWeapon | null): string {
    if (!w) return 'fa-gun';
    return w.icon || 'fa-gun';
  }
}

