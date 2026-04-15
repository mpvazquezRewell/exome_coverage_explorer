# Exome 2.5 Coverage Explorer · Héritas

WebApp responsiva desarrollada en React y Vite para la exploración de cobertura de genes del panel Illumina Exome 2.5 (DRAGEN) y su visualización de reportes clínicos predictivos.

## Funcionalidades principales

- **Auto-carga de CSVs:** Identificación automática de *gene_level_v2.csv* y *low_regions_v2.csv* (Configuración en formato opción A, alojados en carpeta `public/`).
- **Drag an Drop Interactivo:** Posibilidad de sobreescribir los datos temporalmente subiendo cualquier reporte de Heritas compatible sin requerir refrescos ni builds.
- **Responsive Web Design:** Interface con esquema de Glassmorfismo lista para uso en dispositivos Mobile.
- **Listados Predefinidos (Presets):** Accesibilidad de búsqueda para paneles genéticos (BRCA PAnel, Lynch / MMR, Li-Fraumeni, entre otros).
- **Análisis de Thresholds:** Detección de fallas y warning automatizado en base a recuentos *'Recurrent'* y micro-regiones >4bp.

## Desarrollo Local 🛠️

```bash
# 1. Instalar dependencias
npm install

# 2. Iniciar servidor desarrollo local (HMR Activado)
npm run dev

# 3. Empaquetar a producción
npm run build
```

## Cloud Run Deployment 🚀

Este proyecto ha sido dockerizado para asegurar una rápida distribución hacia GCP. Todo despliegue es en base a contenedores aislados que resuelven Single-Page-Apps vía `nginx`.

Para mandar una compilación al servicio administrado usando el ambiente ya conectado:
```bash
gcloud run deploy exome-explorer --source . --region us-central1 --allow-unauthenticated
```
