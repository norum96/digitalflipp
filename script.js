// ======= PLAN-VALG, AVDELING, DAG, PERIODE, INTERVALL =======
let avdelinger = ["Avdeling A"];
let valgtPlan = {
  avdeling: avdelinger[0],
  ukedag: "mandag",
  periode: "dag"
};
let planData = {};

function getPlanKey(avdeling, dag, periode) {
  return `${avdeling||valgtPlan.avdeling}_${dag||valgtPlan.ukedag}_${periode||valgtPlan.periode}`;
}
function hentPlanData(avdeling, dag, periode) {
  let key = getPlanKey(avdeling, dag, periode);
  if (!planData[key]) {
    planData[key] = {
      brukere: [],
      vaktkoder: [],
      tjenester: {},
      ekstra: [],
      tider: {
        dag:    { startTid: "08:00", sluttTid: "15:00", intervall: 30 },
        kveld:  { startTid: "15:00", sluttTid: "23:00", intervall: 30 }
      }
    };
  }
  if (!planData[key].tider) planData[key].tider = { dag: { startTid: "08:00", sluttTid: "15:00", intervall: 30 }, kveld: { startTid: "15:00", sluttTid: "23:00", intervall: 30 } };
  return planData[key];
}

// ===== FREMSIDE UKEDAG/PERIODE LOGIKK =====
document.getElementById("forside-ukedag").value = valgtPlan.ukedag;
document.getElementById("forside-periode").value = valgtPlan.periode;
document.getElementById("forside-ukedag").onchange = function() {
  valgtPlan.ukedag = this.value;
  byggRutenett();
  byggVaktkodeOversikt();
};
document.getElementById("forside-periode").onchange = function() {
  valgtPlan.periode = this.value;
  lagVaktkodeCSS();
  byggRutenett();
  byggVaktkodeOversikt();
};

// ====== PLANMODAL LOGIKK ======
document.getElementById("planinnstillinger-btn").onclick = () => {
  fyllAvdelingSelect(valgtPlan.avdeling);
  document.getElementById("ny-avdeling-div").style.display = "none";
  visTidForPeriode();
  åpneModal("plan-modal");
};
function visTidForPeriode() {
  let p = valgtPlan.periode;
  try { p = document.getElementById("plan-periode").value; } catch {}
  let d = hentPlanData();
  let t = d.tider && d.tider[p] ? d.tider[p] : { startTid: "08:00", sluttTid: "15:00", intervall: 30 };
  document.getElementById("plan-starttid").value = t.startTid;
  document.getElementById("plan-slutttid").value = t.sluttTid;
  document.getElementById("plan-intervall").value = t.intervall;
}
document.getElementById("plan-cancel-btn").onclick = () => lukkModal("plan-modal");

document.getElementById("ny-avdeling-btn").onclick = () => {
  document.getElementById("ny-avdeling-div").style.display = "block";
  document.getElementById("ny-avdeling-input").focus();
};

document.getElementById("legg-til-avdeling-btn").onclick = () => {
  let navn = document.getElementById("ny-avdeling-input").value.trim();
  if (navn && !avdelinger.includes(navn)) {
    avdelinger.push(navn);
    fyllAvdelingSelect(navn);
    document.getElementById("ny-avdeling-div").style.display = "none";
    document.getElementById("ny-avdeling-input").value = "";
  }
};

document.getElementById("slett-avdeling-btn").onclick = () => {
  const avd = document.getElementById("plan-avdeling").value;
  if (avdelinger.length === 1) {
    alert("Du må ha minst én avdeling!");
    return;
  }
  if (confirm(`Slett avdeling '${avd}'? Dette fjerner alle planer tilknyttet denne avdelingen.`)) {
    Object.keys(planData).forEach(key => {
      if (key.startsWith(avd + "_")) delete planData[key];
    });
    avdelinger = avdelinger.filter(a => a !== avd);
    fyllAvdelingSelect();
    if (!avdelinger.includes(valgtPlan.avdeling)) {
      valgtPlan.avdeling = avdelinger[0];
    }
    lukkModal("plan-modal");
    byggRutenett();
    byggVaktkodeOversikt();
  }
};

function fyllAvdelingSelect(valgt) {
  let sel = document.getElementById("plan-avdeling");
  sel.innerHTML = "";
  avdelinger.forEach(a => {
    let opt = document.createElement("option");
    opt.value = a;
    opt.textContent = a;
    if (a === valgt) opt.selected = true;
    sel.appendChild(opt);
  });
}

document.getElementById("plan-velg-btn").onclick = () => {
  valgtPlan.avdeling = document.getElementById("plan-avdeling").value;
  // Oppdater tider og intervall kun for valgt periode
  let d = hentPlanData();
  ["dag", "kveld"].forEach(p => {
    if (!d.tider[p]) d.tider[p] = {};
  });
  // Oppdater alltid dag OG kveld - hvis noen endret dem tidligere
  d.tider.dag.startTid = document.getElementById("plan-starttid").value;
  d.tider.dag.sluttTid = document.getElementById("plan-slutttid").value;
  d.tider.dag.intervall = parseInt(document.getElementById("plan-intervall").value, 10);

  d.tider.kveld.startTid = d.tider.kveld.startTid || "15:00";
  d.tider.kveld.sluttTid = d.tider.kveld.sluttTid || "23:00";
  d.tider.kveld.intervall = d.tider.kveld.intervall || 30;

  lukkModal("plan-modal");
  lagVaktkodeCSS();
  byggRutenett();
  byggVaktkodeOversikt();

  // Synkroniser forsiden:
  document.getElementById("forside-ukedag").value = valgtPlan.ukedag;
  document.getElementById("forside-periode").value = valgtPlan.periode;
};

//-----Endre avdeling---------
document.getElementById("endre-avd-navn-btn").onclick = () => {
  let sel = document.getElementById("plan-avdeling");
  let gammel = sel.value;
  let ny = document.getElementById("endre-avd-navn-input").value.trim();
  if (!ny || avdelinger.includes(ny)) {
    alert("Ugyldig eller eksisterende navn.");
    return;
  }
  // Endre navn i avdelingslista:
  avdelinger = avdelinger.map(a => a === gammel ? ny : a);

  // Endre i all planData (nøkkel-bytt):
  let nyePlanData = {};
  Object.keys(planData).forEach(key => {
    if (key.startsWith(gammel + "_")) {
      let nyttKey = key.replace(gammel + "_", ny + "_");
      nyePlanData[nyttKey] = planData[key];
    } else {
      nyePlanData[key] = planData[key];
    }
  });
  planData = nyePlanData;

  // Oppdater valgtPlan hvis det gjelder nåværende avdeling
  if (valgtPlan.avdeling === gammel) valgtPlan.avdeling = ny;
  fyllAvdelingSelect(ny);
  document.getElementById("endre-avd-navn-input").value = "";
  byggRutenett();
  byggVaktkodeOversikt();
};

// ===== MODAL HJELP =====
function åpneModal(id) { document.getElementById(id).style.display = "flex"; }
function lukkModal(id) { document.getElementById(id).style.display = "none"; }

// ===== Dynamisk bygg tider =====
function genererTider(start, slutt, intervall) {
  const tider = [];
  let [h, m] = start.split(":").map(Number);
  const [sh, sm] = slutt.split(":").map(Number);
  while (h < sh || (h === sh && m < sm)) {
    let tidStr = `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
    tider.push(tidStr);
    m += intervall;
    while (m >= 60) { m -= 60; h += 1; }
  }
  return tider;
}

// ===== Dynamisk CSS for vaktkoder =====
function lagVaktkodeCSS() {
  let prev = document.getElementById("vaktkodecss");
  if (prev) prev.remove();
  let style = document.createElement('style');
  style.id = "vaktkodecss";
  const d = hentPlanData();
  d.vaktkoder.forEach(vk => {
    style.innerHTML += `
      .rute.${vk.kode} { background: ${vk.farge} !important; }
      .vaktkode-h3.${vk.kode} { background: ${vk.farge} !important; }
    `;
  });
  document.head.appendChild(style);
}
lagVaktkodeCSS();

//-----Bygg rutenett------
function byggRutenett() {
  const d = hentPlanData();
  const container = document.getElementById("rutenett-container");
  container.innerHTML = "";
  const periode = valgtPlan.periode;
  const tider = genererTider(
    d.tider?.[periode]?.startTid || "08:00",
    d.tider?.[periode]?.sluttTid || "15:00",
    d.tider?.[periode]?.intervall || 30
  );
  const table = document.createElement("table");
  const thead = document.createElement("thead");
  const hrow = document.createElement("tr");
  hrow.appendChild(document.createElement("th"));
  d.brukere.filter(b => b.vis !== false).forEach(b => {
    const th = document.createElement("th");
    th.textContent = b.id;
    hrow.appendChild(th);
  });
  thead.appendChild(hrow);
  table.appendChild(thead);

  // Finn alle multi-rute tjenester: map av tid_bruker til info
  const multiTjenesteMap = {};
  Object.entries(d.tjenester).forEach(([key, tj]) => {
    if (tj.varighet && tj.varighet > 1 && tj.starttidIndex !== undefined) {
      for (let i = tj.starttidIndex + 1; i < tj.sluttidIndex; ++i) {
        multiTjenesteMap[`${i}_${String(tj.brukerid)}_${tj.repeterId}`] = {
  vaktkode: tj.vaktkode,
  hovedKey: key
};
      }
    }
  });

  console.log("multiTjenesteMap:", multiTjenesteMap);

  const tbody = document.createElement("tbody");
  tider.forEach((tid, i) => {
    const tr = document.createElement("tr");
    const tidcell = document.createElement("td");
    tidcell.textContent = tid;
    tr.appendChild(tidcell);
    d.brukere.filter(b => b.vis !== false).forEach(bruker => {
      let td = document.createElement("td");
      td.className = "rute";
      td.dataset.tid = tid;
      td.dataset.tidIndex = i;
      td.dataset.brukerid = bruker.id;
      const tjKey = `${tid}_${bruker.id}`;
      const tjeneste = d.tjenester[tjKey];
      if (tjeneste) {
        td.innerHTML = tjeneste.bistand
          ? `<div>${tjeneste.bistand}</div><div>${tjeneste.vaktkode}</div>`
          : "";
        td.classList.add(tjeneste.vaktkode);
        td.onclick = () => åpneTjenesteModal(td);
      } else {
        let lockedKey = Object.keys(multiTjenesteMap).find(k => k.startsWith(`${i}_${String(bruker.id)}_`));
        console.log("Sjekker lockedKey for", i, bruker.id, "→", lockedKey);
        if (lockedKey) {
          console.log("Legger til låst:", lockedKey);
          td.classList.add("låst");
          td.classList.add(multiTjenesteMap[lockedKey].vaktkode);
          td.title = "Tjenesten varer fra tidligere celle";
          td.onclick = null;
          td.removeAttribute("onclick");
          td.style.pointerEvents = "none";
          td.innerHTML = "";
        } else {
          td.style.pointerEvents = "";
          td.onclick = () => åpneTjenesteModal(td);
        }
      }
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);
  container.appendChild(table);
  document.querySelector("h2").textContent = `Rutenett for tjenester – ${valgtPlan.avdeling}, ${valgtPlan.ukedag}, ${valgtPlan.periode}`;
}

// ===== Tjeneste-Modal =====
let valgtTd = null, valgtGjentaID = null;
function åpneTjenesteModal(td) {
  valgtTd = td;
  const d = hentPlanData();
  const tider = genererTider(
    d.tider?.[valgtPlan.periode]?.startTid || "08:00",
    d.tider?.[valgtPlan.periode]?.sluttTid || "15:00",
    d.tider?.[valgtPlan.periode]?.intervall || 30
  );
  const brukerid = td.dataset.brukerid;
  const tid = td.dataset.tid;
  const tidIndex = parseInt(td.dataset.tidIndex,10);

  let gjeldendeTjeneste = d.tjenester[`${tid}_${brukerid}`];
  let repeterId = gjeldendeTjeneste ? gjeldendeTjeneste.repeterId : null;
  valgtGjentaID = repeterId;

  document.getElementById("tjeneste-modal-info").textContent =
    `${tid} – ${brukerid}`;
  document.getElementById("tjeneste-bistand").value = gjeldendeTjeneste?.bistand || "";
  fyllVaktkodeSelect("tjeneste-vaktkode", gjeldendeTjeneste?.vaktkode || "");
  let sluttidSel = document.getElementById("tjeneste-sluttid");
  sluttidSel.innerHTML = "";
  for (let j = tidIndex+1; j <= tider.length; ++j) {
    let sluttid = (j < tider.length) ? tider[j] : "Slutt på vakt";
    let o = document.createElement("option");
    o.value = j;
    o.textContent = sluttid;
    sluttidSel.appendChild(o);
  }
  if (gjeldendeTjeneste?.sluttidIndex !== undefined)
    sluttidSel.value = gjeldendeTjeneste.sluttidIndex;

  let dagbokser = document.querySelectorAll(".gjenta-dag");
  let aktiveDager = [valgtPlan.ukedag];
  if (repeterId) {
    aktiveDager = [];
    ["mandag","tirsdag","onsdag","torsdag","fredag","lørdag","søndag"].forEach(dag => {
      let pd = hentPlanData(valgtPlan.avdeling, dag, valgtPlan.periode);
      let tider2 = genererTider(
        pd.tider?.[valgtPlan.periode]?.startTid || "08:00",
        pd.tider?.[valgtPlan.periode]?.sluttTid || "15:00",
        pd.tider?.[valgtPlan.periode]?.intervall || 30
      );
      let key = `${tider[tidIndex]}_${brukerid}`;
      if (pd.tjenester[key] && pd.tjenester[key].repeterId === repeterId) aktiveDager.push(dag);
    });
  }
  dagbokser.forEach(boks => {
    boks.checked = aktiveDager.includes(boks.value);
  });

  åpneModal("tjeneste-modal");
  document.getElementById("tjeneste-delete").style.display = gjeldendeTjeneste ? "" : "none";
}

document.getElementById("tjeneste-cancel").onclick = () => {
  if (valgtTd) valgtTd.classList.remove("aktiv");
  lukkModal("tjeneste-modal");
};

document.getElementById("tjeneste-delete").onclick = () => {
  let dagbokser = document.querySelectorAll(".gjenta-dag");
  let valgteDager = Array.from(dagbokser).filter(b=>b.checked).map(b=>b.value);
  let brukerid = valgtTd.dataset.brukerid;
  let tid = valgtTd.dataset.tid;
  let tidIndex = parseInt(valgtTd.dataset.tidIndex,10);
  let d = hentPlanData();
  let repeterId = valgtGjentaID;
  valgteDager.forEach(dag => {
    let pd = hentPlanData(valgtPlan.avdeling, dag, valgtPlan.periode);
    let tider = genererTider(
      pd.tider?.[valgtPlan.periode]?.startTid || "08:00",
      pd.tider?.[valgtPlan.periode]?.sluttTid || "15:00",
      pd.tider?.[valgtPlan.periode]?.intervall || 30
    );
    let key = `${tider[tidIndex]}_${brukerid}`;
    let tj = pd.tjenester[key];
    if (tj && tj.repeterId === repeterId) {
      for (let j = tidIndex; j <= tj.sluttidIndex; ++j) {
        let k = `${tider[j]}_${brukerid}`;
        delete pd.tjenester[k];
      }
    }
  });
  lukkModal("tjeneste-modal");
  byggRutenett();
  byggVaktkodeOversikt();
};

document.getElementById("tjeneste-save").onclick = () => {
  let dagbokser = document.querySelectorAll(".gjenta-dag");
  let valgteDager = Array.from(dagbokser).filter(b=>b.checked).map(b=>b.value);
  let brukerid = valgtTd.dataset.brukerid;
  let tid = valgtTd.dataset.tid;
  let tidIndex = parseInt(valgtTd.dataset.tidIndex,10);
  let bistand = document.getElementById("tjeneste-bistand").value.trim();
  let vaktkode = document.getElementById("tjeneste-vaktkode").value;
  let sluttidIndex = parseInt(document.getElementById("tjeneste-sluttid").value,10);
  let varighet = sluttidIndex - tidIndex;
  if (!bistand || !vaktkode || varighet<1) return;
  let repeterId = valgtGjentaID || "rep" + Math.random().toString(36).substring(2,10);
  valgteDager.forEach(dag => {
    let pd = hentPlanData(valgtPlan.avdeling, dag, valgtPlan.periode);
    let tider = genererTider(
      pd.tider?.[valgtPlan.periode]?.startTid || "08:00",
      pd.tider?.[valgtPlan.periode]?.sluttTid || "15:00",
      pd.tider?.[valgtPlan.periode]?.intervall || 30
    );
    let key = `${tider[tidIndex]}_${brukerid}`;
    Object.keys(pd.tjenester).forEach(k => {
      let tj = pd.tjenester[k];
      if (tj && tj.repeterId === repeterId) delete pd.tjenester[k];
    });
    let konflikt = false;
    for (let j = tidIndex; j < sluttidIndex; ++j) {
      let k = `${tider[j]}_${brukerid}`;
      if (pd.tjenester[k] && pd.tjenester[k].repeterId !== repeterId) konflikt = true;
    }
    if (konflikt) {
      alert(`Konflikt: Denne brukeren har allerede en tjeneste i det tidsrommet på ${dag}.`);
      return;
    }
    for (let j = tidIndex; j < sluttidIndex; ++j) {
      let k = `${tider[j]}_${brukerid}`;
      pd.tjenester[k] = {
        bistand: j === tidIndex ? bistand : "",
        vaktkode,
        varighet,
        starttidIndex: tidIndex,
        sluttidIndex,
        brukerid,
        repeterId
      };
      console.log("Lagre tjeneste:", pd.tjenester[k]);
    }
    
  });
  lukkModal("tjeneste-modal");
  byggRutenett();
  byggVaktkodeOversikt();
};

// ===== Ekstra bistand (Påminnelse/Oppfølging) =====
document.getElementById("legg-til-tjeneste").onclick = () => {
  fyllBrukerSelect("ekstra-bruker");
  fyllVaktkodeSelect("ekstra-vaktkode");
  document.getElementById("ekstra-bruker").value = hentPlanData().brukere[0]?.id || "";
  document.getElementById("ekstra-bistand").value = "";
  document.getElementById("ekstra-type").value = "Påminnelse";
  document.getElementById("ekstra-tid").value = "";
  oppdaterEkstraFelter();
  åpneModal("ekstra-modal");
  document.getElementById("ekstra-save").onclick = vanligLagreEkstra;
};
document.getElementById("ekstra-type").onchange = oppdaterEkstraFelter;
function oppdaterEkstraFelter() {
  const type = document.getElementById("ekstra-type").value;
  document.getElementById("ekstra-tid-container").style.display =
    (type === "Påminnelse") ? "block" : "none";
}
document.getElementById("ekstra-cancel").onclick = () => lukkModal("ekstra-modal");
function vanligLagreEkstra() {
  const d = hentPlanData();
  const brukerid = document.getElementById("ekstra-bruker").value;
  const bistand = document.getElementById("ekstra-bistand").value.trim();
  const vaktkode = document.getElementById("ekstra-vaktkode").value;
  const type = document.getElementById("ekstra-type").value;
  const tid = document.getElementById("ekstra-tid").value;
  if (!brukerid || !bistand || !vaktkode) return;
  if (type === "Påminnelse" && !tid) return;
  d.ekstra.push({ brukerid, bistand, vaktkode, type, tid });
  lukkModal("ekstra-modal");
  byggVaktkodeOversikt();
  document.getElementById("ekstra-save").onclick = vanligLagreEkstra;
}
document.getElementById("ekstra-save").onclick = vanligLagreEkstra;
function redigerEkstraBistand(indeks) {
  const d = hentPlanData();
  const oppg = d.ekstra[indeks];
  fyllBrukerSelect("ekstra-bruker");
  fyllVaktkodeSelect("ekstra-vaktkode");
  document.getElementById("ekstra-bruker").value = oppg.brukerid;
  document.getElementById("ekstra-bistand").value = oppg.bistand;
  document.getElementById("ekstra-type").value = oppg.type;
  document.getElementById("ekstra-tid").value = oppg.tid || "";
  oppdaterEkstraFelter();
  åpneModal("ekstra-modal");
  document.getElementById("ekstra-save").onclick = () => {
    const brukerid = document.getElementById("ekstra-bruker").value;
    const bistand = document.getElementById("ekstra-bistand").value.trim();
    const vaktkode = document.getElementById("ekstra-vaktkode").value;
    const type = document.getElementById("ekstra-type").value;
    const tid = document.getElementById("ekstra-tid").value;
    if (!brukerid || !bistand || !vaktkode) return;
    if (type === "Påminnelse" && !tid) return;
    d.ekstra[indeks] = { brukerid, bistand, vaktkode, type, tid };
    lukkModal("ekstra-modal");
    byggVaktkodeOversikt();
    document.getElementById("ekstra-save").onclick = vanligLagreEkstra;
  };
}

// ===== Vaktkode-oversikt =====
function byggVaktkodeOversikt() {
  const d = hentPlanData();
  const oversikt = {};
  Object.entries(d.tjenester).forEach(([key, val]) => {
    if (!oversikt[val.vaktkode]) oversikt[val.vaktkode] = [];
    const [tid, brukerid] = key.split("_");
    if (!val.bistand) return;
    oversikt[val.vaktkode].push({
      tid, bruker: brukerid, bistand: val.bistand, sortorder: 1
    });
  });
  d.ekstra.forEach((oppg, idx) => {
    if (!oversikt[oppg.vaktkode]) oversikt[oppg.vaktkode] = [];
    let obj = {
      bruker: oppg.brukerid,
      bistand: oppg.bistand,
      ekstraIndeks: idx
    };
    if (oppg.type === "Påminnelse") {
      obj.tid = oppg.tid;
      obj.format = "italic";
      obj.sortorder = 2;
    } else if (oppg.type === "Oppfølging") {
      obj.tid = "99:99";
      obj.format = "bold";
      obj.sortorder = 99;
    }
    oversikt[oppg.vaktkode].push(obj);
  });

  const div = document.getElementById("vaktkode-oversikt");
  div.innerHTML = "<h2>Vaktkodeoversikt</h2>";
  d.vaktkoder.forEach(vk => {
    if (!oversikt[vk.kode]) return;
    const h = document.createElement("h3");
    h.className = `vaktkode-h3 ${vk.kode}`;
    h.textContent = `${vk.kode}`;
    div.appendChild(h);
    oversikt[vk.kode]
      .sort((a, b) =>
        a.sortorder - b.sortorder ||
        a.tid.localeCompare(b.tid)
      )
      .forEach(el => {
        const p = document.createElement("p");
        let brukertext = el.bruker ? `<i>${el.bruker}</i>: ` : "";
        let tidtext = (el.tid && el.tid !== "99:99") ? `<b>${el.tid}</b> – ` : "";
        if (el.format === "bold") {
          p.innerHTML = `${brukertext}<strong>${el.bistand}</strong>`;
        } else if (el.format === "italic") {
          p.innerHTML = `${tidtext}${brukertext}<em>${el.bistand}</em>`;
        } else {
          p.innerHTML = `${tidtext}${brukertext}${el.bistand}`;
        }
        if (el.ekstraIndeks !== undefined) {
          const endreBtn = document.createElement("button");
          endreBtn.textContent = "✏️";
          endreBtn.title = "Endre";
          endreBtn.className = "no-print";
          endreBtn.onclick = () => {
            redigerEkstraBistand(el.ekstraIndeks);
          };
          p.appendChild(endreBtn);
          const slettBtn = document.createElement("button");
          slettBtn.textContent = "❌";
          slettBtn.title = "Slett";
          slettBtn.className = "no-print";
          slettBtn.onclick = () => {
            d.ekstra.splice(el.ekstraIndeks, 1);
            byggVaktkodeOversikt();
          };
          p.appendChild(slettBtn);
        }
        div.appendChild(p);
      });
  });
}
byggVaktkodeOversikt();

function fyllBrukerSelect(id) {
  const d = hentPlanData();
  const sel = document.getElementById(id);
  sel.innerHTML = "";
  d.brukere.forEach(b => {
    const o = document.createElement("option");
    o.value = b.id;
    o.textContent = b.id;
    sel.appendChild(o);
  });
}
function fyllVaktkodeSelect(id, valgt = "") {
  const d = hentPlanData();
  const sel = document.getElementById(id);
  sel.innerHTML = "";
  d.vaktkoder.forEach(vk => {
    const o = document.createElement("option");
    o.value = vk.kode;
    o.textContent = vk.kode;
    if (vk.kode === valgt) o.selected = true;
    sel.appendChild(o);
  });
}

document.getElementById("legg-til-vaktkode").onclick = () => {
  document.getElementById("ny-vaktkode-input").value = "";
  byggVaktkodeAdmin();
  åpneModal("vaktkode-modal");
};
document.getElementById("vaktkode-modal-cancel").onclick = () => lukkModal("vaktkode-modal");

document.getElementById("ny-vaktkode-save").onclick = () => {
  const kode = document.getElementById("ny-vaktkode-input").value.trim();
  if (!kode) return;
  let eksisterer = false;
  ["mandag","tirsdag","onsdag","torsdag","fredag","lørdag","søndag"].forEach(ukedag => {
    let pd = hentPlanData(valgtPlan.avdeling, ukedag, valgtPlan.periode);
    if (pd.vaktkoder.some(vk => vk.kode === kode)) eksisterer = true;
  });
  if (eksisterer) {
    alert("Denne vaktkoden finnes allerede på én av dagene.");
    return;
  }
  const farge = randomNiceColor();
  ["mandag","tirsdag","onsdag","torsdag","fredag","lørdag","søndag"].forEach(ukedag => {
    let pd = hentPlanData(valgtPlan.avdeling, ukedag, valgtPlan.periode);
    pd.vaktkoder.push({
      kode: kode,
      navn: kode,
      farge: farge
    });
  });
  lagVaktkodeCSS();
  byggVaktkodeAdmin();
  byggRutenett();
  byggVaktkodeOversikt();
  document.getElementById("ny-vaktkode-input").value = "";
};
function byggVaktkodeAdmin() {
  const d = hentPlanData();
  const adminDiv = document.getElementById("vaktkode-admin");
  adminDiv.innerHTML = "";
  d.vaktkoder.forEach((vk, idx) => {
    const wrapper = document.createElement("div");
    wrapper.style.display = "flex";
    wrapper.style.alignItems = "center";
    wrapper.style.gap = "0.5em";
    wrapper.style.marginBottom = "0.5em";

    const kodeInput = document.createElement("input");
    kodeInput.type = "text";
    kodeInput.value = vk.kode;
    kodeInput.style.width = "4em";
    kodeInput.title = "Vaktkode";
    kodeInput.onchange = e => {
      const newKode = e.target.value.trim();
      if (!newKode) return;
      let finnes = false;
      ["mandag","tirsdag","onsdag","torsdag","fredag","lørdag","søndag"].forEach(ukedag => {
        let pd = hentPlanData(valgtPlan.avdeling, ukedag, valgtPlan.periode);
        if (pd.vaktkoder.some((k, i2) => k.kode === newKode && i2 !== idx)) finnes = true;
      });
      if (finnes) {
        alert("Vaktkode må være unik på tvers av alle dager!");
        kodeInput.value = vk.kode;
        return;
      }
      const oldKode = vk.kode;
      ["mandag","tirsdag","onsdag","torsdag","fredag","lørdag","søndag"].forEach(ukedag => {
        let pd = hentPlanData(valgtPlan.avdeling, ukedag, valgtPlan.periode);
        let vkObj = pd.vaktkoder.find(k => k.kode === oldKode);
        if (vkObj) {
          vkObj.kode = newKode;
          vkObj.navn = newKode;
        }
        Object.values(pd.tjenester).forEach(tj => {
          if (tj.vaktkode === oldKode) tj.vaktkode = newKode;
        });
        pd.ekstra.forEach(e => {
          if (e.vaktkode === oldKode) e.vaktkode = newKode;
        });
      });
      lagVaktkodeCSS();
      byggVaktkodeAdmin();
      byggRutenett();
      byggVaktkodeOversikt();
    };

    const colorInput = document.createElement("input");
    colorInput.type = "color";
    colorInput.value = hexFromColorName(vk.farge) || vk.farge;
    colorInput.title = "Velg farge";
    colorInput.onchange = e => {
      vk.farge = e.target.value;
      lagVaktkodeCSS();
      byggRutenett();
      byggVaktkodeOversikt();
      byggVaktkodeAdmin();
    };

    const slettBtn = document.createElement("button");
    slettBtn.textContent = "Slett";
    slettBtn.title = "Slett denne vaktkoden";
    slettBtn.disabled = d.vaktkoder.length === 1;
    slettBtn.onclick = () => {
      if (confirm("Er du sikker på at du vil slette denne vaktkoden?")) {
        const kodeSomSlettes = vk.kode;
        d.vaktkoder.splice(idx, 1);
        Object.keys(d.tjenester).forEach(key => {
          if (d.tjenester[key].vaktkode === kodeSomSlettes) delete d.tjenester[key];
        });
        d.ekstra = d.ekstra.filter(e => e.vaktkode !== kodeSomSlettes);
        lagVaktkodeCSS();
        byggVaktkodeAdmin();
        byggRutenett();
        byggVaktkodeOversikt();
      }
    };

    const vis = document.createElement("span");
    vis.style.background = vk.farge;
    vis.style.padding = "0.3em 1em";
    vis.style.borderRadius = "0.5em";
    vis.style.border = "1px solid #bbb";
    vis.style.fontWeight = "bold";
    vis.textContent = vk.kode;

    wrapper.appendChild(vis);
    wrapper.appendChild(kodeInput);
    wrapper.appendChild(colorInput);
    wrapper.appendChild(slettBtn);
    adminDiv.appendChild(wrapper);
  });
}

function randomNiceColor() {
  const h = Math.floor(Math.random() * 360);
  const s = 50 + Math.floor(Math.random() * 35);
  const l = 70 + Math.floor(Math.random() * 15);
  return `hsl(${h}, ${s}%, ${l}%)`;
}
function hexFromColorName(color) {
  const ctx = document.createElement('canvas').getContext('2d');
  ctx.fillStyle = color;
  return ctx.fillStyle.match(/^#[0-9a-f]{6}$/i) ? ctx.fillStyle : "#cccccc";
}

document.getElementById("legg-til-bruker").onclick = () => {
  document.getElementById("ny-bruker-input").value = "";
  byggBrukerAdmin();
  åpneModal("bruker-modal");
};
document.getElementById("bruker-modal-cancel").onclick = () => lukkModal("bruker-modal");

document.getElementById("ny-bruker-save").onclick = () => {
  const d = hentPlanData();
  const id = document.getElementById("ny-bruker-input").value.trim();
  if (!id) return;
  if (d.brukere.some(b => b.id === id)) {
    alert("Denne bruker-IDen finnes allerede.");
    return;
  }
  ["mandag","tirsdag","onsdag","torsdag","fredag","lørdag","søndag"].forEach(ukedag => {
    let pd = hentPlanData(valgtPlan.avdeling, ukedag, valgtPlan.periode);
    if (!pd.brukere.some(b => b.id === id)) {
      pd.brukere.push({ id: id, vis: true });
    }
  });
  byggBrukerAdmin();
  byggRutenett();
  byggVaktkodeOversikt();
  document.getElementById("ny-bruker-input").value = "";
};

function byggBrukerAdmin() {
  const d = hentPlanData();
  const adminDiv = document.getElementById("bruker-admin");
  adminDiv.innerHTML = "";
  d.brukere.forEach((b, idx) => {
    const wrapper = document.createElement("div");
    wrapper.style.display = "flex";
    wrapper.style.alignItems = "center";
    wrapper.style.gap = "0.5em";
    wrapper.style.marginBottom = "0.5em";

    const idInput = document.createElement("input");
    idInput.type = "text";
    idInput.value = b.id;
    idInput.style.width = "7em";
    idInput.title = "Bruker-ID";
    idInput.onchange = e => {
      const newId = e.target.value.trim();
      if (!newId) return;
      if (d.brukere.some((u, i) => u.id === newId && i !== idx)) {
        alert("Bruker-ID må være unik!");
        idInput.value = b.id;
        return;
      }
      const oldId = b.id;
      b.id = newId;
      Object.keys(d.tjenester).forEach(key => {
        if (key.endsWith("_" + oldId)) {
          const newKey = key.replace("_" + oldId, "_" + newId);
          d.tjenester[newKey] = d.tjenester[key];
          delete d.tjenester[key];
        }
      });
      d.ekstra.forEach(e => {
        if (e.brukerid === oldId) e.brukerid = newId;
      });
      byggBrukerAdmin();
      byggRutenett();
      byggVaktkodeOversikt();
    };

    const visSelect = document.createElement("select");
    ["Ja", "Nei"].forEach(val => {
      const opt = document.createElement("option");
      opt.value = val;
      opt.textContent = val;
      visSelect.appendChild(opt);
    });
    visSelect.value = (b.vis === false) ? "Nei" : "Ja";
    visSelect.onchange = e => {
      b.vis = (e.target.value === "Ja");
      byggBrukerAdmin();
      byggRutenett();
      byggVaktkodeOversikt();
    };

    const slettBtn = document.createElement("button");
    slettBtn.textContent = "Slett";
    slettBtn.title = "Slett denne brukeren";
    slettBtn.disabled = d.brukere.length === 1;
    slettBtn.onclick = () => {
      if (confirm("Er du sikker på at du vil slette denne brukeren på alle dager i denne avdelingen?")) {
        const brukerId = b.id;
        ["mandag","tirsdag","onsdag","torsdag","fredag","lørdag","søndag"].forEach(ukedag => {
          let pd = hentPlanData(valgtPlan.avdeling, ukedag, valgtPlan.periode);
          pd.brukere = pd.brukere.filter(u => u.id !== brukerId);
          Object.keys(pd.tjenester).forEach(key => {
            if (key.endsWith("_" + brukerId)) delete pd.tjenester[key];
          });
          pd.ekstra = pd.ekstra.filter(e => e.brukerid !== brukerId);
        });
        byggBrukerAdmin();
        byggRutenett();
        byggVaktkodeOversikt();
      }
    };

    wrapper.appendChild(idInput);
    wrapper.appendChild(document.createTextNode(" | Vis i rutenett:"));
    wrapper.appendChild(visSelect);
    wrapper.appendChild(slettBtn);
    adminDiv.appendChild(wrapper);
  });
}

// =========== EKSPORT/IMPORT ===========
function eksporterPlan() {
  const data = JSON.stringify({ avdelinger, planData }, null, 2);
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const dato = `${yyyy}${mm}${dd}`;
  const filnavn = `digitalflipp${dato}.json`;

  const blob = new Blob([data], {type: "application/json"});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filnavn;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function importerPlanFraFil(fil) {
  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const json = JSON.parse(e.target.result);
      if (json.planData && json.avdelinger) {
        planData = json.planData;
        avdelinger = json.avdelinger;
      } else {
        planData = json;
        avdelinger = [...new Set(Object.keys(planData).map(key => key.split("_")[0]))];
      }
      lagVaktkodeCSS();
      byggRutenett();
      byggVaktkodeOversikt();
      alert("Plan importert!");
    } catch (err) {
      alert("Ugyldig fil.");
    }
  };
  reader.readAsText(fil);
}

// Init
lagVaktkodeCSS();
byggRutenett();
byggVaktkodeOversikt();
