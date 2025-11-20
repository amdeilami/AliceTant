---
inclusion: always
---

The root directory of the project, has two main directories "frontend" and "backend". The frontend directory contains the code for the frontend of the application, and the backend directory contains the code for the backend of the application.

After you create the the fontend project using "React+Vite" and backend project using "Django", make sure you have the following structure.

# Frontend directory:

The frontend directory contains the following directories:

- `components`: contains the components of the application
- `pages`: contains the pages of the application
- `styles`: contains the styles of the application
- `utils`: contains the utils of the application
- `app`: contains the main application code
- `public`: contains the public files of the application
- `package.json`: contains the package.json file for the frontend application
- `yarn.lock`: contains the yarn.lock file for the frontend application

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
