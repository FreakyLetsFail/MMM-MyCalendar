Module.register("MMM-MyCalendar", {
  defaults: {
    calendarUrls: {},  // Object for calendar URLs and categories
    eventSettings: {}, // Settings for icons and colors
    updateInterval: 60 * 60 * 1000,
    fadeSpeed: 4000,
    maximumEntries: 10 // Erhöhe diesen Wert entsprechend
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

    // Überschrift mit einer Linie darunter
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
    console.log("Aktuelle Zeit (now):", now);

    // Filtere und sortiere zukünftige Ereignisse
    const futureEvents = this.calendarData
      .filter(event => {
        if (!(event.startTime instanceof Date) || isNaN(event.startTime)) {
          event.startTime = new Date(event.startTime);
        }
        // Logging der Startzeit jedes Ereignisses
        console.log("Ereignis:", event.title, "Startzeit:", event.startTime);
        return event.startTime > now;
      })
      .sort((a, b) => a.startTime - b.startTime)
      .slice(0, this.config.maximumEntries);

    console.log("Anzahl der zukünftigen Ereignisse:", futureEvents.length);

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

      // 'icon' Span (das Icon)
      const iconSpan = document.createElement("span");
      iconSpan.className = event.icon + " icon";

      // 'visual' Div (die Pipe)
      const visualDiv = document.createElement("div");
      visualDiv.className = "visual";
      visualDiv.style.backgroundColor = event.color;

      // 'names' Div
      const namesDiv = document.createElement("div");
      namesDiv.className = "names";

      // 'title' Div
      const titleDiv = document.createElement("div");
      titleDiv.className = "title";

      // 'marquee' Span
      const marqueeSpan = document.createElement("span");
      marqueeSpan.innerHTML = event.title;

      // Füge die 'marquee'-Klasse hinzu, wenn der Titel lang ist
      if (event.title.length > 20) { // Passe den Wert nach Bedarf an
        marqueeSpan.className = "marquee";
      }

      // Füge 'marqueeSpan' zu 'titleDiv' hinzu
      titleDiv.appendChild(marqueeSpan);

      // 'subtitle' Div
      const subtitleDiv = document.createElement("div");
      subtitleDiv.className = "subtitle";
      subtitleDiv.innerHTML = formattedDate;

      // Füge 'title' und 'subtitle' zu 'names' hinzu
      namesDiv.appendChild(titleDiv);
      namesDiv.appendChild(subtitleDiv);

      // Füge 'icon', 'visual' und 'names' zu 'header' hinzu
      headerDiv.appendChild(iconSpan);
      headerDiv.appendChild(visualDiv);
      headerDiv.appendChild(namesDiv);

      // Füge 'header' zu 'playerDiv' hinzu
      playerDiv.appendChild(headerDiv);

      // Füge 'playerDiv' zum Hauptcontainer hinzu
      baseContainer.appendChild(playerDiv);
    });

    wrapper.appendChild(baseContainer);
    return wrapper;
  },

  socketNotificationReceived: function (notification, payload) {
    if (notification === "CALENDAR_DATA_RECEIVED") {
      this.calendarData = payload;
      console.log("Empfangene Ereignisse vom node_helper:", this.calendarData.length);
      // Optional: Ausgabe der Ereignisdaten
      // console.log("Ereignisdaten:", this.calendarData);
      this.updateDom(this.config.fadeSpeed);
    }
  },

  scheduleUpdate: function () {
    setInterval(() => {
      this.getData();
    }, this.config.updateInterval);
  }
});