import React, { useState } from "react";
import { useLocation } from "react-router-dom";
import { db, auth } from "../firebase";
import {
  collection,
  doc,
  setDoc,
  addDoc,
  serverTimestamp,
  getDoc,
} from "firebase/firestore";

const PaymentSuccess = () => {
  const { state } = useLocation();
  const [saving, setSaving] = useState(false);

  if (!state) return <div>No Data</div>;

  const handleSubmit = async () => {
    try {
      setSaving(true);

      const user = auth.currentUser;
      if (!user) {
        alert("User not logged in");
        return;
      }

      const loginUid = user.uid;

      // 🔥 GET STUDENT DOC
      const studentRef = doc(db, "trainerstudents", state.studentId);
      const studentSnap = await getDoc(studentRef);

      if (!studentSnap.exists()) {
        alert("Student not found");
        return;
      }

      const studentData = studentSnap.data();

      // ✅ CORRECT TRAINER ID
      const trainerId = studentData.trainerId || "";

      // =========================
      // LOOP ITEMS
      // =========================
      for (const item of state.items) {
        const data = {
          category: item.category || "",
          subCategory: item.subCategory || "",

          studentId: state.studentId || "",
          trainerId: trainerId, // ✅ FIXED

          month: state.month || "",

          paidAmount: item.amount || 0,
          totalAmount: state.totalAmount || 0,

          feeWaived: false,
          waiveReason: "",

          paidDate: new Date().toISOString().split("T")[0],

          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        };

        // =========================
        // 1️⃣ feepayments
        // =========================
        const userRef = doc(
          db,
          "feepayments",
          loginUid,
          "payments",
          `${state.month}_${item.category}_${item.subCategory}`,
        );

        await setDoc(userRef, data);

        // =========================
        // 2️⃣ institutesFees
        // =========================
        await addDoc(collection(db, "institutesFees"), data);
      }

      alert("✅ Payment saved successfully!");
    } catch (err) {
      console.error("❌ SAVE ERROR:", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-10 bg-white min-h-screen">
      <h1 className="text-2xl font-bold text-green-600 mb-6">
        ✅ Payment Successful
      </h1>

      <div className="border p-5 rounded shadow-md max-w-lg">
        <p>
          <strong>Student ID:</strong> {state.studentId}
        </p>
        <p>
          <strong>Month:</strong> {state.month}
        </p>
        <p>
          <strong>Total Amount:</strong> ₹{state.totalAmount}
        </p>

        <p>
          <strong>Payment ID:</strong> {state.razorpay_payment_id}
        </p>
        <p>
          <strong>Status:</strong> {state.status}
        </p>

        <hr className="my-3" />

        <h3 className="font-semibold">Items Paid:</h3>
        {state.items.map((item, i) => (
          <div key={i} className="text-sm">
            {item.category} - {item.subCategory} : ₹{item.amount}
          </div>
        ))}

        <hr className="my-3" />

        {/* ✅ SUBMIT BUTTON */}
        <button
          onClick={handleSubmit}
          disabled={saving}
          className="mt-4 bg-green-600 text-white px-4 py-2 rounded"
        >
          {saving ? "Saving..." : "Submit"}
        </button>
      </div>
    </div>
  );
};

export default PaymentSuccess;
