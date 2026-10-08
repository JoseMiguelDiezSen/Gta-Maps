import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { GuiaManifest, GuiaSeccion, GuiaArticulo, GuiaArticuloResumen } from '../models/guia';

@Injectable({
  providedIn: 'root'
})
export class GuiaService {
  constructor(private http: HttpClient) {}

  /**
   * Obtiene el manifiesto completo con secciones y listado de artículos para GTA 5 o GTA 6.
   */
  getManifest(juegoId: 'gta5' | 'gta6'): Observable<GuiaManifest> {
    return this.http.get<GuiaManifest>(`/api/${juegoId}/guia/manifest`).pipe(
      catchError(() => of(this.getFallbackManifest(juegoId)))
    );
  }

  /**
   * Obtiene las secciones temáticas de la guía.
   */
  getSecciones(juegoId: 'gta5' | 'gta6'): Observable<GuiaSeccion[]> {
    return this.http.get<GuiaSeccion[]>(`/api/${juegoId}/guia/secciones`).pipe(
      catchError(() => of(this.getFallbackManifest(juegoId).secciones))
    );
  }

  /**
   * Obtiene el contenido completo de un artículo por su ID o slug.
   */
  getArticulo(juegoId: 'gta5' | 'gta6', articuloId: string): Observable<GuiaArticulo> {
    return this.http.get<GuiaArticulo>(`/api/${juegoId}/guia/articulos/${encodeURIComponent(articuloId)}`).pipe(
      catchError(() => {
        const art = this.getFallbackArticulo(juegoId, articuloId);
        return of(art);
      })
    );
  }

  /**
   * Busca artículos en la guía correspondiente.
   */
  buscarArticulos(juegoId: 'gta5' | 'gta6', query: string): Observable<GuiaArticuloResumen[]> {
    const params = new HttpParams().set('q', query);
    return this.http.get<GuiaArticuloResumen[]>(`/api/${juegoId}/guia/buscar`, { params }).pipe(
      catchError(() => {
        const q = (query || '').toLowerCase().trim();
        const manifest = this.getFallbackManifest(juegoId);
        const results: GuiaArticuloResumen[] = [];
        for (const sec of manifest.secciones) {
          for (const a of sec.articulos) {
            if (a.titulo.toLowerCase().includes(q) || a.subtitulo.toLowerCase().includes(q)) {
              results.push(a);
            }
          }
        }
        return of(results);
      })
    );
  }

  /* --------------------------------------------------------------------------
     DATOS LOCALES DE RESPALDO (OFFLINE / INICIALES)
     -------------------------------------------------------------------------- */
  private getFallbackManifest(juegoId: 'gta5' | 'gta6'): GuiaManifest {
    if (juegoId === 'gta5') {
      return {
        id: 'gta5',
        juego: 'Grand Theft Auto V',
        titulo: 'Guía GTA V',
        descripcion: 'Compendio interactivo de Los Santos y Blaine County: Modo Historia al 100%, Golpes, Bolsa e Inversiones, y Secretos.',
        bannerUrl: 'assets/home-bg.jpg',
        secciones: [
          {
            id: 'historia-100',
            titulo: 'Modo Historia & 100%',
            icono: 'trophy',
            descripcion: 'Requisitos del 100%, misiones de campaña y decisiones tácticas.',
            orden: 1,
            articulos: [
              { id: 'requisitos-100', slug: 'requisitos-100', titulo: 'Requisitos para el 100%', subtitulo: 'Guía detallada para conseguir la estadística del 100%', categoria: 'historia-100', badge: '100% Checklist', tiempoLecturaMinutos: 6 },
              { id: 'golpes-principales', slug: 'golpes-principales', titulo: 'Guía Táctica de los 6 Grandes Golpes', subtitulo: 'Planes Sigilo/Fuerza, tripulación ideal y botín máximo', categoria: 'historia-100', badge: 'Estrategia', tiempoLecturaMinutos: 10 },
              { id: 'finales-opcion-abc', slug: 'finales-opcion-abc', titulo: 'Los Tres Finales (Opción A, B o C)', subtitulo: 'Consecuencias narrativas y por qué la C es canónica', categoria: 'historia-100', badge: 'Lore', tiempoLecturaMinutos: 5 }
            ]
          },
          {
            id: 'personajes',
            titulo: 'Protagonistas & Facciones',
            icono: 'users',
            descripcion: 'Michael, Franklin y Trevor: habilidades, trasfondo y misiones personales.',
            orden: 2,
            articulos: [
              { id: 'michael-de-santa', slug: 'michael-de-santa', titulo: 'Michael De Santa: El Ladrón Retirado', subtitulo: 'Tiempo bala, crisis existencial y relación con el FIB', categoria: 'personajes', tiempoLecturaMinutos: 5 },
              { id: 'franklin-clinton', slug: 'franklin-clinton', titulo: 'Franklin Clinton: La Nueva Sangre', subtitulo: 'Conducción ralentizada, Chop y Forum Drive', categoria: 'personajes', tiempoLecturaMinutos: 5 },
              { id: 'trevor-philips', slug: 'trevor-philips', titulo: 'Trevor Philips: El Caos Encarnado', subtitulo: 'Modo Furia, Industrias TP y su pasado en North Yankton', categoria: 'personajes', tiempoLecturaMinutos: 6 }
            ]
          },
          {
            id: 'negocios-economia',
            titulo: 'Negocios, Propiedades & Bolsa',
            icono: 'trending-up',
            descripcion: 'Inversiones en bolsa con Lester y compra de propiedades en Los Santos.',
            orden: 3,
            articulos: [
              { id: 'asesinatos-lester-bolsa', slug: 'asesinatos-lester-bolsa', titulo: 'Inversión en Bolsa con las Misiones de Lester', subtitulo: 'Cómo conseguir $2.147 millones con cada personaje', categoria: 'negocios-economia', badge: 'Dinero Infinito', tiempoLecturaMinutos: 8 },
              { id: 'guia-negocios-propiedades', slug: 'guia-negocios-propiedades', titulo: 'Guía de Negocios y Propiedades Comprables', subtitulo: 'Costes, ingresos semanales y misiones de gestión', categoria: 'negocios-economia', badge: 'Inversiones', tiempoLecturaMinutos: 7 }
            ]
          },
          {
            id: 'secretos-misterios',
            titulo: 'Secretos & Misterios',
            icono: 'sparkles',
            descripcion: 'El misterio de Mount Chiliad, los 4 OVNIs y el asesino de los 8 infinitos.',
            orden: 4,
            articulos: [
              { id: 'misterio-chiliad', slug: 'misterio-chiliad', titulo: 'El Gran Misterio de Mount Chiliad', subtitulo: 'El mural, los 4 OVNIs, lluvia a las 3 AM y la verdad del Jetpack', categoria: 'secretos-misterios', badge: 'Misterio', tiempoLecturaMinutos: 7 },
              { id: 'fantasma-monte-gordo', slug: 'fantasma-monte-gordo', titulo: 'El Fantasma de Jolene Cranley-Evans', subtitulo: 'Hora exacta de aparición, sangre en la roca y la historia de Jock Cranley', categoria: 'secretos-misterios', tiempoLecturaMinutos: 4 },
              { id: 'asesino-ocho-infinitos', slug: 'asesino-ocho-infinitos', titulo: 'El Asesino de los 8 Infinitos (Merle Abrahams)', subtitulo: 'Los 8 cadáveres sumergidos y las pistas en Paleto Bay', categoria: 'secretos-misterios', tiempoLecturaMinutos: 5 }
            ]
          },
          {
            id: 'trucos-codigos',
            titulo: 'Trucos y Códigos',
            icono: 'key',
            descripcion: 'Lista completa de trucos para PC, consolas y teléfono celular.',
            orden: 5,
            articulos: [
              { id: 'lista-trucos-gta5', slug: 'lista-trucos-gta5', titulo: 'Todos los Trucos y Códigos de GTA 5', subtitulo: 'Invencibilidad, todas las armas, súper salto, Buzzard y clima', categoria: 'trucos-codigos', badge: 'Popular', tiempoLecturaMinutos: 5 }
            ]
          }
        ]
      };
    } else {
      return {
        id: 'gta6',
        juego: 'Grand Theft Auto VI',
        titulo: 'Guía GTA VI & Base de Datos',
        descripcion: 'Compendio interactivo de Vice City y el Estado de Leonida: protagonistas, distritos, mecánicas de sigilo e inventario y análisis criminal.',
        bannerUrl: 'assets/home-bg.jpg',
        secciones: [
          {
            id: 'protagonistas-historia',
            titulo: 'Protagonistas & Trama Criminal',
            icono: 'users',
            descripcion: 'Jason y Lucia: dinámicas cooperativas, robos a mano armada y sistema de confianza.',
            orden: 1,
            articulos: [
              { id: 'jason-lucia-dinamica', slug: 'jason-lucia-dinamica', titulo: 'Jason y Lucia: El Dúo Criminal', subtitulo: 'Mecánicas cooperativas, confianza y robos a mano armada en Leonida', categoria: 'protagonistas-historia', badge: 'Protagonistas', tiempoLecturaMinutos: 6 },
              { id: 'lucia-caminos-perfil', slug: 'lucia-caminos-perfil', titulo: 'Lucia: Trasfondo Penitenciario y Habilidades', subtitulo: 'El Centro Correccional de Leonida, grillete electrónico y motivaciones', categoria: 'protagonistas-historia', badge: 'Perfil', tiempoLecturaMinutos: 5 },
              { id: 'jason-duval-perfil', slug: 'jason-duval-perfil', titulo: 'Jason: Especialista en Armas y Conducción', subtitulo: 'Pasado militar, contactos clandestinos y sincronización de combate', categoria: 'protagonistas-historia', badge: 'Perfil', tiempoLecturaMinutos: 5 }
            ]
          },
          {
            id: 'mundo-leonida',
            titulo: 'Vice City & Regiones de Leonida',
            icono: 'map-pin',
            descripcion: 'Guía geográfica de Vice City, Port Gellhorn, Ambrosia y los Cayos de Gellhorn.',
            orden: 2,
            articulos: [
              { id: 'mapa-leonida-zonas', slug: 'mapa-leonida-zonas', titulo: 'Las Regiones del Estado de Leonida', subtitulo: 'Vice City, Port Gellhorn, Ambrosia, Leonard County y los Cayos', categoria: 'mundo-leonida', badge: 'Geografía', tiempoLecturaMinutos: 8 },
              { id: 'vice-city-distritos', slug: 'vice-city-distritos', titulo: 'Distritos Urbanos de Vice City', subtitulo: 'Vice Beaches, Ocean Drive, Downtown, Little Haiti y Starfish Island', categoria: 'mundo-leonida', badge: 'Distritos', tiempoLecturaMinutos: 6 },
              { id: 'humedales-pantanos-fauna', slug: 'humedales-pantanos-fauna', titulo: 'Grassrivers y Fauna Salvaje', subtitulo: 'Los pantanos de Leonida, caimanes agresivos, caza y lanchas hidrodeslizadoras', categoria: 'mundo-leonida', badge: 'Ecosistema', tiempoLecturaMinutos: 5 }
            ]
          },
          {
            id: 'mecanicas-jugabilidad',
            titulo: 'Mecánicas & Físicas de Juego',
            icono: 'cpu',
            descripcion: 'Inventario físico limitado, maleteros de vehículos y balística de última generación.',
            orden: 3,
            articulos: [
              { id: 'inventario-maletero-armas', slug: 'inventario-maletero-armas', titulo: 'Sistema de Inventario Realista y Maleteros', subtitulo: 'Límite de armas portables y equipamiento vehicular estilo RDR2', categoria: 'mecanicas-jugabilidad', badge: 'Mecánicas', tiempoLecturaMinutos: 6 },
              { id: 'fisicas-vehiculos-personalizacion', slug: 'fisicas-vehiculos-personalizacion', titulo: 'Física de Vehículos, Tracción e Interiores', subtitulo: 'Ajuste de espejos retrovisores, pedales y comportamiento todoterreno', categoria: 'mecanicas-jugabilidad', badge: 'Vehículos', tiempoLecturaMinutos: 5 }
            ]
          },
          {
            id: 'ia-sistema-policial',
            titulo: 'Fuerzas del Orden & Redes Sociales',
            icono: 'shield',
            descripcion: 'Comportamiento policial avanzado, reconocimiento facial y viralidad digital.',
            orden: 4,
            articulos: [
              { id: 'redes-sociales-policia', slug: 'redes-sociales-policia', titulo: 'Redes Sociales y Sistema Policial Inteligente', subtitulo: 'Grabaciones de testigos, reconocimiento facial y cámaras de tráfico', categoria: 'ia-sistema-policial', badge: 'IA Policial', tiempoLecturaMinutos: 6 },
              { id: 'patrullas-persecucion-tactica', slug: 'patrullas-persecucion-tactica', titulo: 'Tácticas de Contención y Persecución', subtitulo: 'Bandas de clavos, helicópteros nocturnos con focos y cercos perimetrales', categoria: 'ia-sistema-policial', badge: 'Tácticas', tiempoLecturaMinutos: 5 }
            ]
          }
        ]
      };
    }
  }

  private getFallbackArticulo(juegoId: 'gta5' | 'gta6', articuloId: string): GuiaArticulo {
    const manifest = this.getFallbackManifest(juegoId);
    for (const sec of manifest.secciones) {
      const found = sec.articulos.find(a => a.id === articuloId || a.slug === articuloId);
      if (found) {
        const siblings = sec.articulos.filter(a => a.id !== found.id);
        const related = siblings.length >= 2
          ? siblings.slice(0, 2)
          : manifest.secciones.flatMap(s => s.articulos).filter(a => a.id !== found.id).slice(0, 2);

        return {
          ...found,
          tags: ['Guía', sec.titulo, juegoId === 'gta5' ? 'Los Santos' : 'Vice City'],
          relacionados: related,
          ultimaActualizacion: new Date().toISOString(),
          contenidoMarkdown: this.getArticuloMarkdown(articuloId)
        };
      }
    }

    // Default fallback
    return {
      id: 'requisitos-100',
      slug: 'requisitos-100',
      titulo: 'Requisitos para el 100% en GTA V',
      subtitulo: 'Todo lo estrictamente necesario para desbloquear la estadística del 100% y el logro Carrera Delictiva',
      categoria: 'historia-100',
      badge: 'Imprescindible',
      tiempoLecturaMinutos: 6,
      tags: ['100%', 'Logros', 'Misiones', 'Coleccionables', 'Trofeos'],
      ultimaActualizacion: new Date().toISOString(),
      relacionados: [],
      contenidoMarkdown: this.getArticuloMarkdown('requisitos-100')
    };
  }

  private getArticuloMarkdown(articuloId: string): string {
    switch (articuloId) {
      case 'requisitos-100':
        return `## 🏆 Resumen de Requisitos para el 100%

Para alcanzar el 100% en la pestaña de Estadísticas de GTA V no necesitas hacer absolutamente todas las misiones secundarias del juego, sino cumplir la siguiente lista de verificación de Rockstar Games:

---

### 1. Misiones Principales de Campaña (69 misiones)
* Superar las **69 misiones de la historia principal**, incluyendo todos los golpes planificados desde el Prólogo en North Yankton hasta el desenlace de la trama.
* La elección del plan táctico (Sigilo o Fuerza bruta) o el final escogido no impiden alcanzar el 100%.

---

### 2. Extraños y Locos (20 de 58 misiones)
Solamente cuentan las misiones de **Franklin Clinton**, ya que Michael y Trevor tienen misiones opcionales que no bloquean el trofeo:
* **Tonya**: Las 5 misiones de remolque de grúa en Los Santos.
* **Beverly**: Todas las misiones de paparazzi y persecución de celebridades.
* **Hao**: La carrera urbana inicial que desbloquea las competiciones nocturnas.
* **Barry**: Las misiones de legalización exclusivas de Franklin.
* **Mary-Ann**: La carrera de triatlón y persecución a pie con Franklin.
* **Dom**: Los 4 desafíos de salto en paracaídas extremo.
* **Omega**: Reunir las 50 piezas de la nave espacial (desbloquea el vehículo Space Docker).
* **Dreyfuss**: Reunir los 50 fragmentos de carta y resolver el asesinato de Leonora Johnson.

---

### 3. Pasatiempos y Aficiones (42 actividades)
* **Golf**: Ganar un partido de 9 hoyos quedando al par o bajo par.
* **Tenis**: Ganar un set completo contra la IA o un amigo.
* **Dardos**: Ganar una partida completa en el bar de Yellow Jack Inn o Los Santos.
* **Triatlones**: Completar los 3 triatlones (incluyendo el gran Triatlón del Lago Zancudo).
* **Galería de Tiro**: Superar todos los desafíos de tiro con al menos medalla de bronce en cada tipo de arma.
* **Escuela de Vuelo**: Superar las 12 pruebas de la Escuela de Vuelo de Los Santos International.
* **Carreras Urbanas**: Ganar las 5 carreras nocturnas en coche.
* **Carreras Todoterreno**: Ganar las 6 carreras todoterreno por el desierto y las montañas.
* **Carreras Marítimas**: Ganar las 4 carreras de lanchas.
* **Club de Striptease**: Conseguir un baile privado con una bailarina.
* **Paracaidismo**: Superar todos los saltos base y desde helicóptero de la ciudad.

---

### 4. Eventos Aleatorios (14 eventos)
* Presenciar y resolver con éxito al menos **14 de los 57 eventos aleatorios** repartidos por Los Santos y el Condado de Blaine (como robos a transeúntes, ladrones de cajeros automáticos o autostopistas).

---

### 5. Varios y Exploración (16 actividades)
* Comprar al menos **5 propiedades** que generen ingresos semanales.
* Comprar un vehículo a través de Internet en el teléfono móvil (Eyefind).
* Recoger las **50 partes de la nave espacial**.
* Recoger las **50 cartas del misterio de Leonora Johnson**.
* Realizar **25 de los 50 Saltos Acrobáticos únicos**.
* Realizar **8 de los 15 Vuelos Bajo el Puente**.
* Realizar **8 de los 15 Vuelos a Cuchillo** entre los rascacielos del centro.
* Ir al cine a ver una película completa.
* Salir a pasear y lanzar la pelota con **Chop** usando a Franklin.`;

      case 'golpes-principales':
        return `## 💰 Guía Táctica de los 6 Grandes Golpes

Los Golpes son el núcleo de la historia de GTA V. Cada uno te permite elegir entre dos enfoques tácticos y contratar a miembros de apoyo (Pistoleros, Conductores y Hackers).

> **Consejo Clave de Tripulación**: Los miembros novatos ganan habilidad en cada golpe sin pedir más porcentaje. Contratar novatos con bajo porcentaje inicial maximiza tus ganancias en los golpes finales.

---

### 1. El Golpe a la Joyería Vangelico
* **Enfoque Recomendado**: **Plan A (Sigilo)**. Usar gas BZ a través de los conductos de ventilación te da más tiempo en la tienda sin enfrentarte de inmediato a la policía.
* **Hacker**: **Rickie Lukens** (4% de comisión tras ayudarle en Lifeinvader). Te da 3 minutos y 30 segundos, suficiente para vaciar todas las vitrinas.
* **Conductor**: **Karim Denz** (8%). Elige las motos Bagger; aunque se equivoque en los túneles del río Los Santos, no perderás botín.
* **Pistolero**: **Packie McReary** (12%, desbloqueable en evento aleatorio en Strawberry) o **Norm Richards** (7%).

---

### 2. El Golpe a Merryweather
* **Enfoque**: **Plan A (Cargobob / Alta mar)** o **Plan B (Submarino / Carguero)**.
* **Botín Neto**: **$0** (Lester descubre que el superarma es propiedad del gobierno de EE.UU. y debe ser devuelta para evitar la persecución federal).

---

### 3. El Golpe de Paleto Bay
* **Enfoque**: Ataque frontal con trajes blindados de Juggernaut y ametralladoras rotatorias Minigun.
* **Pistolero**: **Chef** (12%) o **Packie McReary** (12%). Mantendrán a raya a los SWAT sin morir ni perder dinero de la bolsa.
* **Botín Bruto**: ~$8.000.000 (disminuye cada vez que la policía dispara a tu espalda).

---

### 4. El Asalto a los Laboratorios Humane
* **Objetivo**: Recuperar la toxina neuroparalizante para Steve Haines y Dave Norton.
* **Preparación**: Conseguir el gas neurotóxico y escapar a través de los respiraderos subacuáticos con escafandras.

---

### 5. El Asalto al Edificio del FIB
* **Enfoque Recomendado**: **Plan B (Entrada por el techo / Paracaidismo)**. Evitas disfrazarte de bomberos y el tiroteo es mucho más directo y limpio.
* **Hacker**: **Rickie Lukens** (4%) para apagar los cortafuegos rápidamente.

---

### 6. El Gran Golpe (Union Depository)
* **Enfoque Recomendado**: **Plan A (Sutil / Tráfico)** o **Plan B (Perforadora frontal)**.
* **Conductor 1**: **Karim Denz** (8%) si ya ha participado en golpes anteriores y tiene su habilidad al máximo.
* **Conductor 2**: **Taliana Martinez** (5%, rescatable en la autovía del norte de Sandy Shores). Es la mejor conductora del juego y solo pide un 5%.
* **Botín Máximo**: Alrededor de **$201.600.000 en lingotes de oro** (~$35.000.000 netos para cada protagonista).`;

      case 'finales-opcion-abc':
        return `## 🎭 Los Tres Finales: Opción A, B o C

Al finalizar la misión del Gran Golpe, Franklin Clinton recibe la visita de Devin Weston y Steve Haines, obligándole a tomar una decisión irrevocable sobre su lealtad:

---

### Opción A: Matar a Trevor (Sensatez)
* Franklin persigue a Trevor hasta los tanques de petróleo de El Burro Heights. Michael interviene embistiendo la furgoneta de Trevor contra un tanque de combustible.
* Trevor muere envuelto en llamas. Franklin y Michael se distancian para siempre. Pierdes a Trevor y todo su dinero.

---

### Opción B: Matar a Michael (El Momento Ha Llegado)
* Franklin cita a Michael en los límites de la ciudad. Tras una persecución por una central eléctrica, Michael cuelga de una torre metálica.
* Michael muere tras caer al vacío. Trevor corta cualquier relación con Franklin repudiándolo como un traidor. Pierdes a Michael y su fortuna.

---

### Opción C: La Tercera Vía (El Final Canónico)
* Franklin busca a Lester para idear un plan: unir a los tres protagonistas en una fundición abandonada para tender una emboscada tanto a los agentes de Merryweather como a los del FIB.
* **Las Ejecuciones Coordinadas**:
  * Trevor viaja a Del Perro Pier y asesina a **Steve Haines** mientras rueda su programa en la noria.
  * Michael se infiltra en Chumash y elimina a **Stretch**.
  * Franklin embosca a la tríada china y elimina a **Wei Cheng** en Pacific Bluffs.
  * Los tres capturan a **Devin Weston** en su mansión, lo encierran en el maletero de su propio coche y lo empujan por el acantilado hacia el Océano Pacífico.
* **Consecuencias**: Los tres protagonistas sobreviven, conservan sus botines del Gran Golpe y siguen disponibles para jugar en Los Santos.`;

      case 'michael-de-santa':
        return `## 🕶️ Michael De Santa: El Ladrón Retirado

Michael Townley (más tarde rebautizado como Michael De Santa) es el cerebro táctico de los golpes y el núcleo de la crisis familiar de la historia.

---

### 1. Habilidad Especial: Disparo en Tiempo Bala
* **Activación**: Presiona ambos joysticks (L3 + R3 en consola) o la tecla asignada en PC mientras apuntas con un arma de fuego.
* **Efecto**: Ralentiza el tiempo a tu alrededor mientras tu velocidad de apuntado se mantiene intacta. Ideal para acertar tiros a la cabeza en tiroteos multitudinarios.
* **Cómo Recargar la Barra**: Lograr bajas con tiros a la cabeza, conducir a altas velocidades o mantener la salud por debajo del 25%.

---

### 2. Historia y Relación con el FIB
* Tras fingir su muerte en el atraco de Ludendorff (North Yankton) en 2004 mediante un pacto secreto con el agente corrupto del FIB **Dave Norton**, Michael vive bajo protección encubierta en su mansión de Rockford Hills.
* Su vida acomodada se desmorona cuando descubre la infidelidad de su esposa Amanda, lo que le lleva a destruir la casa de Martin Madrazo y necesitar dinero rápido para pagar la deuda.`;

      case 'franklin-clinton':
        return `## 🚗 Franklin Clinton: La Nueva Sangre

Nacido en South Central Los Santos, Franklin busca escapar del ciclo de bandas de callejón y trapicheos menores de la banda Families de Forum Drive.

---

### 1. Habilidad Especial: Conducción Ralentizada
* **Activación**: Activable exclusivamente mientras conduces cualquier vehículo terrestre (coches, motos, camiones).
* **Efecto**: Ralentiza el tiempo con control vectorial total, permitiendo tomar curvas a 200 km/h, esquivar el tráfico en dirección contraria y colarse por huecos imposibles.
* **Cómo Recargar la Barra**: Conducir en dirección contraria en autopistas, rozar coches a alta velocidad sin chocar y alcanzar la velocidad punta del vehículo.

---

### 2. Chop el Rottweiler
* Franklin puede sacar a pasear a Chop, entrenarlo para olfatear objetos coleccionables ocultos (piezas de nave espacial y cartas) y atacar a enemigos asignados.`;

      case 'trevor-philips':
        return `## 🪓 Trevor Philips: El Caos Encarnado

Ex piloto de la fuerza aérea canadiense y sociópata residente en el desierto de Grand Senora (Sandy Shores). Director ejecutivo de *Trevor Philips Enterprises*.

---

### 1. Habilidad Especial: Modo Furia (Invulnerabilidad Parcial)
* **Efecto**: Trevor entra en un estado psicótico donde recibe un 50% menos de daño enemigo e inflige el doble de daño con armas de fuego y cuerpo a cuerpo.
* **Cómo Recargar la Barra**: Recibir daño, matar enemigos rápidamente, atropellar transeúntes y sufrir explosiones cercanas.

---

### 2. Misiones de Matanza (Rampages)
* Exclusivas de Trevor: 5 desafíos frenéticos contra bandas rivales (Rednecks, Cholos, Militares de Fort Zancudo y Hipsters de Los Santos) donde debes sobrevivir eliminando un número específico de atacantes armados con lanzagranadas y rifles de asalto.`;

      case 'asesinatos-lester-bolsa':
        return `## 📈 Inversión en Bolsa con las Misiones de Lester

Este es el método más lucrativo de todo el juego. Permite multiplicar el botín del último golpe y conseguir el máximo de dinero permitido por el motor del juego (**$2.147.483.647** por protagonista).

> **Regla de Oro**: Completa únicamente la primera misión de Lester (*El Asesinato en el Hotel*) porque es obligatoria para avanzar la historia. **Guarda las otras 4 misiones para DESPUÉS de completar el Gran Golpe final**, cuando cada personaje tenga ~$35.000.000 para invertir.

---

### 1. Misión: El Asesinato en el Hotel
* **Antes de la misión**: Invierte todo el dinero de los 3 personajes en **Betta Pharmaceuticals** (mercado BAWSAQ).
* **Después de la misión**: Espera unas 48 horas en el juego durmiendo sin guardar hasta que las acciones suban un **~50%**. Vende todo.
* **Paso siguiente**: Invierte de inmediato en **Bilkington** (LCN). Espera a que se recupere para ganar otro **~80%**.

---

### 2. Misión: El Asesinato Múltiple
* **Antes de la misión**: Invierte todo el dinero en **Debonaire** (LCN).
* **Después de la misión**: Espera a que Debonaire alcance un beneficio del **~80%**. Vende todo.
* **Paso siguiente**: Invierte inmediatamente todo el dinero en su competidora **Redwood** (LCN). Espera unas 72 horas en el juego hasta que Redwood rebote un espectacular **~300%**.

---

### 3. Misión: El Asesinato del Vicio
* **Antes de la misión**: Invierte todo el dinero en **Fruit** (BAWSAQ).
* **Después de la misión**: Vende cuando Fruit alcance un **~50%** de beneficio.
* **Paso siguiente**: Compra acciones de **Facade** (BAWSAQ) y vende al recuperarse un **~30%**.

---

### 4. Misión: El Asesinato del Autobús
* **Antes de la misión**: NO inviertas nada.
* **Después de la misión**: Espera a que **Vapid** (BAWSAQ) caiga en picado tras el asesinato. Compra todas las acciones posibles de Vapid y espera al rebote del **~100%**.

---

### 5. Misión: El Asesinato de la Obra
* **Antes de la misión**: Invierte todo en **GoldCoast** (LCN).
* **Después de la misión**: Vende cuando GoldCoast suba un **~80%**.`;

      case 'guia-negocios-propiedades':
        return `## 🏢 Guía de Negocios y Propiedades Comprables

Comprar propiedades en Los Santos te otorga fuentes regulares de ingresos semanales y beneficios pasivos indispensables.

---

### 1. Los Santos Customs (Desierto de Grand Senora)
* **Comprador Exclusivo**: **Franklin Clinton**.
* **Precio**: $349.000.
* **Beneficio Especial**: **Todas las modificaciones de vehículos son 100% GRATUITAS para Franklin de por vida** (blindaje, motores turbo, pintura, ruedas personalizadas).

---

### 2. Sonar Collections Dock (Paleto Cove)
* **Precio**: $250.000.
* **Beneficio**: Desbloquea la lancha Dinghy con equipo de buceo autónomo y el minisubmarino para recoger los 30 barriles de residuos nucleares en el fondo oceánico ($23.000 por barril + bonus de $250.000 al reunirlos todos).

---

### 3. Los Santos Golf Club (Richman)
* **Precio**: $150.000.000 (la propiedad más cara del juego).
* **Ingresos**: $264.500 semanales.
* **Beneficio**: Jugar gratis y jugar vestido con cualquier atuendo sin restricciones.`;

      case 'misterio-chiliad':
        return `## 🛸 El Gran Misterio de Mount Chiliad

En la estación superior del teleférico de Mount Chiliad se encuentra grabado en la pared el famoso **Mural de Chiliad**, mostrando una montaña piramidal con símbolos interconectados: un OVNI, un Huevo agrietado y un Humanoide volando con un Jetpack.

---

### 1. El OVNI de Mount Chiliad
* **Condiciones Exactas de Aparición**:
  1. Tener el **100% completado** en las estadísticas del juego.
  2. Subir al mirador de madera en la cima de Mount Chiliad.
  3. Debe ser exactamente las **03:00 AM**.
  4. El clima debe ser de **lluvia o tormenta con relámpagos** (puedes forzarlo con trucos de clima).
* Al cumplirse las 4 condiciones, un gigantesco OVNI holográfico con las siglas del FIB flota silenciosamente sobre la cima.

---

### 2. Los Otros 3 OVNIs del Mapa
* **OVNI de Fort Zancudo**: Flotando a altitud máxima sobre la base militar (muestra tecnología furtiva militar y emite un ensordecedor pulso electromagnético).
* **OVNI de Sandy Shores**: Flotando sobre el monumento hippie en el desierto con las letras 'FIB' rotuladas en el fuselaje.
* **OVNI Sumergido**: Un platillo volante estrellado en el lecho marino al norte de Procopio Beach, cubierto de algas y corales.`;

      case 'fantasma-monte-gordo':
        return `## 👻 El Fantasma de Jolene Cranley-Evans

Uno de los mitos paranormales más famosos de San Andreas se encuentra en la cima rocosa de **Mount Gordo**, al noreste del mapa.

---

### 1. Hora y Condiciones de Aparición
* Si acudes a la cima de Mount Gordo entre las **23:00 y las 00:00 de la medianoche en el juego**, verás flotando sobre una roca plana la figura etérea y pálida de una mujer con vestido blanco.
* Si te acercas demasiado, el espectro se desvanece en el aire, revelando sobre la roca un mensaje escrito con sangre fresca: **'JOCK'**.

---

### 2. La Verdad del Asesinato
* Jolene Cranley-Evans era la esposa de **Jock Cranley** (el famoso doble de acción y candidato a gobernador de San Andreas que aparece en los anuncios de televisión y radio).
* En 1978, Jock empujó a su esposa Jolene por el acantilado rocoso de Mount Gordo durante un paseo nocturno para evitar que interfiriera en sus aspiraciones de mudarse a Los Santos y triunfar como actor.`;

      case 'asesino-ocho-infinitos':
        return `## ♾️ El Asesino de los 8 Infinitos (Merle Abrahams)

El misterio del asesino en serie de Blaine County sigue el rastro de **Merle Abrahams**, conocido como el 'Asesino de los Infinitos', quien asesinó a 8 personas en 1999 motivado por su obsesión enfermiza con el número 8 y el símbolo del infinito.

---

### 1. Las Pistas en Paleto Bay
* En una casa abandonada y quemada en Paleto Bay se encuentra una pintada en la pared con un poema macabro:
> *'One is done, Two was fun, Three tried to run, Four called mom, Five's not alive, Six is nixes, Seven's in heaven, 8 won't wait.'*

---

### 2. La Celda en la Prisión de Bolingbroke
* En el patio de la penitenciaría de Bolingbroke, sobre una de las paredes de hormigón, Merle dejó grabada su última pista antes de morir en prisión:
> *'Where water meets land and jumping over the rocks, refuse will bring you to the 8.'*

---

### 3. Las Coordenadas de los 8 Cadáveres
* En el océano al norte de Paleto Bay, sumergidos a gran profundidad entre formaciones rocosas submarinas, se encuentran los **8 cuerpos envueltos en sábanas blancas y atados con cuerdas**.
* Para encontrarlos necesitas un submarino Kraken o el traje de buceo de la lancha Dinghy. Al descender a las fosas marinas, los restos de las 8 víctimas descansan en fila en el lecho oceánico.`;

      case 'lista-trucos-gta5':
        return `## ⚡ Todos los Trucos y Códigos de GTA 5

> **Aviso**: Activar trucos desactiva los Logros y Trofeos durante la sesión de juego actual.

---

### 1. Trucos de Supervivencia y Combate
* **Invencibilidad (5 minutos)**:
  * *Teléfono*: \`1-999-724-654-5537\` (\`PAINKILLER\`)
  * *PC*: \`PAINKILLER\`
  * *PlayStation*: \`Derecha, X, Derecha, Izquierda, Derecha, R1, Derecha, Izquierda, X, Triángulo\`
  * *Xbox*: \`Derecha, A, Derecha, Izquierda, Derecha, RB, Derecha, Izquierda, A, Y\`
* **Salud y Blindaje al Máximo**:
  * *Teléfono*: \`1-999-887-853\` (\`TURTLE\`)
  * *PC*: \`TURTLE\`
* **Todas las Armas y Munición**:
  * *Teléfono*: \`1-999-8665-87\` (\`TOOLUP\`)
  * *PC*: \`TOOLUP\`
* **Súper Salto**:
  * *Teléfono*: \`1-999-467-86-48\` (\`HOPTOIT\`)
  * *PC*: \`HOPTOIT\`
* **Caída Libre (Skyfall)**:
  * *Teléfono*: \`1-999-759-3255\` (\`SKYFALL\`)
  * *PC*: \`SKYFALL\`

---

### 2. Trucos de Vehículos
* **Helicóptero de Combate Buzzard**:
  * *Teléfono*: \`1-999-289-9633\` (\`BUZZOFF\`)
  * *PC*: \`BUZZOFF\`
* **Coche Deportivo Comet**:
  * *Teléfono*: \`1-999-266-38\` (\`COMET\`)
  * *PC*: \`COMET\`
* **Moto Sánchez (Motocross)**:
  * *Teléfono*: \`1-999-633-7623\` (\`OFFROAD\`)
  * *PC*: \`OFFROAD\``;

      /* ======================================================================
         CAPÍTULOS GTA VI (VICE CITY & ESTADO DE LEONIDA)
         ====================================================================== */
      case 'jason-lucia-dinamica':
        return `## 👥 Jason y Lucia: El Dúo Criminal de Leonida

Inspirados en la mítica pareja criminal de Bonnie y Clyde, **Jason** y **Lucia** representan la primera dualidad romántica y delictiva coprotagonista en la historia de la saga Grand Theft Auto.

---

### 1. Sistema Dinámico de Pareja y Confianza
* **Mecánica de Sincronización**: A diferencia de GTA V donde los protagonistas operaban de forma independiente salvo en golpes planificados, Jason y Lucia operan habitualmente en equipo durante asaltos, huidas y exploración.
* **Comandos Tácticos en Asaltos**: Puedes indicar al compañero que intimide a los rehenes, vigile la puerta trasera, fuerce una caja fuerte o prepare el vehículo de escape mientras el otro recoge el botín en mostradores.
* **Sistema de Confianza Mutable**: La toma de decisiones en momentos críticos (como salvar al compañero de fuego policial o priorizar el dinero) altera diálogos, apoyo mutuo en tiroteos y dinámicas de refugio.

---

### 2. Transición y Cambio de Personaje
* **Cambio Instantáneo**: Durante situaciones conjuntas, el cambio de control entre Jason y Lucia es inmediato con un solo botón, permitiendo alternar entre el tirador que ofrece cobertura y el asaltante que avanza entre coberturas.
* **Habilidades Complementarias**: Mientras Lucia destaca en agilidad, infiltración a corta distancia y técnicas de desarme rápido, Jason aporta estabilidad en armas de fuego pesadas y destreza en conducción bajo persecución extrema.`;

      case 'lucia-caminos-perfil':
        return `## ⛓️ Lucia: Trasfondo Penitenciario y Habilidades

Lucia se presenta al inicio de la trama cumpliendo condena en el **Centro Correccional de Leonida (Leonida Department of Corrections)**, vistiendo el mono naranja de reclusa durante una sesión de libertad condicional con su supervisora.

---

### 1. El Grillete Electrónico y Progresión
* **Restricción Geográfica Inicial**: Los primeros compases de la historia presentan a Lucia con un grillete de geolocalización en el tobillo, limitando su área de movimiento a distritos específicos de Vice City antes de liberarse del control judicial.
* **Motivación y Deseo de Supervivencia**: Su lema ante la adversidad es contundente: *"La única forma de salir adelante es permaneciendo juntos"*, impulsando a Jason a asumir golpes de mayor escala en busca de una salida definitiva.

---

### 2. Atributos Tácticos de Lucia
* **Desarme y CQC (Close Quarters Combat)**: Capacidad para inmovilizar rápidamente a dependientes y guardias sin necesidad de abrir fuego letal, evitando alertar a las patrullas perimetrales.
* **Infiltración y Sigilo**: Pasos más silenciosos en superficies interiores, mayor velocidad al desplazarse agachada y capacidad para ocultarse en zonas de sombras y probadores durante registros policiales.`;

      case 'jason-duval-perfil':
        return `## 🎯 Jason: Especialista en Armas y Conducción

Jason es un hombre pragmático y reservado que busca abrirse camino en el submundo de Leonida tras años en entornos clandestinos y militares.

---

### 1. Trasfondo y Conexiones Clandestinas
* **Red de Contactos en Port Gellhorn**: Jason cuenta con contactos en talleres clandestinos, traficantes de armas y círculos de apuestas en el condado de Leonard, lo que le permite conseguir equipamiento y vehículos no registrados.
* **Relación con Lucia**: Actúa como el contrapeso reflexivo y táctico ante la impulsividad de Lucia, planificando vías de escape y evaluando el tiempo de respuesta de los coches patrulla de Vice Dale.

---

### 2. Especialidades en Combate y Volante
* **Control de Retroceso y Precisión**: Capacidad para estabilizar miras telescópicas de fusiles de precisión y ametralladoras ligeras con menor oscilación respiratoria.
* **Destreza Vehicular Todo Terreno**: Mayor tracción y recuperación de derrapes al maniobrar sobre arena de playa, fango pantanoso en Grassrivers y autopistas mojadas por tormentas tropicales.`;

      case 'mapa-leonida-zonas':
        return `## 🗺️ Las Regiones del Estado de Leonida

El estado de Leonida es la recreación más masiva y diversa jamás concebida para la franquicia, combinando la metrópolis neon de Vice City con extensas zonas rurales y pantanosas.

---

### 1. Vice City (Metrópolis Central)
* El epicentro económico, turístico y nocturno del estado. Dividido en grandes avenidas costeras, rascacielos financieros en Downtown, zonas residenciales de lujo en Starfish Island y barrios multiculturales como Little Haiti.

---

### 2. Port Gellhorn y Zonas Industriales
* Una ciudad portuaria e industrial en declive al oeste de Leonida. Caracterizada por gasolineras de carretera, naves de desguace, moteles de mala muerte y clubes de billar donde operan bandas locales de narcotráfico y contrabando.

---

### 3. Leonard County y Ambrosia
* Regiones rurales dominadas por plantaciones agrícolas, fábricas procesadoras de azúcar y pequeñas comunidades rurales donde la presencia policial es escasa y las leyes locales son dictadas por caciques locales.

---

### 4. Los Cayos (Gellhorn & Vice Keys)
* Cadena de islas paradisíacas unidas por puentes kilométricos sobre aguas turquesas. Zona ideal para yates de lujo, actividades de pesca deportiva y pistas de aterrizaje clandestinas para avionetas.`;

      case 'vice-city-distritos':
        return `## 🌴 Distritos Urbanos de Vice City

La legendaria ciudad del sol regresa con una densidad urbana sin precedentes, donde la arquitectura art déco coexiste con modernos complejos turísticos y rascacielos vanguardistas.

---

### 1. Vice Beaches & Ocean Drive
* El frente marítimo más icónico del mundo. Kilómetros de arena blanca, palmeras tropicales, bañistas, deportistas y hoteles de fachada pastel iluminados por tubos de neón rosa y azul al caer la noche.
* Zona de alto interés para robo de superdeportivos aparcados frente a locales de moda.

---

### 2. Downtown Vice City
* El centro corporativo y financiero. Hogar de entidades bancarias, bufetes de abogados y sedes de medios de comunicación. Cuenta con aparcamientos subterráneos de varias plantas ideales para despistar helicópteros policiales.

---

### 3. Little Haiti y Barrios Residenciales
* Calles estrechas, mercados callejeros y viviendas unifamiliares con patios traseros. Alta actividad de bandas locales que defienden su territorio frente a intrusos y patrullas de policía.`;

      case 'humedales-pantanos-fauna':
        return `## 🐊 Grassrivers y Fauna Salvaje

Los humedales de **Grassrivers** representan el corazón salvaje de Leonida, inspirados en los Everglades de Florida.

---

### 1. Navegación en Hidrodeslizadores (Airboats)
* Las aguas poco profundas y la densa vegetación de manglares impiden el paso de lanchas convencionales. Los hidrodeslizadores con motor de hélice gigante son el medio de transporte óptimo para surcar los canales pantanosos sin encallar.

---

### 2. Ecosistema Vivo y Caimanes Peligrosos
* **Fauna Hostil**: Caimanes de gran envergadura habitan las orillas de los manglares y atacarán tanto al jugador como a presas naturales si caes al agua o te aproximas en exceso.
* **Caza y Recursos**: Aves zancudas exóticas, jabalíes salvajes, serpientes venenosas y ciervos de cola blanca ofrecen oportunidades de caza y obtención de pieles valiosas en mercados locales.`;

      case 'inventario-maletero-armas':
        return `## 🎒 Sistema de Inventario Realista y Maleteros

GTA VI evoluciona el clásico 'arsenal infinito en el bolsillo' hacia un modelo físico verosímil y estratégico, similar a la gestión de armas a caballo vista en *Red Dead Redemption 2*.

---

### 1. Límite de Armamento Portable
* **Ranuras Limitadas**: El jugador solo puede portar visiblemente dos armas cortas (pistolas o revólveres en fundas) y hasta dos armas largas (un fusil de asalto o escopeta colgada a la espalda mediante correa táctica).
* **Bolsa de Lona para Botines**: Durante los atracos, llevar una bolsa de deporte colgada ocupa espacio de carga, limitando la agilidad para trepar muros o esprintar a velocidad máxima.

---

### 2. El Maletero Vehicular como Armero Móvil
* **Tu Coche como Base de Operaciones**: El maletero de tu coche personal almacena el arsenal completo (lanzacohetes, fusiles de francotirador, chalecos antibalas de repuesto y munición pesada).
* **Interacción Física**: Debes acercarte al maletero del vehículo, abrirlo manualmente y seleccionar qué armamento equipar antes de asaltar un objetivo o preparar una emboscada.`;

      case 'fisicas-vehiculos-personalizacion':
        return `## 🚗 Física de Vehículos, Tracción e Interiores

El motor físico de conducción ha sido rediseñado para reflejar con precisión la masa de cada vehículo, el estado de la suspensión y el tipo de terreno transitado.

---

### 1. Deformación Realista y Superficies Dinámicas
* **Efecto de la Lluvia y Clima Tropical**: Las tormentas repentinas de Leonida inundan badenes y crean capas de aquaplaning en el asfalto caliente, reduciendo drásticamente la capacidad de frenado de deportivos potentes.
* **Arena y Fango**: Neumáticos de asfalto patinarán al internarse en playas o humedales; equipar suspensión elevada y neumáticos todoterreno es imprescindible para internarse en Leonard County.

---

### 2. Cabinas e Interiores Interactivos
* **Ajuste y Visión Interior**: Cada panel de instrumentos es funcional, con velocímetros digitales interactivos, espejos retrovisores con reflejo en tiempo real y ajuste ergonómico de parasoles y guantera.`;

      case 'redes-sociales-policia':
        return `## 📱 Redes Sociales y Sistema Policial Inteligente

En el estado de Leonida, la presencia constante de teléfonos inteligentes y redes sociales cambia radicalmente las reglas de la persecución policial.

---

### 1. Ciudadanos Grabando en Redes Sociales
* **Testigos con Teléfonos Móviles**: Al cometer un delito menor o conducir a contramano, los transeúntes sacarán sus teléfonos para retransmitir en directo en redes sociales. Si no huyes rápidamente o confiscas el dispositivo, la policía recibirá alertas geolocalizadas con tu descripción física.
* **Viralidad Digital**: Actos de caos o persecuciones espectaculares aparecen en las pantallas publicitarias y plataformas de vídeo en streaming de la ciudad en cuestión de minutos.

---

### 2. Reconocimiento Facial y Cámaras de Tráfico
* Cometer atracos con el rostro descubierto facilita que los sistemas automáticos de seguridad reconozcan a Jason o Lucia al pasar frente a semáforos inteligentes, activando patrullas cercanas sin necesidad de una llamada al 911.`;

      case 'patrullas-persecucion-tactica':
        return `## 🚓 Tácticas de Contención y Persecución Policial

Las fuerzas del orden de Vice Dale, el Sheriff de Leonard County y la Policía Estatal de Leonida despliegan protocolos tácticos avanzados frente a amenazas armadas.

---

### 1. Despliegue Escalonado y Bloqueos Estratégicos
* **Cercos Perimetrales**: En lugar de aparecer mágicamente frente a ti, las unidades policiales coordinan cortes de carretera en puentes y avenidas principales, cerrando vías de escape con furgones pesados.
* **Bandas de Clavos (Spike Strips)**: Los agentes colocan bandas de pinchos ocultas tras curvas cerradas para reventar los neumáticos de vehículos fugitivos.

---

### 2. Rastreo Nocturno con Helicópteros
* Los helicópteros de la policía cuentan con potentes focos de iluminación infrarroja y megáfonos de aviso. Ocultarse bajo túneles, aparcamientos subterráneos o follaje denso en los pantanos es indispensable para romper la línea de visión del radar.`;

      default:
        return `Información detallada del capítulo en preparación.`;
    }
  }
}
