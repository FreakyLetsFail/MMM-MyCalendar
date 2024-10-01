/* Magic Mirror
 * Module: MMM-MyCalendar
 */

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

    const calendarWrapper = document.createElement("div");
    calendarWrapper.className = "calendarWrapper";

    const now = new Date();

    // Filtere nur zukünftige Ereignisse und sortiere sie nach Startdatum
    const futureEvents = this.calendarData
      .filter(event => new Date(event.startTime) > now)       // Nur zukünftige Events
      .sort((a, b) => new Date(a.startTime) - new Date(b.startTime)) // Nach Startzeit sortieren
      .slice(0, this.config.maximumEntries);                  // Zeige nur die ersten 4 Events

    // Erstelle die Anzeige für jedes zukünftige Event
    futureEvents.forEach(event => {
      const eventElement = document.createElement("div");
      eventElement.className = "calendarEvent";
      eventElement.style.display = "flex";  // Icon und Titel in einer Reihe
      eventElement.style.alignItems = "center";

      // Icon basierend auf der Kategorie hinzufügen
      const icon = document.createElement("span");
      icon.className = this.getEventIcon(event.description); 
      eventElement.appendChild(icon);

      // Event-Titel und Zeit hinzufügen
      const eventDetails = document.createElement("div");
      eventDetails.className = "eventDetails";
      eventDetails.style.marginLeft = "10px"; // Abstand zwischen Icon und Text

      // Event-Titel
      const eventTitle = document.createElement("div");
      eventTitle.className = "eventTitle";
      eventTitle.innerHTML = event.title;
      eventDetails.appendChild(eventTitle);

      // Event-Datum und Uhrzeit (nur Startdatum und Uhrzeit anzeigen)
      const eventTime = document.createElement("div");
      eventTime.className = "eventTime";
      const eventStartTime = new Date(event.startTime);
      eventTime.innerHTML = `${eventStartTime.toLocaleDateString()} ${eventStartTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
      eventDetails.appendChild(eventTime);

      eventElement.appendChild(eventDetails);
      calendarWrapper.appendChild(eventElement);
    });

    wrapper.appendChild(calendarWrapper);
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
