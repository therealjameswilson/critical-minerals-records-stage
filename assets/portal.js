(() => {
  "use strict";

  const portal = window.CRITICAL_MINERALS_PORTAL || {
    eras: [], minerals: [], countries: [], administrations: [], sources: [], searchPrompts: []
  };

  const $ = (id) => document.getElementById(id);
  const asArray = (value) => Array.isArray(value) ? value : value ? [value] : [];
  const text = (value) => String(value == null ? "" : value);
  const escapeHtml = (value) => text(value).replace(/[&<>'"]/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;"
  })[char]);
  const normalize = (value) => text(value).toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  const unique = (values) => [...new Set(values.filter(Boolean))];
  const titleCase = (value) => text(value).replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());

  const events = Object.entries(typeof EVENTS_CACHE === "object" ? EVENTS_CACHE : {})
    .flatMap(([dateKey, rows]) => asArray(rows).map((row) => ({ ...row, dateKey })))
    .sort((a, b) => Number(b.y || 0) - Number(a.y || 0) || text(a.t).localeCompare(text(b.t)));

  const frusIndex = window.FRUS_SUBJECTS_INDEX || { meta: {}, subjects: [], records: [] };
  const frusSubjects = asArray(frusIndex.subjects);
  const frusVerifiedByUrl = new Map(events
    .filter((event) => normalize(event.st || event.s) === "frus" && normalize(event.cf) === "high" && !/placeholder|sample/.test(normalize(event.t)))
    .map((event) => [event.u, event]));
  const frusDocuments = asArray(frusIndex.records).map((row) => {
    const [volume, documentId, start, end, mask, context] = row;
    const url = `${frusIndex.meta?.documentBase || "https://history.state.gov/historicaldocuments/"}${volume}/${documentId}`;
    return {
      volume, documentId, start: Number(start || 0), end: Number(end || start || 0),
      mask: Number(mask || 0), context: text(context), url, verified: frusVerifiedByUrl.get(url) || null
    };
  });

  const sourceTypes = unique(events.flatMap((event) => asArray(event.st || event.s))).sort();
  const mineralValues = unique(events.flatMap((event) => asArray(event.mi))).sort();
  const countryValues = unique(events.flatMap((event) => asArray(event.cty))).sort();
  const stageValues = unique(events.flatMap((event) => asArray(event.ch))).sort();
  const countryIndex = new Map(portal.countries.map((country) => [normalize(country.name), country]));

  const searchState = {
    query: "",
    mineral: "",
    country: "",
    source: "",
    stage: "",
    era: ""
  };

  const frusState = { query: "", subject: "", from: "", to: "", limit: 36 };

  let activeEra = portal.eras.find((era) => era.id === "early-cold-war") || portal.eras[0] || null;

  function eventField(event, key) {
    const aliases = {
      mineral: "mi", country: "cty", source: "st", stage: "ch", evidence: "et",
      agency: "ag", confidence: "cf", caveat: "cv", citation: "cu", recordId: "rid"
    };
    return asArray(event[aliases[key] || key]);
  }

  function eventHaystack(event) {
    const subjectNames = asArray(event.sb).map((index) => SUBJECT_TAXONOMY[index]?.n || "");
    return normalize([
      event.t, event.de, event.s, event.st, event.dd, event.y, event.et, event.ch,
      event.mi, event.cty, event.ag, event.cv, event.rid, subjectNames
    ].flat().join(" "));
  }

  const STOP_WORDS = new Set([
    "a", "all", "about", "an", "and", "are", "as", "at", "by", "did", "do", "during",
    "everything", "for", "from", "how", "in", "is", "it", "me", "of", "on", "say", "show",
    "the", "to", "us", "was", "what", "when", "where", "which", "why", "with"
  ]);

  function queryEraRange(query) {
    const q = normalize(query);
    const aliases = [
      { terms: ["world war ii", "wwii", "second world war"], start: 1939, end: 1945 },
      { terms: ["world war i", "wwi", "first world war"], start: 1914, end: 1918 },
      { terms: ["early cold war"], start: 1946, end: 1960 },
      { terms: ["cold war"], start: 1946, end: 1991 },
      { terms: ["civil war"], start: 1861, end: 1865 },
      { terms: ["interwar"], start: 1919, end: 1938 }
    ];
    return aliases.find((item) => item.terms.some((term) => q.includes(term))) || null;
  }

  function queryTokens(query) {
    let q = normalize(query)
      .replace(/rare earths/g, "rare earth elements")
      .replace(/\bchrome\b/g, "chromium")
      .replace(/world war ii|second world war|wwii|world war i|first world war|wwi|early cold war|cold war|civil war|interwar/g, " ");
    return q.split(/\s+/).filter((token) => token.length > 1 && !STOP_WORDS.has(token));
  }

  function matchesQuery(event, query) {
    if (!query.trim()) return true;
    const range = queryEraRange(query);
    const year = Number(event.y || 0);
    if (range && (year < range.start || year > range.end)) return false;
    const haystack = eventHaystack(event);
    return queryTokens(query).every((token) => haystack.includes(token));
  }

  function inEra(event, eraId) {
    if (!eraId) return true;
    const era = portal.eras.find((item) => item.id === eraId);
    if (!era) return true;
    const year = Number(event.y || 0);
    return year >= era.start && year <= era.end;
  }

  function fieldMatches(event, key, expected) {
    if (!expected) return true;
    const target = normalize(expected);
    return eventField(event, key).some((value) => normalize(value) === target);
  }

  function filteredEvidence() {
    return events.filter((event) =>
      matchesQuery(event, searchState.query) &&
      fieldMatches(event, "mineral", searchState.mineral) &&
      fieldMatches(event, "country", searchState.country) &&
      fieldMatches(event, "source", searchState.source) &&
      fieldMatches(event, "stage", searchState.stage) &&
      inEra(event, searchState.era)
    );
  }

  function isNeedsReview(event) {
    return normalize(event.cf) === "low" || /placeholder|sample|demonstrator/.test(normalize(event.t));
  }

  function isAnalytical(event) {
    return normalize(event.st) === "analytical report" || normalize(event.et) === "analytical synthesis";
  }

  function isOfficial(event) {
    return ["frus", "nara", "census", "usgs", "doe", "dla", "federal register", "state", "other usg"]
      .includes(normalize(event.st || event.s));
  }

  function eventDate(event) {
    if (event.dd) return event.dd;
    return `${event.y || "Undated"}${event.dateKey ? ` · ${event.dateKey}` : ""}`;
  }

  function recordCard(event, compact = false) {
    const minerals = eventField(event, "mineral").slice(0, compact ? 3 : 5);
    const countries = eventField(event, "country").slice(0, compact ? 2 : 4);
    const confidence = normalize(event.cf || "medium");
    const caveat = event.cv && !compact ? `<p class="caveat"><strong>Caveat:</strong> ${escapeHtml(event.cv)}</p>` : "";
    const citation = event.cu && event.cu !== event.u
      ? `<a class="text-link" href="${escapeHtml(event.cu)}" target="_blank" rel="noopener">Citation ↗</a>` : "";
    const official = isOfficial(event) ? '<span class="badge official">Official USG</span>' : "";
    const analytical = isAnalytical(event) ? '<span class="badge analysis">Analytical synthesis</span>' : "";
    const review = isNeedsReview(event) ? '<span class="badge review">Needs review</span>' : "";
    const openLabel = isAnalytical(event) ? "Read analytical report" : "Open authoritative source ↗";
    return `
      <article class="record-card ${escapeHtml(confidence)}" data-record-id="${escapeHtml(event.rid || "")}">
        <div class="record-meta"><span>${escapeHtml(eventDate(event))}</span><span>·</span><span>${escapeHtml(event.st || event.s || "Source")}</span></div>
        <h3>${escapeHtml(event.t || "Untitled record")}</h3>
        <p>${escapeHtml(event.de || "Metadata record. Open the authoritative source for full context.")}</p>
        <div class="badge-row" style="margin-top:9px">
          ${official}${analytical}${review}
          ${minerals.map((item) => `<span class="badge">${escapeHtml(titleCase(item))}</span>`).join("")}
          ${countries.map((item) => `<span class="badge">${escapeHtml(item)}</span>`).join("")}
        </div>
        ${caveat}
        <div class="record-actions">
          <a class="text-link" href="${escapeHtml(event.u || event.cu || "#")}"${isAnalytical(event) ? "" : ' target="_blank" rel="noopener"'}>${openLabel}</a>
          ${citation}
        </div>
      </article>`;
  }

  function optionMarkup(values, allLabel, selected = "", formatter = titleCase) {
    return [`<option value="">${escapeHtml(allLabel)}</option>`]
      .concat(values.map((value) => `<option value="${escapeHtml(value)}"${value === selected ? " selected" : ""}>${escapeHtml(formatter(value))}</option>`))
      .join("");
  }

  function populateControls() {
    $("mapMineral").innerHTML = optionMarkup(mineralValues, "All minerals");
    $("mapSource").innerHTML = optionMarkup(sourceTypes, "All trusted sources");
    $("filterMineral").innerHTML = optionMarkup(mineralValues, "All minerals", searchState.mineral);
    $("filterCountry").innerHTML = optionMarkup(countryValues, "All countries", searchState.country, (value) => value);
    $("filterSource").innerHTML = optionMarkup(sourceTypes, "All source types", searchState.source);
    $("filterStage").innerHTML = optionMarkup(stageValues, "All stages", searchState.stage);
    $("filterEra").innerHTML = optionMarkup(portal.eras.map((era) => era.id), "All eras", searchState.era, (id) => {
      const era = portal.eras.find((item) => item.id === id);
      return era ? `${era.label} (${era.years})` : id;
    });
    $("evidenceQuery").value = searchState.query;
    $("globalQuery").value = searchState.query;
  }

  function renderMetrics() {
    const years = events.map((event) => Number(event.y || 0)).filter(Boolean);
    const officialCount = events.filter((event) => isOfficial(event) && !isNeedsReview(event)).length;
    const metrics = [
      [events.length, "Indexed records"],
      [years.length ? `${Math.min(...years)}-${Math.max(...years)}` : "No dates", "Verified record span"],
      [sourceTypes.length, "Source types"],
      [countryValues.length, "Countries tagged"],
      [officialCount, "Official, review-ready records"]
    ];
    $("metricsStrip").innerHTML = metrics.map(([value, label]) => `<div class="metric"><strong>${escapeHtml(value)}</strong><span>${escapeHtml(label)}</span></div>`).join("");
  }

  function renderPromptRow() {
    $("promptRow").innerHTML = portal.searchPrompts.slice(0, 4).map((prompt) =>
      `<button class="prompt-chip" type="button" data-query="${escapeHtml(prompt)}">${escapeHtml(prompt)}</button>`
    ).join("");
  }

  function renderCommandCenter() {
    const command = portal.commandCenter || {};
    const report = command.report || {};
    $("commandTimeline").innerHTML = asArray(command.timeline).map((item) => `
      <div class="operation-row">
        <span class="operation-date">${escapeHtml(item.date)}</span>
        <span class="operation-dot" aria-hidden="true"></span>
        <div class="operation-body"><strong>${escapeHtml(item.title)}</strong><span>${escapeHtml(item.detail)}</span></div>
        <a class="operation-source" href="${escapeHtml(item.url)}" target="_blank" rel="noopener">${escapeHtml(item.source)} ↗</a>
      </div>`).join("");

    $("commandWorkstreams").innerHTML = asArray(command.workstreams).map((item) => `
      <div class="workstream-row"><strong>${escapeHtml(item.label)}</strong><span>${escapeHtml(item.detail)}</span></div>`
    ).join("");

    $("commandPartners").innerHTML = asArray(command.partners).map((country) =>
      `<button class="partner-node" type="button" data-partner="${escapeHtml(country)}">${escapeHtml(country)}</button>`
    ).join("");

    $("historicalContinuity").innerHTML = asArray(command.historicalLinks).map((item) => {
      const record = events.find((event) => event.rid === item.recordId);
      const href = record?.u || "#evidence";
      return `<a class="continuity-card" href="${escapeHtml(href)}"${record ? ' target="_blank" rel="noopener"' : ""}>
        <span class="then-now">Now / then</span><h4>${escapeHtml(item.modern)}</h4><p>${escapeHtml(item.historical)}</p>
      </a>`;
    }).join("");

    $("reportProvenance").innerHTML = `
      <strong>${escapeHtml(report.tier || "Analytical source")}: ${escapeHtml(report.title || "Landau report")}</strong>
      <span>${escapeHtml(report.caveat || "Validate report claims against primary sources.")}</span>
      <a class="button-link" href="${escapeHtml(report.url || "#")}">${escapeHtml(report.lines || 0)} lines · ${escapeHtml(report.references || 0)} references</a>`;
  }

  function renderEras() {
    $("eraRail").innerHTML = portal.eras.map((era) => {
      const count = events.filter((event) => inEra(event, era.id)).length;
      return `<button class="era-button${activeEra?.id === era.id ? " active" : ""}" type="button" data-era="${escapeHtml(era.id)}" data-status="${escapeHtml(era.status)}">
        <strong>${escapeHtml(era.label)}</strong><span>${escapeHtml(era.years)} · ${count} record${count === 1 ? "" : "s"}</span>
      </button>`;
    }).join("");
  }

  function renderTimeline() {
    if (!activeEra) return;
    const eraEvents = events.filter((event) => inEra(event, activeEra.id)).sort((a, b) => Number(a.y) - Number(b.y));
    $("timelineContext").innerHTML = `
      <p class="eyebrow" style="color:var(--teal)">${escapeHtml(activeEra.years)}</p>
      <h3>${escapeHtml(activeEra.label)}</h3>
      <p>${escapeHtml(activeEra.question)}</p>
      <span class="coverage-tag ${activeEra.status === "research" ? "research" : ""}">${activeEra.status === "research" ? "Research queue" : "Verified seed coverage"}</span>`;
    $("timelineRecords").innerHTML = eraEvents.length
      ? eraEvents.map((event) => `<article class="timeline-record"><div class="timeline-year">${escapeHtml(event.y)}</div><div><h4>${escapeHtml(event.t)}</h4><p>${escapeHtml(event.s)} · ${escapeHtml(event.de || "Open source for context")}</p><a href="${escapeHtml(event.u)}" target="_blank" rel="noopener">View source ↗</a></div></article>`).join("")
      : `<div class="empty-state"><strong>No verified records indexed for this era yet.</strong><br>This gap is a research queue for FRUS, NARA, presidential-library, USGS, Bureau of Mines, and congressional sources.</div>`;
  }

  function mapCoordinates(country) {
    return {
      x: ((country.lon + 180) / 360) * 960,
      y: ((90 - country.lat) / 180) * 500
    };
  }

  function renderMix(containerId, rows) {
    const max = Math.max(1, ...rows.map((row) => row[1]));
    $(containerId).innerHTML = rows.length ? rows.slice(0, 6).map(([label, count]) => `
      <div class="mix-row">
        <div class="mix-label"><span>${escapeHtml(titleCase(label))}</span><strong>${count}</strong></div>
        <div class="mix-bar"><span style="width:${Math.max(5, Math.round((count / max) * 100))}%"></span></div>
      </div>`).join("") : '<p class="analysis-summary">No matching records.</p>';
  }

  function countsBy(values) {
    const counts = new Map();
    values.filter(Boolean).forEach((value) => counts.set(value, (counts.get(value) || 0) + 1));
    return [...counts.entries()].sort((a, b) => b[1] - a[1] || text(a[0]).localeCompare(text(b[0])));
  }

  function renderMap() {
    const mineral = $("mapMineral").value;
    const source = $("mapSource").value;
    const through = Number($("mapYear").value || 2026);
    $("mapYearValue").value = through;
    $("mapYearValue").textContent = through;

    const matching = events.filter((event) => Number(event.y || 0) <= through && fieldMatches(event, "mineral", mineral) && fieldMatches(event, "source", source));
    const byCountry = new Map();
    matching.forEach((event) => eventField(event, "country").forEach((name) => {
      const country = countryIndex.get(normalize(name));
      if (!country) return;
      if (!byCountry.has(country.name)) byCountry.set(country.name, []);
      byCountry.get(country.name).push(event);
    }));

    const us = mapCoordinates(countryIndex.get("united states") || { lon: -98, lat: 39 });
    const arcs = [];
    const markers = [];
    for (const [name, rows] of byCountry) {
      const country = countryIndex.get(normalize(name));
      if (!country) continue;
      const point = mapCoordinates(country);
      if (name !== "United States") {
        const midpointX = (point.x + us.x) / 2;
        const midpointY = Math.min(point.y, us.y) - 42;
        arcs.push(`<path d="M ${point.x.toFixed(1)} ${point.y.toFixed(1)} Q ${midpointX.toFixed(1)} ${midpointY.toFixed(1)} ${us.x.toFixed(1)} ${us.y.toFixed(1)}" fill="none" stroke="#1b7c8d" stroke-opacity=".34" stroke-width="${Math.min(5, 1 + rows.length)}"/>`);
      }
      const radius = Math.min(18, 7 + rows.length * 1.5);
      markers.push(`<g class="map-marker" data-country="${escapeHtml(name)}" role="button" tabindex="0" aria-label="Filter evidence for ${escapeHtml(name)}">
        <circle cx="${point.x.toFixed(1)}" cy="${point.y.toFixed(1)}" r="${radius}" fill="#9c3c3c" fill-opacity=".9" stroke="#ffffff" stroke-width="2"/>
        <text x="${point.x.toFixed(1)}" y="${(point.y + 3.5).toFixed(1)}" text-anchor="middle" fill="#ffffff" font-size="10" font-weight="700">${rows.length}</text>
        <title>${escapeHtml(name)}: ${rows.length} indexed record${rows.length === 1 ? "" : "s"}</title>
      </g>`);
    }

    $("mapCanvas").innerHTML = `
      <svg viewBox="0 0 960 500" role="img" aria-label="World map of indexed critical minerals evidence">
        <rect width="960" height="500" fill="transparent"/>
        ${[-120,-60,0,60,120].map((lon) => `<line x1="${((lon + 180) / 360) * 960}" y1="0" x2="${((lon + 180) / 360) * 960}" y2="500" stroke="#8ca6b2" stroke-opacity=".22"/>`).join("")}
        ${[-60,-30,0,30,60].map((lat) => `<line x1="0" y1="${((90 - lat) / 180) * 500}" x2="960" y2="${((90 - lat) / 180) * 500}" stroke="#8ca6b2" stroke-opacity=".22"/>`).join("")}
        <path d="M72 160 C130 96 236 92 290 148 C325 184 305 244 258 276 C225 299 214 347 184 385 C156 362 148 306 112 279 C72 249 45 194 72 160Z" fill="#9db8aa" opacity=".62"/>
        <path d="M404 128 C442 96 501 89 536 115 C565 91 628 95 684 132 C726 161 745 212 713 241 C681 270 632 250 611 280 C588 314 572 369 527 390 C488 353 493 297 456 267 C417 236 372 159 404 128Z" fill="#9db8aa" opacity=".62"/>
        <path d="M682 128 C748 88 852 105 913 166 C947 199 932 255 894 275 C855 297 819 270 778 282 C735 295 692 248 664 202 C647 174 653 145 682 128Z" fill="#9db8aa" opacity=".62"/>
        <path d="M740 345 C781 319 849 334 880 376 C855 412 783 420 727 390 C714 372 720 354 740 345Z" fill="#9db8aa" opacity=".62"/>
        <path d="M330 62 C350 40 382 45 393 70 C378 94 348 98 326 82Z" fill="#9db8aa" opacity=".62"/>
        ${arcs.join("")}
        ${markers.join("")}
      </svg>
      <div class="map-legend">Circle = indexed records · Line = evidence-linked relationship to the United States</div>`;

    $("mapCanvas").querySelectorAll(".map-marker").forEach((marker) => {
      const activate = () => {
        searchState.country = marker.dataset.country || "";
        $("filterCountry").value = searchState.country;
        renderEvidence();
        updateUrl();
        $("evidence").scrollIntoView({ behavior: "smooth", block: "start" });
      };
      marker.addEventListener("click", activate);
      marker.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") { event.preventDefault(); activate(); }
      });
    });

    const years = matching.map((event) => Number(event.y || 0)).filter(Boolean);
    const yearSpan = years.length ? `${Math.min(...years)}-${Math.max(...years)}` : "no indexed years";
    $("mapSummary").textContent = matching.length
      ? `${matching.length} records across ${byCountry.size} mapped countries and ${unique(matching.flatMap((event) => eventField(event, "source"))).length} source types, spanning ${yearSpan}. Select a marker to inspect its evidence.`
      : "No records match this map view. The result is a coverage gap, not evidence that the relationship did not exist.";
    renderMix("sourceMix", countsBy(matching.flatMap((event) => eventField(event, "source"))));
    renderMix("stageMix", countsBy(matching.flatMap((event) => eventField(event, "stage"))));
  }

  function renderMinerals() {
    $("mineralGrid").innerHTML = portal.minerals.map((mineral) => {
      const count = events.filter((event) => fieldMatches(event, "mineral", mineral.name)).length;
      return `<button class="intel-card" type="button" data-mineral="${escapeHtml(mineral.name.toLowerCase())}">
        <div class="intel-top"><span class="intel-symbol">${escapeHtml(mineral.symbol)}</span><span class="intel-count">${count} indexed record${count === 1 ? "" : "s"}</span></div>
        <h3>${escapeHtml(mineral.name)}</h3><p>${escapeHtml(mineral.prompt)}</p>
      </button>`;
    }).join("");
  }

  function renderCountries() {
    $("countryTableBody").innerHTML = portal.countries.map((country) => {
      const rows = events.filter((event) => fieldMatches(event, "country", country.name));
      const sources = unique(rows.flatMap((event) => eventField(event, "source")));
      return `<tr data-country="${escapeHtml(country.name)}" tabindex="0">
        <td class="country-name">${escapeHtml(country.name)}</td>
        <td class="country-focus">${escapeHtml(country.focus)}</td>
        <td>${rows.length}</td><td>${sources.length}</td>
      </tr>`;
    }).join("");

    $("adminList").innerHTML = portal.administrations.map((admin, index) => {
      const isLast = index === portal.administrations.length - 1;
      const count = events.filter((event) => {
        const year = Number(event.y || 0);
        return year >= admin.start && (isLast ? year <= admin.end : year < admin.end);
      }).length;
      return `<div class="admin-row"><strong>${escapeHtml(admin.label)}</strong><span>${admin.start}-${admin.end}</span><b>${count}</b></div>`;
    }).join("");
  }

  function frusSubjectNames(record) {
    return frusSubjects.filter((subject) => record.mask & Number(subject.bit || 0)).map((subject) => subject.name);
  }

  function frusVolumeLabel(volumeId) {
    let label = text(volumeId).replace(/^frus/i, "");
    label = label.replace(/Supp/g, " Supplement");
    label = label.replace(/ve(\d+)/gi, (_match, number) => `, Electronic Volume ${Number(number)}`);
    label = label.replace(/v(\d+)/gi, (_match, number) => `, Volume ${Number(number)}`);
    label = label.replace(/p(\d+)/gi, (_match, number) => `, Part ${Number(number)}`);
    return `FRUS ${label}`;
  }

  function frusHaystack(record) {
    return normalize([
      record.volume, record.documentId, record.start, record.end, record.context,
      frusSubjectNames(record), record.verified?.t, record.verified?.de,
      record.verified?.mi, record.verified?.cty
    ].flat().join(" "));
  }

  function filteredFrus() {
    const query = frusState.query.trim();
    const tokens = queryTokens(query);
    const queryRange = queryEraRange(query);
    const subjectBit = Number(frusState.subject || 0);
    const from = Number(frusState.from || 0);
    const to = Number(frusState.to || 0);
    return frusDocuments.filter((record) => {
      if (subjectBit && !(record.mask & subjectBit)) return false;
      if (from && record.end < from) return false;
      if (to && record.start > to) return false;
      if (queryRange && (record.end < queryRange.start || record.start > queryRange.end)) return false;
      if (tokens.length && !tokens.every((token) => frusHaystack(record).includes(token))) return false;
      return true;
    });
  }

  function frusCard(record) {
    const subjects = frusSubjectNames(record);
    const verified = record.verified;
    const title = verified?.t || `${frusVolumeLabel(record.volume)} · ${record.documentId}`;
    const span = record.start === record.end ? record.start : `${record.start}-${record.end}`;
    const verifiedSummary = verified?.de
      ? `<p class="frus-verified-summary"><strong>Verified summary:</strong> ${escapeHtml(verified.de)}</p>` : "";
    return `<article class="record-card high frus-record-card">
      <div class="record-meta"><span>${escapeHtml(span)}</span><span>·</span><span>${escapeHtml(record.volume)}</span><span>·</span><span>${escapeHtml(record.documentId)}</span></div>
      <h3>${escapeHtml(title)}</h3>
      <p><strong>Volume context:</strong> ${escapeHtml(record.context)}</p>
      ${verifiedSummary}
      <div class="badge-row" style="margin-top:9px">
        <span class="badge official">Official USG</span>
        ${verified ? '<span class="badge verified">Verified document metadata</span>' : ""}
        ${subjects.map((subject) => `<span class="badge">${escapeHtml(subject)}</span>`).join("")}
      </div>
      <div class="record-actions"><a class="text-link" href="${escapeHtml(record.url)}" target="_blank" rel="noopener">Open FRUS document ↗</a></div>
    </article>`;
  }

  function populateFrusControls() {
    const subjectOptions = ['<option value="">All four authorities</option>']
      .concat(frusSubjects.map((subject) => `<option value="${subject.bit}"${text(subject.bit) === frusState.subject ? " selected" : ""}>${escapeHtml(subject.name)}</option>`));
    $("frusSubject").innerHTML = subjectOptions.join("");
    const start = Number(frusIndex.meta?.yearStart || 1861);
    const end = Number(frusIndex.meta?.yearEnd || 1992);
    const years = Array.from({ length: Math.max(0, end - start + 1) }, (_value, index) => start + index);
    $("frusFromYear").innerHTML = ['<option value="">Earliest</option>']
      .concat(years.map((year) => `<option value="${year}"${text(year) === frusState.from ? " selected" : ""}>${year}</option>`)).join("");
    $("frusToYear").innerHTML = ['<option value="">Latest</option>']
      .concat(years.map((year) => `<option value="${year}"${text(year) === frusState.to ? " selected" : ""}>${year}</option>`)).join("");
    $("frusQuery").value = frusState.query;
  }

  function renderFrus() {
    const meta = frusIndex.meta || {};
    const matches = filteredFrus();
    const visible = matches.slice(0, frusState.limit);
    const span = meta.yearStart && meta.yearEnd ? `${meta.yearStart}-${meta.yearEnd}` : "Undated";
    $("frusStats").innerHTML = [
      [Number(meta.documents || frusDocuments.length).toLocaleString(), "Mapped documents"],
      [Number(meta.volumes || 0).toLocaleString(), "FRUS volumes"],
      [span, "Volume span"],
      [frusSubjects.length, "Subject authorities"]
    ].map(([value, label]) => `<div class="frus-stat"><strong>${value}</strong><span>${escapeHtml(label)}</span></div>`).join("");

    $("frusAuthorityList").innerHTML = frusSubjects.map((subject) => {
      const active = text(subject.bit) === frusState.subject ? " active" : "";
      return `<button class="frus-authority-row${active}" type="button" data-frus-subject="${subject.bit}">
        <span><strong>${escapeHtml(subject.name)}</strong><small>Office of the Historian subject authority</small></span>
        <b>${Number(subject.references || 0).toLocaleString()}</b>
      </button>`;
    }).join("");

    $("frusResultsCount").textContent = `${matches.length.toLocaleString()} document${matches.length === 1 ? "" : "s"}`;
    $("frusCorpusNote").innerHTML = `<strong>Discovery note:</strong> ${escapeHtml(meta.caveat || "Review each document before citation.")} Volume years and chapter headings provide navigation context; they are not document-level dates or titles.`;
    $("frusRecords").innerHTML = visible.length
      ? visible.map(frusCard).join("")
      : '<div class="empty-state"><strong>No FRUS authority records match this view.</strong><br>Broaden the search terms, subject authority, or volume years.</div>';
    $("frusLoadMore").hidden = visible.length >= matches.length;
    $("frusLoadMore").textContent = `Show ${Math.min(36, matches.length - visible.length).toLocaleString()} more documents`;
    const prompts = ["strategic materials", "Chile", "bauxite", "sea bed mining", "cobalt during World War II"];
    $("frusQueries").innerHTML = prompts.map((prompt) => `<button class="filter-chip" type="button" data-frus-query="${escapeHtml(prompt)}">${escapeHtml(prompt)}</button>`).join("");
  }

  function renderEvidence() {
    const matches = filteredEvidence();
    $("resultsCount").textContent = `${matches.length} record${matches.length === 1 ? "" : "s"}`;
    $("evidenceResults").innerHTML = matches.length
      ? matches.map((event) => recordCard(event)).join("")
      : '<div class="empty-state" style="grid-column:1/-1"><strong>No indexed evidence matches this view.</strong><br>Broaden the filters or use the NARA Catalog search to open a new archival discovery lane.</div>';
  }

  function updateUrl() {
    const params = new URLSearchParams();
    const keys = { query: "q", mineral: "mineral", country: "country", source: "source", stage: "stage", era: "era" };
    Object.entries(keys).forEach(([stateKey, param]) => {
      if (searchState[stateKey]) params.set(param, searchState[stateKey]);
    });
    const frusKeys = { query: "frus_q", subject: "frus_subject", from: "frus_from", to: "frus_to" };
    Object.entries(frusKeys).forEach(([stateKey, param]) => {
      if (frusState[stateKey]) params.set(param, frusState[stateKey]);
    });
    const query = params.toString();
    history.replaceState(null, "", `${location.pathname}${query ? `?${query}` : ""}${location.hash || ""}`);
  }

  function loadUrlState() {
    const params = new URLSearchParams(location.search);
    searchState.query = params.get("q") || "";
    searchState.mineral = params.get("mineral") || "";
    searchState.country = params.get("country") || "";
    searchState.source = params.get("source") || "";
    searchState.stage = params.get("stage") || "";
    searchState.era = params.get("era") || "";
    frusState.query = params.get("frus_q") || "";
    frusState.subject = params.get("frus_subject") || "";
    frusState.from = params.get("frus_from") || "";
    frusState.to = params.get("frus_to") || "";
    if (searchState.era) activeEra = portal.eras.find((era) => era.id === searchState.era) || activeEra;
  }

  function applyGlobalQuery(query) {
    searchState.query = query.trim();
    frusState.query = searchState.query;
    frusState.limit = 36;
    $("evidenceQuery").value = searchState.query;
    $("globalQuery").value = searchState.query;
    $("frusQuery").value = frusState.query;
    renderEvidence();
    renderFrus();
    updateUrl();
    const destination = filteredFrus().length ? "frus" : "evidence";
    $(destination).scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function clearFilters() {
    Object.keys(searchState).forEach((key) => { searchState[key] = ""; });
    populateControls();
    renderEvidence();
    updateUrl();
  }

  function bindEvents() {
    $("globalSearchForm").addEventListener("submit", (event) => {
      event.preventDefault();
      applyGlobalQuery($("globalQuery").value);
    });
    $("promptRow").addEventListener("click", (event) => {
      const button = event.target.closest("[data-query]");
      if (button) applyGlobalQuery(button.dataset.query || "");
    });
    $("eraRail").addEventListener("click", (event) => {
      const button = event.target.closest("[data-era]");
      if (!button) return;
      activeEra = portal.eras.find((era) => era.id === button.dataset.era) || activeEra;
      renderEras();
      renderTimeline();
      $("timeline").scrollIntoView({ behavior: "smooth", block: "start" });
    });
    ["mapMineral", "mapSource", "mapYear"].forEach((id) => $(id).addEventListener(id === "mapYear" ? "input" : "change", renderMap));

    $("mineralGrid").addEventListener("click", (event) => {
      const button = event.target.closest("[data-mineral]");
      if (!button) return;
      searchState.mineral = button.dataset.mineral || "";
      $("filterMineral").value = searchState.mineral;
      renderEvidence();
      updateUrl();
      $("evidence").scrollIntoView({ behavior: "smooth", block: "start" });
    });

    $("commandPartners").addEventListener("click", (event) => {
      const button = event.target.closest("[data-partner]");
      if (!button) return;
      searchState.country = button.dataset.partner || "";
      $("filterCountry").value = searchState.country;
      renderEvidence();
      updateUrl();
      $("evidence").scrollIntoView({ behavior: "smooth", block: "start" });
    });

    const activateCountry = (row) => {
      searchState.country = row.dataset.country || "";
      $("filterCountry").value = searchState.country;
      renderEvidence();
      updateUrl();
      $("evidence").scrollIntoView({ behavior: "smooth", block: "start" });
    };
    $("countryTableBody").addEventListener("click", (event) => {
      const row = event.target.closest("[data-country]");
      if (row) activateCountry(row);
    });
    $("countryTableBody").addEventListener("keydown", (event) => {
      const row = event.target.closest("[data-country]");
      if (row && (event.key === "Enter" || event.key === " ")) { event.preventDefault(); activateCountry(row); }
    });

    $("frusQueries").addEventListener("click", (event) => {
      const button = event.target.closest("[data-frus-query]");
      if (!button) return;
      frusState.query = button.dataset.frusQuery || "";
      frusState.limit = 36;
      $("frusQuery").value = frusState.query;
      renderFrus();
      updateUrl();
    });

    $("frusAuthorityList").addEventListener("click", (event) => {
      const button = event.target.closest("[data-frus-subject]");
      if (!button) return;
      frusState.subject = frusState.subject === button.dataset.frusSubject ? "" : button.dataset.frusSubject;
      frusState.limit = 36;
      $("frusSubject").value = frusState.subject;
      renderFrus();
      updateUrl();
    });

    $("frusQuery").addEventListener("input", () => {
      frusState.query = $("frusQuery").value;
      frusState.limit = 36;
      renderFrus();
      updateUrl();
    });
    [["frusSubject", "subject"], ["frusFromYear", "from"], ["frusToYear", "to"]].forEach(([id, key]) => {
      $(id).addEventListener("change", () => {
        frusState[key] = $(id).value;
        frusState.limit = 36;
        renderFrus();
        updateUrl();
      });
    });
    $("frusClear").addEventListener("click", () => {
      Object.assign(frusState, { query: "", subject: "", from: "", to: "", limit: 36 });
      populateFrusControls();
      renderFrus();
      updateUrl();
    });
    $("frusLoadMore").addEventListener("click", () => {
      frusState.limit += 36;
      renderFrus();
    });

    const filterBindings = {
      evidenceQuery: ["query", "input"], filterMineral: ["mineral", "change"],
      filterCountry: ["country", "change"], filterSource: ["source", "change"],
      filterStage: ["stage", "change"], filterEra: ["era", "change"]
    };
    Object.entries(filterBindings).forEach(([id, [key, eventName]]) => {
      $(id).addEventListener(eventName, () => {
        searchState[key] = $(id).value;
        renderEvidence();
        updateUrl();
      });
    });

    $("clearFilters").addEventListener("click", clearFilters);
    $("naraSearch").addEventListener("click", () => {
      const query = searchState.query || [searchState.mineral, searchState.country, "strategic materials"].filter(Boolean).join(" ") || "critical minerals";
      window.open(`https://catalog.archives.gov/search?q=${encodeURIComponent(query)}&availableOnline=true`, "_blank", "noopener");
    });
    $("shareView").addEventListener("click", async () => {
      updateUrl();
      const button = $("shareView");
      try {
        await navigator.clipboard.writeText(location.href);
        button.textContent = "Link copied";
      } catch (_error) {
        button.textContent = "Use address bar to copy";
      }
      setTimeout(() => { button.textContent = "Copy shareable view"; }, 1800);
    });

    $("themeToggle").addEventListener("click", () => {
      const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
      document.documentElement.dataset.theme = next;
      localStorage.setItem("criticalMineralsTheme", next);
      $("themeToggle").setAttribute("aria-label", `Use ${next === "dark" ? "light" : "dark"} mode`);
    });
  }

  function initTheme() {
    const saved = localStorage.getItem("criticalMineralsTheme");
    const preferred = matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    document.documentElement.dataset.theme = saved || preferred;
  }

  function restoreHashPosition() {
    const id = decodeURIComponent(location.hash.replace(/^#/, ""));
    const target = id ? document.getElementById(id) : null;
    if (target) requestAnimationFrame(() => target.scrollIntoView({ block: "start" }));
  }

  function init() {
    initTheme();
    loadUrlState();
    populateControls();
    populateFrusControls();
    renderMetrics();
    renderPromptRow();
    renderCommandCenter();
    renderEras();
    renderTimeline();
    renderMap();
    renderMinerals();
    renderCountries();
    renderFrus();
    renderEvidence();
    bindEvents();
    restoreHashPosition();
  }

  init();
})();
