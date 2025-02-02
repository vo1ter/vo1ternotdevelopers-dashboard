# vo1ternotdevelopers dashboard

Node.JS dashboard for your server

## Installation

1. Clone the repository with `git clone https://github.com/vo1ter/vo1ternotdevelopers-dashboard`
2. Install the dependencies with `npm install`
3. Let it rev with `node app`

or you can use docker...

1. Clone the repository with `git clone https://github.com/vo1ter/vo1ternotdevelopers-dashboard`
2. Go to the cloned directory with `cd vo1ternotdevelopers-dashboard`
3. Build docker image with `sudo docker buildx build -t dashboard .`
4. Start your docker container with `sudo docker run --net=host -p 3000:3000 -it --restart always dashboard`  

## ToDo:

1. [ ] Changing config via website
2. [x] Docker support
3. [ ] Add systems to systems.json
4. [ ] Refactor code
5. [ ] Different dashboard pages (e.g. more detailed statistics, stats over time, e.g.)

## Startup arguments

Example: `node app.js --port 8000 --force-os arch`

| Argument  | Value | Comment |
| ------------- | ------------- | ------------- |
|  --port  |  int (1-65535)  |  What port should be used  |
|  --force-os  |  string   |  Works only with systems from [systems.json](https://github.com/vo1ter/vo1ternotdevelopers-dashboard/blob/main/src/static/json/systems.json)!  |

## Changing .json files (services, docker containers, etc.)
If you want to change what services or docker containers are visible and how it displays it in the dashboard, you can do it by editing services.json or containers.json.

### services.json 
Structure is quite simple:
```json
{
    "systemServiceName": {
        "name": "display name (what will be vissible in the dashboard)",
        "icon": "path to icon should be used (leave empty if nothing should be displayed at all)"
    }
}
```

| Key | Value | Comment |
| ------------- | ------------- | ------------- |
| systemServiceName | string | Name that is used in your system for the services (e.g. nginx, docker, etc.) |
| name | string | What name should be displayed in the dashboard |
| icon | string | Path to icon that should be used in dashboard (leave empty if none should be used) |

### containers.json
Structure is quite simple:
```json
{
    "dockerContainerName": {
        "name": "display name (what will be vissible in the dashboard)",
        "icon": "path to icon should be used (leave empty if nothing should be displayed at all)"
    }
}
```

| Key | Value | Comment |
| ------------- | ------------- | ------------- |
| dockerContainerName | string | Docker container name (to setup name for docker container use --name when you start it) |
| name | string | What name should be displayed in the dashboard |
| icon | string | Path to icon that should be used in dashboard (leave empty if none should be used) |

# NOTE!
This application requires additional configuration if you are using reverse proxy like nginx/apache/etc.
[socket.io documentation](https://socket.io/docs/v4/reverse-proxy/)