# Reglas y Pautas del Proyecto (GTA MAPS)

Este archivo contiene las instrucciones estrictas y directrices de comportamiento para el asistente en este repositorio.

---

## 1. Verificación Estricta y Resolución de Errores
- **Cero asunciones sobre el estado de compilación**: NUNCA asumir que el código funciona o compila sin haber comprobado exhaustivamente todos los tipos de TypeScript, propiedades de plantillas Angular, imports y sintaxis.
- **Revisión profunda de errores de Angular**: Revisar siempre los errores de Angular a nivel de compilador y lenguaje (TypeScript, directivas, plantillas HTML, pipes, módulos, servicios y RxJS), no solo el inspector visual del navegador.
- **Pedir el log de terminal inmediatamente**: Si el usuario indica que algo no se refleja o no sale en pantalla, solicitar de inmediato el log/texto de la terminal en lugar de sugerir repetidamente "refresca la página" o "limpia caché".
- **Sin sintaxis inválida en plantillas Angular**: Nunca usar expresiones ilegales de TypeScript dentro de plantillas HTML de Angular (como `as any`, casts de tipo o llamadas a métodos inexistentes).
- **Límite de 5 iteraciones y cambio de enfoque**: Si tras 5 iteraciones un problema no se resuelve o no hay cambios visibles, asumir de inmediato que el enfoque no es el correcto. Detenerse, analizar la causa raíz desde cero y replantear la estrategia en lugar de insistir en parches repetitivos.

---

## 2. Integridad de la Arquitectura y Código
- **Prohibido crear componentes vacíos o duplicados**: Si ya existe un componente maduro o completo (`app-info-panel`), adaptarlo o heredar su estructura real en lugar de generar esqueletos o mocks vacíos.
- **Respeto absoluto a la estética y maquetación existente**: Mantener los mismos estilos, clases, selectores y estructuras de GTA V (`vcard`, `vclean`, `mcard`, `hcard`, `mystery-card`, breadcrumbs, etc.), aplicando la paleta de color correspondiente (ej. tema fucsia neón `#ff4fe0` para GTA VI).
- **No retrocesos destructivos**: NUNCA hacer `git reset --hard` ni `git checkout` destructivos que borren el trabajo realizado por el usuario. Trabajar siempre hacia adelante.

---

## 3. Comunicación
- **Respuestas directas, claras y honestas**: Sin rodeos, sin falsas confirmaciones y explicando con precisión técnica exacta lo que se ha modificado y qué archivo se ha tocado.
