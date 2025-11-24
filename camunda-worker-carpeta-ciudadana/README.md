# Workers Camunda 8 – Carpeta Ciudadana

Este repositorio contiene los **Job Workers** de Camunda 8 que orquestan el proceso de **Carpeta Ciudadana**, conectándose con microservicios locales (MiCarpeta, Registraduría, Notificador) y con un clúster de **Camunda 8 SaaS (Zeebe)**.

---

## 1. Descripción del módulo de proyecto

Este módulo implementa workers en **Node.js** que:

- Escuchan jobs de Camunda 8 por tipo (`taskType`).
- Ejecutan lógica de negocio llamando a microservicios HTTP locales:
  - `MiCarpeta` (`/carpeta`, etc.)
  - `Registraduría` (`/identidad/verify`)
  - `Notificador` (`/email`)
- Devuelven variables de salida al proceso BPMN (`job.complete()`).
- Manejan errores (`job.fail()`) y reintentos.

Los workers se definen en `worker.js` y se enlazan con las tareas de tipo **Service Task** del diagrama BPMN mediante el atributo **Task Type**.

---

## 2. Qué dependencias tiene que tener el PC (Windows, Mac y Linux)

Para ejecutar este proyecto necesitas:

### Comunes a todos los sistemas

- **Node.js** ≥ 18.x  
- **npm** (incluido con Node.js)
- Acceso a internet para conectarse a **Camunda 8 SaaS**
- **Docker** si los microservicios (MiCarpeta, Registraduría, Notificador) se levantan con contenedores

### Windows

- Instalador oficial de Node.js: [https://nodejs.org](https://nodejs.org)  
- PowerShell o CMD para ejecutar comandos  
- Opcional: **WSL2** (recomendado para entornos más tipo Linux)

### macOS (Intel y Apple Silicon)

- Instalar Node.js:
  - Via instalador oficial, o  
  - Via Homebrew:
    ```bash
    brew install node
    ```
- Terminal (app nativa o iTerm2)

### Linux (Ubuntu / Debian / derivados)

- Instalar Node.js (ejemplo Ubuntu):

  ```bash
  sudo apt update
  sudo apt install -y nodejs npm
