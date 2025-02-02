const si = require('systeminformation');
const fs = require('fs');

async function getServerData(forceOs = { use: false }) {
    try {
        const data = await si.get({
            cpu: 'manufacturer, brand, cores',
            mem: "total, free, used, active",
            system: "model",
            osInfo: "platform, distro, kernel, hostname, logofile, release",
            time: "uptime",
            currentLoad: "currentLoad"
        });

        if (forceOs.use) {
            data.osInfo.logofile = forceOs.forceTo;
            data.osInfo.distro = forceOs.name;
        }
        return data;
    } catch (err) {
        throw new Error(`Failed to get server data: ${err.message}`);
    }
}

async function getServerUsage() {
    try {
        return await si.get({
            cpuTemperature: "*",
            mem: "total, free, used, active",
            time: "uptime",
            currentLoad: "currentLoad, cpus"
        });
    } catch (err) {
        throw new Error(`Failed to get server usage: ${err.message}`);
    }
}

async function getServerServices() {
    try {
        const servicesData = JSON.parse(
            fs.readFileSync("src/static/json/services.json", { encoding: 'utf8', flag: 'r' })
        );

        if (!servicesData || typeof servicesData !== 'object') {
            throw new Error('Invalid services data format');
        }

        const servicesArray = Object.keys(servicesData)
            .map(key => servicesData[key]?.name)
            .filter(Boolean);

        if (!servicesArray.length) {
            throw new Error('No valid services found');
        }

        return await si.services(servicesArray.join(","));
    } catch (err) {
        throw new Error(`Failed to get server services: ${err.message}`);
    }
}

async function getServerDockerContainers() {
    let containersData;
    try {
        containersData = JSON.parse(fs.readFileSync("src/static/json/containers.json", { encoding: 'utf8', flag: 'r' }));
    }
    catch (err) {
        return err;
    }

    let containersArray = [];

    Object.keys(containersData).forEach((key) => {
        containersArray.push({
            name: containersData[key].name,
            containerName: key,
            icon: containersData[key].icon
        });
    })

    let response = [];

    await si.dockerContainers("*")
        .then(data => {
            data.forEach((element) => {
                containersArray.forEach((container) => {
                    if (element.name == container.containerName) {
                        let object = {
                            id: element.id,
                            name: container.name,
                            containerName: container.containerName,
                            icon: container.icon,
                            state: element.state,
                            cpu: 0,
                            memory: 0
                        };
                        response.push(object);
                    }
                })
            })
        })
        .catch(err => {
            return err
        });

    await si.dockerContainerStats("*")
        .then(data => {
            data.forEach((element) => {
                response.forEach((container) => {
                    if (element.id == container.id) {
                        container.cpu = element.cpuPercent;
                        container.memory = element.memoryStats;
                    }
                })
            })
        })
        .catch(err => {
            return err
        });

    return response;
}

module.exports = {
    getServerData,
    getServerUsage,
    getServerServices,
    getServerDockerContainers
};