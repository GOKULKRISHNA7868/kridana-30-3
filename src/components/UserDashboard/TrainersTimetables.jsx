import React, { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  query,
  where,
  doc,
  getDoc,
} from "firebase/firestore";
import { auth, db } from "../../firebase";
import { onAuthStateChanged } from "firebase/auth";
import dayjs from "dayjs";
import { useSelectedStudent } from "../../context/SelectedStudentContext";
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

export default function StudentTimetable() {
  const [user, setUser] = useState(null);
  const [studentProfile, setStudentProfile] = useState(null);
  const [classes, setClasses] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [viewMode, setViewMode] = useState("weekly");
  const { selectedStudentUid } = useSelectedStudent();
  const today = dayjs();
  const studentUid = selectedStudentUid || user?.uid;
  /* ---------------- AUTH ---------------- */
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) return;
      setUser(u);

      console.log("[Student] Logged in UID:", u.uid);

      const sRef = doc(db, "students", u.uid);
      const sSnap = await getDoc(sRef);
      if (sSnap.exists()) {
        setStudentProfile(sSnap.data());
      }
    });

    return () => unsub();
  }, []);

  /* ---------------- FETCH TIMETABLE (NO INDEX, NO collectionGroup) ---------------- */
  useEffect(() => {
    if (!studentUid) return;

    const fetchTimetable = async () => {
      console.log("[StudentTimetable] Fetch timetable via trainers scan");

      let allClasses = [];

      const trainersSnap = await getDocs(collection(db, "trainers"));

      console.log("[DEBUG] Trainers found:", trainersSnap.size);

      if (trainersSnap.empty) {
        console.error("❌ No trainers found in /trainers collection");
        return;
      }

      const trainerPromises = trainersSnap.docs.map(async (trainerDoc) => {
        const trainerId = trainerDoc.id;
        console.log("[DEBUG] Scanning trainer:", trainerId);

        const ttSnap = await getDocs(
          collection(db, "trainers", trainerId, "timetables"),
        );

        console.log(`[DEBUG] Timetables for ${trainerId}:`, ttSnap.size);

        ttSnap.forEach((docu) => {
          const data = docu.data();

          if (
            Array.isArray(data.students) &&
            data.students.includes(studentUid)
          ) {
            console.log("✅ MATCH FOUND:", data);

            allClasses.push({
              id: docu.id,
              trainerId,
              ...data,
            });
          }
        });
      });

      await Promise.all(trainerPromises);

      console.log("🔥 FINAL STUDENT TIMETABLE:", allClasses);
      setClasses(allClasses);
    };

    fetchTimetable();
  }, [studentUid]);
  /* ---------------- FETCH ATTENDANCE ---------------- */
  useEffect(() => {
    if (!studentProfile?.instituteId || !user) return;

    const fetchAttendance = async () => {
      const q = query(
        collection(db, "institutes", studentProfile.instituteId, "attendance"),
        where("studentId", "==", studentUid),
      );

      const snap = await getDocs(q);
      const data = snap.docs.map((d) => d.data());
      setAttendance(data);
    };

    fetchAttendance();
  }, [studentProfile, studentUid]);

  /* ---------------- FILTERS ---------------- */
  const filteredClasses = classes.filter((c) => c.viewMode === viewMode);

  const filteredAttendance = attendance.filter((a) => {
    if (!a.date) return false;
    const d = dayjs(a.date);

    if (viewMode === "weekly") return d.isSame(today, "week");
    if (viewMode === "monthly") return d.isSame(today, "month");
    if (viewMode === "yearly") return d.isSame(today, "year");
    return true;
  });

  /* ---------------- HELPERS ---------------- */
  const getAttendance = (day, time) =>
    filteredAttendance.find((a) => a.day === day && a.time === time);

  const attendancePercent = () => {
    if (filteredAttendance.length === 0) return 0;
    const present = filteredAttendance.filter(
      (a) => a.status === "Present",
    ).length;
    return Math.round((present / filteredAttendance.length) * 100);
  };

  const columns =
    viewMode === "weekly"
      ? weeklyDays
      : viewMode === "monthly"
        ? monthlyDays
        : yearlyMonths;

  /* ---------------- UI ---------------- */
  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <h1 className="text-2xl font-bold mb-4">📅 My Timetable</h1>

      {/* MODE SELECTOR */}
      <div className="mb-4 flex gap-3">
        {["weekly", "monthly", "yearly"].map((m) => (
          <button
            key={m}
            onClick={() => setViewMode(m)}
            className={`px-4 py-2 rounded ${
              viewMode === m ? "bg-blue-600" : "bg-gray-700"
            }`}
          >
            {m.toUpperCase()}
          </button>
        ))}
      </div>

      {/* ATTENDANCE SUMMARY */}

      {/* TIMETABLE GRID */}
      <div className="overflow-x-auto">
        <div
          className="grid"
          style={{ gridTemplateColumns: `100px repeat(${columns.length},1fr)` }}
        >
          <div></div>

          {columns.map((d) => (
            <div key={d} className="text-center font-semibold bg-gray-700 py-2">
              {d}
            </div>
          ))}

          {times.map((time) => (
            <React.Fragment key={time}>
              <div className="bg-gray-700 p-2 font-semibold text-center">
                {time}
              </div>

              {columns.map((day) => {
                const cls = filteredClasses.find(
                  (c) => c.day === day && c.time === time,
                );

                const att = getAttendance(day, time);

                if (!cls) return <div key={day + time} />;

                return (
                  <div
                    key={day + time}
                    onClick={() => setSelectedClass({ cls, att })}
                    className={`cursor-pointer p-2 rounded text-sm text-center ${
                      att?.status === "Absent" ? "bg-red-700" : "bg-green-700"
                    }`}
                  >
                    <p className="font-semibold">{cls.category}</p>
                    <p className="text-xs">{cls.trainerName}</p>
                  </div>
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* MODAL */}
      {selectedClass && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center">
          <div className="bg-gray-800 p-6 rounded-xl w-96">
            <h2 className="text-xl font-bold mb-2">
              {selectedClass.cls.category}
            </h2>
            <p>Trainer: {selectedClass.cls.trainerName}</p>
            <p>Day: {selectedClass.cls.day}</p>
            <p>Time: {selectedClass.cls.time}</p>

            <button
              onClick={() => setSelectedClass(null)}
              className="mt-4 w-full bg-blue-600 py-2 rounded"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
