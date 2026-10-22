(function () {
  "use strict";

  const data = window.JourneyData;
  const recovery = window.JourneyRecovery;
  const state = { preference: data.constraints.preference };
  const $ = (selector) => document.querySelector(selector);
  const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));
  const glyph = { flight: "✈", hotel: "⌂", bus: "▰" };

  function getConstraints() {
    const entered = Number($("#budget").value);
    return {
      budget: Number.isFinite(entered) && entered >= 0 ? entered : 0,
      deadline: $("#deadline").value,
      maxTransfers: Number($("#transfers").value),
      preference: state.preference
    };
  }

  function getComponent(entry, label) {
    const part = entry.cost.components.find((item) => item.label.startsWith(label));
    return part ? part.amount : 0;
  }

  function renderAssistant(result, constraints) {
    const host = $("#recommendation");
    if (!result.winner) {
      const failures = result.evaluations.map((entry) => {
        const reason = entry.failures.length ? entry.failures.join(" ") : "This option is feasible but cannot be recommended while no active plan remains.";
        return `<li><b>${escapeHtml(entry.option.label)}:</b> ${escapeHtml(reason)}</li>`;
      }).join("");
      host.innerHTML = `<div class="assistant-top"><div class="assistant-brand"><span class="assistant-orb">✳</span><span><b>Recovery assistant</b><small>RULE-BASED DECISION SUPPORT</small></span></div><span class="assistant-status assistant-empty">NO MATCH FOUND</span></div><div class="empty-state"><h3>No option meets your current limits.</h3><p>We won’t recommend an option that breaks a hard limit. Adjust a preference to see if another simulated plan fits.</p><ul>${failures}</ul></div>`;
      return;
    }

    const winner = result.winner;
    const preferenceName = constraints.preference === "cheaper" ? "Lower cost" : "Faster arrival";
    const explanation = escapeHtml(result.explanation);
    host.innerHTML = `<div class="assistant-top"><div class="assistant-brand"><span class="assistant-orb"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v3m0 12v3M3 12h3m12 0h3M5.6 5.6l2.1 2.1m8.6 8.6 2.1 2.1m0-12.8-2.1 2.1m-8.6 8.6-2.1 2.1"/><circle cx="12" cy="12" r="4"/></svg></span><span><b>Recovery assistant</b><small>RULE-BASED DECISION SUPPORT</small></span></div><span class="assistant-status"><i></i> PLAN READY</span></div><p class="assistant-content"><b>${escapeHtml(winner.option.label)}</b> is your strongest match. ${explanation} The estimate is based on simulated costs and your current ${preferenceName.toLowerCase()} preference.</p><div class="assistant-criteria"><span class="criteria-chip"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12 4 4L19 6"/></svg> Within <strong>${recovery.formatMoney(constraints.budget)}</strong></span><span class="criteria-chip"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12 4 4L19 6"/></svg> Arrives by <strong>${recovery.formatTime(constraints.deadline)}</strong></span><span class="criteria-chip"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12 4 4L19 6"/></svg> ${winner.option.transfers} / ${constraints.maxTransfers} transfers</span></div>`;
  }

  function optionTag(entry, winner) {
    if (!entry.option.available) return '<span class="tag infeasible">UNAVAILABLE</span>';
    if (!entry.feasible) return '<span class="tag infeasible">NOT FEASIBLE</span>';
    return winner ? '<span class="tag best">BEST MATCH</span>' : '<span class="tag feasible">FEASIBLE</span>';
  }

  function renderOptions(result) {
    const host = $("#options-list");
    host.innerHTML = result.evaluations.map((entry) => {
      const winner = result.winner && result.winner.option.id === entry.option.id;
      const connectionCost = getComponent(entry, "Local transfer");
      const onwardCost = getComponent(entry, "Estimated onward transport");
      const accommodationCost = getComponent(entry, "Additional accommodation");
      let explanation = "Passes all hard limits for this scenario.";
      if (!entry.option.available) explanation = "Excluded because this simulated option was marked unavailable.";
      else if (entry.failures.length) explanation = entry.failures.join(" ");
      else if (onwardCost > 0) explanation = "Feasible, but the original bus is missed; estimated onward transport is included.";
      return `<article class="option-card ${winner ? "is-recommended" : ""}">
        <div class="option-top"><div><div class="option-name">${escapeHtml(entry.option.label)}</div><div class="option-route">${escapeHtml(entry.option.route)}</div></div><div class="option-tags">${optionTag(entry, winner)}</div></div>
        <div class="option-stats"><div class="option-stat"><small>ARRIVAL</small><strong>${recovery.formatTime(entry.option.arrivalTime)}</strong></div><div class="option-stat"><small>TRANSFERS</small><strong>${entry.option.transfers} ${entry.option.transfers === 1 ? "transfer" : "transfers"}</strong></div><div class="option-stat"><small>HARD LIMITS</small><strong class="${entry.feasible ? "pass" : ""}">${entry.feasible ? "All passed ✓" : "Failed ✕"}</strong></div></div>
        <div class="option-cost-grid"><div class="option-cost-part"><small>Travel</small><strong>${recovery.formatMoney(entry.option.travelCost)}</strong></div><div class="option-cost-part"><small>Local transfer</small><strong>${recovery.formatMoney(connectionCost)}</strong></div><div class="option-cost-part"><small>Onward transport</small><strong>${recovery.formatMoney(onwardCost)}</strong></div><div class="option-cost-part"><small>Accommodation</small><strong>${recovery.formatMoney(accommodationCost)}</strong></div></div>
        <div class="option-bottom"><span class="option-total">Est. additional<b>${recovery.formatMoney(entry.cost.total)}</b></span><button class="unavailable-btn" type="button" data-unavailable="${escapeHtml(entry.option.id)}" ${entry.option.available ? "" : "disabled"} aria-label="${entry.option.available ? "Mark " + escapeHtml(entry.option.label) + " unavailable" : escapeHtml(entry.option.label) + " unavailable"}">${entry.option.available ? "Mark unavailable" : "Unavailable"}</button></div><div class="option-explanation">${escapeHtml(explanation)}</div>
      </article>`;
    }).join("");

    host.querySelectorAll("[data-unavailable]").forEach((button) => button.addEventListener("click", () => {
      const option = data.options.find((item) => item.id === button.dataset.unavailable);
      if (option) { option.available = false; render(); }
    }));
  }

  function renderCost(winner) {
    const breakdown = $("#cost-breakdown");
    if (!winner) {
      breakdown.innerHTML = '<div class="cost-line"><span>No feasible plan to compare.</span><strong>—</strong></div>';
      $("#cost-total-value").textContent = "—";
      return;
    }
    const components = winner.cost.components;
    const lines = components.map((part) => {
      const negative = part.amount < 0 ? "−" : "";
      return `<div class="cost-line"><span>${escapeHtml(part.label)}</span><strong>${negative}${recovery.formatMoney(Math.abs(part.amount))}</strong></div>`;
    });
    if (winner.cost.refundUnconfirmed) lines.push('<div class="cost-line refund-note"><span>Refunds · unconfirmed</span><strong>Not deducted</strong></div>');
    if (components.some((part) => part.label.includes("onward transport"))) lines.push('<div class="cost-line refund-note"><span>¹ Onward transport is a scenario estimate.</span><strong></strong></div>');
    breakdown.innerHTML = lines.join("");
    $("#cost-total-value").textContent = recovery.formatMoney(winner.cost.total);
  }

  function renderImpacts(result) {
    const chosen = result.winner || result.evaluations.find((entry) => entry.option.available) || result.evaluations[0];
    const statusText = { affected: "Affected", unaffected: "Unaffected", confirmation: "Needs confirmation" };
    const host = $("#impact-list");
    if (!chosen) {
      host.innerHTML = '<div class="impact-row"><div class="impact-booking"><div><strong>No active recovery option</strong><small>Make an option available to assess booking impact.</small></div></div></div>';
      $("#impact-count").textContent = "No active option";
      return;
    }
    host.innerHTML = chosen.impact.map((impact) => {
      const booking = data.itinerary.find((item) => item.id === impact.bookingId);
      const refundNote = booking.refundStatus !== "confirmed" && booking.type === "bus" ? " Refund status is unconfirmed." : "";
      return `<div class="impact-row"><div class="impact-booking"><span class="impact-symbol" aria-hidden="true">${glyph[booking.type]}</span><div><strong>${escapeHtml(booking.label)}</strong><small>${escapeHtml(impact.reason + refundNote)}</small></div></div><span class="impact-status ${impact.status}">${statusText[impact.status]}</span></div>`;
    }).join("");
    const counts = chosen.impact.reduce((acc, item) => (acc[item.status] = (acc[item.status] || 0) + 1, acc), {});
    $("#impact-count").textContent = `${counts.affected || 0} affected · ${counts.unaffected || 0} unaffected · ${counts.confirmation || 0} confirm`;
  }

  function renderActions(result) {
    const list = $("#action-list");
    if (!result.winner) {
      list.innerHTML = "<li>Adjust one or more hard limits, then compare the options again.</li><li>Contact providers directly to confirm change and refund conditions.</li>";
      return;
    }
    const impact = result.winner.impact;
    const actions = ["Review replacement travel details directly with the relevant provider before relying on them."];
    if (impact.some((item) => item.bookingId === "FL2" && item.status === "confirmation")) actions.push("Confirm whether the original Delhi connection remains usable or needs a change.");
    const bus = impact.find((item) => item.bookingId === "BS1");
    if (bus && bus.status === "affected") actions.push("Arrange onward transport to Shillong; the displayed amount is only a simulated estimate.");
    else if (bus && bus.status === "unaffected") actions.push("Reconfirm bus departure and boarding details before travel.");
    if (impact.some((item) => item.bookingId === "HT1" && item.status === "confirmation")) actions.push("Ask the Guwahati hotel about check-in timing and change conditions.");
    if (impact.some((item) => item.bookingId === "HT2" && item.status === "confirmation")) actions.push("Confirm arrival and late check-in details with the Shillong hotel.");
    actions.push("Review provider change, cancellation, and refund terms; no refund is assumed.");
    list.innerHTML = actions.slice(0, 4).map((action) => `<li>${escapeHtml(action)}</li>`).join("");
  }

  function render() {
    const constraints = getConstraints();
    const result = recovery.runRecovery(data, constraints);
    $("#option-count").textContent = `${data.options.length} OPTIONS · ${result.ranked.length} FEASIBLE`;
    renderAssistant(result, constraints);
    renderOptions(result);
    renderCost(result.winner);
    renderImpacts(result);
    renderActions(result);
  }

  $("#budget").addEventListener("input", render);
  $("#deadline").addEventListener("change", render);
  $("#transfers").addEventListener("change", render);
  document.querySelectorAll("[data-preference]").forEach((button) => button.addEventListener("click", () => {
    state.preference = button.dataset.preference;
    document.querySelectorAll("[data-preference]").forEach((item) => item.classList.toggle("selected", item === button));
    render();
  }));
  render();
})();
