# Panel de Gestión de Redes - TSJ La Rioja

Sistema de control y seguimiento de tareas de infraestructura y redes para el Tribunal Superior de Justicia de La Rioja.

## Descripción general

Este proyecto es una aplicación web de gestión operativa para:

- registrar tareas de red
- asignarlas a técnicos
- controlar estados por tablero Kanban
- llevar observaciones del jefe de redes
- visualizar avances del proyecto
- exportar reportes a Excel y PDF
- gestionar usuarios y permisos por rol

La aplicación está desarrollada con HTML, CSS y JavaScript puro, y guarda la información en localStorage del navegador.

## Funcionalidades principales

### 1. Login con usuarios y permisos

- ingreso por usuario y contraseña
- dos roles principales:
  - Jefe de Redes: acceso administrativo completo
  - Técnico: solo visualiza y gestiona tareas asignadas

### 2. Gestión de tareas

- crear tareas con título, descripción, área, prioridad y fecha
- asignar responsabilidad a un responsable
- cambiar de estado:
  - Pendiente
  - En Progreso
  - Observada
  - Completada
- edición y eliminación solo habilitada para el jefe
- tareas visibles según el usuario logueado

### 3. Tablero Kanban

- interfaz visual tipo tablero en columnas
- arrastre de tareas entre estados
- filtros por:
  - estado
  - prioridad
  - área
  - responsable

### 4. Observaciones

- registro de observaciones por parte del jefe
- cambio de estado de observación
- seguimiento de pendientes, en proceso y resueltas

### 5. Resumen del proyecto

- indicadores generales de tareas
- avance total
- tareas por estado
- tareas activas
- actividad reciente
- alertas de vencimiento

### 6. Reportes

- exportación a Excel
- exportación a PDF
- generación de reportes con datos del proyecto y tareas visibles

### 7. Administración de usuarios

- creación de nuevos usuarios desde el panel del jefe
- elección del rol al crear usuario
- edición de datos del usuario
- eliminación de usuarios

### 8. Personalización visual

- cambio de tema entre oscuro y claro
- fondo blanco completo en modo claro

## Roles del sistema

### Jefe de Redes

Puede:

- crear tareas
- editar tareas
- eliminar tareas
- asignar responsables
- cambiar estados
- crear observaciones
- gestionar usuarios
- exportar reportes
- configurar proyecto

### Técnico

Puede:

- iniciar sesión con su usuario
- ver solo sus tareas asignadas
- cambiar el estado de sus tareas según su alcance
- consultar avances del proyecto
- no puede crear ni eliminar tareas
- no puede administrar usuarios

## Usuarios por defecto

- Usuario: jefe
  - Contraseña: jefe123
  - Rol: admin

- Usuario: tecnico
  - Contraseña: tec123
  - Rol: tecnico

## Requisitos

- navegador web moderno
- acceso a Internet para cargar librerías externas de exportación

## Ejecución

Simplemente abre el archivo index.html en el navegador.

Opcionalmente, podés servirlo con un servidor local, por ejemplo:

```bash
python -m http.server 8000
```

Luego abrí:

```text
http://localhost:8000
```

## Tecnologías utilizadas

- HTML5
- CSS3
- JavaScript
- localStorage
- XLSX para exportación a Excel
- jsPDF y jspdf-autotable para exportación a PDF

## Estructura del proyecto

```text
redes-tsj/
├── index.html
├── css/
│   └── style.css
├── js/
│   └── app.js
├── README.md
└── .gitignore
```

## Consideraciones

Este sistema es una solución front-end estática, pensada para uso interno y local. Los datos se almacenan en el navegador y no incluye backend ni base de datos real.

## Objetivo del sistema

El proyecto está orientado a facilitar la organización del trabajo de infraestructura y redes, permitiendo una gestión clara, ordenada y con permisos definidos para cada tipo de usuario.

## Autor

Proyecto desarrollado para gestión operativa de redes del TSJ La Rioja.
