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
    this.getData();
    this.scheduleUpdate();
  },

  getData: function () {
    this.calendarData = []; // Leere Kalenderdaten initialisieren
    const now = new Date();

    // Iteriere durch alle Kalender-URLs in der Konfiguration
    for (const [url, category] of Object.entries(this.config.calendarUrls)) {
      const httpsUrl = url.replace("webcal://", "https://");

      // Kalenderdaten über fetch abrufen
      fetch(httpsUrl)
        .then(response => response.text())
        .then(data => {
          const calendar = new ICAL.Component(ICAL.parse(data)); // ICAL.js verwenden zum Parsen
          const events = calendar.getAllSubcomponents("vevent");

          events.forEach(event => {
            const startTime = new Date(event.getFirstPropertyValue("dtstart"));
            if (startTime > now) { // Nur zukünftige Ereignisse
              const formattedDate = startTime.toLocaleString([], {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              });
              this.calendarData.push({
                title: event.getFirstPropertyValue("summary"),
                description: `Category: ${category}\nDate: ${formattedDate}`,
                startTime: startTime
              });
            }
          });
          this.updateDom(this.config.fadeSpeed); // UI aktualisieren
        })
        .catch(error => {
          Log.error(`Error fetching calendar from URL ${httpsUrl}: ${error}`);
        });
    }
  },


  getDom: function () {
    const wrapper = document.createElement("div");

    if (!this.calendarData) {
      wrapper.innerHTML = "Loading calendar...";
      return wrapper;
    }

    const now = new Date();
    console.log("Current Time:", now);

    // Filtere nur zukünftige Ereignisse und sortiere sie nach Startdatum
    const futureEvents = this.calendarData
      .filter(event => {
        // Sicherstellen, dass event.startTime ein Date-Objekt ist
        if (!(event.startTime instanceof Date) || isNaN(event.startTime)) {
          event.startTime = new Date(event.startTime);
        }
        return event.startTime > now;
      })
      .sort((a, b) => a.startTime - b.startTime)
      .slice(0, this.config.maximumEntries);

    console.log("Future Events:", futureEvents);

    // Hauptcontainer im Stil von MMM-OnSpotify
    const baseContainer = document.createElement("div");
    baseContainer.className = "ONSP-Base";

    futureEvents.forEach(event => {
      // Extrahiere das formatierte Datum aus der Beschreibung
      let formattedDate = "";
      const eventDescription = event.description || "";

      if (eventDescription) {
        const dateMatch = eventDescription.match(/Date: (.*)/);
        if (dateMatch && dateMatch[1]) {
          formattedDate = dateMatch[1];
        }
      }

      // Falls kein formatiertes Datum vorhanden ist, formatieren wir es hier
      if (!formattedDate) {
        formattedDate = event.startTime.toLocaleString([], {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
      }

      // 'player' Div
      const playerDiv = document.createElement("div");
      playerDiv.className = "player";

      // 'header' Div
      const headerDiv = document.createElement("div");
      headerDiv.className = "header";

      // 'icon' Span (das Icon)
      const iconSpan = document.createElement("span");
      iconSpan.className = this.getEventIcon(eventDescription) + " icon";

      // 'visual' Div (die Pipe)
      const visualDiv = document.createElement("div");
      visualDiv.className = "visual";

      // Setze die Farbe der Pipe basierend auf der Kategorie
      const pipeColor = this.getPipeColor(eventDescription);
      if (pipeColor) {
        visualDiv.style.backgroundColor = pipeColor;
      }

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

      // Konvertiere startTime und endTime in Date-Objekte, falls nötig
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
