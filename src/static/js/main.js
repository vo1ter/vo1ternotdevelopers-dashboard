const socket = io();
const bodyStyles = window.getComputedStyle(document.body);
const loader = document.querySelector(".loader");

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
            usageTextMb: document.querySelector("#ram-usage-text-mb"),
        }
    }
}

window.onload = async () => {
    loader.innerHTML = "Loading neofetch...";
    socket.emit("getNeofetchData");

    let loaderInterval = setInterval(() => {
        if(fields.neofetch.cpu.innerHTML != "" && fields.stats.cpu.usageText.innerHTML != "0%") {
            loader.animate(
                [
                    { opacity: `1` },
                    { opacity: `0` },
                ],
                {
                    duration: 350,
                    easing: "linear",
                    iterations: 1,
                    fill: "forwards"
                }
            ).onfinish = () => {
                loader.remove();
            };

            clearInterval(loaderInterval);
        }
    }, 500);

    let uptimeInterval = setInterval(() => {
        let uptime = fields.stats.uptime.getAttribute("data-seconds");
        
        if(uptime != "") {
            uptime++;
            fields.stats.uptime.innerHTML = converTime(uptime);
            fields.stats.uptime.setAttribute("data-seconds", uptime);
        }
    }, 1000);
}

socket.on("neofetchData", (data) => {
    fields.neofetch.cpu.innerHTML = `${data.cpu.manufacturer} ${data.cpu.brand}`;
    fields.neofetch.host.innerHTML = data.system.model;
    fields.neofetch.kernel.innerHTML = data.osInfo.kernel;
    fields.neofetch.os.innerHTML = `${data.osInfo.distro} ${data.osInfo.release}`;
    fields.neofetch.machineName.innerHTML = data.osInfo.hostname;
    fields.neofetch.ram.innerHTML = `${parseInt(convertBytes(data.mem.used, "MB"))} MiB / ${parseInt(convertBytes(data.mem.total, "MB"))} MiB`;

    fields.stats.uptime.innerHTML = converTime(data.time.uptime);
    fields.stats.uptime.setAttribute("data-seconds", parseInt(data.time.uptime));

    document.querySelector("#distro-logo").setAttribute("src", `static/images/logos/svg/${data.osInfo.logofile}.svg`)

    fields.stats.ram.usageProgress.style.backgroundColor = bodyStyles.getPropertyValue(`--${data.osInfo.logofile}-color`);
    fields.stats.cpu.usageProgress.style.backgroundColor = bodyStyles.getPropertyValue(`--${data.osInfo.logofile}-color`);
    fields.stats.cpu.tempProgress.style.backgroundColor = bodyStyles.getPropertyValue(`--${data.osInfo.logofile}-color`);

    for(let i = 0; i < data.cpu.cores; i++) {
        document.querySelector(".cpu-cores-container").innerHTML += `
        <div class="cpu-core" id="cpu-core-${i}">
            <div class="cpu-core-fill" style="background-color: ${bodyStyles.getPropertyValue(`--${data.osInfo.logofile}-color`)}; height: 0%;"></div>
        </div>`;
    }

    loader.innerHTML = "Loading ascii art...";
    socket.emit("getAsciiArt", data.osInfo.distro);
    loader.innerHTML = "Loading services..."
    socket.emit("getServices");
    loader.innerHTML = "Loading usage stats...";
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
    fields.stats.ram.usageText.innerHTML = `${parseFloat((data.mem.used * 100) / data.mem.total).toFixed(2)}%`;
    fields.stats.ram.usageProgress.style.width= `${parseFloat((data.mem.used * 100) / data.mem.total).toFixed(2)}%`;
    fields.stats.ram.usageTextMb.innerHTML = `${parseInt(convertBytes(data.mem.used, "MB"))}/${parseInt(convertBytes(data.mem.total, "MB"))} MB`;
})

socket.on("services", (data) => {
    data.forEach((service) => {
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
})

socket.on("servicesUpdate", (data) => {
    if(document.querySelector(".services-container").children.length == 0) return
    data.forEach((service) => {
        document.querySelector(`#service-${service.name}-status`).innerHTML = service.running ? "Running" : "Stopped";
        document.querySelector(`#service-${service.name}-cpu-usage`).innerHTML = parseFloat(service.cpu).toFixed(2);
        document.querySelector(`#service-${service.name}-ram-usage`).innerHTML = parseFloat(service.mem).toFixed(2);
    })
})

function convertBytes(bytes, convertTo) {
    switch(convertTo) {
        case "KB":
            return bytes / 1024;
        case "MB":
            return bytes / 1024 / 1024;
        case "GB":
            return bytes / 1024 / 1024 / 1024;
        case "TB":
            return bytes / 1024 / 1024 / 1024 / 1024;
        default: 
            return bytes
    }
}

function converTime(seconds) {
    var hours = Math.floor(seconds / 3600);
    var minutes = Math.floor((seconds - (hours * 3600)) / 60);
    var seconds = parseInt(seconds - (hours * 3600) - (minutes * 60));

    if(hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
    else if(minutes > 0) return `${minutes}m ${seconds}s`; 
    else return `${seconds}s`;
}