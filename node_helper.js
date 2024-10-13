const NodeHelper = require("node_helper");
const ical = require("ical");
const https = require("https");

module.exports = NodeHelper.create({
  start: function () {
    console.log("MMM-MyCalendar helper started...");
  },

  socketNotificationReceived: function (notification, payload) {
    if (notification === "GET_CALENDAR_DATA") {
      this.getCalendarData(payload.urls, payload.eventSettings); // Event-Einstellungen übergeben
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
                // Loggen der rohen Datumswerte
                console.log("Raw event.start:", event.start);
                console.log("Raw event.end:", event.end);
  
                // Angepasstes Parsing der Datumswerte
                const startTime = parseCustomDateTime(event.start);
                const endTime = parseCustomDateTime(event.end);
  
                // Überprüfen auf gültige Datumswerte
                if (isNaN(startTime) || isNaN(endTime)) {
                  console.error("Ungültiges Datum für Ereignis:", event.summary);
                  continue; // Überspringe dieses Ereignis
                }
  
                let description = event.description || "";
                description += `\nCategory: ${category}`;
  
                const icon = eventSettings[category]?.icon || "fas fa-calendar-alt";
                const color = eventSettings[category]?.color || "#FFFFFF";
  
                events.push({
                  title: event.summary,
                  startTime: startTime,
                  endTime: endTime,
                  description: description,
                  icon: icon,
                  color: color
                });
              }
            }
            resolve();
          });
        }).on("error", (err) => {
          console.error("Error fetching calendar URL: ", err);
          reject(err);
        });
      });
    });
  
    try {
      await Promise.all(fetchPromises);
      console.log("Gesamtzahl der verarbeiteten Ereignisse:", events.length);
      self.sendSocketNotification("CALENDAR_DATA_RECEIVED", events);
    } catch (error) {
      console.error("Fehler beim Abrufen der Kalenderdaten:", error);
    }
  }
});