const express = require('express')
const si = require("systeminformation");
const fs = require("fs");
const app = express()
const port = 3000

app.use(express.static('web'));

app.get('/', (req, res) => {
    res.set('Language', 'en');
    res.sendFile(__dirname + '/web/index.html');
})

app.get('/get/server/neofetch', (req, res) => {
    si.get({
        cpu: 'brand',
        cpuTemperature: "*",
        mem: "total, free, used, active",
        system: "model",
        osInfo: "platform, distro, kernel, hostname, logofile, release",
        time: "uptime",
        currentLoad: "currentLoad",
        services: "*"
    })
    .then(data => {
        res.json(data);
    })
    .catch(err => {
        res.json(err);
    });
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

app.get("/get/ascii/:distro", (req, res) => {
    const os = req.params.distro.split(" ");
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

    return res.json(lookupResult)
})

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})