/* All scenario values in this file are illustrative and simulated. */
window.JourneyData = {
  disruption: { bookingId: "FL1", flightNumber: "JS 481", status: "Cancelled", time: "08:00", simulated: true },
  itinerary: [
    { id: "FL1", type: "flight", label: "Bengaluru → Delhi", detail: "JS 481 · 08:00–10:30", origin: "Bengaluru", destination: "Delhi", departureTime: "08:00", arrivalTime: "10:30", pricePaid: 5000, refundStatus: "unknown", dependsOn: [], state: "disrupted" },
    { id: "FL2", type: "flight", label: "Delhi → Guwahati", detail: "JS 216 · 12:00 departure", origin: "Delhi", destination: "Guwahati", departureTime: "12:00", arrivalTime: "14:45", pricePaid: 6000, refundStatus: "unknown", dependsOn: ["FL1"], state: "review" },
    { id: "HT1", type: "hotel", label: "Guwahati hotel", detail: "Check-in from 18:00", location: "Guwahati", checkInTime: "18:00", pricePaid: 3500, refundStatus: "unknown", dependsOn: ["FL2"], state: "booked" },
    { id: "BS1", type: "bus", label: "Guwahati → Shillong bus", detail: "Departs 20:00 · 30 min boarding buffer", origin: "Guwahati", destination: "Shillong", departureTime: "20:00", arrivalTime: "23:00", pricePaid: 1200, refundStatus: "unknown", dependsOn: ["FL2"], state: "booked" },
    { id: "HT2", type: "hotel", label: "Shillong hotel", detail: "Check-in from 23:30", location: "Shillong", checkInTime: "23:30", pricePaid: 4000, refundStatus: "unknown", dependsOn: ["BS1"], state: "booked" }
  ],
  rules: { busBoardingBufferMinutes: 30, onwardTransportEstimate: 2000, simulated: true },
  constraints: { budget: 10000, deadline: "19:00", maxTransfers: 1, preference: "faster" },
  options: [
    { id: "OPT1", label: "Replacement flight via Delhi", route: "Bengaluru → Delhi → Guwahati", arrivalLocation: "Guwahati", arrivalTime: "18:30", transfers: 1, travelCost: 7000, localTransferCost: 0, extraAccommodationCost: 0, available: true, simulated: true },
    { id: "OPT2", label: "Direct replacement flight", route: "Bengaluru → Guwahati", arrivalLocation: "Guwahati", arrivalTime: "17:00", transfers: 0, travelCost: 9000, localTransferCost: 0, extraAccommodationCost: 0, available: true, simulated: true },
    { id: "OPT3", label: "Train and connection", route: "Bengaluru → (connection) → Guwahati", arrivalLocation: "Guwahati", arrivalTime: "21:00", transfers: 1, travelCost: 4500, localTransferCost: 800, extraAccommodationCost: 0, available: true, simulated: true }
  ]
};
