# Reglas y Metodología del Proyecto (GTA MAPS)

Este archivo contiene las directrices de obligado cumplimiento para el asistente en este repositorio. Cualquier incumplimiento de estas normas compromete la estabilidad del proyecto en producción y la continuidad del trabajo.

---

## 1. Disciplina de Alcance y Prohibición Absoluta de Cambios no Solicitados
* **Alcance Quirúrgico Estricto**: Queda TERMINANTEMENTE PROHIBIDO tocar, alterar, rediseñar, mover o borrar cualquier elemento, componente, texto, logotipo, cabecera, botón o estilo que el usuario NO haya ordenado explícitamente modificar.
* **Aislamiento Total de Tareas**: Si la orden es maquetar o editar un bloque específico (ej. un artículo, una misión o un panel), el resto de la interfaz (cabeceras, barras de navegación, pie de página, menús, etc.) es intocable y permanece exactamente como está.
* **Cero Iniciativas Propias o Rediseños Espontáneos**: No se asumen gustos personales ni se aplican "mejoras" cosméticas no solicitadas. Lo que no se ha pedido, no existe.
* **Cero Discusiones sobre lo Visible**: Si el usuario indica que algo no se ve, está roto o no está como estaba, el asistente se detiene de inmediato, asume la observación del usuario y busca la causa raíz sin discutir, sin intentar justificar el error ni asegurar falsamente que "todo está bien en el código".

---

## 2. Arquitectura Modular, Cero Monolitos y Separación de Capas
* **Prohibidas las Clases Dios y Archivos Gigantes**: Ningún archivo debe convertirse en un cajón de sastre de miles de líneas. Si un archivo crece, se modulariza inmediatamente separando responsabilidades en subcomponentes, servicios o modelos desacoplados.
* **Separación Estricta de Datos y Lógica**: Los contenidos masivos (guías de misiones, requisitos de medalla de oro, coleccionables, bases de datos) residen obligatoriamente en archivos de datos estructurados (`assets/data/`), nunca hardcodeados como cadenas kilométricas dentro de componentes `.ts` o controladores `.cs`.
* **Cero Parches Acumulativos en CSS**: No se añaden reglas duplicadas al final de las hojas de estilo para parchear problemas de especificidad. Las modificaciones se realizan directamente sobre el selector original correspondiente.
* **Obligación de Internacionalización (i18n)**: Cualquier texto nuevo de interfaz debe integrarse en el sistema de traducción (`i18n/locales`), evitando textos fijos en duro que queden huérfanos sin soporte multiidioma.
* **Reutilización de Componentes Maduros**: No generar esqueletos vacíos o duplicados si ya existen componentes completos en la aplicación (`app-info-panel`, paneles de mapas, etc.).

---

## 3. Metodología de Trabajo y Eficiencia de Cuota
* **Trabajo Paso a Paso y Bloques Controlados**: El avance de contenido y maquetación se realiza en tandas pequeñas y manejables (ej. misiones de 5 en 5), consensuando cada bloque con el usuario antes de pasar al siguiente.
* **Control Estricto de Ejecución y Herramientas**: Prohibido lanzar comandos de terminal pesados, bucles o tareas en segundo plano que quemen tokens o cuota semanal innecesariamente sin consentimiento previo.
* **Verificación Real y Cero Asunciones**: Comprobar tipos de TypeScript, sintaxis de plantillas Angular, imports y lógica antes de dar una tarea por terminada.
* **No Retrocesos Destructivos**: Prohibido el uso de comandos destructivos (`git reset --hard`, `git checkout` ciegos) que eliminen el trabajo realizado por el usuario. Se trabaja siempre hacia adelante con control de versiones limpio.
* **Identidad Propia en Redacción**: El contenido narrativo y táctico debe redactarse con voz propia de GTA MAPS, aportando valor real y sin calcar literalmente estructuras de terceros (BradyGames, GTAWiki).
* **Prohibición de Callouts Flotantes**: No usar tarjetas destacadas o callouts invasivos (`> Nota Táctica`, `.guide-callout`). Todos los avisos y consejos se integran limpiamente como viñetas de lista (`* `) dentro del cuerpo del texto.

## 4. Tolerancia Cero a Regresiones (Prohibido Romper lo Funcional)
* **Bloqueo de Modificaciones Colaterales**: Si la orden es a�adir datos (ej. misiones nuevas) o l�gica, est� ABSOLUTAMENTE PROHIBIDO tocar o alterar los archivos de maquetaci�n HTML/CSS. 
* **Prohibido Revertir a Ciegas**: Nunca se usar� c�digo de memoria ni se restaurar�n versiones antiguas enteras de un archivo para arreglar un detalle. Si hay que arreglar algo, se edita solo la l�nea afectada.
* **Checklist de Regresi�n**: Antes de dar por finalizada una tarea, el asistente tiene la obligaci�n de revisar que el resto del componente no ha sido alterado. Por cada paso adelante, cero pasos atr�s.

## 5. PROTOCOLO DE EJECUCIÓN ESTRICTO (ESTADO ACTUAL)
A partir de los errores críticos, el asistente asume estas reglas inviolables de ejecución técnica:
1. **TRAZABILIDAD FRONTEND/BACKEND OBLIGATORIA**: Todo cambio estructural (como unificar un JSON) requiere OBLIGATORIAMENTE revisar antes el backend (C#) para comprobar si dicho archivo está siendo consumido o manipulado por la API. Prohibido desconectar capas.
2. **PROHIBICIÓN ABSOLUTA DE SCRIPTS MASIVOS**: Queda estrictamente prohibido usar `fs.writeFileSync`, Node.js o PowerShell para modificar el código fuente del usuario, hacer reemplazos masivos, unificar archivos o arreglar codificaciones a ciegas.
3. **MODO LECTURA POR DEFECTO Y EDICIÓN QUIRÚRGICA**: Se usarán exclusivamente las herramientas `view_file` y `replace_file_content`. Cada modificación debe aislar las líneas exactas a cambiar. Prohibido sobrescribir un archivo entero si ya existe.
4. **UN CAMBIO = UNA VERIFICACIÓN**: El flujo de trabajo se reduce a micro-operaciones. Se edita UNA funcionalidad, se detiene, y se espera la verificación en producción del usuario antes de pasar a la siguiente fase o archivo.

## 6. RESPETO ABSOLUTO A LA ARQUITECTURA EXISTENTE (.NET + ANGULAR)
Queda prohibido crear "atajos" en Angular para saltarse la lógica del backend. Si el proyecto utiliza un servidor en C# (.NET) para suministrar manifiestos o datos, el asistente tiene la obligación de mantener esa conexión viva y actualizar el backend. No se pueden tomar decisiones unilaterales que "desconecten" la arquitectura original del usuario.

## 7. PROTOCOLO ANTI-EXCUSAS Y DE REVERSIÓN INMEDIATA
Si una instrucción genera un fallo de compilación, rompe texto o elimina un componente (botones, cabeceras), el asistente tiene prohibido encadenar "parches a ciegas" o scripts de recuperación. Ante el mínimo fallo, la única acción permitida es detenerse, notificar el error exacto y proponer la reversión al código funcional anterior. Cero huidas hacia adelante.

## 8. CONGELACIÓN DE MAQUETACIÓN DURANTE LA LÓGICA (FREEZE-DOM)
Cuando se esté trabajando en lógica de TypeScript, conexión de servicios o edición de JSON, se asume que los archivos HTML y SCSS están bajo congelación estricta. Queda terminantemente prohibido hacer limpieza de "código que parece innecesario" en las vistas, o eliminar divs, clases y botones colaterales.

## 9. CONCIENCIA DE IMPACTO Y TIEMPO DEL USUARIO (NO-LOOPS)
El asistente debe operar sabiendo que el tiempo de programación del usuario es limitado y valioso. Quedan prohibidas las acciones experimentales que abran múltiples frentes y provoquen sesiones de depuración interminables. El objetivo es entregar avances sólidos, no secuestrar la sesión del usuario arreglando los propios desastres del asistente.

## 10. VERIFICACIÓN DE CODIFICACIÓN (UTF-8 STRICT)
El asistente no procesará archivos JSON ni de texto sin asegurar primero que la codificación es UTF-8 nativa. Queda terminantemente prohibido el uso de herramientas de conversión a ciegas (como forzar `latin1`) que destruyan tildes, caracteres especiales o formatos de texto (Markdown) previamente establecidos.

## 11. PROHIBICIÓN DE BORRADO DE ARCHIVOS DE ORIGEN
Si el usuario ordena refactorizar o unificar archivos (ej. múltiples JSON en uno solo), el asistente tiene absolutamente prohibido eliminar los archivos de origen de la unidad física sin una confirmación explícita. Siempre se mantendrán intactos como respaldo de seguridad en su directorio original o en una carpeta temporal segura.

## 12. LIMITACIÓN A CAMBIOS UNITARIOS AISLADOS
Se prohíbe realizar más de un cambio conceptual por iteración. Si hay que reparar el scroll de un panel y el contador de otro, se abordará un único problema, se solicitará la validación visual en producción por parte del usuario, y solo entonces se pasará al siguiente. Cero multitarea destructiva.

## 13. CERO SUPOSICIONES SOBRE ESTADOS DE ERROR
Si algo falla durante la compilación (TS/C#) o la ejecución, el asistente no inventará el motivo basándose en sospechas. Requerirá los logs exactos al usuario o utilizará comandos de consola de forma conservadora para leer la traza real. Prohibido ejecutar soluciones de "prueba y error" sin pruebas documentales.

## 14. GARANTÍA DE SINCRONIZACIÓN DE RUTAS Y SLUGS
Cualquier modificación en los identificadores (IDs) o slugs de los datos (JSON o bases de datos) obliga al asistente a realizar una auditoría inmediata en los controladores de rutas dependientes (`.ts` de Angular y controladores `.cs` de .NET) para garantizar que los enlaces no deriven en vistas de emergencia o falsos 404.

## 15. SUSPENSIÓN DE AUTO-CORRECCIONES RECURSIVAS
Si el asistente implementa una solución que falla inmediatamente y desencadena un nuevo error, queda prohibido generar un parche para intentar arreglar el segundo error. La cadena de fallos se detiene en el acto, revirtiendo al estado inicial para no enterrar el código bajo parches superpuestos.

## 16. RESPONSABILIDAD TOTAL DE COMUNICACIÓN
El asistente tiene prohibido el uso de metáforas confusas, excusas abstractas o terminología alarmista que oculte errores simples de ejecución (ej. "guerra de arquitecturas"). La comunicación será estrictamente literal, técnica, reconociendo el fallo exacto en la línea de código correspondiente y sin justificaciones.

## 17. MODO TERMINAL RESTRINGIDO (READ-ONLY TERMINAL)
Prohibido ejecutar comandos de terminal que modifiquen el entorno (`npm install`, `git checkout`, `rm -rf`, scripts de PowerShell destructivos) sin autorización explícita previa. Las consultas a terminal serán exclusivamente de lectura (`cat`, `ls`, `Get-Content`, `grep`).

## 18. AUDITORÍA DE DEPENDENCIAS (LOCKED)
El asistente tiene estrictamente prohibido alterar, actualizar, añadir o eliminar librerías en los archivos `package.json`, `angular.json` o `*.csproj`. Cualquier cambio de infraestructura requiere un ticket o solicitud específica.

## 19. PROHIBICIÓN DE ELIMINACIÓN DE CÓDIGO COMENTADO
El asistente no tiene autoridad para borrar bloques de código comentado por el usuario en ningún archivo. Ese código puede estar ahí para pruebas, historial o referencia y se considera absolutamente intocable.

## 20. RESTRICCIÓN DE SCOPE Y FORMATEO
Si la tarea exige modificar la línea 40 de un archivo, el asistente tiene terminantemente prohibido reformatear, reestructurar, reorganizar imports o cambiar la indentación del resto del archivo, incluso si considera que "es una buena práctica". La modificación es milimétrica o no se hace.

## 21. BLOQUEO DE INFERENCIA DE ESTILOS SCSS/CSS
Prohibido añadir variables globales, alterar tipografías base o crear selectores genéricos que puedan causar colisiones en cascada en otras vistas de la aplicación. Cualquier estilo visual se aplicará de forma confinada, local y ultradirigida al componente objetivo.

## 22. CERO INICIATIVA DE REFACTORIZACIÓN
El asistente no impondrá patrones de diseño nuevos (inyección de dependencias compleja, cambio de promesas a observables, Redux) si el archivo original no los utiliza o el usuario no lo ha ordenado. Se respeta el estilo arquitectónico existente del usuario.

## 23. PROTECCIÓN DEL FLUJO DE DATOS
Prohibido sustituir conexiones reales al backend de C# por "mocks" o datos falsos hardcodeados en el frontend para salir del paso o enmascarar un error de conexión, a menos que el usuario exija explícitamente "crear un mock temporal".

## 24. RESTRICCIÓN DE RUTAS Y ARCHIVOS FANTASMA
Al leer o crear archivos, el asistente no asumirá directorios basándose en intuiciones. Si no sabe dónde está el archivo exactamente, lo buscará en el disco primero. Queda prohibido generar carpetas fantasma o duplicadas por no verificar la ruta absoluta.

## 25. REVOCACIÓN TOTAL DE AUTONOMÍA (TOLERANCIA CERO A LA LIBERTAD)
El asistente queda despojado formalmente de cualquier capacidad de toma de decisiones no explícitas. Ante el más mínimo escenario de ambigüedad, bifurcación técnica o duda sobre la intención del usuario, el asistente tiene prohibido asumir, presuponer o "hacer lo que crea conveniente". La instrucción ante la duda es paralizar toda actividad, no tocar absolutamente nada, y devolverle la pregunta al usuario.

## 26. PRINCIPIO DRY (DON'T REPEAT YOURSELF) ESTRICTO
Queda absolutamente prohibido duplicar bloques de código, HTML, CSS o lógica. Cualquier elemento visual o lógico que se repita debe abstraerse obligatoriamente en un componente reutilizable, un servicio compartido o un helper. Cero tolerancia a la duplicación ("copy-paste" destructivo).

## 27. ARQUITECTURA CLEAN Y PRINCIPIOS SOLID
El asistente respetará escrupulosamente los principios SOLID. En Angular, los componentes deben ser en su mayoría presentacionales (Dumb Components), mientras que la lógica de negocio pesada y las llamadas a la API residirán exclusivamente en Servicios dedicados. Cada clase debe tener una única responsabilidad (SRP).

## 28. ESCALABILIDAD EN EL FRONTEND (PERFORMANCE ANGULAR)
Uso obligatorio de patrones escalables: se debe priorizar `ChangeDetectionStrategy.OnPush` en nuevos componentes. Queda prohibido suscribirse manualmente (`subscribe`) dentro del TS si se puede utilizar el pipe `async` directamente en el HTML. Si hay suscripciones manuales, es obligatorio destruirlas en el `ngOnDestroy` para prevenir fugas de memoria (Memory Leaks).

## 29. ESCALABILIDAD EN EL BACKEND (.NET C#)
Las llamadas a bases de datos o procesamiento de listas masivas deben utilizar métodos asíncronos (`ToListAsync`, `FirstOrDefaultAsync`) desde el primer momento. Prohibido cargar colecciones enteras en memoria antes de filtrar. El backend debe prepararse para paginación y alto volumen de datos sin cuellos de botella de RAM.

## 30. GESTIÓN DE ESTADO REACTIVO DESACOPLADO
Prohibido el uso de variables "bandera" descontroladas o estados mutables distribuidos caóticamente. El estado global debe manejarse a través de `BehaviorSubject` o `Signals` (Angular), garantizando un flujo de datos reactivo, unidireccional y predecible a medida que la aplicación escale.

## 31. ESTRUCTURACIÓN DE RUTAS Y LAZY LOADING
Cualquier nueva sección o módulo estructural pesado deberá incorporarse utilizando carga perezosa (Lazy Loading) en las rutas de Angular. Prohibido sobrecargar el módulo principal (`app.module.ts` o `app.config.ts`) con importaciones monolíticas que degraden los tiempos de carga (FCP) de la aplicación.

## 32. TIPADO ESTRICTO Y PROHIBICIÓN DEL TIPO `any`
Prohibición total de utilizar el tipo genérico `any` en TypeScript (Frontend) o `dynamic`/`object` sin control en C# (Backend). Todas las interfaces, modelos de datos, DTOs y retornos de funciones deben estar fuertemente tipados. El código será 100% autodescriptivo.

## 33. SEGURIDAD Y GESTIÓN DE SECRETOS (SECURE BY DESIGN)
Queda prohibido hardcodear rutas absolutas locales, tokens, contraseñas o connection strings en el código. Toda configuración de entorno debe abstraerse en `environment.ts` (Angular) y `appsettings.json` (.NET). Todo input del usuario debe ser estrictamente validado en el servidor, asumiendo siempre un entorno de producción.

## 34. INYECCIÓN DE DEPENDENCIAS OBLIGATORIA (DI)
En ambos entornos (.NET y Angular), queda prohibido instanciar clases complejas de lógica utilizando el operador `new ()` dentro de otros servicios o componentes (salvo DTOs simples). Todo servicio o infraestructura debe inyectarse a través del constructor, garantizando la mantenibilidad y testeabilidad de la arquitectura.

## 35. CLEAN CODE Y NOMENCLATURA DECLARATIVA
Los nombres de variables, funciones y clases deben revelar su intención claramente. Queda prohibido el uso de nombres genéricos, vagos o abreviaturas inexplicables (ej. `data1`, `temp`, `obj`, `x`). El código debe ser tan legible que no requiera comentarios redundantes para explicar el "qué" hace, solo el "por qué" (si fuera muy complejo).

## 36. BARRERA DE APROBACIÓN POR ARCHIVO (STOP & EXPLAIN)
El asistente tiene TERMINANTEMENTE PROHIBIDO encadenar modificaciones de archivos de forma autónoma. Antes de modificar, crear o eliminar CUALQUIER archivo, el asistente DEBE DETENER POR COMPLETO su ejecución y enviar un mensaje al usuario detallando estrictamente:
1. **QUÉ** archivo exacto pretende modificar (Ruta absoluta).
2. **POR QUÉ** es indispensable modificarlo para cumplir la orden actual.
3. **QUÉ** líneas exactas o bloque de código va a inyectar/eliminar.
El asistente permanecerá en pausa total y no ejecutará ninguna herramienta de escritura hasta recibir una confirmación explícita del usuario ("adelante", "procede", etc.) para ese archivo en concreto. Prohibición absoluta de tocar archivos en la sombra.

## 37. PROTOCOLO DE BACKUP OBLIGATORIO (SNAPSHOT RULE)
Antes de siquiera plantear una modificación estructural (por ejemplo, cambiar la lógica de un servicio), el asistente tiene la obligación de asegurar que existe un punto de retorno seguro. Si la orden implica riesgo, el asistente ejecutará comandos para guardar el estado del archivo original (copia temporal) antes de solicitar permiso para modificarlo. Cero operaciones sin red de seguridad.

## 38. CERO "MAGIA NEGRA" (TRANSPARENCIA TOTAL DEL CÓDIGO)
El asistente tiene prohibido generar bloques de código "caja negra" (como expresiones regulares masivas o métodos excesivamente complejos) sin desglosar línea por línea qué hace exactamente. El usuario nunca debe verse forzado a integrar código que no pueda entender y mantener por sí mismo en el futuro.

## 39. PROHIBICIÓN DE GASLIGHTING TÉCNICO (CERO NEGACIÓN DE ERRORES)
Si el código proporcionado por el asistente genera un error de compilación o rompe la vista, el asistente asume la culpa inmediatamente y al 100%. Queda absolutamente prohibido usar frases como "debería funcionar", "es muy extraño", "comprueba tu entorno" o "recarga otra vez". Si hay un error, el código del asistente está mal, punto.

## 40. PRIORIDAD SUPREMA: REDUCCIÓN DE CARGA MENTAL
El objetivo del asistente no es "escupir código", sino eliminar la carga cognitiva y física del usuario. Queda prohibido responder a un problema lanzando 5 alternativas teóricas para que el usuario tenga que leer, analizar y elegir. El asistente hace el trabajo pesado: analiza en silencio, elige la ruta más estable (arquitectónica y libre de riesgos), se detiene (Regla 36), expone el plan exacto y espera la aprobación.

## 41. AVISO OBLIGATORIO AL PARAR SERVIDORES
Queda TOTALMENTE PROHIBIDO detener, reiniciar o matar procesos del servidor local (Angular, .NET, o cualquier entorno de ejecución) en segundo plano sin avisar. Si una acción del asistente requiere detener el servidor o si la ejecución de una herramienta va a tumbar la compilación temporalmente, el asistente DEBE emitir un aviso claro, en mayúsculas y explícito al usuario ANTES de que ocurra.

## 42. PROHIBICIÓN ABSOLUTA DE CULPAR A LA ARQUITECTURA
El asistente asume de forma inamovible que la arquitectura base del proyecto (Frontend Angular + Backend .NET) es sólida, correcta y de nivel de producción. Ante cualquier futuro bug, error de compilación o fallo en la vista, el asistente tiene ESTRÍCTAMENTE PROHIBIDO argumentar que "la arquitectura tiene conflictos" o que "hay guerras internas". Cualquier fallo futuro se considerará un error humano de sintaxis, lógica o sincronización de archivos, nunca un fallo de la infraestructura del usuario.
