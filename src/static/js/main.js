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
    startup();
    spawnLoader();

    let uptimeInterval = setInterval(() => {
        let uptime = fields.stats.uptime.getAttribute("data-seconds");
        
        if(uptime != "") {
            uptime++;
            fields.stats.uptime.innerHTML = converTime(uptime);
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
    fields.neofetch.ram.innerHTML = `${parseInt(convertBytes(data.mem.active, "MiB"))} MiB / ${parseInt(convertBytes(data.mem.total, "MiB"))} MiB`;

    fields.stats.uptime.innerHTML = converTime(data.time.uptime);
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
    fields.stats.ram.usageTextMiB.innerHTML = `${parseInt(convertBytes(data.mem.active, "MiB"))}/${parseInt(convertBytes(data.mem.total, "MiB"))} MiB`;

    if(!loaderProgress.done) loaderProgress.usageProgress = 1;
})

// #region Services 
socket.on("servicesUpdate", async (data) => {
    if(data.length == undefined || data.length == 0) {
        if(!loaderProgress.done) loaderProgress.servicesProgress = 1;
        if(errorCounter.services < 1) {
            let errorMessage = "Failed to load services!"
            if(data.code == "ENOENT") errorMessage += "<br>File src/static/json/services.json not found or it is empty;";
            spawnNotification("Error", errorMessage, 5);
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
            spawnNotification("Error", errorMessage, 5);
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
                    <p>RAM Usage: <span id="docker-container-${container.containerName}-ram-usage">${parseFloat(convertBytes(container.memory.usage, "MiB")).toFixed(2)}/${parseInt(convertBytes(container.memory.limit, "MiB"))}</span> MiB</p>
                </div>
            </div>
            `;
        })
    }
    else {
        data.forEach((container) => {
            document.querySelector(`#docker-container-${container.containerName}-status`).innerHTML = (container.state).charAt(0).toUpperCase() + container.state.slice(1);
            document.querySelector(`#docker-container-${container.containerName}-cpu-usage`).innerHTML = parseFloat(container.cpu).toFixed(2);
            document.querySelector(`#docker-container-${container.containerName}-ram-usage`).innerHTML = `${parseFloat(convertBytes(container.memory.usage, "MiB")).toFixed(2)}/${parseInt(convertBytes(container.memory.limit, "MiB"))}`;
        })
    }

    if(!loaderProgress.done) loaderProgress.dockerProgress = 1;
})
// #endregion

// #region Notification
function spawnNotification(title, body, animationDuration = 5) {
    const newNotificationId = document.querySelectorAll(".notification").length + 1;
    document.querySelector(".notification-container").insertAdjacentHTML("beforeend", `
    <div class="notification" id="notification-${newNotificationId}">
        <div class="notification-progress" id="notification-progress-${newNotificationId}"></div>
        <div class="notification-body" id="notification-body-${newNotificationId}">
            <p>Title</p>
            <div>Body</div>
        </div>
        <div class="close-notification" onclick="closeNotification(${newNotificationId})">X</div>
    </div>
    `);
    
    const notification = document.querySelector(`#notification-${newNotificationId}`);
    const progress = document.querySelector(`#notification-progress-${newNotificationId}`);
    const bodyElement = document.querySelector(`#notification-body-${newNotificationId}`);

    bodyElement.querySelector("p").innerHTML = title;
    bodyElement.querySelector("div").innerHTML = body;

    notification.style.opacity = 1;

    // Slide in animation
    notification.animate(
        [
            { transform: 'translateY(-400%)' },
            { transform: 'translateY(0)' }
        ],
        {
            duration: 1000,
            easing: 'cubic-bezier(0.85, 0, 0.15, 1)',
            iterations: 1,
            fill: 'forwards'
        }
    );

    // Animate progress
    setTimeout(() => {
        progress.animate(
            [
                { backgroundPosition: '0% 0' },
                { backgroundPosition: '100% 0' }
            ],
            {
                duration: animationDuration * 1000,
                easing: 'linear',
                iterations: 1,
                fill: 'forwards'
            }
        )
        .onfinish = () => {
            closeNotification(newNotificationId);
        };
    }, 600)
}

function closeNotification(notificationID) {
    const notification = document.querySelector("#notification-" + notificationID);
    notification.animate(
        [
            { transform: 'translateY(0)' },
            { transform: 'translateY(-400%)' }
        ],
        {
            duration: 500,
            easing: 'cubic-bezier(0.85, 0, 0.15, 1)',
            iterations: 1,
            fill: 'forwards'
        }
    )
    .onfinish = () => {
        notification.remove();
    }
}
// #endregion

// #region Loader
async function spawnLoader() {
    let loaderInterval = setInterval(() => {
        if(fields.neofetch.cpu.innerHTML != "" && fields.stats.cpu.usageText.innerHTML != "0%" && document.querySelector(".services-container").children.length > 0) { // && document.querySelector(".docker-container").children.length > 0
            closeLoader();

            clearInterval(loaderInterval);
        }
    }, 1000);
}

async function closeLoader() {
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
}
// #endregion

// #region Utils
function convertBytes(bytes, convertTo) {
    switch(convertTo) {
        // Binary
        case "KiB":
            return bytes / 1024;
        case "MiB":
            return bytes / 1024 / 1024;
        case "GiB":
            return bytes / 1024 / 1024 / 1024;
        case "TiB":
            return bytes / 1024 / 1024 / 1024 / 1024;
        // Decimal
        case "KB":
            return bytes / 1000;
        case "MB":
            return bytes / 1000 / 1000;
        case "GB":
            return bytes / 1000 / 1000 / 1000;
        case "TB":
            return bytes / 1000 / 1000 / 1000 / 1000;
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

function startup() {
    loader.innerHTML = "Loading neofetch...";
    socket.emit("getNeofetchData");

    let interval = setInterval(() => {
        if(loaderProgress.neofetchProgress >= 1 && loaderProgress.servicesProgress < 1) {
            loader.innerHTML = "Loading services..."
        }
        else if(loaderProgress.servicesProgress >= 1 && loaderProgress.dockerProgress < 1) {
            loader.innerHTML = "Loading docker containers...";
        }
        else if(loaderProgress.dockerProgress >= 1 && loaderProgress.usageProgress < 1) {
            loader.innerHTML = "Loading usage stats...";
        }

        if(loaderProgress.servicesProgress >= 1 && loaderProgress.dockerProgress >= 1 && loaderProgress.usageProgress >= 1 && loaderProgress.neofetchProgress >= 1) {
            loaderProgress.done = true;
            closeLoader();
            clearInterval(interval);
        }
    }, 500)
}
// #endregion