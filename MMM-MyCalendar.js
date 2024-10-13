/* MMM-MyCalendar.js */

Module.register("MMM-MyCalendar", {
  defaults: {
    calendarUrls: {},  // Objekt für Kalender-URLs und Kategorien
    eventSettings: {}, // Einstellungen für Icons und Farben
    updateInterval: 60 * 60 * 1000, // Aktualisierung alle 60 Minuten
    fadeSpeed: 4000,
    maximumEntries: 10 // Maximale Anzahl der angezeigten Einträge
  },

  getStyles: function () {
    return ["MMM-MyCalendar.css"];
  },

  // Einbindung von Luxon
  getScripts: function() {
    return ["https://cdnjs.cloudflare.com/ajax/libs/luxon/3.0.1/luxon.min.js"];
  },

  start: function () {
    Log.info("Starting module: " + this.name);
    this.calendarData = [];
    this.getData();  // Kalenderdaten laden
    this.scheduleUpdate();  // Regelmäßige Updates planen
  },

  getData: function () {
    console.log("Sending GET_CALENDAR_DATA notification to node_helper...");
    this.sendSocketNotification("GET_CALENDAR_DATA", {
      urls: this.config.calendarUrls,
      eventSettings: this.config.eventSettings
    });
  },

  socketNotificationReceived: function (notification, payload) {
    console.log("Module received notification:", notification);
    if (notification === "CALENDAR_DATA_RECEIVED") {
      this.calendarData = payload;
      console.log("Empfangene Ereignisse vom node_helper:", this.calendarData.length);
      this.updateDom(this.config.fadeSpeed);
    }
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

    // Aktuelle Zeit in UTC
    const now = luxon.DateTime.utc();

    // Füge Logausgabe hinzu, um die aktuellen Zeiten zu überprüfen
    console.log("Aktuelle Zeit (UTC):", now.toISO());

    // Filtere und sortiere zukünftige Ereignisse
    const futureEvents = this.calendarData
      .filter(event => {
        // Konvertiere event.startTime in Luxon DateTime in UTC
        let eventTime = luxon.DateTime.fromISO(event.startTime, { zone: 'utc' });

        // Füge Logausgabe hinzu, um die Ereigniszeiten zu überprüfen
        console.log("Ereignis:", event.title);
        console.log("Ereigniszeit (UTC):", eventTime.toISO());

        // Vergleich der Zeiten
        const isFutureEvent = eventTime > now;

        console.log("Ist zukünftiges Ereignis:", isFutureEvent);

        return isFutureEvent;
      })
      .sort((a, b) => {
        let aTime = luxon.DateTime.fromISO(a.startTime, { zone: 'utc' });
        let bTime = luxon.DateTime.fromISO(b.startTime, { zone: 'utc' });
        return aTime - bTime;
      })
      .slice(0, this.config.maximumEntries);

    console.log("Anzahl der zukünftigen Ereignisse:", futureEvents.length);

    const baseContainer = document.createElement("div");
    baseContainer.className = "events-container";

   // In der Darstellung der Ereignisse
    futureEvents.forEach(event => {
      // Konvertiere die Ereigniszeit in lokale Zeitzone für die Darstellung
      let eventTime = luxon.DateTime.fromISO(event.startTime, { zone: 'utc' }).setZone('local');
      let formattedDate;

      if (event.allDay) {
        // Formatierung für ganztägige Ereignisse
        formattedDate = eventTime.toLocaleString(luxon.DateTime.DATE_MED);
      } else {
        formattedDate = eventTime.toLocaleString(luxon.DateTime.DATETIME_MED);
      }

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

  scheduleUpdate: function () {
    setInterval(() => {
      this.getData();
    }, this.config.updateInterval);
  }
});