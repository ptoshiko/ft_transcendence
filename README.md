# ft_transcendence

Real-time multiplayer web application for playing Pong and socializing with other users.

## Features

- Remote player functionality
- Standard user management
- Server-side Pong and HTTP API for client-server communication.
- 2FA and JWT for secure user authentication
- Live chat for direct messages, game invitation and tournament warnings

## Technologies

 - Django(HTTP request handler)
 - Django Channels(Websockets)
 - vanila JavaScript(Front)
 - Bootstrap(UI)
 - Nginx(Webserver)
 - PostreSQL(Database)
 - Redis(Cache)

## Usage 
To start the app run: 
```bash
$ git clone https://github.com/ptoshiko/ft_transcendence.git
$ cd ft_transcendence
$ make start-app
$ make migrate
```

If everything went well, you should be able to access the website at `https://localhost:2710`




