# Professional Flight Booking

A simple static flight booking demo built with HTML, CSS, and JavaScript.

## Features

- Search flights by origin and destination
- Select a flight and enter passenger details
- Credit card validation with Luhn check
- Expiry and CVV input formatting
- Saved booking history using `localStorage`
- Cancel bookings from history

## How to use

1. Open `index.html` in your browser.
2. Enter departure and destination cities.
3. Select a flight to book.
4. Fill in your name, email, and payment details.
5. Confirm payment to save the booking.

## GitHub Pages

This project can be hosted directly with GitHub Pages because it is a static site.

1. Go to your repository Settings → Pages.
2. Select branch `main` and folder `/ (root)`.
3. Save and wait for GitHub to publish the site.

Once published, your site will be available at:

```
https://td655766-eng.github.io/professional-flight-booking/
```

## Notes

- No real payments are processed.
- Card information is validated in the browser and not stored.
- Bookings are stored locally in your browser's `localStorage`.
