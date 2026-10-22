/* Deterministic recovery logic. This file never reads or changes the page. */
(function () {
  "use strict";

  function toMinutes(time) {
    const parts = time.split(":").map(Number);
    return parts[0] * 60 + parts[1];
  }

  function money(value) {
    return Math.round(value);
  }

  function assessBookings(option, data) {
    const arrival = toMinutes(option.arrivalTime);
    const impact = [];
    for (const booking of data.itinerary) {
      if (booking.id === data.disruption.bookingId) continue;
      if (booking.type === "flight" && booking.id === "FL2") {
        impact.push({ bookingId: booking.id, status: "confirmation", reason: "The original connection may no longer work. Confirm the change with the provider." });
      } else if (booking.type === "bus") {
        const boardingDeadline = toMinutes(booking.departureTime) - data.rules.busBoardingBufferMinutes;
        if (option.arrivalLocation !== booking.origin) {
          impact.push({ bookingId: booking.id, status: "confirmation", reason: "Arrival location differs from the bus origin; check onward transport." });
        } else if (arrival > boardingDeadline) {
          impact.push({ bookingId: booking.id, status: "affected", reason: "Arrival is after the 19:30 modeled boarding deadline." });
        } else {
          impact.push({ bookingId: booking.id, status: "unaffected", reason: "Arrival is before the 19:30 modeled boarding deadline." });
        }
      } else if (booking.type === "hotel" && booking.id === "HT1") {
        if (option.arrivalLocation !== booking.location) {
          impact.push({ bookingId: booking.id, status: "confirmation", reason: "This option does not arrive in Guwahati; check whether the stay can be changed." });
        } else if (arrival > toMinutes(booking.checkInTime)) {
          impact.push({ bookingId: booking.id, status: "confirmation", reason: "Arrival is after listed check-in time. Ask the hotel about late check-in." });
        } else {
          impact.push({ bookingId: booking.id, status: "unaffected", reason: "Arrival is before the listed check-in time." });
        }
      } else if (booking.type === "hotel" && booking.id === "HT2") {
        const bus = data.itinerary.find((item) => item.id === "BS1");
        const busDeadline = toMinutes(bus.departureTime) - data.rules.busBoardingBufferMinutes;
        if (arrival > busDeadline) {
          impact.push({ bookingId: booking.id, status: "confirmation", reason: "The bus may be missed. Confirm whether the hotel can accommodate a changed arrival." });
        } else {
          impact.push({ bookingId: booking.id, status: "confirmation", reason: "The connection is modeled as possible; confirm check-in details with the hotel." });
        }
      }
    }
    return impact;
  }

  function calculateCost(option, impact, data) {
    const components = [
      { label: "Replacement travel", amount: money(option.travelCost) },
      { label: "Local transfer", amount: money(option.localTransferCost) },
      { label: "Additional accommodation", amount: money(option.extraAccommodationCost) }
    ].filter((part) => part.amount > 0);
    const busAffected = impact.some((item) => item.bookingId === "BS1" && item.status === "affected");
    if (busAffected) components.push({ label: "Estimated onward transport¹", amount: data.rules.onwardTransportEstimate });
    const confirmedRefunds = data.itinerary.filter((booking) => booking.refundStatus === "confirmed" && Number.isFinite(booking.refundAmount));
    const confirmedRefund = confirmedRefunds.reduce((sum, booking) => sum + booking.refundAmount, 0);
    if (confirmedRefund > 0) components.push({ label: "Confirmed refund", amount: -confirmedRefund });
    return { components, total: components.reduce((sum, part) => sum + part.amount, 0), refundUnconfirmed: data.itinerary.some((booking) => booking.refundStatus === "unknown" || booking.refundStatus === "possible") };
  }

  function evaluateOption(option, constraints, data) {
    const impact = assessBookings(option, data);
    const cost = calculateCost(option, impact, data);
    const failures = [];
    if (!option.available) failures.push("This simulated option is unavailable.");
    if (cost.total > constraints.budget) failures.push(`Estimated cost ${formatMoney(cost.total)} is over your ${formatMoney(constraints.budget)} budget.`);
    if (toMinutes(option.arrivalTime) > toMinutes(constraints.deadline)) failures.push(`Arrival at ${formatTime(option.arrivalTime)} is after your ${formatTime(constraints.deadline)} deadline.`);
    if (option.transfers > constraints.maxTransfers) failures.push(`${option.transfers} ${option.transfers === 1 ? "transfer exceeds" : "transfers exceed"} your limit of ${constraints.maxTransfers}.`);
    return { option, impact, cost, feasible: failures.length === 0, failures };
  }

  function rankOptions(evaluations, preference) {
    return evaluations.filter((result) => result.feasible).sort((a, b) => {
      const arrivalDifference = toMinutes(a.option.arrivalTime) - toMinutes(b.option.arrivalTime);
      const costDifference = a.cost.total - b.cost.total;
      const primary = preference === "cheaper" ? costDifference : arrivalDifference;
      const secondary = preference === "cheaper" ? arrivalDifference : costDifference;
      return primary || secondary || a.option.id.localeCompare(b.option.id);
    });
  }

  function createExplanation(winner, ranked, preference) {
    if (!winner) return "No recommendation is shown because every option fails at least one hard limit.";
    const lead = preference === "cheaper" ? "lowest estimated additional cost" : "earliest arrival";
    const tied = ranked.filter((entry) => preference === "cheaper" ? entry.cost.total === winner.cost.total : entry.option.arrivalTime === winner.option.arrivalTime).length > 1;
    const tieNote = tied ? (preference === "cheaper" ? " Earlier arrival breaks the cost tie." : " Lower estimated cost breaks the arrival tie.") : "";
    return `Recommended because it meets every hard limit and has the ${lead} among feasible options.${tieNote} Estimated cost is ${formatMoney(winner.cost.total)} and arrival is ${formatTime(winner.option.arrivalTime)}.`;
  }

  function runRecovery(data, constraints) {
    const evaluations = data.options.map((option) => evaluateOption(option, constraints, data));
    const ranked = rankOptions(evaluations, constraints.preference);
    const winner = ranked[0] || null;
    return { evaluations, ranked, winner, explanation: createExplanation(winner, ranked, constraints.preference) };
  }

  function formatMoney(amount) {
    return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount);
  }
  function formatTime(time) {
    const [hours, minutes] = time.split(":").map(Number);
    const suffix = hours >= 12 ? "PM" : "AM";
    const displayHour = hours % 12 || 12;
    return `${displayHour}:${String(minutes).padStart(2, "0")} ${suffix}`;
  }

  window.JourneyRecovery = { toMinutes, assessBookings, calculateCost, evaluateOption, rankOptions, runRecovery, formatMoney, formatTime };
})();
