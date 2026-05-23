import { useState, useEffect } from "react";

/* ---------------- DATE HELPERS ---------------- */

function formatDate(dateStr) {
  if (!dateStr) return "";

  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d);

  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "2-digit"
  });
}

/* ---------------- DATA ---------------- */

function emptyDay() {
  return {
    clockIn: "",
    clockOut: "",
    type: "regular",
    hours: 0,
    date: ""
  };
}

function createWeek(startDate = "") {
  return Array(7).fill(null).map((_, i) => ({
    ...emptyDay(),
    date: startDate
  }));
}

function createPeriod() {
  return {
    id: Date.now(),
    startDate: "",
    endDate: "",
    rate: 25,
    shiftDiffRate: 2,
    week1: createWeek(),
    week2: createWeek()
  };
}

/* ---------------- HOURS ---------------- */

function getHours(day) {
  if (!day.clockIn || !day.clockOut) return 0;

  const [inH, inM] = day.clockIn.split(":").map(Number);
  const [outH, outM] = day.clockOut.split(":").map(Number);

  let start = inH + inM / 60;
  let end = outH + outM / 60;

  if (end < start) end += 24;

  return end - start;
}

function recalcWeek(week) {
  return week.map((d) => ({
    ...d,
    hours: getHours(d)
  }));
}

/* ---------------- PAY ENGINE ---------------- */

function calculateWeek(week, rate, shiftDiff) {
  let total = 0;
  let hours = 0;

  week.forEach((d) => {
    if (!d.hours) return;

    hours += d.hours;

    let base = rate + shiftDiff;

    let multiplier = 1;
    if (d.type === "sunday") multiplier = 2;
    if (d.type === "holiday") multiplier = 2;

    const isOT = hours > 40;

    const payRate = isOT ? rate * 1.5 + shiftDiff : base;

    total += d.hours * payRate * multiplier;
  });

  return { total, hours };
}

/* ---------------- APP ---------------- */

export default function App() {
  const [periods, setPeriods] = useState(() => {
    const saved = localStorage.getItem("payPeriods");
    return saved ? JSON.parse(saved) : [createPeriod()];
  });

  const [active, setActive] = useState(0);
  const [activeWeek, setActiveWeek] = useState(1);

  useEffect(() => {
    localStorage.setItem("payPeriods", JSON.stringify(periods));
  }, [periods]);

  const current = periods[active];
  const weekKey = activeWeek === 1 ? "week1" : "week2";
  const week = current[weekKey];

  function updateDay(i, field, value) {
    const copy = [...periods];
    copy[active][weekKey][i][field] = value;
    copy[active][weekKey] = recalcWeek(copy[active][weekKey]);
    setPeriods(copy);
  }

  function updateField(field, value) {
    const copy = [...periods];
    copy[active][field] = value;
    setPeriods(copy);
  }

  const w1 = calculateWeek(current.week1, current.rate, current.shiftDiffRate);
  const w2 = calculateWeek(current.week2, current.rate, current.shiftDiffRate);

  const activeData = activeWeek === 1 ? w1 : w2;
  const totalPay = w1.total + w2.total;
  const totalHours = w1.hours + w2.hours;

  /* ---------------- STYLES ---------------- */

  const styles = {
    page: {
      background: "#0b0f17",
      minHeight: "100vh",
      padding: 14,
      maxWidth: 520,
      margin: "0 auto",
      fontFamily: "system-ui",
      color: "#e5e7eb"
    },

    header: {
      fontSize: 22,
      fontWeight: 700,
      textAlign: "center",
      marginBottom: 14
    },

    card: {
      background: "#111827",
      borderRadius: 18,
      padding: 14,
      marginBottom: 12,
      boxShadow: "0 10px 25px rgba(0,0,0,0.25)"
    },

    input: {
      width: "100%",
      padding: 12,
      borderRadius: 12,
      border: "1px solid #1f2937",
      background: "#0b1220",
      color: "white",
      fontSize: 15,
      marginBottom: 10,
      outline: "none"
    },

    /* 🔥 FIXED FLUID ROW */
    row: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 10,
      width: "100%"
    },

    dateText: {
      flex: 1,
      minWidth: 0,        // CRITICAL: allows shrinking instead of overflow
      fontWeight: 600,
      fontSize: 14,
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis"
    },

    pill: {
      flexShrink: 0,
      padding: "4px 10px",
      borderRadius: 999,
      fontSize: 12,
      background: "#1f2937",
      color: "#9ca3af"
    },

    dayCard: {
      background: "#0f172a",
      borderRadius: 16,
      padding: 12,
      marginBottom: 10,
      border: "1px solid #1f2937"
    },

    sticky: {
      position: "sticky",
      bottom: 10,
      background: "linear-gradient(135deg,#1f2937,#111827)",
      padding: 14,
      borderRadius: 18,
      boxShadow: "0 10px 30px rgba(0,0,0,0.4)"
    },

    total: {
      fontSize: 24,
      fontWeight: 800
    },

    sub: {
      fontSize: 12,
      opacity: 0.7
    }
  };

  return (
    <div style={styles.page}>

      <div style={styles.header}>Pay Tracker</div>

      {/* PAY PERIOD */}
      <div style={styles.card}>
        <div style={styles.sub}>Pay Period</div>

        <div style={{ marginBottom: 8 }}>
          {formatDate(current.startDate)} → {formatDate(current.endDate)}
        </div>

        <input
          type="date"
          value={current.startDate}
          onChange={(e) => updateField("startDate", e.target.value)}
          style={styles.input}
        />

        <input
          type="date"
          value={current.endDate}
          onChange={(e) => updateField("endDate", e.target.value)}
          style={styles.input}
        />
      </div>

      {/* WEEK TOGGLE */}
      <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
        <button onClick={() => setActiveWeek(1)} style={{ flex: 1 }}>
          Week 1
        </button>
        <button onClick={() => setActiveWeek(2)} style={{ flex: 1 }}>
          Week 2
        </button>
      </div>

      {/* WEEK SUMMARY */}
      <div style={styles.card}>
        <div style={styles.row}>
          <div>
            <div style={styles.sub}>Hours</div>
            <div style={{ fontWeight: 700 }}>
              {activeData.hours?.toFixed(2) || 0}
            </div>
          </div>

          <div>
            <div style={styles.sub}>Pay</div>
            <div style={{ fontWeight: 700 }}>
              ${activeData.total?.toFixed(2) || 0}
            </div>
          </div>
        </div>
      </div>

      {/* DAYS */}
      {week.map((d, i) => (
        <div key={i} style={styles.dayCard}>

          {/* FLUID ROW (FIXED BUBBLE ISSUE) */}
          <div style={styles.row}>
            <div style={styles.dateText}>
              {formatDate(d.date)}
            </div>

            <div style={styles.pill}>
              {d.hours?.toFixed(2) || 0}h
            </div>
          </div>

          <input
            type="time"
            value={d.clockIn}
            onChange={(e) => updateDay(i, "clockIn", e.target.value)}
            style={styles.input}
          />

          <input
            type="time"
            value={d.clockOut}
            onChange={(e) => updateDay(i, "clockOut", e.target.value)}
            style={styles.input}
          />

          <select
            value={d.type}
            onChange={(e) => updateDay(i, "type", e.target.value)}
            style={styles.input}
          >
            <option value="regular">Regular</option>
            <option value="sunday">Sunday</option>
            <option value="holiday">Holiday</option>
          </select>

        </div>
      ))}

      {/* TOTAL */}
      <div style={styles.sticky}>
        <div style={styles.sub}>
          Total Hours: {totalHours.toFixed(2)}
        </div>

        <div style={styles.total}>
          ${totalPay.toFixed(2)}
        </div>
      </div>

    </div>
  );
}