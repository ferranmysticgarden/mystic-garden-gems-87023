 # COMANDOS COMPLETOS PARA GENERAR AAB FIRMADO
 
 **NO SIMPLIFICAR. NO OMITIR NINGÚN PASO.**
 
 ## Comandos Completos
 
 ```cmd
 cd /d "D:\mystic-garden-gems-87023"
 
 taskkill /F /IM java.exe 2>nul
 taskkill /F /IM javaw.exe 2>nul
 taskkill /F /IM gradle.exe 2>nul
 taskkill /F /IM adb.exe 2>nul
 del /f ".git\index.lock" 2>nul
 
 git checkout -- android/app/src/main/AndroidManifest.xml build-android-aab.cmd
 git pull
 
 set STORE_PWD=mystic2026
 set KEY_PWD=mystic2026
 
 call build-android-aab.cmd
 ```
 
 ## Explicación de cada paso
 
 1. **cd /d "D:\mystic-garden-gems-87023"** - Ir al directorio del proyecto
 2. **taskkill** (4 líneas) - Matar procesos que bloquean archivos
 3. **del .git\index.lock** - Eliminar bloqueo de git si existe
 4. **git checkout** - Descartar cambios locales en archivos críticos
 5. **git pull** - Descargar última versión del código
 6. **set STORE_PWD/KEY_PWD** - Configurar contraseñas (evita prompts)
 7. **call build-android-aab.cmd** - Ejecutar script de build
 
 ## Versión Actual
 
 - **Versión:** 9.5.0
 - **Code:** 950
 
 ## Salida
 
 `android\app\build\outputs\bundle\release\app-release.aab`
 
 ---
 
 **IMPORTANTE:** Siempre usar estos comandos COMPLETOS. No simplificar ni omitir pasos.