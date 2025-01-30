const express = require('express')
const si = require("systeminformation");
const { Server } = require("socket.io");
const fs = require("fs");
const app = express()
const port = 3000

const server = app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})

const io = new Server(server);

app.use(express.static('web'));

app.get('/', (req, res) => {
    res.set('Language', 'en');
    res.sendFile(__dirname + '/web/index.html');
})

app.get("/get/server/services", (req, res) => {
    si.services("*")
    .then(data => {
        res.json(data);
    })
    .catch(err => {
        res.json(err);
    });
})

setInterval(async () => {
    if(io.engine.clientsCount == 0) return;
    
    io.emit("usageData", await getServerUsage());
}, 1000)

io.on('connection', (socket) => {
    socket.on("getNeofetchData", async () => {
        socket.emit("neofetchData", await getServerData());
    })

    socket.on("getUsage", async () => {
        socket.emit("usageData", await getServerUsage());
    })

    socket.on("getAsciiArt", (distro) => {
        const os = distro.split(" ");
        const osList = JSON.parse(fs.readFileSync("web/static/json/systems.json", { encoding: 'utf8', flag: 'r' }));

        os.forEach((element, index) => {
            os[index] = element.toLowerCase();
        })

        let lookupResult = {
            success: false
        };

        Object.keys(osList).forEach((key) => {
            if(os.includes(key)) {
                return lookupResult = {
                    success: true,
                    ascii: osList[key].ascii
                }
            }
        })

        socket.emit("asciiArt", lookupResult);
    })
});

async function getServerData() {
    return await si.get({
        cpu: 'brand',
        mem: "total, free, used, active",
        system: "model",
        osInfo: "platform, distro, kernel, hostname, logofile, release",
        time: "uptime",
        currentLoad: "currentLoad"
    })
    .then(data => {
        return data
    })
    .catch(err => {
        return err
    });
}

async function getServerUsage() {
    return await si.get({
        cpuTemperature: "*",
        mem: "total, free, used, active",
        time: "uptime",
        currentLoad: "currentLoad"
    })
    .then(data => {
        return data
    })
    .catch(err => {
        return err
    });
}