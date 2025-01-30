const express = require('express')
const si = require("systeminformation");
const { Server } = require("socket.io");
const fs = require("fs");
const app = express();
let port = 3000;
let forceOs = {
    use: false,
    forceTo: "",
    name: "",
}

process.argv.forEach((val, index) => {
    if(val == "--port" && parseInt(process.argv[index + 1]) > 0 && parseInt(process.argv[index + 1]) < 65536) port = process.argv[index + 1];
    if(val == "--force-os") {
        const osList = JSON.parse(fs.readFileSync("web/static/json/systems.json", { encoding: 'utf8', flag: 'r' }));

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
})

const io = new Server(server);

app.use(express.static('web'));

app.get('/', (req, res) => {
    res.set('Language', 'en');
    res.sendFile(__dirname + '/web/index.html');
})

setInterval(async () => {
    if(io.engine.clientsCount == 0) return;
    
    io.emit("usageData", await getServerUsage());
    io.emit("servicesUpdate", await getServerServices());
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

    socket.on("getServices", async () => {
        socket.emit("services", await getServerServices());
    })
});

async function getServerData() {
    return await si.get({
        cpu: 'manufacturer, brand, cores',
        mem: "total, free, used, active",
        system: "model",
        osInfo: "platform, distro, kernel, hostname, logofile, release",
        time: "uptime",
        currentLoad: "currentLoad"
    })
    .then(data => {
        if(forceOs.use) {
            data.osInfo.logofile = forceOs.forceTo;
            data.osInfo.distro = forceOs.name;
        }
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
        currentLoad: "currentLoad, cpus"
    })
    .then(data => {
        return data
    })
    .catch(err => {
        return err
    });
}

async function getServerServices() {
    const servicesData = JSON.parse(fs.readFileSync("web/static/json/services.json", { encoding: 'utf8', flag: 'r' }));
    let servicesArray = [];

    Object.keys(servicesData).forEach((key) => {
        servicesArray.push(servicesData[key].name);
    })

    return await si.services(servicesArray.join(","))
    .then(data => {
        return data
    })
    .catch(err => {
        return err
    });
}