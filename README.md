# JourneyShield AI — Recovery desk MVP

A responsive, beginner-friendly travel disruption recovery dashboard built with HTML, CSS, and vanilla JavaScript. Its dark midnight interface uses violet and cyan accents to present a simulated cancelled Bengaluru–Delhi flight and evaluate the rest of a Bengaluru-to-Shillong journey against traveller limits.

## Run locally

No installation or build step is required. Open `index.html` in a modern browser. If you prefer a local server and have Python installed, run this from the project folder:

```bash
python -m http.server 8000
```

Then open `http://localhost:8000`.

## Features

- Simulated itinerary with connected flight, hotel, and bus bookings.
- Three simulated recovery alternatives, with transparent cost components.
- Premium dark travel-operations dashboard with responsive itinerary timeline, recovery assistant, cost comparison, booking impact, and action checklist.
- Budget, latest arrival, maximum transfers, and cheaper/faster preference controls.
- Hard-constraint filtering before options are ranked.
- Per-option feasibility reasons and a deterministic recommendation explanation.
- Booking impact statuses: Affected, Unaffected, and Needs confirmation.
- Unavailable-option simulation with automatic replanning.
- Separate travel, local transfer, onward transport, and accommodation cost figures on each option card.
- Clear no-feasible-option state; infeasible options are never recommended.
- Responsive dashboard layout and accessible text status labels.

## What is simulated

All names, flight numbers, times, availability, bookings, prices, and costs are illustrative. The ₹2,000 onward transport amount is a scenario assumption. This prototype has no live flight or hotel data, does not contact providers, and cannot search, book, cancel, or change travel. Refunds are unconfirmed and never deducted from estimates. The app only presents suggested actions; it does not complete them.

## Project files

- `index.html` — page structure.
- `styles.css` — responsive visual design.
- `js/data.js` — simulated scenario data and rules.
- `js/recovery.js` — deterministic impact, cost, constraints, and ranking functions.
- `js/app.js` — interface events and rendering.

## Decision rules

An option must be available, within budget, arrive by the chosen deadline, and stay within the transfer limit. Only options that pass all four checks are ranked. Cheaper sorts by total estimated additional cost, then arrival time; faster sorts by arrival time, then cost. The bus boarding cutoff is 30 minutes before its 20:00 departure. Missing the bus marks it affected and adds the scenario's onward-transport estimate. Hotel and provider outcomes that cannot be determined from the scenario are marked Needs confirmation.

## Limitations and next steps

The recovery engine is deterministic JavaScript; no language model or external AI service is connected. This MVP models one same-day journey and one disruption. Times do not cross midnight, provider policies are not integrated, and its costs are not quotes. Before a public submission, verify hackathon rules, add the required attribution or team details, create a public GitHub repository if permitted, and record a short demo showing the default recommendation, changed constraints, an unavailable option, and the no-feasible case.
