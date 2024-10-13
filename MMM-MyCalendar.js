/* MMM-MyCalendar.js */

Module.register("MMM-MyCalendar", {
  defaults: {
    calendarUrls: {},  // Objekt für Kalender-URLs und Kategorien
    updateInterval: 60 * 60 * 1000,
    fadeSpeed: 4000,
    maximumEntries: 4,
    defaultIcon: "fas fa-calendar-alt",
    defaultColor: "#FFFFFF"
  },

  start: function () {
    Log.info("Starting module: " + this.name);
    this.calendarData = [];
    this.getData();  // Kalenderdaten laden
    this.scheduleUpdate();  // Regelmäßige Updates planen
  },

  getData: function () {
    // Sende die Anfrage an den node_helper, um die Kalenderdaten abzurufen
    this.sendSocketNotification("GET_CALENDAR_DATA", { urls: this.config.calendarUrls });
  },

  getDom: function () {
    const wrapper = document.createElement("div");

    // Überschrift mit einer Linie darunter
    const header = document.createElement("h2");
    header.innerHTML = "Upcoming Events";
    wrapper.appendChild(header);

    const separator = document.createElement("hr"); // Trennlinie
    wrapper.appendChild(separator);

    if (!this.calendarData || this.calendarData.length === 0) {
      wrapper.innerHTML = "Loading calendar...";
      return wrapper;
    }

    const now = new Date();
    console.log("Current Time:", now);

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

    console.log("Future Events:", futureEvents);

    // Hauptcontainer für Events
    const baseContainer = document.createElement("div");
    baseContainer.className = "events-container";

    futureEvents.forEach(event => {
      let formattedDate = "";
      const eventDescription = event.description || "";

      if (eventDescription) {
        const dateMatch = eventDescription.match(/Date: (.*)/);
        if (dateMatch && dateMatch[1]) {
          formattedDate = dateMatch[1];
        }
      }

      if (!formattedDate) {
        formattedDate = event.startTime.toLocaleString([], {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
      }

      const eventDiv = document.createElement("div");
      eventDiv.className = "event";

      // Visual (Pipe) mit der Farbe
      const visualDiv = document.createElement("div");
      visualDiv.className = "visual";
      visualDiv.style.backgroundColor = this.getPipeColor(eventDescription); // Pipe Farbe

      // Event-Icon rechts neben der Pipe
      const iconSpan = document.createElement("span");
      iconSpan.className = this.getEventIcon(eventDescription) + " icon";

      // Container für Event-Titel und Datum
      const detailsDiv = document.createElement("div");
      detailsDiv.className = "details";

      const titleDiv = document.createElement("div");
      titleDiv.className = "title";
      titleDiv.innerHTML = event.title;

      const subtitleDiv = document.createElement("div");
      subtitleDiv.className = "subtitle";
      subtitleDiv.innerHTML = formattedDate;

      // Füge Titel und Datum zu den Details hinzu
      detailsDiv.appendChild(titleDiv);
      detailsDiv.appendChild(subtitleDiv);

      // Füge Visual (Pipe), Icon und Details zum Event-Div hinzu
      eventDiv.appendChild(visualDiv);
      eventDiv.appendChild(iconSpan);
      eventDiv.appendChild(detailsDiv);

      // Füge Event-Div zum Hauptcontainer hinzu
      baseContainer.appendChild(eventDiv);
    });

    wrapper.appendChild(baseContainer);
    return wrapper;
  },

  socketNotificationReceived: function (notification, payload) {
    if (notification === "CALENDAR_DATA_RECEIVED") {
      this.calendarData = payload;

      this.calendarData.forEach(event => {
        if (!(event.startTime instanceof Date)) {
          event.startTime = new Date(event.startTime);
        }
        if (!(event.endTime instanceof Date)) {
          event.endTime = new Date(event.endTime);
        }
      });

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
      return "fas fa-users";
    } else if (eventDescription.includes("Category: holidays")) {
      return "fas fa-umbrella-beach";
    } else if (eventDescription.includes("Category: family")) {
      return "fas fa-home";
    } else if (eventDescription.includes("Category: studium")) {
      return "fas fa-book";
    } else if (eventDescription.includes("Category: andere Termine")) {
      return "fas fa-calendar-alt";
    } else if (eventDescription.includes("Category: Geburtstage")) {
      return "fas fa-birthday-cake";
    } else if (eventDescription.includes("Category: arzt")) {
      return "fas fa-stethoscope";
    } else if (eventDescription.includes("Category: Verbindung")) {
      return "fas fa-network-wired";
    } else if (eventDescription.includes("Category: Arbeit")) {
      return "fas fa-briefcase";
    } else {
      return this.config.defaultIcon; // Verwende das Standard-Icon
    }
  },

  getPipeColor: function (eventDescription) {
    if (eventDescription.includes("Category: meet friends")) {
      return "#FF6347";
    } else if (eventDescription.includes("Category: holidays")) {
      return "#FFD700";
    } else if (eventDescription.includes("Category: family")) {
      return "#1E90FF";
    } else if (eventDescription.includes("Category: studium")) {
      return "#32CD32";
    } else if (eventDescription.includes("Category: andere Termine")) {
      return "#FFFFFF";
    } else if (eventDescription.includes("Category: Geburtstage")) {
      return "#FF69B4";
    } else if (eventDescription.includes("Category: arzt")) {
      return "#8A2BE2";
    } else if (eventDescription.includes("Category: Verbindung")) {
      return "#FF4500";
    } else if (eventDescription.includes("Category: Arbeit")) {
      return "#A52A2A";
    } else {
      return this.config.defaultColor; // Verwende die Standardfarbe
    }
  }
});