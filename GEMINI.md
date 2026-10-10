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
