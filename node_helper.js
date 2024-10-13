const NodeHelper = require("node_helper");
const ical = require("ical");  // Verwende das 'ical'-Modul, um die ICS-Daten zu verarbeiten
const https = require("https");

module.exports = NodeHelper.create({
  start: function () {
    console.log("MMM-MyCalendar helper started...");
  },

  socketNotificationReceived: function (notification, payload) {
    if (notification === "GET_CALENDAR_DATA") {
      this.getCalendarData(payload.urls);
    }
  },

  getCalendarData: function (urls) {
    const self = this;
    const events = [];

    for (const [url, category] of Object.entries(urls)) {
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
              events.push({
                title: event.summary,
                startTime: new Date(event.start),
                endTime: new Date(event.end),
                description: event.description || `Category: ${category}`
              });
            }
          }
          // Sende die verarbeiteten Ereignisdaten zurück an das Frontend
          self.sendSocketNotification("CALENDAR_DATA_RECEIVED", events);
        });
      }).on("error", (err) => {
        console.error("Error fetching calendar URL: ", err);
      });
    }
  }
});