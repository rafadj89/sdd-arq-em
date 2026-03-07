#!/usr/bin/env python3
"""
Script de descubrimiento de APIs de la plataforma CARGAME
(https://cargame.minenergia.gov.co)

Este script:
1. Descarga el HTML principal para encontrar archivos JS/CSS
2. Analiza los bundles JS para extraer endpoints API
3. Prueba endpoints comunes de APIs REST
4. Genera un reporte con todos los hallazgos
"""

import requests
import re
import json
import os
import sys
from urllib.parse import urljoin, urlparse
from datetime import datetime

BASE_URL = "https://cargame.minenergia.gov.co"
OUTPUT_DIR = os.path.dirname(os.path.abspath(__file__))

# Headers para simular un navegador
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
    "Accept-Language": "es-CO,es;q=0.9,en;q=0.8",
    "Accept-Encoding": "gzip, deflate, br",
    "Connection": "keep-alive",
}

API_HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "application/json, text/plain, */*",
    "Accept-Language": "es-CO,es;q=0.9,en;q=0.8",
    "Origin": BASE_URL,
    "Referer": f"{BASE_URL}/",
}

session = requests.Session()
session.headers.update(HEADERS)

findings = {
    "timestamp": datetime.now().isoformat(),
    "base_url": BASE_URL,
    "js_files": [],
    "css_files": [],
    "api_endpoints_from_js": [],
    "api_endpoints_tested": [],
    "api_base_urls": [],
    "working_endpoints": [],
    "environment_configs": [],
    "raw_url_patterns": [],
}


def log(msg):
    print(f"[CARGAME-DISCOVERY] {msg}")


def save_content(filename, content):
    """Guarda contenido en el directorio de salida."""
    filepath = os.path.join(OUTPUT_DIR, filename)
    mode = "w" if isinstance(content, str) else "wb"
    with open(filepath, mode, encoding="utf-8" if mode == "w" else None) as f:
        f.write(content)
    log(f"  -> Guardado: {filename}")
    return filepath


def fetch_main_page():
    """Descarga la página principal y extrae referencias a archivos."""
    log("=" * 60)
    log("PASO 1: Descargando página principal...")
    log("=" * 60)
    
    try:
        resp = session.get(BASE_URL, timeout=30)
        resp.raise_for_status()
        html = resp.text
        save_content("pagina_principal.html", html)
        log(f"  Status: {resp.status_code}")
        log(f"  Content-Type: {resp.headers.get('Content-Type', 'N/A')}")
        log(f"  Server: {resp.headers.get('Server', 'N/A')}")
        
        # Guardar headers de respuesta
        headers_info = dict(resp.headers)
        save_content("headers_respuesta.json", json.dumps(headers_info, indent=2, ensure_ascii=False))
        
        # Extraer archivos JS
        js_pattern = r'(?:src|href)=["\']([^"\']*\.js(?:\?[^"\']*)?)["\']'
        js_files = re.findall(js_pattern, html)
        
        # También buscar en patrones de Angular/React
        js_pattern2 = r'["\']([^"\']*(?:main|vendor|polyfill|runtime|chunk|bundle|app)[^"\']*\.js(?:\?[^"\']*)?)["\']'
        js_files.extend(re.findall(js_pattern2, html))
        
        js_files = list(set(js_files))
        findings["js_files"] = js_files
        log(f"  Archivos JS encontrados: {len(js_files)}")
        for f in js_files:
            log(f"    - {f}")
        
        # Extraer archivos CSS
        css_pattern = r'href=["\']([^"\']*\.css(?:\?[^"\']*)?)["\']'
        css_files = re.findall(css_pattern, html)
        findings["css_files"] = css_files
        
        # Buscar meta tags y configuraciones inline
        meta_pattern = r'<meta[^>]*content=["\']([^"\']*api[^"\']*)["\']'
        metas = re.findall(meta_pattern, html, re.IGNORECASE)
        if metas:
            log(f"  Meta tags con 'api': {metas}")
        
        # Buscar scripts inline con configuraciones
        inline_scripts = re.findall(r'<script[^>]*>(.*?)</script>', html, re.DOTALL)
        for script in inline_scripts:
            if script.strip() and ('api' in script.lower() or 'url' in script.lower() or 'endpoint' in script.lower()):
                log(f"  Script inline con config: {script[:200]}...")
                findings["environment_configs"].append(script.strip())
        
        return html, js_files
    except Exception as e:
        log(f"  ERROR: {e}")
        return None, []


def analyze_js_bundles(js_files):
    """Descarga y analiza los bundles JavaScript para encontrar endpoints API."""
    log("\n" + "=" * 60)
    log("PASO 2: Analizando bundles JavaScript...")
    log("=" * 60)
    
    all_urls = []
    all_endpoints = []
    
    for js_file in js_files:
        # Construir URL completa
        if js_file.startswith("http"):
            url = js_file
        elif js_file.startswith("//"):
            url = "https:" + js_file
        elif js_file.startswith("/"):
            url = BASE_URL + js_file
        else:
            url = BASE_URL + "/" + js_file
        
        log(f"\n  Descargando: {url}")
        try:
            resp = session.get(url, timeout=30)
            if resp.status_code == 200:
                js_content = resp.text
                filename = os.path.basename(urlparse(js_file).path)
                save_content(f"js_{filename}", js_content)
                
                # Buscar URLs de API
                url_patterns = [
                    # URLs absolutas con /api/
                    r'["\']((https?://[^"\']*?/api[^"\']*?))["\']',
                    # URLs relativas con /api/
                    r'["\'](/api/[^"\']+)["\']',
                    # URLs con dominios de backend
                    r'["\']((https?://[^"\']*?minenergia[^"\']*?))["\']',
                    r'["\']((https?://[^"\']*?cargame[^"\']*?))["\']',
                    # Endpoints relativos comunes
                    r'["\'](/v\d+/[^"\']+)["\']',
                    r'["\'](/auth[^"\']*)["\']',
                    r'["\'](/login[^"\']*)["\']',
                    r'["\'](/users?[^"\']*)["\']',
                    r'["\'](/stations?[^"\']*)["\']',
                    r'["\'](/estacion[^"\']*)["\']',
                    r'["\'](/charger[^"\']*)["\']',
                    r'["\'](/cargador[^"\']*)["\']',
                    r'["\'](/vehicle[^"\']*)["\']',
                    r'["\'](/vehiculo[^"\']*)["\']',
                    r'["\'](/provider[^"\']*)["\']',
                    r'["\'](/proveedor[^"\']*)["\']',
                    r'["\'](/registro[^"\']*)["\']',
                    r'["\'](/consulta[^"\']*)["\']',
                    r'["\'](/report[^"\']*)["\']',
                    r'["\'](/informe[^"\']*)["\']',
                    r'["\'](/mapa[^"\']*)["\']',
                    r'["\'](/map[^"\']*)["\']',
                    r'["\'](/punto[^"\']*)["\']',
                    r'["\'](/point[^"\']*)["\']',
                ]
                
                for pattern in url_patterns:
                    matches = re.findall(pattern, js_content, re.IGNORECASE)
                    for match in matches:
                        endpoint = match[0] if isinstance(match, tuple) else match
                        if endpoint and len(endpoint) > 3 and not endpoint.endswith('.js') and not endpoint.endswith('.css') and not endpoint.endswith('.html') and not endpoint.endswith('.png') and not endpoint.endswith('.svg') and not endpoint.endswith('.ico'):
                            all_urls.append(endpoint)
                
                # Buscar configuraciones de entorno (environment)
                env_patterns = [
                    r'environment\s*[:=]\s*\{([^}]+)\}',
                    r'apiUrl\s*[:=]\s*["\']([^"\']+)["\']',
                    r'apiBase\s*[:=]\s*["\']([^"\']+)["\']',
                    r'baseUrl\s*[:=]\s*["\']([^"\']+)["\']',
                    r'API_URL\s*[:=]\s*["\']([^"\']+)["\']',
                    r'API_BASE\s*[:=]\s*["\']([^"\']+)["\']',
                    r'BASE_URL\s*[:=]\s*["\']([^"\']+)["\']',
                    r'SERVER_URL\s*[:=]\s*["\']([^"\']+)["\']',
                    r'backendUrl\s*[:=]\s*["\']([^"\']+)["\']',
                    r'serverUrl\s*[:=]\s*["\']([^"\']+)["\']',
                    r'host\s*[:=]\s*["\']([^"\']+)["\']',
                    r'endpoint\s*[:=]\s*["\']([^"\']+)["\']',
                ]
                
                for pattern in env_patterns:
                    matches = re.findall(pattern, js_content, re.IGNORECASE)
                    for match in matches:
                        if match and ('http' in match or '/' in match):
                            findings["environment_configs"].append(match)
                            log(f"    Config encontrada: {match[:100]}")
                
                # Buscar métodos HTTP (GET, POST, PUT, DELETE, PATCH)
                http_methods = re.findall(
                    r'(?:\.(?:get|post|put|delete|patch))\s*\(\s*[`"\']([^`"\']+)[`"\']',
                    js_content, re.IGNORECASE
                )
                for method_url in http_methods:
                    all_endpoints.append(method_url)
                
                # Buscar llamadas fetch
                fetch_calls = re.findall(
                    r'fetch\s*\(\s*[`"\']([^`"\']+)[`"\']',
                    js_content, re.IGNORECASE
                )
                all_endpoints.extend(fetch_calls)
                
                # Buscar llamadas HttpClient de Angular
                http_client = re.findall(
                    r'this\.http\.\w+\s*[<(]\s*[`"\']?([^`"\')\s,]+)',
                    js_content, re.IGNORECASE
                )
                all_endpoints.extend(http_client)
                
                # Buscar concatenaciones de URL con variables
                url_concat = re.findall(
                    r'["\']([^"\']*?/(?:api|v\d|auth|station|estacion|charger|provider|proveedor|user|registro|consulta|report|map|punto|point|connector|conector)[^"\']*?)["\']',
                    js_content, re.IGNORECASE
                )
                all_endpoints.extend(url_concat)
                
                log(f"    URLs/endpoints encontrados en este archivo: {len(set(all_urls)) + len(set(all_endpoints))}")
                
            else:
                log(f"    Status: {resp.status_code}")
        except Exception as e:
            log(f"    ERROR: {e}")
    
    # Deduplicar y limpiar
    all_urls = list(set(all_urls))
    all_endpoints = list(set(all_endpoints))
    
    # Filtrar ruido
    filtered_urls = []
    for u in all_urls:
        # Excluir assets, fonts, etc.
        if not any(ext in u.lower() for ext in ['.woff', '.ttf', '.eot', '.map', '.jpg', '.jpeg', '.gif', '.png', '.svg', '.ico', '.css', '.js', 'font', 'googleapis', 'gstatic', 'cloudflare', 'cdnjs', 'jsdelivr', 'unpkg']):
            filtered_urls.append(u)
    
    filtered_endpoints = []
    for e in all_endpoints:
        if not any(ext in e.lower() for ext in ['.woff', '.ttf', '.eot', '.map', '.jpg', '.jpeg', '.gif', '.png', '.svg', '.ico', '.css', '.js', 'font', 'node_modules', 'assets/']):
            if len(e) > 1 and len(e) < 200:
                filtered_endpoints.append(e)
    
    findings["raw_url_patterns"] = filtered_urls
    findings["api_endpoints_from_js"] = filtered_endpoints
    
    log(f"\n  Total URLs de API encontradas: {len(filtered_urls)}")
    for u in sorted(filtered_urls):
        log(f"    - {u}")
    
    log(f"\n  Total endpoints de JS: {len(filtered_endpoints)}")
    for e in sorted(filtered_endpoints):
        log(f"    - {e}")
    
    return filtered_urls, filtered_endpoints


def probe_common_endpoints():
    """Prueba endpoints API comunes."""
    log("\n" + "=" * 60)
    log("PASO 3: Probando endpoints API comunes...")
    log("=" * 60)
    
    # Endpoints comunes a probar
    common_paths = [
        # Raíz API
        "/api",
        "/api/",
        "/api/v1",
        "/api/v1/",
        "/api/v2",
        "/api/v2/",
        "/v1",
        "/v1/",
        "/v2",
        # Swagger/OpenAPI
        "/swagger",
        "/swagger/",
        "/swagger-ui",
        "/swagger-ui/",
        "/swagger-ui.html",
        "/swagger.json",
        "/swagger.yaml",
        "/api-docs",
        "/api-docs/",
        "/api/docs",
        "/api/swagger.json",
        "/api/openapi.json",
        "/openapi.json",
        "/openapi.yaml",
        "/docs",
        "/redoc",
        # Estaciones / Mapa
        "/api/stations",
        "/api/station",
        "/api/estaciones",
        "/api/estacion",
        "/api/v1/stations",
        "/api/v1/estaciones",
        "/api/chargers",
        "/api/cargadores",
        "/api/v1/chargers",
        "/api/v1/cargadores",
        "/api/charging-stations",
        "/api/puntos-carga",
        "/api/points",
        "/api/v1/points",
        "/api/map",
        "/api/mapa",
        "/api/markers",
        "/api/locations",
        "/api/ubicaciones",
        # Proveedores
        "/api/providers",
        "/api/proveedores",
        "/api/v1/providers",
        "/api/v1/proveedores",
        "/api/operators",
        "/api/operadores",
        # Conectores / Tipos
        "/api/connectors",
        "/api/conectores",
        "/api/connector-types",
        "/api/tipos-conector",
        # Auth
        "/api/auth",
        "/api/auth/login",
        "/api/login",
        "/api/token",
        "/oauth/token",
        "/auth/login",
        # Usuarios
        "/api/users",
        "/api/usuarios",
        "/api/user",
        # Vehículos
        "/api/vehicles",
        "/api/vehiculos",
        "/api/v1/vehicles",
        # Reportes
        "/api/reports",
        "/api/informes",
        "/api/statistics",
        "/api/estadisticas",
        # Health / Info
        "/health",
        "/healthcheck",
        "/api/health",
        "/actuator",
        "/actuator/health",
        "/actuator/info",
        "/info",
        "/status",
        "/api/status",
        "/api/info",
        "/api/version",
        # GraphQL
        "/graphql",
        "/api/graphql",
        # Otros
        "/api/config",
        "/api/configuration",
        "/api/departamentos",
        "/api/municipios",
        "/api/ciudades",
        "/api/regiones",
        # Endpoints específicos OCPI (protocolo de carga)
        "/ocpi",
        "/ocpi/versions",
        "/ocpi/2.2",
        "/ocpi/2.2/locations",
        "/ocpi/2.1.1",
        "/ocpi/2.1.1/locations",
        # Endpoints posibles del backend
        "/cargame/api",
        "/cargame/api/v1",
        "/backend/api",
        "/services/api",
        "/ws",
        "/websocket",
        "/socket.io",
    ]
    
    results = []
    
    for path in common_paths:
        url = BASE_URL + path
        try:
            resp = session.get(url, timeout=10, headers=API_HEADERS, allow_redirects=False)
            status = resp.status_code
            content_type = resp.headers.get("Content-Type", "N/A")
            content_length = len(resp.content)
            
            result = {
                "path": path,
                "url": url,
                "status": status,
                "content_type": content_type,
                "content_length": content_length,
            }
            
            # Si no es 404/403/500, es interesante
            if status not in [404, 403, 405, 500, 502, 503]:
                result["interesting"] = True
                result["preview"] = resp.text[:500] if resp.text else ""
                log(f"  ✅ {status} {path} ({content_type}, {content_length} bytes)")
                
                # Si parece JSON, guardarlo
                if 'json' in content_type.lower() or resp.text.strip().startswith('{') or resp.text.strip().startswith('['):
                    try:
                        json_data = resp.json()
                        result["json_response"] = json_data
                        safe_name = path.replace("/", "_").strip("_") or "root"
                        save_content(f"response_{safe_name}.json", json.dumps(json_data, indent=2, ensure_ascii=False))
                    except:
                        pass
            else:
                result["interesting"] = False
                if status not in [404]:
                    log(f"  ❌ {status} {path}")
            
            results.append(result)
            
        except requests.exceptions.Timeout:
            log(f"  ⏱️ TIMEOUT {path}")
            results.append({"path": path, "url": url, "status": "TIMEOUT", "interesting": False})
        except Exception as e:
            log(f"  💥 ERROR {path}: {str(e)[:50]}")
            results.append({"path": path, "url": url, "status": "ERROR", "error": str(e), "interesting": False})
    
    findings["api_endpoints_tested"] = results
    working = [r for r in results if r.get("interesting")]
    findings["working_endpoints"] = working
    
    log(f"\n  Endpoints activos encontrados: {len(working)}")
    return working


def probe_discovered_endpoints(urls, endpoints):
    """Prueba los endpoints descubiertos en los JS."""
    log("\n" + "=" * 60)
    log("PASO 4: Probando endpoints descubiertos en JavaScript...")
    log("=" * 60)
    
    tested = []
    
    all_to_test = set()
    
    for u in urls:
        if u.startswith("http"):
            all_to_test.add(u)
        elif u.startswith("/"):
            all_to_test.add(BASE_URL + u)
    
    for e in endpoints:
        if e.startswith("http"):
            all_to_test.add(e)
        elif e.startswith("/"):
            all_to_test.add(BASE_URL + e)
    
    for url in sorted(all_to_test):
        try:
            resp = session.get(url, timeout=10, headers=API_HEADERS, allow_redirects=True)
            status = resp.status_code
            content_type = resp.headers.get("Content-Type", "N/A")
            
            result = {
                "url": url,
                "status": status,
                "content_type": content_type,
                "content_length": len(resp.content),
            }
            
            if status not in [404, 403, 405, 500, 502, 503]:
                result["interesting"] = True
                result["preview"] = resp.text[:1000] if resp.text else ""
                log(f"  ✅ {status} {url} ({content_type})")
                
                if 'json' in content_type.lower() or (resp.text and (resp.text.strip().startswith('{') or resp.text.strip().startswith('['))):
                    try:
                        json_data = resp.json()
                        result["json_response"] = json_data
                        safe_name = urlparse(url).path.replace("/", "_").strip("_")[:50] or "discovered"
                        save_content(f"discovered_{safe_name}.json", json.dumps(json_data, indent=2, ensure_ascii=False))
                    except:
                        pass
            else:
                result["interesting"] = False
            
            tested.append(result)
            
        except Exception as e:
            log(f"  💥 ERROR {url}: {str(e)[:50]}")
    
    return tested


def try_alternative_domains():
    """Prueba dominios alternativos que podrían alojar la API."""
    log("\n" + "=" * 60)
    log("PASO 5: Probando dominios/subdominios alternativos...")
    log("=" * 60)
    
    alternative_domains = [
        "https://api.cargame.minenergia.gov.co",
        "https://backend.cargame.minenergia.gov.co",
        "https://services.cargame.minenergia.gov.co",
        "https://ws.cargame.minenergia.gov.co",
        "https://data.cargame.minenergia.gov.co",
        "https://cargame-api.minenergia.gov.co",
        "https://cargame-backend.minenergia.gov.co",
    ]
    
    results = []
    for domain in alternative_domains:
        try:
            resp = session.get(domain, timeout=10, allow_redirects=True)
            log(f"  ✅ {resp.status_code} {domain} -> {resp.url}")
            results.append({
                "domain": domain,
                "status": resp.status_code,
                "final_url": resp.url,
                "content_type": resp.headers.get("Content-Type", "N/A"),
                "preview": resp.text[:300] if resp.text else ""
            })
        except requests.exceptions.ConnectionError:
            log(f"  ❌ No resuelve: {domain}")
        except Exception as e:
            log(f"  ❌ Error: {domain} - {str(e)[:50]}")
    
    return results


def generate_report():
    """Genera un informe detallado en formato Markdown."""
    log("\n" + "=" * 60)
    log("PASO 6: Generando informe...")
    log("=" * 60)
    
    report = f"""# Informe de Descubrimiento de APIs - Plataforma CARGAME
## Ministerio de Energía de Colombia

**Fecha:** {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}  
**URL Base:** {BASE_URL}  
**Objetivo:** Identificar APIs disponibles para consulta de proveedores de estaciones de carga eléctrica

---

## 1. Resumen Ejecutivo

Se realizó un análisis de descubrimiento de APIs sobre la plataforma CARGAME del Ministerio de Energía 
de Colombia, accesible en `{BASE_URL}`. El objetivo es identificar endpoints que permitan consultar 
si terceros están registrados como proveedores de estaciones de energía (carga eléctrica).

### Hallazgos Principales

- **Archivos JavaScript analizados:** {len(findings['js_files'])}
- **URLs/endpoints extraídos del código fuente:** {len(findings['api_endpoints_from_js']) + len(findings['raw_url_patterns'])}
- **Endpoints probados:** {len(findings['api_endpoints_tested'])}
- **Endpoints activos encontrados:** {len(findings['working_endpoints'])}
- **Configuraciones de entorno encontradas:** {len(findings['environment_configs'])}

---

## 2. Archivos JavaScript del Frontend

Los siguientes archivos JavaScript fueron identificados en la página principal:

| # | Archivo |
|---|---------|
"""
    
    for i, js in enumerate(findings['js_files'], 1):
        report += f"| {i} | `{js}` |\n"
    
    report += f"""
---

## 3. URLs y Endpoints Descubiertos en el Código Fuente

### 3.1 URLs completas encontradas en JS

"""
    if findings['raw_url_patterns']:
        for url in sorted(findings['raw_url_patterns']):
            report += f"- `{url}`\n"
    else:
        report += "_No se encontraron URLs completas de API en los bundles JS._\n"
    
    report += f"""
### 3.2 Endpoints/rutas encontrados en JS

"""
    if findings['api_endpoints_from_js']:
        for ep in sorted(findings['api_endpoints_from_js']):
            report += f"- `{ep}`\n"
    else:
        report += "_No se encontraron endpoints específicos en los bundles JS._\n"
    
    report += f"""
---

## 4. Configuraciones de Entorno Detectadas

"""
    if findings['environment_configs']:
        for config in findings['environment_configs']:
            report += f"```\n{config[:500]}\n```\n\n"
    else:
        report += "_No se detectaron configuraciones de entorno en los bundles._\n"
    
    report += f"""
---

## 5. Endpoints Activos (Responden con datos)

"""
    if findings['working_endpoints']:
        report += "| # | Endpoint | Status | Content-Type | Tamaño |\n"
        report += "|---|----------|--------|--------------|--------|\n"
        for i, ep in enumerate(findings['working_endpoints'], 1):
            report += f"| {i} | `{ep['path']}` | {ep['status']} | {ep.get('content_type', 'N/A')} | {ep.get('content_length', 0)} bytes |\n"
        
        report += "\n### Detalle de Respuestas\n\n"
        for ep in findings['working_endpoints']:
            if ep.get('json_response'):
                report += f"#### `{ep['path']}`\n```json\n{json.dumps(ep['json_response'], indent=2, ensure_ascii=False)[:2000]}\n```\n\n"
            elif ep.get('preview'):
                report += f"#### `{ep['path']}`\n```\n{ep['preview'][:500]}\n```\n\n"
    else:
        report += "_No se encontraron endpoints activos con los patrones probados._\n"
    
    report += f"""
---

## 6. Análisis Completo de Endpoints Probados

Se probaron {len(findings['api_endpoints_tested'])} endpoints. A continuación el resumen por código de respuesta:

"""
    # Agrupar por status
    status_groups = {}
    for ep in findings['api_endpoints_tested']:
        s = str(ep.get('status', 'ERROR'))
        if s not in status_groups:
            status_groups[s] = []
        status_groups[s].append(ep['path'])
    
    for status, paths in sorted(status_groups.items()):
        report += f"### Status {status} ({len(paths)} endpoints)\n"
        for p in paths:
            report += f"- `{p}`\n"
        report += "\n"
    
    report += f"""
---

## 7. Recomendaciones para Solicitud de APIs

Basado en el análisis realizado, se recomienda solicitar al dueño de la plataforma CARGAME los siguientes 
tipos de API:

### 7.1 APIs Prioritarias para Validación de Proveedores

1. **API de Consulta de Proveedores/Operadores Registrados**
   - Endpoint sugerido: `GET /api/v1/providers` o `GET /api/v1/proveedores`
   - Parámetros: NIT, razón social, tipo de proveedor
   - Respuesta esperada: información de registro, estado, estaciones asociadas

2. **API de Estaciones de Carga por Proveedor**
   - Endpoint sugerido: `GET /api/v1/stations?provider_id={{id}}`
   - Para validar qué estaciones tiene registradas un proveedor específico

3. **API de Verificación de Registro**
   - Endpoint sugerido: `GET /api/v1/providers/verify?nit={{nit}}`
   - Para verificar si un NIT específico está registrado como proveedor

### 7.2 APIs Complementarias

4. **API de Catálogo de Estaciones**
   - `GET /api/v1/stations` - Listado completo de estaciones registradas
   - Con filtros por departamento, municipio, tipo de conector

5. **API de Tipos de Conectores**
   - `GET /api/v1/connector-types` - Catálogo de tipos de conectores soportados

6. **API de Estadísticas**
   - `GET /api/v1/statistics` - Datos agregados de la red de carga

### 7.3 Protocolos Estándar

Considerar solicitar implementación de:
- **OCPI (Open Charge Point Interface)** - Protocolo estándar para intercambio de datos entre operadores
- **OCPP (Open Charge Point Protocol)** - Para comunicación con puntos de carga
- **OICP (Open InterCharge Protocol)** - Para roaming entre redes de carga

---

## 8. Carta Modelo para Solicitud de APIs

### Asunto: Solicitud de Acceso a APIs de la Plataforma CARGAME

Estimados señores del Ministerio de Energía / Administradores de CARGAME,

Por medio de la presente, la UPME (Unidad de Planeación Minero-Energética) solicita formalmente 
acceso a las APIs de la plataforma CARGAME para los siguientes fines:

1. **Validación de registro de proveedores:** Necesitamos verificar si terceros están registrados 
   como proveedores de estaciones de energía/carga eléctrica en la plataforma.

2. **Consulta de estaciones:** Requerimos acceder a la información pública de estaciones de carga 
   registradas para fines de planeación energética.

3. **Integración de datos:** Para alimentar nuestros sistemas de seguimiento y análisis de la 
   infraestructura de electromovilidad en Colombia.

**Datos técnicos requeridos:**
- Documentación de API (preferiblemente OpenAPI/Swagger)
- Credenciales de acceso (API Key o OAuth2)
- Ambiente de pruebas (sandbox)
- Límites de rate limiting y cuotas
- SLA de disponibilidad

Quedamos atentos a su respuesta.

---

## 9. Archivos Generados

Los siguientes archivos fueron generados durante el análisis:

"""
    
    files_in_dir = os.listdir(OUTPUT_DIR)
    for f in sorted(files_in_dir):
        filepath = os.path.join(OUTPUT_DIR, f)
        size = os.path.getsize(filepath)
        report += f"- `{f}` ({size:,} bytes)\n"
    
    report += f"""
---

*Informe generado automáticamente por el script de descubrimiento de APIs CARGAME*  
*Fecha: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}*
"""
    
    save_content("INFORME_APIs_CARGAME.md", report)
    log(f"  Informe guardado: INFORME_APIs_CARGAME.md")
    
    # También guardar todos los hallazgos en JSON
    # Limpiar datos no serializables
    clean_findings = json.loads(json.dumps(findings, default=str, ensure_ascii=False))
    save_content("hallazgos_completos.json", json.dumps(clean_findings, indent=2, ensure_ascii=False))
    log(f"  Hallazgos guardados: hallazgos_completos.json")


def main():
    log("=" * 60)
    log("DESCUBRIMIENTO DE APIs - PLATAFORMA CARGAME")
    log(f"URL: {BASE_URL}")
    log(f"Fecha: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    log("=" * 60)
    
    # Paso 1: Descargar página principal
    html, js_files = fetch_main_page()
    
    if not html:
        log("No se pudo acceder a la página principal. Abortando.")
        sys.exit(1)
    
    # Paso 2: Analizar bundles JS
    urls, endpoints = analyze_js_bundles(js_files)
    
    # Paso 3: Probar endpoints comunes
    working = probe_common_endpoints()
    
    # Paso 4: Probar endpoints descubiertos
    if urls or endpoints:
        discovered_results = probe_discovered_endpoints(urls, endpoints)
        findings["discovered_results"] = discovered_results
    
    # Paso 5: Probar dominios alternativos
    alt_results = try_alternative_domains()
    findings["alternative_domains"] = alt_results
    
    # Paso 6: Generar informe
    generate_report()
    
    log("\n" + "=" * 60)
    log("DESCUBRIMIENTO COMPLETADO")
    log(f"Resultados guardados en: {OUTPUT_DIR}")
    log("=" * 60)


if __name__ == "__main__":
    main()
