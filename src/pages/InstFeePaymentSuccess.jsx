import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { db, auth } from "../firebase"; // adjust path
import {
  collection,
  addDoc,
  doc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";
import { getDoc } from "firebase/firestore";
const FeePaymentSuccess = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  if (!state) {
    return <div className="p-8">No Data Found</div>;
  }

  const handleSubmit = async () => {
    try {
      setLoading(true);

      const loginUid = auth.currentUser?.uid;

      if (!loginUid) {
        alert("User not logged in");
        return;
      }

      // ✅ 1. Fetch student data
      const studentRef = doc(db, "students", loginUid);
      const studentSnap = await getDoc(studentRef);

      if (!studentSnap.exists()) {
        alert("Student data not found ❌");
        return;
      }

      const studentData = studentSnap.data();

      const instituteId = studentData.instituteId || "";

      console.log("🏫 Institute ID:", instituteId);

      // ✅ 2. Save in institutepaymenthistory
      const instituteRef = collection(
        db,
        "instituepaymenthistory",
        loginUid,
        "payments",
      );

      await addDoc(instituteRef, {
        studentName: state.studentName || "",
        studentId: loginUid,
        instituteId: instituteId,
        month: state.month || "",
        totalAmount: state.totalAmount || 0,
        paymentId: state.paymentId || "",
        orderId: state.orderId || "",
        status: state.status || "paid",
        items: state.items || [],
        date: state.date || "",
        time: state.time || "",
        createdAt: serverTimestamp(),
      });

      // ✅ 3. Save in studentFees
      for (const item of state.items) {
        await addDoc(collection(db, "studentFees"), {
          category: item.category || "",
          subCategory: item.subCategory || "",
          createdAt: serverTimestamp(),
          feeWaived: false,
          instituteId: instituteId, // ✅ FROM STUDENT DOC
          month: state.month || "",
          paidAmount: item.amount || 0,
          paidDate: state.date || "",
          studentId: loginUid,
          totalAmount: item.totalAmount || item.amount || 0,
          waiveReason: "",
        });
      }

      alert("Payment saved successfully ✅");

      navigate("/dashboard");
    } catch (err) {
      console.error("❌ SAVE ERROR:", err);
      alert("Failed to save payment");
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="min-h-screen bg-gray-100 flex justify-center items-center p-6">
      <div className="bg-white shadow-lg rounded-xl p-6 w-full max-w-lg">
        <h1 className="text-2xl font-bold text-green-600 mb-4">
          Payment Successful ✅
        </h1>

        <div className="space-y-2 text-sm">
          <p>
            <b>Student:</b> {state.studentName}
          </p>
          <p>
            <b>Month:</b> {state.month}
          </p>
          <p>
            <b>Status:</b> {state.status}
          </p>

          <p className="text-lg font-semibold mt-3">
            Total Amount: ₹{state.totalAmount}
          </p>

          <hr className="my-3" />

          <p>
            <b>Payment ID:</b> {state.paymentId}
          </p>
          <p>
            <b>Order ID:</b> {state.orderId}
          </p>

          <p>
            <b>Date:</b> {state.date}
          </p>
          <p>
            <b>Time:</b> {state.time}
          </p>

          <hr className="my-3" />

          <h3 className="font-semibold">Items Paid:</h3>

          {state.items.map((item, i) => (
            <div key={i} className="flex justify-between">
              <p>
                {item.category} - {item.subCategory}
              </p>
              <p>₹{item.amount}</p>
            </div>
          ))}
        </div>

        {/* ✅ SUBMIT BUTTON */}
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="mt-6 w-full bg-green-600 text-white py-2 rounded"
        >
          {loading ? "Saving..." : "Submit & Save"}
        </button>
      </div>
    </div>
  );
};

export default FeePaymentSuccess;
