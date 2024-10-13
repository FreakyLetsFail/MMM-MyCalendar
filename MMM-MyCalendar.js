Module.register("MMM-MyCalendar", {
  defaults: {
    calendarUrls: {},  // URLs für die Kalender
    eventSettings: {}, // Einstellungen für Icons und Farben
    updateInterval: 60 * 60 * 1000, // Aktualisierung alle 60 Minuten
    fadeSpeed: 4000,
    maximumEntries: 4 // Maximal 4 Einträge
  },

  getStyles: function () {
    return ["MMM-MyCalendar.css"];
  },

  getScripts: function() {
    return ["https://cdnjs.cloudflare.com/ajax/libs/luxon/3.0.1/luxon.min.js"];
  },

  start: function () {
    this.calendarData = [];
    this.getData();
    this.scheduleUpdate();
  },

  getData: function () {
    this.sendSocketNotification("GET_CALENDAR_DATA", {
      urls: this.config.calendarUrls,
      eventSettings: this.config.eventSettings
    });
  },

  socketNotificationReceived: function (notification, payload) {
    if (notification === "CALENDAR_DATA_RECEIVED") {
      this.calendarData = payload;
      this.updateDom(this.config.fadeSpeed);
    }
  },

  getDom: function () {
    const wrapper = document.createElement("div");
    const header = document.createElement("h2");
    header.innerHTML = "Kalender";
    wrapper.appendChild(header);

    if (!this.calendarData || this.calendarData.length === 0) {
      wrapper.innerHTML = "Loading calendar...";
      return wrapper;
    }

    const now = luxon.DateTime.utc();
    const futureEvents = this.calendarData
      .filter(event => {
        let eventTime = luxon.DateTime.fromISO(event.startTime, { zone: 'utc' });
        return eventTime > now;
      })
      .sort((a, b) => {
        let aTime = luxon.DateTime.fromISO(a.startTime, { zone: 'utc' });
        let bTime = luxon.DateTime.fromISO(b.startTime, { zone: 'utc' });
        return aTime - bTime;
      })
      .slice(0, this.config.maximumEntries);

    const baseContainer = document.createElement("div");
    baseContainer.className = "events-container";

    futureEvents.forEach(event => {
      let eventTime = luxon.DateTime.fromISO(event.startTime, { zone: 'utc' }).setZone('local');
      let formattedDate = event.allDay
        ? eventTime.toLocaleString(luxon.DateTime.DATE_MED)
        : eventTime.toLocaleString(luxon.DateTime.DATETIME_MED);

      const playerDiv = document.createElement("div");
      playerDiv.className = "player";

      const headerDiv = document.createElement("div");
      headerDiv.className = "header";

      const iconSpan = document.createElement("span");
      iconSpan.className = event.icon + " icon";

      const visualDiv = document.createElement("div");
      visualDiv.className = "visual";
      visualDiv.style.backgroundColor = event.color;

      const namesDiv = document.createElement("div");
      namesDiv.className = "names";

      const titleDiv = document.createElement("div");
      titleDiv.className = "title";
      const marqueeSpan = document.createElement("span");
      marqueeSpan.innerHTML = event.title;
      if (event.title.length > 20) {
        marqueeSpan.className = "marquee";
      }
      titleDiv.appendChild(marqueeSpan);

      const subtitleDiv = document.createElement("div");
      subtitleDiv.className = "subtitle";
      subtitleDiv.innerHTML = formattedDate;

      namesDiv.appendChild(titleDiv);
      namesDiv.appendChild(subtitleDiv);

      headerDiv.appendChild(iconSpan);
      headerDiv.appendChild(visualDiv);
      headerDiv.appendChild(namesDiv);
      playerDiv.appendChild(headerDiv);
      baseContainer.appendChild(playerDiv);
    });

    wrapper.appendChild(baseContainer);
    return wrapper;
  },

  scheduleUpdate: function () {
    setInterval(() => {
      this.getData();
    }, this.config.updateInterval);
  }
});