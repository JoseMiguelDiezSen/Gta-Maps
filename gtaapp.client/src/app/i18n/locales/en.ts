import { TranslationSchema } from '../i18n.types';

export const en: TranslationSchema = {
  common: {
    backToHome: 'Home',
    lastUpdate: 'Last update',
    commit: 'Commit',
    close: 'Close',
    search: 'Search...',
    loading: 'Loading...',
    error: 'Error loading data',
    success: 'Operation completed successfully',
    all: 'All',
    days: 'Days',
    hours: 'Hours',
    minutes: 'Min',
    seconds: 'Sec',
    viewGeneral: 'Overview',
    recenterMap: 'Center Map'
  },
  home: {
    chooseGame: 'Select Game',
    changeLanguage: 'Change language',
    gta5Title: 'GTA V',
    gta5Sub: 'Map available',
    gta6Title: 'GTA VI',
    gta6Sub: 'In Development...',
    copyright: '© Copyright 2026 JMD Software, all rights reserved. JMD® and JMD Logo® are trademarks of The JMD Corporation. All rights Reserved.'
  },
  gta5: {
    hud: {
      propertiesCount: '{{ count }} Properties · {{ collectibles }} Collectibles',
      inGameTime: 'In-Game Time',
      inGameTimeTitle: 'In-game time (Los Santos)',
      counterBadgeTitle: 'Purchasable properties and businesses mapped',
      panelTitle: 'Control Panel',
      expandPanel: 'Click to expand Control Panel',
      collapsePanel: 'Collapse panel',
      settingsTitle: 'Settings',
      expandSettings: 'Click to expand Settings',
      collapseSettings: 'Collapse settings'
    },
    contextMenu: {
      editMarker: 'Edit name',
      deleteMarker: 'Delete this marker',
      addMarker: 'Add marker here',
      centerMap: 'Center map here'
    },
    settings: {
      gameMode: 'Game Mode',
      onlineMode: 'GTA Online',
      storyMode: 'Story Mode',
      onlineDesc: 'GTA Online: Bunkers, Vehicles, Services & Collectibles',
      storyDesc: 'Story Mode: Purchasable businesses and UV maps',
      mapSelector: 'Map Selector',
      baseMap: 'Base Map',
      iconStyle: 'Icon Style',
      markerTheme: 'Marker Theme',
      themeModern: 'Modern (Neon & HUD)',
      themeClassic: 'Classic (Subtle & Original)',
      iconSize: 'Icon Size',
      sizeCompact: 'Compact (80%)',
      sizeStandard: 'Standard (100%)',
      sizeLarge: 'Large (120%)',
      jumpToRegion: 'Jump to Region',
      regionAll: 'Full Map (Overview)',
      regionCity: 'City',
      regionSandy: 'Desert Area',
      regionPaleto: 'North (Paleto)',
      regionBlaine: 'Blaine County',
      regionChumash: 'West Coast (Chumash)',
      police: 'Police'
    },
    maps: {
      satellite: 'Satellite',
      roadmap: 'Roadmap',
      atlas: 'Atlas',
      game: 'In-Game',
      uv: 'Ultraviolet (UV)',
      uv2: 'Ultraviolet 2 (Inverted UV)'
    },
    categories: {
      properties: 'Properties',
      businesses: 'Businesses',
      strangePlaces: 'Strange Places',
      activities: 'Activities',
      vehicles: 'Vehicles',
      collectibles: 'Collectibles',
      services: 'Services',
      roleplay: 'Roleplay Jobs',
      characters: 'Characters',
      wildlife: 'Wildlife',
      customMarkers: 'Custom Markers'
    }
  },
  gta6: {
    hud: {
      itemsCount: '{{ total }} Items · {{ categories }} Categories',
      inGameTime: 'In-Game Time',
      launchTitle: 'GTA VI Release',
      coordsDev: 'Click to copy coordinates',
      panelTitle: 'Control Panel'
    },
    canvasHelp: 'Scroll wheel to zoom, drag to pan'
  },
  transports: {
    title: 'Transports',
    closeTitle: 'Close Transports',
    backToTransports: 'Back to Transports',
    tabs: {
      vehicles: 'Vehicles',
      missions: 'Missions',
      item3: 'Item3',
      item4: 'Item4'
    },
    catalog: {
      loading: 'Loading catalog for {{ dealer }}...',
      error: 'Could not load vehicle catalog. Check your connection.',
      empty: 'No vehicles available for this dealership.',
      availableCount: 'vehicles available',
      ofCatalog: 'of {{ total }} in catalog',
      specsTitle: 'SPECIFICATIONS SHEET',
      buyPrice: 'Purchase Price',
      tradePrice: 'Trade Price',
      weaponized: 'Weaponized Vehicle'
    },
    stats: {
      speed: 'Speed',
      acceleration: 'Acceleration',
      braking: 'Braking',
      handling: 'Handling'
    },
    dealers: {
      legendaryDesc: 'Supercars, competitive exotics, and hyper-luxury vehicles.',
      superautosDesc: 'Muscle cars, compacts, sedans, SUVs, off-roaders and bikes.',
      bennysDesc: 'Radical custom shop, lowriders and tuner conversions.',
      elitasDesc: 'Private aircraft, corporate jets and executive helicopters.',
      dockteaseDesc: 'Nautical vessels, luxury yachts, speedboats and watercraft.',
      warstockDesc: 'Armored vehicles, heavy military weaponry and tactical gear.'
    }
  }
};
