/* Magic Mirror
 * Module: MMM-MyCalendar
 */

Module.register("MMM-MyCalendar", {
  defaults: {
    calendarUrl: "", // URL zu deiner kombinierten .ics-Datei
    updateInterval: 60 * 60 * 1000, // Aktualisierung alle 60 Minuten
    fadeSpeed: 4000
  },

  start: function () {
    Log.info("Starting module: " + this.name);
    this.calendarData = null;
    this.getData();
    this.scheduleUpdate();
  },

  getData: function () {
    var self = this;
    var url = this.config.calendarUrl;
    if (url === "") {
      Log.error("Calendar URL is not configured.");
      return;
    }

    self.sendSocketNotification("GET_CALENDAR_DATA", { url: url });
  },

  getDom: function () {
    var wrapper = document.createElement("div");

    if (!this.calendarData) {
      wrapper.innerHTML = "Loading calendar...";
      return wrapper;
    }

    var calendarWrapper = document.createElement("div");
    calendarWrapper.className = "calendarWrapper";

    this.calendarData.forEach((event) => {
      var eventElement = document.createElement("div");
      eventElement.className = "calendarEvent";

      // Icon basierend auf der Kategorie hinzufügen
      var icon = document.createElement("span");
      icon.className = this.getEventIcon(event.description); // Kategorie in der Beschreibung
      eventElement.appendChild(icon);

      var eventTitle = document.createElement("div");
      eventTitle.className = "eventTitle";
      eventTitle.innerHTML = event.title;
      eventElement.appendChild(eventTitle);

      var eventTime = document.createElement("div");
      eventTime.className = "eventTime";
      eventTime.innerHTML = event.startTime + " - " + event.endTime;
      eventElement.appendChild(eventTime);

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
    var self = this;
    setInterval(function () {
      self.getData();
    }, this.config.updateInterval);
  },

  // Funktion zum Abrufen des passenden Icons basierend auf der Kategorie in der Beschreibung
  getEventIcon: function (eventDescription) {
    if (eventDescription.includes("Category: meet friends")) {
      return "fas fa-users"; // Icon für Treffen mit Freunden
    } else if (eventDescription.includes("Category: holidays")) {
      return "fas fa-umbrella-beach"; // Icon für Urlaub
    } else if (eventDescription.includes("Category: family")) {
      return "fas fa-home"; // Icon für Familienveranstaltungen
    } else if (eventDescription.includes("Category: studium")) {
      return "fas fa-book"; // Icon für Studium
    } else if (eventDescription.includes("Category: andere Termine")) {
      return "fas fa-calendar-alt"; // Icon für andere Termine
    } else if (eventDescription.includes("Category: Geburtstage")) {
      return "fas fa-birthday-cake"; // Icon für Geburtstage
    } else if (eventDescription.includes("Category: arzt")) {
      return "fas fa-stethoscope"; // Icon für Arzttermine
    } else if (eventDescription.includes("Category: Verbindung")) {
      return "fas fa-network-wired"; // Icon für Verbindungen
    } else if (eventDescription.includes("Category: Arbeit")) {
      return "fas fa-briefcase"; // Icon für Arbeit
    } else {
      return "fas fa-calendar-alt"; // Standard-Icon
    }
  }
});
