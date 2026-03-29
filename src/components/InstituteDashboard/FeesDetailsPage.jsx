import React, { useEffect, useMemo, useState, useRef } from "react";
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  setDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db, auth } from "../../firebase";
import { ChevronDown } from "lucide-react";

const MONTHS = [
  { label: "January", value: "01" },
  { label: "February", value: "02" },
  { label: "March", value: "03" },
  { label: "April", value: "04" },
  { label: "May", value: "05" },
  { label: "June", value: "06" },
  { label: "July", value: "07" },
  { label: "August", value: "08" },
  { label: "September", value: "09" },
  { label: "October", value: "10" },
  { label: "November", value: "11" },
  { label: "December", value: "12" },
];

const YEARS = Array.from({ length: 10 }, (_, i) =>
  (new Date().getFullYear() - 5 + i).toString(),
);

const FeesDetailsPage = () => {
  const instituteId = auth.currentUser?.uid;

  const [students, setStudents] = useState([]);
  const [fees, setFees] = useState([]);

  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedYear, setSelectedYear] = useState(
    new Date().getFullYear().toString(),
  );

  const [search, setSearch] = useState("");

  const [showMonthDropdown, setShowMonthDropdown] = useState(false);
  const monthRef = useRef(null);
  const [selectedSport, setSelectedSport] = useState(null);
  const [showYearDropdown, setShowYearDropdown] = useState(false);
  const yearRef = useRef(null);

  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedSubCategory, setSelectedSubCategory] = useState("");
  const [editData, setEditData] = useState({
    totalFee: "",
    paidAmount: "",
    paidDate: "",
    waiveReason: "",
    feeWaived: false,
  });

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (monthRef.current && !monthRef.current.contains(e.target)) {
        setShowMonthDropdown(false);
      }
      if (yearRef.current && !yearRef.current.contains(e.target)) {
        setShowYearDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!instituteId) return;

    const q = query(
      collection(db, "students"),
      where("instituteId", "==", instituteId),
    );

    return onSnapshot(q, (snap) => {
      const list = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .sort((a, b) => {
          const nameA =
            `${a.firstName || ""} ${a.lastName || ""}`.toLowerCase();
          const nameB =
            `${b.firstName || ""} ${b.lastName || ""}`.toLowerCase();

          return nameA.localeCompare(nameB);
        });

      setStudents(list);
    });
  }, [instituteId]);

  useEffect(() => {
    if (!instituteId) return;

    const q = query(
      collection(db, "studentFees"),
      where("instituteId", "==", instituteId),
    );

    return onSnapshot(q, (snap) => {
      setFees(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
  }, [instituteId]);
  const categories = [
    ...new Set(
      students.flatMap((s) => (s.sports || []).map((sp) => sp.category)),
    ),
  ];
  const subCategories = [
    ...new Set(
      students
        .flatMap((s) => s.sports || [])
        .filter((sp) => !selectedCategory || sp.category === selectedCategory)
        .map((sp) => sp.subCategory),
    ),
  ];
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const matchesSearch = `${s.firstName} ${s.lastName}`
        .toLowerCase()
        .includes(search.toLowerCase());

      if (!matchesSearch) return false;
      if (!selectedMonth || !selectedYear) return true;

      const selectedDate = new Date(
        Number(selectedYear),
        Number(selectedMonth) - 1,
        1,
      );

      if (s.joiningDate) {
        const joiningDate = new Date(s.joiningDate);
        if (
          selectedDate <
          new Date(joiningDate.getFullYear(), joiningDate.getMonth(), 1)
        ) {
          return false;
        }
      }

      if (s.leftDate) {
        const leftDate = s.leftDate?.toDate?.() || new Date(s.leftDate);
        const leftMonthDate = new Date(
          leftDate.getFullYear(),
          leftDate.getMonth(),
          1,
        );
        if (selectedDate > leftMonthDate) {
          return false;
        }
      }

      if (s.status === "Left") {
        if (s.leftDate) {
          const leftDate = s.leftDate?.toDate?.() || new Date(s.leftDate);
          const leftMonthDate = new Date(
            leftDate.getFullYear(),
            leftDate.getMonth(),
            1,
          );
          if (selectedDate > leftMonthDate) {
            return false;
          }
        }
      }

      return true;
    });
  }, [students, search, selectedMonth, selectedYear]);
  const filteredRows = useMemo(() => {
    let rows = [];

    filteredStudents.forEach((student) => {
      (student.sports || []).forEach((sport) => {
        if (selectedCategory && sport.category !== selectedCategory) {
          return;
        }

        if (selectedSubCategory && sport.subCategory !== selectedSubCategory) {
          return;
        }

        rows.push({
          student,
          sport,
        });
      });
    });

    return rows;
  }, [filteredStudents, selectedCategory, selectedSubCategory]);
  const handleEditPayment = (student, sport) => {
    if (!selectedMonth || !selectedYear) {
      alert("Please select month and year first!");
      return;
    }

    setSelectedStudent(student);
    setSelectedSport(sport);

    const existingFee = fees.find(
      (f) =>
        f.studentId === student.id &&
        f.category === sport.category &&
        f.subCategory === sport.subCategory &&
        f.month === `${selectedYear}-${selectedMonth}`,
    );

    setEditData({
      totalFee: existingFee?.totalAmount ?? sport.fee ?? 0,
      paidAmount: existingFee?.paidAmount ?? "",
      paidDate: existingFee?.paidDate ?? "",
      feeWaived: existingFee?.feeWaived ?? false,
      waiveReason: existingFee?.waiveReason ?? "",
    });

    setShowEditModal(true);
  };

  const updatePayment = async () => {
    if (!selectedStudent || !selectedSport) return;

    const { totalFee, paidAmount, paidDate } = editData;

    try {
      const existingFee = fees.find(
        (f) =>
          f.studentId === selectedStudent.id &&
          f.category === selectedSport.category &&
          f.subCategory === selectedSport.subCategory &&
          f.month === `${selectedYear}-${selectedMonth}`,
      );

      if (existingFee) {
        await updateDoc(doc(db, "studentFees", existingFee.id), {
          totalAmount: Number(totalFee),
          paidAmount: Number(paidAmount),
          paidDate,
          updatedAt: serverTimestamp(),
        });
      } else {
        await setDoc(doc(collection(db, "studentFees")), {
          studentId: selectedStudent.id,
          instituteId,
          category: selectedSport.category,
          subCategory: selectedSport.subCategory,
          totalAmount: Number(totalFee),
          paidAmount: Number(paidAmount),
          paidDate,
          feeWaived: editData.feeWaived || false,
          waiveReason: editData.waiveReason || "",
          month: `${selectedYear}-${selectedMonth}`,
          createdAt: serverTimestamp(),
        });
      }

      alert("Payment saved successfully ✅");

      setShowEditModal(false);
      setSelectedStudent(null);
      setSelectedSport(null);
    } catch (error) {
      console.error(error);
      alert("Error saving payment ❌");
    }
  };
  const totalStudents = filteredRows.length;

  const totalAmount = filteredRows.reduce((sum, row) => {
    const record = fees.find(
      (f) =>
        f.studentId === row.student.id &&
        f.category === row.sport.category &&
        f.subCategory === row.sport.subCategory &&
        f.month === `${selectedYear}-${selectedMonth}`,
    );

    return sum + Number(record?.totalAmount ?? row.sport.fee ?? 0);
  }, 0);

  const totalPaid = filteredRows.reduce((sum, row) => {
    const record = fees.find(
      (f) =>
        f.studentId === row.student.id &&
        f.category === row.sport.category &&
        f.subCategory === row.sport.subCategory &&
        f.month === `${selectedYear}-${selectedMonth}`,
    );

    return sum + Number(record?.paidAmount ?? 0);
  }, 0);
  const totalPending = totalAmount - totalPaid;
  const getFeeData = (student, sport) => {
    const feeRecord = fees.find(
      (f) =>
        f.studentId === student.id &&
        f.category === sport.category &&
        f.subCategory === sport.subCategory &&
        f.month === `${selectedYear}-${selectedMonth}`,
    );

    if (feeRecord?.feeWaived) {
      return {
        total: 0,
        paid: 0,
        pending: 0,
        paidDate: "-",
        reason: feeRecord.waiveReason || "Fee Waived",
      };
    }

    const total = Number(feeRecord?.totalAmount ?? sport.fee ?? 0);
    const paid = Number(feeRecord?.paidAmount || 0);
    const pending = total - paid;
    const paidDate = feeRecord?.paidDate || "-";

    return { total, paid, pending, paidDate, reason: "" };
  };
  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-[#f3f4f6] min-h-screen max-w-7xl mx-auto">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-6">
        {/* Page Title */}
        <h1 className="text-3xl font-bold text-gray-800">Fees Details</h1>

        {/* Filters Section */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Year Dropdown */}
          <div ref={yearRef} className="relative w-32">
            <button
              onClick={() => setShowYearDropdown(!showYearDropdown)}
              className="bg-orange-500 text-white rounded-lg px-4 py-3 font-semibold w-full hover:bg-orange-600 transition"
            >
              {selectedYear}
            </button>

            {showYearDropdown && (
              <div className="absolute z-50 mt-1 w-full bg-white border rounded-lg shadow-md max-h-48 overflow-y-auto">
                {YEARS.map((y) => (
                  <div
                    key={y}
                    onClick={() => {
                      setSelectedYear(y);
                      setShowYearDropdown(false);
                    }}
                    className="px-4 py-2 hover:bg-orange-100 cursor-pointer"
                  >
                    {y}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Month Dropdown */}
          <div ref={monthRef} className="relative w-44">
            <button
              onClick={() => setShowMonthDropdown(!showMonthDropdown)}
              className="bg-orange-500 text-white rounded-lg px-4 py-3 font-semibold w-full flex items-center justify-between hover:bg-orange-600 transition"
            >
              {selectedMonth
                ? MONTHS.find((m) => m.value === selectedMonth)?.label
                : "Select Month"}
              <ChevronDown size={18} />
            </button>

            {showMonthDropdown && (
              <div className="absolute z-50 mt-1 w-full bg-white border rounded-lg shadow-md max-h-48 overflow-y-auto">
                {MONTHS.map((m) => (
                  <div
                    key={m.value}
                    onClick={() => {
                      setSelectedMonth(m.value);
                      setShowMonthDropdown(false);
                    }}
                    className="px-4 py-2 hover:bg-orange-100 cursor-pointer"
                  >
                    {m.label}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Category Select */}
          <select
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              setSelectedSubCategory("");
            }}
            className="border border-gray-300 px-4 py-3 rounded-lg text-gray-700 focus:ring-2 focus:ring-orange-400 outline-none"
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>

          {/* SubCategory Select */}
          <select
            value={selectedSubCategory}
            onChange={(e) => setSelectedSubCategory(e.target.value)}
            className="border border-gray-300 px-4 py-3 rounded-lg text-gray-700 focus:ring-2 focus:ring-orange-400 outline-none"
          >
            <option value="">All SubCategories</option>
            {subCategories.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>

      {/* STATS CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <StatCard title="Total Fees Amount" value={`₹ ${totalAmount}`} />
        <StatCard title="Total Fees Pending" value={`₹ ${totalPending}`} />
        <StatCard title="Total Fees Paid" value={`₹ ${totalPaid}`} />
        <StatCard title="Total Students" value={totalStudents} />
      </div>

      <div className="relative w-full sm:w-80 mb-4">
        <img
          src="/search-icon.png"
          alt="search"
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-60"
        />

        <input
          type="text"
          placeholder="Search here..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border border-orange-400 rounded px-10 py-2 w-full 
               focus:outline-none focus:ring-0 focus:border-orange-400"
        />
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-xl shadow overflow-x-auto">
        {/* HEADER */}
        <div className="grid grid-cols-8 min-w-[1000px] bg-black text-orange-500 px-6 py-3 font-semibold text-sm">
          <div>Student</div>
          <div>Category</div>
          <div>SubCategory</div>
          <div className="text-center">Sessions</div>
          <div className="text-center">Total</div>
          <div className="text-center">Paid</div>
          <div className="text-center">Pending</div>
          <div className="text-center">Reason</div>
        </div>

        {/* ROWS */}
        {filteredRows.map((row, index) => {
          const { student, sport } = row;
          const data = getFeeData(student, sport);

          return (
            <div
              key={`${student.id}-${sport.subCategory}`}
              className="grid grid-cols-8 min-w-[1000px] px-6 py-4 border-t items-center text-sm hover:bg-gray-50 transition"
            >
              {/* Student */}
              <div className="font-medium text-gray-800">
                {index + 1}. {student.firstName} {student.lastName}
              </div>

              {/* Category */}
              <div className="text-gray-700">{sport.category}</div>

              {/* SubCategory */}
              <div className="text-gray-700">{sport.subCategory}</div>

              {/* Sessions */}
              <div className="text-center text-gray-700">
                {student.sessions || "-"}
              </div>

              {/* Total */}
              <div
                className="text-center font-semibold cursor-pointer"
                onClick={() => handleEditPayment(student, sport)}
              >
                ₹ {data.total}
              </div>

              {/* Paid */}
              <div
                className="text-center text-green-600 font-semibold cursor-pointer"
                onClick={() => handleEditPayment(student, sport)}
              >
                ₹ {data.paid}
                {data.paidDate !== "-" && (
                  <span className="block text-xs text-gray-500">
                    {data.paidDate}
                  </span>
                )}
              </div>

              {/* Pending */}
              <div className="text-center text-red-600 font-semibold">
                ₹ {data.pending}
              </div>

              {/* Reason */}
              <div className="text-center">
                {data.reason ? (
                  <span className="bg-yellow-100 text-yellow-700 text-xs px-2 py-1 rounded">
                    {data.reason}
                  </span>
                ) : (
                  "-"
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL */}
      {showEditModal && (
        <ModalForm
          title="Update Payment"
          data={editData}
          setData={setEditData}
          onSave={updatePayment}
          onClose={() => setShowEditModal(false)}
        />
      )}
    </div>
  );
};

const StatCard = ({ title, value }) => (
  <div className="bg-black text-white p-4 rounded-lg">
    <h3 className="text-sm">{title}</h3>
    <p className="text-xl font-bold text-orange-500 mt-2">{value}</p>
  </div>
);

const ModalForm = ({ title, data, setData, onSave, onClose }) => (
  <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
    <div className="bg-white p-6 rounded-xl w-[90%] sm:w-96 space-y-4">
      <h2 className="font-semibold">{title}</h2>

      <input
        type="number"
        className="border w-full p-2 rounded"
        placeholder="Total Fee"
        value={data.totalFee}
        onChange={(e) => setData({ ...data, totalFee: e.target.value })}
      />

      <input
        type="number"
        className="border w-full p-2 rounded"
        placeholder="Paid Amount"
        value={data.paidAmount}
        onChange={(e) => setData({ ...data, paidAmount: e.target.value })}
      />

      <input
        type="date"
        className="border w-full p-2 rounded"
        placeholder="Paid Date"
        value={data.paidDate}
        onChange={(e) => setData({ ...data, paidDate: e.target.value })}
      />
      {data.feeWaived && (
        <input
          type="text"
          className="border w-full p-2 rounded"
          placeholder="Reason (Medical Leave / Vacation)"
          value={data.waiveReason}
          onChange={(e) => setData({ ...data, waiveReason: e.target.value })}
        />
      )}
      <div className="flex justify-end gap-3">
        <button onClick={onClose}>Cancel</button>
        <button
          onClick={onSave}
          className="bg-orange-500 text-white px-4 py-2 rounded"
        >
          Save
        </button>
        <button
          onClick={() =>
            setData({
              ...data,
              feeWaived: true,
              totalFee: 0,
              paidAmount: 0,
            })
          }
          className="bg-gray-200 px-3 py-1 rounded"
        >
          Waive Fee
        </button>
      </div>
    </div>
  </div>
);

export default FeesDetailsPage;
