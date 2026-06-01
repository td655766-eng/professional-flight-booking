const cityCodeMap = {
    "new york": "NYC",
    "los angeles": "LAX",
    "chicago": "CHI",
    "miami": "MIA",
    "dallas": "DFW",
    "san francisco": "SFO",
    "atlanta": "ATL",
    "seattle": "SEA",
    "boston": "BOS",
    "las vegas": "LAS",
    "orlando": "MCO",
    "denver": "DEN",
    "houston": "IAH",
    "phoenix": "PHX"
};

const sampleFlights = [
    { from: "New York", to: "Los Angeles", time: "09:00", price: "$320", flightNumber: "SKY102", duration: "6h 10m" },
    { from: "Chicago", to: "Miami", time: "13:00", price: "$220", flightNumber: "SKY218", duration: "3h 05m" },
    { from: "Dallas", to: "San Francisco", time: "18:00", price: "$280", flightNumber: "SKY334", duration: "4h 20m" },
    { from: "Atlanta", to: "Seattle", time: "11:00", price: "$300", flightNumber: "SKY450", duration: "5h 15m" }
];

let selectedFlightData = null;
let bookings = JSON.parse(localStorage.getItem("bookings")) || [];

const searchStatus = document.getElementById("searchStatus");

displayHistory();

async function searchFlights() {
    const fromValue = document.getElementById("from").value.trim();
    const toValue = document.getElementById("to").value.trim();
    const dateValue = document.getElementById("date").value;
    const resultsDiv = document.getElementById("results");

    resultsDiv.innerHTML = "";
    searchStatus.textContent = "";

    if (!fromValue || !toValue) {
        searchStatus.textContent = "Enter both departure and destination cities.";
        return;
    }

    if (fromValue.toLowerCase() === toValue.toLowerCase()) {
        searchStatus.textContent = "Departure and destination cannot be the same.";
        return;
    }

    const date = dateValue ? new Date(dateValue) : new Date();
    const formattedDate = formatDateForDisplay(date);
    const fromCode = getCityCode(fromValue);
    const toCode = getCityCode(toValue);

    searchStatus.innerHTML = `<span class="loader">Searching flights for ${formattedDate}...</span>`;

    let flightsToShow = [];
    if (fromCode && toCode) {
        try {
            const params = new URLSearchParams({
                fly_from: fromCode,
                fly_to: toCode,
                date_from: formatDateForApi(date),
                date_to: formatDateForApi(date),
                partner: "picky",
                limit: "6"
            });
            const response = await fetch(`https://api.skypicker.com/flights?${params}`);
            const json = await response.json();
            if (json.data && json.data.length) {
                flightsToShow = json.data.map(f => ({
                    from: f.cityFrom || fromValue,
                    to: f.cityTo || toValue,
                    time: f.dTimeUTC ? new Date(f.dTimeUTC * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : f.local_departure || '',
                    price: f.price ? `$${f.price}` : "$0",
                    flightNumber: f.route && f.route[0] ? `${f.route[0].airline}${f.route[0].flight_no}` : "N/A",
                    duration: f.fly_duration || "N/A",
                    date: formattedDate,
                    originAirport: f.flyFrom || fromCode,
                    destinationAirport: f.flyTo || toCode
                }));
            }
        } catch (error) {
            console.warn("Live flight search failed, using fallback data", error);
        }
    }

    if (!flightsToShow.length) {
        flightsToShow = getSampleFlights(fromValue, toValue, formattedDate);
        searchStatus.textContent = "Showing demo flights. For real-time results, use one of the supported U.S. cities.";
    } else {
        searchStatus.textContent = `Showing live flight results for ${fromValue} → ${toValue} on ${formattedDate}.`;
    }

    renderFlights(flightsToShow);
}

function getCityCode(city) {
    return cityCodeMap[city.toLowerCase()] || null;
}

function formatDateForApi(date) {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
}

function formatDateForDisplay(date) {
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function getSampleFlights(from, to, date) {
    const sample = sampleFlights.filter(f =>
        f.from.toLowerCase().includes(from.toLowerCase()) &&
        f.to.toLowerCase().includes(to.toLowerCase())
    );

    if (!sample.length) {
        return [
            {
                from: capitalizeAllWords(from),
                to: capitalizeAllWords(to),
                time: "10:30",
                price: "$345",
                flightNumber: "SKY400",
                duration: "4h 30m",
                date,
                originAirport: "N/A",
                destinationAirport: "N/A"
            },
            {
                from: capitalizeAllWords(from),
                to: capitalizeAllWords(to),
                time: "16:15",
                price: "$412",
                flightNumber: "SKY412",
                duration: "5h 05m",
                date,
                originAirport: "N/A",
                destinationAirport: "N/A"
            }
        ];
    }

    return sample.map(f => ({ ...f, date }));
}

function capitalizeAllWords(value) {
    return value
        .split(' ')
        .filter(Boolean)
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
}

function renderFlights(flightsArray) {
    const resultsDiv = document.getElementById("results");
    resultsDiv.innerHTML = "";

    if (!flightsArray.length) {
        resultsDiv.innerHTML = "<p style='text-align:center;'>No flights found for that route.</p>";
        return;
    }

    flightsArray.forEach(f => {
        const div = document.createElement("div");
        div.classList.add("flight");

        const title = document.createElement("h3");
        title.textContent = `${f.from} → ${f.to}`;

        const details = document.createElement("p");
        details.classList.add("flight-details");
        details.textContent = `${f.date} · ${f.time} · ${f.duration} · ${f.flightNumber}`;

        const price = document.createElement("p");
        price.textContent = f.price;

            const btn = document.createElement("a");
            btn.textContent = 'Book';
            btn.href = 'booking.html';
            btn.setAttribute('role', 'button');
            btn.classList.add('book-btn');
            // store selected flight before navigation
            btn.addEventListener('click', (e) => {
                try {
                    setSessionData('selectedFlight', f);
                } catch (err) {
                    console.warn('Could not save selected flight to sessionStorage', err);
                }
                // navigation will proceed via the anchor href
            });

        div.appendChild(title);
        div.appendChild(details);
        div.appendChild(price);
        div.appendChild(btn);

        resultsDiv.appendChild(div);
    });
}

function bookFlight(flight) {
    selectedFlightData = flight;

    document.getElementById("bookingSection").classList.remove("hidden");
    document.getElementById("selectedFlight").innerText =
        `${flight.from} → ${flight.to} (${flight.time}) - ${flight.price}`;
}

function goToPayment() {
    const name = document.getElementById("name").value;
    const email = document.getElementById("email").value;

    clearErrors();
    let ok = true;
    if (!name) { showError('name', 'Enter passenger full name'); ok = false; }
    if (!email) { showError('email', 'Enter passenger email'); ok = false; }
    if (!ok) return;

    document.getElementById("bookingSection").classList.add("hidden");
    document.getElementById("paymentSection").classList.remove("hidden");
}

function confirmPayment() {
    const card = document.getElementById("cardNumber").value || "";
    const expiry = document.getElementById("cardExpiry").value || "";
    const cvv = document.getElementById("cardCvv").value || "";
    const name = document.getElementById("name").value;
    const email = document.getElementById("email").value;

    if (!selectedFlightData) {
        clearErrors();
        showError('name', 'No flight selected. Please pick a flight first.');
        return;
    }

    clearErrors();
    let ok = true;
    if (!name) { showError('name', 'Enter passenger full name'); ok = false; }
    if (!email) { showError('email', 'Enter passenger email'); ok = false; }
    if (!ok) return;
    if (!isValidEmail(email)) { showError('email', 'Enter a valid email address'); return; }

    const rawCard = card.replace(/\s/g, '');
    if (!rawCard || rawCard.length < 12) { showError('cardNumber','Enter a valid card number'); return; }
    if (!luhnCheck(rawCard)) { showError('cardNumber','Card number failed validation'); return; }
    if (!isValidExpiry(expiry)) { showError('cardExpiry','Enter a valid future expiry date MM/YY'); return; }
    if (!/^\d{3,4}$/.test(cvv)) { showError('cardCvv','Enter a valid CVV (3 or 4 digits)'); return; }

    const booking = {
        name,
        email,
        ...selectedFlightData,
        bookedAt: new Date().toISOString()
    };

    bookings.push(booking);
    localStorage.setItem("bookings", JSON.stringify(bookings));

    displayHistory();

    const last4 = rawCard.slice(-4);
    document.getElementById("paymentSection").innerHTML = `\n        <h2 style="color:green;">✅ Payment Successful</h2>\n        <p>Your flight is booked! Charged card ending in ${last4}.</p>\n    `;
}

function displayHistory() {
    const historyDiv = document.getElementById("historyList");
    historyDiv.innerHTML = "";

    bookings.forEach(b => {
        const div = document.createElement("div");
        div.classList.add("flight");

        const name = document.createElement('strong');
        name.textContent = b.name;

        const route = document.createElement('p');
        route.textContent = `${b.from} → ${b.to}`;

        const info = document.createElement('p');
        info.textContent = `${b.time} | ${b.price}`;

        const meta = document.createElement('p');
        meta.classList.add('muted');
        const bookedAt = b.bookedAt ? new Date(b.bookedAt) : null;
        meta.textContent = bookedAt ? `Booked: ${bookedAt.toLocaleString()}` : '';

        const cancelBtn = document.createElement('button');
        cancelBtn.textContent = 'Cancel';
        cancelBtn.classList.add('small-btn');
        cancelBtn.addEventListener('click', () => {
            if (confirm('Cancel this booking?')) {
                bookings = bookings.filter(x => x !== b);
                localStorage.setItem('bookings', JSON.stringify(bookings));
                displayHistory();
            }
        });

        div.appendChild(name);
        div.appendChild(route);
        div.appendChild(info);
        div.appendChild(meta);
        div.appendChild(cancelBtn);

        historyDiv.appendChild(div);
    });
}

// Validation utilities
function isValidEmail(email) {
    const el = document.createElement('input');
    el.type = 'email';
    el.value = email;
    return el.checkValidity();
}

function luhnCheck(cardNumber) {
    const digits = cardNumber.replace(/\D/g, '');
    let sum = 0;
    let shouldDouble = false;
    for (let i = digits.length - 1; i >= 0; i--) {
        let d = parseInt(digits.charAt(i), 10);
        if (shouldDouble) {
            d *= 2;
            if (d > 9) d -= 9;
        }
        sum += d;
        shouldDouble = !shouldDouble;
    }
    return (sum % 10) === 0;
}

function formatCardInput(value) {
    const digits = value.replace(/\D/g, '').slice(0,16);
    return digits.replace(/(\d{4})(?=\d)/g, '$1 ').trim();
}

function isValidExpiry(exp) {
    if (!/^(0[1-9]|1[0-2])\/(\d{2})$/.test(exp)) return false;
    const [mm, yy] = exp.split('/').map(s => parseInt(s, 10));
    const now = new Date();
    const year = 2000 + yy;
    const expiry = new Date(year, mm);
    return expiry > now;
}

// Card input formatting handler
const cardInput = document.getElementById('cardNumber');
if (cardInput) {
    cardInput.addEventListener('input', (e) => {
        const pos = e.target.selectionStart;
        const formatted = formatCardInput(e.target.value);
        e.target.value = formatted;
        // try to restore caret to end for simplicity
        e.target.selectionStart = e.target.selectionEnd = formatted.length;
    });
}

// Expiry formatting: MM/YY
const expiryInput = document.getElementById('cardExpiry');
if (expiryInput) {
    expiryInput.addEventListener('input', (e) => {
        let v = e.target.value.replace(/\D/g, '').slice(0,4);
        if (v.length >= 3) {
            v = v.slice(0,2) + '/' + v.slice(2);
        }
        e.target.value = v;
        e.target.selectionStart = e.target.selectionEnd = v.length;
    });
}

// CVV: allow only digits
const cvvInput = document.getElementById('cardCvv');
if (cvvInput) {
    cvvInput.addEventListener('input', (e) => {
        e.target.value = e.target.value.replace(/\D/g, '').slice(0,4);
    });
}

// Inline error helpers
function showError(id, message) {
    const el = document.getElementById('err-' + id);
    if (el) el.textContent = message || '';
}

function clearErrors() {
    ['name','email','cardName','cardNumber','cardExpiry','cardCvv'].forEach(k => showError(k, ''));
}
// Attach listeners for static buttons
const searchBtn = document.getElementById("searchBtn");
if (searchBtn) searchBtn.addEventListener("click", searchFlights);

const continueBtn = document.getElementById("continueBtn");
if (continueBtn) continueBtn.addEventListener("click", goToPayment);

const payBtn = document.getElementById("payBtn");
if (payBtn) payBtn.addEventListener("click", confirmPayment);