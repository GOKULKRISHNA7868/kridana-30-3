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
const absenceReasons = [
  "On Leave",
  "Not Working Day",
  "Week Off",
  "Sick Leave",
  "Other",
];
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

  const { user, institute } = useAuth();

  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [search, setSearch] = useState("");
  const [draftAttendance, setDraftAttendance] = useState({});

  const [selectedSession, setSelectedSession] = useState("");
  const [selectedDate, setSelectedDate] = useState(today);
  const [showTimeDropdown, setShowTimeDropdown] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedSubCategory, setSelectedSubCategory] = useState("");
  const [selectedBranch, setSelectedBranch] = useState("");
  const [summary, setSummary] = useState({
    totalStudents: 0,
    presentToday: 0,
    absentToday: 0,
  });
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportFromDate, setExportFromDate] = useState("");
  const [exportToDate, setExportToDate] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Load Students
  useEffect(() => {
    if (!user || institute?.role !== "institute") return;

    const q = query(
      collection(db, "students"),
      where("instituteId", "==", user.uid),
    );

    return onSnapshot(q, (snap) => {
      const list = snap.docs
        .map((d) => ({ uid: d.id, ...d.data() }))
        .sort((a, b) => {
          const nameA =
            `${a.firstName || ""} ${a.lastName || ""}`.toLowerCase();
          const nameB =
            `${b.firstName || ""} ${b.lastName || ""}`.toLowerCase();

          return nameA.localeCompare(nameB);
        });

      setStudents(list);
    });
  }, [user, institute]);

  // Fetch Attendance (DATE BASED ONLY)
  useEffect(() => {
    if (!user || !selectedDate) {
      setAttendance({});
      setDraftAttendance({});
      return;
    }

    setAttendance({});
    setDraftAttendance({});

    const fetchData = async () => {
      const colRef = collection(db, "institutes", user.uid, "attendance");
      const snap = await getDocs(colRef);

      const map = {};

      snap.forEach((d) => {
        const data = d.data();
        if (
          data.date === selectedDate &&
          (!selectedCategory || data.category === selectedCategory) &&
          (!selectedSubCategory || data.subCategory === selectedSubCategory)
        ) {
          const key = `${data.studentId}||${data.category}||${data.subCategory}`;
          map[key] = {
            status: data.status,
            reason: data.reason || "",
          };
        }
      });

      setAttendance(map);
      setDraftAttendance({ ...map });
    };

    fetchData();
  }, [user, selectedDate, selectedCategory, selectedSubCategory]);

  // Filter Students (JOIN DATE + LEFT DATE LOGIC)
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const name = `${s.firstName} ${s.lastName}`.toLowerCase();
      const matchSearch = name.includes(search.toLowerCase());

      const statusOk = !s.status || s.status === "Active";
      const joinedOk = !s.joiningDate || s.joiningDate <= selectedDate;

      let sportMatch = true;

      if (selectedCategory) {
        sportMatch =
          s.sports &&
          s.sports.some(
            (sp) =>
              sp.category === selectedCategory &&
              (!selectedSubCategory || sp.subCategory === selectedSubCategory),
          );
      }

      const matchSession =
        !selectedSession ||
        s.sessions === selectedSession ||
        (s.sports && s.sports.some((sp) => sp.sessions === selectedSession));
      const matchTime =
        !selectedTime ||
        (s.sports && s.sports.some((sp) => sp.timings === selectedTime));
      const matchBranch = !selectedBranch || s.branch === selectedBranch;
      return (
        matchSearch &&
        statusOk &&
        joinedOk &&
        sportMatch &&
        matchSession &&
        matchTime &&
        matchBranch
      );
    });
  }, [
    students,
    search,
    selectedDate,
    selectedCategory,
    selectedSubCategory,
    selectedSession,
    selectedTime,
    selectedBranch,
  ]);
  // Summary
  useEffect(() => {
    const total = filteredStudents.length;
    let present = 0;
    let absent = 0;

    filteredStudents.forEach((student) => {
      const key = `${student.uid}||${selectedCategory}||${selectedSubCategory}`;
      const status = draftAttendance[key]?.status;

      if (status === "present") present++;
      if (status === "absent") absent++;
    });

    setSummary({
      totalStudents: total,
      presentToday: present,
      absentToday: absent,
    });
  }, [
    filteredStudents,
    draftAttendance,
    selectedCategory,
    selectedSubCategory,
  ]);

  // Pagination
  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);

  const paginatedStudents = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredStudents.slice(start, start + itemsPerPage);
  }, [filteredStudents, currentPage]);

  // Save Attendance
  const saveAttendance = (student, status, reason = "") => {
    const key = `${student.uid}||${selectedCategory}||${selectedSubCategory}`;

    setDraftAttendance((prev) => ({
      ...prev,
      [key]: {
        status,
        reason,
      },
    }));
  };
  const categories = useMemo(() => {
    const set = new Set();

    students.forEach((s) => {
      if (Array.isArray(s.sports)) {
        s.sports.forEach((sp) => {
          if (sp.category) set.add(sp.category);
        });
      }
    });

    return Array.from(set);
  }, [students]);
  const subCategories = useMemo(() => {
    const set = new Set();

    students.forEach((s) => {
      if (Array.isArray(s.sports)) {
        s.sports.forEach((sp) => {
          if (sp.category === selectedCategory && sp.subCategory) {
            set.add(sp.subCategory);
          }
        });
      }
    });

    return Array.from(set);
  }, [students, selectedCategory]);
  const branches = useMemo(() => {
    const set = new Set();

    students.forEach((s) => {
      if (s.branch) {
        set.add(s.branch);
      }
    });

    return Array.from(set);
  }, [students]);
  const handleSaveAll = async () => {
    for (const rec of Object.values(draftAttendance)) {
      if (rec?.status === "absent" && !rec?.reason) {
        alert("Please select reason for all absent students");
        return;
      }
    }
    const dayName = getDayName(selectedDate);

    const promises = Object.entries(draftAttendance)
      .map(([key, status]) => {
        const parts = key.split("||");

        const studentId = parts[0];
        const category = parts[1] || "";
        const subCategory = parts[2] || "";

        if (!studentId || !category || !subCategory) {
          console.warn("Skipping invalid record:", key);
          return null; // 🚫 skip invalid
        }

        const student = students.find((s) => s.uid === studentId);

        return setDoc(
          doc(
            db,
            "institutes",
            user.uid,
            "attendance",
            `${studentId}_${selectedDate}_${category}_${subCategory}`,
          ),
          {
            instituteId: user.uid,
            studentId,
            category,
            subCategory,
            session: student?.sessions || "General",
            date: selectedDate,
            day: dayName,
            time: selectedTime || "",
            status: status.status,
            reason: status.reason || "",
            updatedAt: serverTimestamp(),
            createdAt: serverTimestamp(),
          },
          { merge: true },
        );
      })
      .filter(Boolean); // ✅ remove nulls
    await Promise.all(promises);
    alert("Attendance saved ✅");
  };
  useEffect(() => {
    setCurrentPage(1);
  }, [
    search,
    selectedSession,
    selectedCategory,
    selectedSubCategory,
    selectedBranch,
  ]);
  const handleCancel = () => {
    setDraftAttendance({ ...attendance });
  };

  const hasChanges =
    JSON.stringify(draftAttendance) !== JSON.stringify(attendance);

  // Export CSV
  const exportAttendanceRange = async () => {
    console.log("Download clicked");
    if (!exportFromDate || !exportToDate) {
      alert("Select From and To dates");
      return;
    }

    const colRef = collection(db, "institutes", user.uid, "attendance");
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

        const record = attendanceMap[key];
        const status = record?.status || "Not Marked";

        if (status === "present") present++;
        if (status !== "Not Marked") total++;

        attendanceRows.push({
          Name: `${student.firstName} ${student.lastName}`,
          Date: dateStr,
          Session: student.sessions || "-",
          Status: status,
          Reason: record?.reason || "", // ✅ ADD THIS LINE
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

    // Create workbook
    const workbook = XLSX.utils.book_new();

    // Create sheets
    const attendanceSheet = XLSX.utils.json_to_sheet(attendanceRows);
    const summarySheet = XLSX.utils.json_to_sheet(summaryRows);

    // 🔹 Apply colors to Status column
    const range = XLSX.utils.decode_range(attendanceSheet["!ref"]);

    for (let R = 1; R <= range.e.r; ++R) {
      const cellAddress = XLSX.utils.encode_cell({ r: R, c: 3 }); // Status column
      const cell = attendanceSheet[cellAddress];

      if (!cell) continue;

      if (cell.v === "present") {
        cell.s = { fill: { fgColor: { rgb: "C6EFCE" } } }; // green
      }

      if (cell.v === "absent") {
        cell.s = { fill: { fgColor: { rgb: "FFC7CE" } } }; // red
      }
    }

    // Add sheets
    XLSX.utils.book_append_sheet(workbook, attendanceSheet, "Attendance");
    XLSX.utils.book_append_sheet(workbook, summarySheet, "Summary");

    // Download file
    XLSX.writeFile(
      workbook,
      `attendance_${exportFromDate}_to_${exportToDate}.xlsx`,
    );

    setShowExportModal(false);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-[#F3F4F6] min-h-screen max-w-7xl mx-auto">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-3xl font-bold text-orange-500 flex items-center gap-2">
          Students Attendance
        </h1>
        <input
          type="date"
          value={selectedDate}
          max={today} // 🔒 NO FUTURE DATE
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
      <div className="bg-white border border-orange-200 rounded-xl p-4 mb-6 space-y-4">
        {/* ROW 1 */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="text-lg font-bold text-black">Attendance Records</div>

          <div className="flex flex-wrap items-center gap-3">
            {/* SEARCH */}
            <div className="flex items-center border border-orange-400 rounded-lg px-3 py-2 min-w-[200px] bg-white">
              <Search size={18} className="text-gray-500" />
              <input
                placeholder="Search Name"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="outline-none ml-2 w-full"
              />
            </div>

            {/* EXPORT */}
            <button
              onClick={() => setShowExportModal(true)}
              className="border border-orange-400 text-gray-700 px-5 py-2 rounded-lg flex items-center gap-2 hover:bg-orange-50 transition"
            >
              <Download size={18} /> Export
            </button>
          </div>
        </div>

        {/* ROW 2 */}
        <div className="flex flex-wrap items-center gap-3">
          {/* SESSION */}
          <select
            value={selectedSession}
            onChange={(e) => setSelectedSession(e.target.value)}
            className="bg-white border border-orange-300 rounded-lg px-4 py-2 font-semibold min-w-[140px]"
          >
            <option value="">Session</option>
            {SESSIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          {/* BRANCH */}
          <select
            value={selectedBranch}
            onChange={(e) => setSelectedBranch(e.target.value)}
            className="bg-white border border-orange-300 rounded-lg px-4 py-2 font-semibold min-w-[140px]"
          >
            <option value="">Branch</option>
            {branches.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>

          {/* CATEGORY */}
          <select
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              setSelectedSubCategory("");
            }}
            className="bg-white border border-orange-300 rounded-lg px-4 py-2 font-semibold min-w-[160px]"
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
            className="bg-white border border-orange-300 rounded-lg px-4 py-2 font-semibold min-w-[160px]"
          >
            <option value="">Sub Category</option>
            {subCategories.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          {/* TIMINGS */}
          <div ref={timeRef} className="relative min-w-[150px]">
            <button
              onClick={() => setShowTimeDropdown(!showTimeDropdown)}
              className="w-full border border-orange-300 bg-white rounded-lg px-4 py-2 font-semibold flex items-center justify-between"
            >
              <span>
                {selectedTime
                  ? TIME_SLOTS.find((t) => t.value === selectedTime)?.label
                  : "Timings"}
              </span>

              <ChevronDown
                size={18}
                className={`transition-transform ${
                  showTimeDropdown ? "rotate-180" : ""
                }`}
              />
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
                    className="px-4 py-2 hover:bg-blue-100 cursor-pointer"
                  >
                    {t.label}
                  </div>
                ))}
              </div>
            )}
          </div>
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
            const key = `${s.uid}||${selectedCategory}||${selectedSubCategory}`;
            const record = draftAttendance[key];

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
                    checked={record?.status === "present"}
                    onChange={() => saveAttendance(s, "present", "")}
                    className="w-5 h-5"
                  />
                </div>

                <div className="flex justify-center">
                  <input
                    type="checkbox"
                    checked={record?.status === "absent"}
                    onChange={() => saveAttendance(s, "absent")}
                    className="w-5 h-5"
                  />
                </div>
                <div className="flex justify-center">
                  {record?.status === "absent" && (
                    <select
                      value={record?.reason || ""}
                      onChange={(e) =>
                        saveAttendance(s, "absent", e.target.value)
                      }
                      className="border rounded px-2 py-1"
                    >
                      <option value="">Select</option>
                      {absenceReasons.map((r) => (
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
