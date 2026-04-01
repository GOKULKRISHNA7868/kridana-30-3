import React, { useEffect, useState } from "react";
import { db } from "../../firebase"; // adjust path
import { doc, setDoc, getDoc } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const RazorpayKYC = () => {
  const auth = getAuth();
  const uid = auth.currentUser?.uid;

  const [form, setForm] = useState({
    accountName: "",
    accountEmail: "",
    businessName: "",
    businessType: "",
    profession: "",
    ifsc: "",
    accountNumber: "",
    confirmAccountNumber: "",
    beneficiaryName: "",
  });

  const [submitted, setSubmitted] = useState(false);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);

  // 🔥 FETCH KYC
  useEffect(() => {
    const fetchKYC = async () => {
      if (!uid) return;

      try {
        const ref = doc(db, "institutes", uid, "Kyc", "details");
        const snap = await getDoc(ref);

        if (snap.exists()) {
          setForm(snap.data());
          setSubmitted(true);
        }
      } catch (err) {
        console.error(err);
      }

      setLoading(false); // ✅ always stop loading
    };

    fetchKYC();
  }, [uid]);

  // 🔥 HANDLE INPUT
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // 🔥 SUBMIT
  const handleSubmit = async () => {
    if (!uid) return;

    if (form.accountNumber !== form.confirmAccountNumber) {
      alert("Account numbers do not match");
      return;
    }

    try {
      const ref = doc(db, "institutes", uid, "Kyc", "details");

      await setDoc(ref, {
        ...form,
        updatedAt: new Date(),
      });

      setSubmitted(true);
      setEditing(false);

      alert("✅ KYC Completed Successfully");
    } catch (err) {
      console.error(err);
      alert("❌ Error saving KYC");
    }
  };

  // 🔥 LOADING
  if (loading) {
    return <div className="p-10 text-center">Loading...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white shadow-2xl rounded-2xl p-8">
        <h2 className="text-3xl font-bold text-center mb-6">
          Razorpay KYC Details
        </h2>

        {/* ✅ SUCCESS VIEW */}
        {submitted && !editing ? (
          <>
            <div className="bg-green-100 text-green-700 p-4 rounded-lg text-center mb-6">
              ✅ KYC Completed Successfully
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              {Object.entries(form).map(([key, value]) => {
                let displayValue = value;

                // ✅ FIX TIMESTAMP ERROR
                if (value && value.seconds) {
                  displayValue = new Date(
                    value.seconds * 1000,
                  ).toLocaleString();
                }

                return (
                  <p key={key} className="break-all">
                    <strong className="capitalize">{key}:</strong>{" "}
                    {String(displayValue)}
                  </p>
                );
              })}
            </div>

            <button
              onClick={() => setEditing(true)}
              className="mt-8 w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-semibold"
            >
              Edit Details
            </button>
          </>
        ) : (
          <>
            {/* ✅ FORM */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                name="accountName"
                placeholder="Account Name"
                value={form.accountName}
                onChange={handleChange}
                className="input"
              />

              <input
                name="accountEmail"
                placeholder="Account Email"
                value={form.accountEmail}
                onChange={handleChange}
                className="input"
              />

              <input
                name="businessName"
                placeholder="Business Name"
                value={form.businessName}
                onChange={handleChange}
                className="input"
              />

              <input
                name="businessType"
                placeholder="Business Type"
                value={form.businessType}
                onChange={handleChange}
                className="input"
              />

              <input
                name="profession"
                placeholder="Profession"
                value={form.profession}
                onChange={handleChange}
                className="input"
              />

              <input
                name="ifsc"
                placeholder="IFSC Code"
                value={form.ifsc}
                onChange={handleChange}
                className="input"
              />

              <input
                name="accountNumber"
                placeholder="Account Number"
                value={form.accountNumber}
                onChange={handleChange}
                className="input"
              />

              <input
                name="confirmAccountNumber"
                placeholder="Re-enter Account Number"
                value={form.confirmAccountNumber}
                onChange={handleChange}
                className="input"
              />

              <input
                name="beneficiaryName"
                placeholder="Beneficiary Name"
                value={form.beneficiaryName}
                onChange={handleChange}
                className="input"
              />
            </div>

            <button
              onClick={handleSubmit}
              className="mt-8 w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-semibold"
            >
              Submit KYC
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default RazorpayKYC;
