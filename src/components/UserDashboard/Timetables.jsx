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
  const [viewMode, setViewMode] = useState("weekly"); // weekly | monthly | yearly
  const { selectedStudentUid } = useSelectedStudent();
  const today = dayjs();
  const activeStudentId = selectedStudentUid || user?.uid;
  /* ---------------- AUTH ---------------- */
  useEffect(() => {
    if (!activeStudentId) return;

    const fetchStudentProfile = async () => {
      console.log("Loading student profile:", activeStudentId);

      const sRef = doc(db, "students", activeStudentId);
      const sSnap = await getDoc(sRef);

      if (sSnap.exists()) {
        const data = sSnap.data();
        console.log("Student Profile:", data);
        setStudentProfile(data);
      }
    };

    fetchStudentProfile();
  }, [activeStudentId]);

  /* ---------------- FETCH TIMETABLE ---------------- */
  useEffect(() => {
    if (!studentProfile?.instituteId || !activeStudentId) return;

    const fetchTimetable = async () => {
      const q = query(
        collection(db, "institutes", studentProfile.instituteId, "timetable"),
        where("students", "array-contains", activeStudentId),
      );

      const snap = await getDocs(q);
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

      setClasses(data);
    };

    fetchTimetable();
  }, [studentProfile, activeStudentId]);
  /* ---------------- FETCH ATTENDANCE ---------------- */
  useEffect(() => {
    if (!studentProfile?.instituteId || !activeStudentId) return;

    const fetchAttendance = async () => {
      const q = query(
        collection(db, "institutes", studentProfile.instituteId, "attendance"),
        where("studentId", "==", activeStudentId),
      );

      const snap = await getDocs(q);
      const data = snap.docs.map((d) => d.data());

      setAttendance(data);
    };

    fetchAttendance();
  }, [studentProfile, activeStudentId]);

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
  const getAttendance = (day, time) => {
    return filteredAttendance.find((a) => a.day === day && a.time === time);
  };

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
    <div className="bg-white p-6 rounded-lg min-h-screen text-black">
      <h1 className="text-2xl font-bold mb-4 text-orange-600 flex items-center gap-2">
        My Timetable
      </h1>

      {/* MODE SELECTOR */}
      <div className="mb-4 flex gap-3">
        {["weekly", "monthly", "yearly"].map((m) => (
          <button
            key={m}
            onClick={() => setViewMode(m)}
            className={`px-4 py-2 rounded ${
              viewMode === m ? "bg-orange-500 text-white" : "bg-gray-200"
            }`}
          >
            {m.toUpperCase()}
          </button>
        ))}
      </div>

      {/* ATTENDANCE SUMMARY */}
      <div className="mb-6 p-4 bg-orange-50 rounded-xl border">
        <p className="text-lg font-semibold">
          Attendance Percentage:{" "}
          <span className="text-orange-600">{attendancePercent()}%</span>
        </p>
      </div>

      {/* TIMETABLE GRID */}
      <div className="overflow-x-auto">
        <div
          className="grid"
          style={{ gridTemplateColumns: `100px repeat(${columns.length},1fr)` }}
        >
          <div></div>

          {columns.map((d) => (
            <div
              key={d}
              className="text-center font-semibold bg-orange-100 py-2"
            >
              {d}
            </div>
          ))}

          {times.map((time) => (
            <React.Fragment key={time}>
              <div className="bg-orange-100 p-2 font-semibold text-center">
                {time}
              </div>

              {columns.map((day) => {
                const cls = filteredClasses.find(
                  (c) => c.day === day && c.time === time,
                );

                const att = getAttendance(day, time);

                if (!cls)
                  return (
                    <div key={day + time} className="border min-h-[70px]" />
                  );

                return (
                  <div
                    key={day + time}
                    onClick={() => setSelectedClass({ cls, att })}
                    className={`cursor-pointer p-2 rounded text-sm text-center border ${
                      att?.status === "Absent"
                        ? "bg-red-100 text-red-600"
                        : "bg-green-100 text-green-700"
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

      {/* CLASS DETAIL MODAL */}
      {selectedClass && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
          <div className="bg-white p-6 rounded-xl w-96 shadow-lg">
            <h2 className="text-xl font-bold mb-2 text-orange-600">
              {selectedClass.cls.category}
            </h2>
            <p>Trainer: {selectedClass.cls.trainerName}</p>
            <p>Day: {selectedClass.cls.day}</p>
            <p>Time: {selectedClass.cls.time}</p>

            <button
              onClick={() => setSelectedClass(null)}
              className="mt-4 w-full bg-orange-500 text-white py-2 rounded"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* ATTENDANCE CALENDAR */}
      <div className="mt-8">
        <h2 className="text-xl font-bold mb-3 text-orange-600">
          Attendance Calendar
        </h2>

        <div className="grid grid-cols-7 gap-2">
          {filteredAttendance.map((a, i) => (
            <div
              key={i}
              className={`p-2 rounded text-center text-xs border ${
                a.status === "Absent"
                  ? "bg-red-100 text-red-600"
                  : "bg-green-100 text-green-700"
              }`}
            >
              {a.date}
              <br />
              {a.status}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
