const STORAGE_KEY = "ai-automation-command-center-v1";

const DEFAULT_STATE = {
  guidelines: {
    niche: "AI automation, digital products, productivity systems",
    audience: "Hindi/English creators, small businesses, freelancers",
    tone: "Direct Hinglish, practical, confident, no fake hype",
    rules:
      "Keep every post useful. Use simple hooks, clear CTA, and no income claims without proof. Draft first, publish only after approval.",
    dailyPosts: 3,
    approval: "required"
  },
  content: [],
  projects: [],
  tasks: [],
  leads: [],
  earnings: [],
  checklist: {
    date: "",
    items: []
  },
  calendar: [],
  logs: []
};

let state = loadState();

const $ = (selector) => document.querySelector(selector);

const els = {
  commandInput: $("#commandInput"),
  runCommandButton: $("#runCommandButton"),
  dailyContentButton: $("#dailyContentButton"),
  projectButton: $("#projectButton"),
  reportButton: $("#reportButton"),
  assistantOutput: $("#assistantOutput"),
  approvalModePill: $("#approvalModePill"),
  metricContent: $("#metricContent"),
  metricTasks: $("#metricTasks"),
  metricProjects: $("#metricProjects"),
  metricPublished: $("#metricPublished"),
  checklistList: $("#checklistList"),
  resetChecklistButton: $("#resetChecklistButton"),
  addChecklistItemButton: $("#addChecklistItemButton"),
  calendarList: $("#calendarList"),
  generateCalendarButton: $("#generateCalendarButton"),
  metricLeads: $("#metricLeads"),
  metricRevenue: $("#metricRevenue"),
  metricViews: $("#metricViews"),
  metricEngagement: $("#metricEngagement"),
  nextActionsList: $("#nextActionsList"),
  nicheInput: $("#nicheInput"),
  audienceInput: $("#audienceInput"),
  toneInput: $("#toneInput"),
  rulesInput: $("#rulesInput"),
  dailyPostsInput: $("#dailyPostsInput"),
  approvalInput: $("#approvalInput"),
  saveGuidelinesButton: $("#saveGuidelinesButton"),
  contentQueue: $("#contentQueue"),
  contentFilter: $("#contentFilter"),
  projectList: $("#projectList"),
  taskList: $("#taskList"),
  activityLog: $("#activityLog"),
  addProjectButton: $("#addProjectButton"),
  addTaskButton: $("#addTaskButton"),
  addLeadButton: $("#addLeadButton"),
  addEarningButton: $("#addEarningButton"),
  growthList: $("#growthList"),
  seedButton: $("#seedButton"),
  clearButton: $("#clearButton"),
  exportJsonButton: $("#exportJsonButton"),
  exportCsvButton: $("#exportCsvButton"),
  importFileInput: $("#importFileInput")
};

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return cloneData(DEFAULT_STATE);
    const parsed = JSON.parse(raw);
    return {
      ...cloneData(DEFAULT_STATE),
      ...parsed,
      guidelines: { ...DEFAULT_STATE.guidelines, ...(parsed.guidelines || {}) },
      content: Array.isArray(parsed.content) ? parsed.content : [],
      projects: Array.isArray(parsed.projects) ? parsed.projects : [],
      tasks: Array.isArray(parsed.tasks) ? parsed.tasks : [],
      leads: Array.isArray(parsed.leads) ? parsed.leads : [],
      earnings: Array.isArray(parsed.earnings) ? parsed.earnings : [],
      checklist: parsed.checklist && typeof parsed.checklist === "object" ? parsed.checklist : cloneData(DEFAULT_STATE.checklist),
      calendar: Array.isArray(parsed.calendar) ? parsed.calendar : [],
      logs: Array.isArray(parsed.logs) ? parsed.logs : []
    };
  } catch (error) {
    console.warn("Could not load saved state", error);
    return cloneData(DEFAULT_STATE);
  }
}

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state, null, 2));
  } catch (error) {
    reportError("Browser storage blocked. Output still works, but data may not persist after reload.", error);
  }
}

function cloneData(value) {
  if (typeof structuredClone === "function") {
    return structuredClone(value);
  }
  return JSON.parse(JSON.stringify(value));
}

function reportError(message, error) {
  console.error(message, error);
  const output = document.getElementById("assistantOutput");
  if (output) {
    output.textContent = `${message}\n\nTechnical detail: ${(error && error.message) || error}`;
  }
}

function uid(prefix) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function todayIso(offsetDays = 0) {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  return date.toISOString().slice(0, 10);
}

function humanDateTime(iso) {
  if (!iso) return "No schedule";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function addLog(title, detail) {
  state.logs.unshift({
    id: uid("log"),
    at: new Date().toISOString(),
    title,
    detail
  });
  state.logs = state.logs.slice(0, 80);
}

function init() {
  bindEvents();
  hydrateGuidelinesForm();
  ensureDailyChecklist();
  if (!state.logs.length) {
    addLog("System ready", "Command center initialized. Start with Daily Content or type your own instruction.");
    saveState();
  }
  render();
}

function bindEvents() {
  els.runCommandButton.addEventListener("click", safeHandler(() => {
    const instruction = els.commandInput.value.trim();
    runCommand(instruction || "Create a daily content plan and update the tracker.");
  }));

  els.dailyContentButton.addEventListener("click", safeHandler(() => {
    const instruction =
      els.commandInput.value.trim() ||
      `Create ${state.guidelines.dailyPosts} daily social media posts for ${state.guidelines.niche}.`;
    runCommand(instruction, "content");
  }));

  els.projectButton.addEventListener("click", safeHandler(() => {
    const instruction =
      els.commandInput.value.trim() ||
      "Create a monetizable AI automation project with MVP tasks and content launch plan.";
    runCommand(instruction, "project");
  }));

  els.reportButton.addEventListener("click", safeHandler(() => {
    const report = buildDailyReport();
    els.assistantOutput.textContent = report;
    addLog("Daily report generated", "Snapshot created from current tracker data.");
    saveState();
    render();
  }));

  els.saveGuidelinesButton.addEventListener("click", safeHandler(() => {
    saveGuidelinesFromForm();
    addLog("Guidelines updated", "Brand rules and daily content target saved.");
    saveState();
    render();
  }));

  els.resetChecklistButton.addEventListener("click", safeHandler(() => {
    state.checklist = createDailyChecklist();
    addLog("Checklist reset", "Daily execution checklist refreshed.");
    saveState();
    render();
  }));

  els.addChecklistItemButton.addEventListener("click", safeHandler(() => {
    const title = window.prompt("Checklist item?");
    if (!title) return;
    ensureDailyChecklist();
    state.checklist.items.push(createChecklistItem(title));
    addLog("Checklist item added", title);
    saveState();
    render();
  }));

  els.generateCalendarButton.addEventListener("click", safeHandler(() => {
    generateWeeklyCalendar();
    saveState();
    render();
  }));

  els.contentFilter.addEventListener("change", safeHandler(renderContentQueue));

  els.addProjectButton.addEventListener("click", safeHandler(() => {
    const name = window.prompt("Project name?");
    if (!name) return;
    const project = createProjectFromInstruction(name);
    state.projects.unshift(project);
    state.tasks.unshift(...projectToTasks(project));
    addLog("Project added", `${project.name} added with execution tasks.`);
    saveState();
    render();
  }));

  els.addTaskButton.addEventListener("click", safeHandler(() => {
    const title = window.prompt("Task?");
    if (!title) return;
    state.tasks.unshift(createTask(title, "Manual", todayIso(1), "Medium"));
    addLog("Task added", title);
    saveState();
    render();
  }));

  els.addLeadButton.addEventListener("click", safeHandler(() => {
    const name = window.prompt("Lead name or handle?");
    if (!name) return;
    const source = window.prompt("Source platform/content?", "Manual") || "Manual";
    const note = window.prompt("Lead note?", "Interested in automation setup") || "";
    state.leads.unshift(createLead(name, source, note));
    state.tasks.unshift(createTask(`Follow up with lead: ${name}`, "Lead", todayIso(1), "High"));
    addLog("Lead added", `${name} from ${source}`);
    saveState();
    render();
  }));

  els.addEarningButton.addEventListener("click", safeHandler(() => {
    const amount = promptNumber("Earning amount?", 0);
    if (amount <= 0) return;
    const source = window.prompt("Earning source?", "Manual") || "Manual";
    const note = window.prompt("Earning note?", "Revenue logged") || "";
    state.earnings.unshift(createEarning(amount, source, note));
    addLog("Earning added", `${formatMoney(amount)} from ${source}`);
    saveState();
    render();
  }));

  els.seedButton.addEventListener("click", safeHandler(() => {
    loadStarterData();
    saveState();
    render();
  }));

  els.clearButton.addEventListener("click", safeHandler(() => {
    if (!window.confirm("Clear local command center data?")) return;
    state = cloneData(DEFAULT_STATE);
    addLog("Data cleared", "Tracker reset to default guidelines.");
    hydrateGuidelinesForm();
    saveState();
    render();
  }));

  els.exportJsonButton.addEventListener("click", safeHandler(() => exportJson()));
  els.exportCsvButton.addEventListener("click", safeHandler(() => exportCsv()));
  els.importFileInput.addEventListener("change", safeHandler(importJson));
}

function safeHandler(callback) {
  return (...args) => {
    Promise.resolve()
      .then(() => callback(...args))
      .catch((error) => {
        reportError("Command failed inside the browser. I saved the technical detail here so we can fix it.", error);
      });
  };
}

function hydrateGuidelinesForm() {
  els.nicheInput.value = state.guidelines.niche;
  els.audienceInput.value = state.guidelines.audience;
  els.toneInput.value = state.guidelines.tone;
  els.rulesInput.value = state.guidelines.rules;
  els.dailyPostsInput.value = state.guidelines.dailyPosts;
  els.approvalInput.value = state.guidelines.approval;
}

function saveGuidelinesFromForm() {
  state.guidelines = {
    niche: els.nicheInput.value.trim() || DEFAULT_STATE.guidelines.niche,
    audience: els.audienceInput.value.trim() || DEFAULT_STATE.guidelines.audience,
    tone: els.toneInput.value.trim() || DEFAULT_STATE.guidelines.tone,
    rules: els.rulesInput.value.trim() || DEFAULT_STATE.guidelines.rules,
    dailyPosts: clamp(Number(els.dailyPostsInput.value) || DEFAULT_STATE.guidelines.dailyPosts, 1, 10),
    approval: els.approvalInput.value
  };
}

function ensureDailyChecklist() {
  if (!state.checklist || state.checklist.date !== todayIso() || !Array.isArray(state.checklist.items)) {
    state.checklist = createDailyChecklist();
  }
}

function createDailyChecklist() {
  return {
    date: todayIso(),
    items: [
      createChecklistItem("Pick one clear topic for today"),
      createChecklistItem("Generate or refine content draft"),
      createChecklistItem("Create asset with a free tool"),
      createChecklistItem("Publish one approved post manually"),
      createChecklistItem("Reply to comments/messages"),
      createChecklistItem("Log metrics after publishing"),
      createChecklistItem("Choose tomorrow's next action")
    ]
  };
}

function createChecklistItem(title) {
  return {
    id: uid("check"),
    title,
    done: false,
    createdAt: new Date().toISOString()
  };
}

function generateWeeklyCalendar() {
  saveGuidelinesFromForm();
  const topic = extractTopic(els.commandInput.value.trim() || state.guidelines.niche);
  state.calendar = buildWeeklyCalendar(topic);
  state.tasks.unshift(createTask("Review this week's content calendar", "Planning", todayIso(), "High"));
  addLog("Weekly calendar generated", `7-day plan created for ${topic}.`);
}

function buildWeeklyCalendar(topic) {
  const platforms = ["Instagram", "LinkedIn", "YouTube Shorts", "Instagram", "X", "LinkedIn", "Instagram"];
  const formats = ["Carousel", "Text post", "Short video", "Story", "Thread", "Checklist", "Short video"];
  const pillars = ["Problem", "Tutorial", "Proof", "Offer", "Mistake", "Checklist", "Story"];
  return Array.from({ length: 7 }, (_, index) => {
    const pillar = pillars[index];
    return {
      id: uid("calendar"),
      date: todayIso(index),
      platform: platforms[index],
      format: formats[index],
      pillar,
      title: buildAngle(topic, index, pillar),
      hook: buildHook(topic, pillar, index),
      status: "Planned",
      createdAt: new Date().toISOString()
    };
  });
}

async function runCommand(instruction, forcedIntent = null) {
  saveGuidelinesFromForm();
  const intent = forcedIntent || detectIntent(instruction);
  const created = createLocalWorkflow(instruction, intent);

  applyCreatedItems(created);
  const summary = buildExecutionSummary(instruction, intent, created, "Free local generator");
  els.assistantOutput.textContent = summary;
  addLog("Command executed", `Free local generator: ${compactText(instruction, 140)}`);
  saveState();
  render();
}

function createLocalWorkflow(instruction, intent) {
  const created = {
    content: [],
    projects: [],
    tasks: [],
    calendar: []
  };

  if (intent === "content" || intent === "all") {
    created.content = createContentPack(instruction);
    created.tasks.push(
      createTask("Review generated content and approve publish-ready items", "Publishing", todayIso(), "High"),
      createTask("Create assets using free tools like Canva, CapCut, or phone editor", "Creative", todayIso(), "High"),
      createTask("Publish approved posts manually from native social apps", "Publishing", todayIso(), "High"),
      createTask("Log views, saves, comments, and leads after 24 hours", "Analytics", todayIso(1), "Medium")
    );
  }

  if (intent === "project" || intent === "all") {
    const project = createProjectFromInstruction(instruction);
    created.projects.push(project);
    created.tasks.push(...projectToTasks(project));
  }

  if (intent === "assistant" || intent === "all") {
    created.tasks.push(...createAssistantTasks(instruction));
  }

  if (intent === "calendar" || intent === "all") {
    created.calendar = buildWeeklyCalendar(extractTopic(instruction));
    created.tasks.push(createTask("Review this week's content calendar", "Planning", todayIso(), "High"));
  }

  return created;
}

function applyCreatedItems(created) {
  if (created.content.length) state.content.unshift(...created.content);
  if (created.projects.length) state.projects.unshift(...created.projects);
  if (created.tasks.length) state.tasks.unshift(...created.tasks);
  if (created.calendar && created.calendar.length) state.calendar = created.calendar;
}

function detectIntent(instruction) {
  const text = instruction.toLowerCase();
  const contentWords = ["post", "content", "social", "instagram", "linkedin", "youtube", "short", "caption", "script"];
  const projectWords = ["project", "app", "website", "tool", "product", "mvp", "build", "earn", "monetize"];
  const assistantWords = ["mail", "email", "message", "reply", "follow", "search", "track", "remind", "client"];
  const calendarWords = ["calendar", "week", "weekly", "7-day", "7 day", "plan"];

  const wantsContent = contentWords.some((word) => text.includes(word));
  const wantsProject = projectWords.some((word) => text.includes(word));
  const wantsAssistant = assistantWords.some((word) => text.includes(word));
  const wantsCalendar = calendarWords.some((word) => text.includes(word));

  if ([wantsContent, wantsProject, wantsAssistant, wantsCalendar].filter(Boolean).length > 1) return "all";
  if (wantsContent) return "content";
  if (wantsProject) return "project";
  if (wantsAssistant) return "assistant";
  if (wantsCalendar) return "calendar";
  return "all";
}

function createContentPack(instruction) {
  const count = extractRequestedCount(instruction) || state.guidelines.dailyPosts;
  const platforms = extractPlatforms(instruction);
  const topic = extractTopic(instruction);
  const pillars = ["Problem", "Tutorial", "Proof", "Offer", "Mistake", "Checklist", "Story"];
  const formats = ["Carousel", "Short video", "Text post", "Story", "Thread", "Checklist"];

  return Array.from({ length: count }, (_, index) => {
    const platform = platforms[index % platforms.length];
    const format = platform === "YouTube Shorts" ? "Short video" : formats[index % formats.length];
    const pillar = pillars[index % pillars.length];
    const angle = buildAngle(topic, index, pillar);
    const scheduledFor = `${todayIso(Math.floor(index / 2))}T${["09:30", "13:00", "18:30", "20:00"][index % 4]}:00`;

    return {
      id: uid("content"),
      platform,
      format,
      title: `${angle}: ${format} for ${platform}`,
      hook: buildHook(topic, pillar, index),
      caption: buildCaption(angle, platform, pillar),
      script: buildScript(angle, platform, pillar),
      assetPrompt: buildAssetPrompt(angle, platform, format),
      status: state.guidelines.approval === "required" ? "Draft" : "Ready",
      scheduledFor,
      createdAt: new Date().toISOString(),
      sourceInstruction: instruction
    };
  });
}

function extractRequestedCount(instruction) {
  const match = instruction.match(/(\d+)\s*(post|posts|content|caption|captions|script|scripts|short|shorts)/i);
  if (!match) return null;
  return clamp(Number(match[1]), 1, 10);
}

function extractPlatforms(instruction) {
  const text = instruction.toLowerCase();
  const platforms = [];
  if (text.includes("instagram") || text.includes("reel")) platforms.push("Instagram");
  if (text.includes("linkedin")) platforms.push("LinkedIn");
  if (text.includes("youtube") || text.includes("short")) platforms.push("YouTube Shorts");
  if (text.includes("twitter") || text.includes(" x ")) platforms.push("X");
  if (platforms.length) return platforms;
  return ["Instagram", "LinkedIn", "YouTube Shorts"];
}

function extractTopic(instruction) {
  const cleaned = instruction
    .replace(/\s+/g, " ")
    .replace(/create|banao|banado|daily|aaj|post|posts|content|script|caption/gi, "")
    .trim();
  if (cleaned.length > 18) return compactText(cleaned, 70);
  return state.guidelines.niche;
}

function buildAngle(topic, index, pillar) {
  const angles = {
    Problem: `Manual pain to simple system: ${topic}`,
    Tutorial: `Step-by-step free workflow: ${topic}`,
    Proof: `Before/after operating system: ${topic}`,
    Offer: `Free lead magnet angle: ${topic}`,
    Mistake: `Common mistake and fix: ${topic}`,
    Checklist: `Daily execution checklist: ${topic}`,
    Story: `Builder journey lesson: ${topic}`
  };
  return angles[pillar] || `Execution system: ${topic}`;
}

function buildHook(topic, pillar, index) {
  const hooks = {
    Problem: `Agar ${topic} random lag raha hai, problem AI nahi, system hai.`,
    Tutorial: `Is free workflow se manual work ko daily execution mein convert karo.`,
    Proof: `Before: scattered ideas. After: tracker, draft, schedule, follow-up.`,
    Offer: `Ek useful free checklist lead bana sakti hai, bas promise clear hona chahiye.`,
    Mistake: `Sabse badi galti: content banana, par result track na karna.`,
    Checklist: `Aaj ka 20-minute execution checklist: idea, draft, publish, log.`,
    Story: `Maine system ko simple rakha: pehle manual, phir repeat, phir automate.`
  };
  return hooks[pillar] || `Free system idea #${index + 1}: ${topic}`;
}

function buildCaption(angle, platform, pillar) {
  const cta =
    platform === "LinkedIn"
      ? "Comment 'SYSTEM' if you want the checklist."
      : "DM 'SYSTEM' for the workflow checklist.";
  const middle =
    pillar === "Offer"
      ? ["Free offer idea:", "- 1-page checklist", "- Simple audit", "- 15-minute setup roadmap"]
      : ["Simple formula:", "1. Define the repeated task.", "2. Write clear rules.", "3. Draft once.", "4. Review.", "5. Track result."];
  return [
    `${angle}`,
    ...middle,
    cta,
    "#AIAutomation #DigitalBusiness #Productivity"
  ].join("\n");
}

function buildScript(angle, platform, pillar) {
  if (platform !== "YouTube Shorts" && platform !== "Instagram") {
    return `Post structure: ${pillar} hook, 3 practical points, one proof/example, CTA. Topic: ${angle}.`;
  }
  return [
    `0-2s hook: "${angle}"`,
    "3-8s show the messy manual workflow on screen.",
    "9-18s show the free system: prompt, rules, tracker, native publishing.",
    "19-25s show the result: draft ready, task tracked, next action clear.",
    "26-30s CTA: Follow for practical AI business systems."
  ].join("\n");
}

function buildAssetPrompt(angle, platform, format) {
  return [
    `Create a clean business-tech visual for ${platform}.`,
    `Theme: ${angle}.`,
    `Format: ${format}.`,
    "Use real dashboard-style elements, readable labels, neutral background, teal and amber accents, professional lighting."
  ].join(" ");
}

function createProjectFromInstruction(instruction) {
  const name = titleFromInstruction(instruction);
  return {
    id: uid("project"),
    name,
    objective: `Turn "${compactText(instruction, 90)}" into a repeatable offer or product.`,
    status: "Active",
    progress: 10,
    nextStep: "Define exact user pain, offer promise, and first MVP screen.",
    milestones: [
      "Problem and target user locked",
      "Free MVP workflow mapped",
      "Notion/Google Form/manual demo created",
      "First content launch pack published from native apps",
      "Lead capture and follow-up tracker active"
    ],
    monetization: [
      "Start with free content proof",
      "Collect leads with a free checklist",
      "Offer manual setup help before building software",
      "Reinvest only after demand is visible"
    ],
    createdAt: new Date().toISOString()
  };
}

function titleFromInstruction(instruction) {
  const cleaned = instruction
    .replace(/\s+/g, " ")
    .replace(/create|build|make|banao|project|mvp|app|website/gi, "")
    .trim();
  const fallback = "AI Automation Revenue System";
  const title = cleaned || fallback;
  return toTitleCase(compactText(title, 48));
}

function projectToTasks(project) {
  return [
    createTask(`${project.name}: define target customer and pain`, "Project", todayIso(), "High", project.id),
    createTask(`${project.name}: create free MVP checklist`, "Project", todayIso(1), "High", project.id),
    createTask(`${project.name}: publish first launch post manually`, "Marketing", todayIso(2), "Medium", project.id),
    createTask(`${project.name}: message 5 warm contacts for feedback`, "Validation", todayIso(2), "Medium", project.id)
  ];
}

function createAssistantTasks(instruction) {
  return [
    createTask("Research missing context before final reply/action", "Assistant", todayIso(), "High"),
    createTask("Draft emails/messages and wait for approval", "Assistant", todayIso(), "High"),
    createTask("Track follow-ups and next response date", "Assistant", todayIso(1), "Medium"),
    createTask(`Review command for risky actions: ${compactText(instruction, 60)}`, "Quality", todayIso(), "High")
  ];
}

function createTask(title, source = "General", dueDate = todayIso(), priority = "Medium", projectId = null) {
  return {
    id: uid("task"),
    title,
    source,
    dueDate,
    priority,
    projectId,
    status: "Open",
    createdAt: new Date().toISOString()
  };
}

function createLead(name, source = "Manual", note = "", contentId = null) {
  return {
    id: uid("lead"),
    name,
    source,
    note,
    contentId,
    status: "New",
    createdAt: new Date().toISOString()
  };
}

function createEarning(amount, source = "Manual", note = "", contentId = null) {
  return {
    id: uid("earning"),
    amount: Number(amount) || 0,
    source,
    note,
    contentId,
    createdAt: new Date().toISOString()
  };
}

function promptNumber(label, fallback = 0) {
  const value = window.prompt(label, String(fallback));
  if (value === null) return 0;
  const number = Number(String(value).replace(/,/g, "").trim());
  return Number.isFinite(number) ? Math.max(0, number) : 0;
}

function formatMoney(amount) {
  return new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 0,
    style: "currency",
    currency: "INR"
  }).format(Number(amount) || 0);
}

function formatCompactNumber(value) {
  return new Intl.NumberFormat("en-IN", {
    notation: "compact",
    maximumFractionDigits: 1
  }).format(Number(value) || 0);
}

function contentMetricTotals() {
  return state.content.reduce(
    (totals, item) => {
      const metrics = item.metrics || {};
      totals.views += Number(metrics.views) || 0;
      totals.saves += Number(metrics.saves) || 0;
      totals.comments += Number(metrics.comments) || 0;
      totals.leads += Number(metrics.leads) || 0;
      totals.revenue += Number(metrics.revenue) || 0;
      return totals;
    },
    { views: 0, saves: 0, comments: 0, leads: 0, revenue: 0 }
  );
}

function buildExecutionSummary(instruction, intent, created, source = "Offline generator", managerNote = "") {
  const lines = [
    `Instruction: ${instruction}`,
    `Intent: ${intent}`,
    `Source: ${source}`,
    "",
    "Created:"
  ];
  lines.push(`- Content items: ${created.content.length}`);
  lines.push(`- Projects: ${created.projects.length}`);
  lines.push(`- Tasks: ${created.tasks.length}`);
  lines.push(`- Calendar items: ${created.calendar ? created.calendar.length : 0}`);
  lines.push("");
  lines.push("Next:");
  lines.push("- Review drafts in Content Queue.");
  lines.push("- Mark items Ready/Scheduled/Published as work moves.");
  lines.push("- Use Log Metrics after publishing to track views, saves, leads, and revenue.");
  lines.push("- Use Export JSON weekly for backup.");
  if (state.guidelines.approval === "required") {
    lines.push("- Publishing approval is required, so generated items stay as Draft.");
  }
  if (managerNote) {
    lines.push("");
    lines.push("Manager note:");
    lines.push(managerNote);
  }
  return lines.join("\n");
}

function buildDailyReport() {
  ensureDailyChecklist();
  const openTasks = state.tasks.filter((task) => task.status !== "Done");
  const readyContent = state.content.filter((item) => item.status === "Ready" || item.status === "Scheduled");
  const metricTotals = contentMetricTotals();
  const revenueTotal =
    state.earnings.reduce((sum, earning) => sum + (Number(earning.amount) || 0), 0) + metricTotals.revenue;
  const leadTotal = state.leads.length + metricTotals.leads;
  const publishedToday = state.content.filter(
    (item) => item.status === "Published" && (item.publishedAt || item.scheduledFor || "").startsWith(todayIso())
  );
  const bestContent = state.content
    .filter((item) => item.metrics)
    .slice()
    .sort((a, b) => {
      const aMetrics = a.metrics || {};
      const bMetrics = b.metrics || {};
      return (
        (Number(bMetrics.leads) || 0) - (Number(aMetrics.leads) || 0) ||
        (Number(bMetrics.saves) || 0) - (Number(aMetrics.saves) || 0) ||
        (Number(bMetrics.views) || 0) - (Number(aMetrics.views) || 0)
      );
    })[0];
  const topTasks = openTasks
    .slice()
    .sort(sortTasks)
    .slice(0, 5)
    .map((task, index) => `${index + 1}. ${task.title} (${task.priority}, due ${task.dueDate})`);
  const checklistDone = state.checklist.items.filter((item) => item.done).length;
  const nextCalendarItem = state.calendar
    .slice()
    .sort((a, b) => String(a.date).localeCompare(String(b.date)))
    .find((item) => item.status !== "Measured");

  return [
    "Daily Execution Report",
    "",
    `Open tasks: ${openTasks.length}`,
    `Ready/Scheduled content: ${readyContent.length}`,
    `Published today: ${publishedToday.length}`,
    `Active projects: ${state.projects.filter((project) => project.status !== "Done").length}`,
    `Total views: ${formatCompactNumber(metricTotals.views)}`,
    `Leads tracked: ${leadTotal}`,
    `Revenue tracked: ${formatMoney(revenueTotal)}`,
    `Checklist: ${checklistDone}/${state.checklist.items.length} done`,
    `Next calendar item: ${nextCalendarItem ? `${nextCalendarItem.date} - ${nextCalendarItem.title}` : "Generate weekly calendar"}`,
    `Best content: ${bestContent ? bestContent.title : "Metrics pending"}`,
    "",
    "Priority actions:",
    topTasks.length ? topTasks.join("\n") : "No open tasks. Generate a content or project plan.",
    "",
    "Manager note:",
    "Free-first rule: publish manually, track results, and only spend money after demand is visible."
  ].join("\n");
}

function render() {
  ensureDailyChecklist();
  els.approvalModePill.textContent =
    state.guidelines.approval === "required" ? "Approval required" : "Trusted workflows";
  renderMetrics();
  renderNextActions();
  renderChecklist();
  renderCalendar();
  renderContentQueue();
  renderProjects();
  renderTasks();
  renderGrowth();
  renderLogs();
}

function renderMetrics() {
  const contentTotals = contentMetricTotals();
  const revenueTotal =
    state.earnings.reduce((sum, earning) => sum + (Number(earning.amount) || 0), 0) + contentTotals.revenue;
  const leadTotal = state.leads.length + contentTotals.leads;
  els.metricContent.textContent = state.content.length;
  els.metricTasks.textContent = state.tasks.filter((task) => task.status !== "Done").length;
  els.metricProjects.textContent = state.projects.length;
  els.metricPublished.textContent = state.content.filter((item) => item.status === "Published").length;
  els.metricLeads.textContent = leadTotal;
  els.metricRevenue.textContent = formatCompactNumber(revenueTotal);
  els.metricViews.textContent = formatCompactNumber(contentTotals.views);
  els.metricEngagement.textContent = formatCompactNumber(contentTotals.saves + contentTotals.comments);
}

function renderNextActions() {
  const actions = state.tasks
    .filter((task) => task.status !== "Done")
    .slice()
    .sort(sortTasks)
    .slice(0, 4);
  setEmpty(els.nextActionsList, "No tasks yet.");
  actions.forEach((task) => {
    const node = document.createElement("div");
    node.className = "stack-item";
    node.innerHTML = `
      <div class="stack-item-top">
        <strong></strong>
        <span class="tag"></span>
      </div>
      <p></p>
    `;
    node.querySelector("strong").textContent = task.title;
    node.querySelector(".tag").textContent = task.priority;
    node.querySelector("p").textContent = `${task.source} - due ${task.dueDate}`;
    els.nextActionsList.appendChild(node);
  });
  markFilled(els.nextActionsList);
}

function renderChecklist() {
  ensureDailyChecklist();
  setEmpty(els.checklistList, "No checklist yet.");
  state.checklist.items.forEach((item) => {
    const node = document.createElement("label");
    node.className = item.done ? "checklist-item done" : "checklist-item";
    node.innerHTML = `
      <input type="checkbox" />
      <strong></strong>
      <button class="ghost-button compact" type="button">Task</button>
    `;
    const checkbox = node.querySelector("input");
    checkbox.checked = Boolean(item.done);
    node.querySelector("strong").textContent = item.title;
    checkbox.addEventListener("change", () => {
      item.done = checkbox.checked;
      addLog(item.done ? "Checklist completed" : "Checklist reopened", item.title);
      saveState();
      render();
    });
    node.querySelector("button").addEventListener("click", (event) => {
      event.preventDefault();
      state.tasks.unshift(createTask(item.title, "Checklist", todayIso(), "Medium"));
      addLog("Checklist task created", item.title);
      saveState();
      render();
    });
    els.checklistList.appendChild(node);
  });
  markFilled(els.checklistList);
}

function renderCalendar() {
  setEmpty(els.calendarList, "No calendar yet.");
  state.calendar.forEach((item) => {
    const node = document.createElement("article");
    node.className = "calendar-item";
    node.innerHTML = `
      <div class="calendar-date"></div>
      <div class="calendar-detail">
        <div class="stack-item-top">
          <strong></strong>
          <span class="tag"></span>
        </div>
        <p class="calendar-meta"></p>
        <p class="calendar-hook"></p>
        <div class="stack-actions">
          <select class="calendar-status" aria-label="Update calendar status">
            <option>Planned</option>
            <option>Drafted</option>
            <option>Published</option>
            <option>Measured</option>
          </select>
          <button class="ghost-button compact create-draft-button" type="button">Create Draft</button>
        </div>
      </div>
    `;
    node.querySelector(".calendar-date").textContent = formatCalendarDate(item.date);
    node.querySelector("strong").textContent = item.title;
    node.querySelector(".tag").textContent = item.status;
    node.querySelector(".calendar-meta").textContent = `${item.platform} - ${item.format} - ${item.pillar}`;
    node.querySelector(".calendar-hook").textContent = item.hook;

    const statusSelect = node.querySelector(".calendar-status");
    statusSelect.value = item.status;
    statusSelect.addEventListener("change", () => {
      item.status = statusSelect.value;
      addLog("Calendar status updated", `${item.title} -> ${item.status}`);
      saveState();
      render();
    });

    node.querySelector(".create-draft-button").addEventListener("click", () => {
      state.content.unshift(createContentFromCalendar(item));
      item.status = "Drafted";
      addLog("Draft created from calendar", item.title);
      saveState();
      render();
    });

    els.calendarList.appendChild(node);
  });
  markFilled(els.calendarList);
}

function formatCalendarDate(isoDate) {
  const date = new Date(`${isoDate}T00:00:00`);
  if (Number.isNaN(date.getTime())) return isoDate;
  return date.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" });
}

function createContentFromCalendar(item) {
  return {
    id: uid("content"),
    platform: item.platform,
    format: item.format,
    title: item.title,
    hook: item.hook,
    caption: buildCaption(item.title, item.platform, item.pillar),
    script: buildScript(item.title, item.platform, item.pillar),
    assetPrompt: buildAssetPrompt(item.title, item.platform, item.format),
    status: "Draft",
    scheduledFor: `${item.date}T09:30:00`,
    createdAt: new Date().toISOString(),
    sourceInstruction: "Created from 7-day calendar"
  };
}

function renderContentQueue() {
  const template = $("#contentCardTemplate");
  const filter = els.contentFilter.value;
  const items = state.content.filter((item) => filter === "all" || item.status === filter);
  setEmpty(els.contentQueue, "No content yet.");
  items.forEach((item) => {
    const card = template.content.firstElementChild.cloneNode(true);
    card.querySelector(".platform-badge").textContent = `${item.platform} - ${item.format}`;
    card.querySelector("h3").textContent = item.title;
    card.querySelector(".hook").textContent = item.hook;
    card.querySelector(".caption").textContent = item.caption;
    card.querySelector(".script").textContent = item.script;
    card.querySelector(".asset-prompt").textContent = item.assetPrompt;
    card.querySelector(".schedule").textContent = humanDateTime(item.scheduledFor);
    card.querySelector(".metrics-line").textContent = formatContentMetrics(item);

    const statusSelect = card.querySelector(".status-select");
    statusSelect.value = item.status;
    statusSelect.addEventListener("change", () => {
      item.status = statusSelect.value;
      if (item.status === "Published") item.publishedAt = new Date().toISOString();
      addLog("Content status updated", `${item.title} -> ${item.status}`);
      saveState();
      render();
    });

    card.querySelector(".copy-button").addEventListener("click", async () => {
      await copyText(formatContentForCopy(item));
      addLog("Content copied", item.title);
      saveState();
      renderLogs();
    });

    card.querySelector(".log-metrics-button").addEventListener("click", () => {
      logContentMetrics(item);
      saveState();
      render();
    });

    els.contentQueue.appendChild(card);
  });
  markFilled(els.contentQueue);
}

function formatContentMetrics(item) {
  const metrics = item.metrics || {};
  const views = Number(metrics.views) || 0;
  const saves = Number(metrics.saves) || 0;
  const comments = Number(metrics.comments) || 0;
  const leads = Number(metrics.leads) || 0;
  const revenue = Number(metrics.revenue) || 0;
  if (!views && !saves && !comments && !leads && !revenue) {
    return "Metrics not logged yet";
  }
  return `Views ${formatCompactNumber(views)} | Saves ${saves} | Comments ${comments} | Leads ${leads} | Revenue ${formatMoney(revenue)}`;
}

function logContentMetrics(item) {
  const previous = item.metrics || {};
  const views = promptNumber("Views?", previous.views || 0);
  const saves = promptNumber("Saves?", previous.saves || 0);
  const comments = promptNumber("Comments?", previous.comments || 0);
  const leads = promptNumber("Leads from this content?", previous.leads || 0);
  const revenue = promptNumber("Revenue from this content?", previous.revenue || 0);

  item.metrics = {
    views,
    saves,
    comments,
    leads,
    revenue,
    updatedAt: new Date().toISOString()
  };

  if (leads > Number(previous.leads || 0)) {
    const newLeads = leads - Number(previous.leads || 0);
    state.leads.unshift(createLead(`${newLeads} lead(s) from content`, item.platform, item.title, item.id));
    state.tasks.unshift(createTask(`Follow up ${newLeads} lead(s) from ${item.platform}`, "Lead", todayIso(1), "High"));
  }

  if (revenue > Number(previous.revenue || 0)) {
    state.earnings.unshift(createEarning(revenue - Number(previous.revenue || 0), item.platform, item.title, item.id));
  }

  addLog("Content metrics logged", `${item.title}: ${formatContentMetrics(item)}`);
}

function renderProjects() {
  setEmpty(els.projectList, "No projects yet.");
  state.projects.forEach((project) => {
    const node = document.createElement("article");
    node.className = "stack-item";
    node.innerHTML = `
      <div class="stack-item-top">
        <strong></strong>
        <span class="tag"></span>
      </div>
      <p class="objective"></p>
      <div class="progress-track" aria-label="Project progress">
        <div class="progress-bar"></div>
      </div>
      <p class="next-step"></p>
      <div class="stack-actions">
        <button class="ghost-button compact progress-button" type="button">+25%</button>
        <button class="ghost-button compact complete-button" type="button">Done</button>
      </div>
    `;
    node.querySelector("strong").textContent = project.name;
    node.querySelector(".tag").textContent = `${project.progress}%`;
    node.querySelector(".objective").textContent = project.objective;
    node.querySelector(".progress-bar").style.width = `${project.progress}%`;
    node.querySelector(".next-step").textContent = `Next: ${project.nextStep}`;
    node.querySelector(".progress-button").addEventListener("click", () => {
      project.progress = clamp(project.progress + 25, 0, 100);
      if (project.progress === 100) project.status = "Done";
      addLog("Project progress updated", `${project.name}: ${project.progress}%`);
      saveState();
      render();
    });
    node.querySelector(".complete-button").addEventListener("click", () => {
      project.progress = 100;
      project.status = "Done";
      addLog("Project completed", project.name);
      saveState();
      render();
    });
    els.projectList.appendChild(node);
  });
  markFilled(els.projectList);
}

function renderTasks() {
  setEmpty(els.taskList, "No tasks yet.");
  state.tasks
    .slice()
    .sort(sortTasks)
    .forEach((task) => {
      const node = document.createElement("article");
      node.className = "stack-item";
      node.innerHTML = `
        <div class="stack-item-top">
          <strong></strong>
          <span class="tag"></span>
        </div>
        <p></p>
        <div class="stack-actions">
          <button class="ghost-button compact done-button" type="button">Done</button>
          <button class="ghost-button compact later-button" type="button">Tomorrow</button>
        </div>
      `;
      node.querySelector("strong").textContent = task.title;
      node.querySelector(".tag").textContent = task.status === "Done" ? "Done" : task.priority;
      node.querySelector("p").textContent = `${task.source} - due ${task.dueDate}`;
      node.querySelector(".done-button").addEventListener("click", () => {
        task.status = "Done";
        task.completedAt = new Date().toISOString();
        addLog("Task completed", task.title);
        saveState();
        render();
      });
      node.querySelector(".later-button").addEventListener("click", () => {
        task.dueDate = todayIso(1);
        addLog("Task moved", `${task.title} moved to tomorrow.`);
        saveState();
        render();
      });
      els.taskList.appendChild(node);
    });
  markFilled(els.taskList);
}

function renderGrowth() {
  setEmpty(els.growthList, "No growth tracked yet.");
  const leadItems = state.leads.map((lead) => ({
    type: "Lead",
    title: lead.name,
    detail: `${lead.source} - ${lead.note || lead.status}`,
    at: lead.createdAt
  }));
  const earningItems = state.earnings.map((earning) => ({
    type: "Earning",
    title: formatMoney(earning.amount),
    detail: `${earning.source} - ${earning.note || "Revenue logged"}`,
    at: earning.createdAt
  }));

  leadItems
    .concat(earningItems)
    .sort((a, b) => String(b.at).localeCompare(String(a.at)))
    .slice(0, 8)
    .forEach((item) => {
      const node = document.createElement("article");
      node.className = "stack-item";
      node.innerHTML = `
        <div class="stack-item-top">
          <strong></strong>
          <span class="tag"></span>
        </div>
        <p></p>
      `;
      node.querySelector("strong").textContent = item.title;
      node.querySelector(".tag").textContent = item.type;
      node.querySelector("p").textContent = item.detail;
      els.growthList.appendChild(node);
    });
  markFilled(els.growthList);
}

function renderLogs() {
  setEmpty(els.activityLog, "No activity yet.");
  state.logs.slice(0, 20).forEach((log) => {
    const node = document.createElement("article");
    node.className = "log-entry";
    node.innerHTML = `
      <strong></strong>
      <time></time>
      <p></p>
    `;
    node.querySelector("strong").textContent = log.title;
    node.querySelector("time").textContent = humanDateTime(log.at);
    node.querySelector("p").textContent = log.detail;
    els.activityLog.appendChild(node);
  });
  markFilled(els.activityLog);
}

function setEmpty(element, message) {
  element.innerHTML = "";
  element.dataset.empty = "true";
  element.dataset.emptyText = message;
}

function markFilled(element) {
  if (element.children.length) {
    delete element.dataset.empty;
  }
}

function sortTasks(a, b) {
  const priorityScore = { High: 0, Medium: 1, Low: 2 };
  const aPriority = Object.prototype.hasOwnProperty.call(priorityScore, a.priority) ? priorityScore[a.priority] : 3;
  const bPriority = Object.prototype.hasOwnProperty.call(priorityScore, b.priority) ? priorityScore[b.priority] : 3;
  return (
    aPriority - bPriority ||
    String(a.dueDate).localeCompare(String(b.dueDate))
  );
}

function formatContentForCopy(item) {
  return [
    `${item.platform} - ${item.format}`,
    item.title,
    "",
    item.hook,
    "",
    item.caption,
    "",
    "Script:",
    item.script,
    "",
    "Asset prompt:",
    item.assetPrompt
  ].join("\n");
}

async function copyText(text) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }
  const textarea = document.createElement("textarea");
  textarea.value = text;
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand("copy");
  textarea.remove();
}

function loadStarterData() {
  const instruction =
    "Create daily content and a monetizable AI automation project for creators and small businesses.";
  const content = createContentPack(instruction);
  const project = createProjectFromInstruction("AI Automation Starter Kit");
  state.content.unshift(...content);
  state.projects.unshift(project);
  state.tasks.unshift(...projectToTasks(project));
  state.tasks.unshift(createTask("Review first 3 content drafts", "Publishing", todayIso(), "High"));
  state.leads.unshift(createLead("Sample lead from Instagram", "Instagram", "Asked for automation checklist"));
  state.calendar = buildWeeklyCalendar(state.guidelines.niche);
  state.checklist = createDailyChecklist();
  addLog("Starter data loaded", "Sample content, project, calendar, lead, and tasks added.");
}

function exportJson() {
  downloadFile(
    `automation-command-center-${todayIso()}.json`,
    JSON.stringify(state, null, 2),
    "application/json"
  );
  addLog("JSON exported", "Full tracker backup downloaded.");
  saveState();
  renderLogs();
}

function exportCsv() {
  const rows = [
    [
      "type",
      "title",
      "status",
      "platform_or_source",
      "date",
      "priority_or_amount",
      "views",
      "saves",
      "comments",
      "leads",
      "revenue",
      "note"
    ],
    ...state.content.map((item) => {
      const metrics = item.metrics || {};
      return [
        "content",
        item.title,
        item.status,
        item.platform,
        item.scheduledFor,
        "",
        metrics.views || 0,
        metrics.saves || 0,
        metrics.comments || 0,
        metrics.leads || 0,
        metrics.revenue || 0,
        item.format
      ];
    }),
    ...state.tasks.map((task) => [
      "task",
      task.title,
      task.status,
      task.source,
      task.dueDate,
      task.priority,
      "",
      "",
      "",
      "",
      "",
      ""
    ]),
    ...state.projects.map((project) => [
      "project",
      project.name,
      project.status,
      "Project",
      project.createdAt,
      `${project.progress}%`,
      "",
      "",
      "",
      "",
      "",
      project.nextStep
    ]),
    ...state.calendar.map((item) => [
      "calendar",
      item.title,
      item.status,
      item.platform,
      item.date,
      item.format,
      "",
      "",
      "",
      "",
      "",
      item.hook
    ]),
    ...((state.checklist && state.checklist.items) || []).map((item) => [
      "checklist",
      item.title,
      item.done ? "Done" : "Open",
      "Daily",
      state.checklist.date,
      "",
      "",
      "",
      "",
      "",
      "",
      ""
    ]),
    ...state.leads.map((lead) => [
      "lead",
      lead.name,
      lead.status,
      lead.source,
      lead.createdAt,
      "",
      "",
      "",
      "",
      1,
      "",
      lead.note
    ]),
    ...state.earnings.map((earning) => [
      "earning",
      earning.source,
      "Logged",
      earning.source,
      earning.createdAt,
      earning.amount,
      "",
      "",
      "",
      "",
      earning.amount,
      earning.note
    ])
  ];
  const csv = rows.map((row) => row.map(escapeCsv).join(",")).join("\n");
  downloadFile(`automation-command-center-${todayIso()}.csv`, csv, "text/csv");
  addLog("CSV exported", "Tracker CSV downloaded.");
  saveState();
  renderLogs();
}

function importJson(event) {
  const file = event.target.files && event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const imported = JSON.parse(String(reader.result));
      state = {
        ...cloneData(DEFAULT_STATE),
        ...imported,
        guidelines: { ...DEFAULT_STATE.guidelines, ...(imported.guidelines || {}) },
        content: Array.isArray(imported.content) ? imported.content : [],
        projects: Array.isArray(imported.projects) ? imported.projects : [],
        tasks: Array.isArray(imported.tasks) ? imported.tasks : [],
        leads: Array.isArray(imported.leads) ? imported.leads : [],
        earnings: Array.isArray(imported.earnings) ? imported.earnings : [],
        checklist: imported.checklist && typeof imported.checklist === "object" ? imported.checklist : createDailyChecklist(),
        calendar: Array.isArray(imported.calendar) ? imported.calendar : [],
        logs: Array.isArray(imported.logs) ? imported.logs : []
      };
      addLog("JSON imported", file.name);
      hydrateGuidelinesForm();
      saveState();
      render();
    } catch (error) {
      window.alert("Import failed. Please use a valid exported JSON file.");
      console.error(error);
    }
    event.target.value = "";
  };
  reader.readAsText(file);
}

function downloadFile(filename, content, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function escapeCsv(value) {
  const text = String(value == null ? "" : value);
  if (!/[",\n]/.test(text)) return text;
  return `"${text.replace(/"/g, '""')}"`;
}

function compactText(text, maxLength) {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 3).trim()}...`;
}

function toTitleCase(text) {
  return text
    .toLowerCase()
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

window.addEventListener("error", (event) => {
  reportError("Unexpected browser error stopped the app.", event.error || event.message);
});

window.addEventListener("unhandledrejection", (event) => {
  reportError("Unexpected async error stopped the app.", event.reason);
});

init();
