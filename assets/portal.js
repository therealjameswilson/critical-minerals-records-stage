(() => {
  "use strict";

  const portal = window.CRITICAL_MINERALS_PORTAL || {
    eras: [], minerals: [], countries: [], administrations: [], sources: [],
    diplomaticProblems: [], frusPathways: [], frusAnnotations: {}, searchPrompts: []
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
  const formatCount = (value) => Number(value || 0).toLocaleString();

  const events = Object.entries(typeof EVENTS_CACHE === "object" ? EVENTS_CACHE : {})
    .flatMap(([dateKey, rows]) => asArray(rows).map((row) => ({ ...row, dateKey })))
    .sort((a, b) => Number(b.y || 0) - Number(a.y || 0) || text(a.t).localeCompare(text(b.t)));
  const eventById = new Map(events.map((event) => [event.rid, event]));

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

  const searchState = { query: "", mineral: "", country: "", source: "", stage: "", era: "", lens: "" };
  const frusState = { query: "", subject: "", from: "", to: "", limit: 36 };
  let activeEra = portal.eras.find((era) => era.id === "ministerial-era") || portal.eras[0] || null;
  let activeCountry = "United States";

  function eventField(event, key) {
    const aliases = {
      mineral: "mi", country: "cty", source: "st", stage: "ch", evidence: "et",
      agency: "ag", confidence: "cf", caveat: "cv", citation: "cu", recordId: "rid"
    };
    return asArray(event[aliases[key] || key]);
  }

  function subjectNames(event) {
    return asArray(event.sb).map((index) => SUBJECT_TAXONOMY[index]?.n || "").filter(Boolean);
  }

  function eventHaystack(event) {
    const annotation = portal.frusAnnotations?.[event.rid] || {};
    return normalize([
      event.t, event.de, event.s, event.st, event.dd, event.y, event.et, event.ch,
      event.mi, event.cty, event.ag, event.cv, event.rid, subjectNames(event),
      Object.values(annotation)
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
    const q = normalize(query)
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

  function lensDefinition(value = searchState.lens) {
    const [type, id] = text(value).split(":", 2);
    if (type === "problem") return portal.diplomaticProblems.find((item) => item.id === id) || null;
    if (type === "pathway") return portal.frusPathways.find((item) => item.id === id) || null;
    return null;
  }

  function filteredEvidence() {
    const lens = lensDefinition();
    const lensIds = lens ? new Set(asArray(lens.recordIds)) : null;
    return events.filter((event) =>
      (!lensIds || lensIds.has(event.rid)) &&
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

  function isVerifiedFrus(event) {
    return normalize(event.st || event.s) === "frus" && normalize(event.cf) === "high" && !isNeedsReview(event);
  }

  function eventDate(event) {
    if (event.dd) return event.dd;
    return `${event.y || "Undated"}${event.dateKey ? ` · ${event.dateKey}` : ""}`;
  }

  function layerBadge(label, className = "") {
    return `<span class="evidence-layer ${escapeHtml(className)}">${escapeHtml(label)}</span>`;
  }

  function annotationMarkup(event, compact = false) {
    if (compact) return "";
    const annotation = portal.frusAnnotations?.[event.rid];
    if (!annotation) return "";
    return `<div class="editorial-annotation">
      <div class="annotation-heading">${layerBadge("Editorial synthesis", "editorial")}<strong>Curated reading note</strong></div>
      <dl>
        <div><dt>Policy problem</dt><dd>${escapeHtml(annotation.policyProblem)}</dd></div>
        <div><dt>State role</dt><dd>${escapeHtml(annotation.stateRole)}</dd></div>
        <div><dt>Instrument</dt><dd>${escapeHtml(annotation.instrument)}</dd></div>
        <div><dt>Key historical concept</dt><dd>${escapeHtml(annotation.keyConcept)}</dd></div>
      </dl>
      <div class="why-read">${layerBadge("Contemporary comparison", "comparison")}<span>${escapeHtml(annotation.whyReadNow)}</span></div>
    </div>`;
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
    const metadataLayer = isVerifiedFrus(event) ? layerBadge("FRUS metadata", "metadata") : "";
    const openLabel = isAnalytical(event) ? "Read analytical report" : "Open authoritative source ↗";
    return `<article class="record-card ${escapeHtml(confidence)}" data-record-id="${escapeHtml(event.rid || "")}">
      <div class="record-meta"><span>${escapeHtml(eventDate(event))}</span><span>·</span><span>${escapeHtml(event.st || event.s || "Source")}</span></div>
      <h3>${escapeHtml(event.t || "Untitled record")}</h3>
      <p>${escapeHtml(event.de || "Metadata record. Open the authoritative source for full context.")}</p>
      <div class="badge-row record-layers">${metadataLayer}</div>
      <div class="badge-row" style="margin-top:9px">
        ${official}${analytical}${review}
        ${minerals.map((item) => `<span class="badge">${escapeHtml(titleCase(item))}</span>`).join("")}
        ${countries.map((item) => `<span class="badge">${escapeHtml(item)}</span>`).join("")}
      </div>
      ${annotationMarkup(event, compact)}
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
    const verifiedFrus = events.filter(isVerifiedFrus).length;
    const verifiedPathways = portal.frusPathways.filter((item) => item.status === "verified").length;
    const curatedCountries = portal.countries.filter((item) => item.history?.status === "curated").length;
    const needsReview = events.filter(isNeedsReview).length;
    const metrics = [
      [verifiedPathways, "Curated FRUS pathways"],
      [verifiedFrus, "Verified FRUS records"],
      [portal.diplomaticProblems.length, "Diplomatic problem lenses"],
      [portal.eras.length, "Historical eras framed"],
      [curatedCountries, "Curated country histories"],
      [needsReview, "Records needing verification"]
    ];
    $("metricsStrip").innerHTML = metrics.map(([value, label]) =>
      `<div class="metric"><strong>${formatCount(value)}</strong><span>${escapeHtml(label)}</span></div>`
    ).join("");
  }

  function renderPromptRow() {
    $("promptRow").innerHTML = portal.searchPrompts.map((prompt) => {
      const attrs = prompt.problemId ? `data-problem-jump="${escapeHtml(prompt.problemId)}"`
        : `data-pathway-jump="${escapeHtml(prompt.pathwayId || "")}"`;
      return `<button type="button" ${attrs}>${escapeHtml(prompt.label)}</button>`;
    }).join("");
  }

  function eventLinks(recordIds, compact = false) {
    const rows = recordIds.map((recordId) => eventById.get(recordId)).filter(Boolean);
    if (!rows.length) return '<p class="research-gap">No document-level record is verified in the current seed set.</p>';
    return `<div class="pathway-records">${rows.map((event) => `<a href="${escapeHtml(event.u)}" target="_blank" rel="noopener">
      <span>${escapeHtml(event.y)}</span><strong>${escapeHtml(event.t)}</strong>${compact ? "" : `<small>${escapeHtml(event.st || event.s)}</small>`}
    </a>`).join("")}</div>`;
  }

  function renderPresentContext() {
    const context = portal.presentContext || { priorities: [], chronology: [], comparisons: [], report: {} };
    $("presentRoutes").innerHTML = context.priorities.map((item) => {
      const attrs = item.pathwayId ? `data-pathway-jump="${escapeHtml(item.pathwayId)}"`
        : `data-problem-jump="${escapeHtml(item.problemId || "")}"`;
      return `<button class="present-route" type="button" ${attrs}>
        <span class="source-tier ${normalize(item.tier).includes("analytical") ? "analysis" : ""}">${escapeHtml(item.tier)}</span>
        <strong>${escapeHtml(item.concern)}</strong>
        <span class="route-action">Open documentary route →</span>
      </button>`;
    }).join("");

    $("contextChronology").innerHTML = context.chronology.map((item) => `<div class="operation-row">
      <span class="operation-date">${escapeHtml(item.date)}</span><span class="operation-dot"></span>
      <div><strong>${escapeHtml(item.title)}</strong><p>${escapeHtml(item.detail)}</p></div>
      <a class="operation-source" href="${escapeHtml(item.url)}" target="_blank" rel="noopener">${escapeHtml(item.source)} ↗</a>
    </div>`).join("");

    $("historicalComparisons").innerHTML = context.comparisons.map((item) => {
      const event = eventById.get(item.recordId);
      return `<article class="comparison-card">
        <div class="comparison-title"><h4>${escapeHtml(item.title)}</h4>${layerBadge("Editorial synthesis", "editorial")}</div>
        <div><span>Historical problem</span><p>${escapeHtml(item.historicalProblem)}</p></div>
        <div><span>Contemporary resonance</span><p>${escapeHtml(item.contemporaryResonance)}</p></div>
        <div class="critical-difference"><span>Critical difference</span><p>${escapeHtml(item.criticalDifference)}</p></div>
        <div class="record-actions">
          ${event ? `<a class="text-link" href="${escapeHtml(event.u)}" target="_blank" rel="noopener">Open FRUS record ↗</a>` : ""}
          <button class="text-link" type="button" data-pathway-jump="${escapeHtml(item.pathwayId)}">Open pathway</button>
        </div>
      </article>`;
    }).join("");

    const report = context.report || {};
    $("reportProvenance").innerHTML = `${layerBadge("Analytical synthesis", "editorial")}
      <div><strong>${escapeHtml(report.title || "Contemporary analytical report")}</strong><span>${escapeHtml(report.caveat || "")}</span></div>
      <a class="text-link" href="${escapeHtml(report.url || "#")}" target="_blank" rel="noopener">${formatCount(report.lines)} lines · ${formatCount(report.references)} references ↗</a>`;
  }

  function renderProblems() {
    $("problemGrid").innerHTML = portal.diplomaticProblems.map((problem) => {
      const records = asArray(problem.recordIds).map((id) => eventById.get(id)).filter(Boolean);
      const isResearch = problem.status === "research";
      const action = isResearch
        ? `<button class="text-link" type="button" data-frus-research="${escapeHtml(problem.frusQuery || problem.title)}">Search FRUS index</button>`
        : `<button class="text-link" type="button" data-lens="problem:${escapeHtml(problem.id)}">Open ${records.length} verified record${records.length === 1 ? "" : "s"}</button>`;
      return `<article class="problem-card ${isResearch ? "research" : "verified"}">
        <div class="problem-card-heading"><span>${isResearch ? "Research queue" : "Verified pathway evidence"}</span><b>${isResearch ? "—" : records.length}</b></div>
        <h3>${escapeHtml(problem.title)}</h3>
        <p>${escapeHtml(problem.summary)}</p>
        <dl class="problem-facts">
          <div><dt>Periods</dt><dd>${escapeHtml(asArray(problem.periods).join(" · "))}</dd></div>
          <div><dt>Countries</dt><dd>${escapeHtml(asArray(problem.countries).slice(0, 4).join(", ") || "To be established")}</dd></div>
          <div><dt>Materials</dt><dd>${escapeHtml(asArray(problem.minerals).slice(0, 5).map(titleCase).join(", ") || "To be established")}</dd></div>
        </dl>
        <div class="record-actions">${action}</div>
      </article>`;
    }).join("");
  }

  function renderPathways() {
    $("pathwayList").innerHTML = portal.frusPathways.map((pathway, index) => {
      const isResearch = pathway.status === "research";
      const instruments = asArray(pathway.instruments);
      return `<article class="pathway-card ${isResearch ? "research" : "verified"}" id="pathway-${escapeHtml(pathway.id)}">
        <div class="pathway-index"><span>${String(index + 1).padStart(2, "0")}</span><b>${isResearch ? "Research queue" : "Verified route"}</b></div>
        <div class="pathway-body">
          <div class="pathway-heading"><div><h3>${escapeHtml(pathway.title)}</h3><p>${escapeHtml(pathway.summary)}</p></div>${layerBadge(isResearch ? "Research queue" : "Editorial synthesis", isResearch ? "research" : "editorial")}</div>
          <div class="pathway-fields">
            <div><span>Historical problem</span><p>${escapeHtml(pathway.historicalProblem)}</p></div>
            ${pathway.whyItMattered ? `<div><span>Why it mattered at the time</span><p>${escapeHtml(pathway.whyItMattered)}</p></div>` : ""}
            <div><span>State Department role</span><p>${escapeHtml(pathway.stateRole)}</p></div>
            <div><span>Instruments</span><p>${escapeHtml(instruments.join(" · ") || "Not yet established")}</p></div>
          </div>
          <div class="pathway-comparison">
            <div><span>Contemporary resonance</span><p>${escapeHtml(pathway.contemporaryResonance)}</p></div>
            <div><span>Critical difference</span><p>${escapeHtml(pathway.criticalDifference)}</p></div>
          </div>
          <div class="pathway-source-block"><h4>Representative FRUS records</h4>${eventLinks(asArray(pathway.recordIds))}</div>
          <div class="record-actions">
            ${isResearch
              ? `<button class="text-link" type="button" data-frus-research="${escapeHtml(pathway.frusQuery || pathway.title)}">Filter full FRUS index</button>`
              : `<button class="text-link" type="button" data-lens="pathway:${escapeHtml(pathway.id)}">Open pathway records in Evidence Explorer</button>`}
          </div>
        </div>
      </article>`;
    }).join("");
  }

  function renderEras() {
    $("eraRail").innerHTML = portal.eras.map((era) => {
      const count = events.filter((event) => inEra(event, era.id)).length;
      const statusLabel = era.status === "research" ? "Research queue" : era.status === "verified" ? "Verified seed" : "Official current evidence";
      return `<button class="era-button${activeEra?.id === era.id ? " active" : ""}" type="button" data-era="${escapeHtml(era.id)}" data-status="${escapeHtml(era.status)}">
        <strong>${escapeHtml(era.label)}</strong><span>${escapeHtml(era.years)}</span><small>${escapeHtml(statusLabel)} · ${count} records</small>
      </button>`;
    }).join("");
  }

  function conceptList(label, values) {
    const rows = asArray(values);
    return rows.length ? `<div><dt>${escapeHtml(label)}</dt><dd>${rows.map((value) => `<span>${escapeHtml(value)}</span>`).join("")}</dd></div>` : "";
  }

  function renderTimeline() {
    if (!activeEra) return;
    const eraEvents = events.filter((event) => inEra(event, activeEra.id)).sort((a, b) => Number(a.y) - Number(b.y));
    const statusLabel = activeEra.status === "research" ? "Research queue" : activeEra.status === "verified" ? "Verified seed coverage" : "Official current evidence";
    $("timelineContext").innerHTML = `<p class="eyebrow" style="color:var(--teal)">${escapeHtml(activeEra.years)}</p>
      <h3>${escapeHtml(activeEra.label)}</h3>
      <span class="coverage-tag ${activeEra.status === "research" ? "research" : ""}">${escapeHtml(statusLabel)}</span>
      ${activeEra.bridgeNote ? `<p class="bridge-note">${escapeHtml(activeEra.bridgeNote)}</p>` : ""}
      ${activeEra.researchNote ? `<p class="research-gap">${escapeHtml(activeEra.researchNote)}</p>` : ""}
      <dl class="era-concepts">
        ${activeEra.dominantConcern ? `<div><dt>Dominant concern</dt><dd>${escapeHtml(activeEra.dominantConcern)}</dd></div>` : ""}
        ${conceptList("Institutions", activeEra.institutions)}
        ${conceptList("Instruments", activeEra.instruments)}
        ${conceptList("Characteristic terminology", activeEra.terminology)}
        ${activeEra.diplomaticTension ? `<div><dt>Central diplomatic tension</dt><dd>${escapeHtml(activeEra.diplomaticTension)}</dd></div>` : ""}
        ${activeEra.changeFromPriorEra ? `<div><dt>Change from prior era</dt><dd>${escapeHtml(activeEra.changeFromPriorEra)}</dd></div>` : ""}
      </dl>`;
    const visibleEvents = eraEvents.slice(0, 10);
    $("timelineRecords").innerHTML = visibleEvents.length ? `<div class="timeline-records-heading"><strong>${visibleEvents.length === eraEvents.length ? eraEvents.length : `${visibleEvents.length} of ${eraEvents.length}`} indexed records</strong><span>Record count is coverage, not policy intensity.</span></div>${visibleEvents.map((event) => `<article class="timeline-record">
      <div class="timeline-year">${escapeHtml(event.y)}</div>
      <div><h4>${escapeHtml(event.t)}</h4><p>${escapeHtml(event.s)} · ${escapeHtml(event.de || "Metadata record")}</p><a href="${escapeHtml(event.u)}" target="_blank" rel="noopener">View source ↗</a></div>
    </article>`).join("")}` : `<div class="empty-state"><strong>No verified event-level records indexed for this era.</strong><br>The FRUS subject index may contain leads, but a conceptual synthesis requires document-level verification.</div>`;
  }

  function renderAdministrations() {
    $("adminList").innerHTML = portal.administrations.map((admin, index) => {
      const isLast = index === portal.administrations.length - 1;
      const count = events.filter((event) => {
        const year = Number(event.y || 0);
        return year >= admin.start && (isLast ? year <= admin.end : year < admin.end);
      }).length;
      return `<div class="admin-row"><strong>${escapeHtml(admin.label)}</strong><span>${admin.start}-${admin.end}</span><b>${count}</b></div>`;
    }).join("");
  }

  function mapCoordinates(country) {
    return { x: ((country.lon + 180) / 360) * 960, y: ((90 - country.lat) / 180) * 500 };
  }

  function renderMix(containerId, rows) {
    const max = Math.max(...rows.map((row) => row.count), 1);
    $(containerId).innerHTML = rows.slice(0, 6).map((row) => `<div class="mix-row">
      <div class="mix-label"><span>${escapeHtml(titleCase(row.label))}</span><strong>${row.count}</strong></div>
      <div class="mix-bar"><span style="width:${Math.max(7, (row.count / max) * 100)}%"></span></div>
    </div>`).join("") || '<p class="empty-mini">No matching records.</p>';
  }

  function countsBy(values) {
    const counts = new Map();
    values.filter(Boolean).forEach((value) => counts.set(value, (counts.get(value) || 0) + 1));
    return [...counts.entries()].map(([label, count]) => ({ label, count })).sort((a, b) => b.count - a.count);
  }

  function renderMap() {
    const mineral = $("mapMineral").value;
    const source = $("mapSource").value;
    const year = Number($("mapYear").value);
    $("mapYearValue").textContent = year;
    const matching = events.filter((event) => Number(event.y || 0) <= year && fieldMatches(event, "mineral", mineral) && fieldMatches(event, "source", source));
    const byCountry = new Map();
    matching.forEach((event) => eventField(event, "country").forEach((name) => byCountry.set(name, (byCountry.get(name) || 0) + 1)));
    const markers = portal.countries.filter((country) => byCountry.has(country.name)).map((country) => {
      const point = mapCoordinates(country);
      const count = byCountry.get(country.name);
      const radius = Math.max(6, Math.min(22, 5 + Math.sqrt(count) * 3));
      const selected = normalize(country.name) === normalize(activeCountry);
      return `<g class="map-marker${selected ? " selected" : ""}" role="button" tabindex="0" data-country="${escapeHtml(country.name)}" aria-label="Show historical summary for ${escapeHtml(country.name)}; ${count} indexed records">
        <circle cx="${point.x}" cy="${point.y}" r="${radius}" fill="${selected ? "#d2a23b" : "#147a7e"}" opacity=".88" stroke="#ffffff" stroke-width="2"/><text x="${point.x}" y="${point.y + 3}" text-anchor="middle" fill="#ffffff" font-size="9" font-weight="700">${count}</text>
      </g>`;
    });
    $("mapCanvas").innerHTML = `<svg viewBox="0 0 960 500" role="img" aria-label="World map of indexed evidence coverage">
      <rect width="960" height="500" fill="transparent"/>
      ${[-120, -60, 0, 60, 120].map((lon) => `<line x1="${((lon + 180) / 360) * 960}" y1="0" x2="${((lon + 180) / 360) * 960}" y2="500" stroke="#8ca6b2" stroke-opacity=".22"/>`).join("")}
      ${[-60, -30, 0, 30, 60].map((lat) => `<line x1="0" y1="${((90 - lat) / 180) * 500}" x2="960" y2="${((90 - lat) / 180) * 500}" stroke="#8ca6b2" stroke-opacity=".22"/>`).join("")}
      <path d="M72 160 C130 96 236 92 290 148 C325 184 305 244 258 276 C225 299 214 347 184 385 C156 362 148 306 112 279 C72 249 45 194 72 160Z" fill="#9db8aa" opacity=".62"/>
      <path d="M404 128 C442 96 501 89 536 115 C565 91 628 95 684 132 C726 161 745 212 713 241 C681 270 632 250 611 280 C588 314 572 369 527 390 C488 353 493 297 456 267 C417 236 372 159 404 128Z" fill="#9db8aa" opacity=".62"/>
      <path d="M682 128 C748 88 852 105 913 166 C947 199 932 255 894 275 C855 297 819 270 778 282 C735 295 692 248 664 202 C647 174 653 145 682 128Z" fill="#9db8aa" opacity=".62"/>
      <path d="M740 345 C781 319 849 334 880 376 C855 412 783 420 727 390 C714 372 720 354 740 345Z" fill="#9db8aa" opacity=".62"/>
      <path d="M330 62 C350 40 382 45 393 70 C378 94 348 98 326 82Z" fill="#9db8aa" opacity=".62"/>
      ${markers.join("")}
    </svg><div class="map-legend"><strong>Evidence coverage only</strong> Marker size = indexed record count. It does not measure production, reserves, importance, or relationship intensity.</div>`;

    $("mapCanvas").querySelectorAll(".map-marker").forEach((marker) => {
      const activate = () => selectCountry(marker.dataset.country || "");
      marker.addEventListener("click", activate);
      marker.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") { event.preventDefault(); activate(); }
      });
    });

    const selected = countryIndex.get(normalize(activeCountry));
    const selectedCount = byCountry.get(activeCountry) || 0;
    if (selected) {
      const interpretation = selected.history?.status === "curated" ? selected.history.arc : selected.history?.researchGap;
      $("mapSummary").innerHTML = `<strong>${escapeHtml(selected.name)}:</strong> ${formatCount(selectedCount)} indexed records in this map view. ${escapeHtml(interpretation || "No curated historical interpretation is available.")}`;
    } else {
      const years = matching.map((event) => Number(event.y || 0)).filter(Boolean);
      const yearSpan = years.length ? `${Math.min(...years)}-${Math.max(...years)}` : "no indexed years";
      $("mapSummary").textContent = matching.length
        ? `${matching.length} records across ${byCountry.size} mapped countries and ${unique(matching.flatMap((event) => eventField(event, "source"))).length} source types, spanning ${yearSpan}.`
        : "No records match this map view. The result is a coverage gap, not evidence that the relationship did not exist.";
    }
    renderMix("sourceMix", countsBy(matching.flatMap((event) => eventField(event, "source"))));
    renderMix("stageMix", countsBy(matching.flatMap((event) => eventField(event, "stage"))));
  }

  function renderMinerals() {
    $("mineralGrid").innerHTML = portal.minerals.map((mineral) => {
      const rows = events.filter((event) => fieldMatches(event, "mineral", mineral.name));
      const historical = rows.filter(isVerifiedFrus).sort((a, b) => Number(a.y) - Number(b.y));
      const status = historical.length
        ? `${historical.length} verified FRUS seed${historical.length === 1 ? "" : "s"}; first in ${historical[0].y}`
        : "No verified FRUS seed yet";
      return `<button class="intel-card" type="button" data-mineral="${escapeHtml(mineral.name.toLowerCase())}">
        <div class="intel-top"><span class="intel-symbol">${escapeHtml(mineral.symbol)}</span><span class="intel-count">${rows.length} indexed records</span></div>
        <h3>${escapeHtml(mineral.name)}</h3><p>${escapeHtml(mineral.prompt)}</p>
        <div class="mineral-history-status">${escapeHtml(status)}</div>
        <div class="historical-terms"><span>Historical search language</span>${asArray(mineral.historicalTerms).map((term) => `<b>${escapeHtml(term)}</b>`).join("")}</div>
      </button>`;
    }).join("");
  }

  function renderCountryDetail() {
    const country = countryIndex.get(normalize(activeCountry)) || portal.countries[0];
    if (!country) return;
    const history = country.history || { status: "research", researchGap: "No curated history is available." };
    const rows = events.filter((event) => fieldMatches(event, "country", country.name));
    if (history.status === "curated") {
      $("countryDetail").innerHTML = `<div class="country-detail-heading"><div><span>Curated historical relationship</span><h3>${escapeHtml(country.name)}</h3><p>${escapeHtml(country.focus)}</p></div>${layerBadge("Editorial synthesis", "editorial")}</div>
        <div class="country-arc"><strong>Relationship arc</strong><p>${escapeHtml(history.arc)}</p></div>
        <dl class="country-facts">
          <div><dt>Materials in verified records</dt><dd>${escapeHtml(asArray(history.materials).map(titleCase).join(", "))}</dd></div>
          <div><dt>U.S. objectives</dt><dd>${escapeHtml(history.usObjectives)}</dd></div>
          <div><dt>Partner objectives</dt><dd>${escapeHtml(history.partnerObjectives)}</dd></div>
          ${history.historicalNames ? `<div><dt>Historical geography</dt><dd>${escapeHtml(history.historicalNames)}</dd></div>` : ""}
        </dl>
        ${eventLinks(asArray(history.recordIds), true)}
        <div class="record-actions"><button class="text-link" type="button" data-country-evidence="${escapeHtml(country.name)}">Open ${rows.length} country-tagged evidence record${rows.length === 1 ? "" : "s"}</button></div>`;
    } else {
      $("countryDetail").innerHTML = `<div class="country-detail-heading"><div><span>Research queue</span><h3>${escapeHtml(country.name)}</h3><p>${escapeHtml(country.focus)}</p></div>${layerBadge("Incomplete", "research")}</div>
        <p class="research-gap">${escapeHtml(history.researchGap)}</p>
        <div class="record-actions">
          ${history.frusQuery ? `<button class="text-link" type="button" data-frus-research="${escapeHtml(history.frusQuery)}">Search FRUS index</button>` : ""}
          <button class="text-link" type="button" data-country-evidence="${escapeHtml(country.name)}">Open ${rows.length} country-tagged evidence record${rows.length === 1 ? "" : "s"}</button>
        </div>`;
    }
  }

  function renderCountries() {
    $("countryTableBody").innerHTML = portal.countries.map((country) => {
      const rows = events.filter((event) => fieldMatches(event, "country", country.name));
      const history = country.history || {};
      const selected = normalize(country.name) === normalize(activeCountry);
      const status = history.status === "curated" ? "Curated" : "Research queue";
      const arc = history.status === "curated" ? history.arc : history.researchGap;
      return `<tr data-country="${escapeHtml(country.name)}" tabindex="0" aria-selected="${selected}">
        <td class="country-name">${escapeHtml(country.name)}</td>
        <td class="country-focus">${escapeHtml(arc || country.focus)}</td>
        <td>${rows.length}</td><td><span class="country-status ${history.status === "curated" ? "curated" : ""}">${escapeHtml(status)}</span></td>
      </tr>`;
    }).join("");
    renderCountryDetail();
  }

  function selectCountry(name) {
    if (!name || !countryIndex.has(normalize(name))) return;
    activeCountry = name;
    searchState.country = name;
    $("filterCountry").value = searchState.country;
    renderCountries();
    renderMap();
    updateUrl();
    $("countryDetail").scrollIntoView({ behavior: "smooth", block: "center" });
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
    const annotation = record.verified ? portal.frusAnnotations?.[record.verified.rid] || {} : {};
    return normalize([
      record.volume, record.documentId, record.start, record.end, record.context,
      frusSubjectNames(record), record.verified?.t, record.verified?.de,
      record.verified?.mi, record.verified?.cty, Object.values(annotation)
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

  function frusAnnotationMarkup(record) {
    const annotation = record.verified ? portal.frusAnnotations?.[record.verified.rid] : null;
    if (!annotation) return "";
    return `<div class="editorial-annotation">
      <div class="annotation-heading">${layerBadge("Editorial synthesis", "editorial")}<strong>Curated reading note</strong></div>
      <dl>
        <div><dt>Policy problem</dt><dd>${escapeHtml(annotation.policyProblem)}</dd></div>
        <div><dt>State role</dt><dd>${escapeHtml(annotation.stateRole)}</dd></div>
        <div><dt>Instrument</dt><dd>${escapeHtml(annotation.instrument)}</dd></div>
        <div><dt>Key historical concept</dt><dd>${escapeHtml(annotation.keyConcept)}</dd></div>
      </dl>
      <div class="why-read">${layerBadge("Contemporary comparison", "comparison")}<span>${escapeHtml(annotation.whyReadNow)}</span></div>
    </div>`;
  }

  function frusCard(record) {
    const subjects = frusSubjectNames(record);
    const verified = record.verified;
    const title = verified?.t || `${frusVolumeLabel(record.volume)} · ${record.documentId}`;
    const span = record.start === record.end ? record.start : `${record.start}-${record.end}`;
    const verifiedSummary = verified?.de ? `<p class="frus-verified-summary"><strong>Verified summary:</strong> ${escapeHtml(verified.de)}</p>` : "";
    const metadataLabel = verified ? "FRUS metadata" : "FRUS index metadata";
    return `<article class="record-card high frus-record-card">
      <div class="record-meta"><span>${escapeHtml(span)}</span><span>·</span><span>${escapeHtml(record.volume)}</span><span>·</span><span>${escapeHtml(record.documentId)}</span></div>
      <h3>${escapeHtml(title)}</h3>
      <p><strong>Volume context:</strong> ${escapeHtml(record.context)}</p>
      ${verifiedSummary}
      <div class="badge-row record-layers">${layerBadge(metadataLabel, "metadata")}</div>
      <div class="badge-row" style="margin-top:9px">
        <span class="badge official">Official USG</span>
        ${verified ? '<span class="badge verified">Verified document metadata</span>' : ""}
        ${subjects.map((subject) => `<span class="badge">${escapeHtml(subject)}</span>`).join("")}
      </div>
      ${frusAnnotationMarkup(record)}
      <div class="record-actions"><a class="text-link" href="${escapeHtml(record.url)}" target="_blank" rel="noopener">Open FRUS document ↗</a></div>
    </article>`;
  }

  function populateFrusControls() {
    $("frusSubject").innerHTML = ['<option value="">All four authorities</option>']
      .concat(frusSubjects.map((subject) => `<option value="${subject.bit}"${text(subject.bit) === frusState.subject ? " selected" : ""}>${escapeHtml(subject.name)}</option>`)).join("");
    const start = Number(frusIndex.meta?.yearStart || 1861);
    const end = Number(frusIndex.meta?.yearEnd || 1992);
    const years = Array.from({ length: Math.max(0, end - start + 1) }, (_value, index) => start + index);
    $("frusFromYear").innerHTML = ['<option value="">Earliest</option>'].concat(years.map((year) => `<option value="${year}"${text(year) === frusState.from ? " selected" : ""}>${year}</option>`)).join("");
    $("frusToYear").innerHTML = ['<option value="">Latest</option>'].concat(years.map((year) => `<option value="${year}"${text(year) === frusState.to ? " selected" : ""}>${year}</option>`)).join("");
    $("frusQuery").value = frusState.query;
  }

  function renderFrus() {
    const meta = frusIndex.meta || {};
    const matches = filteredFrus();
    const visible = matches.slice(0, frusState.limit);
    const span = meta.yearStart && meta.yearEnd ? `${meta.yearStart}-${meta.yearEnd}` : "Undated";
    $("frusStats").innerHTML = [
      [formatCount(meta.documents || frusDocuments.length), "Mapped documents"],
      [formatCount(meta.volumes || 0), "FRUS volumes"],
      [span, "Volume span"],
      [frusSubjects.length, "Subject authorities"]
    ].map(([value, label]) => `<div class="frus-stat"><strong>${value}</strong><span>${escapeHtml(label)}</span></div>`).join("");
    $("frusAuthorityList").innerHTML = frusSubjects.map((subject) => {
      const active = text(subject.bit) === frusState.subject ? " active" : "";
      return `<button class="frus-authority-row${active}" type="button" data-frus-subject="${subject.bit}"><span><strong>${escapeHtml(subject.name)}</strong><small>Office of the Historian subject authority</small></span><b>${formatCount(subject.references)}</b></button>`;
    }).join("");
    $("frusResultsCount").textContent = `${formatCount(matches.length)} document${matches.length === 1 ? "" : "s"}`;
    $("frusCorpusNote").innerHTML = `<strong>Discovery note:</strong> ${escapeHtml(meta.caveat || "Review each document before citation.")} Volume years and chapter headings provide navigation context; they are not document-level dates or titles.`;
    $("frusRecords").innerHTML = visible.length ? visible.map(frusCard).join("") : '<div class="empty-state"><strong>No FRUS authority records match this view.</strong><br>Broaden the literal metadata filters.</div>';
    $("frusLoadMore").hidden = visible.length >= matches.length;
    $("frusLoadMore").textContent = `Show ${formatCount(Math.min(36, Math.max(0, matches.length - visible.length)))} more documents`;
    const prompts = ["strategic materials", "Chile", "bauxite", "sea bed mining", "accessible foreign sources"];
    $("frusQueries").innerHTML = prompts.map((prompt) => `<button class="filter-chip" type="button" data-frus-query="${escapeHtml(prompt)}">${escapeHtml(prompt)}</button>`).join("");
  }

  function renderEvidence() {
    const matches = filteredEvidence();
    const lens = lensDefinition();
    $("resultsCount").textContent = `${formatCount(matches.length)} record${matches.length === 1 ? "" : "s"}${lens ? ` · ${lens.title}` : ""}`;
    $("evidenceResults").innerHTML = matches.length
      ? matches.map((event) => recordCard(event)).join("")
      : '<div class="empty-state" style="grid-column:1/-1"><strong>No indexed evidence matches this view.</strong><br>Broaden the filters or open a labeled research queue in the FRUS index.</div>';
  }

  function updateUrl() {
    const params = new URLSearchParams();
    const keys = { query: "q", mineral: "mineral", country: "country", source: "source", stage: "stage", era: "era", lens: "view" };
    Object.entries(keys).forEach(([stateKey, param]) => { if (searchState[stateKey]) params.set(param, searchState[stateKey]); });
    const frusKeys = { query: "frus_q", subject: "frus_subject", from: "frus_from", to: "frus_to" };
    Object.entries(frusKeys).forEach(([stateKey, param]) => { if (frusState[stateKey]) params.set(param, frusState[stateKey]); });
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
    searchState.lens = params.get("view") || "";
    frusState.query = params.get("frus_q") || "";
    frusState.subject = params.get("frus_subject") || "";
    frusState.from = params.get("frus_from") || "";
    frusState.to = params.get("frus_to") || "";
    if (searchState.era) activeEra = portal.eras.find((era) => era.id === searchState.era) || activeEra;
    if (searchState.country && countryIndex.has(normalize(searchState.country))) activeCountry = searchState.country;
  }

  function applyGlobalQuery(query) {
    searchState.query = query.trim();
    searchState.lens = "";
    $("evidenceQuery").value = searchState.query;
    $("globalQuery").value = searchState.query;
    renderEvidence();
    updateUrl();
    $("evidence").scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function clearEvidenceFilters() {
    Object.keys(searchState).forEach((key) => { searchState[key] = ""; });
    populateControls();
    renderEvidence();
    renderCountries();
    renderMap();
    updateUrl();
  }

  function openLens(value) {
    const definition = lensDefinition(value);
    if (!definition || !asArray(definition.recordIds).length) return;
    Object.assign(searchState, { query: "", mineral: "", country: "", source: "", stage: "", era: "", lens: value });
    populateControls();
    renderEvidence();
    updateUrl();
    $("evidence").scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function openFrusQuery(query) {
    Object.assign(frusState, { query, subject: "", from: "", to: "", limit: 36 });
    populateFrusControls();
    renderFrus();
    updateUrl();
    $("frus").scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function jumpToPathway(id) {
    const target = $(`pathway-${id}`);
    if (!target) return;
    target.scrollIntoView({ behavior: "smooth", block: "start" });
    target.classList.add("attention");
    setTimeout(() => target.classList.remove("attention"), 1600);
  }

  function jumpToProblem(id) {
    const problem = portal.diplomaticProblems.find((item) => item.id === id);
    if (!problem) return;
    if (problem.status === "research") openFrusQuery(problem.frusQuery || problem.title);
    else openLens(`problem:${id}`);
  }

  function setNavOpen(open) {
    $("primaryNav").classList.toggle("open", open);
    $("navToggle").setAttribute("aria-expanded", String(open));
    $("navToggle").setAttribute("aria-label", open ? "Close navigation" : "Open navigation");
  }

  function bindEvents() {
    $("globalSearchForm").addEventListener("submit", (event) => { event.preventDefault(); applyGlobalQuery($("globalQuery").value); });
    $("promptRow").addEventListener("click", (event) => {
      const problem = event.target.closest("[data-problem-jump]");
      const pathway = event.target.closest("[data-pathway-jump]");
      if (problem) jumpToProblem(problem.dataset.problemJump || "");
      if (pathway) jumpToPathway(pathway.dataset.pathwayJump || "");
    });
    $("presentRoutes").addEventListener("click", (event) => {
      const problem = event.target.closest("[data-problem-jump]");
      const pathway = event.target.closest("[data-pathway-jump]");
      if (problem) jumpToProblem(problem.dataset.problemJump || "");
      if (pathway) jumpToPathway(pathway.dataset.pathwayJump || "");
    });
    $("historicalComparisons").addEventListener("click", (event) => {
      const pathway = event.target.closest("[data-pathway-jump]");
      if (pathway) jumpToPathway(pathway.dataset.pathwayJump || "");
    });
    ["problemGrid", "pathwayList", "countryDetail"].forEach((id) => $(id).addEventListener("click", (event) => {
      const lens = event.target.closest("[data-lens]");
      const frus = event.target.closest("[data-frus-research]");
      const country = event.target.closest("[data-country-evidence]");
      if (lens) openLens(lens.dataset.lens || "");
      if (frus) openFrusQuery(frus.dataset.frusResearch || "");
      if (country) {
        searchState.lens = "";
        searchState.country = country.dataset.countryEvidence || "";
        $("filterCountry").value = searchState.country;
        renderEvidence(); updateUrl(); $("evidence").scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }));
    $("eraRail").addEventListener("click", (event) => {
      const button = event.target.closest("[data-era]");
      if (!button) return;
      activeEra = portal.eras.find((era) => era.id === button.dataset.era) || activeEra;
      searchState.era = activeEra?.id || "";
      renderEras(); renderTimeline(); updateUrl();
    });
    ["mapMineral", "mapSource", "mapYear"].forEach((id) => $(id).addEventListener(id === "mapYear" ? "input" : "change", renderMap));
    $("mineralGrid").addEventListener("click", (event) => {
      const button = event.target.closest("[data-mineral]");
      if (!button) return;
      Object.assign(searchState, { mineral: button.dataset.mineral || "", lens: "" });
      $("filterMineral").value = searchState.mineral;
      renderEvidence(); updateUrl(); $("evidence").scrollIntoView({ behavior: "smooth", block: "start" });
    });
    const activateCountryRow = (row) => { if (row) selectCountry(row.dataset.country || ""); };
    $("countryTableBody").addEventListener("click", (event) => activateCountryRow(event.target.closest("[data-country]")));
    $("countryTableBody").addEventListener("keydown", (event) => {
      const row = event.target.closest("[data-country]");
      if (row && (event.key === "Enter" || event.key === " ")) { event.preventDefault(); activateCountryRow(row); }
    });
    $("frusQueries").addEventListener("click", (event) => {
      const button = event.target.closest("[data-frus-query]");
      if (button) openFrusQuery(button.dataset.frusQuery || "");
    });
    $("frusAuthorityList").addEventListener("click", (event) => {
      const button = event.target.closest("[data-frus-subject]");
      if (!button) return;
      frusState.subject = frusState.subject === button.dataset.frusSubject ? "" : button.dataset.frusSubject;
      frusState.limit = 36; $("frusSubject").value = frusState.subject; renderFrus(); updateUrl();
    });
    $("frusQuery").addEventListener("input", () => { frusState.query = $("frusQuery").value; frusState.limit = 36; renderFrus(); updateUrl(); });
    [["frusSubject", "subject"], ["frusFromYear", "from"], ["frusToYear", "to"]].forEach(([id, key]) => {
      $(id).addEventListener("change", () => { frusState[key] = $(id).value; frusState.limit = 36; renderFrus(); updateUrl(); });
    });
    $("frusClear").addEventListener("click", () => { Object.assign(frusState, { query: "", subject: "", from: "", to: "", limit: 36 }); populateFrusControls(); renderFrus(); updateUrl(); });
    $("frusLoadMore").addEventListener("click", () => { frusState.limit += 36; renderFrus(); });
    const filterBindings = {
      evidenceQuery: ["query", "input"], filterMineral: ["mineral", "change"], filterCountry: ["country", "change"],
      filterSource: ["source", "change"], filterStage: ["stage", "change"], filterEra: ["era", "change"]
    };
    Object.entries(filterBindings).forEach(([id, [key, eventName]]) => $(id).addEventListener(eventName, () => {
      searchState[key] = $(id).value; searchState.lens = ""; renderEvidence(); updateUrl();
    }));
    $("clearFilters").addEventListener("click", clearEvidenceFilters);
    $("naraSearch").addEventListener("click", () => {
      const query = searchState.query || [searchState.mineral, searchState.country, "strategic materials"].filter(Boolean).join(" ") || "critical minerals";
      window.open(`https://catalog.archives.gov/search?q=${encodeURIComponent(query)}&availableOnline=true`, "_blank", "noopener");
    });
    $("shareView").addEventListener("click", async () => {
      updateUrl(); const button = $("shareView");
      try { await navigator.clipboard.writeText(location.href); button.textContent = "Link copied"; }
      catch (_error) { button.textContent = "Use address bar to copy"; }
      setTimeout(() => { button.textContent = "Copy shareable view"; }, 1800);
    });
    $("themeToggle").addEventListener("click", () => {
      const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
      document.documentElement.dataset.theme = next; localStorage.setItem("criticalMineralsTheme", next);
      $("themeToggle").setAttribute("aria-label", `Use ${next === "dark" ? "light" : "dark"} mode`);
    });
    $("navToggle").addEventListener("click", () => setNavOpen($("navToggle").getAttribute("aria-expanded") !== "true"));
    $("primaryNav").addEventListener("click", (event) => { if (event.target.closest("a")) setNavOpen(false); });
    document.addEventListener("keydown", (event) => { if (event.key === "Escape") setNavOpen(false); });
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
    initTheme(); loadUrlState(); populateControls(); populateFrusControls();
    renderMetrics(); renderPromptRow(); renderPresentContext(); renderProblems(); renderPathways();
    renderEras(); renderTimeline(); renderAdministrations(); renderCountries(); renderMap(); renderMinerals();
    renderFrus(); renderEvidence(); bindEvents(); restoreHashPosition();
  }

  init();
})();
