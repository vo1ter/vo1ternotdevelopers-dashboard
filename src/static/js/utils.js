const utils = {
    convertBytes: function (bytes, convertTo) {
        switch (convertTo) {
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
    },

    converTime: function (seconds) {
        var hours = Math.floor(seconds / 3600);
        var minutes = Math.floor((seconds - (hours * 3600)) / 60);
        var seconds = parseInt(seconds - (hours * 3600) - (minutes * 60));

        if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
        else if (minutes > 0) return `${minutes}m ${seconds}s`;
        else return `${seconds}s`;
    },

    startup: function () {
        loader.innerHTML = "Loading neofetch...";
        socket.emit("getNeofetchData");

        let interval = setInterval(() => {
            if (loaderProgress.neofetchProgress >= 1 && loaderProgress.servicesProgress < 1) {
                loader.innerHTML = "Loading services..."
            }
            else if (loaderProgress.servicesProgress >= 1 && loaderProgress.dockerProgress < 1) {
                loader.innerHTML = "Loading docker containers...";
            }
            else if (loaderProgress.dockerProgress >= 1 && loaderProgress.usageProgress < 1) {
                loader.innerHTML = "Loading usage stats...";
            }

            if (loaderProgress.servicesProgress >= 1 && loaderProgress.dockerProgress >= 1 &&
                loaderProgress.usageProgress >= 1 && loaderProgress.neofetchProgress >= 1) {
                loaderProgress.done = true;
                loading.closeLoader();
                clearInterval(interval);
            }
        }, 500)
    }
};

// Make utils available globally
window.utils = utils;