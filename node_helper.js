/* node_helper.js */

const NodeHelper = require("node_helper");
const ical = require("ical");
const https = require("https");
const { DateTime } = require('luxon'); // Luxon zur Zeitzonenbehandlung

module.exports = NodeHelper.create({
  start: function () {
    console.log("MMM-MyCalendar helper started...");
  },

  socketNotificationReceived: function (notification, payload) {
    console.log("node_helper hat Benachrichtigung erhalten:", notification);
    if (notification === "TEST_NOTIFICATION") {
      console.log("TEST_NOTIFICATION empfangen mit Payload:", payload);
      this.sendSocketNotification("TEST_RESPONSE", { success: true });
    }
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

        https.get(httpsUrl, (res) => {
          let data = "";

          res.on("data", (chunk) => {
            data += chunk;
          });

          res.on("end", () => {
            const calendarData = ical.parseICS(data);

            for (const key in calendarData) {
              const event = calendarData[key];
              if (event.type === "VEVENT") {
                // Verwende Luxon, um die Start- und Endzeiten zu parsen
                let startTime = self.parseEventDate(event.start);
                let endTime = self.parseEventDate(event.end);

                // Überprüfen auf gültige Datumswerte
                if (!startTime || !endTime) {
                  console.error("Ungültiges Datum für Ereignis:", event.summary);
                  continue; // Überspringe dieses Ereignis
                }

                let description = event.description || "";
                description += `\nCategory: ${category}`;

                const icon = eventSettings[category]?.icon || "fas fa-calendar-alt";
                const color = eventSettings[category]?.color || "#FFFFFF";

                events.push({
                  title: event.summary,
                  startTime: startTime.toJSDate(),
                  endTime: endTime.toJSDate(),
                  description: description,
                  icon: icon,
                  color: color
                });
              }
            }
            console.log(`Anzahl der Ereignisse nach Verarbeitung von ${httpsUrl}:`, events.length);
            resolve();
          });
        }).on("error", (err) => {
          console.error("Fehler beim Abrufen der Kalender-URL:", httpsUrl, err);
          // Wichtig: resolve() aufrufen, damit Promise.all nicht hängen bleibt
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
  },

  // Funktion zum Parsen der Ereignisdaten mit Luxon
  parseEventDate: function (eventDate) {
    if (!eventDate) {
      return null;
    }

    if (eventDate instanceof Date) {
      // Wenn es ein Date-Objekt ist, konvertiere es mit Luxon
      return DateTime.fromJSDate(eventDate);
    } else if (typeof eventDate === 'object') {
      // Wenn es ein Objekt ist, das Zeitzoneninformationen enthält
      const { tz, ical, value } = eventDate;
      let dateTimeStr = ical || value;

      if (!dateTimeStr) {
        return null;
      }

      // Versuche, das Datum mit dem Format von iCal zu parsen
      const format = "yyyyLLdd'T'HHmmss";
      // Verwende die Zeitzone, falls verfügbar, ansonsten UTC
      const zone = tz || 'UTC';

      return DateTime.fromFormat(dateTimeStr, format, { zone: zone });
    } else if (typeof eventDate === 'string') {
      // Wenn es ein String ist, versuche es direkt zu parsen
      return DateTime.fromISO(eventDate);
    }

    return null;
  }
});