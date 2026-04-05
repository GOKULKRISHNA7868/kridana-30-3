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
import { useEffect } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
export default function Plans() {
  const navigate = useNavigate();
  const [billing, setBilling] = useState("monthly");
  const [role, setRole] = useState(null);
  const [loadingPlan, setLoadingPlan] = useState(null);

  useEffect(() => {
    const fetchRole = async () => {
      const user = auth.currentUser;
      if (!user) return;

      const trainerSnap = await getDoc(doc(db, "trainers", user.uid));
      const instituteSnap = await getDoc(doc(db, "institutes", user.uid));

      if (trainerSnap.exists()) setRole("trainer");
      else if (instituteSnap.exists()) setRole("institute");
    };

    fetchRole();
  }, []);

  useEffect(() => {
    const authInstance = getAuth();

    const unsubscribe = onAuthStateChanged(authInstance, async (user) => {
      if (!user) return;

      try {
        const trainerSnap = await getDoc(doc(db, "trainers", user.uid));
        const instituteSnap = await getDoc(doc(db, "institutes", user.uid));

        if (trainerSnap.exists()) setRole("trainer");
        else if (instituteSnap.exists()) setRole("institute");
      } catch (err) {
        console.error("Error fetching role:", err);
      }
    });

    return () => unsubscribe();
  }, []);
  const startPaidSubscription = async (planType, amount) => {
    const user = auth.currentUser;
    if (!user) {
      alert("Please login first");
      return;
    }

    try {
      setLoadingPlan(planType); // 🔥 START LOADING

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

      form.submit(); // 🚀 redirect happens here
    } catch (err) {
      console.error(err);
      alert("Payment failed");
      setLoadingPlan(null); // ❌ stop loading if error
    }
  };
  return (
    <div className="min-h-screen bg-white flex flex-col items-center py-16">
      <h1 className="text-3xl font-bold mb-2">Get Started</h1>
      <p className="text-gray-500 mb-6">
        Start for free, pick a plan later. Ready to be part of the future
      </p>

      <p className="text-lg font-semibold text-lime-500">
        Limited Offer (First 1000 Businesses Only)
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
      <div className="flex justify-center w-full px-6">
        {/* FREE */}

        {/* TRAINER */}
        {role === "trainer" && (
          <div className="bg-gray-900 text-white rounded-xl p-8 relative flex flex-col justify-between">
            <span className="absolute top-3 right-3 bg-lime-400 text-black text-xs px-2 py-1 rounded">
              50% OFF
            </span>

            <h2 className="text-xl font-bold mb-2">
              {billing === "monthly" ? "₹ 199/-" : "₹ 4,790 / Year"}
            </h2>
            <p className="text-lime-400 font-semibold mb-4">Trainer’s Plan</p>

            <ul className="space-y-2 text-sm">
              <li>✔ 24×7 Advertising</li>
              <li>✔ Fee Collection & Alerts</li>
              <li>✔ Customer Attendance Tracking</li>
              <li>✔ Performance Tracking</li>
              <li>✔ Revenue Tracking</li>
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
        )}

        {/* INSTITUTE */}
        {role === "institute" && (
          <div className="bg-gray-900 text-white rounded-xl p-8 relative flex flex-col justify-between">
            <span className="absolute top-3 right-3 bg-lime-400 text-black text-xs px-2 py-1 rounded">
              50% OFF
            </span>

            <h2 className="text-xl font-bold mb-2 flex items-center gap-2">
              <span className="text-white">
                ₹ {billing === "monthly" ? "499" : "5,994 / Year"}
              </span>

              <span className="line-through text-gray-400 text-sm">
                ₹ {billing === "monthly" ? "999/-" : "11,988 / Year"}
              </span>
            </h2>
            <p className="text-lime-400 font-semibold mb-4">Institutes Plan</p>

            <ul className="space-y-2 text-sm">
              <li>✔ 24×7 Advertising (Enhanced)</li>
              <li>✔ Fee Collection & Alerts</li>
              <li>✔ Customer Attendance Tracking</li>
              <li>✔ Performance Tracking (Advanced)</li>
              <li>✔ Revenue Tracking (Advanced)</li>
              <li>✔ Salary Management</li>
              <li>✔ Staff Attendance</li>
              <li>✔ Bookings</li>
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
        )}
      </div>
    </div>
  );
}
