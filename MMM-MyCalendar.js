/* Magic Mirror
 * Module: MMM-MyCalendar
 *
 * By Your Name
 * MIT Licensed.
 */

Module.register("MMM-MyCalendar", {
  // Default module config
  defaults: {
    calendarUrl: "", // Webcal URL hier einfügen
    updateInterval: 60 * 60 * 1000, // 1 Stunde
    fadeSpeed: 4000
  },

  // Override start method
  start: function () {
    Log.info("Starting module: " + this.name);
    this.calendarData = null;
    this.getData();
    this.scheduleUpdate();
  },

  // Fetch the data from the webcal URL
  getData: function () {
    var self = this;
    var url = this.config.calendarUrl;
    if (url === "") {
      Log.error("Calendar URL is not configured.");
      return;
    }

    self.sendSocketNotification("GET_CALENDAR_DATA", { url: url });
  },

  // Override dom generator
  getDom: function () {
    var wrapper = document.createElement("div");

    if (!this.calendarData) {
      wrapper.innerHTML = "Loading calendar...";
      return wrapper;
    }

    // Create calendar display
    var calendarWrapper = document.createElement("div");
    calendarWrapper.className = "calendarWrapper";

    this.calendarData.forEach((event) => {
      var eventElement = document.createElement("div");
      eventElement.className = "calendarEvent";

      var eventTitle = document.createElement("div");
      eventTitle.className = "eventTitle";
      eventTitle.innerHTML = event.title;
      eventElement.appendChild(eventTitle);

      var eventTime = document.createElement("div");
      eventTime.className = "eventTime";
      eventTime.innerHTML = event.startTime + " - " + event.endTime;
      eventElement.appendChild(eventTime);

      calendarWrapper.appendChild(eventElement);
    });

    wrapper.appendChild(calendarWrapper);
    return wrapper;
  },

  // Handle notifications
  socketNotificationReceived: function (notification, payload) {
    if (notification === "CALENDAR_DATA_RECEIVED") {
      this.calendarData = payload;
      this.updateDom(this.config.fadeSpeed);
    }
  },

  // Schedule update
  scheduleUpdate: function () {
    var self = this;
    setInterval(function () {
      self.getData();
    }, this.config.updateInterval);
  }
});
