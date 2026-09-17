# Prueba rápida de la API (registro, login y `/auth/me`)

Requisitos:

- Tener la aplicación corriendo (`npm run start:dev`), por defecto en `http://localhost:3001`.
- Tener PostgreSQL disponible y `DATABASE_URL` configurado en `.env`.

## Con el script de PowerShell incluido

```powershell
.\scripts\test-api.ps1 -BaseUrl 'http://localhost:3001/api' -Email 'usuario@example.com' -Password 'tu_password'
```

Este script:

- Hace `POST /auth/login` con `email` y `password`.
- Imprime el `access_token` y el `user` (incluido su `menu`) recibidos.
- Hace `GET /auth/me` con `Authorization: Bearer <token>` y muestra la respuesta.

Si el usuario todavía no existe, créalo primero con `POST /auth/register` (ver abajo) o desde `/docs`.

## Con `curl`

```bash
# Registro (RF1)
curl -s -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"fullName":"Ana Pérez","email":"ana@ufps.edu.co","password":"Secret123*","role":"COLABORADOR","program":"Ing. de Sistemas"}'

# Login (RF2)
curl -s -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"ana@ufps.edu.co","password":"Secret123*"}'

# Con el access_token de la respuesta anterior:
curl -s -X GET http://localhost:3001/api/auth/me -H "Authorization: Bearer $TOKEN"
```

## Notas

- Todas las rutas van bajo el prefijo global `/api` (definido en `src/main.ts`).
- Documentación interactiva (Swagger) disponible en `http://localhost:3001/docs`.
- Si la app corre en otro puerto/host, adapta `-BaseUrl` o la URL del `curl`.
- El filtro global de excepciones (`HttpExceptionFilter`) normaliza los errores como `{ statusCode, message }`, lo que facilita el diagnóstico.
