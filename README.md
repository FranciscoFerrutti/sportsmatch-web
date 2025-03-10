# SportsMatch Web

Este repositorio contiene el código fuente de la aplicación web de **SportsMatch**, desarrollada en **React.js con Vite**. Está diseñada para que los clubes deportivos gestionen sus canchas, horarios y reservas de manera eficiente.

## Tecnologías utilizadas

- **React.js + Vite**: Framework y entorno de desarrollo rápido para aplicaciones web modernas.
- **Axios**: Cliente HTTP para consumir la API del backend.
- **React Router**: Manejo de rutas y navegación dentro de la aplicación.
- **Google Maps API**: Integración para la selección de ubicaciones de clubes.

## Configuración

Para ejecutar la aplicación en modo desarrollo, sigue estos pasos:

1. **Instalar las dependencias**:

   ```sh
   npm install
   ```

2. **Crear un archivo `.env`** en el directorio raíz del proyecto con la siguiente configuración:

| Variable                      | Descripción |
|--------------------------------|------------|
| `VITE_API_BASE_URL`            | URL base del backend de SportsMatch+ |
| `VITE_GOOGLE_MAPS_API_KEY`     | Clave de API de Google Maps para la selección de ubicaciones |

## Ejecución

1. **Iniciar la aplicación en modo desarrollo**:

   ```sh
   npm run dev
   ```

2. **Abrir la aplicación en el navegador**:

   ```
   http://localhost:5173
   ```

## Funcionalidades principales

✅ **Gestión de clubes y canchas**  
✅ **Administración de horarios y disponibilidad**  
✅ **Visualización de reservas en un calendario interactivo**  
✅ **Integración con Google Maps para ubicación de clubes**  
✅ **Interfaz optimizada para escritorio y dispositivos móviles**  

---