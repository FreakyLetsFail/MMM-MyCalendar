var NodeHelper = require("node_helper");
const ical = require("ical");
const axios = require("axios");

module.exports = NodeHelper.create({
  start: function () {
    console.log("MMM-MyCalendar helper started...");
  },

  socketNotificationReceived: function (notification, payload) {
    if (notification === "GET_CALENDAR_DATA") {
      this.getCalendarData(payload.url);
    }
  },

  getCalendarData: function (url) {
    var self = this;

    // Lade die Daten von der Kalender-URL herunter
    axios.get(url)
      .then((response) => {
        const calendarData = ical.parseICS(response.data); // Parse die ICS-Daten
        const events = self.formatCalendarData(calendarData);
        self.sendSocketNotification("CALENDAR_DATA_RECEIVED", events);
      })
      .catch((error) => {
        console.error("Error fetching calendar data: ", error);
      });
  },

  formatCalendarData: function (calendarData) {
    const events = [];

    for (const k in calendarData) {
      const event = calendarData[k];
      if (event.type === "VEVENT") {
        events.push({
          title: event.summary,
          startTime: this.formatTime(event.start),
          endTime: this.formatTime(event.end)
        });
      }
    }

    return events;
  },

  formatTime: function (dateTime) {
    const date = new Date(dateTime);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
});
