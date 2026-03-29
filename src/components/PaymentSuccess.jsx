import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { auth, db } from "../firebase";
import {
  doc,
  getDoc,
  setDoc,
  Timestamp,
  serverTimestamp,
} from "firebase/firestore";

export default function SubscriptionSuccessPage() {
  const { search } = useLocation();
  const navigate = useNavigate();
  const params = new URLSearchParams(search);

  const [data, setData] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  /* ===============================
     Read payment params
     =============================== */
  useEffect(() => {
    const obj = {};
    for (let [key, value] of params.entries()) {
      obj[key] = value;
    }
    setData(obj);
    setLoading(false);
  }, [search]);

  /* ===============================
     SUBMIT → SAVE TO FIREBASE
     =============================== */
  const submitSubscription = async () => {
    if (submitting) return;

    if (data.order_status !== "Success") {
      alert("❌ Payment not successful");
      return;
    }

    const user = auth.currentUser;
    if (!user) {
      alert("❌ Login required");
      return;
    }

    setSubmitting(true);

    /* 🔍 Detect role */
    const trainerSnap = await getDoc(doc(db, "trainers", user.uid));
    const instituteSnap = await getDoc(doc(db, "institutes", user.uid));

    let role = "user";
    if (trainerSnap.exists()) role = "trainer";
    if (instituteSnap.exists()) role = "institute";

    /* 🧮 Dates */
    const startDate = Timestamp.now();
    const durationDays = 30; // monthly
    const endDate = Timestamp.fromDate(
      new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000),
    );

    /* 📦 Firestore structure (SAME AS FREE TRIAL FORMAT) */
    const planRef = doc(db, "plans", user.uid);

    await setDoc(planRef, {
      role,
      freeTrialUsed: true,

      currentPlan: {
        planType: data.planType || "PAID",
        startDate,
        endDate,
        status: "active",

        payment: {
          order_id: data.order_id,
          tracking_id: data.tracking_id,
          amount: data.amount,
          status: data.order_status,
          payment_mode: data.payment_mode,
          bank_ref_no: data.bank_ref_no,
          billing_name: data.billing_name,
          billing_email: data.billing_email,
        },
      },

      history: [
        {
          planType: data.planType || "PAID",
          startDate,
          endDate,

          payment: {
            order_id: data.order_id,
            tracking_id: data.tracking_id,
            amount: data.amount,
            status: data.order_status,
            payment_mode: data.payment_mode,
          },
        },
      ],

      createdAt: serverTimestamp(),
    });

    alert("✅ Subscription Activated & Saved");

    /* ✅ Redirect by role */
    if (role === "trainer") {
      navigate("/trainers/dashboard", { replace: true });
    } else if (role === "institute") {
      navigate("/institutes/dashboard", { replace: true });
    } else {
      navigate("/dashboard", { replace: true });
    }
  };

  if (loading) return <div style={{ padding: 40 }}>Loading...</div>;

  return (
    <div style={{ padding: 40, maxWidth: 800, margin: "auto" }}>
      <h1>✅ Payment Successful</h1>

      {/* ================= Payment Details ================= */}
      <h3 style={{ marginTop: 20 }}>Payment Details</h3>
      <p>
        <b>Order ID:</b> {data.order_id}
      </p>
      <p>
        <b>Tracking ID:</b> {data.tracking_id}
      </p>
      <p>
        <b>Amount:</b> ₹{data.amount}
      </p>
      <p>
        <b>Status:</b> {data.order_status}
      </p>
      <p>
        <b>Payment Mode:</b> {data.payment_mode}
      </p>
      <p>
        <b>Bank Ref No:</b> {data.bank_ref_no}
      </p>
      <p>
        <b>Billing Name:</b> {data.billing_name}
      </p>
      <p>
        <b>Email:</b> {data.billing_email}
      </p>

      <hr style={{ margin: "20px 0" }} />

      {/* ================= Subscription Details ================= */}
      <h3>Subscription Details</h3>
      <p>
        <b>Plan:</b> {data.planType || "PAID"}
      </p>
      <p>
        <b>Start Date:</b> {new Date().toLocaleString()}
      </p>
      <p>
        <b>End Date:</b>{" "}
        {new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleString()}
      </p>

      {/* ================= SUBMIT BUTTON ================= */}
      <button
        onClick={submitSubscription}
        disabled={submitting}
        style={{
          marginTop: 30,
          padding: "14px",
          background: "#22c55e",
          color: "#000",
          borderRadius: 6,
          fontWeight: "bold",
          width: "100%",
          cursor: submitting ? "not-allowed" : "pointer",
        }}
      >
        {submitting
          ? "Saving Subscription..."
          : "✅ Submit & Activate Subscription"}
      </button>
    </div>
  );
}
