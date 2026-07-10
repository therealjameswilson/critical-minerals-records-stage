window.CRITICAL_MINERALS_PORTAL = {
  product: {
    title: "Strategic Resources Diplomacy",
    eyebrow: "FRUS historical research desk",
    proposition: "Understand today's critical-minerals diplomacy through the historical record of how the United States sought, secured, financed, protected, and reassessed access to strategic resources."
  },

  eras: [
    {
      id: "civil-war",
      label: "Civil War",
      years: "1861-1865",
      start: 1861,
      end: 1865,
      status: "research",
      researchNote: "The subject index contains discovery leads, but the current verified seed set does not yet support an era synthesis."
    },
    {
      id: "industrial-expansion",
      label: "Industrial Expansion",
      years: "1866-1897",
      start: 1866,
      end: 1897,
      status: "research",
      researchNote: "Document-level verification is still required before characterizing this period."
    },
    {
      id: "spanish-american-war",
      label: "Spanish-American War",
      years: "1898-1901",
      start: 1898,
      end: 1901,
      status: "research",
      researchNote: "This remains a FRUS and archival research queue."
    },
    {
      id: "world-war-i",
      label: "World War I",
      years: "1902-1918",
      start: 1902,
      end: 1918,
      status: "research",
      researchNote: "The full FRUS index provides leads; no document-level pathway is yet verified in the event set."
    },
    {
      id: "interwar",
      label: "Interwar",
      years: "1919-1938",
      start: 1919,
      end: 1938,
      status: "research",
      researchNote: "This interpretive bridge requires additional verified records."
    },
    {
      id: "world-war-ii",
      label: "World War II",
      years: "1939-1945",
      start: 1939,
      end: 1945,
      status: "research",
      researchNote: "World War II is a priority research queue; index membership alone is not enough for a synthesis."
    },
    {
      id: "early-cold-war",
      label: "Early Cold War",
      years: "1946-1960",
      start: 1946,
      end: 1960,
      status: "verified",
      bridgeNote: "This is the strongest verified bridge in the current seed set between wartime scarcity and permanent peacetime planning.",
      dominantConcern: "Expanding overseas production while defining material requirements and stockpile objectives.",
      institutions: ["Department of State", "National Security Resources Board"],
      instruments: ["ERP-related provisions", "production support", "stockpile objectives", "foreign-source assumptions"],
      terminology: ["strategic and critical materials", "material requirements", "foreign sources", "raw materials"],
      diplomaticTension: "Recovery and security planning depended on resources located beyond U.S. territory and on assumptions about their availability.",
      changeFromPriorEra: "The verified records show emergency scarcity being translated into recovery programs, production planning, and peacetime stockpile requirements.",
      recordIds: [
        "frus-1947-v1-d395-strategic-materials",
        "frus-1950-v1-d95-stockpile-program",
        "frus-1952-54-v11p1-d27-tropical-africa"
      ]
    },
    {
      id: "cold-war",
      label: "Cold War",
      years: "1961-1991",
      start: 1961,
      end: 1991,
      status: "verified",
      dominantConcern: "Whether nominal foreign supply could be treated as accessible during an emergency.",
      institutions: ["Department of State", "Department of Defense", "Office of Emergency Planning"],
      instruments: ["interagency memoranda", "stockpile-objective calculations", "political and economic source assessments"],
      terminology: ["accessible foreign sources", "political dependability", "economic dependability", "stockpile objectives"],
      diplomaticTension: "Stockpile calculations required judgments about allied and nearby suppliers that were political as well as quantitative.",
      changeFromPriorEra: "The verified 1967 record makes source reliability an explicit interagency variable in stockpile methodology.",
      recordIds: ["frus-1964-68-v9-d344-stockpile-objectives"]
    },
    {
      id: "post-cold-war",
      label: "Post-Cold War",
      years: "1992-2000",
      start: 1992,
      end: 2000,
      status: "research",
      researchNote: "The current verified historical seed set ends in 1967; this period requires new sources."
    },
    {
      id: "china-wto-era",
      label: "China WTO Era",
      years: "2001-2016",
      start: 2001,
      end: 2016,
      status: "research",
      researchNote: "Trade and production datasets are needed before this period can be interpreted historically."
    },
    {
      id: "critical-minerals-strategy",
      label: "Critical Minerals Strategy",
      years: "2017-2024",
      start: 2017,
      end: 2024,
      status: "official",
      dominantConcern: "Defining criticality and connecting material supply risk to energy technologies.",
      institutions: ["U.S. Geological Survey", "Department of Energy"],
      instruments: ["critical-minerals lists", "critical-materials assessments", "commodity studies"],
      terminology: ["critical minerals", "critical materials", "supply risk"],
      diplomaticTension: "Modern category systems do not map neatly onto the strategic-material vocabulary used in older records."
    },
    {
      id: "ministerial-era",
      label: "Present in historical context",
      years: "2025-present",
      start: 2025,
      end: 2026,
      status: "official",
      dominantConcern: "Partner coordination, investment frameworks, processing capacity, and resilient supply chains.",
      institutions: ["Department of State", "The White House", "DFC", "EXIM"],
      instruments: ["ministerial diplomacy", "investment frameworks", "project finance", "trade measures"],
      terminology: ["critical minerals", "processing", "supply chains", "investment partnership"],
      diplomaticTension: "Current policy combines resource access with processing, infrastructure, finance, and private investment across an integrated value chain.",
      changeFromPriorEra: "The contemporary records emphasize value-chain integration and investment instruments alongside access to raw materials."
    }
  ],

  diplomaticProblems: [
    {
      id: "securing-access",
      title: "Securing access",
      summary: "Diplomacy connected overseas production and foreign supply to U.S. recovery, security, and stockpile requirements.",
      periods: ["Early Cold War", "Cold War"],
      minerals: ["cobalt", "copper", "chromium", "manganese", "nickel"],
      countries: ["Democratic Republic of the Congo", "South Africa", "Canada", "Mexico"],
      stages: ["diplomacy", "trade", "mining", "stockpiling"],
      recordIds: [
        "frus-1947-v1-d395-strategic-materials",
        "frus-1952-54-v11p1-d27-tropical-africa",
        "frus-1964-68-v9-d344-stockpile-objectives"
      ],
      status: "verified"
    },
    {
      id: "reliable-suppliers",
      title: "Assessing reliable foreign suppliers",
      summary: "Officials had to decide which foreign supplies were politically and economically dependable under planning assumptions.",
      periods: ["Early Cold War", "Cold War"],
      minerals: ["chromium", "cobalt", "copper", "manganese", "nickel", "tin", "tungsten"],
      countries: ["Canada", "Mexico"],
      stages: ["stockpiling", "trade", "diplomacy"],
      recordIds: ["frus-1950-v1-d95-stockpile-program", "frus-1964-68-v9-d344-stockpile-objectives"],
      status: "verified"
    },
    {
      id: "production-infrastructure",
      title: "Expanding production and infrastructure",
      summary: "Access depended on production support and on the infrastructure needed to move material, not geology alone.",
      periods: ["Early Cold War"],
      minerals: ["cobalt", "copper", "graphite", "manganese", "tin"],
      countries: ["Democratic Republic of the Congo", "South Africa"],
      stages: ["mining", "infrastructure", "trade", "stockpiling"],
      recordIds: ["frus-1947-v1-d395-strategic-materials", "frus-1952-54-v11p1-d27-tropical-africa"],
      status: "verified"
    },
    {
      id: "concentration-dependency",
      title: "Managing concentration and dependency",
      summary: "Strategic planning had to account for materials concentrated in politically changing regions or in a limited set of accessible sources.",
      periods: ["Early Cold War", "Cold War"],
      minerals: ["cobalt", "copper", "chromium", "manganese"],
      countries: ["Democratic Republic of the Congo", "South Africa", "Canada", "Mexico"],
      stages: ["mining", "trade", "stockpiling"],
      recordIds: ["frus-1952-54-v11p1-d27-tropical-africa", "frus-1964-68-v9-d344-stockpile-objectives"],
      status: "verified"
    },
    {
      id: "stockpiling",
      title: "Stockpiling and emergency planning",
      summary: "Stockpile objectives translated foreign-source assumptions and material requirements into interagency planning decisions.",
      periods: ["Early Cold War", "Cold War"],
      minerals: ["antimony", "chromium", "cobalt", "copper", "graphite", "manganese", "nickel", "tin", "tungsten"],
      countries: ["United States", "Canada", "Mexico"],
      stages: ["stockpiling", "trade", "diplomacy"],
      recordIds: [
        "frus-1947-v1-d395-strategic-materials",
        "frus-1950-v1-d95-stockpile-program",
        "frus-1964-68-v9-d344-stockpile-objectives"
      ],
      status: "verified"
    },
    {
      id: "resource-nationalism",
      title: "Resource nationalism and investment terms",
      summary: "The verified seed set does not yet establish the effects of sovereignty, ownership, and bargaining over natural resources.",
      periods: ["Research queue"],
      minerals: ["copper"],
      countries: ["Chile"],
      stages: ["diplomacy", "finance", "mining"],
      recordIds: [],
      frusQuery: "Chile copper",
      status: "research"
    },
    {
      id: "allied-coordination",
      title: "Alliance and partner coordination",
      summary: "U.S. planning incorporated diplomatic posts, recovery partners, and judgments about nearby or allied foreign sources.",
      periods: ["Early Cold War", "Cold War"],
      minerals: ["strategic materials"],
      countries: ["Canada", "Mexico"],
      stages: ["diplomacy", "trade", "stockpiling"],
      recordIds: ["frus-1947-v1-d395-strategic-materials", "frus-1964-68-v9-d344-stockpile-objectives"],
      status: "verified"
    },
    {
      id: "processing-bottlenecks",
      title: "Processing and technological bottlenecks",
      summary: "Modern records emphasize processing and refining, but the verified historical seed set does not yet establish when this became a diplomatic problem.",
      periods: ["Research queue"],
      minerals: ["rare earth elements", "gallium", "germanium"],
      countries: [],
      stages: ["processing", "refining"],
      recordIds: [],
      frusQuery: "processing strategic materials",
      status: "research"
    },
    {
      id: "social-constraints",
      title: "Environmental, labor, and political constraints",
      summary: "The present seed set is insufficient to characterize how labor conditions, environmental effects, or local politics constrained mineral access.",
      periods: ["Research queue"],
      minerals: [],
      countries: [],
      stages: ["mining", "permitting", "infrastructure"],
      recordIds: [],
      frusQuery: "minerals labor political conditions",
      status: "research"
    }
  ],

  frusPathways: [
    {
      id: "accessible-foreign-sources",
      title: "How the United States judged accessible foreign sources",
      summary: "A route from foreign-source assumptions to explicit political and economic judgments about supplier dependability.",
      historicalProblem: "Stockpile requirements depended on what foreign material planners believed would remain available in an emergency.",
      whyItMattered: "Changing the accessible-source assumption could change calculated stockpile requirements.",
      stateRole: "The 1967 memorandum records State and Defense assessing the political and economic dependability of sources within an interagency stockpile process.",
      instruments: ["foreign-source assumptions", "interagency memoranda", "stockpile-objective calculations"],
      recordIds: ["frus-1950-v1-d95-stockpile-program", "frus-1964-68-v9-d344-stockpile-objectives"],
      contemporaryResonance: "Current diplomacy also distinguishes nominal supply from supply that is reliable under political and economic stress.",
      criticalDifference: "The verified historical records center on emergency stockpile methodology; current policy also addresses processing, investment, infrastructure, and integrated commercial supply chains.",
      status: "verified"
    },
    {
      id: "recovery-stockpiling",
      title: "From European recovery to permanent stockpile planning",
      summary: "How recovery policy, overseas production, and strategic-material requirements became connected in early Cold War planning.",
      historicalProblem: "The United States sought to support recovery while increasing production and building reserves of materials considered strategically important.",
      whyItMattered: "Recovery requirements and national-security planning competed for materials and depended on overseas production.",
      stateRole: "A State circular airgram connected overseas missions and ERP planning to production and stockpiling; later interagency comments set out material requirements and foreign-source assumptions.",
      instruments: ["circular airgram", "ERP-related provisions", "production support", "stockpile objectives"],
      recordIds: ["frus-1947-v1-d395-strategic-materials", "frus-1950-v1-d95-stockpile-program"],
      contemporaryResonance: "Current agreements likewise connect diplomatic relationships to investment and supply resilience.",
      criticalDifference: "The 1947-1950 records arose from European recovery and mobilization planning, not today's technology-specific and commercially integrated supply chains.",
      status: "verified"
    },
    {
      id: "africa-strategic-geography",
      title: "Cobalt, copper, and the political future of Tropical Africa",
      summary: "A focused reading of how a 1953 intelligence estimate connected raw materials, infrastructure, and political change.",
      historicalProblem: "Officials assessed the strategic significance of mineral-rich colonial territories amid political and social change.",
      whyItMattered: "The estimate treated access to cobalt, copper, chrome, manganese, tin, graphite, and other raw materials as part of a broader strategic assessment.",
      stateRole: "FRUS preserves the estimate within the foreign-policy record; the current seed metadata does not establish a separate State negotiating instrument.",
      instruments: ["national intelligence estimate", "strategic assessment", "infrastructure analysis"],
      recordIds: ["frus-1952-54-v11p1-d27-tropical-africa"],
      contemporaryResonance: "African mineral partnerships remain connected to infrastructure, political risk, and access questions.",
      criticalDifference: "The 1953 document uses colonial geography and terminology; modern sovereign partnerships and host-government objectives cannot be projected backward onto that setting.",
      status: "verified"
    },
    {
      id: "chile-copper",
      title: "Chile, copper, and bargaining over national resources",
      summary: "A promising route in the FRUS subject index that still lacks document-level annotations in this portal.",
      historicalProblem: "Document-level evidence for copper access, Chilean sovereignty, investment terms, and U.S. diplomacy has not yet been curated.",
      stateRole: "Not yet established from verified records in this repository.",
      instruments: [],
      recordIds: [],
      frusQuery: "Chile copper",
      contemporaryResonance: "Chile remains central to current copper and lithium diplomacy.",
      criticalDifference: "No historical comparison should be made until representative documents are verified and placed in their political context.",
      status: "research"
    },
    {
      id: "seabed-minerals",
      title: "The diplomatic history of seabed minerals",
      summary: "The authority index identifies 81 sea bed mining records, but the current event-level example is explicitly a placeholder.",
      historicalProblem: "Document-level evidence connecting law-of-the-sea negotiations to seabed mineral access has not yet been curated.",
      stateRole: "Not yet established from verified document-level metadata in this repository.",
      instruments: [],
      recordIds: [],
      frusQuery: "sea bed mining",
      contemporaryResonance: "Seabed resources continue to raise access, governance, and environmental questions.",
      criticalDifference: "Subject assignment is a discovery signal, not evidence that every indexed document is centrally about minerals.",
      status: "research"
    }
  ],

  frusAnnotations: {
    "frus-1947-v1-d395-strategic-materials": {
      policyProblem: "Connecting European recovery, overseas production, and U.S. stockpiling of strategic and critical materials.",
      stateRole: "A State circular airgram linked diplomatic and consular posts to ERP-related planning for production and stockpiling.",
      instrument: "Confidential circular airgram and proposed ERP provisions.",
      keyConcept: "Strategic and critical materials",
      whyReadNow: "It shows that diplomatic access, production support, recovery policy, and stockpiling were considered together.",
      pathwayIds: ["recovery-stockpiling"]
    },
    "frus-1950-v1-d95-stockpile-program": {
      policyProblem: "Defining strategic stockpile objectives, material requirements, and foreign-source assumptions in NSC-68 planning.",
      stateRole: "FRUS places National Security Resources Board comments within an interagency foreign-policy and national-security record; State was not the author of the memorandum.",
      instrument: "Interagency memorandum and requirements planning.",
      keyConcept: "Foreign-source assumptions",
      whyReadNow: "It makes the assumptions behind stockpile quantities visible rather than treating the figures as self-explanatory.",
      pathwayIds: ["accessible-foreign-sources", "recovery-stockpiling"]
    },
    "frus-1952-54-v11p1-d27-tropical-africa": {
      policyProblem: "Assessing the strategic importance of Tropical Africa, including raw-material access, infrastructure, and political change.",
      stateRole: "FRUS preserves a National Intelligence Estimate for the foreign-policy record; the seed metadata does not identify a separate State negotiating action.",
      instrument: "National Intelligence Estimate.",
      keyConcept: "Strategic raw materials in a changing political geography",
      whyReadNow: "It demonstrates why modern country tags must not replace the document's colonial geography or historical terminology.",
      pathwayIds: ["africa-strategic-geography"]
    },
    "frus-1964-68-v9-d344-stockpile-objectives": {
      policyProblem: "Determining which foreign sources could be counted as politically and economically dependable in stockpile calculations.",
      stateRole: "The memorandum records State and Defense judgments within an interagency process involving the Office of Emergency Planning.",
      instrument: "Interagency memorandum and stockpile-objective methodology.",
      keyConcept: "Accessible foreign sources",
      whyReadNow: "It shows that supplier reliability was treated as a political and economic judgment, not only a production statistic.",
      pathwayIds: ["accessible-foreign-sources"]
    }
  },

  presentContext: {
    report: {
      title: "Deputy Secretary Landau and the Critical Minerals Imperative",
      url: "https://github.com/therealjameswilson/critical-minerals-records-stage/blob/main/research/Landau-Critical-Minerals-2026.md",
      lines: 191,
      references: 31,
      tier: "Analytical synthesis",
      caveat: "The report combines official records, partner-government material, commercial reporting, and outside analysis. Validate operational claims against the linked primary source."
    },
    priorities: [
      {
        concern: "Reliable partner networks",
        pathwayId: "accessible-foreign-sources",
        tier: "Analytical synthesis"
      },
      {
        concern: "Agreements linked to investment",
        pathwayId: "recovery-stockpiling",
        tier: "Official contemporary source"
      },
      {
        concern: "Processing and refining bottlenecks",
        problemId: "processing-bottlenecks",
        tier: "Official contemporary source"
      },
      {
        concern: "Public and private finance",
        pathwayId: "recovery-stockpiling",
        tier: "Official contemporary source"
      },
      {
        concern: "African partnerships",
        pathwayId: "africa-strategic-geography",
        tier: "Analytical synthesis"
      },
      {
        concern: "Allied coordination",
        problemId: "allied-coordination",
        tier: "Official contemporary source"
      }
    ],
    chronology: [
      {
        date: "Jan. 14",
        title: "Processed-minerals proclamation",
        detail: "The White House treated processed critical-mineral imports as a national-security issue and directed negotiated adjustment measures.",
        source: "White House",
        url: "https://www.whitehouse.gov/presidential-actions/2026/01/adjusting-imports-of-processed-critical-minerals-and-their-derivative-products-into-the-united-states/"
      },
      {
        date: "Jan. 24-Feb. 1",
        title: "Landau Africa travel",
        detail: "An official State itinerary covered Egypt, Ethiopia, Kenya, and Djibouti immediately before the ministerial.",
        source: "State",
        url: "https://www.state.gov/releases/office-of-the-spokesperson/2026/01/deputy-secretary-landaus-travel-to-egypt-ethiopia-kenya-and-djibouti"
      },
      {
        date: "Feb. 4",
        title: "Critical Minerals Ministerial",
        detail: "The ministerial connected bilateral frameworks, project finance, allied coordination, and an industry implementation task force.",
        source: "State",
        url: "https://www.state.gov/releases/office-of-the-spokesperson/2026/02/2026-critical-minerals-ministerial"
      },
      {
        date: "Feb. 18",
        title: "Uzbekistan investment framework",
        detail: "DFC announced a proposed joint framework spanning exploration, extraction, processing, infrastructure, and energy.",
        source: "DFC",
        url: "https://www.dfc.gov/media/press-releases/dfc-leadership-lays-foundation-investment-partnership-uzbekistan"
      }
    ],
    comparisons: [
      {
        title: "Agreements, production, and reserves",
        historicalProblem: "The 1947 record connected ERP planning, overseas production, and U.S. stockpiling of strategic materials.",
        contemporaryResonance: "Current official records also connect agreements, investment frameworks, and supply resilience.",
        criticalDifference: "European recovery and postwar stockpiling are not equivalent to today's commercially integrated, technology-specific value chains.",
        recordId: "frus-1947-v1-d395-strategic-materials",
        pathwayId: "recovery-stockpiling"
      },
      {
        title: "Mineral-rich Africa as strategic geography",
        historicalProblem: "A 1953 estimate assessed raw materials, infrastructure, and political change in colonial Tropical Africa.",
        contemporaryResonance: "Current diplomacy also links African mineral partnerships to infrastructure and political risk.",
        criticalDifference: "Modern sovereign partnerships and host-government objectives cannot be mapped directly onto colonial geography or terminology.",
        recordId: "frus-1952-54-v11p1-d27-tropical-africa",
        pathwayId: "africa-strategic-geography"
      },
      {
        title: "Supplier reliability as a policy judgment",
        historicalProblem: "A 1967 stockpile memorandum treated political and economic dependability as part of deciding which foreign sources were accessible.",
        contemporaryResonance: "Current strategy likewise distinguishes nominal supply from resilient supply.",
        criticalDifference: "The historical calculation addressed emergency stockpile objectives; present concerns span processing, finance, infrastructure, and private firms.",
        recordId: "frus-1964-68-v9-d344-stockpile-objectives",
        pathwayId: "accessible-foreign-sources"
      }
    ]
  },

  minerals: [
    { name: "Lithium", symbol: "Li", prompt: "When did lithium become strategically salient, and where does the verified historical record remain thin?", historicalTerms: ["strategic materials", "material requirements", "foreign sources"] },
    { name: "Cobalt", symbol: "Co", prompt: "Follow cobalt through strategic-material lists, African raw-material assessments, stockpiling, and supplier reliability.", historicalTerms: ["strategic and critical materials", "Tropical Africa", "raw materials", "stockpile objectives", "accessible foreign sources"] },
    { name: "Copper", symbol: "Cu", prompt: "Trace copper across recovery planning, African strategic geography, stockpile assumptions, and modern trade evidence.", historicalTerms: ["strategic and critical materials", "raw materials", "stockpile objectives", "accessible foreign sources"] },
    { name: "Graphite", symbol: "C", prompt: "Compare its appearance in historical strategic-material records with modern processing concerns.", historicalTerms: ["strategic and critical materials", "raw materials", "material requirements"] },
    { name: "Rare earth elements", symbol: "REE", prompt: "Identify where modern terminology departs from older strategic-material and processing language.", historicalTerms: ["strategic materials", "material requirements", "processing"] },
    { name: "Nickel", symbol: "Ni", prompt: "Examine stockpile requirements, foreign-source assumptions, and modern processing evidence.", historicalTerms: ["strategic and critical materials", "material requirements", "stockpile objectives", "accessible foreign sources"] },
    { name: "Manganese", symbol: "Mn", prompt: "Track raw-material access, stockpile planning, and the seabed-minerals research queue.", historicalTerms: ["strategic and critical materials", "raw materials", "stockpile objectives", "sea bed mining"] },
    { name: "Gallium", symbol: "Ga", prompt: "Use modern trade and processing records; the historical FRUS connection remains a research queue.", historicalTerms: ["strategic materials", "processing", "material requirements"] },
    { name: "Germanium", symbol: "Ge", prompt: "Connect modern technology concerns to older research language without assuming the categories are equivalent.", historicalTerms: ["strategic materials", "material requirements", "stockpile objectives"] },
    { name: "Antimony", symbol: "Sb", prompt: "Follow its place in the 1947 strategic-material list and later stockpile records.", historicalTerms: ["strategic and critical materials", "stockpiling", "material requirements"] },
    { name: "Tin", symbol: "Sn", prompt: "Trace its appearance in raw-material assessments, requirements planning, and source-access judgments.", historicalTerms: ["strategic and critical materials", "raw materials", "stockpile objectives", "accessible foreign sources"] },
    { name: "Tungsten", symbol: "W", prompt: "Study requirements, stockpile objectives, and changing assumptions about foreign access.", historicalTerms: ["strategic and critical materials", "material requirements", "stockpile objectives", "accessible foreign sources"] },
    { name: "Chromium", symbol: "Cr", prompt: "Follow chromium through strategic-material lists, African geography, and supplier-dependability judgments.", historicalTerms: ["strategic and critical materials", "raw materials", "stockpile objectives", "accessible foreign sources"] }
  ],

  countries: [
    {
      name: "United States", lon: -98, lat: 39, focus: "Requirements, interagency planning, stockpiling, and diplomacy",
      history: {
        status: "curated",
        arc: "The verified seed records move from ERP-linked production and stockpiling in 1947 to requirements planning in 1950 and explicit source-dependability judgments in 1967.",
        materials: ["antimony", "chromium", "cobalt", "copper", "graphite", "manganese", "nickel", "tin", "tungsten"],
        usObjectives: "Increase production, define requirements, build reserves, and decide which foreign supplies could be counted as accessible.",
        partnerObjectives: "Not established in the current verified seed set.",
        recordIds: ["frus-1947-v1-d395-strategic-materials", "frus-1950-v1-d95-stockpile-program", "frus-1964-68-v9-d344-stockpile-objectives"]
      }
    },
    {
      name: "Canada", lon: -106, lat: 56, focus: "Accessible foreign-source assumptions in 1967 stockpile planning",
      history: {
        status: "curated",
        arc: "Canada appears in the verified 1967 stockpile record as part of the foreign-source geography used in accessibility calculations.",
        materials: ["chromium", "cobalt", "copper", "manganese", "nickel", "tin", "tungsten"],
        usObjectives: "Assess whether foreign supplies could be counted as politically and economically dependable.",
        partnerObjectives: "Not established in the current verified seed metadata.",
        recordIds: ["frus-1964-68-v9-d344-stockpile-objectives"]
      }
    },
    {
      name: "Mexico", lon: -102, lat: 23, focus: "Accessible foreign-source assumptions in 1967 stockpile planning",
      history: {
        status: "curated",
        arc: "Mexico appears in the verified 1967 stockpile record as part of the foreign-source geography used in accessibility calculations.",
        materials: ["chromium", "cobalt", "copper", "manganese", "nickel", "tin", "tungsten"],
        usObjectives: "Assess whether foreign supplies could be counted as politically and economically dependable.",
        partnerObjectives: "Not established in the current verified seed metadata.",
        recordIds: ["frus-1964-68-v9-d344-stockpile-objectives"]
      }
    },
    {
      name: "Democratic Republic of the Congo", lon: 23, lat: -3, focus: "Cobalt, copper, infrastructure, and historical geography",
      history: {
        status: "curated",
        arc: "A 1953 estimate assessed mineral access in colonial Tropical Africa. The modern country tag is a discovery aid and must not replace the document's historical geography.",
        materials: ["cobalt", "copper", "chromium", "manganese", "tin", "graphite", "vanadium"],
        usObjectives: "Assess strategic raw-material access, infrastructure, and political trends.",
        partnerObjectives: "Not established in the current verified seed metadata.",
        historicalNames: "Use the place names and sovereignty descriptions in the 1953 document when citing it.",
        recordIds: ["frus-1952-54-v11p1-d27-tropical-africa"]
      }
    },
    {
      name: "South Africa", lon: 24, lat: -30, focus: "Raw-material access in a 1953 strategic assessment",
      history: {
        status: "curated",
        arc: "South Africa is tagged to the verified 1953 estimate on the strategic importance of Tropical Africa and access to raw materials.",
        materials: ["chromium", "manganese", "copper", "graphite", "vanadium"],
        usObjectives: "Assess strategic raw-material access and regional political trends.",
        partnerObjectives: "Not established in the current verified seed metadata.",
        recordIds: ["frus-1952-54-v11p1-d27-tropical-africa"]
      }
    },
    { name: "Chile", lon: -71, lat: -33, focus: "Copper and lithium diplomacy", history: { status: "research", researchGap: "The FRUS index contains Chile discovery leads, but no document-level Chile pathway is verified in the current event set.", frusQuery: "Chile copper" } },
    { name: "Argentina", lon: -64, lat: -34, focus: "Lithium, investment, and infrastructure", history: { status: "research", researchGap: "Current records exist; a verified historical relationship arc has not yet been built." } },
    { name: "Brazil", lon: -52, lat: -10, focus: "Niobium, graphite, rare earths, and industrial partnership", history: { status: "research", researchGap: "No verified FRUS seed record is currently tagged to Brazil." } },
    { name: "Peru", lon: -75, lat: -9, focus: "Copper, infrastructure, and investment", history: { status: "research", researchGap: "No verified FRUS seed record is currently tagged to Peru." } },
    { name: "Egypt", lon: 30, lat: 27, focus: "Current commercial diplomacy and regional context", history: { status: "research", researchGap: "The indexed evidence is contemporary; the historical resource relationship remains a research queue." } },
    { name: "Ethiopia", lon: 40, lat: 9, focus: "Current investment and commercial engagement", history: { status: "research", researchGap: "The indexed evidence is contemporary; the historical resource relationship remains a research queue." } },
    { name: "Kenya", lon: 38, lat: 1, focus: "Current investment and regional diplomacy", history: { status: "research", researchGap: "The indexed evidence is contemporary; the historical resource relationship remains a research queue." } },
    { name: "Djibouti", lon: 43, lat: 12, focus: "Current maritime and commercial context", history: { status: "research", researchGap: "The indexed evidence is contemporary; the historical resource relationship remains a research queue." } },
    { name: "Namibia", lon: 17, lat: -22, focus: "Uranium, rare earths, investment, and infrastructure", history: { status: "research", researchGap: "No verified FRUS seed record is currently tagged to Namibia." } },
    { name: "Greenland", lon: -42, lat: 72, focus: "Arctic strategy and rare earths", history: { status: "research", researchGap: "No verified FRUS seed record is currently tagged to Greenland." } },
    { name: "Ukraine", lon: 31, lat: 49, focus: "Reconstruction and strategic partnership", history: { status: "research", researchGap: "No verified FRUS seed record is currently tagged to Ukraine." } },
    { name: "Kazakhstan", lon: 68, lat: 48, focus: "Current investment and transport-corridor diplomacy", history: { status: "research", researchGap: "The indexed evidence is contemporary; the historical resource relationship remains a research queue." } },
    { name: "Uzbekistan", lon: 64, lat: 41, focus: "Current investment framework and connectivity", history: { status: "research", researchGap: "The indexed evidence is contemporary; the historical resource relationship remains a research queue." } },
    { name: "Indonesia", lon: 118, lat: -2, focus: "Nickel and processing policy", history: { status: "research", researchGap: "The current NARA item is a search placeholder, not a verified historical record." } },
    { name: "Philippines", lon: 122, lat: 13, focus: "Nickel, alliance geography, and maritime access", history: { status: "research", researchGap: "No verified FRUS seed record is currently tagged to the Philippines." } },
    { name: "Mongolia", lon: 103, lat: 46, focus: "Copper, rare earths, and infrastructure", history: { status: "research", researchGap: "No verified FRUS seed record is currently tagged to Mongolia." } },
    { name: "Australia", lon: 134, lat: -25, focus: "Current allied mining and processing", history: { status: "research", researchGap: "The current country item is a demonstrator placeholder, not a verified historical relationship arc." } }
  ],

  administrations: [
    { label: "Lincoln", start: 1861, end: 1865 },
    { label: "Grant", start: 1869, end: 1877 },
    { label: "Theodore Roosevelt", start: 1901, end: 1909 },
    { label: "Wilson", start: 1913, end: 1921 },
    { label: "Franklin D. Roosevelt", start: 1933, end: 1945 },
    { label: "Truman", start: 1945, end: 1953 },
    { label: "Eisenhower", start: 1953, end: 1961 },
    { label: "Kennedy", start: 1961, end: 1963 },
    { label: "Johnson", start: 1963, end: 1969 },
    { label: "Nixon", start: 1969, end: 1974 },
    { label: "Ford", start: 1974, end: 1977 },
    { label: "Carter", start: 1977, end: 1981 },
    { label: "Reagan", start: 1981, end: 1989 },
    { label: "George H. W. Bush", start: 1989, end: 1993 },
    { label: "Clinton", start: 1993, end: 2001 },
    { label: "George W. Bush", start: 2001, end: 2009 },
    { label: "Obama", start: 2009, end: 2017 },
    { label: "Trump I", start: 2017, end: 2021 },
    { label: "Biden", start: 2021, end: 2025 },
    { label: "Trump II", start: 2025, end: 2026 }
  ],

  sources: [
    { name: "FRUS", role: "Selected and edited diplomatic decisions, negotiations, policy assumptions, and historical context", tier: "Primary edited record" },
    { name: "NARA", role: "Archival discovery across record groups, presidential libraries, maps, photographs, and finding aids", tier: "Primary catalog metadata" },
    { name: "Census", role: "Imports and exports by commodity code, partner, flow, and period", tier: "Official statistical data" },
    { name: "USGS", role: "Commodity statistics, import reliance, production, criticality, and geoscience", tier: "Official scientific data" },
    { name: "State", role: "Current diplomacy, agreements, ministerials, releases, and investment climate", tier: "Official policy record" },
    { name: "DLA", role: "National Defense Stockpile and strategic-material program context", tier: "Official program record" }
  ],

  searchPrompts: [
    { label: "How did State assess reliable foreign sources?", problemId: "reliable-suppliers" },
    { label: "What role did infrastructure play in mineral access?", problemId: "production-infrastructure" },
    { label: "How were stockpile requirements debated?", problemId: "stockpiling" },
    { label: "How did the United States encourage production abroad?", pathwayId: "recovery-stockpiling" },
    { label: "How did allies coordinate material requirements?", problemId: "allied-coordination" }
  ]
};
