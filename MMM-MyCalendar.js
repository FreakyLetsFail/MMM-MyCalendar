/* MMM-MyCalendar.js */

Module.register("MMM-MyCalendar", {
  defaults: {
    calendarUrl: "",               // URL zu deiner kombinierten .ics-Datei
    updateInterval: 60 * 60 * 1000, // Aktualisierung alle 60 Minuten
    fadeSpeed: 4000,
    maximumEntries: 4              // Maximale Anzahl der angezeigten Einträge
  },

  start: function () {
    Log.info("Starting module: " + this.name);
    this.calendarData = null;
    this.getData();
    this.scheduleUpdate();
  },

  getData: function () {
    const url = this.config.calendarUrl;
    if (url === "") {
      Log.error("Calendar URL is not configured.");
      return;
    }
    this.sendSocketNotification("GET_CALENDAR_DATA", { url: url });
  },

  getDom: function () {
    const wrapper = document.createElement("div");

    if (!this.calendarData) {
      wrapper.innerHTML = "Loading calendar...";
      return wrapper;
    }

    const now = new Date();

    // Filtere nur zukünftige Ereignisse und sortiere sie nach Startdatum
    const futureEvents = this.calendarData
      .filter(event => new Date(event.startTime) > now)       // Nur zukünftige Events
      .sort((a, b) => new Date(a.startTime) - new Date(b.startTime)) // Nach Startzeit sortieren
      .slice(0, this.config.maximumEntries);                  // Zeige nur die ersten 4 Events

    // Hauptcontainer im Stil von MMM-OnSpotify
    const baseContainer = document.createElement("div");
    baseContainer.className = "ONSP-Base"; // Verwende die gleiche Basis-Klasse

    futureEvents.forEach(event => {
      // 'player' Div für jeden Kalendereintrag
      const playerDiv = document.createElement("div");
      playerDiv.className = "player";

      // 'header' Div
      const headerDiv = document.createElement("div");
      headerDiv.className = "header";

      // 'visual' Div (eventuell für ein visuelles Element oder eine Linie)
      const visualDiv = document.createElement("div");
      visualDiv.className = "visual";

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
      const eventStartTime = new Date(event.startTime);
      subtitleDiv.innerHTML = `${eventStartTime.toLocaleDateString()} ${eventStartTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

      // Füge 'title' und 'subtitle' zu 'names' hinzu
      namesDiv.appendChild(titleDiv);
      namesDiv.appendChild(subtitleDiv);

      // Füge 'visual' und 'names' zu 'header' hinzu
      headerDiv.appendChild(visualDiv);
      headerDiv.appendChild(namesDiv);

      // 'swappable' Div (für das Icon)
      const swappableDiv = document.createElement("div");
      swappableDiv.className = "swappable";

      // Icon hinzufügen
      const iconSpan = document.createElement("span");
      iconSpan.className = this.getEventIcon(event.description) + " media top";
      swappableDiv.appendChild(iconSpan);

      // Füge alle Teile zum 'player' Div hinzu
      playerDiv.appendChild(headerDiv);
      playerDiv.appendChild(swappableDiv);

      // Füge das 'player' Div zum Hauptcontainer hinzu
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
  },

  // Funktion zum Abrufen des passenden Icons basierend auf der Kategorie in der Beschreibung
  getEventIcon: function (eventDescription) {
    if (eventDescription.includes("Category: meet friends")) {
      return "fas fa-users";           // Icon für Treffen mit Freunden
    } else if (eventDescription.includes("Category: holidays")) {
      return "fas fa-umbrella-beach";  // Icon für Urlaub
    } else if (eventDescription.includes("Category: family")) {
      return "fas fa-home";            // Icon für Familienveranstaltungen
    } else if (eventDescription.includes("Category: studium")) {
      return "fas fa-book";            // Icon für Studium
    } else if (eventDescription.includes("Category: andere Termine")) {
      return "fas fa-calendar-alt";    // Icon für andere Termine
    } else if (eventDescription.includes("Category: Geburtstage")) {
      return "fas fa-birthday-cake";   // Icon für Geburtstage
    } else if (eventDescription.includes("Category: arzt")) {
      return "fas fa-stethoscope";     // Icon für Arzttermine
    } else if (eventDescription.includes("Category: Verbindung")) {
      return "fas fa-network-wired";   // Icon für Verbindungen
    } else if (eventDescription.includes("Category: Arbeit")) {
      return "fas fa-briefcase";       // Icon für Arbeit
    } else {
      return "fas fa-calendar-alt";    // Standard-Icon
    }
  }
});
