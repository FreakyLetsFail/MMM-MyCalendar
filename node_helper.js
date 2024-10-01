const fs = require("fs");
const ical = require("ical");

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
    
    // Verwende fs, um die Datei direkt vom Dateisystem zu lesen
    fs.readFile(filePath, "utf8", (err, data) => {
      if (err) {
        console.error("Error reading calendar file: ", err);
        return;
      }
      
      const calendarData = ical.parseICS(data);  // Parse die ICS-Daten
      const events = self.formatCalendarData(calendarData);  // Ereignisse formatieren
      self.sendSocketNotification("CALENDAR_DATA_RECEIVED", events);
    });
  },

  formatCalendarData: function (calendarData) {
    const events = [];
    
    for (const k in calendarData) {
      const event = calendarData[k];
      if (event.type === "VEVENT") {
        events.push({
          title: event.summary,
          startTime: event.start.toLocaleString(),
          endTime: event.end.toLocaleString(),
          description: event.description || ""
        });
      }
    }
    
    return events;
  }
});
