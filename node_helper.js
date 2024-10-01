const NodeHelper = require("node_helper");
const ical = require("ical");  // Verwende das 'ical'-Modul, um die ICS-Daten zu verarbeiten
const fs = require("fs");

module.exports = NodeHelper.create({
  start: function () {
    console.log("MMM-MyCalendar helper started...");
  },

  socketNotificationReceived: function (notification, payload) {
    if (notification === "GET_CALENDAR_DATA") {
      this.getCalendarData(payload.url);
    }
  },

  getCalendarData: function (filePath) {
    var self = this;

    // Lese die .ics-Datei direkt vom Dateisystem
    fs.readFile(filePath, "utf8", (err, data) => {
      if (err) {
        console.error("Error reading calendar file: ", err);
        return;
      }

      // ICS-Daten parsen
      const calendarData = ical.parseICS(data);

      // Formatierte Ereignisdaten zurückschicken
      const events = self.formatCalendarData(calendarData);
      self.sendSocketNotification("CALENDAR_DATA_RECEIVED", events);
    });
  },

  formatCalendarData: function (calendarData) {
    const events = [];

    for (const key in calendarData) {
      const event = calendarData[key];
      if (event.type === "VEVENT") {
        console.log("Event Start:", event.start);
        console.log("Event End:", event.end);
        console.log("Event Description:", event.description);
        events.push({
          title: event.summary,
          startTime: new Date(event.start), // Konvertiere zu Date-Objekt
          endTime: new Date(event.end),     // Konvertiere zu Date-Objekt
          description: event.description || ""
        });
      }
    }

    return events;
  }
});
