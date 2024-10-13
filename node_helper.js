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
                  startTime: startTime.toISO(), // Speichere als ISO-String
                  endTime: endTime.toISO(),
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

  // Angepasste Funktion zum Parsen der Ereignisdaten mit Luxon
  parseEventDate: function (eventDate) {
    if (!eventDate) {
      return null;
    }

    if (eventDate instanceof Date) {
      // Wenn es ein Date-Objekt ist, konvertiere es mit Luxon
      return DateTime.fromJSDate(eventDate, { zone: 'utc' });
    } else if (typeof eventDate === 'object') {
      // Wenn es ein Objekt ist, das Zeitzoneninformationen enthält
      const { tz, ical, value } = eventDate;
      let dateTimeStr = ical || value;

      if (!dateTimeStr) {
        return null;
      }

      console.log("Parsing date string:", dateTimeStr);

      // Bestimme das richtige Format
      let format = "";

      if (dateTimeStr.endsWith('Z')) {
        // UTC-Zeit mit 'Z' am Ende
        format = "yyyyLLdd'T'HHmmss'Z'";
      } else if (/[+-]\d{4}$/.test(dateTimeStr)) {
        // Zeit mit Zeitzonenoffset
        format = "yyyyLLdd'T'HHmmssZZ";
      } else if (/^\d{8}$/.test(dateTimeStr)) {
        // Ganztägiges Ereignis ohne Zeitangabe
        format = "yyyyLLdd";
      } else {
        // Standardformat ohne Zeitzoneninformationen
        format = "yyyyLLdd'T'HHmmss";
      }

      // Verwende die Zeitzone, falls verfügbar, ansonsten UTC
      const zone = tz || 'utc';

      const parsedDate = DateTime.fromFormat(dateTimeStr, format, { zone: zone });

      if (!parsedDate.isValid) {
        console.error("Fehler beim Parsen des Datums:", dateTimeStr);
        return null;
      }

      console.log("Parsed DateTime:", parsedDate.toISO());

      return parsedDate;
    } else if (typeof eventDate === 'string') {
      // Wenn es ein String ist, versuche es direkt zu parsen
      const parsedDate = DateTime.fromISO(eventDate, { zone: 'utc' });

      if (!parsedDate.isValid) {
        console.error("Fehler beim Parsen des Datums:", eventDate);
        return null;
      }

      return parsedDate;
    }

    return null;
  }
});