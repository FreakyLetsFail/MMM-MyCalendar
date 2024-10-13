/* node_helper.js */

const NodeHelper = require("node_helper");
const ical = require("node-ical");
const { DateTime } = require('luxon'); // Luxon zur Zeitzonenbehandlung

module.exports = NodeHelper.create({
  start: function () {
    console.log("MMM-MyCalendar helper started...");
  },

  socketNotificationReceived: function (notification, payload) {
    console.log("node_helper received notification:", notification);
    if (notification === "GET_CALENDAR_DATA") {
      console.log("Received GET_CALENDAR_DATA with payload:", payload);
      this.getCalendarData(payload.urls, payload.eventSettings);
    }
  },

  getCalendarData: async function (urls, eventSettings) {
    const self = this;
    const events = [];

    const fetchPromises = Object.entries(urls).map(([url, category]) => {
      return new Promise((resolve, reject) => {
        const httpsUrl = url.replace("webcal://", "https://");

        ical.fromURL(httpsUrl, {}, (err, data) => {
          if (err) {
            console.error("Fehler beim Abrufen der Kalender-URL:", httpsUrl, err);
            resolve();
            return;
          }

          for (const key in data) {
            const event = data[key];
            if (event.type === "VEVENT") {
              // Hier erhalten wir bereits alle Instanzen, einschließlich wiederkehrender Ereignisse
              let startTime = DateTime.fromJSDate(event.start);
              let endTime = DateTime.fromJSDate(event.end);

              if (!startTime.isValid || !endTime.isValid) {
                console.error("Ungültiges Datum für Ereignis:", event.summary);
                continue;
              }

              let description = event.description || "";
              description += `\nCategory: ${category}`;

              const icon = eventSettings[category]?.icon || "fas fa-calendar-alt";
              const color = eventSettings[category]?.color || "#FFFFFF";

              events.push({
                title: event.summary,
                startTime: startTime.toISO(),
                endTime: endTime.toISO(),
                description: description,
                icon: icon,
                color: color,
                allDay: event.datetype === 'date' // Markiert ganztägige Ereignisse
              });
            }
          }
          console.log(`Anzahl der Ereignisse nach Verarbeitung von ${httpsUrl}:`, events.length);
          resolve();
        });
      });
    });

    try {
      await Promise.all(fetchPromises);
      console.log("Gesamtzahl der verarbeiteten Ereignisse:", events.length);
      console.log("Sending CALENDAR_DATA_RECEIVED notification to frontend...");
      self.sendSocketNotification("CALENDAR_DATA_RECEIVED", events);
    } catch (error) {
      console.error("Fehler beim Abrufen der Kalenderdaten:", error);
    }
  }
});
