Module.register("MMM-MyCalendar", {
  defaults: {
    calendarUrls: {},  // Object for calendar URLs and categories
    eventSettings: {}, // Settings for icons and colors
    updateInterval: 60 * 60 * 1000,
    fadeSpeed: 4000,
    maximumEntries: 4
  },

  // Include your CSS file
  getStyles: function () {
    return ["MMM-MyCalendar.css"];
  },

  start: function () {
    Log.info("Starting module: " + this.name);
    this.calendarData = [];
    this.getData();  // Load calendar data
    this.scheduleUpdate();  // Schedule regular updates
  },

  getData: function () {
    this.sendSocketNotification("GET_CALENDAR_DATA", {
      urls: this.config.calendarUrls,
      eventSettings: this.config.eventSettings
    });
  },

  getDom: function () {
    const wrapper = document.createElement("div");

    // Header with underline
    const header = document.createElement("h2");
    header.innerHTML = "Kalender";
    wrapper.appendChild(header);

    const separator = document.createElement("hr");
    wrapper.appendChild(separator);

    if (!this.calendarData || this.calendarData.length === 0) {
      wrapper.innerHTML = "Loading calendar...";
      return wrapper;
    }

    const now = new Date();

    // Filter and sort future events
    const futureEvents = this.calendarData
      .filter(event => {
        if (!(event.startTime instanceof Date) || isNaN(event.startTime)) {
          event.startTime = new Date(event.startTime);
        }
        return event.startTime > now;
      })
      .sort((a, b) => a.startTime - b.startTime)
      .slice(0, this.config.maximumEntries);

    const baseContainer = document.createElement("div");
    baseContainer.className = "events-container";

    futureEvents.forEach(event => {
      const formattedDate = event.startTime.toLocaleString([], {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

      // 'player' Div
      const playerDiv = document.createElement("div");
      playerDiv.className = "player";

      // 'header' Div
      const headerDiv = document.createElement("div");
      headerDiv.className = "header";

      // 'icon' Span (the Icon)
      const iconSpan = document.createElement("span");
      iconSpan.className = event.icon + " icon";

      // 'visual' Div (the Pipe)
      const visualDiv = document.createElement("div");
      visualDiv.className = "visual";
      visualDiv.style.backgroundColor = event.color;

      // 'names' Div
      const namesDiv = document.createElement("div");
      namesDiv.className = "names";

      // 'title' Div
      const titleDiv = document.createElement("div");
      titleDiv.className = "title";
      titleDiv.innerHTML = event.title;

      // 'subtitle' Div
      const subtitleDiv = document.createElement("div");
      subtitleDiv.className = "subtitle";
      subtitleDiv.innerHTML = formattedDate;

      // Append 'title' and 'subtitle' to 'names'
      namesDiv.appendChild(titleDiv);
      namesDiv.appendChild(subtitleDiv);

      // Append 'icon', 'visual', and 'names' to 'header'
      headerDiv.appendChild(iconSpan);
      headerDiv.appendChild(visualDiv);
      headerDiv.appendChild(namesDiv);

      // Append 'header' to 'playerDiv'
      playerDiv.appendChild(headerDiv);

      // Append 'playerDiv' to the main container
      baseContainer.appendChild(playerDiv);
    });

    wrapper.appendChild(baseContainer);
    return wrapper;
  },

  socketNotificationReceived: function (notification, payload) {
    if (notification === "CALENDAR_DATA_RECEIVED") {
      this.calendarData = payload;
      this.updateDom(this.config.fadeSpeed);
    }
  },

  scheduleUpdate: function () {
    setInterval(() => {
      this.getData();
    }, this.config.updateInterval);
  }
});