import React, { useState } from "react";
import { db } from "../firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

const Feedback = () => {
  const [form, setForm] = useState({
    name: "",
    phone: "",
    summary: "",
    message: "",
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  /* ================= INPUT HANDLER ================= */

  const handleChange = (e) => {
    const { name, value } = e.target;

    // Full name: allow only letters and spaces
if (name === "name") {
  let filtered = value
    .replace(/[^A-Za-z.\s]/g, "") // ✅ allow dot
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase()); // capitalize words

  setForm((prev) => ({ ...prev, name: filtered }));
  return;
}

    // Phone: allow only digits and max 10
    if (name === "phone") {
      const filtered = value.replace(/\D/g, "").slice(0, 10);
      setForm((prev) => ({ ...prev, phone: filtered }));
      return;
    }

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  /* ================= SUBMIT ================= */

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.name || !form.phone || !form.summary) {
      alert("Please fill required fields");
      return;
    }

    if (form.phone.length !== 10) {
      alert("Contact number must be exactly 10 digits");
      return;
    }

    try {
      setLoading(true);

      await addDoc(collection(db, "feedbacks"), {
        ...form,
        createdAt: serverTimestamp(),
      });

      setSuccess(true);

      setForm({
        name: "",
        phone: "",
        summary: "",
        message: "",
      });

      setTimeout(() => {
        setSuccess(false);
      }, 4000);
    } catch (error) {
      console.error("Feedback error:", error);
      alert("Something went wrong. Try again.");
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#E7B89E] px-4 py-12">
      <div className="w-full max-w-4xl">
        {/* TITLE */}
        <h1 className="text-3xl md:text-4xl font-bold text-center mb-3">
          We Value Your Feedback
        </h1>

        <p className="text-center text-gray-800 mb-8 text-sm md:text-base">
          Tell us about your experience so we can improve our services.
        </p>

        {/* FORM CARD */}
        <div className="bg-white rounded-xl p-6 md:p-10 shadow-lg">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* NAME + PHONE */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* FULL NAME */}
              <div>
                <label className="font-medium text-sm">Full Name*</label>

                <input
                  type="text"
                  name="name"
                  required
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Enter your name"
                  className="w-full mt-2 border border-orange-400 rounded-lg px-4 py-2 
                  focus:outline-none focus:ring-1 focus:ring-orange-400"
                />
              </div>

              {/* CONTACT */}
              <div>
                <label className="font-medium text-sm">Contact Number*</label>

                <input
                  type="tel"
                  name="phone"
                  required
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="10 digit number"
                  maxLength={10}
                  className="w-full mt-2 border border-orange-400 rounded-lg px-4 py-2 
                  focus:outline-none focus:ring-1 focus:ring-orange-400"
                />
              </div>
            </div>

            {/* SUMMARY */}
            <div>
              <label className="font-medium text-sm">Feedback Summary*</label>

              <input
                type="text"
                name="summary"
                required
                value={form.summary}
                onChange={handleChange}
                className="w-full mt-2 border border-orange-400 rounded-lg px-4 py-2 
                focus:outline-none focus:ring-1 focus:ring-orange-400"
              />
            </div>

            {/* MESSAGE */}
            <div>
              <label className="font-medium text-sm">
                Detailed Feedback / Message
              </label>

              <textarea
                rows="5"
                name="message"
                value={form.message}
                onChange={handleChange}
                className="w-full mt-2 border border-orange-400 rounded-lg px-4 py-2 resize-none
                focus:outline-none focus:ring-1 focus:ring-orange-400"
              />
            </div>

            {/* BUTTON */}
            <div className="flex justify-center pt-2">
              <button
                type="submit"
                disabled={loading}
                className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-2 rounded-lg shadow-md transition disabled:opacity-60"
              >
                {loading ? "Submitting..." : "Submit Feedback"}
              </button>
            </div>
            {success && (
              <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
                <div className="bg-white rounded-xl p-6 w-[90%] max-w-sm text-center shadow-lg">
                  <h2 className="text-xl font-semibold text-green-600 mb-3">
                    Feedback Submitted
                  </h2>

                  <p className="text-gray-700 mb-5">
                    Thank you for sharing your feedback with us.
                  </p>

                  <button
                    onClick={() => setSuccess(false)}
                    className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-lg"
                  >
                    OK
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default Feedback;
