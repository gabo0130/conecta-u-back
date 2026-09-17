# Colección Postman — Conecta U Backend

Prueba los 30 endpoints del backend (Iteración 1, RF1-RF9) individualmente, contra local o contra el ambiente deployado.

## Importar

En Postman: **Import** → arrastra los 3 archivos de esta carpeta:

- `Conecta U - Backend API.postman_collection.json`
- `Conecta U - Local.postman_environment.json`
- `Conecta U - Deployed.postman_environment.json`

Luego selecciona el ambiente que quieras probar en el selector arriba a la derecha (**Local** apunta a `http://localhost:3001/api`, **Deployed** a `https://conecta-u-back.onrender.com/api` — cámbialo en el ambiente si tu URL de Render cambia).

## Flujo de uso

1. **Auth > Register - Colaborador** y **Register - Líder** (una sola vez; si el email ya existe, da 409 y puedes seguir directo a Login).
2. **Auth > Login - Colaborador** (o **Login - Líder**, o **Login - Admin**) — guarda automáticamente `accessToken`, `refreshToken` y `userId` en el ambiente activo vía un test script. El resto de las requests usan ese token heredado (Bearer Auth a nivel de colección).
3. Corre las carpetas según el rol logueado:
   - **Profiles** necesita estar logueado como `COLABORADOR`.
   - **Projects** necesita `LIDER`.
   - **Users** y **Access > List Roles Catalog** necesitan `ADMIN`.
   - **Access > Get Menu By Role** acepta cualquier rol autenticado.
4. Los `POST` de creación (Create Skill, Create Experience, Create Project, Create User) guardan el `id` de la respuesta en `skillId`/`experienceId`/`projectId`/`targetUserId`, para que los `PATCH`/`DELETE` siguientes ya lo tengan listo.

## Nota de seguridad

`POST /auth/register` acepta `role: "ADMIN"` sin ninguna restricción — está incluido en la colección (**Register - Admin**) porque así puedes tener una cuenta admin para probar, pero es un hueco real: antes de que este backend salga de un contexto de pruebas, `ADMIN` no debería poder autoasignarse desde un endpoint público.

## Verificación

Los 30 endpoints de esta colección se probaron uno por uno contra una instancia real de Postgres (vía Docker) antes de entregarla — no es solo una traducción de las rutas del código, cada request se ejecutó y se confirmó su código de respuesta y forma exacta del body.
