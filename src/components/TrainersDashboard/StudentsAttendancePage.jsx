import React, { useEffect, useMemo, useState, useRef } from "react";
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  setDoc,
  serverTimestamp,
  getDocs,
} from "firebase/firestore";
import { db } from "../../firebase";
import { useAuth } from "../../context/AuthContext";
import { Pagination } from "./shared";
import { Search, Download, ChevronDown } from "lucide-react";
import * as XLSX from "xlsx";

const today = new Date().toISOString().split("T")[0];

const TIME_SLOTS = [
  { value: "09:00", label: "09:00 AM" },
  { value: "10:00", label: "10:00 AM" },
  { value: "11:00", label: "11:00 AM" },
  { value: "12:00", label: "12:00 PM" },
  { value: "13:00", label: "01:00 PM" },
  { value: "14:00", label: "02:00 PM" },
  { value: "15:00", label: "03:00 PM" },
  { value: "16:00", label: "04:00 PM" },
  { value: "17:00", label: "05:00 PM" },
  { value: "18:00", label: "06:00 PM" },
  { value: "19:00", label: "07:00 PM" },
  { value: "20:00", label: "08:00 PM" },
  { value: "21:00", label: "09:00 PM" },
  { value: "22:00", label: "10:00 PM" },
];

const SESSIONS = ["Morning", "Afternoon", "Evening"];

const getDayName = (dateStr) => {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { weekday: "long" });
};

const StudentsAttendancePage = () => {
  const [selectedTime, setSelectedTime] = useState("");
  const timeRef = useRef(null);
  const [absenceReasons, setAbsenceReasons] = useState({});
  const { user, institute } = useAuth(); // user = trainer now
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportFromDate, setExportFromDate] = useState("");
  const [exportToDate, setExportToDate] = useState("");
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [search, setSearch] = useState("");
  const [draftAttendance, setDraftAttendance] = useState({});

  const [selectedSession, setSelectedSession] = useState("");
  const [selectedDate, setSelectedDate] = useState(today);
  const [showTimeDropdown, setShowTimeDropdown] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedSubCategory, setSelectedSubCategory] = useState("");
  const categories = useMemo(() => {
    const set = new Set();

    students.forEach((s) => {
      if (Array.isArray(s.sports)) {
        s.sports.forEach((sp) => {
          if (sp.category) set.add(sp.category);
        });
      }
    });

    return [...set];
  }, [students]);
  const subCategories = useMemo(() => {
    const set = new Set();

    students.forEach((s) => {
      if (Array.isArray(s.sports)) {
        s.sports.forEach((sp) => {
          if (
            (!selectedCategory || sp.category === selectedCategory) &&
            sp.subCategory
          ) {
            set.add(sp.subCategory);
          }
        });
      }
    });

    return [...set];
  }, [students, selectedCategory]);
  const [summary, setSummary] = useState({
    totalStudents: 0,
    presentToday: 0,
    absentToday: 0,
  });

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // ==============================
  // LOAD TRAINER STUDENTS
  // ==============================
  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, "trainerstudents"),
      where("trainerId", "==", user.uid),
    );

    return onSnapshot(q, (snap) => {
      const list = snap.docs.map((d) => ({ uid: d.id, ...d.data() }));
      setStudents(list);
    });
  }, [user]);

  // ==============================
  // FETCH ATTENDANCE (TRAINER)
  // ==============================
  useEffect(() => {
    if (!user || !selectedDate) {
      setAttendance({});
      setDraftAttendance({});
      return;
    }

    setAttendance({});
    setDraftAttendance({});

    const fetchData = async () => {
      const colRef = collection(db, "trainers", user.uid, "attendance");
      const snap = await getDocs(colRef);

      const map = {};

      snap.forEach((d) => {
        const data = d.data();

        const matchDate = data.date === selectedDate;
        const matchCategory =
          !selectedCategory || data.category === selectedCategory;
        const matchSub =
          !selectedSubCategory || data.subCategory === selectedSubCategory;

        if (matchDate && matchCategory && matchSub) {
          map[data.studentId] = data.status;
          if (data.reason) {
            setAbsenceReasons((prev) => ({
              ...prev,
              [data.studentId]: data.reason,
            }));
          }
        }
      });

      setAttendance(map);
      setDraftAttendance({ ...map });
    };

    fetchData();
  }, [user, selectedDate, selectedCategory, selectedSubCategory]);

  const ABSENCE_OPTIONS = [
    "On Leave",
    "Not Working Day",
    "Week Off",
    "Sick Leave",
    "Other",
  ];

  // ==============================
  // FILTER STUDENTS (JOIN + LEFT LOGIC)
  // ==============================
  // ==============================
  // FILTER STUDENTS (STATUS LOGIC)
  // ==============================
  const filteredStudents = useMemo(() => {
    const sortedStudents = [...students].sort((a, b) =>
      (a.firstName || "").localeCompare(b.firstName || ""),
    );

    return sortedStudents.filter((s) => {
      const name = `${s.firstName} ${s.lastName}`.toLowerCase();
      const matchSearch = name.includes(search.toLowerCase());

      // ✅ Status rule
      // show if:
      // - status field not present
      // - status === "Active"
      // hide if:
      // - status === "Left"
      const statusOk = !s.status || s.status === "Active";

      // ✅ Joining rule
      const joinedOk = !s.joiningDate || s.joiningDate <= selectedDate;

      const matchSession = !selectedSession || s.sessions === selectedSession;
      const matchTime = !selectedTime || s.timings === selectedTime;
      const matchSport = s.sports?.some((sp) => {
        const categoryMatch =
          !selectedCategory || sp.category === selectedCategory;
        const subCategoryMatch =
          !selectedSubCategory || sp.subCategory === selectedSubCategory;
        const sessionMatch =
          !selectedSession || sp.sessions === selectedSession;
        const timeMatch = !selectedTime || sp.timings === selectedTime;

        return categoryMatch && subCategoryMatch && sessionMatch && timeMatch;
      });
      return matchSearch && statusOk && joinedOk && matchSport;
    });
  }, [
    students,
    search,
    selectedDate,
    selectedSession,
    selectedTime,
    selectedCategory,
    selectedSubCategory,
  ]);

  // ==============================
  // SUMMARY
  // ==============================
  useEffect(() => {
    const total = filteredStudents.length;
    let present = 0;
    let absent = 0;

    filteredStudents.forEach((student) => {
      const status = draftAttendance[student.uid];
      if (status === "present") present++;
      if (status === "absent") absent++;
    });

    setSummary({
      totalStudents: total,
      presentToday: present,
      absentToday: absent,
    });
  }, [filteredStudents, draftAttendance]);

  // ==============================
  // PAGINATION
  // ==============================
  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);

  const paginatedStudents = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredStudents.slice(start, start + itemsPerPage);
  }, [filteredStudents, currentPage]);

  // ==============================
  // SAVE ATTENDANCE (TRAINER)
  // ==============================
  const saveAttendance = (student, status) => {
    setDraftAttendance((prev) => ({
      ...prev,
      [student.uid]: status,
    }));

    // if switching to present → remove reason
    if (status === "present") {
      setAbsenceReasons((prev) => {
        const copy = { ...prev };
        delete copy[student.uid];
        return copy;
      });
    }
  };

  const handleSaveAll = async () => {
    const dayName = getDayName(selectedDate);
    for (let [studentId, status] of Object.entries(draftAttendance)) {
      if (status === "absent" && !absenceReasons[studentId]) {
        alert("Please enter reason for all absent students ❌");
        return;
      }
    }

    const promises = Object.entries(draftAttendance).map(
      ([studentId, status]) => {
        const student = Array.isArray(students)
          ? students.find((s) => s.uid === studentId)
          : null;

        return setDoc(
          doc(
            db,
            "trainers",
            user.uid,
            "attendance",
            `${studentId}_${selectedDate}_${selectedCategory}_${selectedSubCategory}`,
          ),
          {
            trainerId: user.uid,
            studentId,
            category: selectedCategory || "",
            subCategory: selectedSubCategory || "",
            session: student?.sessions || "General",
            date: selectedDate,
            day: dayName,
            time: selectedTime || "",
            status,
            reason: absenceReasons[studentId] || "",
            updatedAt: serverTimestamp(),
            createdAt: serverTimestamp(),
          },
          { merge: true },
        );
      },
    );

    await Promise.all(promises);
    alert("Attendance saved ✅");
  };

  const handleCancel = () => {
    setDraftAttendance({ ...attendance });
  };

  const hasChanges =
    JSON.stringify(draftAttendance) !== JSON.stringify(attendance);

  // ==============================
  // EXPORT CSV
  // ==============================

  const exportAttendanceRange = async () => {
    if (!exportFromDate || !exportToDate) {
      alert("Select From and To dates");
      return;
    }

    const colRef = collection(db, "trainers", user.uid, "attendance");
    const snap = await getDocs(colRef);

    const attendanceMap = {};

    snap.forEach((doc) => {
      const data = doc.data();

      if (data.date >= exportFromDate && data.date <= exportToDate) {
        const key = `${data.studentId}_${data.date}`;
        attendanceMap[key] = {
          status: data.status,
          reason: data.reason || "",
        };
      }
    });

    const attendanceRows = [];
    const summaryRows = [];

    filteredStudents.forEach((student) => {
      let currentDate = new Date(exportFromDate);
      const endDate = new Date(exportToDate);

      let present = 0;
      let total = 0;

      while (currentDate <= endDate) {
        const dateStr = currentDate.toISOString().split("T")[0];
        const key = `${student.uid}_${dateStr}`;

        const record = attendanceMap[key] || {};
        const status = record.status || "Not Marked";
        const reason = record.reason || "";

        if (status === "present") present++;
        if (status !== "Not Marked") total++;

        attendanceRows.push({
          Name: `${student.firstName} ${student.lastName}`,
          Date: dateStr,
          Session: student.sessions || "-",
          Status: status,
          Reason: status === "absent" ? reason : "",
        });

        currentDate.setDate(currentDate.getDate() + 1);
      }

      const percent = total ? ((present / total) * 100).toFixed(1) : 0;

      summaryRows.push({
        Name: `${student.firstName} ${student.lastName}`,
        Present: present,
        TotalMarkedDays: total,
        AttendancePercentage: `${percent}%`,
      });
    });

    const workbook = XLSX.utils.book_new();

    const attendanceSheet = XLSX.utils.json_to_sheet(attendanceRows);
    const summarySheet = XLSX.utils.json_to_sheet(summaryRows);

    XLSX.utils.book_append_sheet(workbook, attendanceSheet, "Attendance");
    XLSX.utils.book_append_sheet(workbook, summarySheet, "Summary");

    XLSX.writeFile(
      workbook,
      `trainer_attendance_${exportFromDate}_to_${exportToDate}.xlsx`,
    );

    setShowExportModal(false);
  };
  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-[#F3F4F6] min-h-screen max-w-7xl mx-auto">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-3xl font-bold text-orange-500 flex items-center gap-2">
          Trainer Students Attendance
        </h1>
        <input
          type="date"
          value={selectedDate}
          max={today}
          onChange={(e) => {
            setAttendance({});
            setDraftAttendance({});
            setSelectedDate(e.target.value);
          }}
          className="border bg-orange-500 border-orange-300 rounded-lg px-3 py-2"
        />
      </div>

      {/* SUMMARY */}
      <div className="bg-white border border-orange-200 rounded-xl p-4 flex flex-col lg:flex-row justify-between gap-4 mb-6">
        <div>
          <p className="text-gray-600">Total Students</p>
          <h2 className="text-xl font-bold text-orange-500">
            {summary.totalStudents}
          </h2>
        </div>

        <div>
          <p className="text-gray-600">Present Today</p>
          <h2 className="text-xl font-bold text-orange-500">
            {summary.presentToday}
          </h2>
        </div>

        <div>
          <p className="text-gray-600">Absent Today</p>
          <h2 className="text-xl font-bold text-orange-500">
            {summary.absentToday}
          </h2>
        </div>
      </div>

      {/* TOOLBAR */}
      <div className="bg-white border border-orange-200 rounded-xl p-5 mb-6">
        {/* 🔹 ROW 1: TITLE + SEARCH + EXPORT */}
        <div className="flex justify-between items-center mb-4 flex-wrap gap-3">
          {/* LEFT */}
          <div className="text-lg font-bold text-black">Attendance Records</div>

          {/* RIGHT */}
          <div className="flex items-center gap-3">
            {/* SEARCH */}
            <div className="flex items-center border border-orange-400 rounded-lg px-3 py-2">
              <Search size={18} className="text-gray-500" />
              <input
                placeholder="Search Name"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="outline-none ml-2 w-40"
              />
            </div>

            {/* EXPORT */}
            <button
              onClick={() => setShowExportModal(true)}
              className="border border-orange-400 text-gray-700 px-5 py-2 rounded-lg flex items-center gap-2 hover:bg-orange-50"
            >
              <Download size={18} />
              Export
            </button>
          </div>
        </div>

        {/* 🔹 ROW 2: FILTERS */}
        <div className="flex flex-wrap items-center gap-3">
          {/* SESSION */}
          <select
            value={selectedSession}
            onChange={(e) => setSelectedSession(e.target.value)}
            className="bg-white border border-orange-300 rounded-lg px-4 py-2 font-semibold"
          >
            <option value="">Session</option>
            {SESSIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          {/* TIME */}
          <div ref={timeRef} className="relative w-44">
            <button
              onClick={() => setShowTimeDropdown(!showTimeDropdown)}
              className="w-full border border-orange-300 bg-white rounded-lg px-4 py-2 font-semibold flex items-center justify-between"
            >
              <span>
                {selectedTime
                  ? TIME_SLOTS.find((t) => t.value === selectedTime)?.label
                  : "Timings"}
              </span>
              <ChevronDown size={18} />
            </button>

            {showTimeDropdown && (
              <div className="absolute z-50 mt-1 w-full bg-white border rounded-lg shadow-md max-h-40 overflow-y-auto">
                {TIME_SLOTS.map((t) => (
                  <div
                    key={t.value}
                    onClick={() => {
                      setSelectedTime(t.value);
                      setShowTimeDropdown(false);
                    }}
                    className="px-4 py-2 hover:bg-orange-100 cursor-pointer"
                  >
                    {t.label}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* CATEGORY */}
          <select
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              setSelectedSubCategory("");
            }}
            className="bg-white border border-orange-300 rounded-lg px-4 py-2 font-semibold"
          >
            <option value="">Category</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          {/* SUB CATEGORY */}
          <select
            value={selectedSubCategory}
            onChange={(e) => setSelectedSubCategory(e.target.value)}
            className="bg-white border border-orange-300 rounded-lg px-4 py-2 font-semibold"
          >
            <option value="">Sub Category</option>
            {subCategories.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* TABLE */}
      <div className="border border-orange-300 rounded-xl overflow-hidden">
        <div className="hidden md:grid grid-cols-5 bg-[#1F2937] text-orange-400 font-semibold p-4">
          <div>Students Name</div>
          <div>Session</div>
          <div className="text-center">Present</div>
          <div className="text-center">Absent</div>
          <div className="text-center">Reason</div>
        </div>

        <div className="bg-white min-h-[300px]">
          {paginatedStudents.map((s, index) => {
            const record = draftAttendance[s.uid];

            return (
              <div
                key={s.uid}
                className="grid grid-cols-2 md:grid-cols-5 gap-2 md:gap-0 p-4 border-t items-center"
              >
                <div className="flex items-center gap-3">
                  <div className="mr-1 text-gray-500 font-semibold">
                    {(currentPage - 1) * itemsPerPage + index + 1}.
                  </div>

                  <div className="font-semibold">
                    {s.firstName} {s.lastName}
                  </div>
                </div>

                <div>{s.sessions || "-"}</div>

                <div className="flex justify-center">
                  <input
                    type="checkbox"
                    checked={record === "present"}
                    onChange={() => saveAttendance(s, "present")}
                    className="w-5 h-5"
                  />
                </div>

                <div className="flex justify-center">
                  <input
                    type="checkbox"
                    checked={record === "absent"}
                    onChange={() => saveAttendance(s, "absent")}
                    className="w-5 h-5"
                  />
                </div>
                <div className="flex justify-center">
                  {record === "absent" && (
                    <select
                      value={absenceReasons[s.uid] || ""}
                      onChange={(e) =>
                        setAbsenceReasons((prev) => ({
                          ...prev,
                          [s.uid]: e.target.value,
                        }))
                      }
                      className="border border-orange-300 rounded px-2 py-1"
                    >
                      <option value="">Select</option>
                      {ABSENCE_OPTIONS.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-end gap-4 mt-6">
        <button
          onClick={handleCancel}
          className="border border-gray-400 px-5 py-2 rounded-md"
        >
          Cancel
        </button>

        <button
          onClick={handleSaveAll}
          disabled={!hasChanges}
          className={`px-5 py-2 rounded-md text-white ${
            hasChanges ? "bg-orange-500" : "bg-gray-400 cursor-not-allowed"
          }`}
        >
          Save
        </button>
      </div>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />
      {showExportModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-[350px] space-y-4">
            <h2 className="text-lg font-semibold">Export Attendance</h2>

            <div>
              <label className="text-sm font-medium">From Date</label>
              <input
                type="date"
                value={exportFromDate}
                onChange={(e) => setExportFromDate(e.target.value)}
                className="w-full border border-orange-300 rounded-lg px-3 py-2 mt-1"
              />
            </div>

            <div>
              <label className="text-sm font-medium">To Date</label>
              <input
                type="date"
                value={exportToDate}
                onChange={(e) => setExportToDate(e.target.value)}
                className="w-full border border-orange-300 rounded-lg px-3 py-2 mt-1"
              />
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowExportModal(false)}
                className="border px-4 py-1 rounded"
              >
                Cancel
              </button>

              <button
                onClick={exportAttendanceRange}
                className="bg-orange-500 text-white px-4 py-1 rounded"
              >
                Download
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentsAttendancePage;
