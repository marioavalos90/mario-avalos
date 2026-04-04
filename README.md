# Aplicación HTML para Toma de Inventario

Aplicación web ligera (sin backend) para registrar conteos de inventario en almacén o tienda, comparar contra stock esperado y exportar resultados.

## Funcionalidades incluidas

- Captura de datos generales de la toma:
  - Empresa
  - Almacén
  - Responsable
  - Fecha
- Registro de productos con:
  - Código
  - Descripción
  - Categoría
  - Ubicación
  - Cantidad esperada
  - Cantidad contada
  - Diferencia automática
  - Estado (Cuadra / Faltante / Sobrante)
  - Observaciones
- Edición y eliminación de registros.
- Filtros por texto y por estado.
- Resumen total de productos y cantidades.
- Persistencia local usando `localStorage` (los datos permanecen al recargar el navegador).
- Exportación a CSV y respaldo JSON.
- Importación desde JSON para recuperar o mover inventarios.

## Archivos principales

- `index.html`: estructura de la interfaz.
- `styles.css`: estilos responsivos.
- `app.js`: lógica de negocio y manejo de datos.

## Cómo usar

1. Abre `index.html` en tu navegador.
2. Completa los datos generales del inventario.
3. Agrega productos en el formulario.
4. Usa filtros para buscar diferencias.
5. Exporta a CSV o JSON cuando finalices.

## Nota

Esta es una versión frontend lista para operar localmente. Si después quieres, se puede extender con:

- inicio de sesión por usuario,
- carga masiva desde Excel/CSV,
- sincronización con base de datos/API,
- impresión de reportes de conteo.
