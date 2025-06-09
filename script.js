// script.js

const brukere = ["1111", "1112", "1113", "1114", "1115", "1116", "1117", "1118", "1119", "1120", "1121"];
const tider = ["08:00", "08:30", "09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "12:00", "12:30", "13:00", "13:30", "14:00", "14:30"];
const vaktkoder = ["D1", "D2", "D3", "D4", "Deleger"];
const ekstraOppgaver = [];

const rutenett = document.getElementById("rutenett");

// --------- LAG RUTENETT ----------
const headRad = document.createElement("tr");
const tomtHode = document.createElement("th");
headRad.appendChild(tomtHode);
brukere.forEach(bruker => {
  const celle = document.createElement("th");
  celle.textContent = bruker;
  headRad.appendChild(celle);
});
rutenett.appendChild(headRad);

tider.forEach(tid => {
  const rad = document.createElement("tr");
  const tidCelle = document.createElement("td");
  tidCelle.textContent = tid;
  rad.appendChild(tidCelle);
  brukere.forEach(() => {
    const celle = document.createElement("td");
    celle.classList.add("rute");
    rad.appendChild(celle);
  });
  rutenett.appendChild(rad);
});

// --------- MODAL FOR TIDSPLAN ---------
let valgtCelle = null;

document.querySelectorAll(".rute").forEach(celle => {
  celle.addEventListener("click", () => {
    valgtCelle = celle;
    const rad = celle.parentElement;
    const tid = rad.firstElementChild.textContent;
    const kolIndex = [...rad.children].indexOf(celle);
    const bruker = brukere[kolIndex - 1];

    document.getElementById("modal-info").textContent = `Redigerer: ${bruker} - ${tid}`;

    celle.classList.add("aktiv");
    document.getElementById("modal-bistand").value = celle.querySelector(".bistand")?.textContent || "";
    document.getElementById("modal-vaktkode").value = celle.querySelector(".vaktkode")?.textContent || "D1";
    document.getElementById("modal").style.display = "flex";
  });
});

document.getElementById("modal-cancel").addEventListener("click", () => {
  document.getElementById("modal").style.display = "none";
  valgtCelle?.classList.remove("aktiv");
  valgtCelle = null;
});

document.getElementById("modal-delete").addEventListener("click", () => {
  valgtCelle.innerHTML = "";
  valgtCelle.className = "rute";
  document.getElementById("modal").style.display = "none";
  valgtCelle?.classList.remove("aktiv");
  valgtCelle = null;
  genererVaktkodeOversikt();
});

document.getElementById("modal-save").addEventListener("click", () => {
  const bistand = document.getElementById("modal-bistand").value;
  const vaktkode = document.getElementById("modal-vaktkode").value;
  if (!bistand || !vaktkode) return;

  valgtCelle.innerHTML = `<div class="bistand">${bistand}</div><div class="vaktkode">${vaktkode}</div>`;
  valgtCelle.className = `rute ${vaktkode}`;
  document.getElementById("modal").style.display = "none";
  valgtCelle?.classList.remove("aktiv");
  valgtCelle = null;
  genererVaktkodeOversikt();
});

// --------- GENERER VAKTKODEOVERSIKT ---------
function genererVaktkodeOversikt() {
  const oversikt = {};
  const rader = rutenett.querySelectorAll("tr");

  rader.forEach((rad, radIndex) => {
    if (radIndex === 0) return;
    const tid = rad.children[0].textContent;
    for (let i = 1; i < rad.children.length; i++) {
      const celle = rad.children[i];
      const bistand = celle.querySelector(".bistand")?.textContent;
      const vaktkode = celle.querySelector(".vaktkode")?.textContent;
      const bruker = brukere[i - 1];

      if (bistand && vaktkode) {
        if (!oversikt[vaktkode]) oversikt[vaktkode] = [];
        oversikt[vaktkode].push({ tid, bruker, bistand });
      }
    }
  });

  ekstraOppgaver.forEach(oppgave => {
    const { id, bistand, type, klokkeslett, vaktkode } = oppgave;
    if (!oversikt[vaktkode]) oversikt[vaktkode] = [];
    const isOppf = type === "Oppfølging";
    const visBistand = isOppf ? `Oppfølging - ${id} - ${bistand || "Ved behov"}` : bistand;
    oversikt[vaktkode].push({
      tid: isOppf ? "99:99" : klokkeslett,
      bruker: isOppf ? "" : id,
      bistand: visBistand,
      original: oppgave,
      format: isOppf ? "bold" : "italic"
    });
  });

  const oversiktDiv = document.getElementById("vaktkode-oversikt");
  oversiktDiv.innerHTML = "";

  Object.entries(oversikt).forEach(([kode, oppgaver]) => {
    const seksjon = document.createElement("div");
    seksjon.innerHTML = `<h3 class="${kode}">${kode}</h3>`;
    oppgaver
      .sort((a, b) => a.tid.localeCompare(b.tid))
      .forEach(item => {
        const linje = document.createElement("p");
        linje.innerHTML = `${item.tid && item.tid !== "99:99" ? item.tid + " - " : ""}${item.bruker ? item.bruker + " - " : ""}${item.format === "bold" ? `<strong>${item.bistand}</strong>` : item.format === "italic" ? `<em>${item.bistand}</em>` : item.bistand}`;
        if (item.original) {
          const redigerBtn = document.createElement("button");
          redigerBtn.textContent = "✏️";
          redigerBtn.onclick = () => redigerEkstraOppgave(item.original);
          redigerBtn.classList.add("no-print");

          const slettBtn = document.createElement("button");
          slettBtn.textContent = "❌";
          slettBtn.onclick = () => slettEkstraOppgave(item.original);
          slettBtn.classList.add("no-print");

          linje.appendChild(redigerBtn);
          linje.appendChild(slettBtn);
        }
        seksjon.appendChild(linje);
      });
    oversiktDiv.appendChild(seksjon);
  });
}

// --------- EKSTRA MODAL-FUNKSJONER ---------
function visEkstraModal() {
  document.getElementById("ekstra-modal").style.display = "flex";
}

function lukkEkstraModal() {
  document.getElementById("ekstra-modal").style.display = "none";
  document.getElementById("ekstra-id").value = "";
  document.getElementById("ekstra-bistand").value = "";
  document.getElementById("ekstra-type").value = "Påminnelse";
  document.getElementById("ekstra-klokkeslett").value = "";
  document.getElementById("ekstra-vaktkode").value = "D1";
  oppdaterFelter();
}

function oppdaterFelter() {
  const type = document.getElementById("ekstra-type").value;
  const klokkeslettLabel = document.getElementById("ekstra-klokkeslett-label");
  const klokkeslettInput = document.getElementById("ekstra-klokkeslett");
  if (type === "Påminnelse") {
    klokkeslettLabel.style.display = "block";
    klokkeslettInput.style.display = "block";
  } else {
    klokkeslettLabel.style.display = "none";
    klokkeslettInput.style.display = "none";
  }
}

function lagreEkstra() {
  const id = document.getElementById("ekstra-id").value.trim();
  const bistand = document.getElementById("ekstra-bistand").value.trim();
  const type = document.getElementById("ekstra-type").value;
  const klokkeslett = document.getElementById("ekstra-klokkeslett").value;
  const vaktkode = document.getElementById("ekstra-vaktkode").value;
  if (!id || !vaktkode) return;
  if (type === "Påminnelse" && !klokkeslett) return;
  ekstraOppgaver.push({ id, bistand, type, klokkeslett, vaktkode });
  lukkEkstraModal();
  genererVaktkodeOversikt();
}

function redigerEkstraOppgave(oppgave) {
  document.getElementById("ekstra-id").value = oppgave.id;
  document.getElementById("ekstra-bistand").value = oppgave.bistand;
  document.getElementById("ekstra-type").value = oppgave.type;
  document.getElementById("ekstra-klokkeslett").value = oppgave.klokkeslett || "";
  document.getElementById("ekstra-vaktkode").value = oppgave.vaktkode;
  oppdaterFelter();
  visEkstraModal();
  ekstraOppgaver.splice(ekstraOppgaver.indexOf(oppgave), 1);
}

function slettEkstraOppgave(oppgave) {
  const index = ekstraOppgaver.indexOf(oppgave);
  if (index > -1) {
    ekstraOppgaver.splice(index, 1);
    genererVaktkodeOversikt();
  }
}
