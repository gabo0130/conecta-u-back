# DevOps — Conecta U (ambientes, flujo de ramas, despliegue y evaluación)

_Responsable: sesión DevOps de Claude Code. Creado el 20/10/2026. Todo en capa gratuita (Vercel Hobby, Render Free, Neon Free, GitHub público)._
_Copia idéntica en `conecta-u-back/notes/devops.md`._

---

## 1. Ambientes

| | Local | Staging | Producción |
|---|---|---|---|
| Rama de git | la tuya (`feature/*`…) | `develop` | `master` |
| Base (Neon, proyecto `database-conecta`) | rama `dev` (`ep-curly-voice`) | rama `staging` (`ep-green-tooth`) | rama `main` (`ep-shy-mode`) |
| Backend (Render) | `npm run start:dev` | `conecta-u-back-staging` → https://conecta-u-back-staging.onrender.com | `conecta-u-back` → https://conecta-u-back.onrender.com |
| Frontend (Vercel) | `npm run dev` | preview de `develop` → https://conecta-u-git-develop-jhonys-projects.vercel.app | https://conecta-u-zeta.vercel.app |
| IA | la que pongas en tu `.env` | `AI_PROVIDER=fake` | Gemini |
| Despliegue | — | automático al fusionar en `develop` | automático al fusionar en `master` |

- Staging y dev son **copias de producción** del 20/10. Para refrescarlas: Neon → rama → *Reset from parent* (borra lo que tengan).
- Staging migra la base sola en cada deploy (`npm ci && npm run build && npm run migration:run`, arranque `npm run start:prod`). **Producción todavía no** (ver hallazgo P2).
- El preview de Vercel pide iniciar sesión en Vercel (protección de despliegues). La URL de producción `conecta-u-zeta.vercel.app` es pública.

## 2. Flujo de ramas (Git Flow simplificado)

```
feature/xxx ─┐            hotfix/xxx ─┐
fix/xxx     ─┼─► PR ─► develop ──► PR ─► master
chore/xxx   ─┘   (staging)        (producción)  ◄─┘ y luego master ─► develop
```

1. Toda rama nueva sale de `develop` (`feature/`, `fix/`, `chore/`). Los arreglos urgentes de producción salen de `master` como `hotfix/`.
2. Se abre un PR hacia `develop`. El CI corre solo; cuando está en verde, **tú** lo fusionas (squash o merge).
3. Para publicar: PR `develop → master` (merge commit) — eso es una *release*. Después del hotfix, PR `master → develop` para no perder el arreglo.
4. Las ramas se borran solas al fusionar. `master` y `develop` no se pueden borrar.

## 3. Reglas aplicadas en GitHub (los dos repos)

Ruleset **«Proteger master y develop»**:
- No se pueden borrar ni reescribir (sin `push --force`).
- Nada entra sin PR; el PR necesita 1 aprobación, conversaciones resueltas y el CI en verde (`lint-test-build` en el front; `lint-test-build` y `e2e` en el back).
- Métodos permitidos: merge y squash (rebase desactivado).
- **Excepción:** el rol *admin* (tú) puede fusionar un PR sin la aprobación. GitHub no deja aprobar tu propio PR, así que sin esta excepción nada se podría fusionar mientras seas el único integrante. Si entra otra persona al equipo, su aprobación sí cuenta.

Además: secret scanning + bloqueo de push con secretos, alertas de vulnerabilidades (pestaña *Security*, sin PRs), plantilla de PR y `CODEOWNERS`.

**Rama por defecto = `develop`** (desde el 21/10). Así los PRs nuevos apuntan a `develop` y no directo a producción. Vercel y Render siguen publicando producción desde `master` (se configura aparte en cada servicio).

**Dependabot desactivado** (21/10, a pedido del usuario): sin PRs automáticos de versiones ni de seguridad. Las dependencias se revisan a mano con `npm audit --omit=dev` antes de cada publicación y se actualizan en una rama `fix/deps-…`.

**Candado para Claude:** en `~/.claude/settings.json` hay reglas `deny` que impiden a cualquier sesión de Claude ejecutar `gh pr merge`, `git push` a `master`/`develop`, `push --force` y borrar ramas remotas. Claude abre PRs; **solo tú fusionas**.

## 4. Runbooks

**Publicar a producción**
1. Confirmar que staging funciona con lo que hay en `develop`.
2. Si hay migraciones: crear una instantánea en Neon (`main` → *Create snapshot*) antes de fusionar.
3. PR `develop → master`, CI en verde, fusionar.
4. Render y Vercel despliegan solos. Revisar `/api/health` y el login.
5. Etiquetar la entrega en los dos repos: `git tag -a vX.Y-<nombre> origin/master -m "…"` y `git push origin vX.Y-<nombre>`.

Tras cada publicación GitHub muestra «master had recent pushes · Compare & pull request»: es normal (el commit de merge solo vive en `master`, el contenido es idéntico a `develop`). No abrir ese PR.

**Publicaciones:** `v2.0-iteracion-2` (21/10/2026) — front `837c1b7`, back `b5fa5e6`; respaldo previo en Neon: rama `backup-pre-iter2-2026-10-21`.

**Revertir**
- Front: Vercel → Deployments → último bueno → *Promote to Production* (instantáneo).
- Back: Render → Deploys → último bueno → *Rollback*. Ojo: no revierte migraciones; para eso, restaurar la instantánea de Neon.

**Variables nuevas**
Agregarlas en Render (los dos servicios) y en Vercel (Production + Preview de `develop`), y en `.env.example`. Nunca en el código.

## 5. Límites de la capa gratuita

| Servicio | Límite | Qué implica |
|---|---|---|
| Render Free | Se duerme a los 15 min sin uso; 750 h/mes **por workspace** | Primera petición tarda 1–2 min (medido: > 2 min en producción el 20/10). Mantener producción despierta 24/7 consume ~744 h y deja a staging sin horas. Sin pre-deploy ni shell. |
| Neon Free | 0,5 GB por proyecto, ~100 h de cómputo/mes compartidas entre ramas, máx. 10 ramas, historial de 6 h | Hoy 10 MB. Restaurar a un punto anterior solo sirve dentro de las últimas 6 h: usar instantáneas antes de migrar. |
| Vercel Hobby | Solo Production y Preview (sin ambientes con nombre); uso no comercial | Staging = preview de `develop` con variables por rama. |
| GitHub Actions | Ilimitado en repos públicos | — |
| Gemini | Cuota diaria por clave | Staging usa `fake` para no gastarla. |

## 6. Evaluación (20/10/2026)

🔴 crítico · 🟠 alto · 🟡 medio. «Dueño» = quién debe hacerlo.

| # | Hallazgo | Riesgo | Acción | Dueño |
|---|---|---|---|---|
| P1 🔴 | Front en producción con **Next.js con vulnerabilidad crítica** y axios/postcss/sharp altas (`npm audit --omit=dev`: 1 crítica, 6 altas). Arreglo sin cambio mayor: `next@16.4.2` y `axios` al día. | Ataque directo a la app pública | Actualizar en una rama `fix/deps-seguridad` → staging → producción. Revisar con `npm audit --omit=dev`. | Front |
| P2 🔴 | Producción en Render **no corre migraciones** y arranca con `nest start` (compila al arrancar: más lento y más memoria). | Desplegar código que espera columnas que no existen → 500 | Cambiar build/start de producción igual que staging. Lo hago con tu OK. | DevOps |
| P3 🔴 | Hasta hoy el backend **local escribía en la base de producción**. | Datos de prueba o borrados en producción | Ya existe la rama `dev`; falta cambiar `DATABASE_URL` en tu `.env`. | Tú |
| P4 🔴 | Contraseña de aplicación de Gmail expuesta en la sesión del 20/10. Las tres ramas de Neon comparten la contraseña de `neondb_owner`. | Robo de correo / acceso a producción si se filtra la de staging | Revocar la de Gmail. Resetear la contraseña de `neondb_owner` en `staging` y `dev` (en Neon las contraseñas son por rama). | Tú / DevOps |
| P5 🟠 | Backend sin cabeceras de seguridad (sin `helmet`, `X-Powered-By: Express`) y **Swagger `/docs` público en producción**. Front solo con HSTS (sin CSP, `nosniff`, `Referrer-Policy`). | Superficie de ataque y mapa completo de la API expuesto | `helmet` + `/docs` solo fuera de producción (back); `headers()` en `next.config` (front). | Back / Front |
| P6 🟠 | **Sin respaldos** más allá de 6 h de historial. | Una migración mala o un borrado se nota tarde y no se recupera | Instantánea manual en Neon antes de cada release. No usar artefactos de GitHub Actions para respaldos: el repo es público y tiene datos personales. | DevOps |
| P7 🟠 | Sin monitoreo ni alertas de caída. | La cliente encuentra la caída antes que tú | UptimeRobot gratis sobre `/api/health` cada 5 min **solo en días de demo** (mantiene despierto y avisa por correo). | DevOps |
| P8 🟡 | Versiones de Node distintas: Vercel 24.x, CI 22, Render sin fijar. | «En mi máquina funciona» | Fijar `engines.node` y `.nvmrc` en ambos repos y `NODE_VERSION` en Render. | DevOps |
| P9 🟡 | La integración Neon↔Vercel crea una rama de Neon por cada preview y le pasa al front 18 variables `STORAGE_*` con credenciales de la base que el front no usa. | Consume el tope de 10 ramas; credenciales donde no hacen falta | Desactivar la creación de ramas por preview en la integración (Vercel → Integrations → Neon). | Tú |
| P10 🟡 | El `.gitignore` del front excluye `*.md` (incluye README y estas notas). | Documentación sin versionar, se pierde con el disco | Versionar al menos `README.md` y `notes/` sin datos sensibles, o moverlas a un repo privado. | Tú |
| P11 🟡 | Sin etiquetas de versión. | Difícil demostrar qué se entregó en cada corte | Etiquetar cada entrega: `v1.0-iteracion-1`, `v2.0-iteracion-2`, … | DevOps |
| P12 🟡 | Dependencias de desarrollo del back con alertas (handlebars crítica vía `ts-jest`); en producción 4 moderadas (`@nestjs/swagger`, `exceljs`). | Bajo: no corren en producción | Revisar con `npm audit` en cada publicación. | Back |

**Lo que está bien:** contraseñas y claves fuera del código (sin secretos en el historial de git según el escaneo del 20/10), HTTPS en todo, `/api/health` con health check en Render, migraciones versionadas y reversibles, buena batería de pruebas (front 185, back 645 unitarias + 36 e2e) que ahora corre en cada PR, privacidad de datos personales cuidada en la API.

## 7. Correo en producción (ajustes v2.2, P6)

El backend manda el correo de bienvenida por SMTP (`nodemailer`, `src/infrastructure/mail/smtp-mail-sender.ts`). **Sin `SMTP_HOST` no se envía nada** (solo queda un aviso en el log). Desde v2.2 sale un correo al principal y otro al alterno si la persona lo tiene (E3); un fallo en uno no afecta al otro ni al registro.

**Lo configura Jhony en Render, en el servicio de producción (y en staging si se quiere probar ahí). Ninguna credencial va al repo ni a estas notas.**

1. Elegir un proveedor que firme SPF y DKIM, para que el correo no llegue a spam:
   - **Brevo** (capa gratuita con tope diario): crear la cuenta, verificar el remitente (*Senders & IP → Senders*) y, si hay un dominio propio, autenticarlo (*Domains*: registros SPF y DKIM en el DNS). Las credenciales SMTP están en *SMTP & API → SMTP*.
   - **Gmail** con una contraseña de aplicación (exige verificación en dos pasos): el remitente tiene que ser la misma cuenta de Gmail. La contraseña de aplicación expuesta el 20/10 (§6, P4) debe estar revocada; generar una nueva.
2. En Render → servicio → *Environment*, agregar:

   | Variable | Qué va |
   |---|---|
   | `SMTP_HOST` | Servidor SMTP del proveedor (p. ej. `smtp-relay.brevo.com` o `smtp.gmail.com`) |
   | `SMTP_PORT` | `587` |
   | `SMTP_SECURE` | `false` con 587 (STARTTLS); `true` solo con 465 |
   | `SMTP_USER` | Usuario SMTP del proveedor |
   | `SMTP_PASS` | Clave SMTP (de Brevo o la contraseña de aplicación de Gmail) |
   | `MAIL_FROM` | Remitente verificado, p. ej. `Conecta U <correo-verificado@dominio>` |

   Revisar también que `APP_URL` sea la URL pública del front: el botón del correo lleva ahí.
3. Guardar: Render vuelve a desplegar solo.

**Cómo probarlo (con su propio correo):**
1. En producción, registrarse con un correo propio y un correo alterno propio (o crear la cuenta desde *Usuarios* como ADMIN).
2. Deben llegar **dos** correos «Te damos la bienvenida a Conecta U: tu cuenta está lista». Si no están en la bandeja de entrada, buscar en spam.
3. En el correo, *Mostrar original* (Gmail) o ver los encabezados: deben decir `spf=pass` y `dkim=pass`. Si alguno falla, revisar la verificación del remitente o del dominio en el proveedor.
4. En Render → *Logs* deben salir dos líneas «Correo de bienvenida enviado» con `kind: principal` y `kind: alterno`. Si sale «No se pudo enviar el correo de bienvenida», el error que acompaña dice la causa (credenciales, puerto o remitente no verificado). El log nunca incluye la dirección.
5. Borrar la cuenta de prueba desde *Usuarios* al terminar.
