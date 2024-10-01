var NodeHelper = require("node_helper");
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
    axios.get(url)
      .then((response) => {
        const calendarData = self.parseCalendarData(response.data);
        self.sendSocketNotification("CALENDAR_DATA_RECEIVED", calendarData);
      })
      .catch((error) => {
        console.error("Error fetching calendar data: ", error);
      });
  },

  parseCalendarData: function (icsData) {
    // Hier kannst du die ics-Datei parsen
    const parsedData = []; // Kalender-Events hier hinein parsen
    return parsedData;
  }
});
