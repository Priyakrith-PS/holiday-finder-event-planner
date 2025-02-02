document.addEventListener("DOMContentLoaded", () => {
  const API_KEY = "WMPASUmVhcHfx90sN8rsRuFVtVZVknch";
  const API_BASE = "https://calendarific.com/api/v2";

  const searchButton = document.getElementById("searchButton");
  const resultsDiv = document.getElementById("results");
  const countrySelect = document.getElementById("countrySelect");
  const popup = document.getElementById("popup");
  const eventList = document.getElementById("events");

  const calendarToggle = document.getElementById("calendarToggle");
  const calendarContainer = document.getElementById("calendarContainer");
  const calendarDays = document.getElementById("calendarDays");
  const currentMonthDisplay = document.getElementById("currentMonth");
  const calendarSearchError = document.getElementById("calendarSearchError");
  const calendarCountrySelect = document.getElementById(
    "calendarCountrySelect"
  );
  const calendarHolidayType = document.getElementById("calendarHolidayType");
  const holidayListDiv = document.getElementById("holidayList");

  let currentMonthDate = new Date();
  let currentHolidays = [];

  const fetchCountries = async () => {
    try {
      const response = await fetch(`${API_BASE}/countries?api_key=${API_KEY}`);
      const data = await response.json();
      if (data.meta.code === 200) {
        const sortedCountries = data.response.countries.sort((a, b) =>
          a.country_name.localeCompare(b.country_name)
        );
        sortedCountries.forEach((country) => {
          const optionMain = document.createElement("option");
          optionMain.value = country["iso-3166"];
          optionMain.textContent = country.country_name;
          countrySelect.appendChild(optionMain);

          const optionCal = document.createElement("option");
          optionCal.value = country["iso-3166"];
          optionCal.textContent = country.country_name;
          calendarCountrySelect.appendChild(optionCal);
        });
      } else {
        resultsDiv.innerHTML = `<p class="error">Error loading countries: ${data.error}</p>`;
      }
    } catch (error) {
      console.error("Country fetch error:", error);
      resultsDiv.innerHTML = `<p class="error">Failed to load countries list</p>`;
    }
  };

  function loadEvents() {
    eventList.innerHTML = "";
    const events = JSON.parse(localStorage.getItem("events")) || [];
    events.forEach((event) => {
      const li = document.createElement("li");
      li.textContent = event.name;
      li.addEventListener("click", () => showEventDetails(event));
      eventList.appendChild(li);
    });
  }

  function showEventDetails(event) {
    const detailsPopup = document.getElementById("detailsPopup");
    document.getElementById("detailsTitle").textContent = event.name;
    document.getElementById("detailsDate").textContent = event.date || "N/A";
    document.getElementById("detailsDescription").textContent =
      event.details || "No description available";
    document.getElementById("detailsLocation").textContent =
      event.location || "N/A";
    document.getElementById("detailsType").textContent = event.type || "N/A";
    detailsPopup.style.display = "flex";
  }

  searchButton.addEventListener("click", async () => {
    const country = countrySelect.value;
    const type = document.getElementById("holidayType").value;
    const startDate = document.getElementById("startDate").value;
    const endDate = document.getElementById("endDate").value;
    if (!country) {
      alert("Please select a country");
      return;
    }
    if (!startDate || !endDate) {
      alert("Please select both start and end dates");
      return;
    }
    const year = new Date(startDate).getFullYear();
    const url = `${API_BASE}/holidays?api_key=${API_KEY}&country=${country}&year=${year}&type=${type}`;
    try {
      const response = await fetch(url);
      const data = await response.json();
      if (data.meta.code === 200) {
        displayHolidays(data.response.holidays, startDate, endDate);
      } else {
        resultsDiv.innerHTML = `<p class="error">Error: ${data.error}</p>`;
      }
    } catch (error) {
      console.error("Error:", error);
      resultsDiv.innerHTML = `<p class="error">Failed to fetch holidays</p>`;
    }
  });

  function displayHolidays(holidays, startDate, endDate) {
    resultsDiv.innerHTML = "";
    const start = new Date(startDate);
    const end = new Date(endDate);

    currentHolidays = holidays.filter((holiday) => {
      const holidayDate = new Date(holiday.date.iso);
      return holidayDate >= start && holidayDate <= end;
    });
    currentHolidays.forEach((holiday) => {
      const card = document.createElement("div");
      card.className = "holiday-card";
      card.innerHTML = `
        <h3>${holiday.name}</h3>
        <div class="holiday-details">
          <p>📅 ${holiday.date.iso}</p>
          <p>📍 ${holiday.locations || "N/A"}</p>
          <p>🏷️ ${holiday.type.join(", ")}</p>
        </div>
      `;
      card.addEventListener("click", () => openCreationPopup(holiday));
      resultsDiv.appendChild(card);
    });

    if (calendarContainer.style.display === "block") {
      fetchCalendarHolidays();
    }
  }

  async function fetchCalendarHolidays() {
    const country = calendarCountrySelect.value;
    const type = calendarHolidayType.value;
    calendarSearchError.textContent = "";

    if (!country) {
      currentHolidays = [];
      renderCalendarMonth(currentMonthDate);
      updateHolidayList();
      return;
    }
    const year = currentMonthDate.getFullYear();
    const url = `${API_BASE}/holidays?api_key=${API_KEY}&country=${country}&year=${year}&type=${type}`;
    try {
      const response = await fetch(url);
      const data = await response.json();
      if (data.meta.code === 200) {
        currentHolidays = data.response.holidays.filter((holiday) => {
          const hDate = new Date(holiday.date.iso);
          return hDate.getMonth() === currentMonthDate.getMonth();
        });
        renderCalendarMonth(currentMonthDate);
        updateHolidayList();
      } else {
        calendarSearchError.textContent = `Error: ${data.error}`;
      }
    } catch (error) {
      console.error("Calendar search error:", error);
      calendarSearchError.textContent = "Failed to fetch holidays.";
    }
  }

  function renderCalendarMonth(date) {
    calendarDays.innerHTML = "";
    const year = date.getFullYear();
    const month = date.getMonth();
    currentMonthDisplay.textContent = date.toLocaleString("default", {
      month: "long",
      year: "numeric",
    });
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    for (let day = 1; day <= daysInMonth; day++) {
      const dayCell = document.createElement("div");
      dayCell.classList.add("day-cell");
      dayCell.textContent = day;
      const cellDate = new Date(year, month, day);

      const holidayForDay = currentHolidays.find((h) => {
        const hDate = new Date(h.date.iso);
        return (
          hDate.getFullYear() === cellDate.getFullYear() &&
          hDate.getMonth() === cellDate.getMonth() &&
          hDate.getDate() === cellDate.getDate()
        );
      });
      if (holidayForDay) {
        dayCell.classList.add("holiday");
        dayCell.addEventListener("click", () =>
          openCreationPopup(holidayForDay)
        );
      }
      calendarDays.appendChild(dayCell);
    }
  }

  function updateHolidayList() {
    holidayListDiv.innerHTML = "";
    if (currentHolidays.length === 0) {
      holidayListDiv.textContent =
        "No holidays found for the applied filters in this month.";
      return;
    }
    const ul = document.createElement("ul");
    currentHolidays.forEach((holiday) => {
      const li = document.createElement("li");
      li.textContent = `${holiday.name} – ${new Date(
        holiday.date.iso
      ).toLocaleDateString()}`;
      li.addEventListener("click", () => openCreationPopup(holiday));
      ul.appendChild(li);
    });
    holidayListDiv.appendChild(ul);
  }

  calendarCountrySelect.addEventListener("change", fetchCalendarHolidays);
  calendarHolidayType.addEventListener("change", fetchCalendarHolidays);

  function openCreationPopup(holiday) {
    popup.style.display = "flex";
    const popupContent = document.querySelector(".popup-content");
    popupContent.innerHTML = `
      <div class="popup-left">
        <h3>${holiday.name}</h3>
        <div class="holiday-details">
          <p><strong>📅 Date:</strong> ${holiday.date.iso}</p>
          <p><strong>📍 Location:</strong> ${holiday.locations || "N/A"}</p>
          <p><strong>🔖 Type:</strong> ${holiday.type.join(", ")}</p>
          <p><strong>📝 Description:</strong> ${
            holiday.description || "No description available"
          }</p>
        </div>
      </div>
      <div class="popup-right">
        <h3>Create New Event</h3>
        <textarea id="eventDetails" placeholder="Add your event description..." class="styled-textarea"></textarea>
        <div class="button-group">
          <button id="saveEventButton" class="styled-button">💾 Create Event</button>
          <button id="closePopupButton" class="styled-button secondary">✖ Close</button>
        </div>
      </div>
    `;
    const saveEventButton = document.getElementById("saveEventButton");
    saveEventButton.addEventListener("click", () => {
      const details = document.getElementById("eventDetails").value;
      if (!details.trim()) {
        alert("Please enter an event description");
        return;
      }
      const events = JSON.parse(localStorage.getItem("events")) || [];
      events.push({
        name: holiday.name,
        details,
        date: holiday.date.iso,
        location: holiday.locations || "N/A",
        type: holiday.type.join(", "),
      });
      localStorage.setItem("events", JSON.stringify(events));
      popup.style.display = "none";
      loadEvents();
    });
    const closePopupButton = document.getElementById("closePopupButton");
    closePopupButton.addEventListener("click", () => {
      popup.style.display = "none";
    });
  }

  window.addEventListener("click", (e) => {
    if (e.target.classList.contains("popup")) {
      popup.style.display = "none";
      document.getElementById("detailsPopup").style.display = "none";
    }
  });
  document.getElementById("closeDetailsPopup").addEventListener("click", () => {
    document.getElementById("detailsPopup").style.display = "none";
  });

  calendarToggle.addEventListener("click", () => {
    if (
      calendarContainer.style.display === "none" ||
      calendarContainer.style.display === ""
    ) {
      calendarContainer.style.display = "block";
      currentMonthDate = new Date();

      fetchCalendarHolidays();
    } else {
      calendarContainer.style.display = "none";
    }
  });

  document.getElementById("prevMonth").addEventListener("click", () => {
    currentMonthDate.setMonth(currentMonthDate.getMonth() - 1);
    fetchCalendarHolidays();
  });
  document.getElementById("nextMonth").addEventListener("click", () => {
    currentMonthDate.setMonth(currentMonthDate.getMonth() + 1);
    fetchCalendarHolidays();
  });
  document.getElementById("closeCalendar").addEventListener("click", () => {
    calendarContainer.style.display = "none";
  });

  fetchCountries();
  loadEvents();
});
