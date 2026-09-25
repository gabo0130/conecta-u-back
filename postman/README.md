# Colección Postman — Conecta U Backend

Prueba los endpoints del backend (Iteración 1, RF1-RF11 y RF23-RF24) individualmente, contra local o contra el ambiente deployado.

## Importar

En Postman: **Import** → arrastra los 3 archivos de esta carpeta:

- `Conecta U - Backend API.postman_collection.json`
- `Conecta U - Local.postman_environment.json`
- `Conecta U - Deployed.postman_environment.json`

Luego selecciona el ambiente que quieras probar en el selector arriba a la derecha (**Local** apunta a `http://localhost:3001/api`, **Deployed** a `https://conecta-u-back.onrender.com/api` — cámbialo en el ambiente si tu URL de Render cambia).

## Antes de empezar

Corre `npm run migration:run` y `npm run seed` en el backend. Los logins de esta colección (`colaboradorEmail`, `liderEmail`, `liderSinPerfilEmail`, `adminEmail`) son cuentas que crea el seed — sin él, todos los `Login` devuelven 401.

## Flujo de uso

1. **Catalogs > List Programs**, **List Project Types** y **List Project Categories** — guardan `programId`, `projectTypeId` y `projectCategoryId` en el ambiente vía test scripts. Corre esto primero.
2. **Auth > Login - Colaborador** (Carlos Contreras, con perfil y skills ya cargados por el seed), **Login - Líder** (Laura Méndez, LIDER con perfil técnico propio), **Login - Líder sin perfil** (Mario Quintero) o **Login - Admin** — guardan `accessToken`, `refreshToken` y `userId`. El resto de las requests usan ese token heredado (Bearer Auth a nivel de colección).
3. **Auth > Register - Colaborador / Register - Líder** crean cuentas *nuevas* (usan `newColaboradorEmail`/`newLiderEmail`, no las del seed, para no chocar con un 409 en corridas repetidas). Register - Colaborador necesita `programId` (paso 1).
4. Corre las carpetas según el rol logueado:
   - **Collaborators** necesita `COLABORADOR` o `LIDER`. `Create My Profile (LIDER)` solo aplica si estás logueado con **Login - Líder sin perfil**.
   - **Projects** necesita `LIDER`, y `programId`/`projectTypeId`/`projectCategoryId` del paso 1.
   - **Import**, **Users** y **Access > List Roles Catalog** necesitan `ADMIN`.
   - **Access > Get Menu By Role** acepta cualquier rol autenticado.
5. Los `POST` de creación (Add Skill, Create Experience, Create Project, Create User) guardan el `id` de la respuesta en `collaboratorSkillId`/`experienceId`/`projectId`/`targetUserId`, para que los `PATCH`/`DELETE` siguientes ya lo tengan listo.

## Colaborador ≠ Usuario

`Collaborator` tiene id propio y `userId` opcional — una persona puede existir sin cuenta (por ejemplo, importada desde Excel), y un `LIDER` también puede tener su propio perfil técnico. La carpeta **Import (Admin)** prueba la carga masiva; **Collaborators > Create My Profile (LIDER)** prueba el caso de un líder creando el suyo.

## Nota de seguridad (ya corregida)

`POST /auth/register` solo acepta `role: "LIDER"` o `"COLABORADOR"` — `ADMIN` no es autoasignable desde el endpoint público. Las cuentas ADMIN se crean por seed (`ADMIN_EMAIL`/`ADMIN_PASSWORD` en `.env`) o por otro ADMIN vía `Users > Create User`.

## Verificación

Los endpoints de Catalogs, Collaborators, Projects e Import se probaron uno por uno contra una instancia real de Postgres (vía Docker) al construir el modelo v2.0 — no es solo una traducción de las rutas del código, cada request se ejecutó y se confirmó su código de respuesta y forma exacta del body. La única excepción es `Import (Admin) > Import Collaborators` en Postman mismo: el flujo se probó por `curl` con un `.xlsx` generado en el momento; en Postman falta adjuntar el archivo a mano (el campo `file` queda vacío en la colección, no se puede versionar un binario en el JSON).
