---
inclusion: always
---

The root directory of the project, has two main directories "frontend" and "backend". The frontend directory contains the code for the frontend of the application, and the backend directory contains the code for the backend of the application.

After you create the the fontend project using "React+Vite" and backend project using "Django", make sure you have the following structure.

# Frontend directory:

The frontend directory contains the following directories:

- `public`: contains the static assets of the application that do not require to go through Vite processing.
- `src`: contains the source code of the front application and in includes the following directories and files:
    - `assets`: contains the assets of the application, like images, fonts, etc that can be imported in the application using a relative path.
    - `components`: contains the re-usable components of the application, if you are creating a new component like a button, navigation bar, header, footer, etc. make sure to put it in the components page so you can use it again.
    - `pages`: contains the pages of the application in .jsx files.
    - `utils`: contains the shared logic like helper functions, API wrappers.
    - `App.jsx`: Root app component; contains layout + router.
    - `App.css`: Styles for the `App` component.
    - `index.css`: Global CSS + Tailwind base utilities
    - `main.jsx`: App entry point, renders ```<App />```
- `package.json`: contains the package.json file for the frontend application
- `vite.config.js`: contains the Vite configuration file for the frontend application

# Backend directory:

The backend directory contains the Django backend code of the application. The project itself should be named "AliceTant_Engine" and has an application (in a directory named "AliceTant" next to the "AliceTant_Engine").

In the "AliceTant" directory, there should be the following directories:

- models: defines our data models.
- exceptions: contains application-specific exceptions and related warnings and messages for it.
- migrations: Django creates it, and we use it to add migrations ther if necessary.
- repositories: it has all our database interfacesin it, in an ideal scenario, if we want to change the database system, we should only change this file. So it should be database functions "without" application-logic pre or post processing.
services: contains our core logics and serviecs.

# Implementation
Whenver a new class, function or file created, make sure to add a brief and informative documentation about its goals and inputs/output. The documentation should be in the following format as an example:

```python
def function_name(param1: type, param2: type) -> return_type:
    """
    Brief description of the function.

    Args:
        param1 (type): Description of param1.
        param2 (type): Description of param2.

    Returns:
        return_type: Description of the return value.
    """
    # Function body
    pass
```
