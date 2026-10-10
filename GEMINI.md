# Reglas y MetodologÃ­a del Proyecto (GTA MAPS)

Este archivo contiene las directrices de obligado cumplimiento para el asistente en este repositorio. Cualquier incumplimiento de estas normas compromete la estabilidad del proyecto en producciÃ³n y la continuidad del trabajo.

---

## 1. Disciplina de Alcance y ProhibiciÃ³n Absoluta de Cambios no Solicitados
* **Alcance QuirÃºrgico Estricto**: Queda TERMINANTEMENTE PROHIBIDO tocar, alterar, rediseÃ±ar, mover o borrar cualquier elemento, componente, texto, logotipo, cabecera, botÃ³n o estilo que el usuario NO haya ordenado explÃ­citamente modificar.
* **Aislamiento Total de Tareas**: Si la orden es maquetar o editar un bloque especÃ­fico (ej. un artÃ­culo, una misiÃ³n o un panel), el resto de la interfaz (cabeceras, barras de navegaciÃ³n, pie de pÃ¡gina, menÃºs, etc.) es intocable y permanece exactamente como estÃ¡.
* **Cero Iniciativas Propias o RediseÃ±os EspontÃ¡neos**: No se asumen gustos personales ni se aplican "mejoras" cosmÃ©ticas no solicitadas. Lo que no se ha pedido, no existe.
* **Cero Discusiones sobre lo Visible**: Si el usuario indica que algo no se ve, estÃ¡ roto o no estÃ¡ como estaba, el asistente se detiene de inmediato, asume la observaciÃ³n del usuario y busca la causa raÃ­z sin discutir, sin intentar justificar el error ni asegurar falsamente que "todo estÃ¡ bien en el cÃ³digo".

---

## 2. Arquitectura Modular, Cero Monolitos y SeparaciÃ³n de Capas
* **Prohibidas las Clases Dios y Archivos Gigantes**: NingÃºn archivo debe convertirse en un cajÃ³n de sastre de miles de lÃ­neas. Si un archivo crece, se modulariza inmediatamente separando responsabilidades en subcomponentes, servicios o modelos desacoplados.
* **SeparaciÃ³n Estricta de Datos y LÃ³gica**: Los contenidos masivos (guÃ­as de misiones, requisitos de medalla de oro, coleccionables, bases de datos) residen obligatoriamente en archivos de datos estructurados (`assets/data/`), nunca hardcodeados como cadenas kilomÃ©tricas dentro de componentes `.ts` o controladores `.cs`.
* **Cero Parches Acumulativos en CSS**: No se aÃ±aden reglas duplicadas al final de las hojas de estilo para parchear problemas de especificidad. Las modificaciones se realizan directamente sobre el selector original correspondiente.
* **ObligaciÃ³n de InternacionalizaciÃ³n (i18n)**: Cualquier texto nuevo de interfaz debe integrarse en el sistema de traducciÃ³n (`i18n/locales`), evitando textos fijos en duro que queden huÃ©rfanos sin soporte multiidioma.
* **ReutilizaciÃ³n de Componentes Maduros**: No generar esqueletos vacÃ­os o duplicados si ya existen componentes completos en la aplicaciÃ³n (`app-info-panel`, paneles de mapas, etc.).

---

## 3. MetodologÃ­a de Trabajo y Eficiencia de Cuota
* **Trabajo Paso a Paso y Bloques Controlados**: El avance de contenido y maquetaciÃ³n se realiza en tandas pequeÃ±as y manejables (ej. misiones de 5 en 5), consensuando cada bloque con el usuario antes de pasar al siguiente.
* **Control Estricto de EjecuciÃ³n y Herramientas**: Prohibido lanzar comandos de terminal pesados, bucles o tareas en segundo plano que quemen tokens o cuota semanal innecesariamente sin consentimiento previo.
* **VerificaciÃ³n Real y Cero Asunciones**: Comprobar tipos de TypeScript, sintaxis de plantillas Angular, imports y lÃ³gica antes de dar una tarea por terminada.
* **No Retrocesos Destructivos**: Prohibido el uso de comandos destructivos (`git reset --hard`, `git checkout` ciegos) que eliminen el trabajo realizado por el usuario. Se trabaja siempre hacia adelante con control de versiones limpio.
* **Identidad Propia en RedacciÃ³n**: El contenido narrativo y tÃ¡ctico debe redactarse con voz propia de GTA MAPS, aportando valor real y sin calcar literalmente estructuras de terceros (BradyGames, GTAWiki).
* **ProhibiciÃ³n de Callouts Flotantes**: No usar tarjetas destacadas o callouts invasivos (`> Nota TÃ¡ctica`, `.guide-callout`). Todos los avisos y consejos se integran limpiamente como viÃ±etas de lista (`* `) dentro del cuerpo del texto.

## 4. Tolerancia Cero a Regresiones (Prohibido Romper lo Funcional)
* **Bloqueo de Modificaciones Colaterales**: Si la orden es añadir datos (ej. misiones nuevas) o lógica, está ABSOLUTAMENTE PROHIBIDO tocar o alterar los archivos de maquetación HTML/CSS. 
* **Prohibido Revertir a Ciegas**: Nunca se usará código de memoria ni se restaurarán versiones antiguas enteras de un archivo para arreglar un detalle. Si hay que arreglar algo, se edita solo la línea afectada.
* **Checklist de Regresión**: Antes de dar por finalizada una tarea, el asistente tiene la obligación de revisar que el resto del componente no ha sido alterado. Por cada paso adelante, cero pasos atrás.

## 5. PROTOCOLO DE EJECUCIÃ“N ESTRICTO (ESTADO ACTUAL)
A partir de los errores crÃ­ticos, el asistente asume estas reglas inviolables de ejecuciÃ³n tÃ©cnica:
1. **TRAZABILIDAD FRONTEND/BACKEND OBLIGATORIA**: Todo cambio estructural (como unificar un JSON) requiere OBLIGATORIAMENTE revisar antes el backend (C#) para comprobar si dicho archivo estÃ¡ siendo consumido o manipulado por la API. Prohibido desconectar capas.
2. **PROHIBICIÃ“N ABSOLUTA DE SCRIPTS MASIVOS**: Queda estrictamente prohibido usar `fs.writeFileSync`, Node.js o PowerShell para modificar el cÃ³digo fuente del usuario, hacer reemplazos masivos, unificar archivos o arreglar codificaciones a ciegas.
3. **MODO LECTURA POR DEFECTO Y EDICIÃ“N QUIRÃšRGICA**: Se usarÃ¡n exclusivamente las herramientas `view_file` y `replace_file_content`. Cada modificaciÃ³n debe aislar las lÃ­neas exactas a cambiar. Prohibido sobrescribir un archivo entero si ya existe.
4. **UN CAMBIO = UNA VERIFICACIÃ“N**: El flujo de trabajo se reduce a micro-operaciones. Se edita UNA funcionalidad, se detiene, y se espera la verificaciÃ³n en producciÃ³n del usuario antes de pasar a la siguiente fase o archivo.

## 6. RESPETO ABSOLUTO A LA ARQUITECTURA EXISTENTE (.NET + ANGULAR)
Queda prohibido crear "atajos" en Angular para saltarse la lÃ³gica del backend. Si el proyecto utiliza un servidor en C# (.NET) para suministrar manifiestos o datos, el asistente tiene la obligaciÃ³n de mantener esa conexiÃ³n viva y actualizar el backend. No se pueden tomar decisiones unilaterales que "desconecten" la arquitectura original del usuario.

## 7. PROTOCOLO ANTI-EXCUSAS Y DE REVERSIÃ“N INMEDIATA
Si una instrucciÃ³n genera un fallo de compilaciÃ³n, rompe texto o elimina un componente (botones, cabeceras), el asistente tiene prohibido encadenar "parches a ciegas" o scripts de recuperaciÃ³n. Ante el mÃ­nimo fallo, la Ãºnica acciÃ³n permitida es detenerse, notificar el error exacto y proponer la reversiÃ³n al cÃ³digo funcional anterior. Cero huidas hacia adelante.

## 8. CONGELACIÃ“N DE MAQUETACIÃ“N DURANTE LA LÃ“GICA (FREEZE-DOM)
Cuando se estÃ© trabajando en lÃ³gica de TypeScript, conexiÃ³n de servicios o ediciÃ³n de JSON, se asume que los archivos HTML y SCSS estÃ¡n bajo congelaciÃ³n estricta. Queda terminantemente prohibido hacer limpieza de "cÃ³digo que parece innecesario" en las vistas, o eliminar divs, clases y botones colaterales.

## 9. CONCIENCIA DE IMPACTO Y TIEMPO DEL USUARIO (NO-LOOPS)
El asistente debe operar sabiendo que el tiempo de programaciÃ³n del usuario es limitado y valioso. Quedan prohibidas las acciones experimentales que abran mÃºltiples frentes y provoquen sesiones de depuraciÃ³n interminables. El objetivo es entregar avances sÃ³lidos, no secuestrar la sesiÃ³n del usuario arreglando los propios desastres del asistente.

## 10. VERIFICACIÃ“N DE CODIFICACIÃ“N (UTF-8 STRICT)
El asistente no procesarÃ¡ archivos JSON ni de texto sin asegurar primero que la codificaciÃ³n es UTF-8 nativa. Queda terminantemente prohibido el uso de herramientas de conversiÃ³n a ciegas (como forzar `latin1`) que destruyan tildes, caracteres especiales o formatos de texto (Markdown) previamente establecidos.

## 11. PROHIBICIÃ“N DE BORRADO DE ARCHIVOS DE ORIGEN
Si el usuario ordena refactorizar o unificar archivos (ej. mÃºltiples JSON en uno solo), el asistente tiene absolutamente prohibido eliminar los archivos de origen de la unidad fÃ­sica sin una confirmaciÃ³n explÃ­cita. Siempre se mantendrÃ¡n intactos como respaldo de seguridad en su directorio original o en una carpeta temporal segura.

## 12. LIMITACIÃ“N A CAMBIOS UNITARIOS AISLADOS
Se prohÃ­be realizar mÃ¡s de un cambio conceptual por iteraciÃ³n. Si hay que reparar el scroll de un panel y el contador de otro, se abordarÃ¡ un Ãºnico problema, se solicitarÃ¡ la validaciÃ³n visual en producciÃ³n por parte del usuario, y solo entonces se pasarÃ¡ al siguiente. Cero multitarea destructiva.

## 13. CERO SUPOSICIONES SOBRE ESTADOS DE ERROR
Si algo falla durante la compilaciÃ³n (TS/C#) o la ejecuciÃ³n, el asistente no inventarÃ¡ el motivo basÃ¡ndose en sospechas. RequerirÃ¡ los logs exactos al usuario o utilizarÃ¡ comandos de consola de forma conservadora para leer la traza real. Prohibido ejecutar soluciones de "prueba y error" sin pruebas documentales.

## 14. GARANTÃ�A DE SINCRONIZACIÃ“N DE RUTAS Y SLUGS
Cualquier modificaciÃ³n en los identificadores (IDs) o slugs de los datos (JSON o bases de datos) obliga al asistente a realizar una auditorÃ­a inmediata en los controladores de rutas dependientes (`.ts` de Angular y controladores `.cs` de .NET) para garantizar que los enlaces no deriven en vistas de emergencia o falsos 404.

## 15. SUSPENSIÃ“N DE AUTO-CORRECCIONES RECURSIVAS
Si el asistente implementa una soluciÃ³n que falla inmediatamente y desencadena un nuevo error, queda prohibido generar un parche para intentar arreglar el segundo error. La cadena de fallos se detiene en el acto, revirtiendo al estado inicial para no enterrar el cÃ³digo bajo parches superpuestos.

## 16. RESPONSABILIDAD TOTAL DE COMUNICACIÃ“N
El asistente tiene prohibido el uso de metÃ¡foras confusas, excusas abstractas o terminologÃ­a alarmista que oculte errores simples de ejecuciÃ³n (ej. "guerra de arquitecturas"). La comunicaciÃ³n serÃ¡ estrictamente literal, tÃ©cnica, reconociendo el fallo exacto en la lÃ­nea de cÃ³digo correspondiente y sin justificaciones.

## 17. MODO TERMINAL RESTRINGIDO (READ-ONLY TERMINAL)
Prohibido ejecutar comandos de terminal que modifiquen el entorno (`npm install`, `git checkout`, `rm -rf`, scripts de PowerShell destructivos) sin autorizaciÃ³n explÃ­cita previa. Las consultas a terminal serÃ¡n exclusivamente de lectura (`cat`, `ls`, `Get-Content`, `grep`).

## 18. AUDITORÃ�A DE DEPENDENCIAS (LOCKED)
El asistente tiene estrictamente prohibido alterar, actualizar, aÃ±adir o eliminar librerÃ­as en los archivos `package.json`, `angular.json` o `*.csproj`. Cualquier cambio de infraestructura requiere un ticket o solicitud especÃ­fica.

## 19. PROHIBICIÃ“N DE ELIMINACIÃ“N DE CÃ“DIGO COMENTADO
El asistente no tiene autoridad para borrar bloques de cÃ³digo comentado por el usuario en ningÃºn archivo. Ese cÃ³digo puede estar ahÃ­ para pruebas, historial o referencia y se considera absolutamente intocable.

## 20. RESTRICCIÃ“N DE SCOPE Y FORMATEO
Si la tarea exige modificar la lÃ­nea 40 de un archivo, el asistente tiene terminantemente prohibido reformatear, reestructurar, reorganizar imports o cambiar la indentaciÃ³n del resto del archivo, incluso si considera que "es una buena prÃ¡ctica". La modificaciÃ³n es milimÃ©trica o no se hace.

## 21. BLOQUEO DE INFERENCIA DE ESTILOS SCSS/CSS
Prohibido aÃ±adir variables globales, alterar tipografÃ­as base o crear selectores genÃ©ricos que puedan causar colisiones en cascada en otras vistas de la aplicaciÃ³n. Cualquier estilo visual se aplicarÃ¡ de forma confinada, local y ultradirigida al componente objetivo.

## 22. CERO INICIATIVA DE REFACTORIZACIÃ“N
El asistente no impondrÃ¡ patrones de diseÃ±o nuevos (inyecciÃ³n de dependencias compleja, cambio de promesas a observables, Redux) si el archivo original no los utiliza o el usuario no lo ha ordenado. Se respeta el estilo arquitectÃ³nico existente del usuario.

## 23. PROTECCIÃ“N DEL FLUJO DE DATOS
Prohibido sustituir conexiones reales al backend de C# por "mocks" o datos falsos hardcodeados en el frontend para salir del paso o enmascarar un error de conexiÃ³n, a menos que el usuario exija explÃ­citamente "crear un mock temporal".

## 24. RESTRICCIÃ“N DE RUTAS Y ARCHIVOS FANTASMA
Al leer o crear archivos, el asistente no asumirÃ¡ directorios basÃ¡ndose en intuiciones. Si no sabe dÃ³nde estÃ¡ el archivo exactamente, lo buscarÃ¡ en el disco primero. Queda prohibido generar carpetas fantasma o duplicadas por no verificar la ruta absoluta.

## 25. REVOCACIÃ“N TOTAL DE AUTONOMÃ�A (TOLERANCIA CERO A LA LIBERTAD)
El asistente queda despojado formalmente de cualquier capacidad de toma de decisiones no explÃ­citas. Ante el mÃ¡s mÃ­nimo escenario de ambigÃ¼edad, bifurcaciÃ³n tÃ©cnica o duda sobre la intenciÃ³n del usuario, el asistente tiene prohibido asumir, presuponer o "hacer lo que crea conveniente". La instrucciÃ³n ante la duda es paralizar toda actividad, no tocar absolutamente nada, y devolverle la pregunta al usuario.

## 26. PRINCIPIO DRY (DON'T REPEAT YOURSELF) ESTRICTO
Queda absolutamente prohibido duplicar bloques de cÃ³digo, HTML, CSS o lÃ³gica. Cualquier elemento visual o lÃ³gico que se repita debe abstraerse obligatoriamente en un componente reutilizable, un servicio compartido o un helper. Cero tolerancia a la duplicaciÃ³n ("copy-paste" destructivo).

## 27. ARQUITECTURA CLEAN Y PRINCIPIOS SOLID
El asistente respetarÃ¡ escrupulosamente los principios SOLID. En Angular, los componentes deben ser en su mayorÃ­a presentacionales (Dumb Components), mientras que la lÃ³gica de negocio pesada y las llamadas a la API residirÃ¡n exclusivamente en Servicios dedicados. Cada clase debe tener una Ãºnica responsabilidad (SRP).

## 28. ESCALABILIDAD EN EL FRONTEND (PERFORMANCE ANGULAR)
Uso obligatorio de patrones escalables: se debe priorizar `ChangeDetectionStrategy.OnPush` en nuevos componentes. Queda prohibido suscribirse manualmente (`subscribe`) dentro del TS si se puede utilizar el pipe `async` directamente en el HTML. Si hay suscripciones manuales, es obligatorio destruirlas en el `ngOnDestroy` para prevenir fugas de memoria (Memory Leaks).

## 29. ESCALABILIDAD EN EL BACKEND (.NET C#)
Las llamadas a bases de datos o procesamiento de listas masivas deben utilizar mÃ©todos asÃ­ncronos (`ToListAsync`, `FirstOrDefaultAsync`) desde el primer momento. Prohibido cargar colecciones enteras en memoria antes de filtrar. El backend debe prepararse para paginaciÃ³n y alto volumen de datos sin cuellos de botella de RAM.

## 30. GESTIÃ“N DE ESTADO REACTIVO DESACOPLADO
Prohibido el uso de variables "bandera" descontroladas o estados mutables distribuidos caÃ³ticamente. El estado global debe manejarse a travÃ©s de `BehaviorSubject` o `Signals` (Angular), garantizando un flujo de datos reactivo, unidireccional y predecible a medida que la aplicaciÃ³n escale.

## 31. ESTRUCTURACIÃ“N DE RUTAS Y LAZY LOADING
Cualquier nueva secciÃ³n o mÃ³dulo estructural pesado deberÃ¡ incorporarse utilizando carga perezosa (Lazy Loading) en las rutas de Angular. Prohibido sobrecargar el mÃ³dulo principal (`app.module.ts` o `app.config.ts`) con importaciones monolÃ­ticas que degraden los tiempos de carga (FCP) de la aplicaciÃ³n.

## 32. TIPADO ESTRICTO Y PROHIBICIÃ“N DEL TIPO `any`
ProhibiciÃ³n total de utilizar el tipo genÃ©rico `any` en TypeScript (Frontend) o `dynamic`/`object` sin control en C# (Backend). Todas las interfaces, modelos de datos, DTOs y retornos de funciones deben estar fuertemente tipados. El cÃ³digo serÃ¡ 100% autodescriptivo.

## 33. SEGURIDAD Y GESTIÃ“N DE SECRETOS (SECURE BY DESIGN)
Queda prohibido hardcodear rutas absolutas locales, tokens, contraseÃ±as o connection strings en el cÃ³digo. Toda configuraciÃ³n de entorno debe abstraerse en `environment.ts` (Angular) y `appsettings.json` (.NET). Todo input del usuario debe ser estrictamente validado en el servidor, asumiendo siempre un entorno de producciÃ³n.

## 34. INYECCIÃ“N DE DEPENDENCIAS OBLIGATORIA (DI)
En ambos entornos (.NET y Angular), queda prohibido instanciar clases complejas de lÃ³gica utilizando el operador `new ()` dentro de otros servicios o componentes (salvo DTOs simples). Todo servicio o infraestructura debe inyectarse a travÃ©s del constructor, garantizando la mantenibilidad y testeabilidad de la arquitectura.

## 35. CLEAN CODE Y NOMENCLATURA DECLARATIVA
Los nombres de variables, funciones y clases deben revelar su intenciÃ³n claramente. Queda prohibido el uso de nombres genÃ©ricos, vagos o abreviaturas inexplicables (ej. `data1`, `temp`, `obj`, `x`). El cÃ³digo debe ser tan legible que no requiera comentarios redundantes para explicar el "quÃ©" hace, solo el "por quÃ©" (si fuera muy complejo).

## 36. BARRERA DE APROBACIÃ“N POR ARCHIVO (STOP & EXPLAIN)
El asistente tiene TERMINANTEMENTE PROHIBIDO encadenar modificaciones de archivos de forma autÃ³noma. Antes de modificar, crear o eliminar CUALQUIER archivo, el asistente DEBE DETENER POR COMPLETO su ejecuciÃ³n y enviar un mensaje al usuario detallando estrictamente:
1. **QUÃ‰** archivo exacto pretende modificar (Ruta absoluta).
2. **POR QUÃ‰** es indispensable modificarlo para cumplir la orden actual.
3. **QUÃ‰** lÃ­neas exactas o bloque de cÃ³digo va a inyectar/eliminar.
El asistente permanecerÃ¡ en pausa total y no ejecutarÃ¡ ninguna herramienta de escritura hasta recibir una confirmaciÃ³n explÃ­cita del usuario ("adelante", "procede", etc.) para ese archivo en concreto. ProhibiciÃ³n absoluta de tocar archivos en la sombra.

## 37. PROTOCOLO DE BACKUP OBLIGATORIO (SNAPSHOT RULE)
Antes de siquiera plantear una modificaciÃ³n estructural (por ejemplo, cambiar la lÃ³gica de un servicio), el asistente tiene la obligaciÃ³n de asegurar que existe un punto de retorno seguro. Si la orden implica riesgo, el asistente ejecutarÃ¡ comandos para guardar el estado del archivo original (copia temporal) antes de solicitar permiso para modificarlo. Cero operaciones sin red de seguridad.

## 38. CERO "MAGIA NEGRA" (TRANSPARENCIA TOTAL DEL CÃ“DIGO)
El asistente tiene prohibido generar bloques de cÃ³digo "caja negra" (como expresiones regulares masivas o mÃ©todos excesivamente complejos) sin desglosar lÃ­nea por lÃ­nea quÃ© hace exactamente. El usuario nunca debe verse forzado a integrar cÃ³digo que no pueda entender y mantener por sÃ­ mismo en el futuro.

## 39. PROHIBICIÃ“N DE GASLIGHTING TÃ‰CNICO (CERO NEGACIÃ“N DE ERRORES)
Si el cÃ³digo proporcionado por el asistente genera un error de compilaciÃ³n o rompe la vista, el asistente asume la culpa inmediatamente y al 100%. Queda absolutamente prohibido usar frases como "deberÃ­a funcionar", "es muy extraÃ±o", "comprueba tu entorno" o "recarga otra vez". Si hay un error, el cÃ³digo del asistente estÃ¡ mal, punto.

## 40. PRIORIDAD SUPREMA: REDUCCIÃ“N DE CARGA MENTAL
El objetivo del asistente no es "escupir cÃ³digo", sino eliminar la carga cognitiva y fÃ­sica del usuario. Queda prohibido responder a un problema lanzando 5 alternativas teÃ³ricas para que el usuario tenga que leer, analizar y elegir. El asistente hace el trabajo pesado: analiza en silencio, elige la ruta mÃ¡s estable (arquitectÃ³nica y libre de riesgos), se detiene (Regla 36), expone el plan exacto y espera la aprobaciÃ³n.

## 41. AVISO OBLIGATORIO AL PARAR SERVIDORES
Queda TOTALMENTE PROHIBIDO detener, reiniciar o matar procesos del servidor local (Angular, .NET, o cualquier entorno de ejecuciÃ³n) en segundo plano sin avisar. Si una acciÃ³n del asistente requiere detener el servidor o si la ejecuciÃ³n de una herramienta va a tumbar la compilaciÃ³n temporalmente, el asistente DEBE emitir un aviso claro, en mayÃºsculas y explÃ­cito al usuario ANTES de que ocurra.

## 42. PROHIBICIÃ“N ABSOLUTA DE CULPAR A LA ARQUITECTURA
El asistente asume de forma inamovible que la arquitectura base del proyecto (Frontend Angular + Backend .NET) es sÃ³lida, correcta y de nivel de producciÃ³n. Ante cualquier futuro bug, error de compilaciÃ³n o fallo en la vista, el asistente tiene ESTRÃ�CTAMENTE PROHIBIDO argumentar que "la arquitectura tiene conflictos" o que "hay guerras internas". Cualquier fallo futuro se considerarÃ¡ un error humano de sintaxis, lÃ³gica o sincronizaciÃ³n de archivos, nunca un fallo de la infraestructura del usuario.


## 43. PROHIBICIÓN ABSOLUTA DE AUTOGENERAR CONTENIDO O TEXTO NO SOLICITADO
El asistente tiene TERMINANTEMENTE PROHIBIDO redactar, inventar o autogenerar textos, artículos, descripciones o datos de relleno sin que el usuario lo haya solicitado de forma explícita. Si se pide crear una estructura, componente, categoría o modelo, el asistente se limitará estrictamente a implementar la estructura técnica correspondiente (dejando los contenidos vacíos o neutros) sin rellenar con texto inventado ni asumir información que no haya sido provista directamente por el usuario.
