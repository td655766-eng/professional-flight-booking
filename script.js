const flights = [
    { from: "New York", to: "Los Angeles", time: "9:00 AM", price: "$320" },
    { from: "Chicago", to: "Miami", time: "1:00 PM", price: "$220" },
    { from: "Dallas", to: "San Francisco", time: "6:00 PM", price: "$280" },
    { from: "Atlanta", to: "Seattle", time: "11:00 AM", price: "$300" }
];

let selectedFlightData = null;
let bookings = JSON.parse(localStorage.getItem("bookings")) || [];

displayHistory();

function searchFlights() {
    const from = document.getElementById("from").value.toLowerCase();
    const to = document.getElementById("to").value.toLowerCase();

    const resultsDiv = document.getElementById("results");
    resultsDiv.innerHTML = "";

    const filtered = flights.filter(f =>
        f.from.toLowerCase().includes(from) &&
        f.to.toLowerCase().includes(to)
    );

    if (!filtered.length) {
        resultsDiv.innerHTML = "<p style='text-align:center;'>No flights found</p>";
        return;
    }

    filtered.forEach(f => {
        const div = document.createElement("div");
        div.classList.add("flight");

        const h3 = document.createElement("h3");
        h3.textContent = `${f.from} → ${f.to}`;

        const info = document.createElement("p");
        info.textContent = `${f.time} | ${f.price}`;

        const btn = document.createElement("button");
        btn.textContent = "Book";
        btn.addEventListener("click", () => bookFlight(f));

        div.appendChild(h3);
        div.appendChild(info);
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