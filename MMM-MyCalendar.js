Module.register("MMM-MyCalendar", {
  defaults: {
    calendarUrls: {},  // Objekt für Kalender-URLs und Kategorien
    eventSettings: {}, // Einstellungen für Icons und Farben
    updateInterval: 60 * 60 * 1000,
    fadeSpeed: 4000,
    maximumEntries: 4
  },

  start: function () {
    Log.info("Starting module: " + this.name);
    this.calendarData = [];
    this.getData();  // Kalenderdaten laden
    this.scheduleUpdate();  // Regelmäßige Updates planen
  },

  getData: function () {
    // Sende die Anfrage an den node_helper, um die Kalenderdaten abzurufen
    this.sendSocketNotification("GET_CALENDAR_DATA", {
      urls: this.config.calendarUrls,
      eventSettings: this.config.eventSettings
    });
  },

  getDom: function () {
    const wrapper = document.createElement("div");

    // Überschrift mit einer Linie darunter
    const header = document.createElement("h2");
    header.innerHTML = "Kalendar";
    wrapper.appendChild(header);

    const separator = document.createElement("hr"); // Trennlinie
    wrapper.appendChild(separator);

    if (!this.calendarData || this.calendarData.length === 0) {
      wrapper.innerHTML = "Loading calendar...";
      return wrapper;
    }

    const now = new Date();

    // Filtere nur zukünftige Ereignisse und sortiere sie nach Startdatum
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
      let formattedDate = event.startTime.toLocaleString([], {
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
      iconSpan.className = event.icon + " icon"; // Verwende das übergebene Icon

      // 'visual' Div (die Pipe)
      const visualDiv = document.createElement("div");
      visualDiv.className = "visual";
      visualDiv.style.backgroundColor = event.color; // Verwende die übergebene Farbe

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
      this.updateDom(this.config.fadeSpeed);
    }
  },

  scheduleUpdate: function () {
    setInterval(() => {
      this.getData();
    }, this.config.updateInterval);
  }
});