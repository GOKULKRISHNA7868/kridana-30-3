import React, { useState } from "react";
import { auth, db } from "../firebase";
import {
  doc,
  getDoc,
  setDoc,
  Timestamp,
  serverTimestamp,
} from "firebase/firestore";
import { useNavigate } from "react-router-dom";

export default function Plans() {
  const navigate = useNavigate();
  const [billing, setBilling] = useState("monthly");

  const startFreeTrial = async () => {
    const user = auth.currentUser;
    if (!user) return;

    // 🔍 Detect role securely
    const trainerSnap = await getDoc(doc(db, "trainers", user.uid));
    const instituteSnap = await getDoc(doc(db, "institutes", user.uid));

    let role = null;
    if (trainerSnap.exists()) role = "trainer";
    if (instituteSnap.exists()) role = "institute";

    const planRef = doc(db, "plans", user.uid);
    const snap = await getDoc(planRef);

    if (snap.exists() && snap.data().freeTrialUsed) {
      alert("❌ Free Trial already used");
      return;
    }

    const startDate = Timestamp.now();
    const endDate = Timestamp.fromDate(
      new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    );

    await setDoc(planRef, {
      role,
      freeTrialUsed: true,
      currentPlan: {
        planType: "FREE",
        startDate,
        endDate,
        status: "active",
      },
      history: [
        {
          planType: "FREE",
          startDate,
          endDate,
        },
      ],
      createdAt: serverTimestamp(),
    });

    alert("✅ Free Trial Activated");

    // ✅ DIRECT DASHBOARD NAVIGATION (NO BACK)
    if (role === "trainer") {
      navigate("/trainers/dashboard", { replace: true });
    } else if (role === "institute") {
      navigate("/institutes/dashboard", { replace: true });
    }
  };
  const startPaidSubscription = async (planType, amount) => {
    const user = auth.currentUser;
    if (!user) {
      alert("Please login first");
      return;
    }

    const res = await fetch(
      "https://backendpaymentserver.onrender.com/api/create-order",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount,
          planType,
          uid: user.uid,
          email: user.email,
        }),
      },
    );

    const data = await res.json();

    const CCAVENUE_URL =
      "https://secure.ccavenue.com/transaction/transaction.do?command=initiateTransaction";

    const form = document.createElement("form");
    form.method = "POST";
    form.action = CCAVENUE_URL;

    const encInput = document.createElement("input");
    encInput.type = "hidden";
    encInput.name = "encRequest";
    encInput.value = data.encRequest;

    const accInput = document.createElement("input");
    accInput.type = "hidden";
    accInput.name = "access_code";
    accInput.value = data.access_code;

    form.appendChild(encInput);
    form.appendChild(accInput);
    document.body.appendChild(form);

    form.submit();
  };
  return (
    <div className="min-h-screen bg-white flex flex-col items-center py-16">
      <h1 className="text-3xl font-bold mb-2">Get Started</h1>
      <p className="text-gray-500 mb-6">
        Start for free, pick a plan later. Ready to be part of the future
      </p>

      {/* Toggle */}
      <div className="flex border rounded-full mb-10 overflow-hidden">
        <button
          onClick={() => setBilling("monthly")}
          className={`px-6 py-2 ${
            billing === "monthly" ? "bg-orange-500 text-black" : "bg-white"
          }`}
        >
          Monthly Plan
        </button>
        <button
          onClick={() => setBilling("annual")}
          className={`px-6 py-2 ${
            billing === "annual" ? "bg-orange-500 text-black" : "bg-white"
          }`}
        >
          Annual Plan
        </button>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl w-full px-6">
        {/* FREE */}
       <div className="bg-gray-900 text-white rounded-xl p-8 relative flex flex-col justify-between">
          <h2 className="text-xl font-bold mb-2">₹ 0/-</h2>
          <p className="text-lime-400 font-semibold mb-4">FREE (1 Month)</p>

          <ul className="space-y-2 text-sm">
            <li>✔ Trainer & Institutes</li>
            <li>✔ Attendance Tracking</li>
            <li>✔ Fees Payment Tracking</li>
            <li>✔ Reports Generator</li>
          </ul>

          <button
            onClick={startFreeTrial}
            className="mt-6 w-full bg-lime-400 text-black py-2 rounded font-semibold"
          >
            Subscribe
          </button>
        </div>

        {/* TRAINER */}
      <div className="bg-gray-900 text-white rounded-xl p-8 relative flex flex-col justify-between">
          <span className="absolute top-3 right-3 bg-lime-400 text-black text-xs px-2 py-1 rounded">
            20% OFF
          </span>

          <h2 className="text-xl font-bold mb-2">
            {billing === "monthly" ? "₹ 299/-" : "₹ 4,790 / Year"}
          </h2>
          <p className="text-lime-400 font-semibold mb-4">Trainer’s Plan</p>

          <ul className="space-y-2 text-sm">
            <li>✔ Attendance Tracking</li>
            <li>✔ Fees Payment Tracking</li>
            <li>✔ Reports Generator</li>
            <li>✔ 01 Free Ad Per Year</li>
          </ul>

          <button
            onClick={() =>
              startPaidSubscription(
                "TRAINER",
                billing === "monthly" ? "299.00" : "4790.00",
              )
            }
            className="mt-6 w-full bg-lime-400 text-black py-2 rounded font-semibold"
          >
            Subscribe
          </button>
        </div>

        {/* INSTITUTE */}
      <div className="bg-gray-900 text-white rounded-xl p-8 relative flex flex-col justify-between">
          <span className="absolute top-3 right-3 bg-lime-400 text-black text-xs px-2 py-1 rounded">
            20% OFF
          </span>

          <h2 className="text-xl font-bold mb-2">
            {billing === "monthly" ? "₹ 999/-" : "₹ 9,590 / Year"}
          </h2>
          <p className="text-lime-400 font-semibold mb-4">Institutes Plan</p>

          <ul className="space-y-2 text-sm">
            <li>✔ Trainers Management Attendance</li>
            <li>✔ Institute Workforce Attendance</li>
            <li>✔ Salary Tracking</li>
            <li>✔ Reports</li>
            <li>✔ 03 Ads Free Per Year</li>
          </ul>

          <button
            onClick={() =>
              startPaidSubscription(
                "INSTITUTE",
                billing === "monthly" ? "999.00" : "9590.00",
              )
            }
            className="mt-6 w-full bg-lime-400 text-black py-2 rounded font-semibold"
          >
            Subscribe
          </button>
        </div>
      </div>
    </div>
  );
}