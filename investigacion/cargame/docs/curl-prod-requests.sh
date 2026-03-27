#!/bin/bash
# ============================================================================
# CargaME API — Requests de Produccion
# Base URL: https://siveeic.minenergia.gov.co:3011/crg
# Fecha: 2026-03-26
# ============================================================================

BASE="https://siveeic.minenergia.gov.co:3011/crg"
ORIGIN="https://cargame.minenergia.gov.co"
TOKEN="eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpZCI6MCwidXN1YXJpbyI6InBvd2VyYmkiLCJyb2xlIjoiaW50ZWxsaWdlbmNlIiwiaWF0IjoxNTk0ODQ5NjMxfQ.UY3BLtqi5zdxpRFaT9XIsYvQIV4gPPXN6iO39AlymMY"

# Headers comunes para requests autenticados
AUTH_HEADERS=(
  -H "Accept: application/json, text/plain, */*"
  -H "Content-Type: application/json"
  -H "authorization: $TOKEN"
  -H "Origin: $ORIGIN"
  -H "Referer: $ORIGIN/"
)

# Headers para requests publicos (sin auth)
PUB_HEADERS=(
  -H "Accept: application/json"
  -H "Origin: $ORIGIN"
  -H "Referer: $ORIGIN/"
)

echo "============================================"
echo " CargaME API — Pruebas de Produccion"
echo " Base: $BASE"
echo "============================================"
echo ""

# ============================================================================
# SECCION 0: HEALTH CHECK (endpoints publicos, sin auth)
# ============================================================================
echo "=== 0. HEALTH CHECK (publicos, sin auth) ==="
echo ""

echo "--- 0.1 Departamentos (todos) ---"
curl -s -w "\nHTTP Status: %{http_code}\n" \
  "${PUB_HEADERS[@]}" \
  "$BASE/departamento/0" | head -200
echo ""

echo "--- 0.2 Municipios de Bogota D.C. (depto=11) ---"
curl -s -w "\nHTTP Status: %{http_code}\n" \
  "${PUB_HEADERS[@]}" \
  "$BASE/municipio/0/11" | head -200
echo ""

echo "--- 0.3 Tipos de ubicacion ---"
curl -s -w "\nHTTP Status: %{http_code}\n" \
  "${PUB_HEADERS[@]}" \
  "$BASE/tipoubicacion/0" | head -200
echo ""

echo "--- 0.4 Tipos de estacion ---"
curl -s -w "\nHTTP Status: %{http_code}\n" \
  "${PUB_HEADERS[@]}" \
  "$BASE/tipoestacion/0" | head -200
echo ""

echo "--- 0.5 Modelos de tarifa ---"
curl -s -w "\nHTTP Status: %{http_code}\n" \
  "${PUB_HEADERS[@]}" \
  "$BASE/modelotarifa/0" | head -200
echo ""

echo "--- 0.6 Tipos de estandar (conectores) ---"
curl -s -w "\nHTTP Status: %{http_code}\n" \
  "${PUB_HEADERS[@]}" \
  "$BASE/tipoestandar/0/0" | head -200
echo ""

echo "--- 0.7 Tipos de persona ---"
curl -s -w "\nHTTP Status: %{http_code}\n" \
  "${PUB_HEADERS[@]}" \
  "$BASE/tipopersona/0" | head -200
echo ""

echo "--- 0.8 Tipos de identificacion ---"
curl -s -w "\nHTTP Status: %{http_code}\n" \
  "${PUB_HEADERS[@]}" \
  "$BASE/tipo_identificacion/0" | head -200
echo ""

# ============================================================================
# SECCION 1: ESTACIONES DE CARGA (con auth — Prioridad 1)
# ============================================================================
echo ""
echo "=== 1. ESTACIONES DE CARGA (con auth) ==="
echo ""

echo "--- 1.1 Resumen TODAS las estaciones ---"
curl -s -w "\nHTTP Status: %{http_code}\n" \
  "${AUTH_HEADERS[@]}" \
  "$BASE/resumenestacionescarga/0/0/0/0/" | head -500
echo ""

echo "--- 1.2 Resumen estaciones BOGOTA (mpio=11001) ---"
curl -s -w "\nHTTP Status: %{http_code}\n" \
  "${AUTH_HEADERS[@]}" \
  "$BASE/resumenestacionescarga/0/0/0/11001/" | head -500
echo ""

echo "--- 1.3 Resumen estaciones MEDELLIN (mpio=5001) ---"
curl -s -w "\nHTTP Status: %{http_code}\n" \
  "${AUTH_HEADERS[@]}" \
  "$BASE/resumenestacionescarga/0/0/0/5001/" | head -500
echo ""

echo "--- 1.4 Detalle TODAS las estaciones ---"
curl -s -w "\nHTTP Status: %{http_code}\n" \
  "${AUTH_HEADERS[@]}" \
  "$BASE/estacioncarga/0/0/0/0" | head -500
echo ""

echo "--- 1.5 Estacion por ID=1 ---"
curl -s -w "\nHTTP Status: %{http_code}\n" \
  "${AUTH_HEADERS[@]}" \
  "$BASE/estacioncarga/1/0/0/0" | head -500
echo ""

echo "--- 1.6 Puntos de carga (estacion=1) ---"
curl -s -w "\nHTTP Status: %{http_code}\n" \
  "${AUTH_HEADERS[@]}" \
  "$BASE/puntocarga/0/1" | head -500
echo ""

echo "--- 1.7 Conectores (punto=1, estacion=1) ---"
curl -s -w "\nHTTP Status: %{http_code}\n" \
  "${AUTH_HEADERS[@]}" \
  "$BASE/conectorcarga/0/1/1" | head -500
echo ""

# ============================================================================
# SECCION 2: OPERADORES / CPOs (con auth — Prioridad 2)
# ============================================================================
echo ""
echo "=== 2. OPERADORES (con auth) ==="
echo ""

echo "--- 2.1 TODOS los operadores ---"
curl -s -w "\nHTTP Status: %{http_code}\n" \
  "${AUTH_HEADERS[@]}" \
  "$BASE/operador/0" | head -500
echo ""

echo "--- 2.2 Operador ID=1 ---"
curl -s -w "\nHTTP Status: %{http_code}\n" \
  "${AUTH_HEADERS[@]}" \
  "$BASE/operador/1" | head -500
echo ""

echo "--- 2.3 Tipos de operador ---"
curl -s -w "\nHTTP Status: %{http_code}\n" \
  "${AUTH_HEADERS[@]}" \
  "$BASE/tipo_operador/0" | head -500
echo ""

echo "--- 2.4 Estaciones del operador 1 ---"
curl -s -w "\nHTTP Status: %{http_code}\n" \
  "${AUTH_HEADERS[@]}" \
  "$BASE/estacionoperador/0/1/0/0" | head -500
echo ""

echo ""
echo "============================================"
echo " Pruebas completadas"
echo "============================================"
