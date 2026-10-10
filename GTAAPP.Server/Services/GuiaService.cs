using GTAAPP.Server.Models;

namespace GTAAPP.Server.Services;

/// <summary>
/// Servicio centralizado para proveer contenido, secciones y artículos de la Wiki / Guía de GTA 5 y GTA 6.
/// </summary>
public interface IGuiaService
{
    GuiaManifest GetGuiaManifest(string juegoId);
    List<GuiaSeccion> GetSecciones(string juegoId);
    GuiaArticulo? GetArticulo(string juegoId, string articuloId);
    List<GuiaArticuloResumen> BuscarArticulos(string juegoId, string query);
}

public class GuiaService : IGuiaService
{
    private readonly Dictionary<string, GuiaManifest> _manifiestos;
    private readonly Dictionary<string, List<GuiaArticulo>> _articulos;

    public GuiaService()
    {
        _manifiestos = new Dictionary<string, GuiaManifest>(StringComparer.OrdinalIgnoreCase);
        _articulos = new Dictionary<string, List<GuiaArticulo>>(StringComparer.OrdinalIgnoreCase);

        InicializarGta5();
        InicializarGta6();
    }

    public GuiaManifest GetGuiaManifest(string juegoId)
    {
        if (_manifiestos.TryGetValue(juegoId, out var manifest))
        {
            return manifest;
        }

        return new GuiaManifest
        {
            Id = juegoId,
            Titulo = $"Guía {juegoId.ToUpper()}",
            Descripcion = "Guía completa en construcción."
        };
    }

    public List<GuiaSeccion> GetSecciones(string juegoId)
    {
        if (_manifiestos.TryGetValue(juegoId, out var manifest))
        {
            return manifest.Secciones;
        }

        return new List<GuiaSeccion>();
    }

    public GuiaArticulo? GetArticulo(string juegoId, string articuloId)
    {
        if (_articulos.TryGetValue(juegoId, out var lista))
        {
            return lista.FirstOrDefault(a => 
                a.Id.Equals(articuloId, StringComparison.OrdinalIgnoreCase) || 
                a.Slug.Equals(articuloId, StringComparison.OrdinalIgnoreCase));
        }

        return null;
    }

    public List<GuiaArticuloResumen> BuscarArticulos(string juegoId, string query)
    {
        if (string.IsNullOrWhiteSpace(query) || !_articulos.TryGetValue(juegoId, out var lista))
        {
            return new List<GuiaArticuloResumen>();
        }

        var q = query.Trim().ToLowerInvariant();
        return lista
            .Where(a => a.Titulo.ToLowerInvariant().Contains(q) || 
                        a.Subtitulo.ToLowerInvariant().Contains(q) || 
                        a.Tags.Any(t => t.ToLowerInvariant().Contains(q)))
            .Cast<GuiaArticuloResumen>()
            .ToList();
    }

    private void InicializarGta5()
    {
        var secciones = new List<GuiaSeccion>
        {
            new()
            {
                Id = "historia-100",
                Titulo = "Modo Historia & 100%",
                Icono = "trophy",
                Descripcion = "Guía paso a paso de la campaña, requisitos del 100% y decisiones clave.",
                Orden = 1,
                Articulos = new List<GuiaArticuloResumen>
                {
                    new() { Id = "requisitos-100", Slug = "requisitos-100", Titulo = "PRÓLOGO", Subtitulo = "Todo lo necesario para conseguir la estadística del 100%", Categoria = "historia-100", Badge = "Imprescindible", TiempoLecturaMinutos = 6 },
                    new() { Id = "golpes-principales", Slug = "golpes-principales", Titulo = "Guía Táctica de los 6 Grandes Golpes", Subtitulo = "Planes A/B, mejores pistoleros, conductores y hackers", Categoria = "historia-100", Badge = "Estrategia", TiempoLecturaMinutos = 10 },
                    new() { Id = "finales-opcion-abc", Slug = "finales-opcion-abc", Titulo = "Los Tres Finales (Opción A, B o C)", Subtitulo = "Consecuencias narrativas y por qué la Opción C es la canónica", Categoria = "historia-100", Badge = "Lore", TiempoLecturaMinutos = 5 }
                }
            },
            new()
            {
                Id = "personajes",
                Titulo = "Protagonistas & Facciones",
                Icono = "users",
                Descripcion = "Biografías, habilidades especiales y misiones personales de Michael, Franklin y Trevor.",
                Orden = 2,
                Articulos = new List<GuiaArticuloResumen>
                {
                    new() { Id = "michael-de-santa", Slug = "michael-de-santa", Titulo = "Michael De Santa: El Ladrón Retirado", Subtitulo = "Tiempo bala, crisis existencial y relación con el FIB", Categoria = "personajes", TiempoLecturaMinutos = 5 },
                    new() { Id = "franklin-clinton", Slug = "franklin-clinton", Titulo = "Franklin Clinton: La Nueva Sangre", Subtitulo = "Conducción ralentizada, Chop, familias de Forum Drive", Categoria = "personajes", TiempoLecturaMinutos = 5 },
                    new() { Id = "trevor-philips", Slug = "trevor-philips", Titulo = "Trevor Philips: El Caos Encarnado", Subtitulo = "Modo Furia, Industrias TP y su pasado en North Yankton", Categoria = "personajes", TiempoLecturaMinutos = 6 }
                }
            },
            new()
            {
                Id = "negocios-economia",
                Titulo = "Negocios, Propiedades & Bolsa",
                Icono = "trending-up",
                Descripcion = "Guía para maximizar ingresos semanales y alcanzar el límite de 2.147 millones.",
                Orden = 3,
                Articulos = new List<GuiaArticuloResumen>
                {
                    new() { Id = "asesinatos-lester-bolsa", Slug = "asesinatos-lester-bolsa", Titulo = "Inversión en Bolsa con las Misiones de Lester", Subtitulo = "Cómo conseguir 2.147 millones de dólares con cada personaje", Categoria = "negocios-economia", Badge = "Dinero Infinito", TiempoLecturaMinutos = 8 },
                    new() { Id = "guia-negocios-propiedades", Slug = "guia-negocios-propiedades", Titulo = "Guía de Negocios y Propiedades Comprables", Subtitulo = "Precios de compra, ingresos semanales y misiones de gestión", Categoria = "negocios-economia", Badge = "Inversiones", TiempoLecturaMinutos = 7 }
                }
            },
            new()
            {
                Id = "secretos-misterios",
                Titulo = "Secretos, Easter Eggs & Misterios",
                Icono = "sparkles",
                Descripcion = "El misterio de Mount Chiliad, OVNIS, el Fantasma de Mount Gordo y el Asesino de los 8 Infinitos.",
                Orden = 4,
                Articulos = new List<GuiaArticuloResumen>
                {
                    new() { Id = "misterio-chiliad", Slug = "misterio-chiliad", Titulo = "El Gran Misterio de Mount Chiliad", Subtitulo = "El mural, los 4 OVNIs, lluvia a las 3 AM y la verdad del Jetpack", Categoria = "secretos-misterios", Badge = "Misterio", TiempoLecturaMinutos = 7 },
                    new() { Id = "fantasma-monte-gordo", Slug = "fantasma-monte-gordo", Titulo = "El Fantasma de Jolene Cranley-Evans", Subtitulo = "Hora exacta de aparición, sangre en la roca y la historia de Jock Cranley", Categoria = "secretos-misterios", TiempoLecturaMinutos = 4 },
                    new() { Id = "asesino-ocho-infinitos", Slug = "asesino-ocho-infinitos", Titulo = "El Asesino de los 8 Infinitos (Merle Abrahams)", Subtitulo = "Los 8 cadáveres envueltos bajo el agua y las pistas en Paleto Bay", Categoria = "secretos-misterios", TiempoLecturaMinutos = 5 }
                }
            },
            new()
            {
                Id = "trucos-codigos",
                Titulo = "Trucos y Códigos Oficiales",
                Icono = "key",
                Descripcion = "Lista exhaustiva de trucos para PC, PlayStation, Xbox y teclado numérico de celular.",
                Orden = 5,
                Articulos = new List<GuiaArticuloResumen>
                {
                    new() { Id = "lista-trucos-gta5", Slug = "lista-trucos-gta5", Titulo = "Todos los Trucos y Códigos de GTA 5", Subtitulo = "Invencibilidad, todas las armas, súper salto, Buzzard y clima", Categoria = "trucos-codigos", Badge = "Popular", TiempoLecturaMinutos = 5 }
                }
            }
        };

        _manifiestos["gta5"] = new GuiaManifest
        {
            Id = "gta5",
            Juego = "Grand Theft Auto V",
            Titulo = "Enciclopedia & Guía Oficial de GTA V",
            Descripcion = "La guía más exhaustiva y detallada de Los Santos y el Condado de Blaine: historia al 100%, golpes, personajes, misterios y trucos.",
            BannerUrl = "assets/gta5-banner.jpg",
            Secciones = secciones
        };

        var articulosGta5 = new List<GuiaArticulo>
        {
            new()
            {
                Id = "requisitos-100",
                Slug = "requisitos-100",
                Titulo = "PRÓLOGO",
                Subtitulo = "Todo lo estrictamente necesario para desbloquear la estadística del 100% y el logro 'Carrera delictiva'",
                Categoria = "historia-100",
                Badge = "Imprescindible",
                TiempoLecturaMinutos = 6,
                UltimaActualizacion = DateTime.UtcNow,
                Tags = new List<string> { "100%", "Logros", "Misiones", "Coleccionables", "Trofeos" },
                ContenidoMarkdown = @"# PRÓLOGO

Para alcanzar el 100% en la pestaña de Estadísticas de GTA V no necesitas hacer absolutamente todas las misiones secundarias del juego, sino cumplir una serie específica de objetivos fijados por Rockstar Games.

---

### 1. Misiones Principales de Campaña (69 misiones)
* Superar las **69 misiones de la historia principal**, incluyendo todos los golpes planificados desde el Prólogo en North Yankton hasta el desenlace.
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
* Salir a pasear y lanzar la pelota con **Chop** usando a Franklin.",
                Relacionados = new List<GuiaArticuloRelacionado>
                {
                    new() { Id = "golpes-principales", Slug = "golpes-principales", Titulo = "Guía Táctica de los 6 Grandes Golpes" },
                    new() { Id = "asesinatos-lester-bolsa", Slug = "asesinatos-lester-bolsa", Titulo = "Inversión en Bolsa con las Misiones de Lester" }
                }
            },
            new()
            {
                Id = "golpes-principales",
                Slug = "golpes-principales",
                Titulo = "Guía Táctica de los 6 Grandes Golpes de Campaña",
                Subtitulo = "Comparativa de rutas, costes de tripulación, planes A/B y cómo maximizar el botín neto",
                Categoria = "historia-100",
                Badge = "Estrategia",
                TiempoLecturaMinutos = 10,
                UltimaActualizacion = DateTime.UtcNow,
                Tags = new List<string> { "Golpes", "Dinero", "Lester", "Vangelico", "Paleto Bay", "Union Depository" },
                ContenidoMarkdown = @"# Guía Táctica de los 6 Grandes Golpes de Campaña

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
* **Botín Total**: **$201.600.000 en lingotes de oro puro**.
* **Enfoque Más Rentable**: **Plan B (Sutil / Disfraz de furgones blindados)**.
* **Tripulación Ideal para Ganancia Máxima**:
  * **Conductor 1**: **Taliana Martinez** (5%, desbloqueable en el evento de la autopista de Mount Chiliad). Conduce el helicóptero de fuga a la perfección.
  * **Conductor 2**: **Karim Denz** (8%). Manejará el tren de escape sin complicaciones si ya participó en golpes anteriores.
  * **Pistoleros**: Novatos de bajo coste (ej. Norm Richards o Hugh Welsh).
* **Pago Final**: **Más de $35.000.000 por cada protagonista** si se optimiza la tripulación.",
                Relacionados = new List<GuiaArticuloRelacionado>
                {
                    new() { Id = "requisitos-100", Slug = "requisitos-100", Titulo = "PRÓLOGO" },
                    new() { Id = "asesinatos-lester-bolsa", Slug = "asesinatos-lester-bolsa", Titulo = "Inversión en Bolsa con las Misiones de Lester" }
                }
            },
            new()
            {
                Id = "asesinatos-lester-bolsa",
                Slug = "asesinatos-lester-bolsa",
                Titulo = "Guía Maestra: Inversión en Bolsa con las Misiones de Lester",
                Subtitulo = "Cómo acumular más de $2.147.483.647 (el límite del motor del juego) con Michael, Franklin y Trevor",
                Categoria = "negocios-economia",
                Badge = "Dinero Infinito",
                TiempoLecturaMinutos = 8,
                UltimaActualizacion = DateTime.UtcNow,
                Tags = new List<string> { "Bolsa", "Lester", "LCN", "BAWSAQ", "Dinero", "Millonarios" },
                ContenidoMarkdown = @"# Guía Maestra: Inversión en Bolsa con las Misiones de Lester

En GTA V existe un método legal infalible para convertir a tus tres protagonistas en multimillonarios absolutos, alcanzando el tope máximo de dinero que permite el motor del juego (**$2.147.483.647**).

### Regla de Oro Absoluta
> **NO hagas las misiones de asesinato de Lester (salvo la primera obligatoria en el hotel) hasta haber completado 'El Gran Golpe'**.
> Cuando termines la historia principal, cada personaje tendrá entre **$30 y $40 millones**. Al invertir ese capital masivo en las siguientes misiones de Lester, tus ganancias se multiplicarán exponencialmente.

---

### Misión 1: El Asesinato en el Hotel (Obligatoria durante la campaña)
* **Acciones**: **Betta Pharmaceuticals** (Mercado: **BAWSAQ**).
* **Cuándo Comprar**: Antes de iniciar la misión con Franklin, invierte todo el dinero disponible de los 3 personajes en *BettaPharmaceuticals*.
* **Cuándo Vender**: Duerme en la cama de un personaje (sin guardar) unas cuantas veces hasta que las acciones alcancen su punto álgido (**+50% de beneficio**).
* **Inversión de Rebote**: Tras vender, invierte de inmediato en **Bilkington** (LCN). Espera unas 48-72 horas de juego a que rebote (**+100% de beneficio**).

---

### Misión 2: El Asesinato Múltiple (Hacer DESPUÉS de 'El Gran Golpe')
* **Acciones**: **Debonaire** (Mercado: **LCN**).
* **Cuándo Comprar**: Antes de la misión, invierte los ~$35 millones de cada protagonista en *Debonaire*.
* **Cuándo Vender**: Tras completar la misión, espera a que alcance un retorno del **+80%**.
* **Inversión de Rebote**: Vende todo y mételo de inmediato en su rival, **Redwood** (LCN). Espera de 4 a 6 días de juego a que Redwood se recupere: alcanzará un brutal **+300% de beneficio**.

---

### Misión 3: El Asesinato de la Prostituta
* **Acciones**: **Fruit** (Mercado: **BAWSAQ**).
* **Beneficio**: **+50%**.
* **Rebote**: Invertir en **Facade** (BAWSAQ) y vender al **+33%**.

---

### Misión 4: El Asesinato del Autobús
* **Acciones**: **Vapid** (Mercado: **BAWSAQ**).
* **Nota Especial**: Compra **DESPUÉS** de la misión (las acciones de Vapid se desploman a la mitad tras la muerte del objetivo).
* **Cuándo Vender**: Espera unas 48 horas de juego a que las acciones se recuperen por completo (**+100% de beneficio limpio**).

---

### Misión 5: El Asesinato de la Obra
* **Acciones**: **GoldCoast** (Mercado: **LCN**).
* **Cuándo Comprar**: Antes de la misión.
* **Cuándo Vender**: Alcanza un incremento del **+80%** a las pocas horas.",
                Relacionados = new List<GuiaArticuloRelacionado>
                {
                    new() { Id = "golpes-principales", Slug = "golpes-principales", Titulo = "Guía Táctica de los 6 Grandes Golpes" },
                    new() { Id = "requisitos-100", Slug = "requisitos-100", Titulo = "Requisitos para el 100% de GTA V" }
                }
            },
            new()
            {
                Id = "misterio-chiliad",
                Slug = "misterio-chiliad",
                Titulo = "El Gran Misterio de Mount Chiliad y los 4 OVNIs",
                Subtitulo = "Explicación detallada del mural de la estación del teleférico, los avistamientos y el Jetpack",
                Categoria = "secretos-misterios",
                Badge = "Misterio",
                TiempoLecturaMinutos = 7,
                UltimaActualizacion = DateTime.UtcNow,
                Tags = new List<string> { "OVNI", "Chiliad", "Misterio", "Easter Egg", "Jetpack", "Fort Zancudo" },
                ContenidoMarkdown = @"# El Gran Misterio de Mount Chiliad y los 4 OVNIs

El misterio más icónico y debatido de toda la historia de Rockstar Games se encuentra en la cima del pico más alto del Condado de Blaine: el **Monte Chiliad**.

---

### 1. El Mural de la Cima
En la estación superior del teleférico hay un diagrama dibujado en la pared que muestra tres iconos inferiores:
* **Un Ojo / OVNI**.
* **Un Huevo agrietado**.
* **Un Hombre volando con un Jetpack**.

En la parte posterior del mirador de madera, una inscripción tallada en rojo reza:
> *'Come back when your story is complete'* (Vuelve cuando tu historia esté completada).

---

### 2. Cómo Ver el OVNI de Mount Chiliad
1. Tener el **100% del juego completado**.
2. Subir al mirador de Mount Chiliad.
3. Estar allí a las **3:00 AM exactas de la madrugada**.
4. Debe haber **tormenta con lluvia y truenos** (puedes forzar el clima con trucos).
5. Aparecerá un OVNI holográfico flotando sobre la montaña con la inscripción *FIB* visible en su fuselaje.

---

### 3. Los Otros 3 OVNIs en el Mapa
* **OVNI del Campamento Hippie (Sandy Shores)**: Suspendido a gran altitud sobre el campamento decorado con motivos alienígenas. Emite un zumbido electromagnético.
* **OVNI de Fort Zancudo**: Flotando sobre la base militar a altitud máxima. Posee tecnología de camuflaje óptico y una cabina biomecánica.
* **OVNI Sumergido en Paleto Bay**: Una nave extraterrestre estrellada en el fondo del océano Pacífico, oxidada y cubierta de algas en las coordenadas norte.",
                Relacionados = new List<GuiaArticuloRelacionado>
                {
                    new() { Id = "requisitos-100", Slug = "requisitos-100", Titulo = "Requisitos para el 100% de GTA V" }
                }
            },
            new()
            {
                Id = "lista-trucos-gta5",
                Slug = "lista-trucos-gta5",
                Titulo = "Todos los Trucos y Códigos de GTA 5",
                Subtitulo = "Códigos para PC, combinaciones de mando PlayStation/Xbox y números de teléfono celular",
                Categoria = "trucos-codigos",
                Badge = "Popular",
                TiempoLecturaMinutos = 5,
                UltimaActualizacion = DateTime.UtcNow,
                Tags = new List<string> { "Trucos", "Códigos", "Teléfono", "Invencibilidad", "Vehículos" },
                ContenidoMarkdown = @"# Todos los Trucos y Códigos Oficiales de GTA 5

> **Aviso**: Activar trucos desactiva los Logros y Trofeos durante la sesión de juego actual.

---

### 1. Trucos de Supervivencia y Combate
* **Invencibilidad (5 minutos)**:
  * *Teléfono*: `1-999-724-654-5537` (`PAINKILLER`)
  * *PC*: `PAINKILLER`
  * *PlayStation*: `Derecha, X, Derecha, Izquierda, Derecha, R1, Derecha, Izquierda, X, Triángulo`
  * *Xbox*: `Derecha, A, Derecha, Izquierda, Derecha, RB, Derecha, Izquierda, A, Y`
* **Salud y Blindaje al Máximo**:
  * *Teléfono*: `1-999-887-853` (`TURTLE`)
  * *PC*: `TURTLE`
* **Todas las Armas y Munición**:
  * *Teléfono*: `1-999-8665-87` (`TOOLUP`)
  * *PC*: `TOOLUP`
* **Súper Salto**:
  * *Teléfono*: `1-999-467-86-48` (`HOPTOIT`)
  * *PC*: `HOPTOIT`
* **Caída Libre (Skyfall)**:
  * *Teléfono*: `1-999-759-3255` (`SKYFALL`)
  * *PC*: `SKYFALL`

---

### 2. Trucos de Vehículos
* **Helicóptero de Combate Buzzard**:
  * *Teléfono*: `1-999-289-9633` (`BUZZOFF`)
  * *PC*: `BUZZOFF`
* **Coche Deportivo Comet**:
  * *Teléfono*: `1-999-266-38` (`COMET`)
  * *PC*: `COMET`
* **Moto Sánchez (Motocross)**:
  * *Teléfono*: `1-999-633-7623` (`OFFROAD`)
  * *PC*: `OFFROAD`",
                Relacionados = new List<GuiaArticuloRelacionado>
                {
                    new() { Id = "requisitos-100", Slug = "requisitos-100", Titulo = "Requisitos para el 100% de GTA V" }
                }
            }
        };

        _articulos["gta5"] = articulosGta5;
    }

    private void InicializarGta6()
    {
        var secciones = new List<GuiaSeccion>
        {
            new()
            {
                Id = "protagonistas-leonida",
                Titulo = "Protagonistas & Estado de Leonida",
                Icono = "map-pin",
                Descripcion = "Todo lo conocido sobre Lucia Caminos, Jason Duval y las regiones de Vice City, Kelly County y Grassrivers.",
                Orden = 1,
                Articulos = new List<GuiaArticuloResumen>
                {
                    new() { Id = "jason-lucia-dinamica", Slug = "jason-lucia-dinamica", Titulo = "Jason y Lucia: El Dúo Criminal", Subtitulo = "Mecánicas de cambio de personaje, confianza y robos coordinados", Categoria = "protagonistas-leonida", Badge = "Exclusivo", TiempoLecturaMinutos = 5 },
                    new() { Id = "mapa-leonida-zonas", Slug = "mapa-leonida-zonas", Titulo = "Las Regiones del Estado de Leonida", Subtitulo = "Vice City, Port Gellhorn, Ambrosia, Leonard County y los Cayos", Categoria = "protagonistas-leonida", Badge = "Mapa", TiempoLecturaMinutos = 8 }
                }
            },
            new()
            {
                Id = "mecanicas-novedades",
                Titulo = "Novedades & Mecánicas Confirmadas",
                Icono = "cpu",
                Descripcion = "Física de vehículos, inventario físico en maleteros, cámaras de seguridad y redes sociales in-game.",
                Orden = 2,
                Articulos = new List<GuiaArticuloResumen>
                {
                    new() { Id = "inventario-maletero-armas", Slug = "inventario-maletero-armas", Titulo = "Sistema de Inventario Realista y Maleteros", Subtitulo = "Límite de armas portables y equipamiento vehicular estilo RDR2", Categoria = "mecanicas-novedades", TiempoLecturaMinutos = 4 },
                    new() { Id = "redes-sociales-policia", Slug = "redes-sociales-policia", Titulo = "Redes Sociales y Sistema Policial Inteligente", Subtitulo = "Grabaciones de testigos, reconocimiento facial y patrullas de Vice Dale", Categoria = "mecanicas-novedades", TiempoLecturaMinutos = 6 }
                }
            },
            new()
            {
                Id = "fauna-naturaleza",
                Titulo = "Fauna, Ecosistemas y Clima Extremo",
                Icono = "sun",
                Descripcion = "Cocodrilos, flamencos, tiburones y el sistema dinámico de tormentas tropicales y huracanes.",
                Orden = 3,
                Articulos = new List<GuiaArticuloResumen>
                {
                    new() { Id = "vida-salvaje-leonida", Slug = "vida-salvaje-leonida", Titulo = "Enciclopedia de Fauna de Leonida", Subtitulo = "Comportamiento animal, interacción y peligros de los pantanos", Categoria = "fauna-naturaleza", TiempoLecturaMinutos = 5 }
                }
            }
        };

        _manifiestos["gta6"] = new GuiaManifest
        {
            Id = "gta6",
            Juego = "Grand Theft Auto VI",
            Titulo = "Base de Datos & Guía Oficial de GTA VI",
            Descripcion = "Toda la información confirmada, regiones de Leonida, análisis de tráileres, personajes y mecánicas de la próxima obra maestra de Rockstar Games.",
            BannerUrl = "assets/gta6-banner.jpg",
            Secciones = secciones
        };

        var articulosGta6 = new List<GuiaArticulo>
        {
            new()
            {
                Id = "jason-lucia-dinamica",
                Slug = "jason-lucia-dinamica",
                Titulo = "Jason y Lucia: El Dúo Criminal",
                Subtitulo = "Mecánicas de cambio de personaje, confianza y robos coordinados",
                Categoria = "protagonistas-leonida",
                Badge = "Exclusivo",
                TiempoLecturaMinutos = 5,
                UltimaActualizacion = DateTime.UtcNow,
                Tags = new List<string> { "Lucia", "Jason", "Historia", "Mecánicas", "Vice City" },
                ContenidoMarkdown = @"# Jason y Lucia: La pareja criminal en el Estado de Leonida

Grand Theft Auto VI presenta la primera protagonista femenina jugable en la era 3D/HD de la saga, formando una pareja criminal inspirada en Bonnie y Clyde.

## 1. Lucia Caminos
* **Trasfondo**: En el primer tráiler oficial se la observa en el correccional de Leonida antes de asociarse con Jason.
* **Habilidades observadas**: Alta agilidad, manipulación de ganzúas modernas y liderazgo en asaltos rápidos.

## 2. Jason Duval
* **Trasfondo**: Veterano o ex-militar con experiencia en combate táctico y manejo de armamento pesado.
* **Habilidades observadas**: Conducción todoterreno en zonas pantanosas y manejo de armas largas.

## 3. Mecánica de Dúo Cooperativo
* **Sistema de órdenes rápidas**: Puedes ordenar a tu compañero cubrirte, vigilar a los rehenes en un robo a tienda o saquear la caja fuerte mientras aseguras el perímetro.
* **Inventario compartido en vehículos**: Ambos personajes pueden guardar armas largas y equipo especializado en el maletero del coche principal.",
                Relacionados = new List<GuiaArticuloRelacionado>
                {
                    new() { Id = "mapa-leonida-zonas", Slug = "mapa-leonida-zonas", Titulo = "Las Regiones del Estado de Leonida" },
                    new() { Id = "inventario-maletero-armas", Slug = "inventario-maletero-armas", Titulo = "Sistema de Inventario Realista y Maleteros" }
                }
            }
        };

        _articulos["gta6"] = articulosGta6;
    }
}
