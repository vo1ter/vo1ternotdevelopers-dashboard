const express = require('express')
const { Server } = require("socket.io");
const fs = require("fs");
const app = express();

const serverData = require("./serverData");

let port = 3000;
let forceOs = {
    use: false,
    forceTo: "",
    name: "",
}

process.argv.forEach((val, index) => {
    if(val == "--port" && parseInt(process.argv[index + 1]) > 0 && parseInt(process.argv[index + 1]) < 65536) port = process.argv[index + 1];
    if(val == "--force-os") {
        const osList = JSON.parse(fs.readFileSync("src/static/json/systems.json", { encoding: 'utf8', flag: 'r' }));

        Object.keys(osList).forEach((key) => {
            if(key == process.argv[index + 1].toLowerCase()) {
                console.log(`Forcing OS to ${process.argv[index + 1]}`);
                forceOs.use = true;
                forceOs.forceTo = key;
                forceOs.name = osList[key].name;
            }
        })
    }
});

const server = app.listen(port, () => {
    console.log(`Dashboard listening on port ${port}`)
    console.log(`Website available on http://localhost:${port}`)
})

const io = new Server(server);

app.use(express.static('src'));

app.get('/', (req, res) => {
    res.set('Language', 'en');
    res.sendFile(__dirname + '/src/index.html');
})

setInterval(async () => {
    if(io.engine.clientsCount == 0) return;
    
    io.emit("usageData", await serverData.getServerUsage());
    io.emit("servicesUpdate", await serverData.getServerServices());
    io.emit("dockerContainersUpdate", await serverData.getServerDockerContainers());
}, 1000)

io.on('connection', (socket) => {
    socket.on("getNeofetchData", async () => {
        socket.emit("neofetchData", await serverData.getServerData());
    })

    socket.on("getUsage", async () => {
        socket.emit("usageData", await serverData.getServerUsage());
    })
});