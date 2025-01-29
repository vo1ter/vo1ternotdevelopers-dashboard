const express = require('express')
const si = require("systeminformation");
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

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})