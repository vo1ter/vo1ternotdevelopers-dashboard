window.onload = async () => {
    const response = await fetch("/get/server/neofetch");
    const data = await response.json();

    document.querySelector("#CPU").innerHTML = data.cpu.brand;
    document.querySelector("#host").innerHTML = data.system.model;
    document.querySelector("#kernel").innerHTML = data.osInfo.kernel;
    document.querySelector("#OS").innerHTML = data.osInfo.distro;
    document.querySelector("#machine-name").innerHTML = data.osInfo.hostname;
    document.querySelector("#memory").innerHTML = `${parseInt(convertBytes(data.mem.used, "MB"))} MiB / ${parseInt(convertBytes(data.mem.total, "MB"))} MiB`;
    document.querySelector("#uptime").innerHTML = converTime(data.time.uptime);
    document.querySelector("#uptime").setAttribute("data-seconds", parseInt(data.time.uptime));
    document.querySelector("#cpu-usage-text").innerHTML = `${parseFloat(data.currentLoad.currentLoad).toFixed(2)}%`;
    document.querySelector("#cpu-usage").style.width = `${parseFloat(data.currentLoad.currentLoad).toFixed(2)}%`;
    document.querySelector("#ram-usage-text").innerHTML = `${parseFloat((data.mem.used * 100) / data.mem.total).toFixed(2)}%`;
    document.querySelector("#ram-usage").style.width= `${parseFloat((data.mem.used * 100) / data.mem.total).toFixed(2)}%`;

    let loaderInterval = setInterval(() => {
        if(document.querySelector("#CPU").innerHTML != "") {
            document.querySelector(".loader").animate(
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
                document.querySelector(".loader").remove();
            };

            clearInterval(loaderInterval);
        }
    }, 500);

    let uptimeInterval = setInterval(() => {
        let uptime = document.querySelector("#uptime").getAttribute("data-seconds");
        
        if(uptime != "") {
            uptime++;
            document.querySelector("#uptime").innerHTML = converTime(uptime);
            document.querySelector("#uptime").setAttribute("data-seconds", uptime);
        }
    }, 1000);
}

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
