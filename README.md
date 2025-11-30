# codebyme.de

This repository contains the source code for the codebyme.de project. It is a monorepo containing a Java backend and a Svelte frontend.

## Project Architecture

The project follows a client-server architecture with a modular backend. The frontend communicates with the backend via a REST API.

```ascii
      +---------------------+
      |        User         |
      +---------------------+
              |
      +-------v-------+
      |    Browser    |
      +---------------+
              |
      +-------v-------+
      |   Frontend    |
      |  (SvelteKit)  |
      +-------+-------+
              |
              | REST API Call
              |
  +-----------v-----------+
  |  Backend (Spring Boot)|
  |                       |
  | +-------------------+ |
  | |   app (API)       | |
  | +--------+----------+ |
  |          |            |
  | +--------v----------+ |
  | |   shared (lib)    | |
  | +-------------------+ |
  +-----------------------+
```

*   **Frontend:** A single-page application (SPA) built with SvelteKit and TypeScript that consumes the backend REST API.
*   **Backend:** A RESTful API built with Java and Spring Boot. It follows a modular design:
    *   `app`: The main application module that exposes the REST API.
    *   `shared`: A shared library module containing common code used by the `app` module.
*   **Containerization:** The entire application is containerized using Docker, with services defined in `docker-compose.yml`.

## Project Structure

The repository is structured as a monorepo with two main components: `frontend` and `backend`.

Backend uses a modular approach with a shared library module.

```
/
├── backend/
│   ├── app/                # Main Spring Boot application
│   ├── shared/             # Shared Java library
│   ├── build.gradle.kts
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── lib/
│   │   └── routes/         # SvelteKit routes
│   ├── static/
│   ├── package.json
│   ├── svelte.config.js
│   └── Dockerfile
├── docker-compose.yml
└── README.md
```

### Backend

The backend is a Java project built with Gradle.

*   `backend/app`: Contains the main Spring Boot application, including REST controllers and services.
*   `backend/shared`: A shared library module that can be used by other backend modules.
*   `build.gradle.kts`: The main Gradle build script for the backend modules.

### Frontend

The frontend is a SvelteKit project.

*   `frontend/src/routes`: Defines the pages and API routes for the SvelteKit application.
*   `frontend/src/lib`: Contains reusable Svelte components and utility functions.
*   `frontend/static`: Contains static assets like images and fonts.
*   `package.json`: Defines the frontend dependencies and scripts.
*   `svelte.config.js`: The configuration file for the SvelteKit application.

### Containerization

The project uses Docker for containerization.

*   `docker-compose.yml`: Defines the services, networks, and volumes for the local development environment.
*   `docker-compose.prod.yml`: Defines the services for the production environment.
*   `Dockerfile`: Each service (`frontend` and `backend`) has its own Dockerfile to build the respective Docker image.
