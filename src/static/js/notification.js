const notification = {
    spawnNotification(title, body, animationDuration = 5) {
        const newNotificationId = document.querySelectorAll(".notification").length + 1;
        document.querySelector(".notification-container").insertAdjacentHTML("beforeend", `
            <div class="notification" id="notification-${newNotificationId}">
                <div class="notification-progress" id="notification-progress-${newNotificationId}"></div>
                <div class="notification-body" id="notification-body-${newNotificationId}">
                    <p>Title</p>
                    <div>Body</div>
                </div>
                <div class="close-notification" onclick="notification.closeNotification(${newNotificationId})">X</div>
            </div>
        `);

        const notificationElement = document.querySelector(`#notification-${newNotificationId}`);
        const progress = document.querySelector(`#notification-progress-${newNotificationId}`);
        const bodyElement = document.querySelector(`#notification-body-${newNotificationId}`);

        bodyElement.querySelector("p").innerHTML = title;
        bodyElement.querySelector("div").innerHTML = body;

        notificationElement.style.opacity = 1;

        // Slide in animation
        notificationElement.animate(
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
                    this.closeNotification(newNotificationId);
                };
        }, 600);
    },

    closeNotification(notificationID) {
        const notificationElement = document.querySelector("#notification-" + notificationID);
        notificationElement.animate(
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
                notificationElement.remove();
            };
    }
};

// Make utils available globally
window.utils = notification;