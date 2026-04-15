# Exome 2.5 Coverage Explorer · Héritas

Webapp local para explorar cobertura de regiones del Illumina Exome 2.5 (DRAGEN).

## Archivos incluidos

```
exome_coverage_explorer/
├── index.html          ← app completa (abrir en browser)
└── README.md
```

Los CSVs de datos van en la misma carpeta o se cargan en runtime:
- `gene_level_v2.csv`   — resumen por gen
- `low_regions_v2.csv`  — regiones con cobertura baja

## Cómo usar

### Opción A — abrir directo (más simple)
```bash
# Doble click en index.html
# O desde terminal:
open index.html          # macOS
xdg-open index.html      # Linux
start index.html         # Windows
```

> ⚠️ Algunos browsers bloquean file:// cuando se carga con Papa Parse.
> Si no carga bien, usar la Opción B.

### Opción B — servidor local (recomendado)

**Python (sin instalación extra):**
```bash
cd exome_coverage_explorer
python3 -m http.server 8080
# Abrir: http://localhost:8080
```

**Node.js:**
```bash
npx serve .
# Abrir: http://localhost:3000
```

**VS Code:** instalar extensión "Live Server" → click derecho en index.html → "Open with Live Server"

## Flujo de uso

1. Iniciar servidor local → abrir `http://localhost:8080`
2. Arrastrar `gene_level_v2.csv` + `low_regions_v2.csv` a la zona de carga (sidebar izquierdo)
3. Buscar un gen (ej. `BRCA1`) o pegar una lista de genes
4. O usar los **presets clínicos**: BRCA panel, Lynch/MMR, Cardiac panel, etc.
5. Click en cualquier gen de la tabla para ver el detalle de regiones

## Thresholds de clasificación (Default_status)

| Status  | Criterio                                                              |
|---------|-----------------------------------------------------------------------|
| FAIL    | ≥10 recurrent low regions **o** mean cov <20×                        |
| WARNING | ≥2 recurrent low regions **o** mean cov <50×                         |
| OK      | No cumple criterios de FAIL ni WARNING                                |

**Recurrent low coverage**: región con <20× en ≥20% de las muestras QC-pass (≥4/17).
**Filtro de tamaño**: solo se cuentan regiones con `Region_len > 4 bp` — micro-regiones de 1–4 bp son excluidas del conteo de recurrencia y del recálculo de status.

## Dataset

- **Pipeline**: DRAGEN · Illumina Exome 2.5
- **Samples QC-pass**: 17 (2 excluidos por completeness <30%)
- **Regiones evaluadas**: 290,202
- **Cobertura media**: ~110×
- **Genes/targets**: 22,233 (21,156 gene symbols)

## Requisitos

Ninguno — todo corre en el browser. Dependencias CDN:
- PapaParse 5.4.1 (parsing CSV)
- Chart.js 4.4.1 (gráficos)
- IBM Plex fonts (Google Fonts)

Para uso offline total, descargar las librerías y referenciarlas localmente.
