import { TranslationSchema } from '../i18n.types';

export const es: TranslationSchema = {
  common: {
    backToHome: 'Inicio',
    lastUpdate: 'Última actualización',
    commit: 'Commit',
    close: 'Cerrar',
    search: 'Buscar...',
    loading: 'Cargando...',
    error: 'Error al cargar los datos',
    success: 'Operación realizada con éxito',
    all: 'Todos',
    days: 'Días',
    hours: 'Horas',
    minutes: 'Min',
    seconds: 'Seg',
    viewGeneral: 'Vista General',
    recenterMap: 'Centrar Mapa'
  },
  home: {
    chooseGame: 'Elige el juego',
    changeLanguage: 'Cambiar idioma',
    gta5Title: 'GTA V',
    gta5Sub: 'Mapa disponible',
    gta6Title: 'GTA VI',
    gta6Sub: 'En Desarrollo...',
    copyright: '© Copyright 2026 JMD Software, all rights reserved. JMD® and JMD Logo® are trademarks of The JMD Corporation. All rights Reserved.'
  },
  gta5: {
    hud: {
      propertiesCount: '{{ count }} Propiedades · {{ collectibles }} Coleccionables',
      inGameTime: 'Hora del juego',
      inGameTimeTitle: 'Hora del juego (Los Santos)',
      counterBadgeTitle: 'Inmuebles y negocios comprables mapeados',
      panelTitle: 'Panel de control',
      expandPanel: 'Clic para desplegar Panel de control',
      collapsePanel: 'Minimizar panel',
      settingsTitle: 'Ajustes',
      expandSettings: 'Clic para desplegar Ajustes',
      collapseSettings: 'Minimizar ajustes'
    },
    contextMenu: {
      editMarker: 'Editar nombre',
      deleteMarker: 'Eliminar este marcador',
      addMarker: 'Añadir marcador aquí',
      centerMap: 'Centrar mapa aquí'
    },
    settings: {
      gameMode: 'Modo de juego',
      onlineMode: 'GTA Online',
      storyMode: 'Modo Historia',
      onlineDesc: 'GTA Online: Búnkeres, Vehículos, Servicios y Coleccionables',
      storyDesc: 'Modo Historia: Negocios comprables y mapas UV',
      mapSelector: 'Selector de mapa',
      baseMap: 'Base del mapa',
      iconStyle: 'Estilo Iconos',
      markerTheme: 'Tema de marcadores',
      themeModern: 'Moderno (Neón & HUD)',
      themeClassic: 'Clásico (Sutil & Original)',
      iconSize: 'Tamaño de iconos',
      sizeCompact: 'Compacto (80%)',
      sizeStandard: 'Estándar (100%)',
      sizeLarge: 'Grande (120%)',
      jumpToRegion: 'Saltar a región',
      regionAll: 'Mapa Completo (Visión General)',
      regionCity: 'Ciudad',
      regionSandy: 'Zona de Desierto',
      regionPaleto: 'Norte',
      regionBlaine: 'Condado',
      regionChumash: 'Costa Oeste',
      police: 'Policía'
    },
    maps: {
      satellite: 'Satélite',
      roadmap: 'Carreteras',
      atlas: 'Atlas',
      game: 'Juego',
      uv: 'Ultravioleta (UV)',
      uv2: 'Ultravioleta 2 (UV Invertido)'
    },
    categories: {
      properties: 'Propiedades',
      businesses: 'Negocios',
      strangePlaces: 'Lugares Extraños',
      activities: 'Actividades',
      vehicles: 'Vehículos',
      collectibles: 'Coleccionables',
      services: 'Servicios',
      roleplay: 'Trabajos Roleplay',
      characters: 'Personajes',
      wildlife: 'Vida Salvaje',
      customMarkers: 'Marcadores Personalizados'
    }
  },
  gta6: {
    hud: {
      itemsCount: '{{ total }} Items · {{ categories }} Categorias',
      inGameTime: 'Hora del juego',
      launchTitle: 'Lanzamiento GTA VI',
      coordsDev: 'Clic para copiar coordenadas',
      panelTitle: 'Panel de control'
    },
    canvasHelp: 'Rueda del ratón para acercar o alejar, arrastra para mover'
  },
  transports: {
    title: 'Transportes',
    closeTitle: 'Cerrar Transportes',
    backToTransports: 'Volver a Transportes',
    tabs: {
      vehicles: 'Vehículos',
      missions: 'Misiones',
      item3: 'Item3',
      item4: 'Item4'
    },
    catalog: {
      loading: 'Cargando catálogo de {{ dealer }}...',
      error: 'No se pudo cargar el catálogo. Comprueba tu conexión.',
      empty: 'Sin vehículos disponibles para este concesionario.',
      availableCount: 'vehículos disponibles',
      ofCatalog: 'de {{ total }} en catálogo',
      specsTitle: 'FICHA DE ESPECIFICACIONES',
      buyPrice: 'Precio de Compra',
      tradePrice: 'Trade Price',
      weaponized: 'Vehículo Armado'
    },
    stats: {
      speed: 'Velocidad',
      acceleration: 'Aceleración',
      braking: 'Frenada',
      handling: 'Manejo'
    },
    dealers: {
      legendaryDesc: 'Superdeportivos, exóticos de competición y vehículos de hiperlujo.',
      superautosDesc: 'Muscle cars, compactos, sedanes, SUVs, todoterrenos y motos.',
      bennysDesc: 'Taller de personalización radical, lowriders y conversiones tuners.',
      elitasDesc: 'Aeronaves privadas, jets de negocios y helicópteros ejecutivos.',
      dockteaseDesc: 'Embarcaciones náuticas, yates, lanchas rápidas y motos de agua.',
      warstockDesc: 'Vehículos blindados, armamento militar pesado y maquinaria táctica.'
    }
  }
};
