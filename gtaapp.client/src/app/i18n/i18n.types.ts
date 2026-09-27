export type LanguageCode = 'es' | 'en';

export interface LanguageInfo {
  code: LanguageCode;
  label: string;
  shortLabel: string;
}

export type TranslationParams = Record<string, string | number>;

export interface TranslationSchema {
  common: {
    backToHome: string;
    lastUpdate: string;
    commit: string;
    close: string;
    search: string;
    loading: string;
    error: string;
    success: string;
    all: string;
    days: string;
    hours: string;
    minutes: string;
    seconds: string;
    viewGeneral: string;
    recenterMap: string;
  };
  home: {
    chooseGame: string;
    changeLanguage: string;
    gta5Title: string;
    gta5Sub: string;
    gta6Title: string;
    gta6Sub: string;
    copyright: string;
  };
  gta5: {
    hud: {
      propertiesCount: string;
      inGameTime: string;
      inGameTimeTitle: string;
      counterBadgeTitle: string;
      panelTitle: string;
      expandPanel: string;
      collapsePanel: string;
      settingsTitle: string;
      expandSettings: string;
      collapseSettings: string;
    };
    contextMenu: {
      editMarker: string;
      deleteMarker: string;
      addMarker: string;
      centerMap: string;
    };
    settings: {
      gameMode: string;
      onlineMode: string;
      storyMode: string;
      onlineDesc: string;
      storyDesc: string;
      mapSelector: string;
      baseMap: string;
      iconStyle: string;
      markerTheme: string;
      themeModern: string;
      themeClassic: string;
      iconSize: string;
      sizeCompact: string;
      sizeStandard: string;
      sizeLarge: string;
      jumpToRegion: string;
      regionAll: string;
      regionCity: string;
      regionSandy: string;
      regionPaleto: string;
      regionBlaine: string;
      regionChumash: string;
      police: string;
    };
    maps: {
      satellite: string;
      roadmap: string;
      atlas: string;
      game: string;
      uv: string;
      uv2: string;
    };
    categories: {
      properties: string;
      businesses: string;
      strangePlaces: string;
      activities: string;
      vehicles: string;
      collectibles: string;
      services: string;
      roleplay: string;
      characters: string;
      wildlife: string;
      customMarkers: string;
    };
  };
  gta6: {
    hud: {
      itemsCount: string;
      inGameTime: string;
      launchTitle: string;
      coordsDev: string;
      panelTitle: string;
    };
    canvasHelp: string;
  };
  transports: {
    title: string;
    closeTitle: string;
    backToTransports: string;
    tabs: {
      vehicles: string;
      missions: string;
      item3: string;
      item4: string;
    };
    catalog: {
      loading: string;
      error: string;
      empty: string;
      availableCount: string;
      ofCatalog: string;
      specsTitle: string;
      buyPrice: string;
      tradePrice: string;
      weaponized: string;
    };
    stats: {
      speed: string;
      acceleration: string;
      braking: string;
      handling: string;
    };
    dealers: {
      legendaryDesc: string;
      superautosDesc: string;
      bennysDesc: string;
      elitasDesc: string;
      dockteaseDesc: string;
      warstockDesc: string;
    };
  };
}
