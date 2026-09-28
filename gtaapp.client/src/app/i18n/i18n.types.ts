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
    disclaimer: string;
    copyright: string;
    onlineUsers: string;
    onlineUser: string;
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
    popups: {
      income: string;
      buyer: string;
      price: string;
      pointOfInterest: string;
      hint: string;
      reward: string;
      edit: string;
      delete: string;
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
    layers: {
      storyBusiness: string;
      mansion: string;
      hangar: string;
      bunker: string;
      facility: string;
      arcade: string;
      autoShop: string;
      agency: string;
      salvageYard: string;
      arenaWar: string;
      ceoOffice: string;
      vehicleWarehouse: string;
      cokeLockup: string;
      weedFarm: string;
      warehouse: string;
      nightclub: string;
      cashFactory: string;
      methLab: string;
      docForgery: string;
      lsCustoms: string;
      bennys: string;
      haoGarage: string;
      lsCarMeet: string;
      policeStation: string;
      policeStationShort: string;
      hospital: string;
      fireStation: string;
      fireStationShort: string;
      ammuNation: string;
      ammuNationShort: string;
      convenienceStore: string;
      convenienceStoreShort: string;
      maskShop: string;
      maskShopShort: string;
      carWash: string;
      carWashShort: string;
      stripClub: string;
      activity: string;
      fakeUfo: string;
      shipwreck: string;
      cave: string;
      playingCard: string;
      actionFigure: string;
      signalJammer: string;
      movieProp: string;
      radioAntenna: string;
      alienBone: string;
      spaceshipPart: string;
      graffiti: string;
      submarinePart: string;
      letterScrap: string;
      emptyCollectiblesStory: string;
      emptyCharacters: string;
    };
    checkboxTitles: {
      toggleProperties: string;
      toggleBusinesses: string;
      toggleVehicles: string;
      toggleServices: string;
      toggleActivities: string;
      toggleRoleplay: string;
      toggleCharacters: string;
      toggleWildlife: string;
      toggleCollectibles: string;
      toggleStrangePlaces: string;
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
    categories: {
      propiedades: string;
      vehiculos: string;
      negocios: string;
      categoria_3: string;
      categoria_4: string;
      categoria_5: string;
      fauna: string;
      coleccionables: string;
      lugares: string;
      toggleAll: string;
    };
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
    missions: {
      searchPlaceholder: string;
      all: string;
      heists: string;
      loading: string;
      error: string;
      retry: string;
      empty: string;
      backToMissions: string;
      missionBadge: string;
      contact: string;
      synopsis: string;
      reward: string;
      unlockedAfter: string;
      goldObjectives: string;
      returnToList: string;
      prevMission: string;
      nextMission: string;
    };
  };
}
