const NodeHelper = require("node_helper");
const ical = require("node-ical");
const { DateTime } = require('luxon');

module.exports = NodeHelper.create({
  start: function () {
    console.log("MMM-MyCalendar helper started...");
  },

  socketNotificationReceived: function (notification, payload) {
    if (notification === "GET_CALENDAR_DATA") {
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
              let startTime = DateTime.fromJSDate(event.start);
              let endTime = DateTime.fromJSDate(event.end);

              if (!startTime.isValid || !endTime.isValid) {
                console.error("Ungültiges Datum für Ereignis:", event.summary);
                continue;
              }

              // Überprüfen, ob das Event wiederkehrend ist
              if (event.rrule) {
                // Wiederkehrende Ereignisse verarbeiten
                const rule = event.rrule;
                const futureInstances = rule.between(new Date(), new Date(Date.now() + 1000 * 60 * 60 * 24 * 30)); // Berechne Vorkommen in den nächsten 30 Tagen

                futureInstances.forEach(instance => {
                  const instanceStart = DateTime.fromJSDate(instance);
                  const instanceEnd = instanceStart.plus({ minutes: endTime.diff(startTime, 'minutes').minutes });

                  events.push({
                    title: event.summary,
                    startTime: instanceStart.toISO(),
                    endTime: instanceEnd.toISO(),
                    description: event.description || `\nCategory: ${category}`,
                    icon: eventSettings[category]?.icon || "fas fa-calendar-alt",
                    color: eventSettings[category]?.color || "#FFFFFF",
                    allDay: event.datetype === 'date'
                  });
                });
              } else {
                // Normale Ereignisse verarbeiten
                events.push({
                  title: event.summary,
                  startTime: startTime.toISO(),
                  endTime: endTime.toISO(),
                  description: event.description || `\nCategory: ${category}`,
                  icon: eventSettings[category]?.icon || "fas fa-calendar-alt",
                  color: eventSettings[category]?.color || "#FFFFFF",
                  allDay: event.datetype === 'date'
                });
              }
            }
          }
          resolve();
        });
      });
    });

    try {
      await Promise.all(fetchPromises);
      self.sendSocketNotification("CALENDAR_DATA_RECEIVED", events);
    } catch (error) {
      console.error("Fehler beim Abrufen der Kalenderdaten:", error);
    }
  }
});