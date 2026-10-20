## Qué cambia

<!-- Resumen corto. RF/HU relacionados. -->

## Cómo probarlo

<!-- Ruta, rol de usuario y pasos. Ambiente: local / staging. -->

## Checklist

- [ ] La rama sale de `develop` (o de `master` si es un hotfix)
- [ ] CI en verde (lint, tipos, pruebas, build)
- [ ] Si hay migración: probada en staging y es reversible o está documentada
- [ ] Si hay variables de entorno nuevas: agregadas en Render/Vercel (staging y producción) y en `.env.example`
- [ ] Sin secretos ni datos personales reales en el código
