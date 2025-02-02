const loading = {
    async spawnLoader() {
        let loaderInterval = setInterval(() => {
            if (fields.neofetch.cpu.innerHTML != "" && fields.stats.cpu.usageText.innerHTML != "0%" && document.querySelector(".services-container").children.length > 0) { // && document.querySelector(".docker-container").children.length > 0
                loading.closeLoader();

                clearInterval(loaderInterval);
            }
        }, 1000);
    },

    async closeLoader() {
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
}

// Make utils available globally
window.utils = loading;