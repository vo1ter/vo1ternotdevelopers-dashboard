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

# NOTE!
This application requires additional configuration if you are using reverse proxy like nginx/apache/etc.
[socket.io documentation](https://socket.io/docs/v4/reverse-proxy/)