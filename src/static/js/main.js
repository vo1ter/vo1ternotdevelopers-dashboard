const socket = io();
const bodyStyles = window.getComputedStyle(document.body);
const loader = document.querySelector(".loader");

let loaderProgress = {
    done: false,
    neofetchProgress: 0,
    servicesProgress: 0,
    dockerProgress: 0,
    usageProgress: 0
};

let errorCounter = {
    neofetch: 0,
    services: 0,
    docker: 0
}

const fields = {
    neofetch: {
        cpu: document.querySelector("#CPU"),
        host: document.querySelector("#host"),
        kernel: document.querySelector("#kernel"),
        os: document.querySelector("#OS"),
        machineName: document.querySelector("#machine-name"),
        ram: document.querySelector("#memory"),
    },
    stats: {
        uptime: document.querySelector("#uptime"),
        cpu: {
            usageProgress: document.querySelector("#cpu-usage"),
            usageText: document.querySelector("#cpu-usage-text"),
            tempProgress: document.querySelector("#cpu-temp"),
            tempText: document.querySelector("#cpu-temp-text"),
        },
        ram: {
            usageProgress: document.querySelector("#ram-usage"),
            usageText: document.querySelector("#ram-usage-text"),
            usageTextMiB: document.querySelector("#ram-usage-text-mb"),
        }
    }
}

window.onload = async () => {
    utils.startup();
    loading.spawnLoader();

    let uptimeInterval = setInterval(() => {
        let uptime = fields.stats.uptime.getAttribute("data-seconds");
        
        if(uptime != "") {
            uptime++;
            fields.stats.uptime.innerHTML = utils.converTime(uptime);
            fields.stats.uptime.setAttribute("data-seconds", uptime);
        }
    }, 1000);
}

socket.on("neofetchData", async (data) => {
    fields.neofetch.cpu.innerHTML = `${data.cpu.manufacturer} ${data.cpu.brand}`;
    fields.neofetch.host.innerHTML = data.system.model;
    fields.neofetch.kernel.innerHTML = data.osInfo.kernel;
    fields.neofetch.os.innerHTML = `${data.osInfo.distro} ${data.osInfo.release}`;
    fields.neofetch.machineName.innerHTML = data.osInfo.hostname;
    fields.neofetch.ram.innerHTML = `${parseInt(utils.convertBytes(data.mem.active, "MiB"))} MiB / ${parseInt(utils.convertBytes(data.mem.total, "MiB"))} MiB`;

    fields.stats.uptime.innerHTML = utils.converTime(data.time.uptime);
    fields.stats.uptime.setAttribute("data-seconds", parseInt(data.time.uptime));

    document.querySelector("#distro-logo").setAttribute("src", `static/images/logos/svg/${data.osInfo.logofile}.svg`)

    fields.stats.ram.usageProgress.style.backgroundColor = bodyStyles.getPropertyValue(`--${data.osInfo.logofile}-color`);
    fields.stats.cpu.usageProgress.style.backgroundColor = bodyStyles.getPropertyValue(`--${data.osInfo.logofile}-color`);
    fields.stats.cpu.tempProgress.style.backgroundColor = bodyStyles.getPropertyValue(`--${data.osInfo.logofile}-color`);
    document.querySelectorAll("a").forEach((element) => {
        element.style.color = bodyStyles.getPropertyValue(`--${data.osInfo.logofile}-color`);
    })

    for(let i = 0; i < data.cpu.cores; i++) {
        document.querySelector(".cpu-cores-container").innerHTML += `
        <div class="cpu-core" id="cpu-core-${i}">
            <div class="cpu-core-fill" style="background-color: ${bodyStyles.getPropertyValue(`--${data.osInfo.logofile}-color`)}; height: 0%;"></div>
        </div>`;
    }

    socket.emit("getAsciiArt", data.osInfo.distro);

    if(!loaderProgress.done) loaderProgress.neofetchProgress = 1;
})

socket.on("asciiArt", async (data) => {
    if(await data.success == true) {
        document.querySelector("#ascii-art-text").innerHTML = data.ascii;
    }
})

socket.on("usageData", (data) => {
    fields.stats.cpu.usageText.innerHTML = `${parseFloat(data.currentLoad.currentLoad).toFixed(2)}%`;
    fields.stats.cpu.usageProgress.style.width = `${parseFloat(data.currentLoad.currentLoad).toFixed(2)}%`;
    fields.stats.cpu.tempText.innerHTML = `${parseFloat(data.cpuTemperature.main).toFixed(2)}°`;
    fields.stats.cpu.tempProgress.style.width = `${parseFloat((data.cpuTemperature.main * 100) / 100).toFixed(2)}%`;
    document.querySelectorAll(".cpu-core-fill").forEach((el, i) => el.style.height = `${parseFloat(data.currentLoad.cpus[i].load).toFixed(2)}%`);
    fields.stats.ram.usageText.innerHTML = `${parseFloat((data.mem.active * 100) / data.mem.total).toFixed(2)}%`;
    fields.stats.ram.usageProgress.style.width= `${parseFloat((data.mem.active * 100) / data.mem.total).toFixed(2)}%`;
    fields.stats.ram.usageTextMiB.innerHTML = `${parseInt(utils.convertBytes(data.mem.active, "MiB"))}/${parseInt(utils.convertBytes(data.mem.total, "MiB"))} MiB`;

    if(!loaderProgress.done) loaderProgress.usageProgress = 1;
})

// #region Services 
socket.on("servicesUpdate", async (data) => {
    if(data.length == undefined || data.length == 0) {
        if(!loaderProgress.done) loaderProgress.servicesProgress = 1;
        if(errorCounter.services < 1) {
            let errorMessage = "Failed to load services!"
            if(data.code == "ENOENT") errorMessage += "<br>File src/static/json/services.json not found or it is empty;";
            notification.spawnNotification("Error", errorMessage, 5);
            errorCounter.services++;
        }
        return;
    }

    if(document.querySelector(".services-container").children.length == 0) {
        await data.forEach((service) => {
            document.querySelector(".services-container").innerHTML += `
            <div class="card" id="service-${service.name}">
                <div class="card-desc">
                    <p>${service.name}</p>
                    <p>Status: <span id="service-${service.name}-status">${service.running ? "Running" : "Stopped"}</span></p>
                    <p>CPU Usage: <span id="service-${service.name}-cpu-usage">${parseFloat(service.cpu).toFixed(2)}</span>%</p>
                    <p>RAM Usage: <span id="service-${service.name}-ram-usage">${parseFloat(service.mem).toFixed(2)}</span>%</p>
                </div>
            </div>
            `;
        })
    }
    else {
        data.forEach((service) => {
            document.querySelector(`#service-${service.name}-status`).innerHTML = service.running ? "Running" : "Stopped";
            document.querySelector(`#service-${service.name}-cpu-usage`).innerHTML = parseFloat(service.cpu).toFixed(2);
            document.querySelector(`#service-${service.name}-ram-usage`).innerHTML = parseFloat(service.mem).toFixed(2);
        })
    }

    if(!loaderProgress.done) loaderProgress.servicesProgress = 1;
})
// #endregion

// #region Docker 
socket.on("dockerContainersUpdate", async (data) => {
    if(data.length == undefined || data.length == 0)  {
        if(!loaderProgress.done) loaderProgress.dockerProgress = 1;
        if(errorCounter.docker < 1) {
            let errorMessage = "Failed to load docker containers!"
            if(data.code == "ENOENT") errorMessage += "<br>File src/static/json/containers.json not found or it is empty;";
            notification.spawnNotification("Error", errorMessage, 5);
            errorCounter.docker++;
        }
        return;
    }

    if(document.querySelector(".docker-container").children.length == 0) {
        await data.forEach((container) => {
            document.querySelector(".docker-container").innerHTML += `
            <div class="card" id="docker-container-${container.name}">
                <div class="card-desc">
                    <p>${container.name}</p>
                    <p>Status: <span id="docker-container-${container.containerName}-status">${(container.state).charAt(0).toUpperCase() + container.state.slice(1)}</span></p>
                    <p>CPU Usage: <span id="docker-container-${container.containerName}-cpu-usage">${parseFloat(container.cpu).toFixed(2)}</span>%</p>
                    <p>RAM Usage: <span id="docker-container-${container.containerName}-ram-usage">${parseFloat(utils.convertBytes(container.memory.usage, "MiB")).toFixed(2)}/${parseInt(convertBytes(container.memory.limit, "MiB"))}</span> MiB</p>
                </div>
            </div>
            `;
        })
    }
    else {
        data.forEach((container) => {
            document.querySelector(`#docker-container-${container.containerName}-status`).innerHTML = (container.state).charAt(0).toUpperCase() + container.state.slice(1);
            document.querySelector(`#docker-container-${container.containerName}-cpu-usage`).innerHTML = parseFloat(container.cpu).toFixed(2);
            document.querySelector(`#docker-container-${container.containerName}-ram-usage`).innerHTML = `${parseFloat(utils.convertBytes(container.memory.usage, "MiB")).toFixed(2)}/${parseInt(convertBytes(container.memory.limit, "MiB"))}`;
        })
    }

    if(!loaderProgress.done) loaderProgress.dockerProgress = 1;
})
// #endregion