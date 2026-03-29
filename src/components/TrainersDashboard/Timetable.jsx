import React, { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";
import { auth, db } from "../../firebase";
import { onAuthStateChanged } from "firebase/auth";

export default function ClassTime() {
  const [viewMode, setViewMode] = useState("weekly");
  const [schedule, setSchedule] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [students, setStudents] = useState([]);
  const [allStudents, setAllStudents] = useState([]); // all students of this trainer
  const [trainerUid, setTrainerUid] = useState("");

  const [form, setForm] = useState({
    day: "",
    time: "09:00",
    category: "",
    session: "",
    trainerName: "",
    students: [],
  });

  const weeklyDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const monthlyDays = Array.from({ length: 31 }, (_, i) => i + 1);
  const yearlyMonths = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const times = [
    "09:00",
    "10:00",
    "11:00",
    "12:00",
    "13:00",
    "14:00",
    "15:00",
    "16:00",
    "17:00",
  ];
  const columns =
    viewMode === "weekly"
      ? weeklyDays
      : viewMode === "monthly"
        ? monthlyDays
        : yearlyMonths;

  /* ---------------- AUTH & FETCH STUDENTS ---------------- */
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setTrainerUid(user.uid);
        // fetch students for this trainer
        const trainerDoc = await getDocs(collection(db, "trainers"));
        const thisTrainerDoc = trainerDoc.docs.find((d) => d.id === user.uid);
        if (thisTrainerDoc) {
          const studentUids = thisTrainerDoc.data().students || [];
          if (studentUids.length > 0) {
            const studentData = await Promise.all(
              studentUids.map(async (sid) => {
                const studentDoc = await getDocs(
                  collection(db, "trainerstudents"),
                );
                const studentInfo = studentDoc.docs.find((s) => s.id === sid);
                return studentInfo
                  ? { id: studentInfo.id, ...studentInfo.data() }
                  : null;
              }),
            );
            setAllStudents(studentData.filter(Boolean));
            setStudents(studentData.filter(Boolean)); // default show all students
          }
        }
      }
    });
    return () => unsub();
  }, []);

  /* ---------------- FETCH SCHEDULE ---------------- */
  useEffect(() => {
    if (!trainerUid) return;
    const loadSchedule = async () => {
      const snap = await getDocs(
        collection(db, "trainers", trainerUid, "timetables"),
      );
      setSchedule(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    };
    loadSchedule();
  }, [trainerUid, viewMode]);

  /* ---------------- HANDLE SESSION CHANGE ---------------- */
  const handleSessionChange = (session) => {
    setForm((f) => ({ ...f, session, students: [] }));
    setStudents(allStudents.filter((s) => s.sessions === session));
  };

  /* ---------------- SAVE CLASS ---------------- */
  const saveClass = async () => {
    if (
      !form.category ||
      !form.trainerName ||
      !form.session ||
      form.students.length === 0 ||
      !form.day
    ) {
      return alert("Please fill all fields");
    }

    // check conflicts
    const batchConflict = schedule.find(
      (s) =>
        s.viewMode === viewMode &&
        s.day === form.day &&
        s.time === form.time &&
        s.session === form.session &&
        s.id !== editId,
    );
    if (batchConflict)
      return alert(
        `Session ${form.session} already has a class on ${form.day} at ${form.time}`,
      );

    const payload = {
      viewMode,
      day: form.day || "", // fallback if empty
      time: form.time || "",
      category: form.category || "",
      session: form.session || "",
      trainerName: form.trainerName || "",
      students: form.students || [], // must be array, not undefined
      updatedAt: serverTimestamp(),
    };

    if (editId) {
      await updateDoc(
        doc(db, "trainers", trainerUid, "timetables", editId),
        payload,
      );
    } else {
      await addDoc(collection(db, "trainers", trainerUid, "timetables"), {
        ...payload,
        createdAt: serverTimestamp(),
      });
    }

    // reset form
    setShowModal(false);
    setEditId(null);
    setForm({
      day: "",
      time: "09:00",
      category: "",
      session: "",
      trainerName: "",
      students: [],
    });

    // refresh schedule
    const snap = await getDocs(
      collection(db, "trainers", trainerUid, "timetables"),
    );
    setSchedule(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  };

  /* ---------------- UI ---------------- */
  return (
    <div className="bg-white dark:bg-gray-900 p-6 rounded-lg min-h-screen text-black dark:text-white">
      <h2 className="text-2xl font-bold mb-2 text-orange-600">
        {viewMode === "weekly"
          ? "Weekly Timetable"
          : viewMode === "monthly"
            ? "Monthly Timetable"
            : "Yearly Timetable"}
      </h2>

      <div className="flex gap-2 mb-4">
        {["weekly", "monthly", "yearly"].map((mode) => (
          <button
            key={mode}
            onClick={() => setViewMode(mode)}
            className={`px-4 py-1 rounded ${viewMode === mode ? "bg-orange-500 text-white" : "bg-gray-200"}`}
          >
            {mode.toUpperCase()}
          </button>
        ))}
      </div>

      <div
        className="grid"
        style={{ gridTemplateColumns: `100px repeat(${columns.length},1fr)` }}
      >
        <div></div>
        {columns.map((d) => (
          <div
            key={d}
            className="text-center font-semibold bg-orange-100 dark:bg-gray-700 py-2"
          >
            {d}
          </div>
        ))}

        {times.map((time) => (
          <React.Fragment key={time}>
            <div className="bg-orange-100 dark:bg-gray-700 p-2 font-semibold">
              {time}
            </div>
            {columns.map((day) => {
              const slots = schedule.filter(
                (s) =>
                  s.viewMode === viewMode && s.day === day && s.time === time,
              );
              return (
                <div
                  key={day + time}
                  className="border p-2 min-h-[70px] space-y-1 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
                  onClick={() => {
                    setShowModal(true);
                    setForm({
                      day,
                      time,
                      category: "",
                      session: "",
                      trainerName: "",
                      students: [],
                    });
                  }}
                >
                  {slots.map((s) => (
                    <div
                      key={s.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditId(s.id);
                        setForm({ ...s });
                        setShowModal(true);
                      }}
                      className="bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded text-xs"
                    >
                      <div className="font-semibold">{s.category}</div>
                      <div className="text-gray-600 dark:text-gray-300">
                        {s.session} Session • {s.trainerName}
                      </div>
                    </div>
                  ))}
                </div>
              );
            })}
          </React.Fragment>
        ))}
      </div>

      {/* MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
          <div className="bg-white dark:bg-gray-800 p-6 rounded w-[360px] space-y-3">
            <h3 className="text-lg font-bold">
              {editId ? "Edit Class" : "Add Class"}
            </h3>
            <input
              className="w-full border p-2 bg-transparent"
              placeholder="Category"
              value={form.category}
              onChange={(e) => {
                let value = e.target.value.replace(/[^A-Za-z\s]/g, "");

                // ✅ Capitalize each word
                value = value.replace(/\b[a-z]/g, (char) => char.toUpperCase());

                setForm({ ...form, category: value });
              }}
            />
            <input
              className="w-full border p-2 bg-transparent"
              placeholder="Trainer Name"
              value={form.trainerName}
              onChange={(e) => {
                let value = e.target.value.replace(/[^A-Za-z\s]/g, "");

                // ✅ Capitalize each word
                value = value.replace(/\b[a-z]/g, (char) => char.toUpperCase());

                setForm({ ...form, trainerName: value });
              }}
            />
            <select
              className="w-full border p-2 bg-transparent"
              value={form.session}
              onChange={(e) => handleSessionChange(e.target.value)}
            >
              <option value="">Sessions</option>
              <option>Morning</option>
              <option>Afternoon</option>
              <option>Evening</option>
            </select>
            <select
              multiple
              className="w-full border p-2 h-28 bg-transparent"
              value={form.students} // <- array of selected student IDs
              onChange={(e) =>
                setForm({
                  ...form,
                  students: Array.from(e.target.selectedOptions).map(
                    (o) => o.value,
                  ), // only IDs
                })
              }
            >
              {[...students]
                .sort((a, b) => a.firstName.localeCompare(b.firstName)) // ✅ SORT HERE
                .map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.firstName}
                  </option>
                ))}
            </select>
            <button
              onClick={saveClass}
              className="bg-green-600 text-white w-full py-2 rounded"
            >
              {editId ? "Update Class" : "Save Class"}
            </button>
            <button
              onClick={() => setShowModal(false)}
              className="w-full text-sm mt-1"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}