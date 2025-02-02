document.addEventListener("DOMContentLoaded", () => {
  const API_KEY = "WMPASUmVhcHfx90sN8rsRuFVtVZVknch";
  const API_BASE = "https://calendarific.com/api/v2";

  const searchButton = document.getElementById("searchButton");
  const resultsDiv = document.getElementById("results");
  const popup = document.getElementById("popup");
  const closePopupButton = document.getElementById("closePopupButton");
  const saveEventButton = document.getElementById("saveEventButton");
  const eventList = document.getElementById("events");
  const countrySelect = document.getElementById("countrySelect");

  // Fetch countries from API
  const fetchCountries = async () => {
    try {
      const response = await fetch(`${API_BASE}/countries?api_key=${API_KEY}`);
      const data = await response.json();

      if (data.meta.code === 200) {
        // Sort countries alphabetically
        const sortedCountries = data.response.countries.sort((a, b) =>
          a.country_name.localeCompare(b.country_name)
        );

        // Populate country dropdown
        sortedCountries.forEach((country) => {
          const option = document.createElement("option");
          option.value = country["iso-3166"];
          option.textContent = country.country_name;
          countrySelect.appendChild(option);
        });
      } else {
        resultsDiv.innerHTML = `<p class="error">Error loading countries: ${data.error}</p>`;
      }
    } catch (error) {
      console.error("Country fetch error:", error);
      resultsDiv.innerHTML = `<p class="error">Failed to load countries list</p>`;
    }
  };

  // Load saved events
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

  // Search holidays
  searchButton.addEventListener("click", async () => {
    const country = countrySelect.value;
    const type = document.getElementById("holidayType").value;
    const startDate = document.getElementById("startDate").value;
    const endDate = document.getElementById("endDate").value;

    if (!country) {
      alert("Please select a country");
      return;
    }

    const url = `${API_BASE}/holidays?api_key=${API_KEY}&country=${country}&year=2024&type=${type}`;

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

  // Display holidays
  function displayHolidays(holidays, startDate, endDate) {
    resultsDiv.innerHTML = "";
    const start = new Date(startDate);
    const end = new Date(endDate);

    holidays.forEach((holiday) => {
      const holidayDate = new Date(holiday.date.iso);
      if (holidayDate >= start && holidayDate <= end) {
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
      }
    });
  }

  // Popup handling
  function openCreationPopup(holiday) {
    popup.style.display = "flex";
    document.getElementById("eventName").value = holiday.name;
  }

  // Close popups
  window.addEventListener("click", (e) => {
    if (e.target.classList.contains("popup")) {
      popup.style.display = "none";
      document.getElementById("detailsPopup").style.display = "none";
    }
  });

  closePopupButton.addEventListener("click", () => {
    popup.style.display = "none";
  });

  document.getElementById("closeDetailsPopup").addEventListener("click", () => {
    document.getElementById("detailsPopup").style.display = "none";
  });

  // Save event
  saveEventButton.addEventListener("click", () => {
    const name = document.getElementById("eventName").value;
    const details = document.getElementById("eventDetails").value;

    if (!name.trim()) {
      alert("Please enter an event name");
      return;
    }

    const events = JSON.parse(localStorage.getItem("events")) || [];
    events.push({
      name,
      details,
      date: new Date().toLocaleDateString(),
      location: countrySelect.options[countrySelect.selectedIndex].text,
      type: document.getElementById("holidayType").value,
    });
    localStorage.setItem("events", JSON.stringify(events));

    popup.style.display = "none";
    loadEvents();
  });

  // Initial load
  fetchCountries();
  loadEvents();
});
